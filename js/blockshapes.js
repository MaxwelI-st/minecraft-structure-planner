/**
 * blockshapes.js — Block Shape Classification & Geometry Resolution
 *
 * Provides shape metadata for 3D rendering:
 *   classifyShape(blockId, states)                          → shape type string
 *   resolveGeometry(THREE, blockId, states, neighbors, nb)  → BufferGeometry or null
 *   _getState(states, key)                                  → raw state value helper
 *   _isTrue(val)                                            → boolean normaliser
 *
 * 2026-05-15: Bedrock/Java 両形式の state を統一的に扱うため
 *   `render/state-reader.js` を新規追加し、各 builder で使用するように改修。
 */

import {
  readSlabType, readTrapdoorFacing, readTrapdoorHalf, readTrapdoorOpen,
  readStairsFacing, readStairsHalf, readDoorFacing, readDoorHalf,
  readDoorOpen, readDoorHinge, readFenceGateFacing, readFenceGateOpen,
  readFenceConnections, readWallConnections, readAxis, readFacing6, readHanging,
  readRailShape,
} from './render/state-reader.js';

// ─────────────────────────────────────────────────────────────────────────────
// State helpers (used by resourcepack.js and viewer3d.js)
// ─────────────────────────────────────────────────────────────────────────────

export function _getState(states, key) {
  return states?.[key];
}

