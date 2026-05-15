# Minecraft Structure Planner — マスター設計指針：精密機械化改訂 (v2.1)

> **🤖 AI への絶対命令**: 本ドキュメントは v2.0 の思想を継承しつつ、実装精度を最大化するために具体的なアーキテクチャ定義・型インターフェース・地雷マップを追記した v2.1 です。「精密機械的アーキテクチャ」の三本柱（ストリーム処理・Worker 隔離・データ駆動マッピング）を全実装の必須要件とします。

---

## 1. プロジェクトの思想：精密機械化

本ツールは「ブラウザ上で数千万ブロックを操作する」という極限状態を前提とします。

1. **ストリーム・パイプライン処理**: 巨大 NBT を一度に JS オブジェクトへ展開することを**禁止**。`16x16x16` の仮想セクション単位で `Uint16Array` を用いてバイナリから逐次読み取り・処理・破棄を行う。
2. **データ駆動型マッピング**: ハードコードされた ID 変換を廃止。`GeyserMC/mappings` を原典とする外部 JSON (`be_to_je_block_mapping.json`) をフェッチし、`Map<string, JavaBlockState>` としてインメモリで動的解決する。
3. **厳格な Worker 隔離**: メインスレッドは DOM 描画・軽量プレビューのみ。バイナリ操作・計算はすべて Web Worker へ委譲し、`Transferable Objects` を介したイベント駆動（Pub/Sub）で通信する。

---

## 2. スレッド別役割分担（厳格定義）

### Main Thread (`main.js`)
- UI 描画 (Canvas / DOM)
- Three.js r128 軽量プレビュー（可視ブロックのみ InstancedMesh）
- Worker へのタスク発行・進捗表示・エラーハンドリング
- **禁止事項**: NBT パース・バイナリ書き出し・ID 変換・ビットパック計算

### Process Worker (`workers/process.worker.js`)
- NBT ストリーム・パース（セクション単位、`DataView` 直接操作）
- Bedrock → Java BlockState 変換（マッピング辞書参照）
- Litematic ビットパック計算（`BigInt64Array` 操作）
- マッピングデータの `Map` 構築とインメモリ解決
- `Transferable Objects` によるゼロコピー・データ移譲

### Mapping Worker (`workers/mapping.worker.js`)
- `be_to_je_block_mapping.json` のフェッチとパース
- `Map<string, JavaBlockState>` の構築
- ブロック名 + ステートキーによる高速 O(1) ルックアップ提供

---

## 3. フォルダ構造 (v2.1 精密機械版)

```
project/
├── index.html
├── vite.config.js
└── js/
    ├── main.js                      # エントリポイント — UI と Worker の疎通管理のみ
    ├── ui/
    │   ├── panels/
    │   │   ├── viewer-panel.js      # Three.js プレビュー UI
    │   │   ├── materials-panel.js   # 素材リスト表示
    │   │   └── dotart-panel.js      # ドット絵支援 UI
    │   └── components/
    │       ├── toast.js             # トースト通知
    │       ├── modal.js             # モーダルダイアログ
    │       └── progress.js          # Worker 進捗バー
    ├── render/
    │   ├── viewer3d.js              # Three.js 座標管理・プレビュー統括
    │   ├── scene.js                 # Scene / Camera / Light 管理
    │   └── block-mesh.js            # InstancedMesh 生成・カリング
    ├── workers/
    │   ├── process.worker.js        # 重処理メインパイプライン
    │   └── mapping.worker.js        # マッピングデータ解析・検索
    └── modules/                     # 両スレッドで import 可能な純粋ロジック
        ├── stream/
        │   ├── nbt-reader.js        # DataView ベース NBT ストリームリーダー（LE/BE両対応）
        │   └── nbt-writer.js        # Big-Endian NBT ライター（Litematic / Java 出力用）
        ├── mapping/
        │   ├── be-to-je.js          # Bedrock→Java 変換ロジック（Map 参照）
        │   └── mapping-loader.js    # be_to_je_block_mapping.json フェッチ＆Map 構築
        └── logic/
            ├── merge.js             # 座標マージ・負オフセット処理
            ├── scaffold.js          # 足場最適化エンジン
            ├── invert.js            # ハリボテ化（Invert）生成
            ├── light-patch.js       # 隠し光源パッチ
            └── bitpack.js           # Litematic LongArray ビットパック（BigInt64Array）
```

---

## 4. Worker 通信インターフェース (Pub/Sub 型定義)

