/**
 * merge.js — Multi-Structure Coordinate Merge & Negative Offset Normalisation
 *
 * Merges multiple parsed .mcstructure coordinate spaces into a single unified
 * volume, handling:
 *   - World-origin alignment (structures placed at different world coordinates)
 *   - Negative coordinate normalisation (all indices shifted to ≥ 0)
 *   - Palette deduplication across structures
 *   - Air-block skipping (structure A does not overwrite structure B's blocks with air)
 *
 * Coordinate order: Bedrock ZYX throughout (idx = SZ*SY*x + SZ*y + z).
 * Safe for Web Worker — no DOM dependencies.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types (JSDoc)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} StructureInput
 * @property {Int32Array|Uint16Array} layer0    - Flat block index array (ZYX)
 * @property {Int32Array|Uint16Array} [layer1]  - Waterlog layer (optional)
 * @property {Array<{name:string, states:object, version:number}>} palette
 * @property {[number,number,number]} dimensions - [SX, SY, SZ]
 * @property {[number,number,number]} [worldOrigin] - [ox, oy, oz] default [0,0,0]
 */

/**
 * @typedef {object} MergeResult
 * @property {Uint16Array} layer0    - Merged flat index array (ZYX)
 * @property {Int32Array}  [layer1]  - Merged waterlog layer (-1 = なし)
 * @property {Array}       palette   - Deduplicated merged palette
 * @property {[number,number,number]} dimensions - [SX, SY, SZ] of merged volume
 * @property {[number,number,number]} worldOrigin - Normalised world origin (always ≥ 0)
 * @property {object}      stats
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Bedrock ZYX flat index (02_TECHNICAL_REFERENCE §2-2). */
const zyx = (x, y, z, SY, SZ) => SZ * SY * x + SZ * y + z;

/**
 * Build a canonical string key for a palette entry for deduplication.
 * Sorts state keys to ensure canonical form regardless of NBT order.
 */
