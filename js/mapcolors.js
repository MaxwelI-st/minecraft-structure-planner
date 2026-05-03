/**
 * mapcolors.js
 * ────────────────────────────────────────────────────────────────────────────
 * Minecraft 地図カラー（map color）変換ユーティリティ
 *
 *   blockId  →  map color group  →  base RGB  →  height shade  →  hex
 *
 * 参照:
 *   https://ja.minecraft.wiki/w/%E5%9C%B0%E5%9B%B3%E3%82%A2%E3%82%A4%E3%83%86%E3%83%A0%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88
 *   https://minecraft.wiki/w/Map_item_format#Base_colors
 *
 * 公開API:
 *   - MAP_COLORS                       : 基本色テーブル（id: number → {name, rgb}）
 *   - BLOCK_TO_MAP                     : blockId → map color id
 *   - SHADE_FACTORS                    : 0..3 の明度係数
 *   - blockIdToMapColorId(id)          : 完全一致＋プリフィックスフォールバック
 *   - getMapColorRgb(mapColorId, shade): {r,g,b}
 *   - blockIdToHex(id, shade)          : '#rrggbb'（不明色はデフォルトのグレー）
 *   - heightToShade(y, minY, maxY)     : 0..2 の階調（地図表示準拠）
 *   - rgbToHex({r,g,b})                : 補助
 * ────────────────────────────────────────────────────────────────────────────
 */

/* ─── 基本色（Minecraft 公式 base color，RGB は wiki 値） ──────────────────── */
export const MAP_COLORS = Object.freeze({
    0:  { name: 'NONE',                   rgb: [  0,   0,   0] },
    1:  { name: 'GRASS',                  rgb: [127, 178,  56] },
    2:  { name: 'SAND',                   rgb: [247, 233, 163] },
    3:  { name: 'WOOL',                   rgb: [199, 199, 199] },
    4:  { name: 'FIRE',                   rgb: [255,   0,   0] },
    5:  { name: 'ICE',                    rgb: [160, 160, 255] },
    6:  { name: 'METAL',                  rgb: [167, 167, 167] },
    7:  { name: 'PLANT',                  rgb: [  0, 124,   0] },
    8:  { name: 'SNOW',                   rgb: [255, 255, 255] },
    9:  { name: 'CLAY',                   rgb: [164, 168, 184] },
    10: { name: 'DIRT',                   rgb: [151, 109,  77] },
    11: { name: 'STONE',                  rgb: [112, 112, 112] },
    12: { name: 'WATER',                  rgb: [ 64,  64, 255] },
    13: { name: 'WOOD',                   rgb: [143, 119,  72] },
    14: { name: 'QUARTZ',                 rgb: [255, 252, 245] },
    15: { name: 'COLOR_ORANGE',           rgb: [216, 127,  51] },
    16: { name: 'COLOR_MAGENTA',          rgb: [178,  76, 216] },
    17: { name: 'COLOR_LIGHT_BLUE',       rgb: [102, 153, 216] },
    18: { name: 'COLOR_YELLOW',           rgb: [229, 229,  51] },
    19: { name: 'COLOR_LIGHT_GREEN',      rgb: [127, 204,  25] },
    20: { name: 'COLOR_PINK',             rgb: [242, 127, 165] },
    21: { name: 'COLOR_GRAY',             rgb: [ 76,  76,  76] },
    22: { name: 'COLOR_LIGHT_GRAY',       rgb: [153, 153, 153] },
    23: { name: 'COLOR_CYAN',             rgb: [ 76, 127, 153] },
    24: { name: 'COLOR_PURPLE',           rgb: [127,  63, 178] },
    25: { name: 'COLOR_BLUE',             rgb: [ 51,  76, 178] },
    26: { name: 'COLOR_BROWN',            rgb: [102,  76,  51] },
    27: { name: 'COLOR_GREEN',            rgb: [102, 127,  51] },
    28: { name: 'COLOR_RED',              rgb: [153,  51,  51] },
    29: { name: 'COLOR_BLACK',            rgb: [ 25,  25,  25] },
    30: { name: 'GOLD',                   rgb: [250, 238,  77] },
    31: { name: 'DIAMOND',                rgb: [ 92, 219, 213] },
    32: { name: 'LAPIS',                  rgb: [ 74, 128, 255] },
    33: { name: 'EMERALD',                rgb: [  0, 217,  58] },
    34: { name: 'PODZOL',                 rgb: [129,  86,  49] },
    35: { name: 'NETHER',                 rgb: [112,   2,   0] },
    36: { name: 'TERRACOTTA_WHITE',       rgb: [209, 177, 161] },
    37: { name: 'TERRACOTTA_ORANGE',      rgb: [159,  82,  36] },
    38: { name: 'TERRACOTTA_MAGENTA',     rgb: [149,  87, 108] },
    39: { name: 'TERRACOTTA_LIGHT_BLUE',  rgb: [112, 108, 138] },
    40: { name: 'TERRACOTTA_YELLOW',      rgb: [186, 133,  36] },
    41: { name: 'TERRACOTTA_LIGHT_GREEN', rgb: [103, 117,  53] },
    42: { name: 'TERRACOTTA_PINK',        rgb: [160,  77,  78] },
    43: { name: 'TERRACOTTA_GRAY',        rgb: [ 57,  41,  35] },
    44: { name: 'TERRACOTTA_LIGHT_GRAY',  rgb: [135, 107,  98] },
    45: { name: 'TERRACOTTA_CYAN',        rgb: [ 87,  92,  92] },
    46: { name: 'TERRACOTTA_PURPLE',      rgb: [122,  73,  88] },
    47: { name: 'TERRACOTTA_BLUE',        rgb: [ 76,  62,  92] },
    48: { name: 'TERRACOTTA_BROWN',       rgb: [ 76,  50,  35] },
    49: { name: 'TERRACOTTA_GREEN',       rgb: [ 76,  82,  42] },
    50: { name: 'TERRACOTTA_RED',         rgb: [142,  60,  46] },
    51: { name: 'TERRACOTTA_BLACK',       rgb: [ 37,  22,  16] },
    52: { name: 'CRIMSON_NYLIUM',         rgb: [189,  48,  49] },
    53: { name: 'CRIMSON_STEM',           rgb: [148,  63,  97] },
    54: { name: 'CRIMSON_HYPHAE',         rgb: [ 92,  25,  29] },
    55: { name: 'WARPED_NYLIUM',          rgb: [ 22, 126, 134] },
    56: { name: 'WARPED_STEM',            rgb: [ 58, 142, 140] },
    57: { name: 'WARPED_HYPHAE',          rgb: [ 86,  44,  62] },
    58: { name: 'WARPED_WART_BLOCK',      rgb: [ 20, 180, 133] },
    59: { name: 'DEEPSLATE',              rgb: [100, 100, 100] },
    60: { name: 'RAW_IRON',               rgb: [216, 175, 147] },
    61: { name: 'GLOW_LICHEN',            rgb: [127, 167, 150] },
});

