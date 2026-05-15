import { describe, test, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BeToJeConverter } from '../js/modules/mapping/be-to-je.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let converter;

beforeAll(() => {
  const jsonPath = path.join(__dirname, '..', 'public', 'data', 'be_to_je_block_mapping.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const map = new Map(Object.entries(raw));
  converter = new BeToJeConverter(map);
});

// [name, states, expectedName, expectedPropsSubset, expectWarningCount=0]
const cases = [
  // === modern flat trapdoors (force-override facing; JSON values are rotated wrong) ===
  // ユーザー検証構造: direction=N が N 方向の隣接ブロックに付く → Java facing=N
  ['minecraft:dark_oak_trapdoor cardinal=north → facing=north (preserved)',
    'minecraft:dark_oak_trapdoor', { 'minecraft:cardinal_direction': 'north', open_bit: 0, upside_down_bit: 0 },
    'minecraft:dark_oak_trapdoor', { open: 'false', half: 'bottom', facing: 'north', powered: 'false', waterlogged: 'false' }],

  ['minecraft:dark_oak_trapdoor cardinal=east → facing=east',
    'minecraft:dark_oak_trapdoor', { 'minecraft:cardinal_direction': 'east', open_bit: 1, upside_down_bit: 0 },
    'minecraft:dark_oak_trapdoor', { open: 'true', half: 'bottom', facing: 'east' }],

  ['minecraft:dark_oak_trapdoor cardinal=south top → facing=south',
    'minecraft:dark_oak_trapdoor', { 'minecraft:cardinal_direction': 'south', open_bit: 0, upside_down_bit: 1 },
    'minecraft:dark_oak_trapdoor', { open: 'false', half: 'top', facing: 'south' }],

  // direction=1 → facing=east per TRAPDOOR_DIR_TO_FACING = [west, east, north, south]
  ['minecraft:spruce_trapdoor (legacy direction=1 → east)',
    'minecraft:spruce_trapdoor', { direction: 1, open_bit: 0, upside_down_bit: 0 },
    'minecraft:spruce_trapdoor', { open: 'false', facing: 'east' }],

  // === oak (legacy name 化が必要) ===
  ['minecraft:oak_trapdoor cardinal=north → facing=north',
    'minecraft:oak_trapdoor', { 'minecraft:cardinal_direction': 'north', open_bit: 0, upside_down_bit: 0 },
    'minecraft:oak_trapdoor', { open: 'false', facing: 'north' }],

  // cardinal_direction は 90° CW rotation (north→east→south→west→north)
  // hinge は内側→外側視点 flip
  ['minecraft:oak_door cardinal=east hinge_bit=0 → facing=south hinge=right',
    'minecraft:oak_door', { 'minecraft:cardinal_direction': 'east', open_bit: 0, door_hinge_bit: 0, upper_block_bit: 0 },
    'minecraft:oak_door', { open: 'false', facing: 'south', hinge: 'right', half: 'lower' }],

  ['minecraft:spruce_door cardinal=east → facing=south',
    'minecraft:spruce_door', { 'minecraft:cardinal_direction': 'east', open_bit: 0, door_hinge_bit: 0, upper_block_bit: 0 },
    'minecraft:spruce_door', { open: 'false', facing: 'south', hinge: 'right', half: 'lower' }],

  ['minecraft:spruce_door cardinal=south hinge_bit=1 → facing=west hinge=left',
    'minecraft:spruce_door', { 'minecraft:cardinal_direction': 'south', open_bit: 1, door_hinge_bit: 1, upper_block_bit: 1 },
    'minecraft:spruce_door', { open: 'true', hinge: 'left', half: 'upper', facing: 'west' }],

  // === wooden slabs (JSON 無 → identity passthrough、警告無) ===
  ['minecraft:dark_oak_slab top',
    'minecraft:dark_oak_slab', { 'minecraft:vertical_half': 'top' },
    'minecraft:dark_oak_slab', { type: 'top', waterlogged: 'false' }],

  ['minecraft:dark_oak_slab bottom',
    'minecraft:dark_oak_slab', { 'minecraft:vertical_half': 'bottom' },
    'minecraft:dark_oak_slab', { type: 'bottom', waterlogged: 'false' }],

  ['minecraft:oak_slab legacy top_slot_bit',
    'minecraft:oak_slab', { top_slot_bit: 1 },
    'minecraft:oak_slab', { type: 'top', waterlogged: 'false' }],

  // === stone-type slabs (legacy 化) ===
  ['minecraft:nether_brick_slab top',
    'minecraft:nether_brick_slab', { 'minecraft:vertical_half': 'top' },
    'minecraft:nether_brick_slab', { type: 'top' }],

  // === stairs ===
  ['minecraft:oak_stairs east bottom',
    'minecraft:oak_stairs', { weirdo_direction: 0, upside_down_bit: 0 },
    'minecraft:oak_stairs', { facing: 'east', half: 'bottom', shape: 'straight' }],

  ['minecraft:oak_stairs north top',
    'minecraft:oak_stairs', { weirdo_direction: 3, upside_down_bit: 1 },
    'minecraft:oak_stairs', { facing: 'north', half: 'top' }],

  // === leaves (legacy 化) ===
  ['minecraft:oak_leaves persistent',
    'minecraft:oak_leaves', { persistent_bit: 1, update_bit: 0 },
    'minecraft:oak_leaves', { persistent: 'true', distance: '1' }],

  ['minecraft:dark_oak_leaves (leaves2)',
    'minecraft:dark_oak_leaves', { persistent_bit: 1, update_bit: 0 },
    'minecraft:dark_oak_leaves', { persistent: 'true' }],

  // === wall (legacy 化 + connection 自動) ===
  ['minecraft:andesite_wall',
    'minecraft:andesite_wall', { wall_connection_type_north: 'none', wall_connection_type_south: 'none',
                                  wall_connection_type_east: 'none', wall_connection_type_west: 'none', wall_post_bit: 1 },
    'minecraft:andesite_wall', { north: 'none', south: 'none', east: 'none', west: 'none', up: 'true', waterlogged: 'false' }],

  // === composter (identity passthrough silent) ===
  ['minecraft:composter empty',
    'minecraft:composter', { composter_fill_level: 0 },
    'minecraft:composter', { level: '0' }],

  // === grass_block (identity passthrough silent) ===
  ['minecraft:grass_block',
    'minecraft:grass_block', {},
    'minecraft:grass_block', {}],

  // === fence_gate ===
  ['minecraft:oak_fence_gate (oak legacy)',
    'minecraft:oak_fence_gate', { 'minecraft:cardinal_direction': 'north', open_bit: 0, in_wall_bit: 0 },
    'minecraft:oak_fence_gate', { open: 'false', powered: 'false' }],

  ['minecraft:spruce_fence_gate (direct)',
    'minecraft:spruce_fence_gate', { 'minecraft:cardinal_direction': 'east', open_bit: 1, in_wall_bit: 0 },
    'minecraft:spruce_fence_gate', { open: 'true' }],

  // === colored wool / concrete (legacy 化) ===
  ['minecraft:red_wool',
    'minecraft:red_wool', {},
    'minecraft:red_wool', {}],

  ['minecraft:blue_concrete',
    'minecraft:blue_concrete', {},
    'minecraft:blue_concrete', {}],

  // === planks (legacy 化) ===
  ['minecraft:oak_planks',
    'minecraft:oak_planks', {},
    'minecraft:oak_planks', {}],

  // === air ===
  ['minecraft:air',
    'minecraft:air', {},
    'minecraft:air', {}],
];

describe('BE → JE block conversion', () => {
  for (const [label, name, states, expName, expProps] of cases) {
    test(label, () => {
      converter._warnings = [];
      const result = converter.convertBlock(name, states);
      expect(result.Name).toBe(expName);
      for (const [k, v] of Object.entries(expProps)) {
        expect(result.Properties[k]).toBe(v);
      }
    });
  }
});

describe('Warning count for known modern blocks', () => {
  test('no warnings for known passthrough or legacy-mapped blocks', () => {
    converter._warnings = [];
    const testBlocks = [
      ['minecraft:grass_block', {}],
      ['minecraft:composter', { composter_fill_level: 0 }],
      ['minecraft:dark_oak_slab', { 'minecraft:vertical_half': 'top' }],
      ['minecraft:oak_slab', {}],
      ['minecraft:oak_leaves', { persistent_bit: 1, update_bit: 0 }],
      ['minecraft:andesite_wall', { wall_post_bit: 1 }],
      ['minecraft:dark_oak_trapdoor', { 'minecraft:cardinal_direction': 'north', open_bit: 0, upside_down_bit: 0 }],
      ['minecraft:spruce_door', { 'minecraft:cardinal_direction': 'east', open_bit: 0, door_hinge_bit: 0, upper_block_bit: 0 }],
      ['minecraft:oak_planks', {}],
      ['minecraft:red_wool', {}],
    ];
    for (const [name, states] of testBlocks) {
      converter.convertBlock(name, states);
    }
    expect(converter._warnings).toEqual([]);
  });
});