export function _isTrue(val) {
  if (val === true  || val === 1 || val === '1' || val === 'true')  return true;
  if (val === false || val === 0 || val === '0' || val === 'false') return false;
  return Boolean(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape classification
// ─────────────────────────────────────────────────────────────────────────────

export const SHAPES = Object.freeze({
  CUBE:           'cube',
  STAIRS:         'stairs',
  SLAB:           'slab',
  DOOR:           'door',
  TRAPDOOR:       'trapdoor',
  FENCE:          'fence',
  FENCE_GATE:     'fence_gate',
  WALL:           'wall',
  PANE:           'pane',
  BUTTON:         'button',
  LEVER:          'lever',
  TORCH:          'torch',
  CROSS:          'cross',
  CARPET:         'carpet',
  SNOW_LAYER:     'snow_layer',
  PRESSURE_PLATE: 'pressure_plate',
  RAIL:           'rail',
  BED:            'bed',
  SIGN:           'sign',
  WALL_SIGN:      'wall_sign',
  HANGING_SIGN:   'hanging_sign',
  SKULL:          'skull',
  CANDLE:         'candle',
  LANTERN:        'lantern',
  END_ROD:        'end_rod',
  CHAIN:          'chain',
  CAMPFIRE:       'campfire',
  FLOWER_POT:     'flower_pot',
  FRAME:          'frame',
  LIQUID:         'liquid',
  HOPPER:         'hopper',
  ANVIL:          'anvil',
  SCAFFOLDING:    'scaffolding',
  LADDER:         'ladder',
  SHELF:          'shelf',
  AIR:            'air',
  REDSTONE_DUST:  'redstone_dust', // M-V-1 (赤い薄板 + 隣接接続)
  REPEATER:       'repeater',      // M-V-1 (薄 slab + 2 トーチ)
  COMPARATOR:     'comparator',    // M-V-1 (薄 slab + 3 トーチ)
  PISTON:         'piston',        // M-V-1 (ヘッド面マーカー付きキューブ)
  OBSERVER:       'observer',      // M-V-1 (顔面マーカー付きキューブ)
  DISPENSER:      'dispenser',     // M-V-1 (出口マーカー付きキューブ)
});

const _SUFFIX_SHAPE = [
  ['_wall_hanging_sign',SHAPES.HANGING_SIGN],
  ['_hanging_sign',     SHAPES.HANGING_SIGN],
  ['_wall_sign',        SHAPES.WALL_SIGN],
  ['_sign',             SHAPES.SIGN],
  ['_wall_skull',       SHAPES.SKULL],
  ['_wall_head',        SHAPES.SKULL],
  ['_skull',            SHAPES.SKULL],
  ['_head',             SHAPES.SKULL],
  ['_stairs',           SHAPES.STAIRS],
  ['_slab',             SHAPES.SLAB],
  ['_door',             SHAPES.DOOR],
  ['_trapdoor',         SHAPES.TRAPDOOR],
  ['_fence_gate',       SHAPES.FENCE_GATE],
  ['_fence',            SHAPES.FENCE],
  ['_wall',             SHAPES.WALL],
  ['_pane',             SHAPES.PANE],
  ['_button',           SHAPES.BUTTON],
  ['_pressure_plate',   SHAPES.PRESSURE_PLATE],
  ['_carpet',           SHAPES.CARPET],
  ['_bed',              SHAPES.BED],
  ['_candle',           SHAPES.CANDLE],
  ['_sapling',          SHAPES.CROSS],
  ['_leaves',           SHAPES.CUBE],
  ['_coral_fan',        SHAPES.CROSS],
  ['_coral_wall_fan',   SHAPES.CROSS],
  ['_coral',            SHAPES.CROSS],
  ['_amethyst_cluster', SHAPES.CROSS],
  ['_mushroom_block',   SHAPES.CUBE],
];

const _NAME_SHAPE = new Map([
  ['minecraft:air',               SHAPES.AIR],
  ['minecraft:cave_air',          SHAPES.AIR],
  ['minecraft:void_air',          SHAPES.AIR],
  ['minecraft:water',             SHAPES.LIQUID],
  ['minecraft:flowing_water',     SHAPES.LIQUID],
  ['minecraft:lava',              SHAPES.LIQUID],
  ['minecraft:flowing_lava',      SHAPES.LIQUID],
  ['minecraft:iron_bars',         SHAPES.PANE],
  ['minecraft:glass_pane',        SHAPES.PANE],
  ['minecraft:chain',             SHAPES.CHAIN],
  ['minecraft:torch',             SHAPES.TORCH],
  ['minecraft:wall_torch',        SHAPES.TORCH],
  ['minecraft:soul_torch',        SHAPES.TORCH],
  ['minecraft:soul_wall_torch',   SHAPES.TORCH],
  ['minecraft:redstone_torch',    SHAPES.TORCH],
  ['minecraft:redstone_wall_torch', SHAPES.TORCH],
  ['minecraft:lever',             SHAPES.LEVER],
  ['minecraft:snow',              SHAPES.SNOW_LAYER],
  ['minecraft:grass',             SHAPES.CROSS],
  ['minecraft:tall_grass',        SHAPES.CROSS],
  ['minecraft:short_grass',       SHAPES.CROSS],
  ['minecraft:fern',              SHAPES.CROSS],
  ['minecraft:large_fern',        SHAPES.CROSS],
  ['minecraft:dead_bush',         SHAPES.CROSS],
  ['minecraft:vine',              SHAPES.CROSS],
  ['minecraft:glow_lichen',       SHAPES.CROSS],
  ['minecraft:cobweb',            SHAPES.CROSS],
  ['minecraft:sugar_cane',        SHAPES.CROSS],
  ['minecraft:cactus',            SHAPES.CROSS],
  ['minecraft:bamboo',            SHAPES.CROSS],
  ['minecraft:kelp',              SHAPES.CROSS],
  ['minecraft:kelp_plant',        SHAPES.CROSS],
  ['minecraft:seagrass',          SHAPES.CROSS],
  ['minecraft:tall_seagrass',     SHAPES.CROSS],
  ['minecraft:sweet_berry_bush',  SHAPES.CROSS],
  ['minecraft:torchflower',       SHAPES.CROSS],
  ['minecraft:pitcher_plant',     SHAPES.CROSS],
  ['minecraft:brown_mushroom',    SHAPES.CROSS],
  ['minecraft:red_mushroom',      SHAPES.CROSS],
  ['minecraft:nether_sprouts',    SHAPES.CROSS],
  ['minecraft:crimson_roots',     SHAPES.CROSS],
  ['minecraft:warped_roots',      SHAPES.CROSS],
  ['minecraft:hanging_roots',     SHAPES.CROSS],
  ['minecraft:cave_vines',        SHAPES.CROSS],
  ['minecraft:cave_vines_plant',  SHAPES.CROSS],
  ['minecraft:twisting_vines',    SHAPES.CROSS],
  ['minecraft:twisting_vines_plant', SHAPES.CROSS],
  ['minecraft:weeping_vines',     SHAPES.CROSS],
  ['minecraft:weeping_vines_plant', SHAPES.CROSS],
  ['minecraft:spore_blossom',     SHAPES.CROSS],
  ['minecraft:azalea',            SHAPES.CROSS],
  ['minecraft:flowering_azalea',  SHAPES.CROSS],
  ['minecraft:sunflower',         SHAPES.CROSS],
  ['minecraft:lilac',             SHAPES.CROSS],
  ['minecraft:rose_bush',         SHAPES.CROSS],
  ['minecraft:peony',             SHAPES.CROSS],
  ['minecraft:big_dripleaf',      SHAPES.CROSS],
  ['minecraft:small_dripleaf',    SHAPES.CROSS],
  ['minecraft:moss_carpet',       SHAPES.CARPET],
  ['minecraft:pink_petals',       SHAPES.CROSS],
  ['minecraft:frogspawn',         SHAPES.CROSS],
  ['minecraft:chorus_plant',      SHAPES.CROSS],
  ['minecraft:chorus_flower',     SHAPES.CROSS],
  ['minecraft:ladder',            SHAPES.WALL_SIGN],
  ['minecraft:rail',              SHAPES.RAIL],
  ['minecraft:powered_rail',      SHAPES.RAIL],
  ['minecraft:detector_rail',     SHAPES.RAIL],
  ['minecraft:activator_rail',    SHAPES.RAIL],
  // Redstone 系 (M-V-1)
  ['minecraft:redstone_wire',     SHAPES.REDSTONE_DUST],
  ['minecraft:repeater',          SHAPES.REPEATER],
  ['minecraft:unpowered_repeater',SHAPES.REPEATER],
  ['minecraft:powered_repeater',  SHAPES.REPEATER],
  ['minecraft:comparator',        SHAPES.COMPARATOR],
  ['minecraft:unpowered_comparator', SHAPES.COMPARATOR],
  ['minecraft:powered_comparator',SHAPES.COMPARATOR],
  // 方向性ブロック (前面マーカー付きキューブ — 回転で向きが見える)
  ['minecraft:piston',            SHAPES.PISTON],
  ['minecraft:sticky_piston',     SHAPES.PISTON],
  ['minecraft:observer',          SHAPES.OBSERVER],
  ['minecraft:dispenser',         SHAPES.DISPENSER],
  ['minecraft:dropper',           SHAPES.DISPENSER],
  ['minecraft:crafter',           SHAPES.DISPENSER],
  ['minecraft:stone_pressure_plate',           SHAPES.PRESSURE_PLATE],
  ['minecraft:polished_blackstone_pressure_plate', SHAPES.PRESSURE_PLATE],
  ['minecraft:light_weighted_pressure_plate',  SHAPES.PRESSURE_PLATE],
  ['minecraft:heavy_weighted_pressure_plate',  SHAPES.PRESSURE_PLATE],
  ['minecraft:candle',            SHAPES.CANDLE],
  ['minecraft:lantern',           SHAPES.LANTERN],
  ['minecraft:soul_lantern',      SHAPES.LANTERN],
  ['minecraft:campfire',          SHAPES.CAMPFIRE],
  ['minecraft:soul_campfire',     SHAPES.CAMPFIRE],
  ['minecraft:end_rod',           SHAPES.END_ROD],
  ['minecraft:lightning_rod',     SHAPES.END_ROD],
  ['minecraft:flower_pot',        SHAPES.FLOWER_POT],
  ['minecraft:ladder',            SHAPES.LADDER],
  ['minecraft:bookshelf',         SHAPES.CUBE],
  ['minecraft:chiseled_bookshelf',SHAPES.CUBE],
  ['minecraft:item_frame',        SHAPES.FRAME],
  ['minecraft:glow_item_frame',   SHAPES.FRAME],
  ['minecraft:painting',          SHAPES.FRAME],
  ['minecraft:hopper',            SHAPES.HOPPER],
  ['minecraft:anvil',             SHAPES.ANVIL],
  ['minecraft:chipped_anvil',     SHAPES.ANVIL],
  ['minecraft:damaged_anvil',     SHAPES.ANVIL],
  ['minecraft:scaffolding',       SHAPES.SCAFFOLDING],
  ['minecraft:oak_sign',          SHAPES.SIGN],
  ['minecraft:spruce_sign',       SHAPES.SIGN],
  ['minecraft:birch_sign',        SHAPES.SIGN],
  ['minecraft:jungle_sign',       SHAPES.SIGN],
  ['minecraft:acacia_sign',       SHAPES.SIGN],
  ['minecraft:dark_oak_sign',     SHAPES.SIGN],
  ['minecraft:mangrove_sign',     SHAPES.SIGN],
  ['minecraft:cherry_sign',       SHAPES.SIGN],
  ['minecraft:bamboo_sign',       SHAPES.SIGN],
  ['minecraft:crimson_sign',      SHAPES.SIGN],
  ['minecraft:warped_sign',       SHAPES.SIGN],
  ['minecraft:skeleton_skull',    SHAPES.SKULL],
  ['minecraft:wither_skeleton_skull', SHAPES.SKULL],
  ['minecraft:zombie_head',       SHAPES.SKULL],
  ['minecraft:player_head',       SHAPES.SKULL],
  ['minecraft:creeper_head',      SHAPES.SKULL],
  ['minecraft:dragon_head',       SHAPES.SKULL],
  ['minecraft:piglin_head',       SHAPES.SKULL],
  ['minecraft:stone_slab',        SHAPES.SLAB],
  ['minecraft:smooth_stone_slab', SHAPES.SLAB],
  ['minecraft:cobblestone_slab',  SHAPES.SLAB],
  ['minecraft:stone_brick_slab',  SHAPES.SLAB],
  ['minecraft:brick_slab',        SHAPES.SLAB],
  ['minecraft:sandstone_slab',    SHAPES.SLAB],
  ['minecraft:nether_brick_slab', SHAPES.SLAB],
  ['minecraft:quartz_slab',       SHAPES.SLAB],
  ['minecraft:stone_stairs',        SHAPES.STAIRS],
  ['minecraft:cobblestone_stairs',  SHAPES.STAIRS],
  ['minecraft:nether_brick_stairs', SHAPES.STAIRS],
  ['minecraft:quartz_stairs',       SHAPES.STAIRS],
  ['minecraft:brick_stairs',        SHAPES.STAIRS],
  ['minecraft:sandstone_stairs',    SHAPES.STAIRS],
  ['minecraft:oak_fence',           SHAPES.FENCE],
  ['minecraft:spruce_fence',        SHAPES.FENCE],
  ['minecraft:birch_fence',         SHAPES.FENCE],
  ['minecraft:jungle_fence',        SHAPES.FENCE],
  ['minecraft:acacia_fence',        SHAPES.FENCE],
  ['minecraft:dark_oak_fence',      SHAPES.FENCE],
  ['minecraft:nether_brick_fence',  SHAPES.FENCE],
  ['minecraft:crimson_fence',       SHAPES.FENCE],
  ['minecraft:warped_fence',        SHAPES.FENCE],
]);

export function classifyShape(blockId, states) {
  const id = blockId?.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;

  if (_NAME_SHAPE.has(id)) return _NAME_SHAPE.get(id);

  if (id.includes('flower')      || id.includes('_tulip')     ||
      id.includes('orchid')      || id.includes('allium')     ||
      id.includes('oxeye')       || id.includes('cornflower') ||
      id.includes('lily_of')     || id.includes('wither_rose')||
      id.includes('dandelion')   || id.includes('poppy')      ||
      id.includes('bluet')       || id.includes('lily_pad')   ||
      id.includes('dripleaf')    || id.includes('petals')     ||
      id.includes('propagule')   || id.includes('mangrove_roots')) {
    return SHAPES.CROSS;
  }

  if (id.includes('pressure_plate')) return SHAPES.PRESSURE_PLATE;
  if (id === 'minecraft:chiseled_bookshelf') return SHAPES.CUBE; // Vanilla chiseled bookshelf is a solid cube
  if (id.includes('shelf')) return SHAPES.SHELF; // Custom addon shelf
  if (id.includes('lantern')) return SHAPES.LANTERN;
  if (id.includes('campfire')) return SHAPES.CAMPFIRE;

  const name = id.replace('minecraft:', '');
  for (const [suffix, shape] of _SUFFIX_SHAPE) {
    if (name.endsWith(suffix)) return shape;
  }

  if (id.includes('air')) return SHAPES.AIR;

  return SHAPES.CUBE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry resolution — builds actual Three.js BufferGeometry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve custom BufferGeometry for a block.
 *
 * @param {object}      THREE          - Three.js module (window.THREE)
 * @param {string}      blockId
 * @param {object|null} states         - Block state properties
 * @param {object|null} neighbors      - { n, s, w, e } boolean visibility flags
 * @param {object|null} neighborBlocks - { n, s, w, e } block info for corner stairs
 * @returns {THREE.BufferGeometry|null} — null → viewer uses default BoxGeometry
 */
export function resolveGeometry(THREE, blockId, states, neighbors, neighborBlocks) {
  if (!THREE?.BufferGeometry) return null;

  const shape = classifyShape(blockId, states);

  switch (shape) {
    case SHAPES.SLAB:           return _buildSlab(THREE, states);
    case SHAPES.STAIRS:         return _buildStairs(THREE, states, neighbors, neighborBlocks);
    case SHAPES.FENCE:          return _buildFence(THREE, neighbors);
    case SHAPES.FENCE_GATE:     return _buildFenceGate(THREE, states);
    case SHAPES.WALL:           return _buildWall(THREE, neighbors);
    case SHAPES.PANE:           return _buildPane(THREE, neighbors);
    case SHAPES.TRAPDOOR:       return _buildTrapdoor(THREE, states);
    case SHAPES.DOOR:           return _buildDoor(THREE, states);
    case SHAPES.CARPET:         return _buildCarpet(THREE);
    case SHAPES.SNOW_LAYER:     return _buildSnowLayer(THREE, states);
    case SHAPES.PRESSURE_PLATE: return _buildPressurePlate(THREE);
    case SHAPES.BUTTON:         return _buildButton(THREE, states);
    case SHAPES.CROSS:          return _buildCross(THREE);
    case SHAPES.TORCH:          return _buildTorch(THREE);
    case SHAPES.LANTERN:        return _buildLantern(THREE, states);
    case SHAPES.END_ROD:        return _buildEndRod(THREE, states);
    case SHAPES.CHAIN:          return _buildChain(THREE, states);
    case SHAPES.CANDLE:         return _buildCandle(THREE);
    case SHAPES.CAMPFIRE:       return _buildCampfire(THREE);
    case SHAPES.SKULL:          return _buildSkull(THREE);
    case SHAPES.FLOWER_POT:     return _buildFlowerPot(THREE);
    case SHAPES.LIQUID:         return _buildLiquid(THREE);
    case SHAPES.RAIL:           return _buildRail(THREE, states);
    case SHAPES.SIGN:           return _buildSign(THREE);
    case SHAPES.WALL_SIGN:      return _buildWallSign(THREE);
    case SHAPES.HANGING_SIGN:   return _buildHangingSign(THREE, states, false);
    case SHAPES.BED:            return _buildBed(THREE);
    case SHAPES.LEVER:          return _buildLever(THREE);
    case SHAPES.FRAME:          return _buildFrame(THREE, states);
    case SHAPES.HOPPER:         return _buildHopper(THREE, states);
    case SHAPES.ANVIL:          return _buildAnvil(THREE, states);
    case SHAPES.SCAFFOLDING:    return _buildScaffolding(THREE);
    case SHAPES.LADDER:         return _buildLadder(THREE, states);
    case SHAPES.FLOWER_POT:     return _buildFlowerPot(THREE);
    case SHAPES.SHELF:          return _buildShelf(THREE, states);
    case SHAPES.REDSTONE_DUST:  return _buildRedstoneDust(THREE, states);
    case SHAPES.REPEATER:       return _buildRepeater(THREE, states);
    case SHAPES.COMPARATOR:     return _buildComparator(THREE, states);
    case SHAPES.PISTON:         return _buildPistonLike(THREE, blockId, 'piston');
    case SHAPES.OBSERVER:       return _buildPistonLike(THREE, blockId, 'observer');
    case SHAPES.DISPENSER:      return _buildPistonLike(THREE, blockId, 'dispenser');
    default:                    return null; // CUBE → caller uses BoxGeometry
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal merge helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge multiple box geometries into a single non-indexed BufferGeometry.
 * @param {object} THREE
 * @param {Array<{x?,y?,z?,w?,h?,d?,rx?,ry?,rz?}>} boxes
 *   x/y/z = center offset (default 0)
 *   w/h/d = size (default 1)
 *   rx/ry/rz = rotation in radians (default 0)
 */
function _mergeBoxes(THREE, boxes) {
  const positions = [];
  const normals   = [];
  const uvs       = [];
  const result    = new THREE.BufferGeometry();
  
  let vertCount = 0;

  for (const box of boxes) {
    const { x=0, y=0, z=0, w=1, h=1, d=1, rx=0, ry=0, rz=0, autoUV=false, uv=null, mats=null } = box;
    const geo = new THREE.BoxGeometry(w, h, d);

    if (rx || ry || rz) {
      geo.applyMatrix4(
        new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz))
      );
    }
    if (x || y || z) geo.translate(x, y, z);

    const posArr  = geo.attributes.position.array;
    const normArr = geo.attributes.normal.array;
    const uvArr   = geo.attributes.uv.array;
    const idxArr  = geo.index.array;

    for (let i = 0; i < idxArr.length; i++) {
      const vi = idxArr[i];
      const px = posArr[vi*3], py = posArr[vi*3+1], pz = posArr[vi*3+2];
      const nx = normArr[vi*3], ny = normArr[vi*3+1], nz = normArr[vi*3+2];
      
      positions.push(px, py, pz);
      normals.push(nx, ny, nz);

      const faceIdx = Math.floor(i / 6);

      if (box.uv && box.uv[faceIdx]) {
        const [x1, y1, x2, y2] = box.uv[faceIdx];
        const u_min = x1 / 16, u_max = x2 / 16;
        const v_min = 1 - (y2 / 16), v_max = 1 - (y1 / 16);
        
        const origU = uvArr[vi * 2];
        const origV = uvArr[vi * 2 + 1];
        
        uvs.push(u_min + origU * (u_max - u_min), v_min + origV * (v_max - v_min));
      } else if (autoUV) {
        // Project UV based on absolute normal direction to match world-aligned textures
        const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
        let u, v;
        if (ax > ay && ax > az) {
          u = nx > 0 ? (0.5 - pz) : (pz + 0.5);
          v = py + 0.5;
        } else if (ay > ax && ay > az) {
          u = px + 0.5;
          v = ny > 0 ? (0.5 - pz) : (pz + 0.5);
        } else {
          u = nz > 0 ? (px + 0.5) : (0.5 - px);
          v = py + 0.5;
        }
        uvs.push(u, v);
      } else {
        uvs.push(uvArr[vi*2], uvArr[vi*2+1]);
      }
    }
    
    // BoxGeometry produces 36 indices: 6 for each of the 6 faces.
    // Face order: +x, -x, +y, -y, +z, -z
    for (let f = 0; f < 6; f++) {
      const matIndex = mats ? (mats[f] ?? f) : f;
      result.addGroup(vertCount, 6, matIndex);
      vertCount += 6;
    }
    
    geo.dispose();
  }

  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  result.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape builders
// All use block-local coords: center=(0,0,0), block spans [-0.5, +0.5] in each axis
// ─────────────────────────────────────────────────────────────────────────────

// ── Slab ──────────────────────────────────────────────────────────────────────
function _buildSlab(THREE, states) {
  const t = readSlabType(states);
  if (t === 'double') return _mergeBoxes(THREE, [{ y: 0, w: 1, h: 1, d: 1 }]);
  return _mergeBoxes(THREE, [{ y: t === 'top' ? 0.25 : -0.25, w: 1, h: 0.5, d: 1 }]);
}

// ── Stairs ────────────────────────────────────────────────────────────────────
// Bedrock weirdo_direction: 0=east, 1=west, 2=south, 3=north
const _STAIR_DIR = { 0:'east', 1:'west', 2:'south', 3:'north',
  east:'east', west:'west', south:'south', north:'north' };

function _buildStairs(THREE, states, neighbors, neighborBlocks) {
  const facing  = readStairsFacing(states);
  const flipped = readStairsHalf(states) === 'top';

  // main slab half
  const baseY = flipped ? 0.25  : -0.25;
  const stepY = flipped ? -0.25 :  0.25;

  const boxes = [{ y: baseY, w: 1, h: 0.5, d: 1 }];

  // step on the "high" side (the side you walk up to)
  switch (facing) {
    case 'east':  boxes.push({ x:  0.25, y: stepY, w: 0.5, h: 0.5, d: 1 }); break;
    case 'west':  boxes.push({ x: -0.25, y: stepY, w: 0.5, h: 0.5, d: 1 }); break;
    case 'south': boxes.push({ z:  0.25, y: stepY, w: 1, h: 0.5, d: 0.5 }); break;
    case 'north': boxes.push({ z: -0.25, y: stepY, w: 1, h: 0.5, d: 0.5 }); break;
  }

  return _mergeBoxes(THREE, boxes);
}

// ── Fence ─────────────────────────────────────────────────────────────────────
function _buildFence(THREE, neighbors) {
  // Post: 4/16 × 16/16 × 4/16 = 0.25 × 1 × 0.25
  const boxes = [{ w: 0.25, h: 1, d: 0.25 }];
  // Rails: 2/16 thick, 4/16 wide, running from post center to block edge
  // Lower rail center: 9/16 from bottom = -0.5+9/16 = 0.0625
  // Upper rail center: 12/16 from bottom = -0.5+12/16 = 0.25
  const LO = 0.0625, HI = 0.25, T = 0.125;
  if (neighbors?.n) {
    boxes.push({ z: -0.25, y: LO, w: 0.25, h: T, d: 0.5 });
    boxes.push({ z: -0.25, y: HI, w: 0.25, h: T, d: 0.5 });
  }
  if (neighbors?.s) {
    boxes.push({ z:  0.25, y: LO, w: 0.25, h: T, d: 0.5 });
    boxes.push({ z:  0.25, y: HI, w: 0.25, h: T, d: 0.5 });
  }
  if (neighbors?.w) {
    boxes.push({ x: -0.25, y: LO, w: 0.5, h: T, d: 0.25 });
    boxes.push({ x: -0.25, y: HI, w: 0.5, h: T, d: 0.25 });
  }
  if (neighbors?.e) {
    boxes.push({ x:  0.25, y: LO, w: 0.5, h: T, d: 0.25 });
    boxes.push({ x:  0.25, y: HI, w: 0.5, h: T, d: 0.25 });
  }
  return _mergeBoxes(THREE, boxes);
}

// ── Fence Gate ────────────────────────────────────────────────────────────────
const _GATE_DIR = { 0:'south', 1:'west', 2:'north', 3:'east',
  south:'south', west:'west', north:'north', east:'east' };

function _buildFenceGate(THREE, states) {
  const open   = readFenceGateOpen(states);
  const facing = readFenceGateFacing(states);
  const isNS   = facing === 'north' || facing === 'south';

  // Gate posts (wall connection)
  const T = 0.125, PH = 1;
  const boxes = [];

  if (!open) {
    // Closed: two posts + horizontal beams spanning the opening
    if (isNS) {
      boxes.push({ x: -0.375, w: T, h: PH, d: T });
      boxes.push({ x:  0.375, w: T, h: PH, d: T });
      boxes.push({ y: 0.0625, w: 0.75, h: T, d: T });
      boxes.push({ y: 0.25,   w: 0.75, h: T, d: T });
    } else {
      boxes.push({ z: -0.375, w: T, h: PH, d: T });
      boxes.push({ z:  0.375, w: T, h: PH, d: T });
      boxes.push({ y: 0.0625, w: T, h: T, d: 0.75 });
      boxes.push({ y: 0.25,   w: T, h: T, d: 0.75 });
    }
  } else {
    // Open: gate panels swung to each side (simplified)
    if (isNS) {
      boxes.push({ x: -0.375, w: T, h: PH, d: T });
      boxes.push({ x:  0.375, w: T, h: PH, d: T });
      boxes.push({ x: -0.375, y: 0.0625, w: T, h: T, d: 0.5 });
      boxes.push({ x: -0.375, y: 0.25,   w: T, h: T, d: 0.5 });
      boxes.push({ x:  0.375, y: 0.0625, w: T, h: T, d: 0.5 });
      boxes.push({ x:  0.375, y: 0.25,   w: T, h: T, d: 0.5 });
    } else {
      boxes.push({ z: -0.375, w: T, h: PH, d: T });
      boxes.push({ z:  0.375, w: T, h: PH, d: T });
      boxes.push({ z: -0.375, y: 0.0625, w: 0.5, h: T, d: T });
      boxes.push({ z: -0.375, y: 0.25,   w: 0.5, h: T, d: T });
      boxes.push({ z:  0.375, y: 0.0625, w: 0.5, h: T, d: T });
      boxes.push({ z:  0.375, y: 0.25,   w: 0.5, h: T, d: T });
    }
  }
  return _mergeBoxes(THREE, boxes);
}

// ── Wall ──────────────────────────────────────────────────────────────────────
function _buildWall(THREE, neighbors) {
  // Post: 9/16 × 16/16 × 9/16
  const P = 0.5625;
  // Arms: 7/16 wide, 14/16 tall, from post edge to block edge
  const armW = 0.4375, armH = 0.875;
  const armY = (armH - 1) / 2;          // arm center y (relative to block center)
  const gap  = (1 - P) / 2;             // space between post edge and block edge = 0.21875
  const armD = gap;                      // arm depth (along the direction) = gap
  const armC = P / 2 + gap / 2;         // arm center distance from block center = 0.390625

  const boxes = [{ w: P, h: 1, d: P }];

  if (neighbors?.n) boxes.push({ z: -armC, y: armY, w: armW, h: armH, d: armD });
  if (neighbors?.s) boxes.push({ z:  armC, y: armY, w: armW, h: armH, d: armD });
  if (neighbors?.w) boxes.push({ x: -armC, y: armY, w: armD, h: armH, d: armW });
  if (neighbors?.e) boxes.push({ x:  armC, y: armY, w: armD, h: armH, d: armW });

  return _mergeBoxes(THREE, boxes);
}

// ── Glass Pane / Iron Bars ────────────────────────────────────────────────────
function _buildPane(THREE, neighbors) {
  const T = 0.0625; // 1/16 thick
  const n = neighbors?.n, s = neighbors?.s, w = neighbors?.w, e = neighbors?.e;

  if (!n && !s && !w && !e) {
    // No connections: show a + cross post
    return _mergeBoxes(THREE, [
      { w: T, h: 1, d: 1 },
      { w: 1, h: 1, d: T },
    ]);
  }

  const boxes = [{ w: T, h: 1, d: T }]; // center post

  // NS arm
  if (n && s) {
    boxes.push({ w: T, h: 1, d: 1 });
  } else if (n) {
    boxes.push({ z: -0.25, w: T, h: 1, d: 0.5 });
  } else if (s) {
    boxes.push({ z:  0.25, w: T, h: 1, d: 0.5 });
  }

  // EW arm
  if (w && e) {
    boxes.push({ w: 1, h: 1, d: T });
  } else if (w) {
    boxes.push({ x: -0.25, w: 0.5, h: 1, d: T });
  } else if (e) {
    boxes.push({ x:  0.25, w: 0.5, h: 1, d: T });
  }

  return _mergeBoxes(THREE, boxes);
}

// ── Trapdoor ──────────────────────────────────────────────────────────────────
// Bedrock trapdoor direction: 0=north, 1=south, 2=west, 3=east (JSON 実測値)
// Java facing string も同様 (north/south/west/east)
const _TRAP_DIR = { 0:'north', 1:'south', 2:'west', 3:'east',
  south:'south', north:'north', east:'east', west:'west' };

function _buildTrapdoor(THREE, states) {
  const open    = readTrapdoorOpen(states);
  const flipped = readTrapdoorHalf(states) === 'top';
  const dir     = readTrapdoorFacing(states);
  const T = 0.1875; // 3/16 thick

  if (!open) {
    // Closed: flat panel at top or bottom (facing doesn't visually matter)
    const y = flipped ? (0.5 - T / 2) : (-0.5 + T / 2);
    return _mergeBoxes(THREE, [{ y, w: 1, h: T, d: 1 }]);
  }

  // Open: トラップドアの `facing` は隣接ブロックの方向 (ヒンジ側の壁の方向)。
  // 板はその壁に立つので、facing と同じ側に描画する。
  // 例: facing='north' → 隣接は北 → 板は north 側 (z=-ec)
  const ec     = 0.5 - T / 2; // edge center

  switch (dir) {
    case 'north': return _mergeBoxes(THREE, [{ z: -ec, w: 1, h: 1, d: T }]);
    case 'south': return _mergeBoxes(THREE, [{ z:  ec, w: 1, h: 1, d: T }]);
    case 'west':  return _mergeBoxes(THREE, [{ x: -ec, w: T, h: 1, d: 1 }]);
    case 'east':  return _mergeBoxes(THREE, [{ x:  ec, w: T, h: 1, d: 1 }]);
    default:      return _mergeBoxes(THREE, [{ z: -ec, w: 1, h: 1, d: T }]);
  }
}

// ── Door ──────────────────────────────────────────────────────────────────────
// Bedrock: direction 0=east 1=south 2=west 3=north (panel "facing" direction when closed)
//          door_hinge_bit: 0=left hinge 1=right hinge (when looking at the door from outside)
//          open_bit: 0=closed 1=open
// §02_TECHNICAL_REFERENCE §4-3, §6-1
const _DOOR_DIR = { 0:'east', 1:'south', 2:'west', 3:'north',
  east:'east', south:'south', west:'west', north:'north' };

function _buildDoor(THREE, states) {
  const T  = 0.1875;           // 3/16 thick
  const ec = 0.5 - T / 2;

  const facing = readDoorFacing(states);
  const open   = readDoorOpen(states);
  const hinge  = readDoorHinge(states) === 'right';

  // Java DoorBlock の bounding box に合わせる:
  // 閉じた状態: 板は facing と **反対側** の壁にある (facing=north → 板は south 端)
  // 開いた状態: ヒンジ側の壁に板が swung する
  // hinge=false (left) は外側から見て左 = 外側方向に対して反時計回りの方向
  if (!open) {
    switch (facing) {
      case 'east':  return _mergeBoxes(THREE, [{ x: -ec, w: T, h: 1, d: 1 }]); // panel at west
      case 'west':  return _mergeBoxes(THREE, [{ x:  ec, w: T, h: 1, d: 1 }]); // panel at east
      case 'south': return _mergeBoxes(THREE, [{ z: -ec, w: 1, h: 1, d: T }]); // panel at north
      case 'north': return _mergeBoxes(THREE, [{ z:  ec, w: 1, h: 1, d: T }]); // panel at south
    }
  }

  // 開いた状態 (hinge=true は right hinge / Java's "right")
  // facing=north + hinge=left → ヒンジは west → 板は west 壁
  // facing=north + hinge=right → ヒンジは east → 板は east 壁
  switch (facing) {
    case 'north':
      return _mergeBoxes(THREE, [{ x: hinge ?  ec : -ec, w: T, h: 1, d: 1 }]);
    case 'south':
      return _mergeBoxes(THREE, [{ x: hinge ? -ec :  ec, w: T, h: 1, d: 1 }]);
    case 'east':
      return _mergeBoxes(THREE, [{ z: hinge ?  ec : -ec, w: 1, h: 1, d: T }]);
    case 'west':
      return _mergeBoxes(THREE, [{ z: hinge ? -ec :  ec, w: 1, h: 1, d: T }]);
  }
  return _mergeBoxes(THREE, [{ w: T, h: 1, d: 1 }]);
}

// ── Carpet ────────────────────────────────────────────────────────────────────
function _buildCarpet(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.46875, w: 1, h: 0.0625, d: 1 }]);
}

// ── Snow Layer ────────────────────────────────────────────────────────────────
function _buildSnowLayer(THREE, states) {
  const raw    = _getState(states, 'height') ?? _getState(states, 'snow_layer_height');
  const layers = Math.max(1, Math.min(8, parseInt(raw ?? 1) || 1));
  const h      = layers / 8;
  return _mergeBoxes(THREE, [{ y: h / 2 - 0.5, w: 1, h, d: 1 }]);
}

// ── Pressure Plate ────────────────────────────────────────────────────────────
function _buildPressurePlate(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.46875, w: 0.875, h: 0.0625, d: 0.875 }]);
}