/* ─── 明度シェード係数（Java Edition 準拠） ──────────────────────────────── */
export const SHADE_FACTORS = Object.freeze([180 / 255, 220 / 255, 255 / 255, 135 / 255]);

/* ─── ブロックID → 地図カラーID マップ ──────────────────────────────────── */
export const BLOCK_TO_MAP = Object.freeze({
    /* GRASS / PLANT */
    'minecraft:grass_block': 1,
    'minecraft:slime_block': 1,
    'minecraft:lily_pad': 1,
    'minecraft:moss_block': 7,
    'minecraft:moss_carpet': 7,
    'minecraft:oak_leaves': 7,
    'minecraft:spruce_leaves': 7,
    'minecraft:birch_leaves': 7,
    'minecraft:jungle_leaves': 7,
    'minecraft:acacia_leaves': 7,
    'minecraft:dark_oak_leaves': 7,
    'minecraft:mangrove_leaves': 7,
    'minecraft:cherry_leaves': 20,
    'minecraft:azalea_leaves': 7,
    'minecraft:flowering_azalea_leaves': 7,
    'minecraft:cactus': 7,
    'minecraft:bamboo': 7,
    'minecraft:bamboo_block': 18,
    'minecraft:dried_kelp_block': 27,
    'minecraft:vine': 7,
    'minecraft:azalea': 7,
    'minecraft:flowering_azalea': 7,
    'minecraft:big_dripleaf': 7,
    'minecraft:small_dripleaf': 7,

    /* SAND */
    'minecraft:sand': 2,
    'minecraft:sandstone': 2,
    'minecraft:smooth_sandstone': 2,
    'minecraft:cut_sandstone': 2,
    'minecraft:chiseled_sandstone': 2,
    'minecraft:end_stone': 2,
    'minecraft:end_stone_bricks': 2,
    'minecraft:bone_block': 2,
    'minecraft:birch_planks': 2,
    'minecraft:birch_log': 2,
    'minecraft:stripped_birch_log': 2,
    'minecraft:birch_wood': 2,
    'minecraft:stripped_birch_wood': 2,
    'minecraft:glowstone': 2,
    'minecraft:scaffolding': 2,

    /* WOOL（基本：白） */
    'minecraft:white_wool': 3,
    'minecraft:white_carpet': 3,
    'minecraft:mushroom_stem': 3,
    'minecraft:white_bed': 3,

    /* FIRE / RED */
    'minecraft:lava': 4,
    'minecraft:tnt': 4,
    'minecraft:fire': 4,
    'minecraft:redstone_block': 4,

    /* ICE */
    'minecraft:ice': 5,
    'minecraft:packed_ice': 5,
    'minecraft:blue_ice': 5,
    'minecraft:frosted_ice': 5,

    /* METAL */
    'minecraft:iron_block': 6,
    'minecraft:iron_door': 6,
    'minecraft:brewing_stand': 6,
    'minecraft:heavy_weighted_pressure_plate': 6,
    'minecraft:anvil': 6,
    'minecraft:chipped_anvil': 6,
    'minecraft:damaged_anvil': 6,
    'minecraft:grindstone': 6,
    'minecraft:soul_lantern': 6,
    'minecraft:lantern': 6,
    'minecraft:lodestone': 6,

    /* PLANT (緑系)*/
    'minecraft:oak_sapling': 7,
    'minecraft:spruce_sapling': 7,
    'minecraft:birch_sapling': 7,
    'minecraft:jungle_sapling': 7,
    'minecraft:acacia_sapling': 7,
    'minecraft:dark_oak_sapling': 7,
    'minecraft:wheat': 7,
    'minecraft:sugar_cane': 7,
    'minecraft:tall_grass': 7,
    'minecraft:fern': 7,
    'minecraft:large_fern': 7,
    'minecraft:grass': 7,
    'minecraft:seagrass': 7,
    'minecraft:tall_seagrass': 7,
    'minecraft:kelp': 7,
    'minecraft:kelp_plant': 7,
    'minecraft:melon': 27,
    'minecraft:pumpkin': 15,
    'minecraft:carved_pumpkin': 15,
    'minecraft:jack_o_lantern': 15,
    'minecraft:hay_block': 18,

    /* SNOW */
    'minecraft:snow': 8,
    'minecraft:snow_block': 8,
    'minecraft:powder_snow': 8,
    'minecraft:white_concrete_powder': 8,

    /* CLAY */
    'minecraft:clay': 9,

    /* DIRT */
    'minecraft:dirt': 10,
    'minecraft:coarse_dirt': 10,
    'minecraft:rooted_dirt': 10,
    'minecraft:dirt_path': 10,
    'minecraft:farmland': 10,
    'minecraft:granite': 10,
    'minecraft:polished_granite': 10,
    'minecraft:jungle_planks': 10,
    'minecraft:jungle_log': 10,
    'minecraft:stripped_jungle_log': 10,
    'minecraft:jungle_wood': 10,
    'minecraft:stripped_jungle_wood': 10,

    /* STONE */
    'minecraft:stone': 11,
    'minecraft:cobblestone': 11,
    'minecraft:mossy_cobblestone': 11,
    'minecraft:stone_bricks': 11,
    'minecraft:mossy_stone_bricks': 11,
    'minecraft:cracked_stone_bricks': 11,
    'minecraft:chiseled_stone_bricks': 11,
    'minecraft:smooth_stone': 11,
    'minecraft:andesite': 11,
    'minecraft:polished_andesite': 11,
    'minecraft:gravel': 11,
    'minecraft:dispenser': 11,
    'minecraft:dropper': 11,
    'minecraft:furnace': 11,
    'minecraft:blast_furnace': 11,
    'minecraft:smoker': 11,
    'minecraft:observer': 11,
    'minecraft:piston': 11,
    'minecraft:sticky_piston': 11,
    'minecraft:cobbled_deepslate': 11,
    'minecraft:tuff': 11,
    'minecraft:cauldron': 11,
    'minecraft:water_cauldron': 11,
    'minecraft:lava_cauldron': 11,
    'minecraft:powder_snow_cauldron': 11,

    /* WATER */
    'minecraft:water': 12,
    'minecraft:flowing_water': 12,
    'minecraft:bubble_column': 12,

    /* WOOD（オーク系） */
    'minecraft:oak_planks': 13,
    'minecraft:oak_log': 13,
    'minecraft:stripped_oak_log': 13,
    'minecraft:oak_wood': 13,
    'minecraft:stripped_oak_wood': 13,
    'minecraft:oak_fence': 13,
    'minecraft:oak_door': 13,
    'minecraft:oak_stairs': 13,
    'minecraft:oak_slab': 13,
    'minecraft:oak_trapdoor': 13,
    'minecraft:crafting_table': 13,
    'minecraft:bookshelf': 13,
    'minecraft:chest': 13,
    'minecraft:trapped_chest': 13,
    'minecraft:barrel': 13,
    'minecraft:loom': 13,
    'minecraft:cartography_table': 13,
    'minecraft:fletching_table': 13,
    'minecraft:smithing_table': 43,
    'minecraft:lectern': 13,
    'minecraft:composter': 13,
    'minecraft:beehive': 13,
    'minecraft:bee_nest': 13,
    'minecraft:campfire': 13,
    'minecraft:soul_campfire': 13,
    'minecraft:note_block': 13,
    'minecraft:jukebox': 13,

    /* QUARTZ */
    'minecraft:quartz_block': 14,
    'minecraft:smooth_quartz': 14,
    'minecraft:chiseled_quartz_block': 14,
    'minecraft:quartz_pillar': 14,
    'minecraft:quartz_bricks': 14,
    'minecraft:quartz_stairs': 14,
    'minecraft:quartz_slab': 14,
    'minecraft:diorite': 14,
    'minecraft:polished_diorite': 14,
    'minecraft:sea_lantern': 14,

    /* COLOR_ORANGE */
    'minecraft:orange_wool': 15,
    'minecraft:orange_carpet': 15,
    'minecraft:orange_terracotta': 15,
    'minecraft:orange_concrete': 15,
    'minecraft:orange_concrete_powder': 15,
    'minecraft:orange_stained_glass': 15,
    'minecraft:acacia_planks': 15,
    'minecraft:acacia_log': 28,
    'minecraft:stripped_acacia_log': 15,
    'minecraft:acacia_wood': 15,
    'minecraft:stripped_acacia_wood': 15,
    'minecraft:red_sand': 15,
    'minecraft:red_sandstone': 15,
    'minecraft:smooth_red_sandstone': 15,
    'minecraft:cut_red_sandstone': 15,
    'minecraft:chiseled_red_sandstone': 15,
    'minecraft:copper_block': 15,

    /* COLOR_MAGENTA */
    'minecraft:magenta_wool': 16,
    'minecraft:magenta_carpet': 16,
    'minecraft:magenta_terracotta': 16,
    'minecraft:magenta_concrete': 16,
    'minecraft:magenta_concrete_powder': 16,
    'minecraft:magenta_stained_glass': 16,
    'minecraft:purpur_block': 16,
    'minecraft:purpur_pillar': 16,
    'minecraft:purpur_stairs': 16,
    'minecraft:purpur_slab': 16,

    /* COLOR_LIGHT_BLUE */
    'minecraft:light_blue_wool': 17,
    'minecraft:light_blue_carpet': 17,
    'minecraft:light_blue_terracotta': 17,
    'minecraft:light_blue_concrete': 17,
    'minecraft:light_blue_concrete_powder': 17,
    'minecraft:light_blue_stained_glass': 17,
    'minecraft:soul_fire': 17,
    'minecraft:soul_torch': 17,

    /* COLOR_YELLOW */
    'minecraft:yellow_wool': 18,
    'minecraft:yellow_carpet': 18,
    'minecraft:yellow_terracotta': 18,
    'minecraft:yellow_concrete': 18,
    'minecraft:yellow_concrete_powder': 18,
    'minecraft:yellow_stained_glass': 18,
    'minecraft:sponge': 18,
    'minecraft:wet_sponge': 18,
    'minecraft:honey_block': 18,
    'minecraft:honeycomb_block': 18,

    /* COLOR_LIGHT_GREEN */
    'minecraft:lime_wool': 19,
    'minecraft:lime_carpet': 19,
    'minecraft:lime_terracotta': 19,
    'minecraft:lime_concrete': 19,
    'minecraft:lime_concrete_powder': 19,
    'minecraft:lime_stained_glass': 19,

    /* COLOR_PINK */
    'minecraft:pink_wool': 20,
    'minecraft:pink_carpet': 20,
    'minecraft:pink_terracotta': 20,
    'minecraft:pink_concrete': 20,
    'minecraft:pink_concrete_powder': 20,
    'minecraft:pink_stained_glass': 20,
    'minecraft:cherry_planks': 20,
    'minecraft:cherry_log': 20,
    'minecraft:stripped_cherry_log': 20,
    'minecraft:cherry_wood': 20,
    'minecraft:stripped_cherry_wood': 20,
    'minecraft:pink_petals': 20,

    /* COLOR_GRAY */
    'minecraft:gray_wool': 21,
    'minecraft:gray_carpet': 21,
    'minecraft:gray_terracotta': 21,
    'minecraft:gray_concrete': 21,
    'minecraft:gray_concrete_powder': 21,
    'minecraft:gray_stained_glass': 21,

    /* COLOR_LIGHT_GRAY */
    'minecraft:light_gray_wool': 22,
    'minecraft:light_gray_carpet': 22,
    'minecraft:light_gray_terracotta': 22,
    'minecraft:light_gray_concrete': 22,
    'minecraft:light_gray_concrete_powder': 22,
    'minecraft:light_gray_stained_glass': 22,
    'minecraft:structure_void': 22,

    /* COLOR_CYAN */
    'minecraft:cyan_wool': 23,
    'minecraft:cyan_carpet': 23,
    'minecraft:cyan_terracotta': 23,
    'minecraft:cyan_concrete': 23,
    'minecraft:cyan_concrete_powder': 23,
    'minecraft:cyan_stained_glass': 23,
    'minecraft:prismarine': 23,
    'minecraft:prismarine_bricks': 23,

    /* COLOR_PURPLE */
    'minecraft:purple_wool': 24,
    'minecraft:purple_carpet': 24,
    'minecraft:purple_terracotta': 24,
    'minecraft:purple_concrete': 24,
    'minecraft:purple_concrete_powder': 24,
    'minecraft:purple_stained_glass': 24,
    'minecraft:mycelium': 24,
    'minecraft:chorus_plant': 24,
    'minecraft:chorus_flower': 24,
    'minecraft:repeating_command_block': 24,

    /* COLOR_BLUE */
    'minecraft:blue_wool': 25,
    'minecraft:blue_carpet': 25,
    'minecraft:blue_terracotta': 25,
    'minecraft:blue_concrete': 25,
    'minecraft:blue_concrete_powder': 25,
    'minecraft:blue_stained_glass': 25,

    /* COLOR_BROWN */
    'minecraft:brown_wool': 26,
    'minecraft:brown_carpet': 26,
    'minecraft:brown_terracotta': 26,
    'minecraft:brown_concrete': 26,
    'minecraft:brown_concrete_powder': 26,
    'minecraft:brown_stained_glass': 26,
    'minecraft:soul_sand': 26,
    'minecraft:soul_soil': 26,
    'minecraft:dark_oak_planks': 26,
    'minecraft:dark_oak_log': 26,
    'minecraft:stripped_dark_oak_log': 26,
    'minecraft:dark_oak_wood': 26,
    'minecraft:stripped_dark_oak_wood': 26,
    'minecraft:spruce_planks': 26,
    'minecraft:spruce_log': 26,
    'minecraft:stripped_spruce_log': 26,
    'minecraft:spruce_wood': 26,
    'minecraft:stripped_spruce_wood': 26,
    'minecraft:command_block': 26,
    'minecraft:chain_command_block': 26,
    'minecraft:dried_kelp': 26,

    /* COLOR_GREEN */
    'minecraft:green_wool': 27,
    'minecraft:green_carpet': 27,
    'minecraft:green_terracotta': 27,
    'minecraft:green_concrete': 27,
    'minecraft:green_concrete_powder': 27,
    'minecraft:green_stained_glass': 27,
    'minecraft:end_portal_frame': 27,
    'minecraft:sea_pickle': 27,

    /* COLOR_RED */
    'minecraft:red_wool': 28,
    'minecraft:red_carpet': 28,
    'minecraft:red_terracotta': 28,
    'minecraft:red_concrete': 28,
    'minecraft:red_concrete_powder': 28,
    'minecraft:red_stained_glass': 28,
    'minecraft:bricks': 28,
    'minecraft:nether_wart_block': 28,
    'minecraft:enchanting_table': 28,
    'minecraft:red_mushroom_block': 28,
    'minecraft:beacon': 31,

    /* COLOR_BLACK */
    'minecraft:black_wool': 29,
    'minecraft:black_carpet': 29,
    'minecraft:black_terracotta': 29,
    'minecraft:black_concrete': 29,
    'minecraft:black_concrete_powder': 29,
    'minecraft:black_stained_glass': 29,
    'minecraft:obsidian': 29,
    'minecraft:crying_obsidian': 24,
    'minecraft:end_portal': 29,
    'minecraft:end_gateway': 29,
    'minecraft:dragon_egg': 29,
    'minecraft:coal_block': 29,

    /* GOLD */
    'minecraft:gold_block': 30,
    'minecraft:bell': 30,
    'minecraft:raw_gold_block': 30,
    'minecraft:light_weighted_pressure_plate': 30,

    /* DIAMOND */
    'minecraft:diamond_block': 31,
    'minecraft:dark_prismarine': 31,
    'minecraft:conduit': 31,

    /* LAPIS */
    'minecraft:lapis_block': 32,

    /* EMERALD */
    'minecraft:emerald_block': 33,

    /* PODZOL */
    'minecraft:podzol': 34,

    /* NETHER */
    'minecraft:netherrack': 35,
    'minecraft:nether_bricks': 35,
    'minecraft:cracked_nether_bricks': 35,
    'minecraft:chiseled_nether_bricks': 35,
    'minecraft:red_nether_bricks': 35,
    'minecraft:nether_gold_ore': 35,
    'minecraft:nether_quartz_ore': 35,
    'minecraft:magma_block': 35,
    'minecraft:gilded_blackstone': 35,

    /* TERRACOTTA系 */
    'minecraft:white_terracotta': 36,
    'minecraft:terracotta': 37,

    /* CRIMSON */
    'minecraft:crimson_nylium': 52,
    'minecraft:crimson_planks': 53,
    'minecraft:crimson_stem': 53,
    'minecraft:stripped_crimson_stem': 53,
    'minecraft:crimson_hyphae': 54,
    'minecraft:stripped_crimson_hyphae': 54,
    'minecraft:crimson_door': 53,
    'minecraft:crimson_fence': 53,
    'minecraft:crimson_stairs': 53,
    'minecraft:crimson_slab': 53,

    /* WARPED */
    'minecraft:warped_nylium': 55,
    'minecraft:warped_planks': 56,
    'minecraft:warped_stem': 56,
    'minecraft:stripped_warped_stem': 56,
    'minecraft:warped_hyphae': 57,
    'minecraft:stripped_warped_hyphae': 57,
    'minecraft:warped_wart_block': 58,

    /* DEEPSLATE */
    'minecraft:deepslate': 59,
    'minecraft:polished_deepslate': 59,
    'minecraft:deepslate_bricks': 59,
    'minecraft:cracked_deepslate_bricks': 59,
    'minecraft:chiseled_deepslate': 59,
    'minecraft:deepslate_tiles': 59,
    'minecraft:cracked_deepslate_tiles': 59,
    'minecraft:reinforced_deepslate': 59,

    /* RAW_IRON */
    'minecraft:raw_iron_block': 60,

    /* GLOW_LICHEN */
    'minecraft:glow_lichen': 61,

    /* AIR / 描画なし */
    'minecraft:air': 0,
    'minecraft:cave_air': 0,
    'minecraft:void_air': 0,
    'minecraft:structure_block': 0,
    'minecraft:barrier': 0,
    'minecraft:light': 0,
});

