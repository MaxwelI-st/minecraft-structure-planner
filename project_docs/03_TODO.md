# 🏗️ Minecraft Structure Planner — 実装ロードマップ v2.2

> **AI Context**: このファイルは「次に何を実装すべきか」を迷いなく判断するための航海図です。各タスクは「何を作るか」ではなく「どう作るか」まで記述しています。実装前に必ず `02_TECHNICAL_REFERENCE.md` のチェックリストを確認すること。

---

## 🎯 North Star（変わらない目的）
「マイクラのデータ構造をハックし、サバイバル建築の苦痛（資材計算・足場・湧き潰し）を全自動で排除する最強の Web コンパイラ」

---

## ✅ 完了済み

### Phase 1: Worker 通信基盤 + TypedArray パーサー
- ✅ `js/main.js`(513行) — Worker 管理、Promise ラッパー、進捗 UI
- ✅ `js/workers/process.worker.js`(941行) — PARSE_NBT / CONVERT_LITEMATIC 含む 8 段パイプライン
- ✅ `js/io/nbt-reader.js`(341行) — `NBTParser`/`decompressIfNeeded`/`detectEndian`（Bedrock LE + Java BE）
- ✅ `js/modules/stream/nbt-reader.js`(207行) — ストリーミング `NBTReader`（Litematic 読み込み用）
- ✅ `js/io/worker.js`(271行) — マルチフォーマットパーサー（材料カウント Worker、app.js が使用）

### Phase 2: Litematic 変換出力
- ✅ `js/modules/mapping/be-to-je.js`(644行) — `BeToJeConverter` クラス、`convertPalette()`、waterlogging 対応
- ✅ `js/modules/stream/nbt-writer.js`(204行) — `buildLitematic()`、全タグ対応、Big-Endian
- ✅ `js/modules/logic/bitpack.js`(83行) — `packBlockStates()`/`unpackBlockStates()`/`remapZYXtoYZX()`、no-wrap ルール準拠
- ✅ `js/workers/mapping.worker.js`(126行) — `be_to_je_block_mapping.json` fetch、Map 構築
- ✅ `js/main.js` — `convertToLitematic()`/`mergeAndConvertToLitematic()`/`downloadBuffer()` で UI 接続済み
- ✅ `index.html` — `#convert-litematic-btn`/`#merge-convert-litematic-btn` 存在、テスト通過

### Phase 3/4 ロジック（UI 未接続）
- ✅ `js/modules/logic/scaffold.js`(386行) — `computeStandingPositions()`/`generateScaffold()`/`planScaffolding()`
- ✅ `js/modules/logic/invert.js`(471行) — `invertStructure()`/`hollowOut()`/`applyLightPatch()`
- ✅ `js/modules/logic/merge.js`(281行) — `mergeStructures()`/`computeMergeLayout()`
- ✅ `js/modules/logic/crafting-tree.js`(387行) — `flattenMaterialList()`/`expandCraftingTree()`/`computeShulkerPacking()`/`computeFullMaterialPlan()`

---

## 🔥 Phase 3: サバイバル自動化エンジン — UI 接続（最優先 ⭐️⭐️⭐️）

> **ゴール**: 実装済みのロジック関数を Worker → UI に繋いで実際に使えるようにする。

### Milestone 3-A: 足場（Scaffolding）UI 接続
- [ ] **`js/workers/process.worker.js` に `PLAN_SCAFFOLD` タスクハンドラーを追加**
  - `js/modules/logic/scaffold.js` の `planScaffolding(coords, size)` を呼び出す
  - 結果（足場座標セット + 推奨設置順序）を `COMPLETE` で返す
- [ ] **`js/main.js` に `planScaffold()` 関数を追加**
  - Worker に `PLAN_SCAFFOLD` を投げ、結果を受け取る
  - 足場ブロック数・コストを UI に表示
- [ ] **3D ビューアに足場オーバーレイを追加**
  - `viewer3d.js` に半透明の足場ブロック描画を追加（別色でハイライト）

### Milestone 3-B: ハリボテ化（中抜き）UI 接続
- [ ] **`process.worker.js` に `HOLLOW_OUT` タスクハンドラーを追加**
  - `js/modules/logic/invert.js` の `hollowOut(coords, palette)` を呼び出す
  - 変換前後の素材コスト差分を返す
- [ ] **`js/main.js` に `applyHollowOut()` 関数を追加**
  - 「中抜き変換 + Litematic 再出力」のフローを実装
  - 削減ブロック数・節約コストを toast で表示

