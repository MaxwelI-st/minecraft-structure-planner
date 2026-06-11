/**
 * bedrock_visual_state.js — Bedrock 状態 → 統一 Visual Hints 抽出
 *
 * Web 3D ビューア用の軽量な状態解釈レイヤー。
 * `.litematic` 出力用の重量級 BeToJeConverter とは独立に動作し、
 * ビューアが Bedrock palette を直接読みながら facing / face / delay / mode
 * などの「描画に必要な情報」だけを取り出す。
 *
 * 設計方針:
 *  - 副作用なし、純関数
 *  - 未知ブロック / 未知 state は null を返す（描画側は default 動作にフォールバック）
 *  - レッドストーン関連 + 主要な方向性ブロックのみ対象
 *  - 階段／トラップドア／ドア／フェンスゲート等は既存 state-reader.js が扱うので干渉しない
 */

import {
  readOrientation, FACING6, DIR_TABLES, TORCH_FACING,
  LEVER_DIRECTION, BUTTON_FACING_DIR,
} from '../../render/orientation.js';

// ─────────────────────────────────────────────────────────────────────────────
// 内部ヘルパー
// ─────────────────────────────────────────────────────────────────────────────

function _bool(v) {
  if (v === true || v === 1 || v === '1' || v === 'true')  return true;
  if (v === false || v === 0 || v === '0' || v === 'false') return false;
  return Boolean(v);
}

function _intOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n | 0 : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// メイン: getVisualHints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bedrock ブロックの blockId + states から描画用 hints を抽出する。
 *
 * @param {string} blockId - 例: "minecraft:unpowered_repeater"
 * @param {object} states  - パレットエントリの states オブジェクト
 * @returns {{
 *   facing:  ('north'|'south'|'east'|'west'|'up'|'down'|null),
 *   face:    ('floor'|'wall'|'ceiling'|null),
 *   axis:    ('x'|'y'|'z'|null),
 *   delay:   (1|2|3|4|null),
 *   mode:    ('compare'|'subtract'|null),
 *   powered: boolean,
 *   power:   (number|null),
 *   lit:     boolean,
 *   extended:boolean,
 * }|null}  null = ヒント不要 (default 描画でOK)
 */