/* ─── 色プリフィックスフォールバック ────────────────────────────────────── */
const COLOR_PREFIX_MAP = {
    'white_':       3,
    'orange_':     15,
    'magenta_':    16,
    'light_blue_': 17,
    'yellow_':     18,
    'lime_':       19,
    'pink_':       20,
    'gray_':       21,
    'light_gray_': 22,
    'cyan_':       23,
    'purple_':     24,
    'blue_':       25,
    'brown_':      26,
    'green_':      27,
    'red_':        28,
    'black_':      29,
};

/**
 * blockId（"minecraft:oak_planks" 等）から map color id を返す。
 * 完全一致 → 名前空間補完 → 色プリフィックス → 木材/石/水等のキーワード → 0(透明)。
 */
export function blockIdToMapColorId(blockId) {
    if (!blockId) return 0;
    const id = String(blockId).toLowerCase().trim();
    if (BLOCK_TO_MAP[id] !== undefined) return BLOCK_TO_MAP[id];

    const ns = id.includes(':') ? id : 'minecraft:' + id;
    if (BLOCK_TO_MAP[ns] !== undefined) return BLOCK_TO_MAP[ns];

    const local = ns.replace(/^minecraft:/, '');

    // 色プリフィックス（長いキーから順に試す）
    const sorted = Object.keys(COLOR_PREFIX_MAP).sort((a, b) => b.length - a.length);
    for (const prefix of sorted) {
        if (local.startsWith(prefix)) return COLOR_PREFIX_MAP[prefix];
    }

    // 木材プリフィックス
    if (local.includes('dark_oak'))  return 26;
    if (local.includes('oak'))       return 13;
    if (local.includes('spruce'))    return 26;
    if (local.includes('birch'))     return 2;
    if (local.includes('jungle'))    return 10;
    if (local.includes('acacia'))    return 15;
    if (local.includes('cherry'))    return 20;
    if (local.includes('mangrove'))  return 28;
    if (local.includes('crimson'))   return 53;
    if (local.includes('warped'))    return 56;
    if (local.includes('bamboo'))    return 18;

    // 石/鉱石/特殊
    if (local.includes('deepslate'))  return 59;
    if (local.includes('basalt'))     return 21;
    if (local.includes('blackstone')) return 29;
    if (local.includes('nether'))     return 35;
    if (local.includes('end_'))       return 2;
    if (local.includes('terracotta')) return 37;
    if (local.includes('concrete'))   return 36;
    if (local.includes('glass'))      return 0;
    if (local.includes('water'))      return 12;
    if (local.includes('lava'))       return 4;
    if (local.includes('ice'))        return 5;
    if (local.includes('snow'))       return 8;
    if (local.includes('stone'))      return 11;
    if (local.includes('dirt'))       return 10;
    if (local.includes('sand'))       return 2;
    if (local.includes('wood') || local.includes('plank')) return 13;

    return 0;
}

