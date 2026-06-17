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

  // observer の赤ドット (出力) は背面 = 基準形 +Z → facing の反対側を向く
  const observerDot = { x: 0.18, y: 0.12, z: 0.478 };
  it('keeps observer output dots opposite to facing', () => {
    expect(worldPoint('minecraft:observer', { facing_direction: 2 }, observerDot).z).toBeCloseTo(0.478);  // facing north → dot south
    expect(worldPoint('minecraft:observer', { 'minecraft:facing_direction': 'up' }, observerDot).y).toBeLessThan(0); // facing up → dot down
  });

  // dispenser の射出口マーカーは前面 = 基準形 -Z → facing 方向を向く
  // (テクスチャの front=north 面と同じ側。旧実装の +Z 配置は矛盾バグだった)
  const outlet = { x: 0, y: 0, z: -0.478 };
  it('points dispenser outlets at facing', () => {
    expect(worldPoint('minecraft:dispenser', { facing_direction: 3 }, outlet).z).toBeCloseTo(0.478);   // south
    expect(worldPoint('minecraft:dispenser', { facing_direction: 4 }, outlet).x).toBeCloseTo(-0.478);  // west
  });
});
