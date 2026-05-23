/**
 * invert.js — Data Hack: Invert (Excavation Guide) + Hollow-Out Engine
 *
 * Two distinct but related operations (02_TECHNICAL_REFERENCE §7, 03_TODO §3-B):
 *
 * 1. invertStructure() — "Excavation Guide" mode
 *    Swap solid ↔ air so you can load the inverted structure into a flat
 *    creative world, TNT-dupe or quarry-mine it out, then build in the
 *    resulting cavity in Survival. Solid→air, in-bbox-air→glowstone.
 *
 * 2. hollowOut() — "Haribote" (ハリボテ化) mode
 *    Replace fully-enclosed interior blocks with a cheap fill material
 *    (dirt, gravel) to reduce material cost without changing the exterior.
 *    Reports cost savings.
 *
 * Both run inside process.worker.js on a Uint16Array section — no DOM deps.
 * Pure functions: take index arrays + palette, return new index arrays.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Marker block used to indicate "air in original" in excavation guide. */
const INVERT_MARKER_NAME = 'minecraft:glowstone';

/** Default cheap fill block for hollow-out (visible when structure is broken). */
const HOLLOW_FILL_NAME = 'minecraft:dirt';

/** Java block names considered "transparent" (not fully opaque for culling). */
const TRANSPARENT_NAMES = new Set([
  'minecraft:air', 'minecraft:cave_air', 'minecraft:void_air',
  'minecraft:glass', 'minecraft:glass_pane', 'minecraft:iron_bars',
  'minecraft:oak_door', 'minecraft:spruce_door', 'minecraft:birch_door',
  'minecraft:jungle_door', 'minecraft:acacia_door', 'minecraft:dark_oak_door',
  'minecraft:crimson_door', 'minecraft:warped_door',
  'minecraft:oak_trapdoor', 'minecraft:spruce_trapdoor',
  'minecraft:water', 'minecraft:lava',
  'minecraft:torch', 'minecraft:wall_torch', 'minecraft:soul_torch',
  'minecraft:lantern', 'minecraft:soul_lantern',
  'minecraft:ladder', 'minecraft:vine',
  'minecraft:oak_fence', 'minecraft:spruce_fence', 'minecraft:birch_fence',
  'minecraft:jungle_fence', 'minecraft:acacia_fence', 'minecraft:dark_oak_fence',
  'minecraft:nether_brick_fence', 'minecraft:crimson_fence', 'minecraft:warped_fence',
  'minecraft:oak_fence_gate', 'minecraft:spruce_fence_gate',
  'minecraft:oak_sapling', 'minecraft:grass', 'minecraft:tall_grass',
  'minecraft:snow', 'minecraft:carpet',
]);

/** Face neighbour offsets: +X,-X,+Y,-Y,+Z,-Z */
const FACE_OFFSETS = [
  [1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],
];

// ─────────────────────────────────────────────────────────────────────────────
// invertStructure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate an excavation guide by swapping solid blocks and air blocks.
 *
 * Algorithm (02_TECHNICAL_REFERENCE §7):
 *   1. Build bounding box from non-air blocks.
 *   2. Solid → air (palette index 0, assumed to be minecraft:air).
 *   3. Air inside bbox OR adjacent to a solid → marker block (glowstone).
 *   4. Air outside bbox with no solid neighbours → stays air (prevents cube bloat).
 *
 * @param {Uint16Array|Int32Array} indices  - Flat block index array (any coordinate order)
 * @param {Array<{name:string}>}   palette  - Block palette (index 0 = air assumed)
 * @param {number}                 SX
 * @param {number}                 SY
 * @param {number}                 SZ
 * @param {object}                 [opts]
 * @param {string} [opts.markerBlock=INVERT_MARKER_NAME] - Block name for air positions
 * @returns {{
 *   indices: Uint16Array,
 *   palette: Array<{name:string}>,
 *   stats: { solidCount, airCount, markerCount, bbox }
 * }}
 */
