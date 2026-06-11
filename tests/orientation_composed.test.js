import { describe, it, expect } from 'vitest';
import { readOrientation, eulerFor, applyEulerToVec } from '../js/render/orientation.js';

const worldPoint = (blockId, states, point) =>
  applyEulerToVec(point, eulerFor(readOrientation(blockId, states) || {}));

describe('orientation composition', () => {
  const frontTorch = { x: 0, y: 0, z: -0.25 };
  it('keeps repeater net directions', () => {
    expect(worldPoint('minecraft:repeater',
      { 'minecraft:cardinal_direction': 'north' }, frontTorch).z).toBeCloseTo(-0.25);
    expect(worldPoint('minecraft:repeater', { direction: 0 }, frontTorch).z).toBeCloseTo(0.25);
    expect(worldPoint('minecraft:repeater', { direction: 1 }, frontTorch).x).toBeCloseTo(-0.25);
  });

  const pushFace = { x: 0, y: 0, z: -0.49 };
  it('points piston push faces in all axes', () => {
    expect(worldPoint('minecraft:piston', { facing_direction: 1 }, pushFace).y).toBeCloseTo(0.49);
    expect(worldPoint('minecraft:piston', { facing_direction: 0 }, pushFace).y).toBeCloseTo(-0.49);
    expect(worldPoint('minecraft:piston', { facing_direction: 3 }, pushFace).z).toBeCloseTo(0.49);
  });
});