// ── Button ────────────────────────────────────────────────────────────────────
function _buildButton(THREE, states) {
  // Simplified: small bump on floor
  return _mergeBoxes(THREE, [{ y: -0.4375, w: 0.375, h: 0.125, d: 0.25 }]);
}

// ── Cross (flowers, grass, saplings, etc.) ────────────────────────────────────
function _buildCross(THREE) {
  // Two thin planes at ±45° around Y, forming an X shape
  const W = 0.9, H = 0.95, D = 0.04;
  return _mergeBoxes(THREE, [
    { ry:  Math.PI / 4, w: W, h: H, d: D },
    { ry: -Math.PI / 4, w: W, h: H, d: D },
  ]);
}

// ── Torch ─────────────────────────────────────────────────────────────────────
function _buildTorch(THREE) {
  return _mergeBoxes(THREE, [
    { y: -0.25, w: 0.09375, h: 0.5, d: 0.09375 }, // stick
  ]);
}

// ── Lantern ───────────────────────────────────────────────────────────────────
function _buildLantern(THREE, states) {
  const hanging = _isTrue(_getState(states, 'hanging_bit')) || _isTrue(_getState(states, 'hanging'));
  
  const boxH = 0.4375; // 7/16
  const capH = 0.125; // 2/16
  const ringH = 0.125; // 2/16

  const bodyUV = {
    0: [0, 9, 6, 16], 1: [0, 9, 6, 16], 2: [0, 0, 6, 6],
    3: [0, 0, 6, 6], 4: [0, 9, 6, 16], 5: [0, 9, 6, 16]
  };
  const capUV = {
    0: [0, 7, 4, 9], 1: [0, 7, 4, 9], 2: [0, 0, 4, 4],
    3: [0, 0, 4, 4], 4: [0, 7, 4, 9], 5: [0, 7, 4, 9]
  };
  const ringUV = {
    0: [0, 5, 2, 7], 1: [0, 5, 2, 7], 2: [0, 0, 2, 2],
    3: [0, 0, 2, 2], 4: [0, 5, 2, 7], 5: [0, 5, 2, 7]
  };

  if (hanging) {
    const ringY = 0.5 - ringH / 2;
    const capY = ringY - ringH / 2 - capH / 2;
    const boxY = capY - capH / 2 - boxH / 2;
    return _mergeBoxes(THREE, [
      { y: boxY, w: 0.375, h: boxH, d: 0.375, uv: bodyUV },
      { y: capY, w: 0.25, h: capH, d: 0.25, uv: capUV },
      { y: ringY, w: 0.125, h: ringH, d: 0.125, uv: ringUV },
    ]);
  } else {
    const boxY = -0.5 + boxH / 2 + 0.0625;
    const capY = boxY + boxH / 2 + capH / 2;
    const ringY = capY + capH / 2 + ringH / 2;
    return _mergeBoxes(THREE, [
      { y: boxY, w: 0.375, h: boxH, d: 0.375, uv: bodyUV },
      { y: capY, w: 0.25, h: capH, d: 0.25, uv: capUV },
      { y: ringY, w: 0.125, h: ringH, d: 0.125, uv: ringUV },
    ]);
  }
}

