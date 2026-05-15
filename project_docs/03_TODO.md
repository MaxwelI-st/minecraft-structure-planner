# 🏗️ Minecraft Structure Planner — 実装ロードマップ v2.1

> **AI Context**: このファイルは「次に何を実装すべきか」を迷いなく判断するための航海図です。各タスクは「何を作るか」ではなく「どう作るか」まで記述しています。実装前に必ず `02_TECHNICAL_REFERENCE.md` のチェックリストを確認すること。

---

## 🎯 North Star（変わらない目的）
「マイクラのデータ構造をハックし、サバイバル建築の苦痛（資材計算・足場・湧き潰し）を全自動で排除する最強の Web コンパイラ」

---

## ✅ 完了済み
- `be_to_je_block_mapping.js` — The Flattening 対応マッピング辞書（初版）
- Three.js r128 ベースの 3D プレビュー（基本動作）
- `.mcstructure` 読み込みと Bedrock NBT パース（`app.js` 内、未モジュール化）

---

## 🔥 Phase 1: Worker 通信基盤 + TypedArray パーサー（最優先 ⭐️⭐️⭐️）

> **ゴール**: 既存の `app.js` モノリスを安全に解体し、Worker 隔離アーキテクチャの骨格を作る。ここが崩れると全フェーズが崩壊する。

### Milestone 1-A: Worker 疎通基盤の構築
- [ ] **`js/main.js` の作成**
  - `app.js` から Worker 管理ロジックのみを抽出。
  - `new Worker(new URL('./workers/process.worker.js', import.meta.url), { type: 'module' })` で Vite 対応 Worker を初期化。
  - `taskId = nanoid()` ベースの Promise ラッパー：`postTask(type, payload, transferList) → Promise<WorkerResponse>` を実装。
  - 受信した `PROGRESS` イベントで進捗バー UI を更新。
- [ ] **`workers/process.worker.js` のスケルトン作成**
  - `self.onmessage` で `WorkerTask` を受信するイベントループ実装。
  - `type` によるディスパッチ（switch 文）。
  - `PROGRESS` 送信ヘルパー関数: `sendProgress(taskId, progress, stage)`.

### Milestone 1-B: NBT ストリームリーダー
- [ ] **`js/modules/stream/nbt-reader.js` の実装**
  - `DataView` ベース。コンストラクタ引数 `littleEndian: boolean`（true=Bedrock）。
  - Bedrock の 8 バイトヘッダー自動ストリップ（`format='bedrock'` 時）。
  - カーソル API: `readByte/Short/Int/Long/String/Tag(offset) → { value, nextOffset }`
  - ジェネレータ `function* walkCompound(buffer, offset, le)` — タグを逐次 yield、値はオプション読み取り。
  - **テスト**: サンプル `.mcstructure` を読み込み、`format_version=1` と `size=[X,Y,Z]` を正しく抽出できること。

### Milestone 1-C: セクション単位ブロックイテレータ
- [ ] **`process.worker.js` 内に `sectionIterator()` ジェネレータを実装**
  - `block_indices` の TAG_List を DataView で直接読み、`16×16×16` セクション単位で `Uint16Array` を yield。
  - セクション処理後は参照を null 代入して GC を促す。
  - 各セクション完了時に `sendProgress` で進捗を報告。

---

## 📤 Phase 2: Litematic 変換出力（コアハック）

> **ゴール**: `.mcstructure` → `.litematic` の完全変換。これが本ツールの存在価値そのもの。

### Milestone 2-A: マッピング Worker の構築
- [ ] **`workers/mapping.worker.js` の実装**
  - `LOAD_MAPPING` タスク受信 → `be_to_je_block_mapping.json` を fetch。
  - `Map<string, JavaBlockState>` を構築：キー = `"blockName|state1=val1,state2=val2"` (state キー昇順ソート)。
  - `MAPPING_READY` レスポンスで Map の準備完了を通知（Map 自体は structuredClone で移譲不可なため Worker 内保持）。
- [ ] **`js/modules/mapping/be-to-je.js` の実装**
  - `bedrockToJava(name, states, mappingMap) → { Name, Properties }` 関数。
  - `mappingMap.get(key) ?? { Name: 'minecraft:stone', Properties: {} }` のフォールバック。
  - 変換失敗時は `warnings[]` に記録（後でユーザーに表示）。

### Milestone 2-B: Big-Endian NBT ライター
- [ ] **`js/modules/stream/nbt-writer.js` の実装**
  - サポートタグ: TAG_Compound, TAG_List, TAG_LongArray, TAG_String, TAG_Int, TAG_Byte, TAG_Short, TAG_Long.
  - `BigInt` で Long 値を処理（53bit 精度問題の回避）。
  - `build() → ArrayBuffer` — 単一の ArrayBuffer を返す。DOM / Node.js 依存なし。
  - **テスト**: `TAG_Int('x', 42)` を書き出し、nbt-reader.js で読み返してラウンドトリップ確認。

### Milestone 2-C: Litematic ビットパック
- [ ] **`js/modules/logic/bitpack.js` の実装**
  - `packBlockStates(indices: number[], paletteSize: number) → BigInt64Array`
  - `unpackBlockStates(longs: BigInt64Array, total: number, paletteSize: number) → Uint16Array`
  - **1.16+ no-wrap ルール厳守**: `entriesPerLong = Math.floor(64 / bitsPerEntry)` のみ。
  - **ラウンドトリップテスト**: palette=256（8bit）, 65536 インデックス, 完全一致確認。

