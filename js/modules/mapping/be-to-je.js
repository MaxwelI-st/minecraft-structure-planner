/**
 * be-to-je.js — Bedrock → Java Block State Converter (v2: data-driven)
 *
 * 4 層パイプライン (詳細は plans/.md):
 *   [層 1] normalizeStates(name, states)   — Bedrock 専有 state を drop / 旧形式へ
 *   [層 2] resolveName(name)               — フラット名 → 旧 name + 追加 state
 *   [層 3] JSON ルックアップ (3 段階)
 *   [層 4] Identity passthrough             — Java 同名ブロック向け
 *
 * 各層の後に SPECIAL_CASES finalizer が Java 必須プロパティを補完。
 */

// ─────────────────────────────────────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = ['white','orange','magenta','light_blue','yellow','lime','pink','gray',
                'light_gray','cyan','purple','blue','brown','green','red','black'];

// JSON 直接ヒットしない、旧形式 legacify が必要な木材タイプ
const LEGACY_WOOD_TYPES = ['oak','spruce','birch','jungle','acacia','dark_oak'];

// stone-type slab の variant (JSON 内 stone_block_slab|stone_slab_type=X)
const STONE_SLAB_TYPES_LEGACY = [
  'nether_brick','smooth_stone','sandstone','cobblestone','quartz','brick',
  'stone','stone_brick','red_sandstone','mossy_cobblestone','wood',
];

// 壁の variant (JSON 内 cobblestone_wall|wall_block_type=X)
const WALL_TYPES_LEGACY = [
  'andesite','granite','diorite','brick','stone_brick','mossy_stone_brick',
  'mossy_cobblestone','prismarine','red_sandstone','sandstone','end_brick',
  'nether_brick','red_nether_brick','cobblestone',
];

// direction (int) → facing (string) — ブロック種ごとに異なる
// trapdoor: visual で確認した値 (Bedrock direction=0 は west 壁、ユーザー検証)
const TRAPDOOR_DIR_TO_FACING   = ['west', 'east', 'north', 'south']; // direction 0-3
const DOOR_DIR_TO_FACING       = ['east',  'south', 'west', 'north'];
const FENCE_GATE_DIR_TO_FACING = ['south', 'west', 'north', 'east']; // 独自順
const STAIR_DIR_BE_TO_JE       = ['east', 'west', 'south', 'north']; // weirdo_direction 0-3
const FACING6_BE_TO_JE         = ['down', 'up', 'north', 'south', 'west', 'east'];

// 逆引き: cardinal_direction string → direction int (block-specific)
const TRAPDOOR_FACING_TO_DIR   = { west: 0, east: 1, north: 2, south: 3 };
const DOOR_FACING_TO_DIR       = { east:  0, south: 1, west: 2, north: 3 };
const FENCE_GATE_FACING_TO_DIR = { south: 0, west:  1, north: 2, east: 3 };

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY_NAME_MAP: 近代フラット名 → 旧 Bedrock name + 追加 state
// (JSON 直接ヒットしない場合のみ使用)
// ─────────────────────────────────────────────────────────────────────────────

const LEGACY_NAME_MAP = new Map();

// wooden planks/log/wood (6種)
for (const wood of LEGACY_WOOD_TYPES) {
  LEGACY_NAME_MAP.set(`minecraft:${wood}_planks`, { name: 'minecraft:planks', state: { wood_type: wood } });
  LEGACY_NAME_MAP.set(`minecraft:${wood}_log`,    { name: 'minecraft:log',    state: { wood_type: wood } });
  LEGACY_NAME_MAP.set(`minecraft:${wood}_wood`,   { name: 'minecraft:wood',   state: { wood_type: wood } });
}

