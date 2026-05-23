import { describe, test, expect } from 'vitest';
import { normalizeBoundingBox, checkMergeSafety } from '../js/modules/logic/merge.js';

describe('normalizeBoundingBox', () => {

  test('2構造: x=0とx=5000 → 相対距離5000を維持してゼロ基準に', () => {
    const origins = [{ x: 0, y: 0, z: 0 }, { x: 5000, y: 0, z: 0 }];
    const dims    = [{ x: 10, y: 5, z: 10 }, { x: 10, y: 5, z: 10 }];
    const { normalizedOrigins, totalBounds } = normalizeBoundingBox(origins, dims);
    expect(normalizedOrigins[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(normalizedOrigins[1]).toEqual({ x: 5000, y: 0, z: 0 });
    expect(totalBounds.x).toBe(5010);
  });

  test('構造間の距離が近い場合は変換後も相対距離が保たれる', () => {
    const origins = [{ x: 100, y: 64, z: 200 }, { x: 110, y: 64, z: 200 }];
    const dims    = [{ x: 5, y: 5, z: 5 }, { x: 5, y: 5, z: 5 }];
    const { normalizedOrigins } = normalizeBoundingBox(origins, dims);
    expect(normalizedOrigins[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(normalizedOrigins[1]).toEqual({ x: 10, y: 0, z: 0 });
  });

  test('負座標を含む場合もゼロ基準に正規化される', () => {
    const origins = [{ x: -100, y: 0, z: -50 }, { x: 0, y: 0, z: 0 }];
    const dims    = [{ x: 10, y: 5, z: 10 }, { x: 10, y: 5, z: 10 }];
    const { normalizedOrigins, minOrigin } = normalizeBoundingBox(origins, dims);
    expect(normalizedOrigins[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(normalizedOrigins[1]).toEqual({ x: 100, y: 0, z: 50 });
    expect(minOrigin).toEqual({ x: -100, y: 0, z: -50 });
  });

  test('1構造のみの場合 normalizedOrigins[0] は {0,0,0}', () => {
    const origins = [{ x: 300, y: 64, z: 300 }];
    const dims    = [{ x: 20, y: 10, z: 20 }];
    const { normalizedOrigins, totalBounds } = normalizeBoundingBox(origins, dims);
    expect(normalizedOrigins[0]).toEqual({ x: 0, y: 0, z: 0 });
    expect(totalBounds).toEqual({ x: 20, y: 10, z: 20 });
  });

  test('空配列は空結果を返す', () => {
    const { normalizedOrigins, totalBounds } = normalizeBoundingBox([], []);
    expect(normalizedOrigins).toHaveLength(0);
    expect(totalBounds).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('y方向のオフセットも正規化される', () => {
    const origins = [{ x: 0, y: 100, z: 0 }, { x: 0, y: 200, z: 0 }];
    const dims    = [{ x: 5, y: 5, z: 5 }, { x: 5, y: 5, z: 5 }];
    const { normalizedOrigins } = normalizeBoundingBox(origins, dims);
    expect(normalizedOrigins[0].y).toBe(0);
    expect(normalizedOrigins[1].y).toBe(100);
  });
});

describe('checkMergeSafety', () => {

  test('正常サイズはok=trueを返す', () => {
    const result = checkMergeSafety({ x: 100, y: 50, z: 100 });
    expect(result.ok).toBe(true);
    expect(result.estimatedVolume).toBe(500000);
  });

  test('一辺が2048超でok=falseとmessageを返す', () => {
    const result = checkMergeSafety({ x: 3000, y: 50, z: 100 });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('3000');
  });

  test('体積が5000万超でok=falseとmessageを返す', () => {
    const result = checkMergeSafety({ x: 500, y: 500, z: 500 }); // 125M > 50M
    expect(result.ok).toBe(false);
    expect(result.message).toContain('M ブロック');
  });

  test('ちょうど境界値（2048）はok=true', () => {
    expect(checkMergeSafety({ x: 2048, y: 1, z: 1 }).ok).toBe(true);
  });

  test('境界値+1（2049）はok=false', () => {
    expect(checkMergeSafety({ x: 2049, y: 1, z: 1 }).ok).toBe(false);
  });

  test('体積ちょうど5000万はok=true', () => {
    // 50 * 1000 * 1000 = 50_000_000
    expect(checkMergeSafety({ x: 50, y: 1000, z: 1000 }).ok).toBe(true);
  });

  test('体積5000万+1はok=false', () => {
    // 51 * 1000 * 1000 = 51_000_000
    expect(checkMergeSafety({ x: 51, y: 1000, z: 1000 }).ok).toBe(false);
  });
});
