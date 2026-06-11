/**
 * Directional block orientation single source of truth.
 *
 * World axes: +X east, +Y up, +Z south. Canonical geometry faces north (-Z)
 * and is placed on the floor. Per-instance rotation uses Euler order YXZ.
 */

const PI = Math.PI;
const PI2 = PI / 2;

export const YAW = Object.freeze({
  north: 0,
  east: -PI2,
  south: PI,
  west: PI2,
});

export const OPPOSITE = Object.freeze({
  north: 'south', south: 'north', east: 'west', west: 'east',
  up: 'down', down: 'up',
});
export const ROT_CW = Object.freeze({
  north: 'east', east: 'south', south: 'west', west: 'north',
});
export const ROT_CCW = Object.freeze({
  north: 'west', west: 'south', south: 'east', east: 'north',
});

export const FACING6 = Object.freeze(['down', 'up', 'north', 'south', 'west', 'east']);

export const DIR_TABLES = Object.freeze({
  trapdoor: Object.freeze(['west', 'east', 'north', 'south']),
  door: Object.freeze(['east', 'south', 'west', 'north']),
  fence_gate: Object.freeze(['south', 'west', 'north', 'east']),
  stairs: Object.freeze(['east', 'west', 'south', 'north']),
  tripwire_hook: Object.freeze(['south', 'west', 'north', 'east']),
  repeater: Object.freeze(['south', 'west', 'north', 'east']),
  anvil: Object.freeze(['south', 'west', 'north', 'east']),
  campfire: Object.freeze(['south', 'west', 'north', 'east']),
});

const HORIZONTAL = new Set(['north', 'south', 'east', 'west']);

function rawVal(states, key) {
  if (!states) return undefined;
  let value = states[key] ?? states[`minecraft:${key}`];
  if (typeof value === 'object' && value !== null && 'value' in value) value = value.value;
  return value;
}

function intVal(states, key) {
  const value = rawVal(states, key);
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number | 0 : null;
}

function strVal(states, key) {
  const value = rawVal(states, key);
  return typeof value === 'string' ? value.toLowerCase() : null;
}

export function readFacingValue(states) {
  const javaFacing = strVal(states, 'facing');
  if (javaFacing && (HORIZONTAL.has(javaFacing) || javaFacing === 'up' || javaFacing === 'down')) {
    return javaFacing;
  }
  const cardinal = strVal(states, 'cardinal_direction');
  if (cardinal && HORIZONTAL.has(cardinal)) return cardinal;
  const facingString = strVal(states, 'facing_direction');
  if (facingString && FACING6.includes(facingString)) return facingString;
  const facingInt = intVal(states, 'facing_direction');
  if (facingInt !== null && facingInt >= 0 && facingInt < FACING6.length) return FACING6[facingInt];
  return null;
}

export function readDirection4(states, tableName) {
  const direction = intVal(states, 'direction');
  if (direction === null) return null;
  return DIR_TABLES[tableName]?.[direction & 3] ?? null;
}

export function uprightToOrientation(facing) {
  if (facing === 'up' || facing === null) return { facing: null, face: null, axis: null };
  if (facing === 'down') return { facing: null, face: 'ceiling', axis: null };
  return { facing, face: 'wall', axis: null };
}

export const TORCH_FACING = Object.freeze({
  top: { face: 'floor', facing: null },
  north: { face: 'wall', facing: 'north' },
  south: { face: 'wall', facing: 'south' },
  east: { face: 'wall', facing: 'east' },
  west: { face: 'wall', facing: 'west' },
});

export const LEVER_DIRECTION = Object.freeze({
  down_east_west: { face: 'ceiling', facing: 'east' },
  down_north_south: { face: 'ceiling', facing: 'north' },
  up_east_west: { face: 'floor', facing: 'east' },
  up_north_south: { face: 'floor', facing: 'north' },
  north: { face: 'wall', facing: 'north' },
  south: { face: 'wall', facing: 'south' },
  east: { face: 'wall', facing: 'east' },
  west: { face: 'wall', facing: 'west' },
});

export const BUTTON_FACING_DIR = Object.freeze([
  { face: 'ceiling', facing: 'north' },
  { face: 'floor', facing: 'north' },
  { face: 'wall', facing: 'north' },
  { face: 'wall', facing: 'south' },
  { face: 'wall', facing: 'west' },
  { face: 'wall', facing: 'east' },
]);

export const CRAFTER_ORIENTATION = Object.freeze({
  down_east: 'down', down_north: 'down', down_south: 'down', down_west: 'down',
  up_east: 'up', up_north: 'up', up_south: 'up', up_west: 'up',
  north_up: 'north', south_up: 'south', east_up: 'east', west_up: 'west',
});

