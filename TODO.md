# 🧱 Structure Material Planner — TODO / 進捗

最終更新: 2026-05-04

---

## ✅ 完了（全 52 タスク）

### 🎨 マップカラー / ドット絵 / 画像変換
- [x] **mapcolors.js** — 62 基本色 + 371 blockId マップ + 4 段階明度 + 高さシェード
- [x] **MAP_TO_REPRESENTATIVE_BLOCK** — マップカラー仮想ID → 実ブロックID 逆引き
- [x] **ドット絵：マップカラーモード** — 表示色 / 集計の両方に反映
- [x] **ドット絵：標準29色 + マップ61色 切替パレット**
- [x] **画像→ドット絵変換** — visual / mapcolor 2モード、Floyd-Steinberg ディザリング
- [x] **パレット制限フィルター 8種** — 羊毛のみ／コンクリのみ／サバイバル現実的 等
- [x] **ドット絵 PNG エクスポート** — ×1 / ×4 / ×16 倍率対応

### 🧊 3Dビュー
- [x] **マップカラーモード** — `(mapColorId × shade)` で InstancedMesh 化
- [x] **プロシージャル PixelArt テクスチャ** — 16×16 Canvas で 18 種類の模様生成
- [x] **リアルテクスチャモード** — リソースパック ZIP 統合
- [x] **OrbitControls フル対応** — 左ドラッグ=回転 / 右ドラッグ=パン / ホイール=ズーム / WASD / QE / R
- [x] **床タイプ選択** — グリッド / 草原 / 砂浜 / 雪原 / 石 / ネザー / エンド / 水面 / なし
- [x] **階段・ハーフ・フェンス・壁の形状描画** — Bedrock states（weirdo_direction / upside_down_bit / open_bit 等）から 12 種類カスタムジオメトリ
- [x] **ブロック置換プレビュー** — 素材A→B、3D・素材リスト・breakdown 全部に即時反映
- [x] **コストダウン一括置換プリセット** — ネザライト→黒コン等、7 プリセット
- [x] **再読み込みボタン** — IDB バッファから無音再パース
- [x] **3D UI サイドパネル化** — アコーディオン式、開閉状態 localStorage 保存

### 🎮 リソースパック / テクスチャ
- [x] **ZIP / .jar / .mcpack アップロード対応** — JSZip
- [x] **IndexedDB に 1個まで保存** — 次回起動で自動復元
- [x] **素材一覧アイコンもパックから取得**
- [x] **2段辞書引き** — blocks.json → terrain_texture.json
- [x] **state→variant_index 早見表** — wood_type/stone_type/color等 14 種類
- [x] **flat→aggregate / 派生→base フォールバック** — grass_block→grass、nether_brick_stairs→nether_brick 等
- [x] **rawId + states 保持** — worker→viewer3d 全パスで伝播
- [x] **carried_textures フォールバック** — leaves 等
- [x] **「resource_pack/」プレフィックス対応** — Mojang 公式パック構造
- [x] **blocks.json キーの「`minecraft:`なし」形式対応** — 致命バグ修正
- [x] **公式 / Faithful / CurseForge へのリンク UI**

### 📦 Bedrock NBT 解析
- [x] **NBTParser** — Bedrock LE / Java BE 両対応
- [x] **NBTWriter** — Bedrock LE 書き出し（往復バイト一致）
- [x] **Bedrock 汎用ID + states → flat ID 完全正規化** — 23/23 テストパス
- [x] **置換後 .mcstructure ダウンロード** — palette を書き換え再シリアライズ
- [x] **3D座標式 修正** — Bedrock の `x*sy*sz + y*sz + z` 順序

### 💾 永続化 / IndexedDB
- [x] **構造バッファを IDB に永続化** — 再アップロード不要
- [x] **テクスチャパック ZIP も IDB 保存**
- [x] **IDB version 衝突修復** — v10 に bump
- [x] **localStorage 容量超過時の自動退避**

