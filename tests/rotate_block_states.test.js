import { describe, test, expect } from 'vitest';
import { ProjectManager } from '../js/core/project-manager.js';

const rot = (states, r, id = '') => ProjectManager.rotateBlockStates(states, r, id);

describe('rotateBlockStates — 新形式 string state (1.20.40+)', () => {

  test('minecraft:cardinal_direction が 90°CW ずつ回る (repeater/comparator)', () => {
    expect(rot({ 'minecraft:cardinal_direction': 'north' }, 1)['minecraft:cardinal_direction']).toBe('east');
    expect(rot({ 'minecraft:cardinal_direction': 'north' }, 2)['minecraft:cardinal_direction']).toBe('south');
    expect(rot({ 'minecraft:cardinal_direction': 'north' }, 3)['minecraft:cardinal_direction']).toBe('west');
    expect(rot({ 'minecraft:cardinal_direction': 'west'  }, 1)['minecraft:cardinal_direction']).toBe('north');
  });

  test('minecraft:facing_direction (string) の水平4方向が回る (observer)', () => {
    expect(rot({ 'minecraft:facing_direction': 'east' }, 1)['minecraft:facing_direction']).toBe('south');
    expect(rot({ 'minecraft:facing_direction': 'south' }, 2)['minecraft:facing_direction']).toBe('north');
  });

  test('minecraft:facing_direction の up/down は不変', () => {
    expect(rot({ 'minecraft:facing_direction': 'up' }, 1)['minecraft:facing_direction']).toBe('up');
    expect(rot({ 'minecraft:facing_direction': 'down' }, 3)['minecraft:facing_direction']).toBe('down');
  });

  test('NBT wrap 形式 ({value}) も回る', () => {
    const out = rot({ 'minecraft:cardinal_direction': { value: 'south' } }, 1);
    expect(out['minecraft:cardinal_direction']).toEqual({ value: 'west' });
  });

  test('rot=0 は同一オブジェクトを返す (no-op)', () => {
    const s = { 'minecraft:cardinal_direction': 'north' };
    expect(rot(s, 0)).toBe(s);
  });

  test('数値 state でないと壊れない (数値 facing_direction は別キーで既存処理)', () => {
    // 既存の数値 facing_direction (N=2) は 90°CW で E=5 になる (FACING6_ROT)
    expect(rot({ facing_direction: 2 }, 1).facing_direction).toBe(5);
  });
});

describe('rotateBlockStates — 既存 state の回帰確認', () => {

  test('Java facing (string) は従来どおり回る', () => {
    expect(rot({ facing: 'north' }, 1).facing).toBe('east');
  });

  test('weirdo_direction (階段) は従来どおり回る', () => {
    // STAIR_ROT = [2,3,1,0]: E(0)→S(2)
    expect(rot({ weirdo_direction: 0 }, 1, 'minecraft:oak_stairs').weirdo_direction).toBe(2);
  });

  test('pillar_axis は rot 奇数で x↔z', () => {
    expect(rot({ pillar_axis: 'x' }, 1).pillar_axis).toBe('z');
    expect(rot({ pillar_axis: 'x' }, 2).pillar_axis).toBe('x');
  });
});
