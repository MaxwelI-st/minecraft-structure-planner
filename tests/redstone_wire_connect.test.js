/**
 * redstone_wire_connect.test.js — ダスト接続フラグ計算（完全 MC 準拠）の単体テスト
 */
import { describe, it, expect } from 'vitest';
import {
  computeWireConnections,
  encodeConnections,
  countConnections,
  __testing__,
} from '../js/modules/logic/redstone_wire_connect.js';

const { _isOpaqueForDust, _isDust } = __testing__;

/**
 * テスト用の getBlock を Map から生成。キー: "x,y,z"
 */
function makeGetBlock(map) {
  return (x, y, z) => map.get(`${x},${y},${z}`) ?? null;
}

describe('_isOpaqueForDust', () => {
  it('stone/dirt/planks are opaque', () => {
    expect(_isOpaqueForDust('minecraft:stone')).toBe(true);
    expect(_isOpaqueForDust('minecraft:dirt')).toBe(true);
    expect(_isOpaqueForDust('minecraft:oak_planks')).toBe(true);
    expect(_isOpaqueForDust('minecraft:redstone_block')).toBe(true);
  });

  it('air / water / glass are not opaque', () => {
    expect(_isOpaqueForDust('minecraft:air')).toBe(false);
    expect(_isOpaqueForDust('minecraft:water')).toBe(false);
    expect(_isOpaqueForDust('minecraft:glass')).toBe(false);
    expect(_isOpaqueForDust('minecraft:oak_leaves')).toBe(false);
  });

  it('slabs / stairs / fences / panes are not opaque', () => {
    expect(_isOpaqueForDust('minecraft:stone_slab')).toBe(false);
    expect(_isOpaqueForDust('minecraft:oak_stairs')).toBe(false);
    expect(_isOpaqueForDust('minecraft:oak_fence')).toBe(false);
    expect(_isOpaqueForDust('minecraft:glass_pane')).toBe(false);
  });

  it('redstone devices are not opaque', () => {
    expect(_isOpaqueForDust('minecraft:redstone_wire')).toBe(false);
    expect(_isOpaqueForDust('minecraft:repeater')).toBe(false);
    expect(_isOpaqueForDust('minecraft:piston')).toBe(false);
    expect(_isOpaqueForDust('minecraft:redstone_torch')).toBe(false);
  });
});

describe('_isDust', () => {
  it('recognizes redstone_wire', () => {
    expect(_isDust('minecraft:redstone_wire')).toBe(true);
    expect(_isDust('redstone_wire')).toBe(true);
  });

  it('rejects other blocks', () => {
    expect(_isDust('minecraft:repeater')).toBe(false);
    expect(_isDust(null)).toBe(false);
  });
});

describe('computeWireConnections — 基本接続', () => {
  it('完全に孤立 → 全方向 none', () => {
    const m = new Map();
    const getBlock = makeGetBlock(m);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, getBlock);
    expect(conn).toEqual({ n: 'none', s: 'none', e: 'none', w: 'none' });
  });

  it('東に隣接ダスト → e=side', () => {
    const m = new Map([
      ['1,0,0', { blockId: 'minecraft:redstone_wire' }],
    ]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('side');
    expect(conn.w).toBe('none');
    expect(conn.n).toBe('none');
    expect(conn.s).toBe('none');
  });

  it('4 方向すべてに隣接ダスト → 全 side (十字)', () => {
    const m = new Map([
      ['0,0,-1', { blockId: 'minecraft:redstone_wire' }],
      ['0,0,1',  { blockId: 'minecraft:redstone_wire' }],
      ['1,0,0',  { blockId: 'minecraft:redstone_wire' }],
      ['-1,0,0', { blockId: 'minecraft:redstone_wire' }],
    ]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn).toEqual({ n: 'side', s: 'side', e: 'side', w: 'side' });
  });
});

describe('computeWireConnections — 信号源接続', () => {
  it('隣がレバー → side', () => {
    const m = new Map([['1,0,0', { blockId: 'minecraft:lever' }]]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('side');
  });

  it('隣がトーチ → side', () => {
    const m = new Map([['0,0,1', { blockId: 'minecraft:redstone_torch' }]]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.s).toBe('side');
  });

  it('隣がリピーター → side (初版: 両側接続)', () => {
    const m = new Map([['-1,0,0', { blockId: 'minecraft:powered_repeater' }]]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.w).toBe('side');
  });

  it('隣がボタン / 感圧板 / 観察者 → side', () => {
    const m = new Map([
      ['0,0,-1', { blockId: 'minecraft:wooden_button' }],
      ['1,0,0',  { blockId: 'minecraft:stone_pressure_plate' }],
      ['0,0,1',  { blockId: 'minecraft:observer' }],
    ]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.n).toBe('side');
    expect(conn.e).toBe('side');
    expect(conn.s).toBe('side');
  });
});

describe('computeWireConnections — up 接続 (上り階段)', () => {
  it('隣が不透過 + その上にダスト + 自分の真上が透明 → up', () => {
    const m = new Map([
      ['1,0,0', { blockId: 'minecraft:stone' }],           // 隣の不透過ブロック
      ['1,1,0', { blockId: 'minecraft:redstone_wire' }],   // その上のダスト
      // (0, 1, 0) は air (Map に無い)
    ]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('up');
  });

  it('自分の真上が不透過 → up にならない', () => {
    const m = new Map([
      ['1,0,0', { blockId: 'minecraft:stone' }],
      ['1,1,0', { blockId: 'minecraft:redstone_wire' }],
      ['0,1,0', { blockId: 'minecraft:stone' }],           // 真上が不透過
    ]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('none');
  });

  it('隣の上にダストが無ければ up にならない', () => {
    const m = new Map([['1,0,0', { blockId: 'minecraft:stone' }]]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('none');
  });
});

describe('computeWireConnections — 下り階段 (隣が空気)', () => {
  it('隣が空気 + その下にダスト → side', () => {
    const m = new Map([
      ['1,-1,0', { blockId: 'minecraft:redstone_wire' }],
      // (1, 0, 0) は air
    ]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('side');
  });

  it('隣が空気 + その下も空気 → none', () => {
    const m = new Map();
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('none');
  });
});

describe('computeWireConnections — 透明ブロック (接続不可)', () => {
  it('隣がガラス → 接続なし', () => {
    const m = new Map([['1,0,0', { blockId: 'minecraft:glass' }]]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('none');
  });

  it('隣がスラブ → 接続なし', () => {
    const m = new Map([['1,0,0', { blockId: 'minecraft:stone_slab' }]]);
    const conn = computeWireConnections({ x: 0, y: 0, z: 0 }, makeGetBlock(m));
    expect(conn.e).toBe('none');
  });
});

describe('encodeConnections / countConnections', () => {
  it('encodeConnections フォーマット', () => {
    expect(encodeConnections({ n: 'side', s: 'none', e: 'up', w: 'side' })).toBe('s0us');
    expect(encodeConnections({ n: 'none', s: 'none', e: 'none', w: 'none' })).toBe('0000');
  });

  it('countConnections カウント', () => {
    expect(countConnections({ n: 'side', s: 'none', e: 'side', w: 'none' })).toBe(2);
    expect(countConnections({ n: 'up', s: 'side', e: 'side', w: 'side' })).toBe(4);
    expect(countConnections({ n: 'none', s: 'none', e: 'none', w: 'none' })).toBe(0);
  });
});
