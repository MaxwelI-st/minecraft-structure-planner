/**
 * state-reader.js — Bedrock / Java 両対応のブロック状態リーダー
 *
 * 3D ビュー (viewer3d.js / blockshapes.js) で利用。
 * Bedrock .mcstructure と Java .litematic の双方の state 名/値を
 * 統一的に読み出すユーティリティ。
 *
 * 設計原則:
 *   1. Java 形式を優先 (変換後の .litematic を見るのが本来の用途)
 *   2. Bedrock 形式は fallback として完全対応
 *   3. 方向マッピングは JSON 実測値ベース (be_to_je_block_mapping.json で確認)
 *
 * Bedrock 方向 (int) → Java facing (string) — JSON 実測値:
 *   trapdoor:    0=north, 1=south, 2=west, 3=east
 *   door:        0=east,  1=south, 2=west, 3=north
 *   fence_gate:  0=south, 1=west,  2=north, 3=east
 *   weirdo_dir:  0=east,  1=west,  2=south, 3=north  (stairs only)
 *   facing_dir:  0=down,  1=up,    2=north, 3=south, 4=west, 5=east (6方向)
 */

// ─────────────────────────────────────────────────────────────────────────────
// 方向マッピング (block-type aware)
// ─────────────────────────────────────────────────────────────────────────────

// 旧 _TRAP_DIR (Bedrock visual で動いてた値) と一致させる
// BE direction=0 → 視覚 west wall (Java facing='west' と同じ視覚)
const TRAPDOOR_DIR_TO_FACING   = ['west', 'east', 'north', 'south'];
const DOOR_DIR_TO_FACING       = ['east',  'south', 'west', 'north'];
const FENCE_GATE_DIR_TO_FACING = ['south', 'west',  'north', 'east'];
const STAIR_WD_TO_FACING       = ['east',  'west',  'south', 'north'];
const FACING6_TO_FACING        = ['down',  'up',    'north', 'south', 'west', 'east'];

// ─────────────────────────────────────────────────────────────────────────────
// 内部ヘルパー
// ─────────────────────────────────────────────────────────────────────────────

/** state オブジェクトから値を取得。'minecraft:' プレフィックス自動探索。NBT-wrap 解除。 */
function _raw(states, key) {
  if (!states) return undefined;
  let v = states[key] ?? states['minecraft:' + key];
  if (v === undefined) return undefined;
  if (typeof v === 'object' && v !== null && 'value' in v) v = v.value;
  return v;
}