/**
 * map color id と shade(0..3) から RGB を返す。
 */
export function getMapColorRgb(mapColorId, shade = 1) {
    const c = MAP_COLORS[mapColorId] || MAP_COLORS[0];
    const f = SHADE_FACTORS[shade] ?? 1;
    const [r, g, b] = c.rgb;
    return {
        r: Math.round(r * f),
        g: Math.round(g * f),
        b: Math.round(b * f),
    };
}

/**
 * blockId と shade から hex 色を返す。
 * 透明（id 0）の場合は null を返す。
 */
export function blockIdToHex(blockId, shade = 1) {
    const mapId = blockIdToMapColorId(blockId);
    if (mapId === 0) return null;
    const { r, g, b } = getMapColorRgb(mapId, shade);
    return rgbToHex({ r, g, b });
}

/**
 * 高さ y を 3 段階(0..2) のシェードに変換。
 * minY..maxY を 3 等分して shade 0/1/2 を割り当てる（0=暗 / 1=中 / 2=明）。
 */
export function heightToShade(y, minY = 0, maxY = 255) {
    if (maxY <= minY) return 1;
    const ratio = (y - minY) / (maxY - minY);
    if (ratio < 1 / 3) return 0;
    if (ratio < 2 / 3) return 1;
    return 2;
}

