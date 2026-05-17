# MC Planner — Gemini アイコン生成仕様書

## モデル設定
- **推奨モデル**: Imagen High（gemini-2.0-flash / imagen-3 high quality）
- 理由: ピクセルアート風の細部・透過処理の精度

---

## 出力共通仕様

| 項目 | 値 |
|---|---|
| フォーマット | PNG（アルファチャンネル付き透過背景） |
| ロゴサイズ | 512 × 512 px |
| タブ・ボタンアイコン | 256 × 256 px |
| アートスタイル | Minecraft風 等角投影ピクセルアート（isometric pixel art） |
| 背景 | 完全透過（no background） |
| 輪郭線 | なし（borderless）、柔らかい影のみ |
| 質感 | ソフトパステル、マット仕上げ |

---

## 生成するアイコン一覧（テーマごとに 7 枚）

| ファイル名 | 用途 | 内容・モチーフ |
|---|---|---|
| `logo.png` | アプリロゴ・ウェルカム画面 | チェリーウッドの小さなコテージ（等角投影）、桜の木2本添え |
| `tab-materials.png` | 素材一覧タブ | Minecraft チェスト（胸箱）を斜め上から見た等角投影 |
| `tab-3d.png` | 3Dビュータブ | 3つのブロックを積んだシンプルな等角投影タワー |
| `tab-dotart.png` | ドット絵タブ | 絵の具パレット＋筆（ピクセルアートスタイル） |
| `tab-themes.png` | テーマタブ | ダイアモンド（Minecraftスタイル）に虹色の光 |
| `tab-settings.png` | 設定タブ | クラフト台（Crafting Table）を斜め上から等角投影 |
| `btn-download.png` | ダウンロードボタン | 下向き矢印＋小さなブロック箱（チェスト）の組み合わせ |

---

## テーマ別カラーパレット & プロンプト補足

### light-1: Lavender Mist（ラベンダーミスト）
```
メインカラー:  #a878d8（ミディアムラベンダー）
背景色:        #ede0f8（薄いラベンダー）
カード色:      #faf5ff（ほぼ白紫）
テキスト色:    #5a3878（深い紫）
アクセント:    #c090e0（明るいラベンダー）
```
**プロンプト補足**: `lavender and soft purple tones, pastel purple palette, dreamy misty atmosphere`

---

### light-2: Frosted Crystal（フロステッドクリスタル）
```
メインカラー:  #7aaae8（コバルトブルー）
背景色:        #dce8f8（薄い水色）
カード色:      #f6fcff（ほぼ白青）
テキスト色:    #2a4070（深い青）
アクセント:    #6090d8（鮮やかなブルー）
```
**プロンプト補足**: `icy blue and crystal tones, frosted glass aesthetic, cool cobalt palette, slight translucent sheen`

---

### light-3: Sakura Spring（サクラスプリング）
```
メインカラー:  #e890c0（桜ピンク）
背景色:        #fadae8（薄桜色）
カード色:      #fff6fb（ほぼ白ピンク）
テキスト色:    #7a3058（深みのあるローズ）
アクセント:    #e070a8（ビビッドピンク）
```
**プロンプト補足**: `cherry blossom pink, sakura petals, soft rose gold accents, springtime Japanese aesthetic`

---

### light-4: Blueprint Paper（ブループリントペーパー）
```
メインカラー:  #2563eb（青）
背景色:        #eeead8（クリーム）
カード色:      #fffef8（ほぼ白）
テキスト色:    #000000（黒）
アクセント:    #dc2626（赤）
```
**プロンプト補足**: `blueprint technical drawing style, parchment paper background, bold black outlines, primary colors only, brutalist flat design`
> ※ このテーマは等角投影ではなく**フラットな設計図風ドット**で生成すること

---

### light-5: Paper Sage（ペーパーセージ）
```
メインカラー:  #84b068（セージグリーン）
背景色:        #dce8d4（薄いグリーン）
カード色:      #f4faf2（ほぼ白緑）
テキスト色:    #445840（深い緑）
アクセント:    #6a9858（落ち着いたオリーブ）
```
**プロンプト補足**: `sage green and natural earth tones, washi paper texture feel, calm botanical aesthetic, muted forest greens`

---

