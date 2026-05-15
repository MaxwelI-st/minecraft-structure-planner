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

  for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
  for (let z = 0; z < SZ; z++) {
    const flat = _zyx(x, y, z, SY, SZ);
    const orig = indices[flat];

    if (isSolid[orig]) {
      // Solid → air
      out[flat] = airIdx;
      solidCount++;
    } else {
      // Air — mark if inside bbox OR adjacent to a solid block
      const insideBBox = hasSolid
        && x >= minX && x <= maxX
        && y >= minY && y <= maxY
        && z >= minZ && z <= maxZ;

      const adjSolid = hasSolid && FACE_OFFSETS.some(([dx, dy, dz]) => {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx < 0 || nx >= SX || ny < 0 || ny >= SY || nz < 0 || nz >= SZ) return false;
        return isSolid[indices[_zyx(nx, ny, nz, SY, SZ)]];
      });

      if (insideBBox || adjSolid) {
        out[flat] = markerIdx;
        markerCount++;
      } else {
        out[flat] = airIdx;
        airCount++;
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
  const out          = new Uint16Array(indices);
  const savedBlocks  = new Map();
  let   replacedCount = 0;

  for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
  for (let z = 0; z < SZ; z++) {
    const flat = _zyx(x, y, z, SY, SZ);
    const orig = indices[flat];

    // Skip air and already-cheap blocks
    const name = workPalette[orig]?.name ?? workPalette[orig]?.Name ?? '';
    if (!isOpaque[orig]) continue;
    if (name === fillName) continue;

    // Never hollow blocks with special data (chests, spawners, etc.)
    if (preserveBlockEntities && isBlockEntity[orig]) continue;

    // Never hollow boundary blocks (any neighbour is out-of-bounds)
    let onBoundary = false;
    for (const [dx, dy, dz] of FACE_OFFSETS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nx < 0 || nx >= SX || ny < 0 || ny >= SY || nz < 0 || nz >= SZ) {
        onBoundary = true;
        break;
      }
    }
    if (onBoundary) continue;

    // Fully enclosed = all 6 neighbours are opaque
    const allOpaque = FACE_OFFSETS.every(([dx, dy, dz]) => {
      const ni = _zyx(x + dx, y + dy, z + dz, SY, SZ);
      return isOpaque[indices[ni]];
    });

    if (allOpaque) {
      out[flat] = fillIdx;
      replacedCount++;
      savedBlocks.set(name, (savedBlocks.get(name) ?? 0) + 1);
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

/**
 * Detect positions where a light source is hidden under a concealing block
 * and replace the concealer with a luminous block.
 *
 * Concealment patterns:
 *   - minecraft:carpet (any colour) at Y → place light at Y (under carpet)
 *   - minecraft:stone_slab / stone_block_slab with type=bottom at Y → light at same Y
 *
 * @param {Uint16Array|Int32Array}    indices
 * @param {Array<{name:string, states:object}>} palette
 * @param {number}  SX
 * @param {number}  SY
 * @param {number}  SZ
 * @param {object}  [opts]
 * @param {string}  [opts.lightBlock='minecraft:shroomlight'] - Replacement light source
 * @returns {{
 *   indices: Uint16Array,
 *   palette: Array,
 *   stats: { patchCount: number, patches: Array<{x,y,z,original}> }
 * }}
 */
export function applyLightPatch(indices, palette, SX, SY, SZ, opts = {}) {
  const lightName = opts.lightBlock ?? 'minecraft:shroomlight';

  const workPalette = palette.map(e => ({ ...e }));
  const lightIdx    = _ensurePaletteEntry(workPalette, lightName, {});

  const out     = new Uint16Array(indices);
  const patches = [];

  for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
  for (let z = 0; z < SZ; z++) {
    const flat  = _zyx(x, y, z, SY, SZ);
    const entry = workPalette[indices[flat]];
    const name  = entry?.name ?? entry?.Name ?? '';
    const states = entry?.states ?? entry?.Properties ?? {};

    let shouldPatch = false;

    // Carpet: any colour variant (Bedrock: minecraft:carpet, Java: minecraft:*_carpet)
    if (name.endsWith(':carpet') || name.endsWith('_carpet')) {
      shouldPatch = true;
    }

    // Bottom slab: conceals light at same Y level
    if ((name.includes('slab') || name.includes('stone_block_slab'))
      && (states.type === 'bottom' || states.stone_slab_type === 'bottom'
          || states.top_slot_bit === 0 || states.top_slot_bit === false)) {
      shouldPatch = true;
    }

    if (shouldPatch) {
      const original = name;
      out[flat] = lightIdx;
      patches.push({ x, y, z, original });
    }
  }

  return {
    indices: out,
    palette: workPalette,
    stats:   { patchCount: patches.length, patches },
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