// 葉ブロック (旧4種 leaves + 新2種 leaves2)
LEGACY_NAME_MAP.set('minecraft:oak_leaves',      { name: 'minecraft:leaves',  state: { old_leaf_type: 'oak' } });
LEGACY_NAME_MAP.set('minecraft:spruce_leaves',   { name: 'minecraft:leaves',  state: { old_leaf_type: 'spruce' } });
LEGACY_NAME_MAP.set('minecraft:birch_leaves',    { name: 'minecraft:leaves',  state: { old_leaf_type: 'birch' } });
LEGACY_NAME_MAP.set('minecraft:jungle_leaves',   { name: 'minecraft:leaves',  state: { old_leaf_type: 'jungle' } });
LEGACY_NAME_MAP.set('minecraft:acacia_leaves',   { name: 'minecraft:leaves2', state: { new_leaf_type: 'acacia' } });
LEGACY_NAME_MAP.set('minecraft:dark_oak_leaves', { name: 'minecraft:leaves2', state: { new_leaf_type: 'dark_oak' } });

// oak の trapdoor/door/fence_gate は flat 名が JSON に無く legacify 必要
LEGACY_NAME_MAP.set('minecraft:oak_trapdoor',   { name: 'minecraft:trapdoor',    state: {} });
LEGACY_NAME_MAP.set('minecraft:oak_door',       { name: 'minecraft:wooden_door', state: {} });
LEGACY_NAME_MAP.set('minecraft:oak_fence_gate', { name: 'minecraft:fence_gate',  state: {} });
LEGACY_NAME_MAP.set('minecraft:oak_pressure_plate', { name: 'minecraft:wooden_pressure_plate', state: {} });
LEGACY_NAME_MAP.set('minecraft:oak_button',     { name: 'minecraft:wooden_button', state: {} });

// stone-type slabs (11種)
for (const st of STONE_SLAB_TYPES_LEGACY) {
  LEGACY_NAME_MAP.set(`minecraft:${st}_slab`, { name: 'minecraft:stone_block_slab', state: { stone_slab_type: st } });
}

// 壁 (14種)
for (const wt of WALL_TYPES_LEGACY) {
  if (wt === 'cobblestone') continue; // cobblestone_wall は元から flat 名で JSON 内
  LEGACY_NAME_MAP.set(`minecraft:${wt}_wall`, { name: 'minecraft:cobblestone_wall', state: { wall_block_type: wt } });
}

// 色付きブロック (16色 × 各カテゴリ)
for (const color of COLORS) {
  LEGACY_NAME_MAP.set(`minecraft:${color}_wool`,               { name: 'minecraft:wool',                  state: { color } });
  LEGACY_NAME_MAP.set(`minecraft:${color}_concrete`,           { name: 'minecraft:concrete',              state: { color } });
  LEGACY_NAME_MAP.set(`minecraft:${color}_concrete_powder`,    { name: 'minecraft:concrete_powder',       state: { color } });
  LEGACY_NAME_MAP.set(`minecraft:${color}_stained_glass`,      { name: 'minecraft:stained_glass',         state: { color } });
  LEGACY_NAME_MAP.set(`minecraft:${color}_stained_glass_pane`, { name: 'minecraft:stained_glass_pane',    state: { color } });
  LEGACY_NAME_MAP.set(`minecraft:${color}_carpet`,             { name: 'minecraft:carpet',                state: { color } });
  LEGACY_NAME_MAP.set(`minecraft:${color}_terracotta`,         { name: 'minecraft:stained_hardened_clay', state: { color } });
}

// その他のリネーム
LEGACY_NAME_MAP.set('minecraft:dirt_path', { name: 'minecraft:grass_path', state: {} });

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY_PASSTHROUGH_OK: Java と完全に同名で、JSON に無くてもそのまま渡せるブロック
// (警告抑止用)
// ─────────────────────────────────────────────────────────────────────────────