function paletteKey(name, states = {}) {
  const sorted = Object.keys(states).sort()
    .map(k => `${k}=${states[k]}`).join(',');
  return sorted ? `${name}|${sorted}` : name;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge multiple structures into a single unified coordinate space.
 *
 * Algorithm:
 *   1. Compute the bounding box that encompasses all structure world-origins.
 *   2. Shift all origins so the minimum corner is at (0, 0, 0).
 *   3. Allocate a merged volume large enough to hold all structures.
 *   4. For each structure, copy its blocks into the merged volume.
 *      - Air does NOT overwrite existing non-air blocks (layer 0).
 *      - Layer 1 (waterlogging): non-(-1) overwrites.
 *   5. Deduplicate the merged palette.
 *
 * @param {StructureInput[]} structures - Parsed structures to merge
 * @param {object} [opts]
 * @param {boolean} [opts.airOverwrites=false]  - If true, air from a later structure overwrites earlier blocks
 * @param {string}  [opts.airBlockName='minecraft:air'] - Block name considered "air"
 * @returns {MergeResult}
 */
export function mergeStructures(structures, opts = {}) {
  if (!structures || structures.length === 0) {
    throw new Error('mergeStructures: no structures provided');
  }

  if (structures.length === 1) {
    return _wrapSingle(structures[0]);
  }

  const { airOverwrites = false, airBlockName = 'minecraft:air' } = opts;

  // ── Step 1: Resolve world origins (default [0,0,0]) ──────────────────────
  const resolved = structures.map(s => ({
    ...s,
    origin: s.worldOrigin ?? [0, 0, 0],
  }));

  // ── Step 2: Compute merged bounding box ───────────────────────────────────
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const s of resolved) {
    const [ox, oy, oz] = s.origin;
    const [sx, sy, sz] = s.dimensions;
    minX = Math.min(minX, ox);       maxX = Math.max(maxX, ox + sx - 1);
    minY = Math.min(minY, oy);       maxY = Math.max(maxY, oy + sy - 1);
    minZ = Math.min(minZ, oz);       maxZ = Math.max(maxZ, oz + sz - 1);
  }

  // Shift so minimum is at (0, 0, 0)
  const shiftX = -minX, shiftY = -minY, shiftZ = -minZ;
  const MSX = maxX - minX + 1;
  const MSY = maxY - minY + 1;
  const MSZ = maxZ - minZ + 1;
  const total = MSX * MSY * MSZ;

  // ── Step 3: Build merged palette (deduplication) ──────────────────────────
  /** @type {Map<string, number>} canonical key → index in mergedPalette */
  const paletteIndexMap = new Map();
  const mergedPalette   = [];

  // Ensure air is always index 0
  const AIR_KEY = airBlockName;
  paletteIndexMap.set(AIR_KEY, 0);
  mergedPalette.push({ name: airBlockName, states: {}, version: 0 });

  /**
   * Get or create an index in the merged palette for a source palette entry.
   * Returns a per-structure lookup array: srcIdx → mergedIdx.
   */
  function buildIndexMap(palette) {
    if (mergedPalette.length > 0xFFFE) {
      throw new Error(`マージパレットが上限 (65534) を超えました: ${mergedPalette.length} エントリ`);
    }
    const map = new Uint32Array(palette.length);
    for (let i = 0; i < palette.length; i++) {
      const entry = palette[i];
      const name  = entry.name ?? entry.Name ?? airBlockName;
      const key   = paletteKey(name, entry.states ?? {});
      if (paletteIndexMap.has(key)) {
        map[i] = paletteIndexMap.get(key);
      } else {
        const newIdx = mergedPalette.length;
        paletteIndexMap.set(key, newIdx);
        mergedPalette.push({ name, states: entry.states ?? {}, version: entry.version ?? 0 });
        map[i] = newIdx;
      }
    }
    return map;
  }

  // ── Step 4: Allocate merged arrays ────────────────────────────────────────
  // パレットは buildIndexMap で 0xFFFE 上限ガード済みなので Uint16 で十分
  // (JSDoc / _wrapSingle と型を統一し、大型構造でのメモリも半減)
  const mergedLayer0 = new Uint16Array(total); // all air (index 0) by default
  const hasWaterlog  = resolved.some(s => s.layer1 != null);
  const mergedLayer1 = hasWaterlog ? new Int32Array(total).fill(-1) : null;

  // The air palette index in the merged palette is always 0
  const AIR_IDX = 0;

  // ── Step 5: Copy each structure into the merged volume (sparse 走査) ──────
  // 空気ブロック (srcMapsToAir かつ layer1=-1) を早期スキップして座標分解コスト削減
  let overwrittenCount = 0;

  for (const s of resolved) {
    const [ox, oy, oz] = s.origin;
    const [sx, sy, sz] = s.dimensions;
    const indexMap = buildIndexMap(s.palette);

    // 各 source palette index が merged の air にマップされるかを事前計算 (uint8)
    const srcMapsToAir = new Uint8Array(indexMap.length);
    for (let i = 0; i < indexMap.length; i++) {
      if (indexMap[i] === AIR_IDX) srcMapsToAir[i] = 1;
    }

    const layer0 = s.layer0;
    const layer1 = s.layer1 ?? null;
    const total  = sx * sy * sz;
    const syz    = sy * sz;
    const shXOX  = shiftX + ox;
    const shYOY  = shiftY + oy;
    const shZOZ  = shiftZ + oz;

    for (let srcFlat = 0; srcFlat < total; srcFlat++) {
      const srcIdxRaw = layer0[srcFlat];
      const srcIdx    = srcIdxRaw < 0 ? 0 : srcIdxRaw;
      const isAir     = srcMapsToAir[srcIdx];
      const hasWlog   = mergedLayer1 && layer1 && layer1[srcFlat] !== -1;

      // air かつ waterlog なしかつ airOverwrites=false なら何もしない
      if (isAir && !hasWlog && !airOverwrites) continue;

      // flat → (x, y, z) (Bedrock ZYX: srcFlat = SZ*SY*x + SZ*y + z)
      const x = (srcFlat / syz) | 0;
      const rem = srcFlat - x * syz;
      const y = (rem / sz) | 0;
      const z = rem - y * sz;

      const mx = x + shXOX;
      const my = y + shYOY;
      const mz = z + shZOZ;
      const dstFlat = zyx(mx, my, mz, MSY, MSZ);

      if (!isAir || airOverwrites) {
        const mergedIdx = indexMap[srcIdx];
        if (!isAir && mergedLayer0[dstFlat] !== AIR_IDX) overwrittenCount++;
        mergedLayer0[dstFlat] = mergedIdx;
      }

      if (hasWlog) {
        const l1 = layer1[srcFlat];
        mergedLayer1[dstFlat] = indexMap[l1 < 0 ? 0 : l1];
      }
    }
  }

  return {
    layer0:      mergedLayer0,
    layer1:      mergedLayer1 ?? undefined,
    palette:     mergedPalette,
    dimensions:  [MSX, MSY, MSZ],
    worldOrigin: [0, 0, 0],
    stats: {
      structureCount: structures.length,
      paletteSize:    mergedPalette.length,
      totalBlocks:    total,
      overwrittenCount,
    },
  };
}

/**
 * Normalise a single structure's coordinates so the world origin is (0,0,0).
 * Used when only one structure is provided to mergeStructures.
 *
 * @param {StructureInput} s
 * @returns {MergeResult}
 */
