/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 4
 *
 * 収録カテゴリ:
 *   1. 羊毛 (Wool) × 16色
 *   2. コンクリート (Concrete) × 16色
 *   3. コンクリートパウダー (Concrete Powder) × 16色
 *   4. 染色テラコッタ (Stained Terracotta) × 16色 + 無染色
 *   5. カーペット (Carpet) × 16色
 *   6. ガラス (Stained Glass ブロック) × 16色 + 通常ガラス
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json
 */

export const BE_TO_JE_BLOCK_MAP_PART4 = {

  // ============================================================
  // SECTION 1: 羊毛 (Wool)
  // ============================================================
  "minecraft:wool": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_wool",      "java_states": {} },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_wool",     "java_states": {} },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_wool",    "java_states": {} },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_wool", "java_states": {} },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_wool",     "java_states": {} },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_wool",       "java_states": {} },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_wool",       "java_states": {} },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_wool",       "java_states": {} },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_wool", "java_states": {} },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_wool",       "java_states": {} },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_wool",     "java_states": {} },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_wool",       "java_states": {} },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_wool",      "java_states": {} },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_wool",      "java_states": {} },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_wool",        "java_states": {} },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_wool",      "java_states": {} },
  ],

  // ============================================================
  // SECTION 2: コンクリート (Concrete)
  // ============================================================
  "minecraft:concrete": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_concrete",      "java_states": {} },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_concrete",     "java_states": {} },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_concrete",    "java_states": {} },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_concrete", "java_states": {} },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_concrete",     "java_states": {} },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_concrete",       "java_states": {} },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_concrete",       "java_states": {} },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_concrete",       "java_states": {} },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_concrete", "java_states": {} },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_concrete",       "java_states": {} },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_concrete",     "java_states": {} },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_concrete",       "java_states": {} },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_concrete",      "java_states": {} },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_concrete",      "java_states": {} },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_concrete",        "java_states": {} },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_concrete",      "java_states": {} },
  ],

  // ============================================================
  // SECTION 3: コンクリートパウダー (Concrete Powder)
  // ============================================================
  "minecraft:concretePowder": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_concrete_powder",      "java_states": {} },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_concrete_powder",     "java_states": {} },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_concrete_powder",    "java_states": {} },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_concrete_powder", "java_states": {} },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_concrete_powder",     "java_states": {} },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_concrete_powder",       "java_states": {} },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_concrete_powder",       "java_states": {} },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_concrete_powder",       "java_states": {} },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_concrete_powder", "java_states": {} },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_concrete_powder",       "java_states": {} },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_concrete_powder",     "java_states": {} },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_concrete_powder",       "java_states": {} },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_concrete_powder",      "java_states": {} },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_concrete_powder",      "java_states": {} },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_concrete_powder",        "java_states": {} },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_concrete_powder",      "java_states": {} },
  ],

  // ============================================================
  // SECTION 4: 染色テラコッタ (Stained Terracotta) + 無染色テラコッタ
  // ============================================================
  "minecraft:stained_hardened_clay": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_terracotta",      "java_states": {} },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_terracotta",     "java_states": {} },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_terracotta",    "java_states": {} },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_terracotta", "java_states": {} },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_terracotta",     "java_states": {} },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_terracotta",       "java_states": {} },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_terracotta",       "java_states": {} },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_terracotta",       "java_states": {} },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_terracotta", "java_states": {} },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_terracotta",       "java_states": {} },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_terracotta",     "java_states": {} },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_terracotta",       "java_states": {} },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_terracotta",      "java_states": {} },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_terracotta",      "java_states": {} },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_terracotta",        "java_states": {} },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_terracotta",      "java_states": {} },
  ],

  "minecraft:hardened_clay": [
    { "bedrock_states": {}, "java_id": "minecraft:terracotta", "java_states": {} },
  ],

  // ============================================================
  // SECTION 5: カーペット (Carpet)
  // ============================================================
  "minecraft:carpet": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_carpet",      "java_states": {} },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_carpet",     "java_states": {} },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_carpet",    "java_states": {} },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_carpet", "java_states": {} },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_carpet",     "java_states": {} },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_carpet",       "java_states": {} },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_carpet",       "java_states": {} },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_carpet",       "java_states": {} },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_carpet", "java_states": {} },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_carpet",       "java_states": {} },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_carpet",     "java_states": {} },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_carpet",       "java_states": {} },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_carpet",      "java_states": {} },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_carpet",      "java_states": {} },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_carpet",        "java_states": {} },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_carpet",      "java_states": {} },
  ],

  // ============================================================
  // SECTION 6: 染色ガラスブロック (Stained Glass) + 通常ガラス
  // ============================================================
  "minecraft:stained_glass": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_stained_glass",      "java_states": {} },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_stained_glass",     "java_states": {} },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_stained_glass",    "java_states": {} },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_stained_glass", "java_states": {} },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_stained_glass",     "java_states": {} },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_stained_glass",       "java_states": {} },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_stained_glass",       "java_states": {} },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_stained_glass",       "java_states": {} },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_stained_glass", "java_states": {} },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_stained_glass",       "java_states": {} },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_stained_glass",     "java_states": {} },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_stained_glass",       "java_states": {} },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_stained_glass",      "java_states": {} },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_stained_glass",      "java_states": {} },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_stained_glass",        "java_states": {} },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_stained_glass",      "java_states": {} },
  ],

  "minecraft:glass": [
    { "bedrock_states": {}, "java_id": "minecraft:glass", "java_states": {} },
  ],

};
