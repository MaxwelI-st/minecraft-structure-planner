/**
 * blockshapes.js — Block Shape Classification & Geometry Resolution
 *
 * Provides shape metadata for 3D rendering:
 *   classifyShape(blockId, states)                          → shape type string
 *   resolveGeometry(THREE, blockId, states, neighbors, nb)  → BufferGeometry or null
 *   _getState(states, key)                                  → raw state value helper
 *   _isTrue(val)                                            → boolean normaliser
 */

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
    case SHAPES.CHAIN:          return _buildChain(THREE);
    case SHAPES.CANDLE:         return _buildCandle(THREE);
    case SHAPES.CAMPFIRE:       return _buildCampfire(THREE);
    case SHAPES.SKULL:          return _buildSkull(THREE);
    case SHAPES.FLOWER_POT:     return _buildFlowerPot(THREE);
    case SHAPES.LIQUID:         return _buildLiquid(THREE);
    case SHAPES.RAIL:           return _buildRail(THREE);
    case SHAPES.SIGN:           return _buildSign(THREE);
    case SHAPES.WALL_SIGN:      return _buildWallSign(THREE);
    case SHAPES.HANGING_SIGN:   return _buildHangingSign(THREE, states, false);
    case SHAPES.BED:            return _buildBed(THREE);
    case SHAPES.LEVER:          return _buildLever(THREE);
    case SHAPES.FRAME:          return _buildFrame(THREE);
    case SHAPES.HOPPER:         return _buildHopper(THREE, states);
    case SHAPES.ANVIL:          return _buildAnvil(THREE, states);
    case SHAPES.SCAFFOLDING:    return _buildScaffolding(THREE);
    case SHAPES.LADDER:         return _buildLadder(THREE, states);
    case SHAPES.FLOWER_POT:     return _buildFlowerPot(THREE);
    case SHAPES.SHELF:          return _buildShelf(THREE, states);
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
  // Java: type=double → 全ブロック (両半分埋まる)
  if (_getState(states, 'type') === 'double') {
    return _mergeBoxes(THREE, [{ y: 0, w: 1, h: 1, d: 1 }]);
  }
  const isTop = _getState(states, 'type') === 'top'             // Java: type=top/bottom
             || _isTrue(_getState(states, 'top_slot_bit'))      // Bedrock 旧
             || _getState(states, 'vertical_half') === 'top'    // Bedrock 新
             || _getState(states, 'minecraft:vertical_half') === 'top'
             || _isTrue(_getState(states, 'upside_down_bit'));
  return _mergeBoxes(THREE, [{ y: isTop ? 0.25 : -0.25, w: 1, h: 0.5, d: 1 }]);
}

// ── Stairs ────────────────────────────────────────────────────────────────────
// Bedrock weirdo_direction: 0=east, 1=west, 2=south, 3=north
const _STAIR_DIR = { 0:'east', 1:'west', 2:'south', 3:'north',
  east:'east', west:'west', south:'south', north:'north' };

