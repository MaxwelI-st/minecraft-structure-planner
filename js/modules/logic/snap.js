/**
 * snap.js — 隣接面スナップ計算
 *
 * 構造 B を構造 A の指定面に「ぴったり接する」位置に置くための絶対オフセットを返す。
 * 純粋関数（DOM 非依存、整数演算のみ）。
 *
 * 座標規約：各構造は AABB [offset, offset+size-1] を占有（包含、整数）。
 * 垂直軸の整列は A の最小角に合わせる（決定論的、整数安全）。
 */

export const DIRECTIONS = ['+x', '-x', '+y', '-y', '+z', '-z'];

export const DIRECTION_LABELS = {
  '+x': '東 (+X)',
  '-x': '西 (-X)',
  '+y': '上 (+Y)',
  '-y': '下 (-Y)',
  '+z': '南 (+Z)',
  '-z': '北 (-Z)',
};

/**
 * @param {{ offset: {x,y,z}, size: {x,y,z} }} structA  基準
 * @param {{ offset: {x,y,z}, size: {x,y,z} }} structB  動かす構造
 * @param {'+x'|'-x'|'+y'|'-y'|'+z'|'-z'} direction A のどの面に B を付けるか
 * @returns {{x:number, y:number, z:number}} B に設定すべき新しい絶対オフセット
 */
export function snapStructure(structA, structB, direction) {
  const a = structA.offset;
  const aSize = structA.size;
  const bSize = structB.size;

  let nx = a.x, ny = a.y, nz = a.z;

  switch (direction) {
    case '+x': nx = a.x + aSize.x; ny = a.y; nz = a.z; break;
    case '-x': nx = a.x - bSize.x; ny = a.y; nz = a.z; break;
    case '+y': ny = a.y + aSize.y; nx = a.x; nz = a.z; break;
    case '-y': ny = a.y - bSize.y; nx = a.x; nz = a.z; break;
    case '+z': nz = a.z + aSize.z; nx = a.x; ny = a.y; break;
    case '-z': nz = a.z - bSize.z; nx = a.x; ny = a.y; break;
    default: throw new Error(`snapStructure: unknown direction ${direction}`);
  }

  return { x: nx | 0, y: ny | 0, z: nz | 0 };
}

/**
 * 2構造の AABB が重なっているか判定。重なり警告 UI 用。
 * @param {{ offset:{x,y,z}, size:{x,y,z} }} a
 * @param {{ offset:{x,y,z}, size:{x,y,z} }} b
 * @returns {boolean}
 */
export function aabbOverlaps(a, b) {
  return (a.offset.x < b.offset.x + b.size.x && a.offset.x + a.size.x > b.offset.x)
      && (a.offset.y < b.offset.y + b.size.y && a.offset.y + a.size.y > b.offset.y)
      && (a.offset.z < b.offset.z + b.size.z && a.offset.z + a.size.z > b.offset.z);
}
