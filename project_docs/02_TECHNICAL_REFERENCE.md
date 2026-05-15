# 02_TECHNICAL_REFERENCE — The Technical Bible (AI Implementation Guide) v2.1

> **🤖 AI PRE-IMPLEMENTATION CHECKLIST**
> Before generating ANY binary, conversion, or rendering logic, verify ALL of the following:
> 1. [ ] **Endianness**: Bedrock (.mcstructure) = **Little-Endian**. Java (.litematic/.nbt) = **Big-Endian**. Wrong = unreadable file, zero errors thrown.
> 2. [ ] **Bedrock NBT Header**: `.mcstructure` has an **8-byte header** (two LE Int32: `[8, nbtPayloadByteLength]`). Strip on read, write on output.
> 3. [ ] **Bit-Packing**: Litematic LongArray entries MUST NOT cross 64-bit boundaries. `entriesPerLong = floor(64/bitsPerEntry)`. Violating = "sand storm" render bug in-game.
> 4. [ ] **Coordinate Order**: Bedrock `block_indices` = **ZYX** (`idx = SZ*SY*X + SZ*Y + Z`). Java Litematic = **YZX** (`idx = y*|sz|*|sx| + z*|sx| + x`). Mixing = silently corrupt structure.
> 5. [ ] **Two-Layer Palette**: Bedrock has TWO `block_indices` sublists (layer 0 = solid blocks, layer 1 = waterlog/liquid, `-1` = empty). Always write both.
> 6. [ ] **Reach Physics**: Player reach = **4.5 blocks** (Euclidean sphere). Scaffolding horizontal stability limit = **6 blocks** from any supporting pillar.

---

## 1. Binary Data Formats & Endianness

| Format | Environment | Endianness | Compression | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **.mcstructure** | Bedrock Edition | **Little-Endian** | None (Raw NBT) | 8-byte header prepended |
| **.litematic** | Java Edition (Litematica mod) | **Big-Endian** | **GZip (Mandatory)** | LongArray bit-packing |
| **.nbt** | Java Edition (Structure Block) | **Big-Endian** | GZip | `{pos,state}` list format |
| **.schem** | Java Edition (WorldEdit/Sponge) | **Big-Endian** | GZip | Palette + flat ByteArray |

### 1-1. Bedrock NBT Header (CRITICAL — Most-Missed Trap)

Every Bedrock NBT file (`.mcstructure`, `level.dat`) prepends an **8-byte little-endian header**:

```
Bytes 0–3: LE Int32 = storage version (always 8 for .mcstructure)
Bytes 4–7: LE Int32 = byte length of the NBT payload that follows (excludes these 8 bytes)
```

```javascript
// Writing header in nbt-writer.js:
view.setInt32(0, 8, true);                    // version
view.setInt32(4, nbtPayloadByteLength, true); // payload size
// then write NBT body starting at offset 8
```

Failure to **strip** this on read → parse error at byte 0.
Failure to **write** it on output → OderSo / Schematica refuses to load the file silently.

### 1-2. DataView Endian Cheatsheet

```javascript
// Bedrock (Little-Endian) — ALWAYS pass true
view.getInt32(offset, true);   view.setUint32(offset, v, true);

// Java (Big-Endian) — ALWAYS pass false (DataView default is false, but be explicit)
view.getInt32(offset, false);  view.setUint32(offset, v, false);
```

> ⚠️ JS `DataView` defaults to Big-Endian when the boolean is **omitted**. If you forget `true` on a Bedrock read, you get garbage values with NO exception thrown.

---

## 2. `.mcstructure` Format Deep-Spec (Bedrock Edition)

