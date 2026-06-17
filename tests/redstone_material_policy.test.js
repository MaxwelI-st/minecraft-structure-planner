import { describe, expect, test } from 'vitest';
import {
  getRedstoneMaterialColors,
  isMaterialRedstoneDevice,
} from '../js/render/redstone-material-policy.js';

describe('redstone material policy', () => {
  test('forces wire, repeaters, and comparators into material rendering', () => {
    expect(isMaterialRedstoneDevice('minecraft:redstone_wire')).toBe(true);
    expect(isMaterialRedstoneDevice('minecraft:powered_repeater')).toBe(true);
    expect(isMaterialRedstoneDevice('minecraft:comparator')).toBe(true);
    expect(isMaterialRedstoneDevice('minecraft:observer')).toBe(false);
  });

  test('makes powered devices brighter than unpowered devices', () => {
    const off = getRedstoneMaterialColors('minecraft:repeater');
    const on = getRedstoneMaterialColors('minecraft:repeater', { powered: true });
    expect(on.circuit).not.toBe(off.circuit);
    expect(on.emissive).not.toBe(off.emissive);
  });

  test('top face is brighter than sides for a clear smooth-stone look', () => {
    // 上面 (光が当たる) は明るく、側面 (影) は暗く — 視認性 + 立体感
    const colors = getRedstoneMaterialColors('minecraft:comparator');
    expect(colors.top).toBeGreaterThan(colors.side);
    expect(colors.side).toBeGreaterThan(colors.bottom);
  });

  test('comparator subtract mode uses a distinct color from compare mode', () => {
    const compare  = getRedstoneMaterialColors('minecraft:comparator', { mode: 'compare' });
    const subtract = getRedstoneMaterialColors('minecraft:comparator', { mode: 'subtract' });
    expect(subtract.modeColor).not.toBe(compare.modeColor);
    expect(subtract.subtract).toBe(true);
    expect(compare.subtract).toBe(false);
  });
});