const IDENTITY_PASSTHROUGH_OK = new Set([
  'minecraft:grass_block',
  'minecraft:composter',
]);
// wooden slab は JSON に無いが Java では minecraft:oak_slab 等で存在
for (const wood of [...LEGACY_WOOD_TYPES, 'crimson','warped','mangrove','cherry']) {
  IDENTITY_PASSTHROUGH_OK.add(`minecraft:${wood}_slab`);
  IDENTITY_PASSTHROUGH_OK.add(`minecraft:${wood}_sign`);
  IDENTITY_PASSTHROUGH_OK.add(`minecraft:${wood}_wall_sign`);
  IDENTITY_PASSTHROUGH_OK.add(`minecraft:${wood}_hanging_sign`);
  IDENTITY_PASSTHROUGH_OK.add(`minecraft:${wood}_wall_hanging_sign`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 状態正規化器 — Bedrock 専有 state を drop or 旧形式へ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 入力 Bedrock states を旧形式に正規化する。
 * Bedrock 専有 state (wall_connection_type_* など) は落とす。
 *
 * @param {string} name   - Bedrock block name (block-type aware 変換用)
 * @param {object} states - Bedrock states object
 * @returns {object} normalized states
 */
function normalizeStates(name, states = {}) {
  const out = {};
  for (const [k, v] of Object.entries(states ?? {})) {
    // ── 完全に意味のない Bedrock state を drop ──
    if (k.startsWith('wall_connection_type_')) continue; // Java 自動計算
    if (k === 'wall_post_bit')   continue;               // Java 自動計算
    if (k === 'covered_bit')     continue;
    if (k === 'no_drop_bit')     continue;
    if (k === 'infiniburn_bit')  continue;
    if (k === 'cauldron_liquid') continue;
    // NOTE: update_bit / in_wall_bit は JSON ルックアップキーに含まれるため
    //       ここでは保持し、最終 Java Properties から SPECIAL_CASE で削除する。

    // ── minecraft: prefix 付き state を旧形式へ ──
    if (k === 'minecraft:vertical_half') {
      out.top_slot_bit = v === 'top' ? 1 : 0;
      continue;
    }
    if (k === 'minecraft:cardinal_direction') {
      const facing = String(v);
      let dir;
      if (name.endsWith('_trapdoor')) {
        dir = TRAPDOOR_FACING_TO_DIR[facing];
      } else if (name.endsWith('_fence_gate')) {
        dir = FENCE_GATE_FACING_TO_DIR[facing];
      } else if (name.endsWith('_door')) {
        dir = DOOR_FACING_TO_DIR[facing];
      } else {
        dir = TRAPDOOR_FACING_TO_DIR[facing];
      }
      out.direction = dir ?? 0;
      continue;
    }
    if (k === 'minecraft:block_face') {
      out.facing_direction = v;
      continue;
    }
    if (k.startsWith('minecraft:')) {
      out[k.substring(10)] = v;
      continue;
    }

    out[k] = v;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 個別 state 変換 (Identity passthrough 時に Java property 名にする)
// ─────────────────────────────────────────────────────────────────────────────

const _BE_STATE_KEY_TO_JE_KEY = {
  top_slot_bit:      'type_slab',  // 後段で special-case 処理 (type)
  upside_down_bit:   'half',
  weirdo_direction:  'facing_stair',
  direction:         'facing_dir',
  cardinal_direction:'facing',
  facing_direction:  'facing_6',
  block_face:        'face',
  door_hinge_bit:    'hinge',
  upper_block_bit:   'half_door',
  open_bit:          'open',
  powered_bit:       'powered',
  attached_bit:      'attached',
  persistent_bit:    'persistent',
  output_lit_bit:    'powered',
  composter_fill_level: 'level',
  fill_level:        'level',
};

const _asBool = (v) => (v === 1 || v === true || v === '1') ? 'true' : 'false';

/**
 * normalizeStates の出力を Java Properties に変換する。
 * Identity passthrough 時のみ使用。SPECIAL_CASE で再上書きされることが多い。
 */
function passthroughStatesToProperties(normStates) {
  const out = {};
  for (const [k, v] of Object.entries(normStates ?? {})) {
    switch (k) {
      case 'top_slot_bit':
        out.type = (v === 1 || v === true) ? 'top' : 'bottom';
        break;
      case 'upside_down_bit':
        out.half = (v === 1 || v === true) ? 'top' : 'bottom';
        break;
      case 'weirdo_direction':
        out.facing = STAIR_DIR_BE_TO_JE[v] ?? 'north';
        break;
      case 'direction':
        // 注: block-type 非依存。trapdoor 規約で fallback (door は SPECIAL_CASE で上書き)
        out.facing = typeof v === 'number' ? (TRAPDOOR_DIR_TO_FACING[v] ?? 'north') : String(v);
        break;
      case 'facing_direction':
        out.facing = typeof v === 'number' ? (FACING6_BE_TO_JE[v] ?? 'north') : String(v);
        break;
      case 'door_hinge_bit':
        out.hinge = (v === 1 || v === true) ? 'right' : 'left';
        break;
      case 'upper_block_bit':
        out.half = (v === 1 || v === true) ? 'upper' : 'lower';
        break;
      case 'open_bit':
        out.open = _asBool(v);
        break;
      case 'powered_bit':
        out.powered = _asBool(v);
        break;
      case 'attached_bit':
        out.attached = _asBool(v);
        break;
      case 'persistent_bit':
        out.persistent = _asBool(v);
        break;
      case 'output_lit_bit':
        out.powered = _asBool(v);
        break;
      case 'composter_fill_level':
        out.level = String(Math.min(8, Math.max(0, Number(v) || 0)));
        break;
      case 'fill_level':
        out.level = String(Number(v) || 0);
        break;
      default:
        // 0/1 → boolean string、それ以外は文字列化
        if (v === 0 || v === false)      out[k] = 'false';
        else if (v === 1 || v === true)  out[k] = 'true';
        else                             out[k] = String(v);
        break;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIAL_CASES — Java 必須プロパティ補完 (block-type 別)
// ─────────────────────────────────────────────────────────────────────────────

const SPECIAL_CASES = [
  // fence_gate — Java は in_wall を自動計算なので削除
  {
    match: (name) => name.endsWith('_fence_gate') || name === 'minecraft:fence_gate',
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      delete p.in_wall;
      delete p.in_wall_bit;
      if (p.open === undefined && beStates.open_bit !== undefined) {
        p.open = _asBool(beStates.open_bit);
      }
      if (p.facing === undefined) {
        if (typeof beStates.direction === 'number') {
          p.facing = FENCE_GATE_DIR_TO_FACING[beStates.direction] ?? 'north';
        } else if (beStates['minecraft:cardinal_direction']) {
          p.facing = String(beStates['minecraft:cardinal_direction']);
        }
      }
      if (p.facing === undefined)  p.facing  = 'north';
      if (p.open === undefined)    p.open    = 'false';
      if (p.powered === undefined) p.powered = 'false';
      if (p.in_wall === undefined) p.in_wall = 'false';
      return { ...jb, Properties: p };
    },
  },

  // minecraft:coral_* — dead_bit=1 → 名前に dead_ プレフィックス
  {
    match: (name) => name.includes(':coral') && !name.includes('dead'),
    transform: (jb, beStates) => {
      if (beStates.dead_bit === 1 || beStates.dead_bit === true) {
        return { ...jb, Name: jb.Name.replace('minecraft:', 'minecraft:dead_') };
      }
      return jb;
    },
  },

  // leaves (legacy or modern) — persistent / distance、update_bit 等の noise 削除
  {
    match: (name) => name.endsWith('_leaves') || name === 'minecraft:leaves' || name === 'minecraft:leaves2',
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      delete p.update_bit;
      delete p.persistent_bit;
      delete p.old_leaf_type;
      delete p.new_leaf_type;
      const persistent = (beStates.persistent_bit === 1 || beStates.persistent_bit === true) ? 'true' : 'false';
      p.persistent = persistent;
      if (p.distance === undefined) p.distance = persistent === 'true' ? '1' : '7';
      return { ...jb, Properties: p };
    },
  },

  // double slabs — type=double
  {
    match: (name) => name.startsWith('minecraft:double_') && name.includes('slab'),
    transform: (jb) => ({ ...jb, Properties: { ...jb.Properties, type: 'double' } }),
  },

  // slabs (single) — type / waterlogged 補完
  {
    match: (name) => /_slab$/.test(name) && !name.startsWith('minecraft:double_'),
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      if (!p.type) {
        const isTop = (beStates['minecraft:vertical_half'] === 'top')
                   || (beStates.top_slot_bit === 1 || beStates.top_slot_bit === true);
        p.type = isTop ? 'top' : 'bottom';
      }
      if (p.waterlogged === undefined) p.waterlogged = 'false';
      return { ...jb, Properties: p };
    },
  },

  // trapdoor — JSON 由来があれば尊重、無ければ beStates から
  {
    match: (name) => name.endsWith('_trapdoor') || name.endsWith(':trapdoor'),
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      if (p.open === undefined && beStates.open_bit !== undefined) {
        p.open = _asBool(beStates.open_bit);
      }
      if (p.half === undefined && beStates.upside_down_bit !== undefined) {
        p.half = (beStates.upside_down_bit === 1 || beStates.upside_down_bit === true) ? 'top' : 'bottom';
      }
      // facing: JSON の値は間違いなので **強制上書き** (ユーザー検証構造で確認済)
      if (typeof beStates.direction === 'number') {
        p.facing = TRAPDOOR_DIR_TO_FACING[beStates.direction] ?? 'north';
      } else if (beStates['minecraft:cardinal_direction']) {
        p.facing = String(beStates['minecraft:cardinal_direction']);
      }
      if (p.open === undefined)        p.open        = 'false';
      if (p.half === undefined)        p.half        = 'bottom';
      if (p.facing === undefined)      p.facing      = 'north';
      if (p.powered === undefined)     p.powered     = 'false';
      if (p.waterlogged === undefined) p.waterlogged = 'false';
      return { ...jb, Properties: p };
    },
  },

  // stairs — JSON 由来優先、shape は straight 既定
  {
    match: (name) => name.endsWith('_stairs'),
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      if (p.facing === undefined && typeof beStates.weirdo_direction === 'number') {
        p.facing = STAIR_DIR_BE_TO_JE[beStates.weirdo_direction] ?? 'north';
      }
      if (p.half === undefined && beStates.upside_down_bit !== undefined) {
        p.half = (beStates.upside_down_bit === 1 || beStates.upside_down_bit === true) ? 'top' : 'bottom';
      }
      if (p.facing === undefined)      p.facing      = 'north';
      if (p.half === undefined)        p.half        = 'bottom';
      if (p.shape === undefined)       p.shape       = 'straight';
      if (p.waterlogged === undefined) p.waterlogged = 'false';
      return { ...jb, Properties: p };
    },
  },

  // door — JSON 由来優先
  {
    match: (name) => /(_door)$/.test(name) && !name.endsWith('_trapdoor'),
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      if (p.open === undefined && beStates.open_bit !== undefined) {
        p.open = _asBool(beStates.open_bit);
      }
      // hinge: 強制上書き (JSON は Bedrock convention のままなので flip)
      if (beStates.door_hinge_bit !== undefined) {
        p.hinge = (beStates.door_hinge_bit === 1 || beStates.door_hinge_bit === true) ? 'left' : 'right';
      }
      if (p.half === undefined && beStates.upper_block_bit !== undefined) {
        p.half = (beStates.upper_block_bit === 1 || beStates.upper_block_bit === true) ? 'upper' : 'lower';
      }
      // facing: 強制上書き
      // ドア: Bedrock cardinal_direction と Java facing は 90° CW 回転
      const ROT_CW = { north: 'east', east: 'south', south: 'west', west: 'north' };
      if (typeof beStates.direction === 'number') {
        p.facing = DOOR_DIR_TO_FACING[beStates.direction] ?? 'north';
      } else if (beStates['minecraft:cardinal_direction']) {
        const cd = String(beStates['minecraft:cardinal_direction']).toLowerCase();
        p.facing = ROT_CW[cd] ?? cd;
      }
      if (p.open === undefined)    p.open    = 'false';
      if (p.hinge === undefined)   p.hinge   = 'left';
      if (p.half === undefined)    p.half    = 'lower';
      if (p.facing === undefined)  p.facing  = 'north';
      if (p.powered === undefined) p.powered = 'false';
      return { ...jb, Properties: p };
    },
  },

  // wall — Java は neighbor 自動計算なので none で初期化
  {
    match: (name) => name.endsWith('_wall'),
    transform: (jb, beStates) => {
      const p = { ...jb.Properties };
      if (p.up === undefined && beStates.wall_post_bit !== undefined) {
        p.up = _asBool(beStates.wall_post_bit);
      }
      if (p.north === undefined) p.north = 'none';
      if (p.south === undefined) p.south = 'none';
      if (p.east  === undefined) p.east  = 'none';
      if (p.west  === undefined) p.west  = 'none';
      if (p.up    === undefined) p.up    = 'true';
      if (p.waterlogged === undefined) p.waterlogged = 'false';
      return { ...jb, Properties: p };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BeToJeConverter
// ─────────────────────────────────────────────────────────────────────────────

export class BeToJeConverter {
  /**
   * @param {Map<string, { Name: string, Properties: object }>} mappingMap
   */
  constructor(mappingMap) {
    if (!(mappingMap instanceof Map)) {
      throw new TypeError('BeToJeConverter: mappingMap must be a Map instance');
    }
    this._map = mappingMap;
    this._warnings = [];

    // name-only fallback (first variant of each block name)
    this._nameOnlyMap = new Map();
    for (const [key, value] of mappingMap) {
      const n = key.split('|')[0];
      if (!this._nameOnlyMap.has(n)) {
        this._nameOnlyMap.set(n, value);
      }
    }
  }

  /**
   * Build canonical lookup key from name + states. States sorted.
   */
  static buildKey(name, states = {}) {
    const stateKeys = Object.keys(states).sort();
    if (stateKeys.length === 0) return name;
    const stateStr = stateKeys
      .map(k => {
        const v = states[k];
        const normalised = (v === 0 || v === false) ? '0'
                         : (v === 1 || v === true)  ? '1'
                         : String(v);
        return `${k}=${normalised}`;
      })
      .join(',');
    return `${name}|${stateStr}`;
  }

  /**
   * Convert one Bedrock block entry to Java BlockState.
   */
  convertBlock(name, states = {}, waterlogged = false) {
    // 早期 return
    if (name === 'minecraft:air' || name === 'minecraft:cave_air' || name === 'minecraft:void_air') {
      return { Name: 'minecraft:air', Properties: {} };
    }
    if (name === 'minecraft:structure_block' || name === 'minecraft:structure_void') {
      return { Name: name, Properties: {} };
    }

    // 1. 状態正規化
    const normStates = normalizeStates(name, states);

    // 2. 名前解決 (legacy 化 or identity)
    const mapping = LEGACY_NAME_MAP.get(name);
    const lookupName   = mapping ? mapping.name : name;
    const lookupStates = mapping ? { ...normStates, ...mapping.state } : normStates;

    // 3. JSON ルックアップ
    const key  = BeToJeConverter.buildKey(lookupName, lookupStates);
    let javaBlock = this._map.get(key)
                 ?? this._map.get(lookupName)
                 ?? this._nameOnlyMap.get(lookupName);
    let usedPassthrough = false;

    // 4. Identity passthrough
    if (!javaBlock) {
      if (!IDENTITY_PASSTHROUGH_OK.has(name)) {
        this._warnings.push(`Passthrough: ${BeToJeConverter.buildKey(name, normStates)}`);
      }
      javaBlock = {
        Name: name,
        Properties: passthroughStatesToProperties(normStates),
      };
      usedPassthrough = true;
    } else {
      // Deep-clone (avoid mutating shared mapping)
      javaBlock = { Name: javaBlock.Name, Properties: { ...javaBlock.Properties } };
    }

    // 5. SPECIAL_CASES finalizer
    for (const sc of SPECIAL_CASES) {
      if (sc.match(name, states)) {
        javaBlock = sc.transform(javaBlock, states, normStates, usedPassthrough);
        break;
      }
    }

    // 6. Waterlogging
    if (waterlogged && javaBlock.Name !== 'minecraft:air') {
      javaBlock.Properties.waterlogged = 'true';
    }

    // 7. 型正規化 (全 Properties を string に)
    for (const [k, v] of Object.entries(javaBlock.Properties)) {
      if (typeof v !== 'string') {
        javaBlock.Properties[k] = String(v);
      }
    }

    return javaBlock;
  }

  /**
   * Convert an entire Bedrock palette.
   */
  convertPalette(bedrockPalette, layer1Indices = null, totalBlocks = 0) {
    this._warnings = [];

    const converted = bedrockPalette.map(({ name, states }) =>
      this.convertBlock(name, states, false)
    );

    const javaKeyToIndex = new Map();
    const javaPalette = [];
    const beToJeIndexMap = new Uint16Array(bedrockPalette.length);

    for (let i = 0; i < converted.length; i++) {
      const jb  = converted[i];
      const key = _canonicalJavaKey(jb);
      if (javaKeyToIndex.has(key)) {
        beToJeIndexMap[i] = javaKeyToIndex.get(key);
      } else {
        const newIdx = javaPalette.length;
        javaKeyToIndex.set(key, newIdx);
        javaPalette.push(jb);
        beToJeIndexMap[i] = newIdx;
      }
    }

    return {
      javaPalette,
      beToJeIndexMap,
      warnings: [...this._warnings],
    };
  }

  /**
   * Apply waterlogging from layer1 indices.
   */
  applyWaterlogging(layer0Indices, layer1Indices, beToJeIndexMap, javaPalette) {
    const total = layer0Indices.length;
    const outIndices = new Uint16Array(total);
    const waterlogCache = new Map();

    for (let i = 0; i < total; i++) {
      const be0Raw = layer0Indices[i];
      // H-B-07: layer0 が負値 (Bedrock の "no block") の時は layer1 の waterlog 情報も
      //         無効化して air を出力する。 layer0/layer1 の不整合を防ぐ明示的ガード。
      const be0IsAir = be0Raw < 0;
      const be0 = be0IsAir ? 0 : be0Raw;
      const be1 = be0IsAir ? -1 : layer1Indices[i];
      const jeIdx = beToJeIndexMap[be0];

      if (be1 !== -1) {
        if (!waterlogCache.has(jeIdx)) {
          const base = javaPalette[jeIdx];
          if (base.Name !== 'minecraft:air') {
            const wlogVariant = {
              Name: base.Name,
              Properties: { ...base.Properties, waterlogged: 'true' },
            };
            const wlogIdx = javaPalette.length;
            javaPalette.push(wlogVariant);
            waterlogCache.set(jeIdx, wlogIdx);
          } else {
            waterlogCache.set(jeIdx, jeIdx);
          }
        }
        outIndices[i] = waterlogCache.get(jeIdx);
      } else {
        outIndices[i] = jeIdx;
      }
    }

    return outIndices;
  }

  get warnings() {
    return this._warnings;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function _canonicalJavaKey(jb) {
  const props = Object.keys(jb.Properties).sort()
    .map(k => `${k}=${jb.Properties[k]}`)
    .join(',');
  return props ? `${jb.Name}[${props}]` : jb.Name;
}

// テスト用 export
export const __testing__ = {
  normalizeStates,
  passthroughStatesToProperties,
  LEGACY_NAME_MAP,
  IDENTITY_PASSTHROUGH_OK,
  SPECIAL_CASES,
};