export function invertStructure(indices, palette, SX, SY, SZ, opts = {}) {
  const markerName = opts.markerBlock ?? INVERT_MARKER_NAME;

  // ── Build working palette with air + marker guaranteed ───────────────────
  const workPalette = palette.map(e => ({ ...e }));

  const airIdx    = _ensurePaletteEntry(workPalette, 'minecraft:air', {});
  const markerIdx = _ensurePaletteEntry(workPalette, markerName, {});

  // ── Identify solid indices (non-air palette entries) ─────────────────────
  const isSolid = new Uint8Array(workPalette.length); // 1 = solid, 0 = transparent
  for (let i = 0; i < workPalette.length; i++) {
    const name = workPalette[i].name ?? workPalette[i].Name ?? '';
    isSolid[i] = (name !== 'minecraft:air' && name !== 'minecraft:cave_air'
               && name !== 'minecraft:void_air') ? 1 : 0;
  }

  // ── Compute bounding box of solid blocks ─────────────────────────────────
  let minX = SX, minY = SY, minZ = SZ;
  let maxX = -1, maxY = -1, maxZ = -1;

  for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
  for (let z = 0; z < SZ; z++) {
    const idx = _zyx(x, y, z, SY, SZ);
    if (isSolid[indices[idx]]) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }

  const bbox = { minX, minY, minZ, maxX, maxY, maxZ };
  const hasSolid = maxX >= 0;

  // ── Build inverted index array ────────────────────────────────────────────
  const out = new Uint16Array(SX * SY * SZ);
  let solidCount = 0, airCount = 0, markerCount = 0;
  const stride_x = SY * SZ; // _zyx(x,y,z) = SY*SZ*x + SZ*y + z

  for (let x = 0; x < SX; x++) {
    const insideX = hasSolid && x >= minX && x <= maxX;
    const flatX = stride_x * x;
    for (let y = 0; y < SY; y++) {
      const insideXY = insideX && y >= minY && y <= maxY;
      const flatXY = flatX + SZ * y;
      for (let z = 0; z < SZ; z++) {
        const flat = flatXY + z;
        const orig = indices[flat];

        if (isSolid[orig]) {
          out[flat] = airIdx;
          solidCount++;
          continue;
        }

        // Air — mark if inside bbox OR adjacent to a solid block
        const insideBBox = insideXY && z >= minZ && z <= maxZ;

        let adjSolid = false;
        if (hasSolid && !insideBBox) {
          // unrolled neighbour check (+X, -X, +Y, -Y, +Z, -Z)
          if (x + 1 < SX && isSolid[indices[flat + stride_x]]) adjSolid = true;
          else if (x - 1 >= 0 && isSolid[indices[flat - stride_x]]) adjSolid = true;
          else if (y + 1 < SY && isSolid[indices[flat + SZ]]) adjSolid = true;
          else if (y - 1 >= 0 && isSolid[indices[flat - SZ]]) adjSolid = true;
          else if (z + 1 < SZ && isSolid[indices[flat + 1]]) adjSolid = true;
          else if (z - 1 >= 0 && isSolid[indices[flat - 1]]) adjSolid = true;
        }

        if (insideBBox || adjSolid) {
          out[flat] = markerIdx;
          markerCount++;
        } else {
          out[flat] = airIdx;
          airCount++;
        }
      }
    }
  }

  return {
    indices:  out,
    palette:  workPalette,
    stats:    { solidCount, airCount, markerCount, bbox },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// hollowOut
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replace fully-enclosed interior blocks with a cheap fill material,
 * preserving the exterior shell exactly.
 *
 * "Fully enclosed" = all 6 face neighbours (±X, ±Y, ±Z) are opaque (non-transparent).
 * Blocks at the structure boundary (any neighbour is out-of-bounds) are NEVER replaced —
 * they are always part of the visible exterior shell.
 *
 * @param {Uint16Array|Int32Array} indices
 * @param {Array<{name:string}>}   palette
 * @param {number}                 SX
 * @param {number}                 SY
 * @param {number}                 SZ
 * @param {object}                 [opts]
 * @param {string}  [opts.fillBlock=HOLLOW_FILL_NAME] - Cheap replacement block
 * @param {boolean} [opts.preserveBlockEntities=true] - Skip chests, furnaces, etc.
 * @returns {{
 *   indices: Uint16Array,
 *   palette: Array<{name:string}>,
 *   stats: {
 *     replacedCount: number,
 *     savedBlocks: Map<string, number>,   -- original block name → count replaced
 *     fillBlock: string
 *   }
 * }}
 */
export function hollowOut(indices, palette, SX, SY, SZ, opts = {}) {
  const fillName            = opts.fillBlock ?? HOLLOW_FILL_NAME;
  const preserveBlockEntities = opts.preserveBlockEntities ?? true;

  const workPalette = palette.map(e => ({ ...e }));
  const fillIdx     = _ensurePaletteEntry(workPalette, fillName, {});

  // ── Classify each palette entry ───────────────────────────────────────────
  // isOpaque[i] = 1 if palette[i] is a fully opaque solid (blocks neighbour light)
  const isOpaque = new Uint8Array(workPalette.length);
  const isBlockEntity = new Uint8Array(workPalette.length);

  for (let i = 0; i < workPalette.length; i++) {
    const name = workPalette[i].name ?? workPalette[i].Name ?? '';
    isOpaque[i]      = TRANSPARENT_NAMES.has(name) ? 0 : 1;
    isBlockEntity[i] = _isBlockEntity(name) ? 1 : 0;
  }

  // ── Main pass: mark blocks eligible for replacement ───────────────────────
  // 外側1層は必ず境界 → 走査範囲を [1..SX-2] 等に縮小 + 隣接判定は unroll
  const out          = new Uint16Array(indices);
  const savedBlocks  = new Map();
  let   replacedCount = 0;
  const stride_x = SY * SZ;

  // Pre-compute name lookup table (avoid hash lookups per cell)
  const paletteName = new Array(workPalette.length);
  for (let i = 0; i < workPalette.length; i++) {
    paletteName[i] = workPalette[i]?.name ?? workPalette[i]?.Name ?? '';
  }

  // 1層以下なら処理不能（境界のみ）
  if (SX >= 3 && SY >= 3 && SZ >= 3) {
    for (let x = 1; x < SX - 1; x++) {
      const flatX = stride_x * x;
      for (let y = 1; y < SY - 1; y++) {
        const flatXY = flatX + SZ * y;
        for (let z = 1; z < SZ - 1; z++) {
          const flat = flatXY + z;
          const orig = indices[flat];

          if (!isOpaque[orig]) continue;
          if (preserveBlockEntities && isBlockEntity[orig]) continue;
          const name = paletteName[orig];
          if (name === fillName) continue;

          // 6 隣接の opaque 判定 (内部セルなので境界チェック不要)
          if (!isOpaque[indices[flat + stride_x]]) continue;
          if (!isOpaque[indices[flat - stride_x]]) continue;
          if (!isOpaque[indices[flat + SZ]]) continue;
          if (!isOpaque[indices[flat - SZ]]) continue;
          if (!isOpaque[indices[flat + 1]]) continue;
          if (!isOpaque[indices[flat - 1]]) continue;

          out[flat] = fillIdx;
          replacedCount++;
          savedBlocks.set(name, (savedBlocks.get(name) ?? 0) + 1);
        }
      }
    }
  }

  return {
    indices:  out,
    palette:  workPalette,
    stats:    { replacedCount, savedBlocks, fillBlock: fillName },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Light-Patch: hidden light source detection (02_TECHNICAL_REFERENCE §5-2)
// ─────────────────────────────────────────────────────────────────────────────

// 光源と判定するブロック名セット（光レベル 7 以上）
const LIGHT_SOURCE_NAMES = new Set([
  'minecraft:glowstone', 'minecraft:shroomlight', 'minecraft:sea_lantern',
  'minecraft:beacon', 'minecraft:conduit', 'minecraft:end_rod',
  'minecraft:lantern', 'minecraft:soul_lantern',
  'minecraft:torch', 'minecraft:wall_torch', 'minecraft:soul_torch',
  'minecraft:jack_o_lantern', 'minecraft:lit_pumpkin',
  'minecraft:redstone_lamp', 'minecraft:lit_redstone_lamp',
  'minecraft:magma_block', 'minecraft:campfire', 'minecraft:soul_campfire',
  'minecraft:crying_obsidian',
]);

/** 上付きハーフスラブの代表ブロック（木材）*/
const TOP_SLAB_NAME = 'minecraft:oak_slab';

/**
 * 湧き潰しパッチ適用 + 暗所検出。
 *
 * 処理1: 既存のカーペット・下付きスラブを光源ブロックに置換（従来動作）
 * 処理2: 光源から 7 ブロック以上離れた床面(y=groundFloor)の暗所を検出し
 *        "上付きスラブ + 光源" パターンを生成（地面付近のみ）
 *
 * @param {Uint16Array|Int32Array}            indices
 * @param {Array<{name:string, states:object}>} palette
 * @param {number}  SX
 * @param {number}  SY
 * @param {number}  SZ
 * @param {object}  [opts]
 * @param {string}  [opts.lightBlock='minecraft:shroomlight']
 * @param {boolean} [opts.detectDarkSpots=true]  暗所自動検出
 * @param {number}  [opts.lightRadius=7]         光源カバー半径(Chebyshev)
 * @param {number}  [opts.groundFloorThreshold=2] 地面から何段までスラブ置換を許可するか
 * @returns {{
 *   indices: Uint16Array,
 *   palette: Array,
 *   stats: { patchCount: number, slabPatternCount: number, patches: Array }
 * }}
 */
export function applyLightPatch(indices, palette, SX, SY, SZ, opts = {}) {
  const lightName     = opts.lightBlock          ?? 'minecraft:shroomlight';
  const detectDark    = opts.detectDarkSpots      ?? true;
  const lightRadius   = opts.lightRadius          ?? 7;
  const groundThresh  = opts.groundFloorThreshold ?? 2;

  const workPalette = palette.map(e => ({ ...e }));
  const lightIdx    = _ensurePaletteEntry(workPalette, lightName, {});
  const topSlabIdx  = _ensurePaletteEntry(workPalette, TOP_SLAB_NAME,
                        { type: 'top', top_slot_bit: true });

  const AIR_NAMES = new Set([
    'minecraft:air', 'minecraft:cave_air', 'minecraft:void_air',
  ]);

  // ── パレットのビット配列を事前構築 ────────────────────────────────────────
  const isAirPal    = new Uint8Array(workPalette.length);
  const isSolidPal  = new Uint8Array(workPalette.length);
  const isLightPal  = new Uint8Array(workPalette.length);
  for (let i = 0; i < workPalette.length; i++) {
    const n = workPalette[i].name ?? workPalette[i].Name ?? '';
    isAirPal[i]   = AIR_NAMES.has(n) ? 1 : 0;
    isSolidPal[i] = (!AIR_NAMES.has(n) && !TRANSPARENT_NAMES.has(n)) ? 1 : 0;
    isLightPal[i] = LIGHT_SOURCE_NAMES.has(n) ? 1 : 0;
  }

  const out     = new Uint16Array(indices);
  const patches = [];

  // ── 処理1: カーペット / 下付きスラブ → 光源に置換 ─────────────────────────
  for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
  for (let z = 0; z < SZ; z++) {
    const flat   = _zyx(x, y, z, SY, SZ);
    const entry  = workPalette[indices[flat]];
    const name   = entry?.name ?? entry?.Name ?? '';
    const states = entry?.states ?? entry?.Properties ?? {};

    let shouldPatch = false;
    if (name.endsWith(':carpet') || name.endsWith('_carpet')) shouldPatch = true;
    if ((name.includes('slab') || name.includes('stone_block_slab'))
      && (states.type === 'bottom' || states.stone_slab_type === 'bottom'
          || states.top_slot_bit === 0 || states.top_slot_bit === false)) {
      shouldPatch = true;
    }
    if (shouldPatch) {
      out[flat] = lightIdx;
      patches.push({ x, y, z, original: name, patternType: 'replace' });
    }
  }

  // ── 処理2: 暗所検出 → 上付きスラブ + 光源パターン ────────────────────────
  let slabPatternCount = 0;
  if (detectDark) {
    // 構造の最低Y（地面レベル）を検出
    let minFloorY = SY;
    for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
    for (let z = 0; z < SZ; z++) {
      if (isSolidPal[out[_zyx(x, y, z, SY, SZ)]]) {
        if (y < minFloorY) minFloorY = y;
      }
    }

    // 既存光源の座標セットを構築（Chebyshev 距離判定用）
    const lightCoords = [];
    for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
    for (let z = 0; z < SZ; z++) {
      if (isLightPal[out[_zyx(x, y, z, SY, SZ)]]) lightCoords.push([x, y, z]);
    }

    // 光源カバー済みか判定（Chebyshev距離 ≤ lightRadius なら明るい）
    const isCovered = (cx, cy, cz) => {
      for (const [lx, ly, lz] of lightCoords) {
        if (Math.max(Math.abs(cx-lx), Math.abs(cy-ly), Math.abs(cz-lz)) <= lightRadius) return true;
      }
      return false;
    };

    // 地面付近（minFloorY ≤ y ≤ minFloorY + groundThresh）の床面を走査
    for (let x = 0; x < SX; x++)
    for (let y = minFloorY; y <= Math.min(minFloorY + groundThresh, SY - 1); y++)
    for (let z = 0; z < SZ; z++) {
      const flat = _zyx(x, y, z, SY, SZ);
      if (!isAirPal[out[flat]]) continue;              // 空気でなければスキップ

      // 真下が固体ブロック（床面）かチェック
      if (y === 0) continue;
      const belowFlat = _zyx(x, y - 1, z, SY, SZ);
      if (!isSolidPal[out[belowFlat]]) continue;       // 床なし

      // 既にカバー済みならスキップ
      if (isCovered(x, y, z)) continue;

      // y-2 が構造内かつ固体なら上付きスラブ + 光源パターンが使える
      // パターン: (x, y-1) → top_slab, (x, y-2) → lightBlock
      if (y - 2 >= 0 && isSolidPal[out[_zyx(x, y - 2, z, SY, SZ)]]) {
        const slabFlat  = _zyx(x, y - 1, z, SY, SZ);
        const lightFlat = _zyx(x, y - 2, z, SY, SZ);
        out[slabFlat]  = topSlabIdx;
        out[lightFlat] = lightIdx;
        patches.push({ x, y: y - 2, z, original: workPalette[indices[lightFlat]]?.name ?? '', patternType: 'slab_under' });
        lightCoords.push([x, y - 2, z]); // カバー範囲を更新
        slabPatternCount++;
      } else {
        // フォールバック: 床の上に直接光源を置く
        out[belowFlat] = lightIdx;
        patches.push({ x, y: y - 1, z, original: workPalette[indices[belowFlat]]?.name ?? '', patternType: 'direct' });
        lightCoords.push([x, y - 1, z]);
      }
    }
  }

  return {
    indices: out,
    palette: workPalette,
    stats:   { patchCount: patches.length, slabPatternCount, patches },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bedrock ZYX flat index: SZ*SY*x + SZ*y + z
 * (02_TECHNICAL_REFERENCE §2-2)
 */
function _zyx(x, y, z, SY, SZ) {
  return SZ * SY * x + SZ * y + z;
}

/**
 * Ensure a palette entry exists; return its index.
 * If already present, returns the existing index.
 * If not present, appends and returns the new index.
 */
function _ensurePaletteEntry(palette, name, states) {
  for (let i = 0; i < palette.length; i++) {
    const n = palette[i].name ?? palette[i].Name ?? '';
    if (n === name) return i;
  }
  palette.push({ name, Name: name, states: states ?? {}, Properties: states ?? {} });
  return palette.length - 1;
}

/**
 * Returns true for blocks that have associated block entity data
 * and should never be replaced during hollow-out.
 */
function _isBlockEntity(name) {
  return (
    name.includes('chest')     ||
    name.includes('furnace')   ||
    name.includes('spawner')   ||
    name.includes('barrel')    ||
    name.includes('hopper')    ||
    name.includes('dropper')   ||
    name.includes('dispenser') ||
    name.includes('shulker')   ||
    name.includes('lectern')   ||
    name.includes('beacon')    ||
    name.includes('jukebox')   ||
    name.includes('enchanting') ||
    name.includes('brewing')   ||
    name.includes('command')   ||
    name.includes('skull')     ||
    name.includes('banner')    ||
    name.includes('sign')
  );
}
