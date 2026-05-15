/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 10
 *
 * 収録カテゴリ:
 *   1. 花・植物 (Flowers, Mushrooms, Vegetation)
 *   2. 鉱石ブロック (Ore blocks, Metal blocks)
 *   3. 雑多な建築ブロック (Misc: crafting table, anvil, campfire, etc.)
 *   4. スカルク系 (Sculk family)
 *   5. バンブー・マングローブ特有ブロック
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json
 */

export const BE_TO_JE_BLOCK_MAP_PART10 = {

  // ============================================================
  // SECTION 1: 花・植物 (Flowers, Mushrooms, Vegetation)
  // ============================================================

  "minecraft:yellow_flower": [
    { "bedrock_states": {}, "java_id": "minecraft:dandelion", "java_states": {} },
  ],

  "minecraft:red_flower": [
    { "bedrock_states": { "flower_type": "poppy" }, "java_id": "minecraft:poppy", "java_states": {} },
    { "bedrock_states": { "flower_type": "orchid" }, "java_id": "minecraft:blue_orchid", "java_states": {} },
    { "bedrock_states": { "flower_type": "allium" }, "java_id": "minecraft:allium", "java_states": {} },
    { "bedrock_states": { "flower_type": "houstonia" }, "java_id": "minecraft:azure_bluet", "java_states": {} },
    { "bedrock_states": { "flower_type": "tulip_red" }, "java_id": "minecraft:red_tulip", "java_states": {} },
    { "bedrock_states": { "flower_type": "tulip_orange" }, "java_id": "minecraft:orange_tulip", "java_states": {} },
    { "bedrock_states": { "flower_type": "tulip_white" }, "java_id": "minecraft:white_tulip", "java_states": {} },
    { "bedrock_states": { "flower_type": "tulip_pink" }, "java_id": "minecraft:pink_tulip", "java_states": {} },
    { "bedrock_states": { "flower_type": "oxeye" }, "java_id": "minecraft:oxeye_daisy", "java_states": {} },
    { "bedrock_states": { "flower_type": "cornflower" }, "java_id": "minecraft:cornflower", "java_states": {} },
    { "bedrock_states": { "flower_type": "lily_of_the_valley" }, "java_id": "minecraft:lily_of_the_valley", "java_states": {} },
  ],

  "minecraft:wither_rose": [
    { "bedrock_states": {}, "java_id": "minecraft:wither_rose", "java_states": {} },
  ],

  "minecraft:torchflower": [
    { "bedrock_states": {}, "java_id": "minecraft:torchflower", "java_states": {} },
  ],

  "minecraft:pink_petals": [
    { "bedrock_states": { "growth": 0, "direction": 0 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "south", "flower_amount": "1" } },
    { "bedrock_states": { "growth": 0, "direction": 1 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "west", "flower_amount": "1" } },
    { "bedrock_states": { "growth": 0, "direction": 2 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "north", "flower_amount": "1" } },
    { "bedrock_states": { "growth": 0, "direction": 3 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "east", "flower_amount": "1" } },
    { "bedrock_states": { "growth": 1, "direction": 0 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "south", "flower_amount": "2" } },
    { "bedrock_states": { "growth": 1, "direction": 1 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "west", "flower_amount": "2" } },
    { "bedrock_states": { "growth": 1, "direction": 2 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "north", "flower_amount": "2" } },
    { "bedrock_states": { "growth": 1, "direction": 3 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "east", "flower_amount": "2" } },
    { "bedrock_states": { "growth": 2, "direction": 0 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "south", "flower_amount": "3" } },
    { "bedrock_states": { "growth": 2, "direction": 1 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "west", "flower_amount": "3" } },
    { "bedrock_states": { "growth": 2, "direction": 2 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "north", "flower_amount": "3" } },
    { "bedrock_states": { "growth": 2, "direction": 3 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "east", "flower_amount": "3" } },
    { "bedrock_states": { "growth": 3, "direction": 0 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "south", "flower_amount": "4" } },
    { "bedrock_states": { "growth": 3, "direction": 1 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "west", "flower_amount": "4" } },
    { "bedrock_states": { "growth": 3, "direction": 2 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "north", "flower_amount": "4" } },
    { "bedrock_states": { "growth": 3, "direction": 3 }, "java_id": "minecraft:pink_petals", "java_states": { "facing": "east", "flower_amount": "4" } },
  ],

  "minecraft:red_mushroom": [
    { "bedrock_states": {}, "java_id": "minecraft:red_mushroom", "java_states": {} },
  ],

  "minecraft:brown_mushroom": [
    { "bedrock_states": {}, "java_id": "minecraft:brown_mushroom", "java_states": {} },
  ],

  "minecraft:red_mushroom_block": [
    { "bedrock_states": { "huge_mushroom_bits": 0 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 1 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 2 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 3 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 4 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 5 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 6 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 7 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 8 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 9 },  "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "true",  "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 10 }, "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "false", "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 14 }, "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 15 }, "java_id": "minecraft:red_mushroom_block", "java_states": { "down": "true",  "east": "true",  "north": "true",  "south": "true",  "up": "true",  "west": "true"  } },
  ],

  "minecraft:brown_mushroom_block": [
    { "bedrock_states": { "huge_mushroom_bits": 0 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 1 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 2 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 3 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 4 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 5 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 6 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 7 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 8 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 9 },  "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "true",  "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 10 }, "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "false", "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 14 }, "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 15 }, "java_id": "minecraft:brown_mushroom_block", "java_states": { "down": "true",  "east": "true",  "north": "true",  "south": "true",  "up": "true",  "west": "true"  } },
  ],

  "minecraft:mushroom_stem": [
    { "bedrock_states": { "huge_mushroom_bits": 0 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 1 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 2 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 3 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 4 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 5 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 6 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "false", "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 7 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 8 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 9 },  "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "true",  "up": "true",  "west": "false" } },
    { "bedrock_states": { "huge_mushroom_bits": 10 }, "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "false", "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 14 }, "java_id": "minecraft:mushroom_stem", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "true",  "west": "true"  } },
    { "bedrock_states": { "huge_mushroom_bits": 15 }, "java_id": "minecraft:mushroom_stem", "java_states": { "down": "true",  "east": "true",  "north": "true",  "south": "true",  "up": "true",  "west": "true"  } },
  ],

  "minecraft:waterlily": [
    { "bedrock_states": {}, "java_id": "minecraft:lily_pad", "java_states": {} },
  ],

  "minecraft:sea_pickle": [
    { "bedrock_states": { "cluster_count": 0, "dead_bit": 0 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "1", "waterlogged": "true"  } },
    { "bedrock_states": { "cluster_count": 1, "dead_bit": 0 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "2", "waterlogged": "true"  } },
    { "bedrock_states": { "cluster_count": 2, "dead_bit": 0 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "3", "waterlogged": "true"  } },
    { "bedrock_states": { "cluster_count": 3, "dead_bit": 0 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "4", "waterlogged": "true"  } },
    { "bedrock_states": { "cluster_count": 0, "dead_bit": 1 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "1", "waterlogged": "false" } },
    { "bedrock_states": { "cluster_count": 1, "dead_bit": 1 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "2", "waterlogged": "false" } },
    { "bedrock_states": { "cluster_count": 2, "dead_bit": 1 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "3", "waterlogged": "false" } },
    { "bedrock_states": { "cluster_count": 3, "dead_bit": 1 }, "java_id": "minecraft:sea_pickle", "java_states": { "pickles": "4", "waterlogged": "false" } },
  ],

  "minecraft:kelp": [
    { "bedrock_states": { "kelp_age": 0 },  "java_id": "minecraft:kelp", "java_states": { "age": "0"  } },
    { "bedrock_states": { "kelp_age": 1 },  "java_id": "minecraft:kelp", "java_states": { "age": "1"  } },
    { "bedrock_states": { "kelp_age": 2 },  "java_id": "minecraft:kelp", "java_states": { "age": "2"  } },
    { "bedrock_states": { "kelp_age": 3 },  "java_id": "minecraft:kelp", "java_states": { "age": "3"  } },
    { "bedrock_states": { "kelp_age": 4 },  "java_id": "minecraft:kelp", "java_states": { "age": "4"  } },
    { "bedrock_states": { "kelp_age": 5 },  "java_id": "minecraft:kelp", "java_states": { "age": "5"  } },
    { "bedrock_states": { "kelp_age": 6 },  "java_id": "minecraft:kelp", "java_states": { "age": "6"  } },
    { "bedrock_states": { "kelp_age": 7 },  "java_id": "minecraft:kelp", "java_states": { "age": "7"  } },
    { "bedrock_states": { "kelp_age": 8 },  "java_id": "minecraft:kelp", "java_states": { "age": "8"  } },
    { "bedrock_states": { "kelp_age": 9 },  "java_id": "minecraft:kelp", "java_states": { "age": "9"  } },
    { "bedrock_states": { "kelp_age": 10 }, "java_id": "minecraft:kelp", "java_states": { "age": "10" } },
    { "bedrock_states": { "kelp_age": 11 }, "java_id": "minecraft:kelp", "java_states": { "age": "11" } },
    { "bedrock_states": { "kelp_age": 12 }, "java_id": "minecraft:kelp", "java_states": { "age": "12" } },
    { "bedrock_states": { "kelp_age": 13 }, "java_id": "minecraft:kelp", "java_states": { "age": "13" } },
    { "bedrock_states": { "kelp_age": 14 }, "java_id": "minecraft:kelp", "java_states": { "age": "14" } },
    { "bedrock_states": { "kelp_age": 15 }, "java_id": "minecraft:kelp", "java_states": { "age": "15" } },
    { "bedrock_states": { "kelp_age": 16 }, "java_id": "minecraft:kelp", "java_states": { "age": "16" } },
    { "bedrock_states": { "kelp_age": 17 }, "java_id": "minecraft:kelp", "java_states": { "age": "17" } },
    { "bedrock_states": { "kelp_age": 18 }, "java_id": "minecraft:kelp", "java_states": { "age": "18" } },
    { "bedrock_states": { "kelp_age": 19 }, "java_id": "minecraft:kelp", "java_states": { "age": "19" } },
    { "bedrock_states": { "kelp_age": 20 }, "java_id": "minecraft:kelp", "java_states": { "age": "20" } },
    { "bedrock_states": { "kelp_age": 21 }, "java_id": "minecraft:kelp", "java_states": { "age": "21" } },
    { "bedrock_states": { "kelp_age": 22 }, "java_id": "minecraft:kelp", "java_states": { "age": "22" } },
    { "bedrock_states": { "kelp_age": 23 }, "java_id": "minecraft:kelp", "java_states": { "age": "23" } },
    { "bedrock_states": { "kelp_age": 24 }, "java_id": "minecraft:kelp", "java_states": { "age": "24" } },
    { "bedrock_states": { "kelp_age": 25 }, "java_id": "minecraft:kelp", "java_states": { "age": "25" } },
  ],

  "minecraft:reeds": [
    { "bedrock_states": { "age": 0 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "0"  } },
    { "bedrock_states": { "age": 1 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "1"  } },
    { "bedrock_states": { "age": 2 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "2"  } },
    { "bedrock_states": { "age": 3 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "3"  } },
    { "bedrock_states": { "age": 4 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "4"  } },
    { "bedrock_states": { "age": 5 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "5"  } },
    { "bedrock_states": { "age": 6 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "6"  } },
    { "bedrock_states": { "age": 7 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "7"  } },
    { "bedrock_states": { "age": 8 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "8"  } },
    { "bedrock_states": { "age": 9 },  "java_id": "minecraft:sugar_cane", "java_states": { "age": "9"  } },
    { "bedrock_states": { "age": 10 }, "java_id": "minecraft:sugar_cane", "java_states": { "age": "10" } },
    { "bedrock_states": { "age": 11 }, "java_id": "minecraft:sugar_cane", "java_states": { "age": "11" } },
    { "bedrock_states": { "age": 12 }, "java_id": "minecraft:sugar_cane", "java_states": { "age": "12" } },
    { "bedrock_states": { "age": 13 }, "java_id": "minecraft:sugar_cane", "java_states": { "age": "13" } },
    { "bedrock_states": { "age": 14 }, "java_id": "minecraft:sugar_cane", "java_states": { "age": "14" } },
    { "bedrock_states": { "age": 15 }, "java_id": "minecraft:sugar_cane", "java_states": { "age": "15" } },
  ],

  "minecraft:cactus": [
    { "bedrock_states": { "age": 0 },  "java_id": "minecraft:cactus", "java_states": { "age": "0"  } },
    { "bedrock_states": { "age": 1 },  "java_id": "minecraft:cactus", "java_states": { "age": "1"  } },
    { "bedrock_states": { "age": 2 },  "java_id": "minecraft:cactus", "java_states": { "age": "2"  } },
    { "bedrock_states": { "age": 3 },  "java_id": "minecraft:cactus", "java_states": { "age": "3"  } },
    { "bedrock_states": { "age": 4 },  "java_id": "minecraft:cactus", "java_states": { "age": "4"  } },
    { "bedrock_states": { "age": 5 },  "java_id": "minecraft:cactus", "java_states": { "age": "5"  } },
    { "bedrock_states": { "age": 6 },  "java_id": "minecraft:cactus", "java_states": { "age": "6"  } },
    { "bedrock_states": { "age": 7 },  "java_id": "minecraft:cactus", "java_states": { "age": "7"  } },
    { "bedrock_states": { "age": 8 },  "java_id": "minecraft:cactus", "java_states": { "age": "8"  } },
    { "bedrock_states": { "age": 9 },  "java_id": "minecraft:cactus", "java_states": { "age": "9"  } },
    { "bedrock_states": { "age": 10 }, "java_id": "minecraft:cactus", "java_states": { "age": "10" } },
    { "bedrock_states": { "age": 11 }, "java_id": "minecraft:cactus", "java_states": { "age": "11" } },
    { "bedrock_states": { "age": 12 }, "java_id": "minecraft:cactus", "java_states": { "age": "12" } },
    { "bedrock_states": { "age": 13 }, "java_id": "minecraft:cactus", "java_states": { "age": "13" } },
    { "bedrock_states": { "age": 14 }, "java_id": "minecraft:cactus", "java_states": { "age": "14" } },
    { "bedrock_states": { "age": 15 }, "java_id": "minecraft:cactus", "java_states": { "age": "15" } },
  ],

  "minecraft:vine": [
    { "bedrock_states": { "vine_direction_bits": 0 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "false", "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 1 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "false", "south": "true",  "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 2 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "false", "south": "false", "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 3 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "false", "south": "true",  "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 4 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "true",  "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 5 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "true",  "south": "true",  "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 6 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "true",  "south": "false", "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 7 },  "java_id": "minecraft:vine", "java_states": { "east": "false", "north": "true",  "south": "true",  "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 8 },  "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "false", "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 9 },  "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "false", "south": "true",  "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 10 }, "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "false", "south": "false", "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 11 }, "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "false", "south": "true",  "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 12 }, "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "true",  "south": "false", "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 13 }, "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "true",  "south": "true",  "up": "false", "west": "false" } },
    { "bedrock_states": { "vine_direction_bits": 14 }, "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "true",  "south": "false", "up": "false", "west": "true"  } },
    { "bedrock_states": { "vine_direction_bits": 15 }, "java_id": "minecraft:vine", "java_states": { "east": "true",  "north": "true",  "south": "true",  "up": "false", "west": "true"  } },
  ],

  "minecraft:spore_blossom": [
    { "bedrock_states": {}, "java_id": "minecraft:spore_blossom", "java_states": {} },
  ],

  "minecraft:big_dripleaf": [
    { "bedrock_states": { "direction": 0, "big_dripleaf_tilt": "none"         }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "south", "tilt": "none",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "big_dripleaf_tilt": "unstable"     }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "south", "tilt": "unstable", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "big_dripleaf_tilt": "partial_tilt" }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "south", "tilt": "partial",  "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "big_dripleaf_tilt": "full_tilt"    }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "south", "tilt": "full",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "big_dripleaf_tilt": "none"         }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "west",  "tilt": "none",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "big_dripleaf_tilt": "unstable"     }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "west",  "tilt": "unstable", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "big_dripleaf_tilt": "partial_tilt" }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "west",  "tilt": "partial",  "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "big_dripleaf_tilt": "full_tilt"    }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "west",  "tilt": "full",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "big_dripleaf_tilt": "none"         }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "north", "tilt": "none",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "big_dripleaf_tilt": "unstable"     }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "north", "tilt": "unstable", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "big_dripleaf_tilt": "partial_tilt" }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "north", "tilt": "partial",  "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "big_dripleaf_tilt": "full_tilt"    }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "north", "tilt": "full",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "big_dripleaf_tilt": "none"         }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "east",  "tilt": "none",     "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "big_dripleaf_tilt": "unstable"     }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "east",  "tilt": "unstable", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "big_dripleaf_tilt": "partial_tilt" }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "east",  "tilt": "partial",  "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "big_dripleaf_tilt": "full_tilt"    }, "java_id": "minecraft:big_dripleaf", "java_states": { "facing": "east",  "tilt": "full",     "waterlogged": "false" } },
  ],

  "minecraft:small_dripleaf_block": [
    { "bedrock_states": { "direction": 0, "upper_block_bit": 0 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "south", "half": "lower", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "upper_block_bit": 1 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "south", "half": "upper", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "upper_block_bit": 0 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "west",  "half": "lower", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "upper_block_bit": 1 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "west",  "half": "upper", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "upper_block_bit": 0 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "north", "half": "lower", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "upper_block_bit": 1 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "north", "half": "upper", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "upper_block_bit": 0 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "east",  "half": "lower", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "upper_block_bit": 1 }, "java_id": "minecraft:small_dripleaf", "java_states": { "facing": "east",  "half": "upper", "waterlogged": "false" } },
  ],

  // ============================================================
  // SECTION 2: 鉱石ブロック (Ore blocks, Metal blocks)
  // ============================================================

  "minecraft:raw_iron_block": [
    { "bedrock_states": {}, "java_id": "minecraft:raw_iron_block", "java_states": {} },
  ],

  "minecraft:raw_copper_block": [
    { "bedrock_states": {}, "java_id": "minecraft:raw_copper_block", "java_states": {} },
  ],

  "minecraft:raw_gold_block": [
    { "bedrock_states": {}, "java_id": "minecraft:raw_gold_block", "java_states": {} },
  ],

  "minecraft:iron_block": [
    { "bedrock_states": {}, "java_id": "minecraft:iron_block", "java_states": {} },
  ],

  "minecraft:gold_block": [
    { "bedrock_states": {}, "java_id": "minecraft:gold_block", "java_states": {} },
  ],

  "minecraft:diamond_block": [
    { "bedrock_states": {}, "java_id": "minecraft:diamond_block", "java_states": {} },
  ],

  "minecraft:emerald_block": [
    { "bedrock_states": {}, "java_id": "minecraft:emerald_block", "java_states": {} },
  ],

  "minecraft:lapis_block": [
    { "bedrock_states": {}, "java_id": "minecraft:lapis_block", "java_states": {} },
  ],

  "minecraft:coal_block": [
    { "bedrock_states": {}, "java_id": "minecraft:coal_block", "java_states": {} },
  ],

  "minecraft:amethyst_block": [
    { "bedrock_states": {}, "java_id": "minecraft:amethyst_block", "java_states": {} },
  ],

  "minecraft:budding_amethyst": [
    { "bedrock_states": {}, "java_id": "minecraft:budding_amethyst", "java_states": {} },
  ],

  "minecraft:iron_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:iron_ore", "java_states": {} },
  ],

  "minecraft:gold_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:gold_ore", "java_states": {} },
  ],

  "minecraft:diamond_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:diamond_ore", "java_states": {} },
  ],

  "minecraft:emerald_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:emerald_ore", "java_states": {} },
  ],

  "minecraft:lapis_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:lapis_ore", "java_states": {} },
  ],

  "minecraft:coal_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:coal_ore", "java_states": {} },
  ],

  "minecraft:copper_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:copper_ore", "java_states": {} },
  ],

  "minecraft:nether_gold_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:nether_gold_ore", "java_states": {} },
  ],

  "minecraft:redstone_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:redstone_ore", "java_states": { "lit": "false" } },
  ],

  "minecraft:lit_redstone_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:redstone_ore", "java_states": { "lit": "true" } },
  ],

  // ============================================================
  // SECTION 3: 雑多な建築ブロック (Misc building blocks)
  // ============================================================

  "minecraft:crafting_table": [
    { "bedrock_states": {}, "java_id": "minecraft:crafting_table", "java_states": {} },
  ],

  "minecraft:bookshelf": [
    { "bedrock_states": {}, "java_id": "minecraft:bookshelf", "java_states": {} },
  ],

  "minecraft:enchanting_table": [
    { "bedrock_states": {}, "java_id": "minecraft:enchanting_table", "java_states": {} },
  ],

  "minecraft:anvil": [
    { "bedrock_states": { "damage": "undamaged",        "direction": 0 }, "java_id": "minecraft:anvil",         "java_states": { "facing": "south" } },
    { "bedrock_states": { "damage": "undamaged",        "direction": 1 }, "java_id": "minecraft:anvil",         "java_states": { "facing": "west"  } },
    { "bedrock_states": { "damage": "undamaged",        "direction": 2 }, "java_id": "minecraft:anvil",         "java_states": { "facing": "north" } },
    { "bedrock_states": { "damage": "undamaged",        "direction": 3 }, "java_id": "minecraft:anvil",         "java_states": { "facing": "east"  } },
    { "bedrock_states": { "damage": "slightly_damaged", "direction": 0 }, "java_id": "minecraft:chipped_anvil", "java_states": { "facing": "south" } },
    { "bedrock_states": { "damage": "slightly_damaged", "direction": 1 }, "java_id": "minecraft:chipped_anvil", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "damage": "slightly_damaged", "direction": 2 }, "java_id": "minecraft:chipped_anvil", "java_states": { "facing": "north" } },
    { "bedrock_states": { "damage": "slightly_damaged", "direction": 3 }, "java_id": "minecraft:chipped_anvil", "java_states": { "facing": "east"  } },
    { "bedrock_states": { "damage": "very_damaged",     "direction": 0 }, "java_id": "minecraft:damaged_anvil", "java_states": { "facing": "south" } },
    { "bedrock_states": { "damage": "very_damaged",     "direction": 1 }, "java_id": "minecraft:damaged_anvil", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "damage": "very_damaged",     "direction": 2 }, "java_id": "minecraft:damaged_anvil", "java_states": { "facing": "north" } },
    { "bedrock_states": { "damage": "very_damaged",     "direction": 3 }, "java_id": "minecraft:damaged_anvil", "java_states": { "facing": "east"  } },
  ],

  "minecraft:stonecutter_block": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:stonecutter", "java_states": { "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:stonecutter", "java_states": { "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:stonecutter", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:stonecutter", "java_states": { "facing": "east"  } },
  ],

  "minecraft:lodestone": [
    { "bedrock_states": {}, "java_id": "minecraft:lodestone", "java_states": {} },
  ],

  "minecraft:respawn_anchor": [
    { "bedrock_states": { "respawn_anchor_charge": 0 }, "java_id": "minecraft:respawn_anchor", "java_states": { "charges": "0" } },
    { "bedrock_states": { "respawn_anchor_charge": 1 }, "java_id": "minecraft:respawn_anchor", "java_states": { "charges": "1" } },
    { "bedrock_states": { "respawn_anchor_charge": 2 }, "java_id": "minecraft:respawn_anchor", "java_states": { "charges": "2" } },
    { "bedrock_states": { "respawn_anchor_charge": 3 }, "java_id": "minecraft:respawn_anchor", "java_states": { "charges": "3" } },
    { "bedrock_states": { "respawn_anchor_charge": 4 }, "java_id": "minecraft:respawn_anchor", "java_states": { "charges": "4" } },
  ],

  "minecraft:beacon": [
    { "bedrock_states": {}, "java_id": "minecraft:beacon", "java_states": {} },
  ],

  "minecraft:sea_lantern": [
    { "bedrock_states": {}, "java_id": "minecraft:sea_lantern", "java_states": {} },
  ],

  "minecraft:carved_pumpkin": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:carved_pumpkin", "java_states": { "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:carved_pumpkin", "java_states": { "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:carved_pumpkin", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:carved_pumpkin", "java_states": { "facing": "east"  } },
  ],

  "minecraft:lit_pumpkin": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:jack_o_lantern", "java_states": { "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:jack_o_lantern", "java_states": { "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:jack_o_lantern", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:jack_o_lantern", "java_states": { "facing": "east"  } },
  ],

  "minecraft:pumpkin": [
    { "bedrock_states": {}, "java_id": "minecraft:pumpkin", "java_states": {} },
  ],

  "minecraft:melon_block": [
    { "bedrock_states": {}, "java_id": "minecraft:melon", "java_states": {} },
  ],

  "minecraft:hay_block": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:hay_block", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:hay_block", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:hay_block", "java_states": { "axis": "z" } },
  ],

  "minecraft:bone_block": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:bone_block", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:bone_block", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:bone_block", "java_states": { "axis": "z" } },
  ],

  "minecraft:sponge": [
    { "bedrock_states": { "sponge_type": "dry" }, "java_id": "minecraft:sponge",     "java_states": {} },
    { "bedrock_states": { "sponge_type": "wet" }, "java_id": "minecraft:wet_sponge", "java_states": {} },
  ],

  "minecraft:jukebox": [
    { "bedrock_states": {}, "java_id": "minecraft:jukebox", "java_states": { "has_record": "false" } },
  ],

  "minecraft:tnt": [
    { "bedrock_states": { "explode_bit": 0 }, "java_id": "minecraft:tnt", "java_states": { "unstable": "false" } },
    { "bedrock_states": { "explode_bit": 1 }, "java_id": "minecraft:tnt", "java_states": { "unstable": "true"  } },
  ],

  "minecraft:campfire": [
    { "bedrock_states": { "direction": 0, "extinguished": 0 }, "java_id": "minecraft:campfire", "java_states": { "facing": "south", "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "extinguished": 1 }, "java_id": "minecraft:campfire", "java_states": { "facing": "south", "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "extinguished": 0 }, "java_id": "minecraft:campfire", "java_states": { "facing": "west",  "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "extinguished": 1 }, "java_id": "minecraft:campfire", "java_states": { "facing": "west",  "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "extinguished": 0 }, "java_id": "minecraft:campfire", "java_states": { "facing": "north", "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "extinguished": 1 }, "java_id": "minecraft:campfire", "java_states": { "facing": "north", "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "extinguished": 0 }, "java_id": "minecraft:campfire", "java_states": { "facing": "east",  "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "extinguished": 1 }, "java_id": "minecraft:campfire", "java_states": { "facing": "east",  "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
  ],

  "minecraft:soul_campfire": [
    { "bedrock_states": { "direction": 0, "extinguished": 0 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "south", "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "extinguished": 1 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "south", "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "extinguished": 0 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "west",  "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "extinguished": 1 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "west",  "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "extinguished": 0 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "north", "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "extinguished": 1 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "north", "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "extinguished": 0 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "east",  "lit": "true",  "signal_fire": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "extinguished": 1 }, "java_id": "minecraft:soul_campfire", "java_states": { "facing": "east",  "lit": "false", "signal_fire": "false", "waterlogged": "false" } },
  ],

  "minecraft:cake": [
    { "bedrock_states": { "bite_counter": 0 }, "java_id": "minecraft:cake", "java_states": { "bites": "0" } },
    { "bedrock_states": { "bite_counter": 1 }, "java_id": "minecraft:cake", "java_states": { "bites": "1" } },
    { "bedrock_states": { "bite_counter": 2 }, "java_id": "minecraft:cake", "java_states": { "bites": "2" } },
    { "bedrock_states": { "bite_counter": 3 }, "java_id": "minecraft:cake", "java_states": { "bites": "3" } },
    { "bedrock_states": { "bite_counter": 4 }, "java_id": "minecraft:cake", "java_states": { "bites": "4" } },
    { "bedrock_states": { "bite_counter": 5 }, "java_id": "minecraft:cake", "java_states": { "bites": "5" } },
    { "bedrock_states": { "bite_counter": 6 }, "java_id": "minecraft:cake", "java_states": { "bites": "6" } },
  ],

  "minecraft:grindstone": [
    { "bedrock_states": { "attachment": "standing", "direction": 0 }, "java_id": "minecraft:grindstone", "java_states": { "face": "floor",   "facing": "south" } },
    { "bedrock_states": { "attachment": "standing", "direction": 1 }, "java_id": "minecraft:grindstone", "java_states": { "face": "floor",   "facing": "west"  } },
    { "bedrock_states": { "attachment": "standing", "direction": 2 }, "java_id": "minecraft:grindstone", "java_states": { "face": "floor",   "facing": "north" } },
    { "bedrock_states": { "attachment": "standing", "direction": 3 }, "java_id": "minecraft:grindstone", "java_states": { "face": "floor",   "facing": "east"  } },
    { "bedrock_states": { "attachment": "hanging",  "direction": 0 }, "java_id": "minecraft:grindstone", "java_states": { "face": "ceiling", "facing": "south" } },
    { "bedrock_states": { "attachment": "hanging",  "direction": 1 }, "java_id": "minecraft:grindstone", "java_states": { "face": "ceiling", "facing": "west"  } },
    { "bedrock_states": { "attachment": "hanging",  "direction": 2 }, "java_id": "minecraft:grindstone", "java_states": { "face": "ceiling", "facing": "north" } },
    { "bedrock_states": { "attachment": "hanging",  "direction": 3 }, "java_id": "minecraft:grindstone", "java_states": { "face": "ceiling", "facing": "east"  } },
    { "bedrock_states": { "attachment": "side",     "direction": 0 }, "java_id": "minecraft:grindstone", "java_states": { "face": "wall",    "facing": "south" } },
    { "bedrock_states": { "attachment": "side",     "direction": 1 }, "java_id": "minecraft:grindstone", "java_states": { "face": "wall",    "facing": "west"  } },
    { "bedrock_states": { "attachment": "side",     "direction": 2 }, "java_id": "minecraft:grindstone", "java_states": { "face": "wall",    "facing": "north" } },
    { "bedrock_states": { "attachment": "side",     "direction": 3 }, "java_id": "minecraft:grindstone", "java_states": { "face": "wall",    "facing": "east"  } },
  ],

  // ============================================================
  // SECTION 4: スカルク系 (Sculk family)
  // ============================================================

  "minecraft:sculk": [
    { "bedrock_states": {}, "java_id": "minecraft:sculk", "java_states": {} },
  ],

  "minecraft:sculk_catalyst": [
    { "bedrock_states": { "bloom": 0 }, "java_id": "minecraft:sculk_catalyst", "java_states": { "bloom": "false" } },
    { "bedrock_states": { "bloom": 1 }, "java_id": "minecraft:sculk_catalyst", "java_states": { "bloom": "true"  } },
  ],

  "minecraft:sculk_shrieker": [
    { "bedrock_states": { "active": 0, "can_summon": 0 }, "java_id": "minecraft:sculk_shrieker", "java_states": { "can_summon": "false", "shrieking": "false", "waterlogged": "false" } },
    { "bedrock_states": { "active": 0, "can_summon": 1 }, "java_id": "minecraft:sculk_shrieker", "java_states": { "can_summon": "true",  "shrieking": "false", "waterlogged": "false" } },
    { "bedrock_states": { "active": 1, "can_summon": 0 }, "java_id": "minecraft:sculk_shrieker", "java_states": { "can_summon": "false", "shrieking": "true",  "waterlogged": "false" } },
    { "bedrock_states": { "active": 1, "can_summon": 1 }, "java_id": "minecraft:sculk_shrieker", "java_states": { "can_summon": "true",  "shrieking": "true",  "waterlogged": "false" } },
  ],

  "minecraft:sculk_vein": [
    { "bedrock_states": { "multi_face_direction_bits": 0 },  "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 1 },  "java_id": "minecraft:sculk_vein", "java_states": { "down": "true",  "east": "false", "north": "false", "south": "false", "up": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 2 },  "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 4 },  "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 6 },  "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "true",  "south": "false", "up": "true",  "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 8 },  "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 10 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "false", "south": "true",  "up": "true",  "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 16 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "false", "waterlogged": "false", "west": "true"  } },
    { "bedrock_states": { "multi_face_direction_bits": 18 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "true",  "waterlogged": "false", "west": "true"  } },
    { "bedrock_states": { "multi_face_direction_bits": 32 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "false", "up": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 34 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "true",  "north": "false", "south": "false", "up": "true",  "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "multi_face_direction_bits": 60 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "false", "waterlogged": "false", "west": "true"  } },
    { "bedrock_states": { "multi_face_direction_bits": 62 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "false", "east": "true",  "north": "true",  "south": "true",  "up": "true",  "waterlogged": "false", "west": "true"  } },
    { "bedrock_states": { "multi_face_direction_bits": 63 }, "java_id": "minecraft:sculk_vein", "java_states": { "down": "true",  "east": "true",  "north": "true",  "south": "true",  "up": "true",  "waterlogged": "false", "west": "true"  } },
  ],

  // ============================================================
  // SECTION 5: バンブー・マングローブ特有ブロック
  // ============================================================

  "minecraft:bamboo": [
    { "bedrock_states": { "age_bit": 0, "bamboo_leaf_size": "no_leaves",    "bamboo_stalk_thickness": "thin"  }, "java_id": "minecraft:bamboo", "java_states": { "age": "0", "leaves": "none",  "stage": "0" } },
    { "bedrock_states": { "age_bit": 0, "bamboo_leaf_size": "no_leaves",    "bamboo_stalk_thickness": "thick" }, "java_id": "minecraft:bamboo", "java_states": { "age": "0", "leaves": "none",  "stage": "0" } },
    { "bedrock_states": { "age_bit": 0, "bamboo_leaf_size": "small_leaves", "bamboo_stalk_thickness": "thin"  }, "java_id": "minecraft:bamboo", "java_states": { "age": "0", "leaves": "small", "stage": "0" } },
    { "bedrock_states": { "age_bit": 0, "bamboo_leaf_size": "small_leaves", "bamboo_stalk_thickness": "thick" }, "java_id": "minecraft:bamboo", "java_states": { "age": "0", "leaves": "small", "stage": "0" } },
    { "bedrock_states": { "age_bit": 0, "bamboo_leaf_size": "large_leaves", "bamboo_stalk_thickness": "thin"  }, "java_id": "minecraft:bamboo", "java_states": { "age": "0", "leaves": "large", "stage": "0" } },
    { "bedrock_states": { "age_bit": 0, "bamboo_leaf_size": "large_leaves", "bamboo_stalk_thickness": "thick" }, "java_id": "minecraft:bamboo", "java_states": { "age": "0", "leaves": "large", "stage": "0" } },
    { "bedrock_states": { "age_bit": 1, "bamboo_leaf_size": "no_leaves",    "bamboo_stalk_thickness": "thin"  }, "java_id": "minecraft:bamboo", "java_states": { "age": "1", "leaves": "none",  "stage": "1" } },
    { "bedrock_states": { "age_bit": 1, "bamboo_leaf_size": "no_leaves",    "bamboo_stalk_thickness": "thick" }, "java_id": "minecraft:bamboo", "java_states": { "age": "1", "leaves": "none",  "stage": "1" } },
    { "bedrock_states": { "age_bit": 1, "bamboo_leaf_size": "small_leaves", "bamboo_stalk_thickness": "thin"  }, "java_id": "minecraft:bamboo", "java_states": { "age": "1", "leaves": "small", "stage": "1" } },
    { "bedrock_states": { "age_bit": 1, "bamboo_leaf_size": "small_leaves", "bamboo_stalk_thickness": "thick" }, "java_id": "minecraft:bamboo", "java_states": { "age": "1", "leaves": "small", "stage": "1" } },
    { "bedrock_states": { "age_bit": 1, "bamboo_leaf_size": "large_leaves", "bamboo_stalk_thickness": "thin"  }, "java_id": "minecraft:bamboo", "java_states": { "age": "1", "leaves": "large", "stage": "1" } },
    { "bedrock_states": { "age_bit": 1, "bamboo_leaf_size": "large_leaves", "bamboo_stalk_thickness": "thick" }, "java_id": "minecraft:bamboo", "java_states": { "age": "1", "leaves": "large", "stage": "1" } },
  ],

  "minecraft:bamboo_block": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:bamboo_block", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:bamboo_block", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:bamboo_block", "java_states": { "axis": "z" } },
  ],

  "minecraft:stripped_bamboo_block": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_bamboo_block", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_bamboo_block", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_bamboo_block", "java_states": { "axis": "z" } },
  ],

  "minecraft:bamboo_mosaic": [
    { "bedrock_states": {}, "java_id": "minecraft:bamboo_mosaic", "java_states": {} },
  ],

  "minecraft:mangrove_roots": [
    { "bedrock_states": {}, "java_id": "minecraft:mangrove_roots", "java_states": { "waterlogged": "false" } },
  ],

  "minecraft:muddy_mangrove_roots": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:muddy_mangrove_roots", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:muddy_mangrove_roots", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:muddy_mangrove_roots", "java_states": { "axis": "z" } },
  ],

  "minecraft:pearlescent_froglight": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:pearlescent_froglight", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:pearlescent_froglight", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:pearlescent_froglight", "java_states": { "axis": "z" } },
  ],

  "minecraft:verdant_froglight": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:verdant_froglight", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:verdant_froglight", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:verdant_froglight", "java_states": { "axis": "z" } },
  ],

  "minecraft:ochre_froglight": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:ochre_froglight", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:ochre_froglight", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:ochre_froglight", "java_states": { "axis": "z" } },
  ],

  "minecraft:mud": [
    { "bedrock_states": {}, "java_id": "minecraft:mud", "java_states": {} },
  ],

  "minecraft:amethyst_cluster": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:amethyst_cluster", "java_states": { "facing": "down",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:amethyst_cluster", "java_states": { "facing": "up",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:amethyst_cluster", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:amethyst_cluster", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:amethyst_cluster", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:amethyst_cluster", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:large_amethyst_bud": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:large_amethyst_bud", "java_states": { "facing": "down",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:large_amethyst_bud", "java_states": { "facing": "up",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:large_amethyst_bud", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:large_amethyst_bud", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:large_amethyst_bud", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:large_amethyst_bud", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:medium_amethyst_bud": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:medium_amethyst_bud", "java_states": { "facing": "down",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:medium_amethyst_bud", "java_states": { "facing": "up",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:medium_amethyst_bud", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:medium_amethyst_bud", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:medium_amethyst_bud", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:medium_amethyst_bud", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:small_amethyst_bud": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:small_amethyst_bud", "java_states": { "facing": "down",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:small_amethyst_bud", "java_states": { "facing": "up",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:small_amethyst_bud", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:small_amethyst_bud", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:small_amethyst_bud", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:small_amethyst_bud", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

};
