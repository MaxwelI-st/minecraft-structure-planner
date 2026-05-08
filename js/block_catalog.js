/** 
 * Minecraft Block Catalog (Shape-Based Version)
 * タブを形状で分け、フォルダ機能は「すべて」タブのみに限定
 */
export const BLOCK_CATALOG = {
  /** すべて (フォルダ分け用) */
  all: [], // 下の ALL_BLOCK_IDS と同じ内容

  /** フルブロック */
  full: [
    "minecraft:stone", "minecraft:cobblestone", "minecraft:mossy_cobblestone",
    "minecraft:granite", "minecraft:polished_granite", "minecraft:diorite", "minecraft:polished_diorite", "minecraft:andesite", "minecraft:polished_andesite",
    "minecraft:deepslate", "minecraft:cobbled_deepslate", "minecraft:polished_deepslate", "minecraft:deepslate_bricks", "minecraft:deepslate_tiles",
    "minecraft:tuff", "minecraft:polished_tuff", "minecraft:tuff_bricks",
    "minecraft:bricks", "minecraft:mud_bricks", "minecraft:sandstone", "minecraft:red_sandstone",
    "minecraft:oak_planks", "minecraft:spruce_planks", "minecraft:birch_planks", "minecraft:jungle_planks",
    "minecraft:white_wool", "minecraft:orange_wool", "minecraft:magenta_wool", "minecraft:light_blue_wool",
    "minecraft:white_concrete", "minecraft:orange_concrete", "minecraft:magenta_concrete",
    "minecraft:dirt", "minecraft:grass_block", "minecraft:sand", "minecraft:gravel",
    "minecraft:coal_block", "minecraft:iron_block", "minecraft:gold_block", "minecraft:diamond_block",
    "minecraft:copper_block", "minecraft:exposed_copper", "minecraft:weathered_copper", "minecraft:oxidized_copper",
  ],

  /** ハーフブロック (Slab) */
  slab: [
    "minecraft:stone_slab", "minecraft:cobblestone_slab", "minecraft:mossy_cobblestone_slab",
    "minecraft:stone_brick_slab", "minecraft:granite_slab", "minecraft:diorite_slab", "minecraft:andesite_slab",
    "minecraft:cobbled_deepslate_slab", "minecraft:polished_deepslate_slab", "minecraft:deepslate_brick_slab", "minecraft:deepslate_tile_slab",
    "minecraft:tuff_slab", "minecraft:tuff_brick_slab",
    "minecraft:brick_slab", "minecraft:mud_brick_slab", "minecraft:sandstone_slab", "minecraft:red_sandstone_slab",
    "minecraft:oak_slab", "minecraft:spruce_slab", "minecraft:birch_slab", "minecraft:jungle_slab",
    "minecraft:copper_slab", "minecraft:exposed_cut_copper_slab", "minecraft:weathered_cut_copper_slab", "minecraft:oxidized_cut_copper_slab",
  ],

  /** 階段 (Stairs) */
  stairs: [
    "minecraft:stone_stairs", "minecraft:cobblestone_stairs", "minecraft:mossy_cobblestone_stairs",
    "minecraft:stone_brick_stairs", "minecraft:granite_stairs", "minecraft:diorite_stairs", "minecraft:andesite_stairs",
    "minecraft:cobbled_deepslate_stairs", "minecraft:polished_deepslate_stairs", "minecraft:deepslate_brick_stairs", "minecraft:deepslate_tile_stairs",
    "minecraft:tuff_stairs", "minecraft:tuff_brick_stairs",
    "minecraft:brick_stairs", "minecraft:mud_brick_stairs", "minecraft:sandstone_stairs", "minecraft:red_sandstone_stairs",
    "minecraft:oak_stairs", "minecraft:spruce_stairs", "minecraft:birch_stairs", "minecraft:jungle_stairs",
    "minecraft:cut_copper_stairs", "minecraft:exposed_cut_copper_stairs", "minecraft:weathered_cut_copper_stairs", "minecraft:oxidized_cut_copper_stairs",
  ],

  /** 装飾・機能 (Glass, Light, etc.) */
  deco: [
    "minecraft:glass", "minecraft:white_stained_glass", "minecraft:light_blue_stained_glass",
    "minecraft:torch", "minecraft:lantern", "minecraft:soul_lantern", "minecraft:glowstone", "minecraft:sea_lantern",
    "minecraft:oak_door", "minecraft:iron_door", "minecraft:oak_trapdoor", "minecraft:iron_trapdoor",
    "minecraft:crafting_table", "minecraft:furnace", "minecraft:chest", "minecraft:barrel",
    "minecraft:ladder", "minecraft:iron_bars", "minecraft:glass_pane",
  ],

  /** 特殊・変換 (Macros) */
  special: [
    "minecraft:barrier", "minecraft:structure_block", "minecraft:command_block", "minecraft:jigsaw", "minecraft:light_block",
  ]
};

// 重複を除いた全ブロックリスト（検索用）
export const ALL_BLOCK_IDS = [
  ...new Set(Object.values(BLOCK_CATALOG).flat())
].filter(id => id !== "");

BLOCK_CATALOG.all = ALL_BLOCK_IDS;
