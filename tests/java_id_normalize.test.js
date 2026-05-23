import { describe, test, expect } from 'vitest';
import { toJavaOutputId, normalizeJavaPalette } from '../js/modules/logic/java_id_normalize.js';

describe('toJavaOutputId', () => {

  // ─── 変換される（フルブロック）────────────────────────────────────────

  test('nether_brick → nether_bricks', () => {
    expect(toJavaOutputId('minecraft:nether_brick')).toBe('minecraft:nether_bricks');
  });

  test('red_nether_brick → red_nether_bricks', () => {
    expect(toJavaOutputId('minecraft:red_nether_brick')).toBe('minecraft:red_nether_bricks');
  });

  test('stone_brick → stone_bricks', () => {
    expect(toJavaOutputId('minecraft:stone_brick')).toBe('minecraft:stone_bricks');
  });

  test('brick → bricks', () => {
    expect(toJavaOutputId('minecraft:brick')).toBe('minecraft:bricks');
  });

  test('chiseled_stone_brick → chiseled_stone_bricks', () => {
    expect(toJavaOutputId('minecraft:chiseled_stone_brick')).toBe('minecraft:chiseled_stone_bricks');
  });

  test('cracked_stone_brick → cracked_stone_bricks', () => {
    expect(toJavaOutputId('minecraft:cracked_stone_brick')).toBe('minecraft:cracked_stone_bricks');
  });

  test('mossy_stone_brick → mossy_stone_bricks', () => {
    expect(toJavaOutputId('minecraft:mossy_stone_brick')).toBe('minecraft:mossy_stone_bricks');
  });

  test('end_stone_brick → end_stone_bricks', () => {
    expect(toJavaOutputId('minecraft:end_stone_brick')).toBe('minecraft:end_stone_bricks');
  });

  // ─── 変換されない（接尾辞ガード）────────────────────────────────────────

  test('nether_brick_slab は変換しない', () => {
    expect(toJavaOutputId('minecraft:nether_brick_slab')).toBe('minecraft:nether_brick_slab');
  });

  test('nether_brick_stairs は変換しない', () => {
    expect(toJavaOutputId('minecraft:nether_brick_stairs')).toBe('minecraft:nether_brick_stairs');
  });

  test('nether_brick_fence は変換しない', () => {
    expect(toJavaOutputId('minecraft:nether_brick_fence')).toBe('minecraft:nether_brick_fence');
  });

  test('nether_brick_fence_gate は変換しない', () => {
    expect(toJavaOutputId('minecraft:nether_brick_fence_gate')).toBe('minecraft:nether_brick_fence_gate');
  });

  test('nether_brick_wall は変換しない', () => {
    expect(toJavaOutputId('minecraft:nether_brick_wall')).toBe('minecraft:nether_brick_wall');
  });

  test('red_nether_brick_slab は変換しない', () => {
    expect(toJavaOutputId('minecraft:red_nether_brick_slab')).toBe('minecraft:red_nether_brick_slab');
  });

  test('stone_brick_stairs は変換しない', () => {
    expect(toJavaOutputId('minecraft:stone_brick_stairs')).toBe('minecraft:stone_brick_stairs');
  });

  test('stone_brick_wall は変換しない', () => {
    expect(toJavaOutputId('minecraft:stone_brick_wall')).toBe('minecraft:stone_brick_wall');
  });

  // ─── 未知IDはそのまま ─────────────────────────────────────────────────

  test('未知のIDはそのまま返す', () => {
    expect(toJavaOutputId('minecraft:custom_block')).toBe('minecraft:custom_block');
  });

  test('minecraft:stone はそのまま', () => {
    expect(toJavaOutputId('minecraft:stone')).toBe('minecraft:stone');
  });

  test('minecraft:air はそのまま', () => {
    expect(toJavaOutputId('minecraft:air')).toBe('minecraft:air');
  });
});

describe('normalizeJavaPalette', () => {

  test('変換対象エントリが変換される', () => {
    const palette = [
      { Name: 'minecraft:nether_brick', Properties: {} },
      { Name: 'minecraft:stone', Properties: {} },
    ];
    const { palette: result, changed } = normalizeJavaPalette(palette);
    expect(result[0].Name).toBe('minecraft:nether_bricks');
    expect(result[1].Name).toBe('minecraft:stone');
    expect(changed).toHaveLength(1);
    expect(changed[0]).toEqual({ from: 'minecraft:nether_brick', to: 'minecraft:nether_bricks' });
  });

  test('変換不要なパレットは changed が空', () => {
    const palette = [
      { Name: 'minecraft:stone', Properties: {} },
      { Name: 'minecraft:oak_log', Properties: { axis: 'y' } },
    ];
    const { changed } = normalizeJavaPalette(palette);
    expect(changed).toHaveLength(0);
  });

  test('Properties は保持される', () => {
    const palette = [{ Name: 'minecraft:stone_brick', Properties: { waterlogged: 'false' } }];
    const { palette: result } = normalizeJavaPalette(palette);
    expect(result[0].Name).toBe('minecraft:stone_bricks');
    expect(result[0].Properties.waterlogged).toBe('false');
  });

  test('slab は変換されない', () => {
    const palette = [{ Name: 'minecraft:nether_brick_slab', Properties: { type: 'bottom' } }];
    const { palette: result, changed } = normalizeJavaPalette(palette);
    expect(result[0].Name).toBe('minecraft:nether_brick_slab');
    expect(changed).toHaveLength(0);
  });
});
