/**
 * be_to_je_block_mapping_temp1.js — ステップ1: 階段 / ドア / トラップドア(oak・spruce・birch)
 *
 * キー形式: "minecraft:block_name|sortedKey1=val1,sortedKey2=val2"
 * 値形式:   { Name: "minecraft:java_name", Properties: { ... } }
 *
 * boolean状態は 0/1（Bedrock TAG_Byte準拠）、Javaプロパティは文字列。
 */

// ── 方向ルックアップ ─────────────────────────────────────────────────────────
// 階段: weirdo_direction 0=east 1=west 2=south 3=north
const STAIR_DIR = ['east', 'west', 'south', 'north'];
// ドア: direction 0=east 1=south 2=west 3=north
const DOOR_DIR  = ['east', 'south', 'west', 'north'];
// トラップドア: direction 0=north 1=south 2=east 3=west
const TD_DIR    = ['north', 'south', 'east', 'west'];

// ── ジェネレーター ────────────────────────────────────────────────────────────

/** 階段ブロック: upside_down_bit × weirdo_direction = 8エントリ */
function genStairs(beId, jeId) {
  const out = {};
  for (let u = 0; u <= 1; u++) {
    for (let d = 0; d <= 3; d++) {
      out[`minecraft:${beId}|upside_down_bit=${u},weirdo_direction=${d}`] = {
        Name: `minecraft:${jeId}`,
        Properties: {
          facing: STAIR_DIR[d],
          half: u ? 'top' : 'bottom',
          shape: 'straight',
          waterlogged: 'false',
        },
      };
    }
  }
  return out;
}

/** ドアブロック: direction × door_hinge_bit × open_bit × upper_block_bit = 32エントリ */
function genDoor(beId, jeId) {
  const out = {};
  for (let d = 0; d <= 3; d++)
  for (let h = 0; h <= 1; h++)
  for (let o = 0; o <= 1; o++)
  for (let u = 0; u <= 1; u++) {
    out[`minecraft:${beId}|direction=${d},door_hinge_bit=${h},open_bit=${o},upper_block_bit=${u}`] = {
      Name: `minecraft:${jeId}`,
      Properties: {
        facing: DOOR_DIR[d],
        half:   u ? 'upper' : 'lower',
        hinge:  h ? 'right' : 'left',
        open:   o ? 'true' : 'false',
        powered: 'false',
        waterlogged: 'false',
      },
    };
  }
  return out;
}

/** トラップドア: direction × open_bit × upside_down_bit = 16エントリ */
function genTrapdoor(beId, jeId) {
  const out = {};
  for (let d = 0; d <= 3; d++)
  for (let o = 0; o <= 1; o++)
  for (let u = 0; u <= 1; u++) {
    out[`minecraft:${beId}|direction=${d},open_bit=${o},upside_down_bit=${u}`] = {
      Name: `minecraft:${jeId}`,
      Properties: {
        facing: TD_DIR[d],
        half:   u ? 'top' : 'bottom',
        open:   o ? 'true' : 'false',
        powered: 'false',
        waterlogged: 'false',
      },
    };
  }
  return out;
}

// ── ブロックリスト ─────────────────────────────────────────────────────────────

