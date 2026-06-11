import { describe, it, expect } from 'vitest';
import {
  YAW, OPPOSITE, ROT_CW, ROT_CCW, FACING6, readFacingValue, readOrientation,
} from '../js/render/orientation.js';

describe('orientation tables', () => {
  it('uses north as the yaw basis', () => {
    expect(YAW).toEqual({
      north: 0, east: -Math.PI / 2, south: Math.PI, west: Math.PI / 2,
    });
    expect(OPPOSITE.north).toBe('south');
    expect(ROT_CW.north).toBe('east');
    expect(ROT_CCW.north).toBe('west');
    expect(FACING6).toEqual(['down', 'up', 'north', 'south', 'west', 'east']);
  });
  it('normalizes raw facing values', () => {
    expect(readFacingValue({ facing: { value: 'south' } })).toBe('south');
    expect(readFacingValue({ 'minecraft:cardinal_direction': 'west' })).toBe('west');
    expect(readFacingValue({ facing_direction: 5 })).toBe('east');
  });
});

describe('readOrientation families', () => {
  it('reads redstone blocks', () => {
    expect(readOrientation('minecraft:repeater', { direction: 0 }).facing).toBe('south');
    expect(readOrientation('minecraft:comparator',
      { 'minecraft:cardinal_direction': 'east' }).facing).toBe('east');
    expect(readOrientation('minecraft:piston', { facing_direction: 0 }).facing).toBe('down');
  });
  it('reads attachments', () => {
    expect(readOrientation('minecraft:redstone_torch',
      { torch_facing_direction: 'north' })).toMatchObject({ facing: 'north', face: 'wall' });
    expect(readOrientation('minecraft:lever',
      { lever_direction: 'down_east_west' })).toMatchObject({ facing: 'east', face: 'ceiling' });
    expect(readOrientation('minecraft:stone_button',
      { facing_direction: 4 })).toMatchObject({ facing: 'west', face: 'wall' });
  });
  it('reads building blocks', () => {
    expect(readOrientation('minecraft:oak_stairs', { weirdo_direction: 0 }).facing).toBe('east');
    expect(readOrientation('minecraft:oak_trapdoor', { direction: 0 }).facing).toBe('west');
    expect(readOrientation('minecraft:wooden_door', { direction: 0 }).facing).toBe('east');
    expect(readOrientation('minecraft:ladder', { facing_direction: 3 }).facing).toBe('south');
  });
  it('reads remaining directional shapes', () => {
    expect(readOrientation('minecraft:hopper', { facing_direction: 0 }))
      .toEqual({ facing: null, face: null, axis: null });
    expect(readOrientation('minecraft:anvil', { facing: 'east' }).facing).toBe('east');
    expect(readOrientation('minecraft:chain', { pillar_axis: 'x' }).axis).toBe('x');
    expect(readOrientation('minecraft:end_rod', { facing_direction: 0 }).face).toBe('ceiling');
  });
  it('reads directional cubes and pillars', () => {
    expect(readOrientation('minecraft:furnace', { facing_direction: 4 }).facing).toBe('west');
    expect(readOrientation('minecraft:barrel', { facing_direction: 1 }).facing).toBe('up');
    expect(readOrientation('minecraft:oak_log', { pillar_axis: 'x' }).axis).toBe('x');
    expect(readOrientation('minecraft:quartz_pillar', { pillar_axis: 'y' }).axis).toBe('y');
  });
  it('returns null for unknown blocks', () => {
    expect(readOrientation('minecraft:stone', {})).toBeNull();
  });
});