// ── End Rod / Lightning Rod ────────────────────────────────────────────────────
function _buildEndRod(THREE, states) {
  const axis = _getState(states, 'pillar_axis') ?? _getState(states, 'axis') ?? 'y';
  if (axis === 'x') return _mergeBoxes(THREE, [{ w: 1, h: 0.09375, d: 0.09375 }]);
  if (axis === 'z') return _mergeBoxes(THREE, [{ w: 0.09375, h: 0.09375, d: 1 }]);
  return _mergeBoxes(THREE, [{ w: 0.09375, h: 1, d: 0.09375 }]);
}

// ── Chain ─────────────────────────────────────────────────────────────────────
function _buildChain(THREE, states) {
  const axis = readAxis(states); // 'x' | 'y' | 'z'
  if (axis === 'x') return _mergeBoxes(THREE, [{ w: 1,       h: 0.09375, d: 0.09375 }]);
  if (axis === 'z') return _mergeBoxes(THREE, [{ w: 0.09375, h: 0.09375, d: 1       }]);
  return _mergeBoxes(THREE, [{ w: 0.09375, h: 1, d: 0.09375 }]);
}

// ── Candle ────────────────────────────────────────────────────────────────────
function _buildCandle(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.21875, w: 0.125, h: 0.5625, d: 0.125 }]);
}