### Milestone 2-D: Litematic NBT 構造の組み立て
- [ ] **`process.worker.js` の `CONVERT_LITEMATIC` ハンドラー実装**
  - Phase 1 のセクションイテレータでブロックを読み込む。
  - 各ブロックをマッピング Worker から取得した Map で Java BlockState に変換。
  - 変換済みパレット + ブロックインデックス → `bitpack.js` で LongArray 生成。
  - `nbt-writer.js` で Litematic NBT ツリーを構築（Regions > RegionName > BlockStatePalette + BlockStates）。
  - `pako.gzip(nbtBuffer)` で GZip 圧縮 → `COMPLETE` で Transferable 移譲。

### Milestone 2-E: Litematic 出力の UI 接続
- [ ] **ダウンロードボタンの実装**
  - `Blob([gzippedBuffer], { type: 'application/octet-stream' })` → `URL.createObjectURL` → `<a download>`.
  - ファイル名に `/\s/` が含まれる場合はアンダースコアに置換してから出力。

---

## 🧠 Phase 3: サバイバル自動化エンジン

> **ゴール**: マイクラの物理法則をコードに落とし込む。これが「ただのビューア」との差別化。

### Milestone 3-A: 足場（Scaffolding）最適化エンジン
- [ ] **`js/modules/logic/scaffold.js` の実装**
  - `computeStandingPositions(targetBlocks) → Map<Coord3D, Set<Coord3D>>` — 各ターゲットブロックから到達可能な立ち位置（ユークリッド距離 ≤ 4.5）を計算。
  - `generateScaffold(standingMap, groundY) → Set<Coord3D>` — 垂直支柱 + 水平 6 ブロック以内のブランチを生成。
  - 到達不能ゾーンの検出と補強支柱の自動追加。
  - 出力: 足場ブロック座標セット + 推奨設置順序配列。

### Milestone 3-B: ハリボテ化（中抜き）最適化
- [ ] **`js/modules/logic/invert.js` に `hollowOut()` を追加**
  - 全 6 面が不透明ブロックに囲まれたブロックを安価なブロック（`minecraft:dirt`）に置換。
  - 置換前後の素材コスト差分レポートを生成。

### Milestone 3-C: 湧き潰し漏れ検出
- [ ] **`render/scene.js` に光レベルシェーダーを追加**
  - 光レベル 0 の床面を赤く点滅させる Three.js ShaderMaterial。
  - `light-patch.js` と連携し、隠し光源候補を自動マーキング。

---

## 📦 Phase 4: 物流計算

### Milestone 4-A: 素材・クラフトツリー計算
- [ ] **`js/modules/logic/crafting-tree.js` の実装**
  - `flattenMaterialList(blocks) → Map<string, number>` — 完成品リストから原材料を逆算。
  - 精錬コスト（燃料量）の計算。
  - 中間素材（階段 → 木材 → 原木）の多段展開。

### Milestone 4-B: シュルカーボックス・パッキング UI
- [ ] 27 スロット × n ボックスの視覚化コンポーネント。
- [ ] スタック数（最大 64）を考慮した最適詰め込みアルゴリズム。

### Milestone 4-C: PWA 対応（スマホ Field Mode）
- [ ] `vite-plugin-pwa` でサービスワーカー設定 → オフライン動作。
- [ ] 施工チェックリスト UI（タップで完了マーク、進捗 % 表示）。

---

## 🎨 Phase 5: クリエイタツール

### Milestone 5-A: 3D モデル → ボクセル変換
- [ ] `.obj` / `.stl` ファイル読み込み（`three/examples/jsm/loaders/`）。
- [ ] バウンディングボックスベースのボクセル化（解像度パラメータ付き）。
- [ ] 変換結果を `.mcstructure` として出力。

### Milestone 5-B: ドット絵支援グリッドオーバーレイ
- [ ] ビューアに 5×5 格子オーバーレイを追加（トグル可）。
- [ ] 基準点マーカー（赤/白）の手動設置機能。

### Milestone 5-C: IKEA 風建築説明書
- [ ] Y 軸スライス画像を連番 PNG として生成。
- [ ] `pdf-lib` で各スライスを 1 ページとして PDF にまとめる。

---

## ⚠️ 地雷原リスト（実装時に必ず再確認）

| 地雷 | 症状 | 回避策 |
| :--- | :--- | :--- |
| Bedrock NBT ヘッダー未処理 | 読み込み時に即クラッシュ / 書き出し後に OderSo が無言でスキップ | read 時に 8 バイトオフセット、write 時にヘッダーを先頭に付与 |
| DataView の `littleEndian` 省略 | Bedrock ファイルの全数値がゴミ値になる（例外なし） | 必ず `true`/`false` を明示 |
| ZYX / YZX 混同 | 構造物がエラーなしで斜めに読み込まれる | Bedrock=`SZ*SY*X+SZ*Y+Z`、Litematic=`y*sz*sx+z*sx+x` |
| `Number` で Long 計算 | 53bit 超で精度欠損、LongArray が静かに壊れる | 必ず `BigInt64Array` + `BigInt` 演算 |
| Litematic ビットパックに ceil 使用 | 「砂嵐バグ」——構造体が砂や岩盤に化ける | `entriesPerLong = Math.floor(...)` のみ |
| Litematic GZip 圧縮忘れ | Litematica がロードを完全拒否（エラーメッセージなし） | `pako.gzip(buffer)` を忘れずに |
| Transferable 移譲後の読み取り | `byteLength === 0` でサイレントに壊れる | 移譲後は必ず null 代入 |
| ファイル名にスペース | OderSo がアドオン側でサイレントスキップ | 出力前に `/\s/g` でバリデーション |
| InstancedMesh 更新忘れ | `setMatrixAt()` 後に画面が更新されない | `mesh.instanceMatrix.needsUpdate = true` |

---
*最終更新: 2026-05-13 (v2.1 — マイルストーン単位の実装ステップへ全面改訂)*