/** 値が boolean-true 相当か判定 (Java string "true", Bedrock byte 1, JS true, etc.) */
function _isBool(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

/** 複数の key 候補から最初に見つかった値を返す */
function _any(states, ...keys) {
  for (const k of keys) {
    const v = _raw(states, k);
    if (v !== undefined) return v;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slab — type=top/bottom/double
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {'top' | 'bottom' | 'double'} */
export function readSlabType(states) {
  // Java: type=top/bottom/double (最優先)
  const javaType = _raw(states, 'type');
  if (javaType === 'top' || javaType === 'bottom' || javaType === 'double') return javaType;

  // Bedrock 新: minecraft:vertical_half=top/bottom
  const vh = _raw(states, 'vertical_half');
  if (vh === 'top') return 'top';
  if (vh === 'bottom') return 'bottom';

  // Bedrock 旧: top_slot_bit (0/1)
  const tsb = _raw(states, 'top_slot_bit');
  if (tsb !== undefined) return _isBool(tsb) ? 'top' : 'bottom';

  // 互換: upside_down_bit (一部の旧形式で使われた)
  if (_isBool(_raw(states, 'upside_down_bit'))) return 'top';

  return 'bottom';
}

// ─────────────────────────────────────────────────────────────────────────────
// Trapdoor — facing / half / open
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {'north' | 'south' | 'east' | 'west'} */
export function readTrapdoorFacing(states) {
  // Java: facing (string)
  const jf = _raw(states, 'facing');
  if (typeof jf === 'string') {
    const f = jf.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  // Bedrock 新: minecraft:cardinal_direction (string)
  const cd = _raw(states, 'cardinal_direction');
  if (typeof cd === 'string') {
    const f = cd.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  // Bedrock 旧: direction (int 0-3)
  const dir = _raw(states, 'direction');
  if (typeof dir === 'number') return TRAPDOOR_DIR_TO_FACING[dir] ?? 'north';
  if (typeof dir === 'string' && !isNaN(parseInt(dir))) return TRAPDOOR_DIR_TO_FACING[parseInt(dir)] ?? 'north';
  return 'north';
}

/** @returns {'top' | 'bottom'} */
export function readTrapdoorHalf(states) {
  // Java: half=top/bottom
  const jh = _raw(states, 'half');
  if (jh === 'top') return 'top';
  if (jh === 'bottom') return 'bottom';
  // Bedrock: upside_down_bit
  return _isBool(_raw(states, 'upside_down_bit')) ? 'top' : 'bottom';
}

/** @returns {boolean} */
export function readTrapdoorOpen(states) {
  // Java: open (string 'true'/'false')
  const jo = _raw(states, 'open');
  if (jo === 'true') return true;
  if (jo === 'false') return false;
  // Bedrock: open_bit
  return _isBool(_raw(states, 'open_bit'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Stairs — facing / half / shape (shape=straight 既定)
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {'north' | 'south' | 'east' | 'west'} */
export function readStairsFacing(states) {
  // Java: facing (string)
  const jf = _raw(states, 'facing');
  if (typeof jf === 'string') {
    const f = jf.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  // Bedrock: weirdo_direction (int 0-3)
  const wd = _raw(states, 'weirdo_direction');
  if (typeof wd === 'number') return STAIR_WD_TO_FACING[wd] ?? 'north';
  if (typeof wd === 'string' && !isNaN(parseInt(wd))) return STAIR_WD_TO_FACING[parseInt(wd)] ?? 'north';
  return 'east';
}

/** @returns {'top' | 'bottom'} */
export function readStairsHalf(states) {
  const jh = _raw(states, 'half');
  if (jh === 'top') return 'top';
  if (jh === 'bottom') return 'bottom';
  return _isBool(_raw(states, 'upside_down_bit')) ? 'top' : 'bottom';
}

/** Java: shape=straight/inner_left/inner_right/outer_left/outer_right (Bedrock では neighbor 計算)
 *  @returns {string} */
export function readStairsShape(states) {
  return _raw(states, 'shape') ?? 'straight';
}

// ─────────────────────────────────────────────────────────────────────────────
// Door — facing / half / open / hinge
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {'north' | 'south' | 'east' | 'west'} */
export function readDoorFacing(states) {
  // Java: facing
  const jf = _raw(states, 'facing');
  if (typeof jf === 'string') {
    const f = jf.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  // Bedrock 新: minecraft:cardinal_direction
  const cd = _raw(states, 'cardinal_direction');
  if (typeof cd === 'string') {
    const f = cd.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  // Bedrock 旧: direction (int 0-3)
  const dir = _raw(states, 'direction');
  if (typeof dir === 'number') return DOOR_DIR_TO_FACING[dir] ?? 'east';
  if (typeof dir === 'string' && !isNaN(parseInt(dir))) return DOOR_DIR_TO_FACING[parseInt(dir)] ?? 'east';
  return 'east';
}

/** @returns {'upper' | 'lower'} */
export function readDoorHalf(states) {
  // Java: half=upper/lower
  const jh = _raw(states, 'half');
  if (jh === 'upper') return 'upper';
  if (jh === 'lower') return 'lower';
  // Bedrock: upper_block_bit
  return _isBool(_raw(states, 'upper_block_bit')) ? 'upper' : 'lower';
}

/** @returns {boolean} */
export function readDoorOpen(states) {
  const jo = _raw(states, 'open');
  if (jo === 'true') return true;
  if (jo === 'false') return false;
  return _isBool(_raw(states, 'open_bit'));
}

/** @returns {'left' | 'right'} */
export function readDoorHinge(states) {
  // Java: hinge=left/right (Java は **外側視点** で left/right)
  const jh = _raw(states, 'hinge');
  if (jh === 'left') return 'left';
  if (jh === 'right') return 'right';
  // Bedrock: door_hinge_bit (Bedrock は **内側視点** なので flip)
  //   door_hinge_bit=0 (Bedrock left) → Java right
  //   door_hinge_bit=1 (Bedrock right) → Java left
  if (_isBool(_any(states, 'door_hinge_bit', 'hinge_bit'))) return 'left';
  return 'right';
}

// ─────────────────────────────────────────────────────────────────────────────
// Fence Gate — facing / open / in_wall (Java では自動計算)
// ─────────────────────────────────────────────────────────────────────────────

export function readFenceGateFacing(states) {
  const jf = _raw(states, 'facing');
  if (typeof jf === 'string') {
    const f = jf.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  const cd = _raw(states, 'cardinal_direction');
  if (typeof cd === 'string') {
    const f = cd.toLowerCase();
    if (f === 'north' || f === 'south' || f === 'east' || f === 'west') return f;
  }
  const dir = _raw(states, 'direction');
  if (typeof dir === 'number') return FENCE_GATE_DIR_TO_FACING[dir] ?? 'south';
  if (typeof dir === 'string' && !isNaN(parseInt(dir))) return FENCE_GATE_DIR_TO_FACING[parseInt(dir)] ?? 'south';
  return 'south';
}

export function readFenceGateOpen(states) {
  const jo = _raw(states, 'open');
  if (jo === 'true') return true;
  if (jo === 'false') return false;
  return _isBool(_raw(states, 'open_bit'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Fence / Pane (glass_pane, iron_bars) — 接続 north/south/east/west (boolean)
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {{ n: boolean, s: boolean, e: boolean, w: boolean }} */
export function readFenceConnections(states, neighbors = {}) {
  // Java: north/south/east/west = 'true'/'false'
  // Bedrock: north_bit/south_bit/east_bit/west_bit (boolean)
  const fa = (k, kBit) => {
    const j = _raw(states, k);
    if (j === 'true') return true;
    if (j === 'false') return false;
    if (_isBool(_raw(states, kBit))) return true;
    return false;
  };
  return {
    n: fa('north', 'north_bit') || !!neighbors.n,
    s: fa('south', 'south_bit') || !!neighbors.s,
    e: fa('east',  'east_bit')  || !!neighbors.e,
    w: fa('west',  'west_bit')  || !!neighbors.w,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Wall — north/south/east/west=none/low/tall (Java), Bedrock は wall_connection_type_*
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {{ n, s, e, w: boolean, up: boolean }} 接続のあり/なし */
export function readWallConnections(states, neighbors = {}) {
  // Java: north='none'/'low'/'tall' → connected if low or tall
  // Bedrock 新: wall_connection_type_north='none'/'short'/'tall' → similar
  // Bedrock 旧: north_bit (boolean)
  const conn = (jKey, bcKey, bBitKey) => {
    const j = _raw(states, jKey);
    if (j === 'low' || j === 'tall') return true;
    if (j === 'none') return false;
    const bc = _raw(states, bcKey);
    if (bc === 'short' || bc === 'tall') return true;
    if (bc === 'none') return false;
    return _isBool(_raw(states, bBitKey));
  };
  // wall_post_bit / Java up='true'/'false'
  const jUp = _raw(states, 'up');
  let up;
  if (jUp === 'true') up = true;
  else if (jUp === 'false') up = false;
  else up = _isBool(_raw(states, 'wall_post_bit'));

  return {
    n: conn('north', 'wall_connection_type_north', 'north_bit') || !!neighbors.n,
    s: conn('south', 'wall_connection_type_south', 'south_bit') || !!neighbors.s,
    e: conn('east',  'wall_connection_type_east',  'east_bit')  || !!neighbors.e,
    w: conn('west',  'wall_connection_type_west',  'west_bit')  || !!neighbors.w,
    up,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis (pillar 系: log, chain, basalt, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {'x' | 'y' | 'z'} */
export function readAxis(states) {
  // Java: axis=x/y/z
  const a = _raw(states, 'axis');
  if (a === 'x' || a === 'y' || a === 'z') return a;
  // Bedrock: pillar_axis=x/y/z
  const pa = _raw(states, 'pillar_axis');
  if (pa === 'x' || pa === 'y' || pa === 'z') return pa;
  return 'y';
}

// ─────────────────────────────────────────────────────────────────────────────
// Facing 6 (down/up/north/south/west/east) — ladder, hopper, end_rod 等
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {'down' | 'up' | 'north' | 'south' | 'east' | 'west'} */
export function readFacing6(states) {
  // Java: facing (string)
  const jf = _raw(states, 'facing');
  if (typeof jf === 'string') {
    const f = jf.toLowerCase();
    if (['down','up','north','south','east','west'].includes(f)) return f;
  }
  // Bedrock: facing_direction (int 0-5)
  const fd = _raw(states, 'facing_direction');
  if (typeof fd === 'number') return FACING6_TO_FACING[fd] ?? 'north';
  if (typeof fd === 'string' && !isNaN(parseInt(fd))) return FACING6_TO_FACING[parseInt(fd)] ?? 'north';
  return 'north';
}

// ─────────────────────────────────────────────────────────────────────────────
// Hanging (lantern)
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {boolean} */
export function readHanging(states) {
  const jh = _raw(states, 'hanging');
  if (jh === 'true') return true;
  if (jh === 'false') return false;
  return _isBool(_raw(states, 'hanging_bit'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistent (leaves)
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {boolean} */
export function readPersistent(states) {
  const jp = _raw(states, 'persistent');
  if (jp === 'true') return true;
  if (jp === 'false') return false;
  return _isBool(_raw(states, 'persistent_bit'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Powered (button, lever, observer, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {boolean} */
export function readPowered(states) {
  const jp = _raw(states, 'powered');
  if (jp === 'true') return true;
  if (jp === 'false') return false;
  return _isBool(_any(states, 'powered_bit', 'output_lit_bit'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape signature — 同じ視覚状態のブロックを同じキーにまとめる (geometry キャッシュ用)
// すべての関連 state を含むため Bedrock/Java どちらでも一意になる
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 視覚的に影響する全ての state を含む signature を返す。
 * viewer3d.js のキャッシュキー生成で使用。
 *
 * @param {string} blockId
 * @param {string} shape  - 'slab' | 'stairs' | 'trapdoor' | 'door' | ...
 * @param {object} states
 * @returns {string}
 */
export function buildShapeSignature(blockId, shape, states) {
  if (!states || shape === 'cube') return blockId;
  const parts = [blockId, shape];
  switch (shape) {
    case 'slab':
      parts.push('type=' + readSlabType(states));
      break;
    case 'stairs':
      parts.push('f=' + readStairsFacing(states), 'h=' + readStairsHalf(states), 's=' + readStairsShape(states));
      break;
    case 'trapdoor':
      parts.push('f=' + readTrapdoorFacing(states), 'h=' + readTrapdoorHalf(states), 'o=' + readTrapdoorOpen(states));
      break;
    case 'door':
      parts.push('f=' + readDoorFacing(states), 'h=' + readDoorHalf(states), 'o=' + readDoorOpen(states), 'hi=' + readDoorHinge(states));
      break;
    case 'fence_gate':
      parts.push('f=' + readFenceGateFacing(states), 'o=' + readFenceGateOpen(states));
      break;
    case 'lantern':
      parts.push('hang=' + readHanging(states));
      break;
    case 'chain':
    case 'end_rod':
      parts.push('a=' + readAxis(states));
      break;
    case 'ladder':
    case 'hopper':
    case 'anvil':
    case 'shelf':
    case 'campfire':
    case 'button':
      parts.push('f=' + readFacing6(states));
      break;
    case 'snow_layer': {
      const h = _raw(states, 'height') ?? _raw(states, 'snow_layer_height') ?? 1;
      parts.push('h=' + h);
      break;
    }
    default:
      // 他 shape は cube 同等
      return blockId + '|' + shape;
  }
  return parts.join('|');
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部ヘルパーを export しておくと testing 便利
// ─────────────────────────────────────────────────────────────────────────────

export const __testing__ = { _raw, _isBool, _any };
