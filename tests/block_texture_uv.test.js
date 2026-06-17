import { describe, expect, test } from 'vitest';
import { projectBlockUV } from '../js/blockshapes.js';

describe('block-local texture UV projection', () => {
  test('maps horizontal faces to the block X/Z coordinates', () => {
    expect(projectBlockUV(-0.5, 0.25, -0.5, 0, 1, 0)).toEqual({ u: 0, v: 1 });
    expect(projectBlockUV(0.5, 0.25, 0.5, 0, 1, 0)).toEqual({ u: 1, v: 0 });
  });

  test('maps side faces without stretching each sub-box to a full texture', () => {
    expect(projectBlockUV(0.125, -0.5, -0.25, 1, 0, 0)).toEqual({ u: 0.75, v: 0 });
    expect(projectBlockUV(-0.25, 0.5, 0.125, 0, 0, 1)).toEqual({ u: 0.25, v: 1 });
  });
});
