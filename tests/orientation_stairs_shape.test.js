import { describe, it, expect } from 'vitest';
import { computeStairsShape } from '../js/render/orientation_stairs.js';

const world = map => direction => map[direction] ?? null;
const stair = (facing, half = 'bottom') => ({ isStairs: true, facing, half });

describe('computeStairsShape', () => {
  it('returns straight without neighbors', () => {
    expect(computeStairsShape('north', 'bottom', world({}))).toBe('straight');
  });
  it('computes outer corners', () => {
    expect(computeStairsShape('north', 'bottom', world({ north: stair('east') }))).toBe('outer_right');
    expect(computeStairsShape('north', 'bottom', world({ north: stair('west') }))).toBe('outer_left');
  });
  it('computes inner corners', () => {
    expect(computeStairsShape('north', 'bottom', world({ south: stair('east') }))).toBe('inner_right');
    expect(computeStairsShape('north', 'bottom', world({ south: stair('west') }))).toBe('inner_left');
  });
  it('ignores incompatible or parallel neighbors', () => {
    expect(computeStairsShape('north', 'bottom', world({ north: stair('east', 'top') }))).toBe('straight');
    expect(computeStairsShape('north', 'bottom', world({ north: stair('north') }))).toBe('straight');
  });
  it('does not corner a continuing straight row', () => {
    expect(computeStairsShape('north', 'bottom',
      world({ north: stair('east'), west: stair('north') }))).toBe('straight');
  });
});
