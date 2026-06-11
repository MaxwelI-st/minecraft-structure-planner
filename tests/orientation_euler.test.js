import { describe, it, expect } from 'vitest';
import { eulerFor, applyEulerToVec } from '../js/render/orientation.js';

const FRONT = { x: 0, y: 0, z: -1 };
const UP = { x: 0, y: 1, z: 0 };
const rotate = (vector, orientation) => applyEulerToVec(vector, eulerFor(orientation));

describe('eulerFor', () => {
  it.each([
    ['north', { x: 0, y: 0, z: -1 }],
    ['east', { x: 1, y: 0, z: 0 }],
    ['south', { x: 0, y: 0, z: 1 }],
    ['west', { x: -1, y: 0, z: 0 }],
  ])('faces %s', (facing, expected) => {
    expect(rotate(FRONT, { facing })).toEqual(expected);
  });

  it('maps front to up and down', () => {
    expect(rotate(FRONT, { facing: 'up' }).y).toBeCloseTo(1);
    expect(rotate(FRONT, { facing: 'down' }).y).toBeCloseTo(-1);
  });

  it.each([
    ['north', { x: 0, y: 0, z: -1 }],
    ['east', { x: 1, y: 0, z: 0 }],
    ['south', { x: 0, y: 0, z: 1 }],
    ['west', { x: -1, y: 0, z: 0 }],
  ])('wall protrudes %s', (facing, expected) => {
    expect(rotate(UP, { facing, face: 'wall' })).toEqual(expected);
  });

  it('supports all pillar axes', () => {
    expect(Math.abs(rotate(UP, { axis: 'x' }).x)).toBeCloseTo(1);
    expect(Math.abs(rotate(UP, { axis: 'z' }).z)).toBeCloseTo(1);
    expect(rotate(UP, { axis: 'y' }).y).toBeCloseTo(1);
  });
});