### light-6: Mint Lab（ミントラボ）
```
メインカラー:  #50c8b8（ミントグリーン）
背景色:        #caeeda（薄いミント）
カード色:      #f2fdf9（ほぼ白緑）
テキスト色:    #2a6058（深いティール）
アクセント:    #38b8a8（ティールグリーン）
```
**プロンプト補足**: `mint green and teal, clean laboratory aesthetic, fresh and crisp, slightly clinical but cute`

---

### light-7: Latte Cafe（ラテカフェ）
```
メインカラー:  #d89050（カラメルオレンジ）
背景色:        #f0e2b4（ラテベージュ）
カード色:      #fef9ee（クリーミーホワイト）
テキスト色:    #6a4018（こげ茶）
アクセント:    #c87838（濃いカラメル）
```
**プロンプト補足**: `warm latte caramel tones, cozy cafe aesthetic, creamy beige and warm brown, autumn warmth`

---

### light-8: Coral Bloom（コーラルブルーム）
```
メインカラー:  #ec9080（コーラルピンク）
背景色:        #fac8b8（ライトコーラル）
カード色:      #fff5f2（ほぼ白）
テキスト色:    #7a2c20（深いテラコッタ）
アクセント:    #e07060（ビビッドコーラル）
```
**プロンプト補足**: `coral and salmon pink tones, warm tropical bloom, soft terracotta accents, summer floral aesthetic`

---

### light-9: Brutalist Mono（ブルータリストモノ）
```
メインカラー:  #333333（ダークグレー）
背景色:        #d8d8d8（ミッドグレー）
カード色:      #f8f8f8（ライトグレー）
テキスト色:    #000000（黒）
アクセント:    #000000（黒）
```
**プロンプト補足**: `black and white only, brutalist geometric style, bold thick outlines, no gradients, raw concrete aesthetic`
> ※ 等角投影ではなく**真正面のフラット幾何学**スタイルで生成すること

---

### light-10: Aurora Bright（オーロラブライト）
```
メインカラー:  #8b5cf6（パープル）
背景色:        #f0f4ff（薄いラベンダーホワイト）
カード色:      rgba白（半透明ガラス）
テキスト色:    #1e1b4b（深い紺）
アクセント:    #7c3aed（ビビッドバイオレット）
```
**プロンプト補足**: `aurora borealis inspired, violet and indigo gradient glow, glassy translucent quality, northern lights pastel`

---

## ファイル出力構造

```
public/icons/
├── light-1/
│   ├── logo.png
│   ├── tab-materials.png
│   ├── tab-3d.png
│   ├── tab-dotart.png
│   ├── tab-themes.png
│   ├── tab-settings.png
│   └── btn-download.png
├── light-2/
│   └── （同上 7枚）
├── light-3/
│   └── （同上 7枚）
├── light-4/
│   └── （同上 7枚）
├── light-5/
│   └── （同上 7枚）
├── light-6/
│   └── （同上 7枚）
├── light-7/
│   └── （同上 7枚）
├── light-8/
│   └── （同上 7枚）
├── light-9/
│   └── （同上 7枚）
└── light-10/
    └── （同上 7枚）
```

合計: **70枚**

---

## Gemini への共通プロンプト骨格

```
Generate a [SIZE]px transparent PNG icon in isometric Minecraft pixel art style.

Subject: [SUBJECT]
Color palette: [PRIMARY], [BACKGROUND], [ACCENT]
Style: [STYLE_SUPPLEMENT]
Requirements:
- Transparent background (no background color)
- Soft drop shadow beneath the object
- No border or outline around the icon
- Pastel color tones, matte finish
- Clean pixel art edges, slightly rounded forms
- Centered composition with small padding
```

---

## 優先度

テーマ数が多い場合は以下の順で生成推奨：

1. **light-3 Sakura Spring** （最もよく使われるメインテーマ）
2. **light-1 Lavender Mist**
3. **light-7 Latte Cafe**
4. **light-8 Coral Bloom**
5. 残り6テーマ

---

## 実装メモ（画像が揃ったら対応）

アイコンが `public/icons/light-X/` に揃い次第、以下を実装：
- タブボタンの絵文字 → `<img>` タグに差し替え（テーマに応じて動的パス切り替え）
- ロゴの差し替え（`/icon.png` → `/icons/light-X/logo.png`）
- ダウンロードボタンアイコン差し替え