// ── Campfire ──────────────────────────────────────────────────────────────────
function _buildCampfire(THREE) {
  return _mergeBoxes(THREE, [
    { y: -0.46875, w: 1, h: 0.0625, d: 1, autoUV: true }, // ashes base
    { x: -0.25, y: -0.375, z: 0, w: 0.25, h: 0.25, d: 1, autoUV: true }, // bottom log 1
    { x:  0.25, y: -0.375, z: 0, w: 0.25, h: 0.25, d: 1, autoUV: true }, // bottom log 2
    { x: 0, y: -0.125, z: -0.25, w: 1, h: 0.25, d: 0.25, autoUV: true }, // top log 1
    { x: 0, y: -0.125, z:  0.25, w: 1, h: 0.25, d: 0.25, autoUV: true }, // top log 2
  ]);
}

// ── Skull / Head ──────────────────────────────────────────────────────────────
function _buildSkull(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.125, w: 0.5, h: 0.75, d: 0.5 }]);
}



// ── Liquid (water / lava) ────────────────────────────────────────────────────
function _buildLiquid(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.0625, w: 1, h: 0.875, d: 1 }]);
}

// ── Rail (方向対応) ──────────────────────────────────────────────────────────
// shape: 'north_south' | 'east_west' | 'ascending_*' | 'south_east' | 'south_west' | 'north_west' | 'north_east'
function _buildRail(THREE, states) {
  const shape = readRailShape(states);
  const yFloor = -0.46875;
  const H = 0.0625;

  // 直線 (north_south / east_west) — 平板 (向きは UV だけだが視覚は同じ)
  if (shape === 'north_south' || shape === 'east_west') {
    return _mergeBoxes(THREE, [{ y: yFloor, w: 1, h: H, d: 1 }]);
  }

  // 上り坂 — 一端を持ち上げる
  if (shape.startsWith('ascending_')) {
    // 斜め板を作る代わりに 2 つの板を段差表示 (簡略)
    const dir = shape.replace('ascending_', '');
    const low  = { y: yFloor,        w: 1, h: H, d: 1 };
    const mid  = { y: yFloor + 0.5,  w: 0.5, h: H, d: 0.5 };
    // 上端を方向側に
    if (dir === 'east')  mid.x =  0.25;
    if (dir === 'west')  mid.x = -0.25;
    if (dir === 'north') mid.z = -0.25;
    if (dir === 'south') mid.z =  0.25;
    return _mergeBoxes(THREE, [low, mid]);
  }

  // カーブ (north_east / north_west / south_east / south_west) — L 字
  if (shape === 'north_east' || shape === 'north_west' ||
      shape === 'south_east' || shape === 'south_west') {
    const half1 = { y: yFloor, w: 1, h: H, d: 0.5 };
    const half2 = { y: yFloor, w: 0.5, h: H, d: 1 };
    half1.z = (shape.startsWith('north')) ? -0.25 :  0.25;
    half2.x = (shape.endsWith('east'))    ?  0.25 : -0.25;
    return _mergeBoxes(THREE, [half1, half2]);
  }

  return _mergeBoxes(THREE, [{ y: yFloor, w: 1, h: H, d: 1 }]);
}