export function rgbToHex({ r, g, b }) {
    const h = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
}

/** デバッグ用：登録済み blockId の総数。 */
export function getRegisteredBlockCount() {
    return Object.keys(BLOCK_TO_MAP).length;
}

/* ─── マップカラー → 代表ブロック逆引き ─────────────────────────────────────
 * MAP_PALETTE で描画されたピクセルを「実ブロック」として集計するための代表ブロック表。
 * 入手しやすい・建材として典型的なブロックを 1 種ずつ採用。
 */
export const MAP_TO_REPRESENTATIVE_BLOCK = Object.freeze({
    1:  'minecraft:grass_block',
    2:  'minecraft:sand',
    3:  'minecraft:white_wool',
    4:  'minecraft:redstone_block',
    5:  'minecraft:ice',
    6:  'minecraft:iron_block',
    7:  'minecraft:oak_leaves',
    8:  'minecraft:snow_block',
    9:  'minecraft:clay',
    10: 'minecraft:dirt',
    11: 'minecraft:stone',
    12: 'minecraft:water',                  // 集計上は便宜的に water
    13: 'minecraft:oak_planks',
    14: 'minecraft:quartz_block',
    15: 'minecraft:orange_wool',
    16: 'minecraft:magenta_wool',
    17: 'minecraft:light_blue_wool',
    18: 'minecraft:yellow_wool',
    19: 'minecraft:lime_wool',
    20: 'minecraft:pink_wool',
    21: 'minecraft:gray_wool',
    22: 'minecraft:light_gray_wool',
    23: 'minecraft:cyan_wool',
    24: 'minecraft:purple_wool',
    25: 'minecraft:blue_wool',
    26: 'minecraft:brown_wool',
    27: 'minecraft:green_wool',
    28: 'minecraft:red_wool',
    29: 'minecraft:black_wool',
    30: 'minecraft:gold_block',
    31: 'minecraft:diamond_block',
    32: 'minecraft:lapis_block',
    33: 'minecraft:emerald_block',
    34: 'minecraft:podzol',
    35: 'minecraft:netherrack',
    36: 'minecraft:white_terracotta',
    37: 'minecraft:orange_terracotta',
    38: 'minecraft:magenta_terracotta',
    39: 'minecraft:light_blue_terracotta',
    40: 'minecraft:yellow_terracotta',
    41: 'minecraft:lime_terracotta',
    42: 'minecraft:pink_terracotta',
    43: 'minecraft:gray_terracotta',
    44: 'minecraft:light_gray_terracotta',
    45: 'minecraft:cyan_terracotta',
    46: 'minecraft:purple_terracotta',
    47: 'minecraft:blue_terracotta',
    48: 'minecraft:brown_terracotta',
    49: 'minecraft:green_terracotta',
    50: 'minecraft:red_terracotta',
    51: 'minecraft:black_terracotta',
    52: 'minecraft:crimson_nylium',
    53: 'minecraft:crimson_planks',
    54: 'minecraft:crimson_hyphae',
    55: 'minecraft:warped_nylium',
    56: 'minecraft:warped_planks',
    57: 'minecraft:warped_hyphae',
    58: 'minecraft:warped_wart_block',
    59: 'minecraft:deepslate',
    60: 'minecraft:raw_iron_block',
    61: 'minecraft:glow_lichen',
});

/**
 * 仮想ID 'mapcolor:<name>' から代表ブロックIDに変換。
 * 仮想IDで無い場合はそのまま返す。
 */
export function virtualToRealBlockId(blockId) {
    if (typeof blockId !== 'string' || !blockId.startsWith('mapcolor:')) return blockId;
    const name = blockId.slice('mapcolor:'.length).toUpperCase();
    for (const [idStr, info] of Object.entries(MAP_COLORS)) {
        if (info.name === name) {
            const real = MAP_TO_REPRESENTATIVE_BLOCK[Number(idStr)];
            if (real) return real;
        }
    }
    return blockId;  // 見つからなければ仮想IDのまま
}