### Milestone 3-C: 湧き潰し漏れ検出 UI
- [ ] **`viewer3d.js` に光レベルオーバーレイを追加**
  - `applyLightPatch(coords, palette)` の結果（光レベル 0 座標）を受け取り
  - Three.js の `ShaderMaterial` か `MeshBasicMaterial`(赤) で光レベル 0 床面をハイライト
  - トグルスイッチで表示/非表示切替
- [ ] **`process.worker.js` に `DETECT_LIGHT_PATCH` タスクハンドラーを追加**

---

## 📦 Phase 4: 物流計算 — UI 接続

> **ゴール**: `crafting-tree.js` の実装済み関数を素材一覧 UI に繋げる。

### Milestone 4-A: クラフトツリー UI
- [ ] **`js/main.js` に `computeMaterials()` 関数を追加**
  - `expandCraftingTree(blocks)` で中間素材まで逆算
  - 精錬コスト（燃料量）も含めた原材料リストを生成
- [ ] **素材一覧タブに「原材料展開」トグルを追加**
  - オフ: 現行の最終ブロック一覧
  - オン: 原木・石炭・砂など原材料レベルまで展開したリスト
  - コスト差分（完成ブロック vs 原材料で何スロット違うか）を表示

### Milestone 4-B: シュルカーボックスパッキング UI
- [ ] **`computeShulkerPacking(materials)` の結果を UI に表示**
  - 27 スロット × n ボックスの視覚化コンポーネント（CSS グリッドで実装）
  - 各シュルカーボックス内のアイテム・スタック数を表示
  - 「最小ボックス数：n 個」をサマリー表示
- [ ] **素材一覧タブに「シュルカーパッキング」ボタンを追加**

### Milestone 4-C: PWA 対応（スマホ Field Mode）
- [ ] `vite-plugin-pwa` でサービスワーカー設定 → オフライン動作
- [ ] 施工チェックリスト UI（タップで完了マーク、進捗 % 表示）

---

## 🎨 Phase 5: クリエイタツール

### Milestone 5-A: 3D モデル → ボクセル変換
- [ ] `.obj` / `.stl` ファイル読み込み（`three/examples/jsm/loaders/`）
- [ ] バウンディングボックスベースのボクセル化（解像度パラメータ付き）
- [ ] 変換結果を `.mcstructure` として出力

### Milestone 5-B: ドット絵支援グリッドオーバーレイ
- [ ] ビューアに 5×5 格子オーバーレイを追加（トグル可）
- [ ] 基準点マーカー（赤/白）の手動設置機能

### Milestone 5-C: IKEA 風建築説明書
- [ ] Y 軸スライス画像を連番 PNG として生成
- [ ] `pdf-lib` で各スライスを 1 ページとして PDF にまとめる

---

## ⚠️ 地雷原リスト（実装時に必ず再確認）

| 地雷 | 症状 | 回避策 |
| :--- | :--- | :--- |
| Bedrock NBT ヘッダー未処理 | 読み込み時に即クラッシュ | read 時に 8 バイトオフセット、write 時にヘッダーを先頭に付与 |
| DataView の `littleEndian` 省略 | Bedrock ファイルの全数値がゴミ値（例外なし） | 必ず `true`/`false` を明示 |
| ZYX / YZX 混同 | 構造物がエラーなしで斜めに読み込まれる | Bedrock=`SZ*SY*X+SZ*Y+Z`、Litematic=`y*sz*sx+z*sx+x` |
| `Number` で Long 計算 | 53bit 超で精度欠損、LongArray が静かに壊れる | 必ず `BigInt64Array` + `BigInt` 演算 |
| Litematic ビットパックに ceil 使用 | 「砂嵐バグ」——構造体が砂や岩盤に化ける | `entriesPerLong = Math.floor(...)` のみ |
| Litematic GZip 圧縮忘れ | Litematica がロードを完全拒否（エラーメッセージなし） | `pako.gzip(buffer)` を忘れずに |
| Transferable 移譲後の読み取り | `byteLength === 0` でサイレントに壊れる | 移譲後は必ず null 代入 |
| ファイル名にスペース | OderSo がアドオン側でサイレントスキップ | 出力前に `/\s/g` でバリデーション |
| InstancedMesh 更新忘れ | `setMatrixAt()` 後に画面が更新されない | `mesh.instanceMatrix.needsUpdate = true` |

---

*最終更新: 2026-05-17 (v2.2 — Phase 1/2 完了確認、Phase 3/4 ロジック完了確認、デッドスタブ削除後の状態に更新)*
