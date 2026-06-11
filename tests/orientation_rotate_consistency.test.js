import { describe, it, expect } from 'vitest';
import { ProjectManager } from '../js/core/project-manager.js';
import { readOrientation, ROT_CW } from '../js/render/orientation.js';

const cases = [
  ['minecraft:repeater', { 'minecraft:cardinal_direction': 'north' }],
  ['minecraft:repeater', { direction: 0 }],
  ['minecraft:comparator', { direction: 2 }],
  ['minecraft:observer', { facing_direction: 2 }],
  ['minecraft:piston', { facing_direction: 4 }],
  ['minecraft:dispenser', { facing_direction: 3 }],
  ['minecraft:oak_stairs', { weirdo_direction: 0 }],
  ['minecraft:oak_trapdoor', { direction: 1 }],
  ['minecraft:wooden_door', { direction: 2 }],
  ['minecraft:oak_fence_gate', { direction: 3 }],
  ['minecraft:ladder', { facing_direction: 2 }],
  ['minecraft:furnace', { facing_direction: 5 }],
  ['minecraft:anvil', { direction: 0 }],
  ['minecraft:campfire', { direction: 1 }],
  ['minecraft:oak_stairs', { facing: 'east' }],
  ['minecraft:oak_door', { facing: 'north' }],
];

describe('rotateBlockStates and readOrientation stay consistent', () => {
  it.each(cases)('%s %j', (blockId, states) => {
    const before = readOrientation(blockId, states)?.facing;
    if (!before || !(before in ROT_CW)) return;
    const rotated = ProjectManager.rotateBlockStates(states, 1, blockId);
    expect(readOrientation(blockId, rotated)?.facing).toBe(ROT_CW[before]);
  });
});