// [Bedrock ID, Java ID]
const STAIRS = [
  // 木材系
  ['oak_stairs',              'oak_stairs'],
  ['spruce_stairs',           'spruce_stairs'],
  ['birch_stairs',            'birch_stairs'],
  ['jungle_stairs',           'jungle_stairs'],
  ['acacia_stairs',           'acacia_stairs'],
  ['dark_oak_stairs',         'dark_oak_stairs'],
  ['mangrove_stairs',         'mangrove_stairs'],
  ['cherry_stairs',           'cherry_stairs'],
  ['bamboo_stairs',           'bamboo_stairs'],
  ['bamboo_mosaic_stairs',    'bamboo_mosaic_stairs'],
  ['pale_oak_stairs',         'pale_oak_stairs'],
  ['crimson_stairs',          'crimson_stairs'],
  ['warped_stairs',           'warped_stairs'],
  // 石・レンガ系
  ['stone_stairs',            'cobblestone_stairs'],   // BE legacy name
  ['cobblestone_stairs',      'cobblestone_stairs'],
  ['mossy_cobblestone_stairs','mossy_cobblestone_stairs'],
  ['stone_brick_stairs',      'stone_brick_stairs'],
  ['mossy_stone_brick_stairs','mossy_stone_brick_stairs'],
  ['brick_stairs',            'brick_stairs'],
  ['nether_brick_stairs',     'nether_brick_stairs'],
  ['red_nether_brick_stairs', 'red_nether_brick_stairs'],
  // 砂岩・水晶系
  ['sandstone_stairs',        'sandstone_stairs'],
  ['smooth_sandstone_stairs', 'smooth_sandstone_stairs'],
  ['red_sandstone_stairs',    'red_sandstone_stairs'],
  ['smooth_red_sandstone_stairs','smooth_red_sandstone_stairs'],
  ['quartz_stairs',           'quartz_stairs'],
  ['smooth_quartz_stairs',    'smooth_quartz_stairs'],
  // プリズマリン
  ['prismarine_stairs',       'prismarine_stairs'],
  ['prismarine_bricks_stairs','prismarine_brick_stairs'],
  ['dark_prismarine_stairs',  'dark_prismarine_stairs'],
  // エンド・パーパー
  ['end_brick_stairs',        'end_stone_brick_stairs'],
  ['purpur_stairs',           'purpur_stairs'],
  // 花崗岩・閃緑岩・安山岩
  ['granite_stairs',          'granite_stairs'],
  ['polished_granite_stairs', 'polished_granite_stairs'],
  ['diorite_stairs',          'diorite_stairs'],
  ['polished_diorite_stairs', 'polished_diorite_stairs'],
  ['andesite_stairs',         'andesite_stairs'],
  ['polished_andesite_stairs','polished_andesite_stairs'],
  // ブラックストーン
  ['blackstone_stairs',             'blackstone_stairs'],
  ['polished_blackstone_stairs',    'polished_blackstone_stairs'],
  ['polished_blackstone_brick_stairs','polished_blackstone_brick_stairs'],
  // ディープスレート
  ['cobbled_deepslate_stairs',  'cobbled_deepslate_stairs'],
  ['polished_deepslate_stairs', 'polished_deepslate_stairs'],
  ['deepslate_brick_stairs',    'deepslate_brick_stairs'],
  ['deepslate_tile_stairs',     'deepslate_tile_stairs'],
  // タフ・泥レンガ
  ['mud_brick_stairs',        'mud_brick_stairs'],
  ['tuff_stairs',             'tuff_stairs'],
  ['polished_tuff_stairs',    'polished_tuff_stairs'],
  ['tuff_brick_stairs',       'tuff_brick_stairs'],
  // 銅（カット）
  ['cut_copper_stairs',                'cut_copper_stairs'],
  ['exposed_cut_copper_stairs',        'exposed_cut_copper_stairs'],
  ['weathered_cut_copper_stairs',      'weathered_cut_copper_stairs'],
  ['oxidized_cut_copper_stairs',       'oxidized_cut_copper_stairs'],
  ['waxed_cut_copper_stairs',          'waxed_cut_copper_stairs'],
  ['waxed_exposed_cut_copper_stairs',  'waxed_exposed_cut_copper_stairs'],
  ['waxed_weathered_cut_copper_stairs','waxed_weathered_cut_copper_stairs'],
  ['waxed_oxidized_cut_copper_stairs', 'waxed_oxidized_cut_copper_stairs'],
  // レジン (1.21.2+)
  ['resin_brick_stairs',      'resin_brick_stairs'],
];

const DOORS = [
  // 木材系 (BEの'wooden_door'はJEではoak_door)
  ['wooden_door',      'oak_door'],
  ['spruce_door',      'spruce_door'],
  ['birch_door',       'birch_door'],
  ['jungle_door',      'jungle_door'],
  ['acacia_door',      'acacia_door'],
  ['dark_oak_door',    'dark_oak_door'],
  ['mangrove_door',    'mangrove_door'],
  ['cherry_door',      'cherry_door'],
  ['bamboo_door',      'bamboo_door'],
  ['pale_oak_door',    'pale_oak_door'],
  // ネザー
  ['crimson_door',     'crimson_door'],
  ['warped_door',      'warped_door'],
  // 鉄
  ['iron_door',        'iron_door'],
  // 銅系
  ['copper_door',              'copper_door'],
  ['exposed_copper_door',      'exposed_copper_door'],
  ['weathered_copper_door',    'weathered_copper_door'],
  ['oxidized_copper_door',     'oxidized_copper_door'],
  ['waxed_copper_door',        'waxed_copper_door'],
  ['waxed_exposed_copper_door','waxed_exposed_copper_door'],
  ['waxed_weathered_copper_door','waxed_weathered_copper_door'],
  ['waxed_oxidized_copper_door','waxed_oxidized_copper_door'],
];

// ステップ1: oak / spruce / birch の3種のみ
const TRAPDOORS_STEP1 = [
  ['trapdoor',         'oak_trapdoor'],
  ['spruce_trapdoor',  'spruce_trapdoor'],
  ['birch_trapdoor',   'birch_trapdoor'],
];

// ── マッピングオブジェクト生成 ─────────────────────────────────────────────────
export const mapping = Object.assign(
  {},
  ...STAIRS.map(([be, je]) => genStairs(be, je)),
  ...DOORS.map(([be, je]) => genDoor(be, je)),
  ...TRAPDOORS_STEP1.map(([be, je]) => genTrapdoor(be, je)),
);
