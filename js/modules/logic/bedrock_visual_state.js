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

// ─────────────────────────────────────────────────────────────────────────────
// 内部マップ
// ─────────────────────────────────────────────────────────────────────────────

/** facing_direction (int 0-5) → Java facing (string) */
const FACING6 = ['down', 'up', 'north', 'south', 'west', 'east'];

/** Bedrock direction (int 0-3, doors / trapdoors / hooks) → Java facing */
//   ※ ブロック種により規約が違う — 用途別に複数ルックアップを保持
const DIR_TRAPDOOR = ['west',  'east',  'north', 'south'];     // direction 0-3 → trapdoor facing
const DIR_DOOR     = ['east',  'south', 'west',  'north'];     // door
const DIR_HOOK     = ['south', 'west',  'north', 'east'];      // tripwire_hook
const DIR_REPEATER = ['south', 'west',  'north', 'east'];      // repeater / comparator (Bedrock direction)

/** torch_facing_direction (string) → {face, facing} */
const TORCH_FACING = {
  top:   { face: 'floor',   facing: null    },
  north: { face: 'wall',    facing: 'north' },
  south: { face: 'wall',    facing: 'south' },
  east:  { face: 'wall',    facing: 'east'  },
  west:  { face: 'wall',    facing: 'west'  },
};

/** lever_direction (Bedrock) → {face, facing} */
const LEVER_DIRECTION = {
  down_east_west:  { face: 'ceiling', facing: 'east'  },
  down_north_south:{ face: 'ceiling', facing: 'north' },
  up_east_west:    { face: 'floor',   facing: 'east'  },
  up_north_south:  { face: 'floor',   facing: 'north' },
  north:           { face: 'wall',    facing: 'north' },
  south:           { face: 'wall',    facing: 'south' },
  east:            { face: 'wall',    facing: 'east'  },
  west:            { face: 'wall',    facing: 'west'  },
};

/** crafter orientation (Bedrock) → {facing} (主たる向き) */
const CRAFTER_ORIENTATION = {
  down_east:  'down',  down_north: 'down',  down_south: 'down',  down_west: 'down',
  up_east:    'up',    up_north:   'up',    up_south:   'up',    up_west:   'up',
  north_up:   'north', south_up:   'south', east_up:    'east',  west_up:   'west',
};

/** button facing_direction (int 0-5) → {face, facing} */
//   Bedrock の button は facing_direction 0=down(ceiling), 1=up(floor), 2-5=wall (north/south/west/east)
const BUTTON_FACING_DIR = [
  { face: 'ceiling', facing: 'north' }, // 0: down → ceiling-mounted
  { face: 'floor',   facing: 'north' }, // 1: up   → floor-mounted
  { face: 'wall',    facing: 'north' }, // 2
  { face: 'wall',    facing: 'south' }, // 3
  { face: 'wall',    facing: 'west'  }, // 4
  { face: 'wall',    facing: 'east'  }, // 5
];

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

function _facingFromFacing6(states) {
  // Bedrock の facing_direction (int 0-5) を解釈
  const fd = _intOrNull(states?.facing_direction);
  if (fd !== null && fd >= 0 && fd < 6) return FACING6[fd];
  return null;
}

function _facingFromMinecraftFacing6(states) {
  // 新形式: states["minecraft:facing_direction"] = "north" 等 (string)
  const v = states?.['minecraft:facing_direction'];
  if (typeof v === 'string' && FACING6.includes(v)) return v;
  return null;
}