const BUTTON_IDS = new Set([
  'wooden_button', 'oak_button', 'stone_button', 'polished_blackstone_button',
  'spruce_button', 'birch_button', 'jungle_button', 'acacia_button',
  'dark_oak_button', 'mangrove_button', 'cherry_button', 'bamboo_button',
  'crimson_button', 'warped_button', 'pale_oak_button',
].map(name => `minecraft:${name}`));

const TORCH_IDS = new Set([
  'torch', 'soul_torch', 'wall_torch', 'soul_wall_torch',
  'redstone_torch', 'unlit_redstone_torch', 'redstone_wall_torch',
  'colored_torch_bp', 'colored_torch_rg',
].map(name => `minecraft:${name}`));

const orientation = (facing = null, face = null, axis = null) => ({ facing, face, axis });
const namespaced = blockId => blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;

function readRepeaterLike(states) {
  const cardinal = strVal(states, 'cardinal_direction');
  if (cardinal && HORIZONTAL.has(cardinal)) return orientation(cardinal);
  const direction = readDirection4(states, 'repeater');
  if (direction) return orientation(direction);
  const javaFacing = strVal(states, 'facing');
  return orientation(javaFacing && HORIZONTAL.has(javaFacing) ? javaFacing : 'north');
}

function readFacing6Like(states) {
  return orientation(readFacingValue(states) ?? 'north');
}

export function readOrientation(blockId, states) {
  if (!blockId) return null;
  const id = namespaced(blockId);
  const s = states || {};

  if (/^minecraft:(unpowered_|powered_)?(repeater|comparator)$/.test(id)) {
    return readRepeaterLike(s);
  }

  if ([
    'minecraft:piston', 'minecraft:sticky_piston',
    'minecraft:piston_arm_collision', 'minecraft:sticky_piston_arm_collision',
    'minecraft:piston_head', 'minecraft:moving_piston',
    'minecraft:observer', 'minecraft:dropper', 'minecraft:dispenser',
  ].includes(id)) {
    return readFacing6Like(s);
  }

  if (id === 'minecraft:crafter') {
    const value = strVal(s, 'orientation');
    return value && CRAFTER_ORIENTATION[value]
      ? orientation(CRAFTER_ORIENTATION[value])
      : readFacing6Like(s);
  }

  if (TORCH_IDS.has(id)) {
    const value = strVal(s, 'torch_facing_direction');
    if (value && TORCH_FACING[value]) {
      const mapped = TORCH_FACING[value];
      return orientation(mapped.facing, mapped.face);
    }
    if (id.includes('wall_torch')) {
      const facing = readFacingValue(s);
      return orientation(HORIZONTAL.has(facing) ? facing : 'north', 'wall');
    }
    return orientation(null, 'floor');
  }

  if (id === 'minecraft:lever') {
    const mapped = LEVER_DIRECTION[strVal(s, 'lever_direction')];
    return mapped ? orientation(mapped.facing, mapped.face) : orientation(null, 'floor');
  }

  if (BUTTON_IDS.has(id)) {
    const facingDirection = intVal(s, 'facing_direction');
    if (facingDirection !== null && facingDirection >= 0 && facingDirection < 6) {
      const mapped = BUTTON_FACING_DIR[facingDirection];
      return orientation(mapped.facing, mapped.face);
    }
    const face = strVal(s, 'face');
    if (face === 'floor' || face === 'wall' || face === 'ceiling') {
      return orientation(readFacingValue(s), face);
    }
    return orientation(null, 'floor');
  }

  if (id === 'minecraft:tripwire_hook') {
    return orientation(readDirection4(s, 'tripwire_hook') ?? readFacingValue(s) ?? 'north', 'wall');
  }

  if (id === 'minecraft:end_rod' || id === 'minecraft:lightning_rod') {
    return uprightToOrientation(readFacingValue(s) ?? 'up');
  }

  if (id.endsWith('stairs')) {
    const javaFacing = strVal(s, 'facing');
    if (javaFacing && HORIZONTAL.has(javaFacing)) return orientation(javaFacing);
    const direction = intVal(s, 'weirdo_direction');
    return orientation(direction === null ? 'east' : DIR_TABLES.stairs[direction & 3]);
  }

  if (id.endsWith('_trapdoor') || id === 'minecraft:trapdoor') {
    const facing = strVal(s, 'facing') || strVal(s, 'cardinal_direction') || readDirection4(s, 'trapdoor');
    return orientation(HORIZONTAL.has(facing) ? facing : 'north');
  }

  if (id.endsWith('_door')) {
    const javaFacing = strVal(s, 'facing');
    if (javaFacing && HORIZONTAL.has(javaFacing)) return orientation(javaFacing);
    const cardinal = strVal(s, 'cardinal_direction');
    if (cardinal && HORIZONTAL.has(cardinal)) return orientation(ROT_CW[cardinal]);
    return orientation(readDirection4(s, 'door') ?? 'east');
  }

  if (id.endsWith('_fence_gate') || id === 'minecraft:fence_gate') {
    const facing = strVal(s, 'facing') || strVal(s, 'cardinal_direction') || readDirection4(s, 'fence_gate');
    return orientation(HORIZONTAL.has(facing) ? facing : 'south');
  }

  if (id === 'minecraft:ladder' || id.endsWith('_wall_sign') ||
      (id.includes('shelf') && id !== 'minecraft:bookshelf' && id !== 'minecraft:chiseled_bookshelf')) {
    const facing = readFacingValue(s);
    return orientation(HORIZONTAL.has(facing) ? facing : (id === 'minecraft:ladder' ? 'north' : 'south'));
  }

  if (id === 'minecraft:hopper') {
    const facing = readFacingValue(s);
    return facing && HORIZONTAL.has(facing) ? orientation(facing) : orientation();
  }

  if (id === 'minecraft:anvil' || id === 'minecraft:chipped_anvil' || id === 'minecraft:damaged_anvil') {
    const javaFacing = strVal(s, 'facing');
    return orientation(javaFacing && HORIZONTAL.has(javaFacing)
      ? javaFacing
      : readDirection4(s, 'anvil') ?? 'south');
  }

  if (id === 'minecraft:campfire' || id === 'minecraft:soul_campfire') {
    const facing = strVal(s, 'facing') || strVal(s, 'cardinal_direction') || readDirection4(s, 'campfire');
    return orientation(HORIZONTAL.has(facing) ? facing : 'south');
  }

  if (['minecraft:frame', 'minecraft:item_frame', 'minecraft:glow_frame',
    'minecraft:glow_item_frame', 'minecraft:painting'].includes(id)) {
    return orientation(readFacingValue(s) ?? 'north');
  }

  if (id === 'minecraft:chain') {
    const axis = strVal(s, 'axis') || strVal(s, 'pillar_axis');
    return orientation(null, null, axis === 'x' || axis === 'z' ? axis : 'y');
  }

  const frontCube = /^minecraft:(lit_)?(furnace|blast_furnace|smoker)$|^minecraft:(chest|trapped_chest|ender_chest|barrel|loom|stonecutter_block|stonecutter|lectern|beehive|bee_nest|chiseled_bookshelf)$|_glazed_terracotta$/;
  if (frontCube.test(id)) {
    const facing = readFacingValue(s);
    if (facing) return orientation(facing);
    const direction = readDirection4(s, 'campfire');
    return direction ? orientation(direction) : null;
  }

  if (['minecraft:carved_pumpkin', 'minecraft:lit_pumpkin',
    'minecraft:pumpkin', 'minecraft:jack_o_lantern'].includes(id)) {
    const facing = strVal(s, 'facing') || strVal(s, 'cardinal_direction') || readDirection4(s, 'campfire');
    return facing ? orientation(facing) : null;
  }

  if (/_log$|_wood$|_stem$|_hyphae$|^minecraft:(basalt|polished_basalt|bone_block|hay_block|quartz_pillar|purpur_pillar|deepslate|bamboo_block|stripped_bamboo_block|muddy_mangrove_roots|ochre_froglight|verdant_froglight|pearlescent_froglight)$/.test(id)) {
    const axis = strVal(s, 'axis') || strVal(s, 'pillar_axis');
    return axis === 'x' || axis === 'y' || axis === 'z'
      ? orientation(null, null, axis)
      : null;
  }

  return null;
}

