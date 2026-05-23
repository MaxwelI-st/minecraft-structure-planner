import { describe, test, expect } from 'vitest';
import { sanitizeForOderso } from '../js/modules/logic/oderso_compat.js';

describe('sanitizeForOderso', () => {

  // ─── ALWAYS_AIR ────────────────────────────────────────────────────────

  test('minecraft:frame が air に変換される', () => {
    const palette = [{ Name: 'minecraft:frame', Properties: {} }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:air');
    expect(log[0].count).toBe(1);
  });

  test('minecraft:glow_frame が air に変換される', () => {
    const palette = [{ Name: 'minecraft:glow_frame', Properties: {} }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:air');
    expect(log[0].count).toBe(1);
  });

  test('minecraft:moving_block が air に変換される', () => {
    const palette = [{ Name: 'minecraft:moving_block', Properties: {} }];
    const { palette: result } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:air');
  });

  // ─── beehive ───────────────────────────────────────────────────────────

  test('beehive の honey_level が "false" の場合 "0" に正規化される', () => {
    const palette = [{ Name: 'minecraft:beehive', Properties: { honey_level: 'false' } }];
    const { palette: result } = sanitizeForOderso(palette);
    expect(result[0].Properties.honey_level).toBe('0');
  });

  test('beehive の honey_level が "6"（範囲外）の場合 "0" に正規化される', () => {
    const palette = [{ Name: 'minecraft:beehive', Properties: { honey_level: '6' } }];
    const { palette: result } = sanitizeForOderso(palette);
    expect(result[0].Properties.honey_level).toBe('0');
  });

  test('beehive の honey_level が "3"（正常）の場合は変換しない', () => {
    const palette = [{ Name: 'minecraft:beehive', Properties: { honey_level: '3' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Properties.honey_level).toBe('3');
    expect(log.length).toBe(0);
  });

  test('bee_nest の honey_level が不正値の場合も "0" に正規化される', () => {
    const palette = [{ Name: 'minecraft:bee_nest', Properties: { honey_level: '-1' } }];
    const { palette: result } = sanitizeForOderso(palette);
    expect(result[0].Properties.honey_level).toBe('0');
  });

  // ─── rail 必須state補完 ────────────────────────────────────────────────

  test('rail の shape が欠落している場合 "north_south" が補完される', () => {
    const palette = [{ Name: 'minecraft:rail', Properties: { powered: 'false' } }];
    const { palette: result } = sanitizeForOderso(palette);
    expect(result[0].Properties.shape).toBe('north_south');
  });

  test('rail の shape が既存の場合は上書きしない', () => {
    const palette = [{ Name: 'minecraft:rail', Properties: { shape: 'east_west', powered: 'false', waterlogged: 'false' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Properties.shape).toBe('east_west');
    expect(log.length).toBe(0);
  });

  test('detector_rail の shape が欠落している場合も補完される', () => {
    const palette = [{ Name: 'minecraft:detector_rail', Properties: {} }];
    const { palette: result } = sanitizeForOderso(palette);
    expect(result[0].Properties.shape).toBe('north_south');
    expect(result[0].Properties.waterlogged).toBe('false');
  });

  // ─── REDSTONE_SAFE — 変換しない ────────────────────────────────────────

  test('minecraft:repeater は変換されない', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { delay: '2', facing: 'north', locked: 'false', powered: 'false' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:repeater');
    expect(result[0].Properties.delay).toBe('2');
    expect(log.length).toBe(0);
  });

  test('minecraft:comparator は変換されない', () => {
    const palette = [{ Name: 'minecraft:comparator', Properties: { facing: 'east', mode: 'subtract', powered: 'true' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:comparator');
    expect(result[0].Properties.mode).toBe('subtract');
    expect(log.length).toBe(0);
  });

  test('minecraft:observer は変換されない', () => {
    const palette = [{ Name: 'minecraft:observer', Properties: { facing: 'up', powered: 'false' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:observer');
    expect(log.length).toBe(0);
  });

  // ─── VARIANT_SUFFIXES — 変換しない ────────────────────────────────────

  test('nether_brick_slab は変換されない', () => {
    const palette = [{ Name: 'minecraft:nether_brick_slab', Properties: { type: 'bottom', waterlogged: 'false' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:nether_brick_slab');
    expect(log.length).toBe(0);
  });

  test('oak_door は変換されない', () => {
    const palette = [{ Name: 'minecraft:oak_door', Properties: { facing: 'north', half: 'lower' } }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:oak_door');
    expect(log.length).toBe(0);
  });

  // ─── ログのカウント集計 ────────────────────────────────────────────────

  test('複数の frame ブロックがある場合、ログの count が合算される', () => {
    const palette = [
      { Name: 'minecraft:frame', Properties: {} },
      { Name: 'minecraft:stone', Properties: {} },
      { Name: 'minecraft:frame', Properties: {} },
    ];
    const { log } = sanitizeForOderso(palette);
    const frameLog = log.find(l => l.original === 'minecraft:frame');
    expect(frameLog).toBeDefined();
    expect(frameLog.count).toBe(2);
  });

  test('air自体は変換されない', () => {
    const palette = [{ Name: 'minecraft:air', Properties: {} }];
    const { palette: result, log } = sanitizeForOderso(palette);
    expect(result[0].Name).toBe('minecraft:air');
    expect(log.length).toBe(0);
  });

  test('変換不要なパレットはlogが空になる', () => {
    const palette = [
      { Name: 'minecraft:stone', Properties: {} },
      { Name: 'minecraft:oak_log', Properties: { axis: 'y' } },
    ];
    const { log } = sanitizeForOderso(palette);
    expect(log.length).toBe(0);
  });

});
