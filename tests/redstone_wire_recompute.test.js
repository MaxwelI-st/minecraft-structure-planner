/**
 * redstone_wire_recompute.test.js — Litematic 出力前の wire 接続再計算テスト
 */
import { describe, it, expect } from 'vitest';
import { recomputeWireConnections } from '../js/modules/logic/redstone_audit.js';

/** ZYX flat index: SZ*SY*x + SZ*y + z */
function zyxIdx(x, y, z, SY, SZ) {
  return SZ * SY * x + SZ * y + z;
}

describe('recomputeWireConnections', () => {
  it('wire のない構造ではノーオペで返す', () => {
    const palette = [
      { Name: 'minecraft:air', Properties: {} },
      { Name: 'minecraft:stone', Properties: {} },
    ];
    const indices = new Uint16Array(8); // 2x2x2 all-air
    const r = recomputeWireConnections(indices, palette, 2, 2, 2);
    expect(r.wireCount).toBe(0);
    expect(r.newEntries).toBe(0);
    expect(r.palette).toBe(palette); // 参照同一 (no-op)
  });

  it('単独 wire は全方向 none で 1 palette エントリ追加', () => {
    const palette = [
      { Name: 'minecraft:air', Properties: {} },
      { Name: 'minecraft:redstone_wire', Properties: { power: '0' } },
    ];
    const SX = 3, SY = 1, SZ = 3;
    const indices = new Uint16Array(SX * SY * SZ);
    // 中央 (1, 0, 1) に wire
    indices[zyxIdx(1, 0, 1, SY, SZ)] = 1;
    const r = recomputeWireConnections(indices, palette, SX, SY, SZ);
    expect(r.wireCount).toBe(1);
    expect(r.newEntries).toBe(1);
    const newEntry = r.palette[r.indices[zyxIdx(1, 0, 1, SY, SZ)]];
    expect(newEntry.Name).toBe('minecraft:redstone_wire');
    expect(newEntry.Properties.north).toBe('none');
    expect(newEntry.Properties.south).toBe('none');
    expect(newEntry.Properties.east).toBe('none');
    expect(newEntry.Properties.west).toBe('none');
  });

  it('東西に並んだ 2 wire は互いに side で接続', () => {
    const palette = [
      { Name: 'minecraft:air', Properties: {} },
      { Name: 'minecraft:redstone_wire', Properties: { power: '0' } },
    ];
    const SX = 3, SY = 1, SZ = 3;
    const indices = new Uint16Array(SX * SY * SZ);
    indices[zyxIdx(0, 0, 1, SY, SZ)] = 1; // west wire
    indices[zyxIdx(1, 0, 1, SY, SZ)] = 1; // center wire
    const r = recomputeWireConnections(indices, palette, SX, SY, SZ);
    expect(r.wireCount).toBe(2);
    // center は east=side (1,0,1 の east 隣は 2,0,1 = air、west 隣は 0,0,1 = wire)
    const centerEntry = r.palette[r.indices[zyxIdx(1, 0, 1, SY, SZ)]];
    expect(centerEntry.Properties.west).toBe('side');
    expect(centerEntry.Properties.east).toBe('none');
    // west wire は east=side (隣に center wire), west=none
    const westEntry = r.palette[r.indices[zyxIdx(0, 0, 1, SY, SZ)]];
    expect(westEntry.Properties.east).toBe('side');
    expect(westEntry.Properties.west).toBe('none');
  });

  it('同じ接続パターンの wire は同じ palette エントリに統合', () => {
    const palette = [
      { Name: 'minecraft:air', Properties: {} },
      { Name: 'minecraft:redstone_wire', Properties: { power: '0' } },
    ];
    const SX = 5, SY = 1, SZ = 1;
    const indices = new Uint16Array(SX * SY * SZ);
    // 5 個並び: 0-1-2-3-4 全部 wire
    for (let x = 0; x < 5; x++) indices[zyxIdx(x, 0, 0, SY, SZ)] = 1;
    const r = recomputeWireConnections(indices, palette, SX, SY, SZ);
    expect(r.wireCount).toBe(5);
    // パターン: 端 2 個は片側のみ side、中 3 個は両側 side
    // → 3 種類のエントリ (end-east, end-west, middle)
    expect(r.newEntries).toBe(3);
    // 中央 3 つは同じ palette index を指す
    expect(r.indices[zyxIdx(1, 0, 0, SY, SZ)]).toBe(r.indices[zyxIdx(2, 0, 0, SY, SZ)]);
    expect(r.indices[zyxIdx(2, 0, 0, SY, SZ)]).toBe(r.indices[zyxIdx(3, 0, 0, SY, SZ)]);
    // 端は中央と異なる
    expect(r.indices[zyxIdx(0, 0, 0, SY, SZ)]).not.toBe(r.indices[zyxIdx(2, 0, 0, SY, SZ)]);
  });

  it('信号源 (lever) が隣にあれば side 接続', () => {
    const palette = [
      { Name: 'minecraft:air', Properties: {} },
      { Name: 'minecraft:redstone_wire', Properties: { power: '0' } },
      { Name: 'minecraft:lever', Properties: {} },
    ];
    const SX = 3, SY = 1, SZ = 1;
    const indices = new Uint16Array(SX * SY * SZ);
    indices[zyxIdx(1, 0, 0, SY, SZ)] = 1; // wire
    indices[zyxIdx(2, 0, 0, SY, SZ)] = 2; // lever to east
    const r = recomputeWireConnections(indices, palette, SX, SY, SZ);
    const wireEntry = r.palette[r.indices[zyxIdx(1, 0, 0, SY, SZ)]];
    expect(wireEntry.Properties.east).toBe('side');
  });

  it('既存の Properties (power) を保持', () => {
    const palette = [
      { Name: 'minecraft:air', Properties: {} },
      { Name: 'minecraft:redstone_wire', Properties: { power: '12' } },
    ];
    const SX = 1, SY = 1, SZ = 1;
    const indices = new Uint16Array(1);
    indices[0] = 1;
    const r = recomputeWireConnections(indices, palette, SX, SY, SZ);
    const newEntry = r.palette[r.indices[0]];
    expect(newEntry.Properties.power).toBe('12');
  });
});