export function getVisualHints(blockId, states) {
  if (!blockId) return null;
  const id = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
  const s  = states || {};

  // 基本テンプレート (すべて null/false で初期化)
  const out = {
    facing: null, face: null, axis: null,
    delay: null, mode: null,
    powered: false, power: null,
    lit: false, extended: false,
  };
  const orientation = readOrientation(id, s);
  if (orientation) {
    out.facing = orientation.facing;
    out.face = orientation.face;
    out.axis = orientation.axis;
  }

  switch (id) {
    // ── Repeater (BE は powered/unpowered の 2 名前で分かれる) ─────────────
    case 'minecraft:repeater':
    case 'minecraft:unpowered_repeater':
    case 'minecraft:powered_repeater': {
      const d = _intOrNull(s.repeater_delay);
      out.delay = (d !== null && d >= 0 && d <= 3) ? (d + 1) : null;
      out.powered = (id === 'minecraft:powered_repeater') || _bool(s.powered);
      return out;
    }

    // ── Comparator ─────────────────────────────────────────────────────────
    case 'minecraft:comparator':
    case 'minecraft:unpowered_comparator':
    case 'minecraft:powered_comparator': {
      // output_subtract_bit 0|1 → mode compare|subtract
      const sub = _bool(s.output_subtract_bit) || (s.mode === 'subtract');
      out.mode = sub ? 'subtract' : 'compare';
      out.powered = _bool(s.output_lit_bit) || (id === 'minecraft:powered_comparator') || _bool(s.powered);
      return out;
    }

    // ── Observer ───────────────────────────────────────────────────────────
    case 'minecraft:observer': {
      out.powered = _bool(s.powered_bit) || _bool(s.powered);
      return out;
    }

    // ── Piston / Sticky Piston / Piston Head ───────────────────────────────
    case 'minecraft:piston':
    case 'minecraft:sticky_piston':
    case 'minecraft:piston_arm_collision':
    case 'minecraft:sticky_piston_arm_collision':
    case 'minecraft:piston_head':
    case 'minecraft:moving_piston': {
      out.extended = _bool(s.extended);
      return out;
    }

    // ── Dropper / Dispenser ────────────────────────────────────────────────
    case 'minecraft:dropper':
    case 'minecraft:dispenser': {
      out.powered = _bool(s.triggered_bit) || _bool(s.triggered);
      return out;
    }

    // ── Hopper ─────────────────────────────────────────────────────────────
    case 'minecraft:hopper': {
      return out;
    }

    // ── Torch (一般 / Soul / Redstone) ─────────────────────────────────────
    case 'minecraft:torch':
    case 'minecraft:soul_torch':
    case 'minecraft:wall_torch':
    case 'minecraft:soul_wall_torch':
    case 'minecraft:redstone_torch':
    case 'minecraft:unlit_redstone_torch':
    case 'minecraft:redstone_wall_torch':
    case 'minecraft:colored_torch_bp':
    case 'minecraft:colored_torch_rg': {
      out.lit = !id.startsWith('minecraft:unlit_');
      return out;
    }

    // ── Lever ──────────────────────────────────────────────────────────────
    case 'minecraft:lever': {
      out.powered = _bool(s.open_bit) || _bool(s.powered);
      return out;
    }

    // ── Button (各種 wood / stone / polished_blackstone 等) ────────────────
    case 'minecraft:wooden_button':
    case 'minecraft:oak_button':           // Bedrock 1.20+ で wooden_button から改名
    case 'minecraft:stone_button':
    case 'minecraft:polished_blackstone_button':
    case 'minecraft:spruce_button':
    case 'minecraft:birch_button':
    case 'minecraft:jungle_button':
    case 'minecraft:acacia_button':
    case 'minecraft:dark_oak_button':
    case 'minecraft:mangrove_button':
    case 'minecraft:cherry_button':
    case 'minecraft:bamboo_button':
    case 'minecraft:crimson_button':
    case 'minecraft:warped_button':
    case 'minecraft:pale_oak_button': {
      out.powered = _bool(s.button_pressed_bit) || _bool(s.powered);
      return out;
    }

    // ── Tripwire Hook ──────────────────────────────────────────────────────
    case 'minecraft:tripwire_hook': {
      out.powered = _bool(s.powered_bit);
      return out;
    }

    // ── Trip Wire (床上の糸) ───────────────────────────────────────────────
    case 'minecraft:trip_wire':
    case 'minecraft:tripwire': {
      out.powered = _bool(s.powered_bit);
      out.face = 'floor';
      return out;
    }

    // ── Redstone Wire (Dust) ───────────────────────────────────────────────
    case 'minecraft:redstone_wire': {
      const p = _intOrNull(s.redstone_signal) ?? _intOrNull(s.power);
      out.power = (p !== null) ? Math.max(0, Math.min(15, p)) : 0;
      out.powered = (out.power ?? 0) > 0;
      out.face = 'floor';
      // connections (n/s/e/w) は隣接情報必須なのでここでは決めない
      return out;
    }

    // ── Crafter ────────────────────────────────────────────────────────────
    case 'minecraft:crafter': {
      out.powered = _bool(s.triggered_bit) || _bool(s.triggered);
      return out;
    }

    // ── Daylight Detector ──────────────────────────────────────────────────
    case 'minecraft:daylight_detector':
    case 'minecraft:daylight_detector_inverted': {
      const p = _intOrNull(s.redstone_signal);
      out.power = (p !== null) ? Math.max(0, Math.min(15, p)) : 0;
      out.face = 'floor';
      return out;
    }

    // ── Pressure Plates (信号源として redstone_signal を持つ) ─────────────
    case 'minecraft:wooden_pressure_plate':
    case 'minecraft:oak_pressure_plate':              // Bedrock 1.20+ で改名
    case 'minecraft:stone_pressure_plate':
    case 'minecraft:polished_blackstone_pressure_plate':
    case 'minecraft:light_weighted_pressure_plate':
    case 'minecraft:heavy_weighted_pressure_plate':
    case 'minecraft:spruce_pressure_plate':
    case 'minecraft:birch_pressure_plate':
    case 'minecraft:jungle_pressure_plate':
    case 'minecraft:acacia_pressure_plate':
    case 'minecraft:dark_oak_pressure_plate':
    case 'minecraft:mangrove_pressure_plate':
    case 'minecraft:cherry_pressure_plate':
    case 'minecraft:bamboo_pressure_plate':
    case 'minecraft:pale_oak_pressure_plate':         // 1.21.30+
    case 'minecraft:crimson_pressure_plate':
    case 'minecraft:warped_pressure_plate': {
      const p = _intOrNull(s.redstone_signal);
      out.power = (p !== null) ? Math.max(0, Math.min(15, p)) : 0;
      out.powered = (out.power ?? 0) > 0;
      out.face = 'floor';
      return out;
    }

    default:
      return orientation ? out : null;
  }
}