function _facingFromCardinalDirection(states) {
  // 新形式: states["minecraft:cardinal_direction"] = "north" 等 (string)
  const v = states?.['minecraft:cardinal_direction'];
  if (typeof v === 'string') {
    const lower = v.toLowerCase();
    if (['north', 'south', 'east', 'west'].includes(lower)) return lower;
  }
  return null;
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

  switch (id) {
    // ── Repeater (BE は powered/unpowered の 2 名前で分かれる) ─────────────
    case 'minecraft:repeater':
    case 'minecraft:unpowered_repeater':
    case 'minecraft:powered_repeater': {
      const d = _intOrNull(s.repeater_delay);
      out.delay = (d !== null && d >= 0 && d <= 3) ? (d + 1) : null;
      out.facing = _facingFromCardinalDirection(s)
                || (_intOrNull(s.direction) !== null ? DIR_REPEATER[_intOrNull(s.direction) & 3] : null)
                || (typeof s.facing === 'string' ? s.facing : null);
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
      out.facing = _facingFromCardinalDirection(s)
                || (_intOrNull(s.direction) !== null ? DIR_REPEATER[_intOrNull(s.direction) & 3] : null)
                || (typeof s.facing === 'string' ? s.facing : null);
      return out;
    }

    // ── Observer ───────────────────────────────────────────────────────────
    case 'minecraft:observer': {
      out.facing = _facingFromMinecraftFacing6(s)
                || (typeof s.facing === 'string' ? s.facing : null)
                || _facingFromFacing6(s);
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
      out.facing = _facingFromFacing6(s)
                || _facingFromMinecraftFacing6(s)
                || (typeof s.facing === 'string' ? s.facing : null);
      out.extended = _bool(s.extended);
      return out;
    }

    // ── Dropper / Dispenser ────────────────────────────────────────────────
    case 'minecraft:dropper':
    case 'minecraft:dispenser': {
      out.facing = _facingFromFacing6(s)
                || _facingFromMinecraftFacing6(s)
                || (typeof s.facing === 'string' ? s.facing : null);
      out.powered = _bool(s.triggered_bit) || _bool(s.triggered);
      return out;
    }

    // ── Hopper ─────────────────────────────────────────────────────────────
    case 'minecraft:hopper': {
      out.facing = _facingFromFacing6(s)
                || _facingFromMinecraftFacing6(s)
                || (typeof s.facing === 'string' ? s.facing : null);
      // BE: toggle_bit=1 → disabled (enabled=false)
      // facing_direction=0 → down が標準
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
      const tfd = s.torch_facing_direction;
      if (typeof tfd === 'string' && TORCH_FACING[tfd]) {
        out.face   = TORCH_FACING[tfd].face;
        out.facing = TORCH_FACING[tfd].facing;
      } else if (id.includes('wall_torch')) {
        out.face = 'wall';
        out.facing = _facingFromCardinalDirection(s)
                  || (typeof s.facing === 'string' ? s.facing : 'north');
      } else {
        out.face = 'floor';
      }
      out.lit = !id.startsWith('minecraft:unlit_');
      return out;
    }

    // ── Lever ──────────────────────────────────────────────────────────────
    case 'minecraft:lever': {
      const ld = s.lever_direction;
      const map = (typeof ld === 'string') ? LEVER_DIRECTION[ld] : null;
      if (map) {
        out.face   = map.face;
        out.facing = map.facing;
      }
      out.powered = _bool(s.open_bit) || _bool(s.powered);
      return out;
    }

    // ── Button (各種 wood / stone / polished_blackstone 等) ────────────────
    case 'minecraft:wooden_button':
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
    case 'minecraft:warped_button': {
      const fd = _intOrNull(s.facing_direction);
      if (fd !== null && fd >= 0 && fd < 6) {
        const m = BUTTON_FACING_DIR[fd];
        out.face   = m.face;
        out.facing = m.facing;
      }
      out.powered = _bool(s.button_pressed_bit) || _bool(s.powered);
      return out;
    }

    // ── Tripwire Hook ──────────────────────────────────────────────────────
    case 'minecraft:tripwire_hook': {
      const d = _intOrNull(s.direction);
      out.facing = (d !== null && d >= 0 && d <= 3) ? DIR_HOOK[d]
                : _facingFromCardinalDirection(s)
                || (typeof s.facing === 'string' ? s.facing : null);
      out.powered = _bool(s.powered_bit);
      out.face = 'wall';
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
      const ori = s.orientation;
      if (typeof ori === 'string' && CRAFTER_ORIENTATION[ori]) {
        out.facing = CRAFTER_ORIENTATION[ori];
      } else {
        out.facing = _facingFromFacing6(s);
      }
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
    case 'minecraft:crimson_pressure_plate':
    case 'minecraft:warped_pressure_plate': {
      const p = _intOrNull(s.redstone_signal);
      out.power = (p !== null) ? Math.max(0, Math.min(15, p)) : 0;
      out.powered = (out.power ?? 0) > 0;
      out.face = 'floor';
      return out;
    }

    default:
      return null; // 該当なし → 既存パイプライン任せ
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
  'minecraft:wooden_button', 'minecraft:stone_button', 'minecraft:polished_blackstone_button',
  'minecraft:spruce_button', 'minecraft:birch_button', 'minecraft:jungle_button',
  'minecraft:acacia_button', 'minecraft:dark_oak_button', 'minecraft:mangrove_button',
  'minecraft:cherry_button', 'minecraft:bamboo_button',
  'minecraft:crimson_button', 'minecraft:warped_button',
  'minecraft:wooden_pressure_plate', 'minecraft:stone_pressure_plate',
  'minecraft:polished_blackstone_pressure_plate',
  'minecraft:light_weighted_pressure_plate', 'minecraft:heavy_weighted_pressure_plate',
  'minecraft:spruce_pressure_plate', 'minecraft:birch_pressure_plate',
  'minecraft:jungle_pressure_plate', 'minecraft:acacia_pressure_plate',
  'minecraft:dark_oak_pressure_plate', 'minecraft:mangrove_pressure_plate',
  'minecraft:cherry_pressure_plate', 'minecraft:bamboo_pressure_plate',
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
  FACING6, DIR_TRAPDOOR, DIR_DOOR, DIR_HOOK, DIR_REPEATER,
  TORCH_FACING, LEVER_DIRECTION, BUTTON_FACING_DIR,
  REDSTONE_SIGNAL_SOURCE_SET,
};
