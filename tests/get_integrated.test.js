import { describe, test, expect } from 'vitest';
import { ProjectManager } from '../js/core/project-manager.js';

const makeProject = (structures) => ({ id: 'p1', name: 'test', structures });

describe('getIntegrated', () => {

  test('複数構造の同一ブロックが multiplier 込みで合算される', () => {
    const project = makeProject([
      { id: 's1', multiplier: 2, results: [{ id: 'minecraft:stone', count: 10, category: 'building' }] },
      { id: 's2', multiplier: 1, results: [{ id: 'minecraft:stone', count: 5,  category: 'building' }] },
    ]);
    const out = ProjectManager.getIntegrated(project, null);
    expect(out).toHaveLength(1);
    expect(out[0].count).toBe(25); // 10*2 + 5*1
    expect(out[0].stacks).toBe(0);
    expect(out[0].remainder).toBe(25);
  });

  test('ID が正規化されても category が保持される (大文字/空白入り ID)', () => {
    const project = makeProject([
      { id: 's1', multiplier: 1, results: [{ id: 'Minecraft:Stone', count: 3, category: 'building' }] },
    ]);
    const out = ProjectManager.getIntegrated(project, null);
    expect(out[0].id).toBe('minecraft:stone');
    // 旧実装は r.id ('Minecraft:Stone') と集計キー ('minecraft:stone') の不一致で 'other' に落ちていた
    expect(out[0].category).toBe('building');
  });

  test('置換後の ID にも元ブロックの category が引き継がれる', () => {
    const project = makeProject([
      { id: 's1', multiplier: 1, results: [{ id: 'minecraft:stone', count: 64, category: 'building' }] },
    ]);
    const repMap = new Map([['minecraft:stone', 'minecraft:deepslate']]);
    const out = ProjectManager.getIntegrated(project, new Map([['s1', repMap]]));
    expect(out[0].id).toBe('minecraft:deepslate');
    expect(out[0].category).toBe('building');
  });

  test('air は集計から除外される', () => {
    const project = makeProject([
      { id: 's1', multiplier: 1, results: [
        { id: 'minecraft:air', count: 100, category: 'other' },
        { id: 'minecraft:dirt', count: 1, category: 'natural' },
      ] },
    ]);
    const out = ProjectManager.getIntegrated(project, null);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('minecraft:dirt');
  });

  test('count 降順でソートされ、stacks/remainder/slots が正しい', () => {
    const project = makeProject([
      { id: 's1', multiplier: 1, results: [
        { id: 'minecraft:dirt',  count: 65,  category: 'natural' },
        { id: 'minecraft:stone', count: 200, category: 'building' },
      ] },
    ]);
    const out = ProjectManager.getIntegrated(project, null);
    expect(out[0].id).toBe('minecraft:stone');
    expect(out[0].stacks).toBe(3);     // 192
    expect(out[0].remainder).toBe(8);
    expect(out[0].slots).toBe(4);
    expect(out[1].stacks).toBe(1);
    expect(out[1].remainder).toBe(1);
  });
});