export function eulerFor(value) {
  const facing = value?.facing ?? null;
  const face = value?.face ?? null;
  const axis = value?.axis ?? null;

  if (axis === 'x') return { x: 0, y: 0, z: PI2, order: 'YXZ' };
  if (axis === 'z') return { x: PI2, y: 0, z: 0, order: 'YXZ' };
  if (axis === 'y') return { x: 0, y: 0, z: 0, order: 'YXZ' };

  const yaw = facing && YAW[facing] !== undefined ? YAW[facing] : 0;
  if (face === 'wall') return { x: -PI2, y: yaw, z: 0, order: 'YXZ' };
  if (face === 'ceiling') return { x: 0, y: yaw, z: PI, order: 'YXZ' };
  if (facing === 'up') return { x: PI2, y: 0, z: 0, order: 'YXZ' };
  if (facing === 'down') return { x: -PI2, y: 0, z: 0, order: 'YXZ' };
  return { x: 0, y: yaw, z: 0, order: 'YXZ' };
}

export function applyEulerToVec(vector, euler) {
  let { x, y, z } = vector;
  let c = Math.cos(euler.z), s = Math.sin(euler.z);
  [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(euler.x); s = Math.sin(euler.x);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(euler.y); s = Math.sin(euler.y);
  [x, z] = [x * c + z * s, -x * s + z * c];
  const clean = number => Math.abs(number) < 1e-12 ? 0 : number;
  return { x: clean(x), y: clean(y), z: clean(z) };
}

export { computeStairsShape } from './orientation_stairs.js';