```typescript
// ===== Main → Worker リクエスト =====
interface WorkerTask {
    type: 'PARSE_NBT' | 'CONVERT_LITEMATIC' | 'MERGE_STRUCTURES' |
          'SCAFFOLD_GEN' | 'INVERT_GEN' | 'LOAD_MAPPING';
    taskId: string;     // nanoid() で生成するユニーク ID
    payload: {
        buffer?: ArrayBuffer;   // Transferable — タスク後は detached
        config?: {
            sourceFormat: 'mcstructure' | 'nbt';
            targetFormat: 'litematic' | 'mcstructure';
            minecraftDataVersion?: number;
        };
        structures?: ArrayBuffer[];  // MERGE_STRUCTURES 用
    };
}

// ===== Worker → Main 応答 =====
interface WorkerResponse {
    type: 'PROGRESS' | 'COMPLETE' | 'ERROR';
    taskId: string;
    payload: {
        progress?: number;          // 0.0 – 1.0
        stage?: string;             // e.g. "Parsing block palette..."
        data?: ArrayBuffer;         // Transferable — 処理済み Uint16Array.buffer 等
        metadata?: {
            blockCount: number;
            paletteSize: number;
            dimensions: [number, number, number];
            warnings?: string[];    // e.g. unmapped block names
        };
        error?: string;
    };
}

// ===== Worker 内部イベントバス (process.worker.js) =====
// import { EventEmitter } from '../modules/events.js' を使用
// emit('section:ready', { section: Uint16Array, origin: [x,y,z] })
// emit('palette:built', { map: Map<string, JavaBlockState> })
```

---

## 5. AI プロンプトテンプレート集

### Template 01: NBT ストリームリーダー
```markdown
## Scope
Create `js/modules/stream/nbt-reader.js` — a DataView-based streaming NBT reader.
- Support BOTH Little-Endian (Bedrock) and Big-Endian (Java) via a constructor flag.
- Strip the 8-byte Bedrock header automatically when `format='bedrock'`.
- NEVER build a full nested JS object. Expose a cursor-based API:
  `readTag(cursor) → { type, name, value, nextCursor }`
- Use a generator `function* readCompound(buffer, offset, littleEndian)` that yields
  `{ tagType, tagName, byteOffset }` entries without materializing values.
```

### Template 02: NBT ライター (Big-Endian / Java)
```markdown
## Scope
Create `js/modules/stream/nbt-writer.js` for Java-compatible Big-Endian NBT output.
- Use `BigInt` for `writeLong` and `writeLongArray`.
- Support: TAG_Compound, TAG_List, TAG_LongArray, TAG_String, TAG_Int, TAG_Byte, TAG_Short.
- Output a single `ArrayBuffer` — DO NOT use any DOM or Node.js APIs.
```

### Template 03: Litematic ビットパック
```markdown
## Scope
Implement `js/modules/logic/bitpack.js`:
- `packBlockStates(indices: number[], paletteSize: number): BigInt64Array`
- `unpackBlockStates(longs: BigInt64Array, totalBlocks: number, paletteSize: number): Uint16Array`
- STRICTLY follow the 1.16+ no-wrap rule: `entriesPerLong = Math.floor(64 / bitsPerEntry)`.
- Include a unit test fixture: palette=16 blocks (bitsPerEntry=4), 4096 indices, verify round-trip.
```

### Template 04: Bedrock → Java 変換パイプライン
```markdown
## Scope
Implement the conversion pipeline in `workers/process.worker.js`:
1. Read .mcstructure via nbt-reader.js (cursor-based, section-by-section).
2. For each section (16^3 blocks), convert palette entries via be-to-je.js.
3. Re-pack converted indices into Litematic LongArray via bitpack.js.
4. Emit PROGRESS events every section. Transfer final ArrayBuffer to main thread.
- DO NOT build intermediate JS objects larger than one section at a time.
```

---

## 6. ハルシネーション防止チェックリスト (v2.1)

### バイナリ操作
- **Bedrock NBT 8バイトヘッダー**: 読み時にストリップ、書き時に必ず付与。
- **エンディアン**: `DataView` の boolean 引数を省略しない。`true`=LE(Bedrock)、`false`=BE(Java)。
- **ZYX vs YZX**: Bedrock=`SZ*SY*X + SZ*Y + Z`、Litematic=`y*|sz|*|sx| + z*|sx| + x`。
- **Litematic LongArray**: `BigInt64Array` を使用。`Number` の 53bit 精度では Long が壊れる。
- **ビットパック**: `entriesPerLong = Math.floor(64/bitsPerEntry)` — **floor のみ**。

### マッピング
- **The Flattening**: Bedrock の 1 ブロック名が Java の複数名に分岐する (`minecraft:log` など)。`name + sorted states` をキーとする Map を使用。
- **Waterlogging**: Bedrock layer 1 ≠ -1 → Java `waterlogged:"true"` に変換。
- **boolean 型**: Bedrock=`TAG_Byte(0/1)`、Java=`String("true"/"false")`。

### Three.js r128 固有制約
- `OrbitControls` は `THREE` オブジェクト外。`import` または CDN から個別ロード。
- `CapsuleGeometry` は r142+ 以降。r128 では `CylinderGeometry` + `SphereGeometry` で代替。
- `InstancedMesh.setMatrixAt()` 後に `instanceMatrix.needsUpdate = true` が必須。

### ファイル出力
- **ファイル名**: スペース禁止（OderSo アドオンの制約）。出力前に `/\s/g.test(name)` でバリデーション。
- **Litematic GZip**: `pako.gzip()` または `CompressionStream('gzip')` で必ず圧縮。未圧縮 = Litematica がロード拒否。

---
*最終更新: 2026-05-13 (v2.1 — アーキテクチャ精密化・型定義追記)*