// ── Standing Sign ─────────────────────────────────────────────────────────────
function _buildSign(THREE) {
  return _mergeBoxes(THREE, [
    { y: 0.09375, w: 0.875, h: 0.375, d: 0.0625 }, // board
    { y: -0.25,   w: 0.0625, h: 0.5,  d: 0.0625 }, // post
  ]);
}

// ── Wall Sign / Ladder ────────────────────────────────────────────────────────
function _buildWallSign(THREE) {
  const T = 0.0625;
  return _mergeBoxes(THREE, [{ z: -(0.5 - T / 2), w: 0.875, h: 0.375, d: T }]);
}

// ── Bed ───────────────────────────────────────────────────────────────────────
function _buildBed(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.125, w: 1, h: 0.75, d: 1 }]);
}

// ── Lever ─────────────────────────────────────────────────────────────────────
function _buildLever(THREE) {
  return _mergeBoxes(THREE, [
    { y: -0.46875, w: 0.25,    h: 0.0625, d: 0.25   }, // base
    { y: -0.28125, w: 0.0625,  h: 0.375,  d: 0.0625, rx: 0.35 }, // handle
  ]);
}

// ── Item Frame / Painting ──────────────────────────────────────────────────────
// 額縁 = 背面薄板 + 上下左右の枠 4 本。facing で 6 方向に配置
function _buildFrame(THREE, states) {
  const face = readFacing6(states);
  const W = 0.75;       // 額縁の幅・高さ (12/16)
  const F = 0.0625;     // 壁からの飛び出し厚 (1/16)
  const T = 0.0625;     // 枠の太さ (1/16)
  const inner = W - T * 2;
  // base: 北壁 (z = -ec) に対する 5 box 構成
  // 中央背面板
  const baseBoxes = [
    { x: 0, y: 0, z: 0, w: W, h: T, d: F }, // 上の枠 (placeholder, 後で z 軸基準にする)
  ];

  // 北壁 (facing='north') に向けた額縁: 背面 + 4 枠を z=-(0.5-F/2) に配置
  const ec = 0.5 - F / 2;
  const boxesNorth = [
    // 背面板 (薄い)
    { x: 0, y: 0, z: -ec, w: inner, h: inner, d: F * 0.5, autoUV: true },
    // 上枠
    { x: 0, y:  W/2 - T/2, z: -ec, w: W, h: T, d: F, autoUV: true },
    // 下枠
    { x: 0, y: -W/2 + T/2, z: -ec, w: W, h: T, d: F, autoUV: true },
    // 左枠
    { x: -W/2 + T/2, y: 0, z: -ec, w: T, h: inner, d: F, autoUV: true },
    // 右枠
    { x:  W/2 - T/2, y: 0, z: -ec, w: T, h: inner, d: F, autoUV: true },
  ];

  // facing で回転
  let ry = 0, rx = 0;
  if      (face === 'south') ry =  Math.PI;
  else if (face === 'east')  ry = -Math.PI / 2;
  else if (face === 'west')  ry =  Math.PI / 2;
  else if (face === 'up')    rx =  Math.PI / 2;
  else if (face === 'down')  rx = -Math.PI / 2;

  // 回転を各 box に適用
  return _mergeBoxes(THREE, boxesNorth.map(b => ({ ...b, ry, rx })));
}