function _buildStairs(THREE, states, neighbors, neighborBlocks) {
  const dirVal  = _getState(states, 'weirdo_direction') ?? _getState(states, 'facing') ?? 0;
  const facing  = _STAIR_DIR[dirVal] ?? 'east';
  // Bedrock: upside_down_bit / Java: half=top
  const flipped = _getState(states, 'half') === 'top'
              || _isTrue(_getState(states, 'upside_down_bit'));

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
  // Java: open=true/false / Bedrock: open_bit
  const open   = _isTrue(_getState(states, 'open_bit')) || _getState(states, 'open') === 'true';
  // Java: facing=string / Bedrock: minecraft:cardinal_direction (string) or direction (int)
  const dirVal = _getState(states, 'facing')
              ?? _getState(states, 'minecraft:cardinal_direction')
              ?? _getState(states, 'direction')
              ?? 0;
  const facing = typeof dirVal === 'string' ? dirVal : (_GATE_DIR[dirVal] ?? 'south');
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
  // Java: open=true/false / Bedrock: open_bit
  const open    = _isTrue(_getState(states, 'open_bit'))
              || _getState(states, 'open') === 'true';
  // Java: half=top/bottom / Bedrock: upside_down_bit
  const flipped = _getState(states, 'half') === 'top'
              || _isTrue(_getState(states, 'upside_down_bit'));
  const T = 0.1875; // 3/16 thick

  if (!open) {
    // Closed: flat panel at top or bottom
    const y = flipped ? (0.5 - T / 2) : (-0.5 + T / 2);
    return _mergeBoxes(THREE, [{ y, w: 1, h: T, d: 1 }]);
  }

  // Open: vertical panel against the hinge wall
  // Java: facing=string (north/south/east/west) / Bedrock: direction (int)
  const javaFacing = _getState(states, 'facing');
  const dirVal = typeof javaFacing === 'string'
    ? javaFacing
    : (_getState(states, 'direction') ?? 0);
  const dir    = _TRAP_DIR[dirVal] ?? 'south';
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

  // Java: facing=string / Bedrock: minecraft:cardinal_direction (string) or direction (int)
  const dirVal = _getState(states, 'facing')   // Java 最優先
              ?? _getState(states, 'minecraft:cardinal_direction')
              ?? _getState(states, 'direction')
              ?? _getState(states, 'facing_direction')
              ?? 0;
  const facing = typeof dirVal === 'string' ? dirVal : (_DOOR_DIR[dirVal] ?? 'east');
  // Java: open=true/false (string) / Bedrock: open_bit
  const open   = _isTrue(_getState(states, 'open_bit'))
              || _getState(states, 'open') === 'true';
  // hinge_bit=0 → left hinge / Java: hinge='left'|'right'
  const hinge  = _isTrue(_getState(states, 'door_hinge_bit'))
              || _isTrue(_getState(states, 'hinge_bit'))
              || _getState(states, 'hinge') === 'right';

  if (!open) {
    // Closed: panel sits at the block edge corresponding to the facing direction
    switch (facing) {
      case 'east':  return _mergeBoxes(THREE, [{ x:  ec, w: T, h: 1, d: 1 }]);
      case 'west':  return _mergeBoxes(THREE, [{ x: -ec, w: T, h: 1, d: 1 }]);
      case 'south': return _mergeBoxes(THREE, [{ z:  ec, w: 1, h: 1, d: T }]);
      case 'north': return _mergeBoxes(THREE, [{ z: -ec, w: 1, h: 1, d: T }]);
    }
  }

  // Open: panel has swung 90° around its hinge post
  // The hinge post is at one END of the closed panel.
  // "Left hinge" (hinge_bit=0) when looking at the door from outside:
  //   east-facing door → outside = east side, left = south → hinge at z=+0.5 → open panel at z=+ec
  //   west-facing door → outside = west side, left = north → hinge at z=-0.5 → open panel at z=-ec
  //   south-facing door → outside = south, left = west → hinge at x=-0.5 → open panel at x=-ec
  //   north-facing door → outside = north, left = east → hinge at x=+0.5 → open panel at x=+ec
  switch (facing) {
    case 'east':
      return _mergeBoxes(THREE, [{ z: hinge ? -ec :  ec, w: 1, h: 1, d: T }]);
    case 'west':
      return _mergeBoxes(THREE, [{ z: hinge ?  ec : -ec, w: 1, h: 1, d: T }]);
    case 'south':
      return _mergeBoxes(THREE, [{ x: hinge ?  ec : -ec, w: T, h: 1, d: 1 }]);
    case 'north':
      return _mergeBoxes(THREE, [{ x: hinge ? -ec :  ec, w: T, h: 1, d: 1 }]);
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
function _buildChain(THREE) {
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

// ── Rail (flat) ───────────────────────────────────────────────────────────────
function _buildRail(THREE) {
  return _mergeBoxes(THREE, [{ y: -0.46875, w: 1, h: 0.0625, d: 1 }]);
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
function _buildFrame(THREE) {
  return _mergeBoxes(THREE, [
    { z: -(0.5 - 0.03125), w: 0.75, h: 0.75, d: 0.0625 }, // frame face
  ]);
}

// ── Hopper ────────────────────────────────────────────────────────────────────
function _buildHopper(THREE, states) {
  const dirVal = _getState(states, 'facing_direction') ?? _getState(states, 'minecraft:facing_direction') ?? 0;
  // 0:down, 1:up, 2:north, 3:south, 4:west, 5:east
  const isDown = dirVal === 0 || dirVal === 'down';

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
    if (dirVal === 2 || dirVal === 'north') boxes.push({ x: 0, y: sy, z: -dist, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
    else if (dirVal === 3 || dirVal === 'south') boxes.push({ x: 0, y: sy, z: dist, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
    else if (dirVal === 4 || dirVal === 'west') boxes.push({ x: -dist, y: sy, z: 0, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
    else if (dirVal === 5 || dirVal === 'east') boxes.push({ x: dist, y: sy, z: 0, w: 0.25, h: 0.25, d: 0.25, autoUV: true });
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
  const dirVal = _getState(states, 'facing_direction') ?? 0;
  const isNorth = dirVal === 2 || dirVal === 'north';
  const isSouth = dirVal === 3 || dirVal === 'south';
  const isWest  = dirVal === 4 || dirVal === 'west';
  const isEast  = dirVal === 5 || dirVal === 'east';

  const T = 0.125; // 2/16 thick (gives it nice 3D depth)
  const ec = 0.5 - T / 2;

  let boxes = [];
  // Use a single box so the ladder texture applies fully without autoUV squashing
  if (isSouth) boxes.push({ z: -ec, w: 1, h: 1, d: T }); // Attached to North wall
  else if (isNorth) boxes.push({ z:  ec, w: 1, h: 1, d: T }); // Attached to South wall
  else if (isEast) boxes.push({ x: -ec, w: T, h: 1, d: 1 }); // Attached to West wall
  else if (isWest) boxes.push({ x:  ec, w: T, h: 1, d: 1 }); // Attached to East wall
  else boxes.push({ z:  ec, w: 1, h: 1, d: T }); // default north

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