/**
 * blockId が redstone 信号源とみなされるかどうか（dust の接続計算で使用）。
 * 公開してダスト接続計算モジュールから参照する。
 */
export function isRedstoneSignalSource(blockId) {
  if (!blockId) return false;
  const id = blockId.startsWith('minecraft:') ? blockId : `minecraft:${blockId}`;
  return REDSTONE_SIGNAL_SOURCE_SET.has(id);
}

const REDSTONE_SIGNAL_SOURCE_SET = new Set([
  'minecraft:redstone_wire',
  'minecraft:redstone_torch', 'minecraft:unlit_redstone_torch',
  'minecraft:redstone_wall_torch',
  'minecraft:repeater', 'minecraft:unpowered_repeater', 'minecraft:powered_repeater',
  'minecraft:comparator', 'minecraft:unpowered_comparator', 'minecraft:powered_comparator',
  'minecraft:observer',
  'minecraft:lever',
  'minecraft:wooden_button', 'minecraft:oak_button', 'minecraft:stone_button', 'minecraft:polished_blackstone_button',
  'minecraft:spruce_button', 'minecraft:birch_button', 'minecraft:jungle_button',
  'minecraft:acacia_button', 'minecraft:dark_oak_button', 'minecraft:mangrove_button',
  'minecraft:cherry_button', 'minecraft:bamboo_button', 'minecraft:pale_oak_button',
  'minecraft:crimson_button', 'minecraft:warped_button',
  'minecraft:wooden_pressure_plate', 'minecraft:oak_pressure_plate', 'minecraft:stone_pressure_plate',
  'minecraft:polished_blackstone_pressure_plate',
  'minecraft:light_weighted_pressure_plate', 'minecraft:heavy_weighted_pressure_plate',
  'minecraft:spruce_pressure_plate', 'minecraft:birch_pressure_plate',
  'minecraft:jungle_pressure_plate', 'minecraft:acacia_pressure_plate',
  'minecraft:dark_oak_pressure_plate', 'minecraft:mangrove_pressure_plate',
  'minecraft:cherry_pressure_plate', 'minecraft:bamboo_pressure_plate', 'minecraft:pale_oak_pressure_plate',
  'minecraft:crimson_pressure_plate', 'minecraft:warped_pressure_plate',
  'minecraft:tripwire_hook',
  'minecraft:trip_wire', 'minecraft:tripwire',
  'minecraft:daylight_detector', 'minecraft:daylight_detector_inverted',
  'minecraft:target',
  'minecraft:redstone_block',
  'minecraft:lightning_rod',
]);

// テスト用にエクスポート
export const __testing__ = {
  FACING6,
  DIR_TRAPDOOR: DIR_TABLES.trapdoor,
  DIR_DOOR: DIR_TABLES.door,
  DIR_HOOK: DIR_TABLES.tripwire_hook,
  DIR_REPEATER: DIR_TABLES.repeater,
  TORCH_FACING, LEVER_DIRECTION, BUTTON_FACING_DIR,
  REDSTONE_SIGNAL_SOURCE_SET,
};
