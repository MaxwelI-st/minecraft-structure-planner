import { describe, test, expect } from 'vitest';
import { auditRedstoneStates } from '../js/modules/logic/redstone_audit.js';

describe('auditRedstoneStates', () => {

  // ─── スキーマ未定義ブロックは素通し ──────────────────────────────────────

  test('スキーマ未定義のブロックは素通し', () => {
    const palette = [{ Name: 'minecraft:stone', Properties: {} }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
  });

  test('minecraft:air は素通し', () => {
    const palette = [{ Name: 'minecraft:air', Properties: {} }];
    const { auditLog, palette: result } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
    expect(result[0].Name).toBe('minecraft:air');
  });

  // ─── repeater ────────────────────────────────────────────────────────────

  test('repeater の delay が欠落している場合は警告ログに記録される', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { facing: 'north', locked: 'false', powered: 'false' } }];
    const { auditLog } = auditRedstoneStates(palette);
    const entry = auditLog.find(l => l.state === 'delay');
    expect(entry).toBeDefined();
    expect(entry.issue).toContain('欠落');
  });

  test('repeater の delay が "0" の場合は不正値としてログに記録される', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { delay: '0', facing: 'north', locked: 'false', powered: 'false' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.some(l => l.state === 'delay' && l.issue.includes('不正値'))).toBe(true);
  });

  test('repeater の全state正常の場合はログが空', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { delay: '2', facing: 'north', locked: 'false', powered: 'false' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
  });

  test('repeater の delay が欠落した場合 Properties は変更されない（補完不可）', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { facing: 'north', locked: 'false', powered: 'false' } }];
    const { palette: result } = auditRedstoneStates(palette);
    // delay のデフォルトは未定義なので補完されない
    expect(result[0].Properties.delay).toBeUndefined();
  });

  test('repeater の facing が欠落している場合は "north" に補完される', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { delay: '1', locked: 'false', powered: 'false' } }];
    const { palette: result, auditLog } = auditRedstoneStates(palette);
    expect(result[0].Properties.facing).toBe('north');
    expect(auditLog.some(l => l.state === 'facing' && l.action.includes('補完'))).toBe(true);
  });

  test('repeater の delay が "5"（範囲外）の場合は不正値ログ', () => {
    const palette = [{ Name: 'minecraft:repeater', Properties: { delay: '5', facing: 'north', locked: 'false', powered: 'false' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.some(l => l.state === 'delay' && l.issue.includes('不正値'))).toBe(true);
  });

  // ─── comparator ──────────────────────────────────────────────────────────

  test('comparator の全state正常の場合はログが空', () => {
    const palette = [{ Name: 'minecraft:comparator', Properties: { facing: 'south', mode: 'subtract', powered: 'false' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
  });

  test('comparator の mode が欠落している場合 "compare" に補完される', () => {
    const palette = [{ Name: 'minecraft:comparator', Properties: { facing: 'north', powered: 'false' } }];
    const { palette: result } = auditRedstoneStates(palette);
    expect(result[0].Properties.mode).toBe('compare');
  });

  test('comparator の mode が不正値の場合 "compare" に補完される', () => {
    const palette = [{ Name: 'minecraft:comparator', Properties: { facing: 'north', mode: 'invalid', powered: 'false' } }];
    const { palette: result, auditLog } = auditRedstoneStates(palette);
    expect(result[0].Properties.mode).toBe('compare');
    expect(auditLog.some(l => l.state === 'mode' && l.issue.includes('不正値'))).toBe(true);
  });

  // ─── observer ────────────────────────────────────────────────────────────

  test('observer の facing が正常なら変更なし', () => {
    const palette = [{ Name: 'minecraft:observer', Properties: { facing: 'up', powered: 'false' } }];
    const { auditLog, palette: result } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
    expect(result[0].Properties.facing).toBe('up');
  });

  test('observer の facing が不正値の場合 "north" に補完される', () => {
    const palette = [{ Name: 'minecraft:observer', Properties: { facing: 'diagonal', powered: 'false' } }];
    const { palette: result } = auditRedstoneStates(palette);
    expect(result[0].Properties.facing).toBe('north');
  });

  // ─── redstone_wire ────────────────────────────────────────────────────────

  test('redstone_wire の power が 16 の場合は不正値', () => {
    const palette = [{ Name: 'minecraft:redstone_wire', Properties: { power: '16', north: 'none', south: 'none', east: 'none', west: 'none' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.some(l => l.state === 'power' && l.issue.includes('不正値'))).toBe(true);
  });

  test('redstone_wire の power が "15" は正常', () => {
    const palette = [{ Name: 'minecraft:redstone_wire', Properties: { power: '15', north: 'none', south: 'side', east: 'up', west: 'none' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
  });

  test('redstone_wire の接続方向が欠落している場合 "none" に補完される', () => {
    const palette = [{ Name: 'minecraft:redstone_wire', Properties: { power: '0' } }];
    const { palette: result } = auditRedstoneStates(palette);
    expect(result[0].Properties.north).toBe('none');
    expect(result[0].Properties.south).toBe('none');
    expect(result[0].Properties.east).toBe('none');
    expect(result[0].Properties.west).toBe('none');
  });

  // ─── piston ──────────────────────────────────────────────────────────────

  test('piston の全state正常の場合はログが空', () => {
    const palette = [{ Name: 'minecraft:piston', Properties: { extended: 'false', facing: 'north' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
  });

  test('sticky_piston の facing が欠落している場合 "north" に補完される', () => {
    const palette = [{ Name: 'minecraft:sticky_piston', Properties: { extended: 'true' } }];
    const { palette: result } = auditRedstoneStates(palette);
    expect(result[0].Properties.facing).toBe('north');
  });

  // ─── hopper / dropper / dispenser ────────────────────────────────────────

  test('hopper の facing が不正値の場合 "down" に補完される', () => {
    const palette = [{ Name: 'minecraft:hopper', Properties: { facing: 'up', enabled: 'true' } }];
    const { palette: result, auditLog } = auditRedstoneStates(palette);
    expect(result[0].Properties.facing).toBe('down');
    expect(auditLog.some(l => l.state === 'facing')).toBe(true);
  });

  test('dropper の全state正常の場合はログが空', () => {
    const palette = [{ Name: 'minecraft:dropper', Properties: { facing: 'up', triggered: 'false' } }];
    const { auditLog } = auditRedstoneStates(palette);
    expect(auditLog.length).toBe(0);
  });

  // ─── redstone_lamp ───────────────────────────────────────────────────────

  test('redstone_lamp の lit が欠落している場合 "false" に補完される', () => {
    const palette = [{ Name: 'minecraft:redstone_lamp', Properties: {} }];
    const { palette: result } = auditRedstoneStates(palette);
    expect(result[0].Properties.lit).toBe('false');
  });

  // ─── 複数ブロック混在 ─────────────────────────────────────────────────────

  test('正常なブロックと要補完ブロックが混在する場合、正常なものは変更されない', () => {
    const palette = [
      { Name: 'minecraft:stone', Properties: {} },
      { Name: 'minecraft:repeater', Properties: { delay: '3', facing: 'east', locked: 'false', powered: 'true' } },
      { Name: 'minecraft:observer', Properties: { powered: 'false' } }, // facing 欠落
    ];
    const { palette: result, auditLog } = auditRedstoneStates(palette);
    expect(result[0].Name).toBe('minecraft:stone');
    expect(result[1].Properties.delay).toBe('3'); // 変更なし
    expect(result[2].Properties.facing).toBe('north'); // 補完
    expect(auditLog.length).toBe(1);
  });

});