// ── Hopper ────────────────────────────────────────────────────────────────────
function _buildHopper(THREE, states) {
  // Java/Bedrock 両対応: readFacing6 が 'down'|'up'|'north'|'south'|'east'|'west' を返す
  const dirVal = readFacing6(states);
  const isDown = dirVal === 'down';

  const boxes = [
    // Top rim (16x16, 6 thick). Uses autoUV so the transparent 'top' texture maps correctly.
    { x: 0, y: 0.3125, z: -0.4375, w: 1, h: 0.375, d: 0.125, autoUV: true }, // N
    { x: 0, y: 0.3125, z:  0.4375, w: 1, h: 0.375, d: 0.125, autoUV: true }, // S
    { x: -0.4375, y: 0.3125, z: 0, w: 0.125, h: 0.375, d: 0.75, autoUV: true }, // W
    { x:  0.4375, y: 0.3125, z: 0, w: 0.125, h: 0.375, d: 0.75, autoUV: true }, // E
    // Basin floor (12x12x2). Top face (2) must use side texture (0) because top texture has a hole.
    { x: 0, y: 0.1875, z: 0, w: 0.75, h: 0.125, d: 0.75, autoUV: true, mats: { 2: 0 } },
    // Middle funnel (8x8x6)
    { x: 0, y: -0.0625, z: 0, w: 0.5, h: 0.375, d: 0.5, autoUV: true, mats: { 2: 0 } },
  ];

  // Spout (4x4x4)
  if (isDown) {
    boxes.push({ x: 0, y: -0.375, z: 0, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
  } else {
    const sy = -0.125;
    const dist = 0.375;
    if      (dirVal === 'north') boxes.push({ x: 0, y: sy, z: -dist, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
    else if (dirVal === 'south') boxes.push({ x: 0, y: sy, z:  dist, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
    else if (dirVal === 'west')  boxes.push({ x: -dist, y: sy, z: 0, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
    else if (dirVal === 'east')  boxes.push({ x:  dist, y: sy, z: 0, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
  }

  return _mergeBoxes(THREE, boxes);
}

// ── Anvil ─────────────────────────────────────────────────────────────────────
function _buildAnvil(THREE, states) {
  const dirVal = _getState(states, 'direction') ?? 0;
  // 0: Z-axis (north/south), 1: X-axis (east/west)
  const isX = dirVal === 1 || dirVal === 3 || dirVal === 'east' || dirVal === 'west';


  let wB=0.75, dB=0.75;
  let wL=0.5, dL=0.625;
  let wN=0.375, dN=0.5;
  let wT=0.625, dT=1.0;

  if (isX) {
    [wB, dB] = [dB, wB];
    [wL, dL] = [dL, wL];
    [wN, dN] = [dN, wN];
    [wT, dT] = [dT, wT];
  }

  return _mergeBoxes(THREE, [
    { x: 0, y: -0.375, z: 0, w: wB, h: 0.25, d: dB, autoUV: true }, // Base
    { x: 0, y: -0.09375, z: 0, w: wL, h: 0.3125, d: dL, autoUV: true }, // Lower body
    { x: 0, y: 0.09375, z: 0, w: wN, h: 0.0625, d: dN, autoUV: true }, // Neck
    { x: 0, y: 0.3125, z: 0, w: wT, h: 0.375, d: dT, autoUV: true }, // Top
  ]);
}

// ── Scaffolding ───────────────────────────────────────────────────────────────
function _buildScaffolding(THREE) {
  const T = 0.125; // 2/16
  const ec = 0.5 - T / 2; // 7/16
  
  return _mergeBoxes(THREE, [
    { x: 0, y: 0.4375, z: 0, w: 1, h: T, d: 1, autoUV: true }, // Top board
    { x: -ec, y: -0.0625, z: -ec, w: T, h: 0.875, d: T, autoUV: true }, // NW leg
    { x:  ec, y: -0.0625, z: -ec, w: T, h: 0.875, d: T, autoUV: true }, // NE leg
    { x: -ec, y: -0.0625, z:  ec, w: T, h: 0.875, d: T, autoUV: true }, // SW leg
    { x:  ec, y: -0.0625, z:  ec, w: T, h: 0.875, d: T, autoUV: true }, // SE leg
  ]);
}

// ── Ladder ────────────────────────────────────────────────────────────────────
function _buildLadder(THREE, states) {
  // Java/Bedrock 両形式対応: readFacing6 が Java 'facing' string と Bedrock 'facing_direction' int を統一
  const face = readFacing6(states); // 'down'|'up'|'north'|'south'|'east'|'west'

  const T = 0.125; // 2/16 thick
  const ec = 0.5 - T / 2;

  // ladder の facing は「プレイヤーが向く方向」= 板が attach されている**反対**の壁
  // facing='south' → プレイヤー南向き → 板は北壁 (z=-ec)
  let boxes = [];
  if (face === 'south')      boxes.push({ z: -ec, w: 1, h: 1, d: T });
  else if (face === 'north') boxes.push({ z:  ec, w: 1, h: 1, d: T });
  else if (face === 'east')  boxes.push({ x: -ec, w: T, h: 1, d: 1 });
  else if (face === 'west')  boxes.push({ x:  ec, w: T, h: 1, d: 1 });
  else                       boxes.push({ z:  ec, w: 1, h: 1, d: T });

  return _mergeBoxes(THREE, boxes);
}

// ── Flower Pot ────────────────────────────────────────────────────────────────
function _buildFlowerPot(THREE) {
  const T = 0.0625; // 1/16 wall
  const w = 0.375; // 6/16 pot width
  const h = 0.375; // 6/16 pot height
  const yBase = -0.5 + T / 2;
  const yWall = -0.5 + T + (h - T) / 2;
  const edge = w / 2 - T / 2;

  // Uses autoUV to automatically sample the center 6x6 pixels of the flower pot texture
  return _mergeBoxes(THREE, [
    { y: yBase, w: w, h: T, d: w, autoUV: true }, // floor
    { z: -edge, y: yWall, w: w, h: h - T, d: T, autoUV: true }, // N
    { z:  edge, y: yWall, w: w, h: h - T, d: T, autoUV: true }, // S
    { x: -edge, y: yWall, w: T, h: h - T, d: w - 2*T, autoUV: true }, // W
    { x:  edge, y: yWall, w: T, h: h - T, d: w - 2*T, autoUV: true }, // E
  ]);
}

// ── Hanging Sign ──────────────────────────────────────────────────────────────
function _buildHangingSign(THREE, states, isWall) {
  const boardY = -0.125; 
  const barY = 0.4375; 
  
  const boxes = [];
  if (isWall) {
    boxes.push({ y: barY, z: -0.125, w: 0.125, h: 0.125, d: 0.75, autoUV: true });
    boxes.push({ y: boardY, z: 0, w: 0.875, h: 0.625, d: 0.125, autoUV: true });
  } else {
    boxes.push({ y: barY, w: 0.875, h: 0.125, d: 0.125, autoUV: true });
    boxes.push({ y: boardY, w: 0.875, h: 0.625, d: 0.125, autoUV: true });
  }
  return _mergeBoxes(THREE, boxes);
}

// ── Shelf (minecraft:shelf, 1.21.100+ vanilla block) ─────────────────────────
// 幅1×高さ1×奥行き0.5の縦ハーフブロック。facing方向の壁に背中を貼り付ける形で配置。
// facing=south なら南の壁に背中 → ブロック南端（z=+0.25）にオフセット
function _buildShelf(THREE, states) {
  const dirVal = _getState(states, 'facing_direction') ?? _getState(states, 'direction') ?? 0;
  // Bedrock facing_direction: 2=north, 3=south, 4=west, 5=east
  const isNorth = dirVal === 2 || dirVal === 'north';
  const isEast  = dirVal === 5 || dirVal === 'east';
  const isWest  = dirVal === 4 || dirVal === 'west';
  // default: south (3)

  // 棚は奥行きが0.5（8/16ピクセル）で壁に貼り付く形状
  // Three.js座標系: +Z=south, -Z=north, +X=east, -X=west
  // facing=south → 壁は南側(z=+0.5)、棚はz=-0.25にオフセット（南の壁に背を向ける）
  // facing=north → 壁は北側(z=-0.5)、棚はz=+0.25にオフセット
  // facing=east  → 壁は東側(x=+0.5)、棚はx=-0.25にオフセット
  // facing=west  → 壁は西側(x=-0.5)、棚はx=+0.25にオフセット

  // _mergeBoxes の box定義: x/y/z はジオメトリ中心（-0.5〜+0.5の単位系）
  // w=1, h=1, d=0.5 の箱を facing に応じてオフセット
  if (isNorth) {
    // 北向き: 北の壁に背、z=+0.25にオフセット、南面が前面
    return _mergeBoxes(THREE, [{ x: 0, y: 0, z: 0.25, w: 1, h: 1, d: 0.5 }]);
  } else if (isEast) {
    // 東向き: 東の壁に背、x=-0.25にオフセット、西面が前面
    return _mergeBoxes(THREE, [{ x: -0.25, y: 0, z: 0, w: 0.5, h: 1, d: 1 }]);
  } else if (isWest) {
    // 西向き: 西の壁に背、x=+0.25にオフセット、東面が前面
    return _mergeBoxes(THREE, [{ x: 0.25, y: 0, z: 0, w: 0.5, h: 1, d: 1 }]);
  } else {
    // 南向き(default): 南の壁に背、z=-0.25にオフセット、北面が前面
    return _mergeBoxes(THREE, [{ x: 0, y: 0, z: -0.25, w: 1, h: 1, d: 0.5 }]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Redstone Dust (M-V-1)
// ─────────────────────────────────────────────────────────────────────────────
// 床面に薄く貼り付けた赤い板。接続フラグ(n/s/e/w) は states.__dust_conn に注入されている前提
// (viewer3d.js が `computeWireConnections` の結果を states に埋め込んで渡す)。
// 各方向の接続タイプは 'none' | 'side' | 'up'。
function _buildRedstoneDust(THREE, states) {
  const conn = states?.__dust_conn || { n: 'none', s: 'none', e: 'none', w: 'none' };
  const yFloor = -0.46875; // 床面より +1/64 浮かせて Z-fight 防止 (-0.5 + 1/32)
  const H      = 0.03125;  // 1/32 厚 (ダストは薄い)
  const center = 0.3125;   // 5/16 中央パッド幅

  const boxes = [];
  const conn4 = (
    (conn.n !== 'none' ? 1 : 0) +
    (conn.s !== 'none' ? 1 : 0) +
    (conn.e !== 'none' ? 1 : 0) +
    (conn.w !== 'none' ? 1 : 0)
  );

  // 中央パッド (接続 0 または 1 のとき "ドット")
  if (conn4 === 0 || conn4 === 1) {
    boxes.push({ y: yFloor, w: center, h: H, d: center });
  }

  // 各方向への帯 (side / up とも床面の帯は共通; up は追加で壁面板を伸ばす)
  if (conn.n !== 'none') {
    boxes.push({ y: yFloor, z: -((0.5 - center / 2) / 2 + center / 4), w: center, h: H, d: 0.5 - center / 2 });
    if (conn.n === 'up') {
      // 北側の壁面に縦帯 (隣接ブロック側面)
      boxes.push({ y: yFloor + (0.5 - center / 2) / 2 + center / 4, z: -0.46875, w: center, h: 0.5 - center / 2, d: H, rx: Math.PI / 2 });
    }
  }
  if (conn.s !== 'none') {
    boxes.push({ y: yFloor, z:  ((0.5 - center / 2) / 2 + center / 4), w: center, h: H, d: 0.5 - center / 2 });
    if (conn.s === 'up') {
      boxes.push({ y: yFloor + (0.5 - center / 2) / 2 + center / 4, z:  0.46875, w: center, h: 0.5 - center / 2, d: H, rx: Math.PI / 2 });
    }
  }
  if (conn.e !== 'none') {
    boxes.push({ y: yFloor, x:  ((0.5 - center / 2) / 2 + center / 4), w: 0.5 - center / 2, h: H, d: center });
    if (conn.e === 'up') {
      boxes.push({ y: yFloor + (0.5 - center / 2) / 2 + center / 4, x:  0.46875, w: H, h: 0.5 - center / 2, d: center, rz: Math.PI / 2 });
    }
  }
  if (conn.w !== 'none') {
    boxes.push({ y: yFloor, x: -((0.5 - center / 2) / 2 + center / 4), w: 0.5 - center / 2, h: H, d: center });
    if (conn.w === 'up') {
      boxes.push({ y: yFloor + (0.5 - center / 2) / 2 + center / 4, x: -0.46875, w: H, h: 0.5 - center / 2, d: center, rz: Math.PI / 2 });
    }
  }

  // 完全孤立かつドットも置かれなかったケースの保険
  if (boxes.length === 0) {
    boxes.push({ y: yFloor, w: center, h: H, d: center });
  }

  return _mergeBoxes(THREE, boxes);
}

// ─────────────────────────────────────────────────────────────────────────────
// Repeater (M-V-1) — MC モデルピクセル座標に合わせた寸法
// ─────────────────────────────────────────────────────────────────────────────
// 基準形: 入力=-Z (back torch)、出力=+Z (front torch) — comparator と同じ向き。
// ユーザー検証により Bedrock の cardinal_direction='north' は base geometry を
// MC とは前後逆に配置する必要があった (#7 修正)。
// ※ 回転規約の全体像は BlockInstancingManager.js の _applyFacingRotation を参照。
//   back torch: z=-0.25 (入力側、-Z)
//   front torch delay 1..4: -0.125, 0, +0.125, +0.25 (delay 1 が back に最も近い)
function _buildRepeater(THREE, states) {
  const delay = states?.__repeater_delay ?? 1;
  const base = { y: -0.4375, w: 1, h: 0.125, d: 1 };
  const torchW = 0.125;   // 2 pixel
  const torchH = 0.3125;  // 5 pixel
  const torchY = -0.21875; // slab top (-0.375) + half torch height
  const backZ  = -0.25;   // 後ろトーチ (入力側)
  // 前トーチ delay 1..4 → -0.125, 0, +0.125, +0.25
  const frontZ = -0.125 + (Math.max(1, Math.min(4, delay)) - 1) * 0.125;
  const backTorch  = { x: 0, y: torchY, z: backZ,  w: torchW, h: torchH, d: torchW, mats: [6,6,6,6,6,6] };
  const frontTorch = { x: 0, y: torchY, z: frontZ, w: torchW, h: torchH, d: torchW, mats: [6,6,6,6,6,6] };
  return _mergeBoxes(THREE, [base, backTorch, frontTorch]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparator (M-V-1) — MC モデルピクセル座標に厳密合わせ
// ─────────────────────────────────────────────────────────────────────────────
// 基準形: 入力=-Z (back torch)、出力=+Z (front torch 2本) — repeater と同じ向き。
// #7 のユーザー目視検証により back/front を旧実装から 180° 反転して配置している
// (下の旧 Three.js 座標とは z 符号が逆になっているのが現状の正)。
// ※ 回転規約の全体像は BlockInstancingManager.js の _applyFacingRotation を参照。
// MC pixel coords (16x2x16) 由来の寸法:
//   back torch:  center x=8 (subtract mode はさらに 2px 高く)
//   front-left:  center x=4 / front-right: center x=12
// Three.js (-0.5..+0.5) 現実装:
//   back: (0, _, -0.1875)
//   front-left:  (-0.25, _, +0.1875)
//   front-right: (+0.25, _, +0.1875)
function _buildComparator(THREE, states) {
  const subtract = states?.__comparator_subtract === true;
  const base = { y: -0.4375, w: 1, h: 0.125, d: 1 };
  const torchW = 0.125;   // 2 pixel
  const torchH = 0.3125;  // 5 pixel
  const torchY = -0.21875;
  // subtract モードは back torch を一段高くする (MC では 2px 持ち上げ)
  const backH = subtract ? 0.4375 : torchH;
  const backY = subtract ? -0.15625 : torchY;
  // #7: 180° 反転 — back を -Z 側 (入力)、front を +Z 側 (出力) に配置
  const backTorch  = { x:  0,    y: backY,  z: -0.1875, w: torchW, h: backH, d: torchW, mats: [6,6,6,6,6,6] };
  const frontLeft  = { x: -0.25, y: torchY, z:  0.1875, w: torchW, h: torchH, d: torchW, mats: [6,6,6,6,6,6] };
  const frontRight = { x:  0.25, y: torchY, z:  0.1875, w: torchW, h: torchH, d: torchW, mats: [6,6,6,6,6,6] };
  return _mergeBoxes(THREE, [base, backTorch, frontLeft, frontRight]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Directional Cube (Piston / Observer / Dispenser / Dropper / Crafter)
// ─────────────────────────────────────────────────────────────────────────────
// 通常のキューブ + 前面 (+Z) に向きマーカー (#7 で repeater/comparator と同じく
// "facing=north 基準時に出力は +Z 側" 規約に揃えた)。
// 回転で前面マーカーが正しい向きに動く。
function _buildPistonLike(THREE, blockId, variant) {
  const boxes = [
    // メインキューブ
    { y: 0, w: 1, h: 1, d: 1 },
  ];
  const markerMat = [6, 6, 6, 6, 6, 6];
  // ピストン: マーカー = 押し出し面 (正面)。yawByFacing は facing=north 基準 (yaw=0 で前面 -Z)
  // なので、基準形でも push face は -Z 側にすべき。これで facing='south' (yaw=PI) →
  // 180° 回転後 push face が +Z (south) になり、向きが一致する。
  if (variant === 'piston') {
    boxes.push({ x: 0, y: 0, z: -0.49, w: 0.6, h: 0.6, d: 0.02, mats: markerMat });
  } else if (variant === 'observer') {
    // オブザーバー: マーカー = 観察側 (背面) を +Z 側に置くと、現状で外向き配置が正しく描画される
    boxes.push({ x: -0.18, y: 0.12, z: 0.49, w: 0.18, h: 0.18, d: 0.02, mats: markerMat });
    boxes.push({ x:  0.18, y: 0.12, z: 0.49, w: 0.18, h: 0.18, d: 0.02, mats: markerMat });
  } else if (variant === 'dispenser') {
    boxes.push({ x: 0, y: 0, z: 0.49, w: 0.35, h: 0.35, d: 0.02, mats: markerMat });
  }
  return _mergeBoxes(THREE, boxes);
}