### 📊 素材一覧 / 集計
- [x] **倍率計算** — 同構造を複数建てる前提
- [x] **構造別素材内訳の折りたたみ表示**
- [x] **CSV エクスポート** — UTF-8 BOM 付き Excel 互換
- [x] **Markdown チェックリスト クリップボード共有** — Discord/Notion 貼付け用

### 🎯 UI / UX
- [x] **ホームに戻るボタン** — ロゴクリック
- [x] **プロジェクト一覧 D&D** — Canva風、複数 ZIP 同時投入
- [x] **ブロック数表示の視認性UP** — 2.4rem + 発光 text-shadow
- [x] **チェックボックス縁取り強化** — 黒外枠+緑グロー
- [x] **モバイル対応 @media** — 縦並び、タップ領域 36px+
- [x] **トースト通知 / ローディング表示**

### 🚀 デプロイ / 本番調整
- [x] **vercel.json** — Vite フレームワーク + cache headers
- [x] **OGP / Twitter card / favicon SVG / theme-color**
- [x] **JSZip / Three.js CDN フォールバック**（cdnjs → unpkg）
- [x] **グローバル error / unhandledrejection ハンドラ**
- [x] **Linux ファイル名大小文字確認**
- [x] **robots.txt**

### 🐛 バグ修正
- [x] **NBT パース misalignment** — 座標式・size 取得
- [x] **onerror 属性に JS が漏出** — `.replace(/"/g, '&quot;')`
- [x] **読込み直後に空表示** — `_switchTab(tab, true)` に修正
- [x] **disabled error の null guard 全箇所**
- [x] **CSS 末尾切れ修復** — @media 未閉じ

---

## 🔥 残タスク（新機能候補）

### 統合版マップアート関連（前回提案・未着手）
- [ ] **マップアート生成機能**
  - 画像 → マップカラー基準で .mcstructure 生成
  - 「実ブロックテクスチャ」/「マップカラー」プレビュー切替
  - 統合版マップ仕様（128×128、Scale 0〜4）に沿った自動分割
- [ ] **座標スナップ・有効範囲計算**
  - 任意座標から最寄りの「128の倍数」マップ角を計算
  - 縁の除外（オフセット）ロジック
- [ ] **/fill コマンド分割生成**
  - 統合版上限 32,768 ブロックを超えないよう自動分割
  - ストラクチャーブロック連携の数値（サイズ + オフセット）も生成
- [ ] **設置ガイド UI** — 複数枚マップの「どのファイルをどの座標に置くか」表示

### 3D拡張
- [ ] **マルチモデル表示** — 1シーンに複数 .mcstructure を同時配置
- [ ] **「現在のシーンに追加(マージ)」/「新規上書き」選択肢**
- [ ] **断面図スライス** — X/Z 軸（Y軸は実装済）
- [ ] **3D 内ホバーでブロック名表示** — Three.js Raycaster
- [ ] **テクスチャ模様（procedural）の bricks/wood grain 改善**

### その他
- [ ] **多言語対応（英語化）** — `lang_en.json` + 切替UI
- [ ] **ブロック検索オートコンプリート** — ひらがな/ローマ字対応
- [ ] **ドット絵プレビュー縮小表示** — 全体表示ボタン
- [ ] **自動バックアップ JSON ダウンロード** — 定期 / 手動
- [ ] **共有 URL（base64 短縮）** — 小構造の URL 共有

---

## 📝 メモ / 既知の制約
- IndexedDB v=10 にしたので、過去 v3 が残っているユーザーは F12 → Application → Storage → IndexedDB → 「mc-planner」を Delete してから再アップロード推奨
- 統合版 `/fill` 上限：32,768 ブロック（Bedrock では gamerule で変更不可）
- マップサイズ：Scale 0=128² / 1=256² / 2=512² / 3=1024² / 4=2048² blocks
- マップグリッドは `mapWidth - 64` で中心アライン
- shade 3（係数 0.53）は深い水域用、通常は使わない
- リソースパック PNG は Mojang ZIP では `resource_pack/textures/blocks/` 配下、Faithful 等は `textures/blocks/` 配下
- blocks.json キーは `minecraft:` 接頭辞なしで書かれているのが標準