*Source: [Bedrock Wiki — .mcstructure](https://wiki.bedrock.dev/nbt/mcstructure), [tryashtar's gist](https://gist.github.com/tryashtar/87ad9654305e5df686acab05cc4b6205)*

### 2-1. Root NBT Structure

```
TAG_Compound('')
  TAG_Int('format_version')            = 1
  TAG_List('size')                     = [TAG_Int(SX), TAG_Int(SY), TAG_Int(SZ)]
  TAG_List('structure_world_origin')   = [TAG_Int(ox), TAG_Int(oy), TAG_Int(oz)]
  TAG_Compound('structure')
    TAG_List('block_indices')          ← TWO sublists
      TAG_List[0]                      ← Layer 0: solid blocks (Int indices, count = SX*SY*SZ)
      TAG_List[1]                      ← Layer 1: waterlog/liquid (Int indices, -1 = none)
    TAG_List('entities')
    TAG_Compound('palette')
      TAG_Compound('default')
        TAG_List('block_palette')      ← Ordered BlockState list
        TAG_Compound('block_position_data') ← Block entity data, keyed by flat ZYX index
```

### 2-2. Coordinate Iteration Order (ZYX) — MEMORIZE THIS

```javascript
// Index for block at (x, y, z):
const idx = SZ * SY * x + SZ * y + z;

// Recovering (x, y, z) from flat index i:
const x = Math.floor(i / (SZ * SY));
const y = Math.floor((i / SZ) % SY);
const z = i % SZ;
```

> **#1 Silent Bug Source**: Mixing ZYX (Bedrock) with YZX (Java) produces a structure that loads without error but is scrambled/rotated.

### 2-3. Two-Layer Waterlogging System

Layer 1 value `-1` (written as `TAG_Int(-1)` = `0xFFFFFFFF`) = no fluid.
When layer 1 ≠ -1, it indexes the palette for a fluid block (e.g., `minecraft:water`).

**Java conversion**: If layer 1 ≠ -1, set `waterlogged:"true"` on the Java BlockState Properties of the layer 0 block.

### 2-4. Block Palette Entry Format

```json
{
  "name": "minecraft:planks",
  "states": { "wood_type": "acacia" },
  "version": 17959425
}
```

- `states` value types: `TAG_String` for enums, `TAG_Int` for scalars, `TAG_Byte` (0/1) for booleans.
- `version` = packed `(major<<24)|(minor<<16)|(patch<<8)|rev`. Copy from source file; do NOT hardcode to 0.
- **Writing booleans**: Java uses string `"true"/"false"`; Bedrock uses `TAG_Byte`. Always cast appropriately during conversion.

---

## 3. Java Litematic Format Deep-Spec

*Source: [Litemapy Documentation](https://litemapy.readthedocs.io/en/latest/litematics.html)*

### 3-1. Root NBT Structure (GZip-compressed, Big-Endian)

```
TAG_Compound('')
  TAG_Int('MinecraftDataVersion')  ← e.g. 2860 for 1.18.2; 3700 for 1.20
  TAG_Int('Version')               ← Litematic format version (currently 6)
  TAG_Compound('Metadata')
    TAG_String('Name'), TAG_String('Author')
    TAG_Long('TimeCreated'), TAG_Long('TimeModified')
    TAG_Compound('EnclosingSize') → TAG_Int x/y/z
    TAG_Int('RegionCount')
  TAG_Compound('Regions')
    TAG_Compound('<RegionName>')
      TAG_Compound('Position')     ← Origin offset (can be 0,0,0)
      TAG_Compound('Size')         ← CAN BE NEGATIVE (see §3-3)
      TAG_List('BlockStatePalette') ← List of TAG_Compound (Java BlockStates)
      TAG_LongArray('BlockStates')  ← Bit-packed indices — see §3-2
      TAG_List('Entities')
      TAG_List('TileEntities')
```

### 3-2. Litematic Bit-Packing (1.16+ — The NO-WRAP Rule)

This is the most dangerous implementation area. A single off-by-one corrupts the entire file silently.

```javascript
// CORRECT implementation — no-wrap (1.16+ / Litematica):
function packBlockStates(indices, paletteSize) {
    const bitsPerEntry = Math.max(4, Math.ceil(Math.log2(Math.max(paletteSize, 2))));
    const entriesPerLong = Math.floor(64 / bitsPerEntry); // FLOOR — no fractional entries
    const longCount = Math.ceil(indices.length / entriesPerLong);
    const longs = new BigInt64Array(longCount);

    for (let i = 0; i < indices.length; i++) {
        const longIdx = Math.floor(i / entriesPerLong);
        const bitOffset = BigInt((i % entriesPerLong) * bitsPerEntry);
        longs[longIdx] |= BigInt(indices[i]) << bitOffset;
    }
    return longs;
}

// CORRECT unpack:
function unpackBlockStates(longs, totalBlocks, paletteSize) {
    const bitsPerEntry = Math.max(4, Math.ceil(Math.log2(Math.max(paletteSize, 2))));
    const entriesPerLong = Math.floor(64 / bitsPerEntry);
    const mask = (1n << BigInt(bitsPerEntry)) - 1n;
    const indices = new Uint16Array(totalBlocks);
    for (let i = 0; i < totalBlocks; i++) {
        const longIdx = Math.floor(i / entriesPerLong);
        const bitOffset = BigInt((i % entriesPerLong) * bitsPerEntry);
        indices[i] = Number((longs[longIdx] >> bitOffset) & mask);
    }
    return indices;
}
```

**The NO-WRAP Rule (砂嵐バグの原因)**:
- `entriesPerLong = floor(64 / bitsPerEntry)` — **floor only**. Remaining bits in each Long are zero-padded.
- Example: bitsPerEntry=5 → entriesPerLong=12 (bits 60–63 wasted). The 13th entry starts at bit 0 of the **next** Long, never straddling the boundary.
- **Pre-1.16 format** (old WorldEdit `.schematic`): entries CAN wrap across Long boundaries. Do NOT use that logic for Litematica output.

### 3-3. Negative Region Sizes

A region `Size.x = -5` covers X in `[origin.x - 4, origin.x]` (range `[size+1, 0]`).
Always use `Math.abs(size)` when computing volume or index arithmetic.

### 3-4. Coordinate Iteration Order (YZX)

```javascript
// Index for block at (x, y, z) in a region of absolute size (sx, sy, sz):
const idx = (y * Math.abs(sz) + z) * Math.abs(sx) + x;
```

---

## 4. The Flattening & Block State Mapping (Bedrock ↔ Java)

### 4-1. The Core Problem

After Java's "The Flattening" (1.13), Bedrock and Java diverged fundamentally:

| Aspect | Bedrock | Java |
| :--- | :--- | :--- |
| Block ID | String name + `states` NBT | String name + `Properties` string map |
| Waterlogging | Separate layer 1 in structure file | `waterlogged:true/false` in BlockState |
| Booleans | `TAG_Byte` (0b / 1b) | String `"true"` / `"false"` |
| Divergence type | One BE name → multiple JE names based on states | — |

**The Flattening Divergence Example — Oak Log:**
- Bedrock: `minecraft:log` + `{ wood_type:"oak", pillar_axis:"y" }`
- Java:     `minecraft:oak_log` + `{ axis:"y" }`

One Bedrock block name can map to **many** Java names depending on `states`. Mapping must key on BOTH name AND all relevant states.

### 4-2. Mapping Dictionary Design (Data-Driven, Worker-Resident)

```javascript
// be_to_je_block_mapping.json key format:
// "bedrockName|sortedState1=val1,sortedState2=val2"
{
  "minecraft:log|pillar_axis=y,wood_type=oak": {
    "Name": "minecraft:oak_log", "Properties": { "axis": "y" }
  },
  "minecraft:log|pillar_axis=x,wood_type=birch": {
    "Name": "minecraft:birch_log", "Properties": { "axis": "x" }
  }
}

// Fast O(1) lookup in Worker (build Map once at init):
const mappingMap = new Map(Object.entries(await fetchMappingJSON()));

function bedrockToJava(name, states) {
    const stateKey = Object.keys(states).sort()
        .map(k => `${k}=${states[k]}`).join(',');
    return mappingMap.get(`${name}|${stateKey}`)
        ?? { Name: 'minecraft:stone', Properties: {} }; // safe fallback
}
```

### 4-3. Known Mapping Landmines

| Bedrock Block | Trap |
| :--- | :--- |
| `minecraft:stone` | `stone_type` state maps to separate Java IDs (granite, andesite, etc.) |
| `minecraft:double_stone_slab` | Maps to `type=double` — not a real placeable Java block; handle as two slabs |
| `minecraft:leaves` / `minecraft:leaves2` | Must set Java `persistent` and `distance` from `persistent_bit` + `update_bit` |
| `minecraft:fence_gate` | `in_wall_bit` has no Java equivalent — omit from Java output |
| `minecraft:trapdoor` | `open_bit=0b` = closed; Java `open=false` — easy to accidentally invert |
| `minecraft:chest` (double) | Bedrock uses same name for both halves; Java needs `type:left/right` — requires neighbor scan |
| `minecraft:coral_*` | `dead_bit=1b` maps to `dead_*` Java name prefix |

---

## 5. Survival Physics & Scaffolding Engine

### 5-1. Scaffolding Optimization Algorithm (v2)

Constants:
- **Player Interaction Reach**: `4.5` blocks (Euclidean sphere from eye position at `feet.y + 1.62`).
- **Scaffolding Stability**: Max `6` blocks horizontally from a supporting pillar before collapse.

Steps:
1. **Standing Position Map**: For each target block `B`, compute all valid standing positions `S` where `euclideanDist(B.center, eyeOf(S)) <= 4.5`. Store as `Map<BlockCoord, Set<StandingCoord>>`.
2. **Coverage Greedy**: Iterate target blocks Y-descending. For each uncovered block, find standing position with highest coverage overlap.
3. **Pillar Generation**: From `Y_ground` up, build vertical scaffold to required standing height.
4. **Horizontal Extension**: Branch outward ≤ 6 blocks from pillar in cardinal directions.
5. **Dead Zone Detection**: Any target whose all standing positions exceed 6 from every existing pillar → find nearest ground point, insert new pillar. Repeat until full coverage.
6. **Output**: `Set<Coord3D>` scaffold placements + ordered build sequence (pillar-first).

### 5-2. Hidden Light (Light-Patch) Logic

1. **Scan**: Detect light-concealing blocks: `minecraft:carpet` (check Y-1), `minecraft:stone_block_slab[type=bottom]` (same Y).
2. **Replace**: Substitute with `minecraft:shroomlight` or `minecraft:sea_lantern` (both level 15).
3. **Validate**: Ensure replacement is not visually exposed from the primary viewing angle before writing.

---

## 6. 3D Rendering & Texture Resolution (Faithful/HD Support)

### 6-1. Resolution-Agnostic UV Mapping

```javascript
// WRONG — hardcodes 16px:
uv.x = faceU / 16;

// CORRECT — scales with any pack resolution:
const scaleFactor = texture.image.width / 16;
uv.x = (faceU * scaleFactor) / texture.image.width;
```

**Edge Cases:**
- **Doors**: `upper_block_bit` (BE) / `half=upper` (JE). Top half UV row = 0, bottom = 16 on the door texture.
- **Chests**: Source UV from `textures/entity/chest/normal.png` (64×64). Front = `[1,14,15,28]`, top = `[14,0,28,14]`.
- **Pillars (Quartz/Hay)**: Apply UV rotation matrix based on `pillar_axis` / `axis` state.

### 6-2. High-Performance Rendering (InstancedMesh)

```javascript
// Group by block type + states, one InstancedMesh per group
const groups = new Map();
for (const block of visibleBlocks) {
    const key = `${block.name}|${stateKey(block.states)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(block.pos);
}
for (const [key, positions] of groups) {
    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    positions.forEach((pos, i) => {
        dummy.position.set(pos.x, pos.y, pos.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
}
```

**Culling**: Run Hollow-out Engine before populating matrices. Blocks with all 6 neighbors opaque are excluded. Typical reduction: 60–80% fewer instances on solid structures.

---

## 7. Data Hack: Invert (Excavation) Mode

1. **Bounding Box**: `min/max(X, Y, Z)` of entire structure.
2. **Voxel Swap**: Solid → `air`; Air (inside bbox OR adjacent to solid) → marker block (e.g., `minecraft:glowstone`).
3. **Optimization**: Only process air voxels where `isInsideBBox(pos) || hasAnySolidNeighbor(pos)`. Prevents O(infinity) cube fill.

---

## 8. Memory Management for Large Structures (Browser Constraints)

### 8-1. Section-Based Stream Processing (Never Full-Expand)

```javascript
// In process.worker.js — never expand full NBT into object tree
function* sectionIterator(dataView, sx, sy, sz) {
    const S = 16;
    for (let bx = 0; bx < sx; bx += S)
    for (let by = 0; by < sy; by += S)
    for (let bz = 0; bz < sz; bz += S) {
        const section = new Uint16Array(S * S * S);
        // Fill directly from DataView via readInt32LE per index
        for (let lx = 0; lx < S && bx+lx < sx; lx++)
        for (let ly = 0; ly < S && by+ly < sy; ly++)
        for (let lz = 0; lz < S && bz+lz < sz; lz++) {
            const globalIdx = sz*sy*(bx+lx) + sz*(by+ly) + (bz+lz);
            section[S*S*lx + S*ly + lz] = readBlockIndex(dataView, globalIdx);
        }
        yield { section, origin: [bx, by, bz] };
        // section = unreachable after yield resumes next → GC eligible
    }
}
```

### 8-2. Transferable Object Pattern (Zero-Copy Cross-Thread)

```javascript
// Worker → Main (zero-copy):
const result = new Uint16Array(processedData);
self.postMessage(
    { type: 'COMPLETE', taskId, payload: { data: result.buffer } },
    [result.buffer]   // Transfer list — buffer is neutered in worker after this line
);

// Main → Worker (zero-copy):
worker.postMessage(
    { type: 'PARSE_NBT', taskId, payload: { buffer: fileArrayBuffer } },
    [fileArrayBuffer] // fileArrayBuffer.byteLength === 0 after this line in main thread
);
```

> ⚠️ After transferring, the original `ArrayBuffer` in the sender has `byteLength === 0`. Any attempt to read it throws or silently reads zeros.

### 8-3. Explicit GC Promotion

```javascript
let chunkBuffer = getChunkData(i);
processChunk(chunkBuffer);
chunkBuffer = null; // Nullify immediately — allows GC without waiting for scope exit
```

---

## 9. Technical Reference Links

### 9-1. Format Specifications (Primary Sources)
- **Bedrock .mcstructure full spec**: [wiki.bedrock.dev/nbt/mcstructure](https://wiki.bedrock.dev/nbt/mcstructure)
- **Bedrock NBT header / endianness detail**: [wiki.bedrock.dev/nbt/nbt-in-depth](https://wiki.bedrock.dev/nbt/nbt-in-depth)
- **Bedrock mcstructure annotated gist** (tryashtar): [gist.github.com/tryashtar/87ad9654305e5df686acab05cc4b6205](https://gist.github.com/tryashtar/87ad9654305e5df686acab05cc4b6205)
- **Java NBT format**: [minecraft.wiki/w/NBT_format](https://minecraft.wiki/w/NBT_format)
- **Java Structure Block format**: [minecraft.fandom.com/wiki/Structure_Block_file_format](https://minecraft.fandom.com/wiki/Structure_Block_file_format)
- **Litematic file format (Litemapy docs)**: [litemapy.readthedocs.io/en/latest/litematics.html](https://litemapy.readthedocs.io/en/latest/litematics.html)

### 9-2. Libraries & Mapping
- **Prismarine-NBT** (JS reference): [github.com/PrismarineJS/prismarine-nbt](https://github.com/PrismarineJS/prismarine-nbt)
- **Minecraft Data** (Java BlockState enumeration): [github.com/PrismarineJS/minecraft-data](https://github.com/PrismarineJS/minecraft-data)
- **GeyserMC Mappings** (BE↔JE gold standard): [github.com/GeyserMC/mappings](https://github.com/GeyserMC/mappings)
- **GeyserMC Mappings Generator**: [github.com/GeyserMC/mappings-generator](https://github.com/GeyserMC/mappings-generator)
- **nbt-to-mcstructure** (Python reference): [github.com/JaylyDev/nbt-to-mcstructure](https://github.com/JaylyDev/nbt-to-mcstructure)
- **Bedrock Paletted Chunks spec** (Tomcc/Mojang gist): [gist.github.com/Tomcc/a96af509e275b1af483b25c543cfbf37](https://gist.github.com/Tomcc/a96af509e275b1af483b25c543cfbf37)

---
*Last Synchronized: 2026-05-13 (v2.1 — Deep Spec Upgrade)*
*Source analysis: wiki.bedrock.dev, minecraft.wiki, litemapy.readthedocs.io, tryashtar gist, GeyserMC repos*