function _wrapSingle(s) {
  const origin = s.worldOrigin ?? [0, 0, 0];
  const total  = s.dimensions[0] * s.dimensions[1] * s.dimensions[2];

  // Build a Uint16Array copy (normalise negative indices to 0)
  const layer0 = new Uint16Array(total);
  for (let i = 0; i < total; i++) {
    layer0[i] = s.layer0[i] < 0 ? 0 : s.layer0[i];
  }

  let layer1;
  if (s.layer1) {
    layer1 = new Int32Array(total);
    // "水没なし" マーカーは -1 に統一 (layer0 の負値→0 正規化と同様の防御)
    for (let i = 0; i < total; i++) {
      const v = s.layer1[i];
      layer1[i] = v < 0 ? -1 : v;
    }
  }

  return {
    layer0,
    layer1,
    palette:     s.palette.map(e => ({ ...e })),
    dimensions:  [...s.dimensions],
    worldOrigin: [0, 0, 0],
    stats: {
      structureCount: 1,
      paletteSize:    s.palette.length,
      totalBlocks:    total,
      overwrittenCount: 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: offset bounding box calculation (used by MERGE_STRUCTURES handler)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given an array of { dimensions, worldOrigin } objects, compute the
 * minimum bounding box and the per-structure offset needed to place each
 * structure within it.
 *
 * @param {Array<{ dimensions: number[], worldOrigin?: number[] }>} structures
 * @returns {{
 *   mergedDimensions: [number,number,number],
 *   offsets: [number,number,number][],
 *   worldOrigin: [number,number,number]
 * }}
 */
export function computeMergeLayout(structures) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const s of structures) {
    const [ox, oy, oz] = s.worldOrigin ?? [0, 0, 0];
    const [sx, sy, sz] = s.dimensions;
    minX = Math.min(minX, ox); maxX = Math.max(maxX, ox + sx - 1);
    minY = Math.min(minY, oy); maxY = Math.max(maxY, oy + sy - 1);
    minZ = Math.min(minZ, oz); maxZ = Math.max(maxZ, oz + sz - 1);
  }

  const offsets = structures.map(s => {
    const [ox, oy, oz] = s.worldOrigin ?? [0, 0, 0];
    return [ox - minX, oy - minY, oz - minZ];
  });

  return {
    mergedDimensions: [maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1],
    offsets,
    worldOrigin: [minX, minY, minZ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// P1-C: Bounding Box 正規化 & サイズチェック
// ─────────────────────────────────────────────────────────────────────────────

/**
 * worldOrigins をゼロ基準に正規化する。相対位置（構造間の距離）は保たれる。
 *
 * @param {Array<{x:number,y:number,z:number}>} origins - 各構造のワールド原点
 * @param {Array<{x:number,y:number,z:number}>} dims    - 各構造のサイズ
 * @returns {{ normalizedOrigins: Array<{x,y,z}>, totalBounds: {x,y,z}, minOrigin: {x,y,z} }}
 */
export function normalizeBoundingBox(origins, dims) {
  if (origins.length === 0) {
    return { normalizedOrigins: [], totalBounds: { x: 0, y: 0, z: 0 }, minOrigin: { x: 0, y: 0, z: 0 } };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < origins.length; i++) {
    const o = origins[i];
    const d = dims[i];
    minX = Math.min(minX, o.x);
    minY = Math.min(minY, o.y);
    minZ = Math.min(minZ, o.z);
    maxX = Math.max(maxX, o.x + (d?.x ?? 0));
    maxY = Math.max(maxY, o.y + (d?.y ?? 0));
    maxZ = Math.max(maxZ, o.z + (d?.z ?? 0));
  }

  const totalBounds  = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
  const minOrigin    = { x: minX, y: minY, z: minZ };
  const normalizedOrigins = origins.map(o => ({
    x: o.x - minX,
    y: o.y - minY,
    z: o.z - minZ,
  }));

  return { normalizedOrigins, totalBounds, minOrigin };
}

/** 危険サイズの閾値 */
const MAX_MERGE_VOLUME    = 50_000_000; // 5000万ブロック
const MAX_SINGLE_AXIS     = 2048;       // 一辺の最大

/**
 * マージ実行前のサイズチェック。
 *
 * @param {{ x:number, y:number, z:number }} totalBounds
 * @returns {{ ok: boolean, message?: string, estimatedVolume?: number }}
 */
export function checkMergeSafety(totalBounds) {
  const { x: SX, y: SY, z: SZ } = totalBounds;

  if (SX > MAX_SINGLE_AXIS || SY > MAX_SINGLE_AXIS || SZ > MAX_SINGLE_AXIS) {
    return {
      ok: false,
      message: `構造物が離れすぎています（最大辺 ${Math.max(SX, SY, SZ)} ブロック）。互いの距離を縮めてから再試行してください。`,
      estimatedVolume: SX * SY * SZ,
    };
  }

  const vol = SX * SY * SZ;
  if (vol > MAX_MERGE_VOLUME) {
    const volM = (vol / 1_000_000).toFixed(1);
    return {
      ok: false,
      message: `合体範囲が大きすぎます（推定 ${volM}M ブロック）。構造物の間隔を縮めてください。`,
      estimatedVolume: vol,
    };
  }

  return { ok: true, estimatedVolume: vol };
}
