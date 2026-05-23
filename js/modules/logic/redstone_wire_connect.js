/**
 * redstone_wire_connect.js — Redstone Dust 接続フラグ計算（完全 MC 準拠）
 *
 * 公式 Minecraft 仕様:
 *   各 ±xz 方向について、以下のいずれかで接続する:
 *     1. 隣がダスト or 信号源ブロック        → 'side'
 *     2. 隣が不透過ブロックで、その上にダスト  → 'up'    (自分の真上が透明な場合のみ)
 *     3. 隣が空気（= 透明非信号源）で、隣の下にダスト → 'side' (下り階段接続)
 *     その他 → 'none'
 *
 * 純関数: getBlock コールバックを介して座標から block 情報を取得し、結果を返す。
 * Web 3D ビューア / Litematic 出力の両方から呼ばれる。
 */

import { isRedstoneSignalSource } from './bedrock_visual_state.js';

// ─────────────────────────────────────────────────────────────────────────────
// 不透過判定（信号を遮るブロックかどうか）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ブロックが「不透過」(信号を遮り、上にダストが伝わる足場になる) かを判定。
 * 透明ブロック（空気・水・ガラス・ハーフブロック・ダスト自体・装置類）は false。
 */
function _isOpaqueForDust(blockId) {
  if (!blockId) return false;
  const id = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
  const local = id.replace('minecraft:', '');

  // 明示的に透過
  if (local === 'air' || local === 'cave_air' || local === 'void_air') return false;
  if (local === 'water' || local === 'lava' || local === 'flowing_water' || local === 'flowing_lava') return false;
  if (/glass|leaves|ice|slime|honey/.test(local)) return false;
  // ハーフブロック・階段・フェンス・壁・カーペット等は完全不透過ではない
  if (/_slab$|_stairs$|_fence$|_wall$|_pane$|_carpet$|_door$|_trapdoor$|_fence_gate$/.test(local)) return false;
  // 装置・植物・薄物
  if (/torch|repeater|comparator|observer|piston|dropper|dispenser|hopper|crafter|lever|button|pressure_plate|rail|redstone_wire|tripwire|sign|skull|head|banner|ladder|vine|grass|flower|sapling|mushroom|cactus|cane|bamboo/.test(local)) return false;
  if (local === 'redstone_block') return true; // redstone block 自身は不透過扱い（信号源でもある）

  // それ以外（stone / dirt / planks / wool / concrete / log 等）は不透過
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// メイン: computeWireConnections
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} WireConnections
 * @property {'none'|'side'|'up'} n
 * @property {'none'|'side'|'up'} s
 * @property {'none'|'side'|'up'} e
 * @property {'none'|'side'|'up'} w
 */

/**
 * ダストブロック (x, y, z) について 4 方向の接続タイプを計算する。
 *
 * @param {{x:number,y:number,z:number}} coord
 * @param {(x:number,y:number,z:number) => ({blockId:string,states?:object}|null)} getBlock
 *   座標から block 情報を返すコールバック。空気は null を返す。
 * @returns {WireConnections}
 */
export function computeWireConnections(coord, getBlock) {
  const { x, y, z } = coord;
  const dirs = [
    { axis: 'n', dx:  0, dz: -1 },
    { axis: 's', dx:  0, dz: +1 },
    { axis: 'e', dx: +1, dz:  0 },
    { axis: 'w', dx: -1, dz:  0 },
  ];

  // 自分の真上が透明か（'up' 接続の判定で使う）
  const above = getBlock(x, y + 1, z);
  const aboveIsTransparent = !above || !_isOpaqueForDust(above.blockId);

  const result = { n: 'none', s: 'none', e: 'none', w: 'none' };

  for (const { axis, dx, dz } of dirs) {
    const neighbor = getBlock(x + dx, y, z + dz);

    if (!neighbor) {
      // 隣が空気 → 隣の下にダストがあれば「下り階段」接続 (side)
      const below = getBlock(x + dx, y - 1, z + dz);
      if (below && _isDust(below.blockId)) {
        result[axis] = 'side';
      }
      continue;
    }

    // 1. 隣がダスト or 信号源 → side 接続
    if (isRedstoneSignalSource(neighbor.blockId)) {
      result[axis] = 'side';
      continue;
    }

    // 2. 隣が不透過 → その上にダストがあれば up 接続 (自分の真上が透明な場合のみ)
    if (_isOpaqueForDust(neighbor.blockId)) {
      if (aboveIsTransparent) {
        const aboveNeighbor = getBlock(x + dx, y + 1, z + dz);
        if (aboveNeighbor && _isDust(aboveNeighbor.blockId)) {
          result[axis] = 'up';
        }
      }
      continue;
    }

    // 3. 隣が透明非信号源 → 接続なし (none のまま)
  }

  return result;
}

function _isDust(blockId) {
  if (!blockId) return false;
  const id = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
  return id === 'minecraft:redstone_wire';
}

// ─────────────────────────────────────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────────────────────────────────────

/** 接続フラグを 4 文字の圧縮文字列に変換（"side"=s, "up"=u, "none"=0）。signature 用。 */
export function encodeConnections(conn) {
  const code = (v) => v === 'side' ? 's' : v === 'up' ? 'u' : '0';
  return `${code(conn.n)}${code(conn.s)}${code(conn.e)}${code(conn.w)}`;
}

/** 接続数を数える (dot 判定用) */
export function countConnections(conn) {
  let n = 0;
  if (conn.n !== 'none') n++;
  if (conn.s !== 'none') n++;
  if (conn.e !== 'none') n++;
  if (conn.w !== 'none') n++;
  return n;
}

// テスト用 export
export const __testing__ = { _isOpaqueForDust, _isDust };
