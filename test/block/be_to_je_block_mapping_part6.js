/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 6
 *
 * 収録カテゴリ:
 *   1. 看板・立て看板 (Signs - standing + wall) × 全木種
 *   2. コンテナ系 (Containers): チェスト・ドロワー・かまど・ホッパー等
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json
 */

export const BE_TO_JE_BLOCK_MAP_PART6 = {

  // ============================================================
  // SECTION 1: 看板 (Signs)
  // ============================================================

  // --- Standing Signs ---

  "minecraft:standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:oak_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:oak_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:oak_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:oak_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:oak_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:oak_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:oak_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:spruce_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:spruce_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:birch_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:birch_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:birch_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:birch_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:birch_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:birch_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:birch_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:birch_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:jungle_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:jungle_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:acacia_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:acacia_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:darkoak_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:dark_oak_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:crimson_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:crimson_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:warped_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:warped_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:warped_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:warped_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:warped_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:warped_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:warped_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:warped_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:mangrove_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:mangrove_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:bamboo_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:bamboo_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  "minecraft:cherry_standing_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "0",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "1",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "2",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "3",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "4",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "5",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "6",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "7",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "8",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "9",  "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "10", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "11", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "12", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "13", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "14", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:cherry_sign", "java_states": { "rotation": "15", "waterlogged": "false" } },
  ],

  // --- Hanging Signs (Standing) ---

  "minecraft:oak_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:oak_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:spruce_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:spruce_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:birch_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:birch_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:jungle_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:jungle_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:acacia_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:acacia_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:dark_oak_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:dark_oak_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:crimson_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:crimson_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:warped_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:warped_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:mangrove_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:mangrove_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:bamboo_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:bamboo_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  "minecraft:cherry_hanging_sign": [
    { "bedrock_states": { "ground_sign_direction": 0 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "0",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 1 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "1",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 2 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "2",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 3 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "3",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 4 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "4",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 5 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "5",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 6 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "6",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 7 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "7",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 8 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "8",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 9 },  "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "9",  "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 10 }, "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "10", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 11 }, "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "11", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 12 }, "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "12", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 13 }, "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "13", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 14 }, "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "14", "attached": "false", "waterlogged": "false" } },
    { "bedrock_states": { "ground_sign_direction": 15 }, "java_id": "minecraft:cherry_hanging_sign", "java_states": { "rotation": "15", "attached": "false", "waterlogged": "false" } },
  ],

  // --- Wall Signs ---

  "minecraft:wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:oak_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:oak_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:oak_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:oak_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:spruce_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:spruce_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:spruce_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:spruce_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:spruce_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:birch_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:birch_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:birch_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:birch_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:birch_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:jungle_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:jungle_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:jungle_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:jungle_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:jungle_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:acacia_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:acacia_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:acacia_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:acacia_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:acacia_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:darkoak_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:dark_oak_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:dark_oak_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:dark_oak_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:dark_oak_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:crimson_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:crimson_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:crimson_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:crimson_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:crimson_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:warped_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:warped_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:warped_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:warped_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:warped_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:mangrove_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:mangrove_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:mangrove_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:mangrove_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:mangrove_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:bamboo_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:bamboo_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:bamboo_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:bamboo_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:bamboo_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  "minecraft:cherry_wall_sign": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:cherry_wall_sign", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:cherry_wall_sign", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:cherry_wall_sign", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:cherry_wall_sign", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  // ============================================================
  // SECTION 2: コンテナ (Containers)
  // ============================================================

  // --- Chest ---

  "minecraft:chest": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:chest", "java_states": { "facing": "north", "type": "single", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:chest", "java_states": { "facing": "south", "type": "single", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:chest", "java_states": { "facing": "west",  "type": "single", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:chest", "java_states": { "facing": "east",  "type": "single", "waterlogged": "false" } },
  ],

  // --- Trapped Chest ---

  "minecraft:trapped_chest": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:trapped_chest", "java_states": { "facing": "north", "type": "single", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:trapped_chest", "java_states": { "facing": "south", "type": "single", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:trapped_chest", "java_states": { "facing": "west",  "type": "single", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:trapped_chest", "java_states": { "facing": "east",  "type": "single", "waterlogged": "false" } },
  ],

  // --- Ender Chest ---

  "minecraft:ender_chest": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:ender_chest", "java_states": { "facing": "north", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:ender_chest", "java_states": { "facing": "south", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:ender_chest", "java_states": { "facing": "west",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:ender_chest", "java_states": { "facing": "east",  "waterlogged": "false" } },
  ],

  // --- Barrel ---
  // facing_direction: 0=down, 1=up, 2=north, 3=south, 4=west, 5=east
  // open_bit: 0=false, 1=true

  "minecraft:barrel": [
    { "bedrock_states": { "facing_direction": 0, "open_bit": 0 }, "java_id": "minecraft:barrel", "java_states": { "facing": "down",  "open": "false" } },
    { "bedrock_states": { "facing_direction": 0, "open_bit": 1 }, "java_id": "minecraft:barrel", "java_states": { "facing": "down",  "open": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "open_bit": 0 }, "java_id": "minecraft:barrel", "java_states": { "facing": "up",    "open": "false" } },
    { "bedrock_states": { "facing_direction": 1, "open_bit": 1 }, "java_id": "minecraft:barrel", "java_states": { "facing": "up",    "open": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "open_bit": 0 }, "java_id": "minecraft:barrel", "java_states": { "facing": "north", "open": "false" } },
    { "bedrock_states": { "facing_direction": 2, "open_bit": 1 }, "java_id": "minecraft:barrel", "java_states": { "facing": "north", "open": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "open_bit": 0 }, "java_id": "minecraft:barrel", "java_states": { "facing": "south", "open": "false" } },
    { "bedrock_states": { "facing_direction": 3, "open_bit": 1 }, "java_id": "minecraft:barrel", "java_states": { "facing": "south", "open": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "open_bit": 0 }, "java_id": "minecraft:barrel", "java_states": { "facing": "west",  "open": "false" } },
    { "bedrock_states": { "facing_direction": 4, "open_bit": 1 }, "java_id": "minecraft:barrel", "java_states": { "facing": "west",  "open": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "open_bit": 0 }, "java_id": "minecraft:barrel", "java_states": { "facing": "east",  "open": "false" } },
    { "bedrock_states": { "facing_direction": 5, "open_bit": 1 }, "java_id": "minecraft:barrel", "java_states": { "facing": "east",  "open": "true"  } },
  ],

  // --- Furnace (unlit) ---

  "minecraft:furnace": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:furnace", "java_states": { "facing": "north", "lit": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:furnace", "java_states": { "facing": "south", "lit": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:furnace", "java_states": { "facing": "west",  "lit": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:furnace", "java_states": { "facing": "east",  "lit": "false" } },
  ],

  // --- Furnace (lit) ---

  "minecraft:lit_furnace": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:furnace", "java_states": { "facing": "north", "lit": "true" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:furnace", "java_states": { "facing": "south", "lit": "true" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:furnace", "java_states": { "facing": "west",  "lit": "true" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:furnace", "java_states": { "facing": "east",  "lit": "true" } },
  ],

  // --- Blast Furnace (unlit) ---

  "minecraft:blast_furnace": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "north", "lit": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "south", "lit": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "west",  "lit": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "east",  "lit": "false" } },
  ],

  // --- Blast Furnace (lit) ---

  "minecraft:lit_blast_furnace": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "north", "lit": "true" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "south", "lit": "true" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "west",  "lit": "true" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:blast_furnace", "java_states": { "facing": "east",  "lit": "true" } },
  ],

  // --- Smoker (unlit) ---

  "minecraft:smoker": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:smoker", "java_states": { "facing": "north", "lit": "false" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:smoker", "java_states": { "facing": "south", "lit": "false" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:smoker", "java_states": { "facing": "west",  "lit": "false" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:smoker", "java_states": { "facing": "east",  "lit": "false" } },
  ],

  // --- Smoker (lit) ---

  "minecraft:lit_smoker": [
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:smoker", "java_states": { "facing": "north", "lit": "true" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:smoker", "java_states": { "facing": "south", "lit": "true" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:smoker", "java_states": { "facing": "west",  "lit": "true" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:smoker", "java_states": { "facing": "east",  "lit": "true" } },
  ],

  // --- Hopper ---
  // facing_direction: 0=down, 2=north, 3=south, 4=west, 5=east
  // toggle_bit: 0=enabled (powered=false), 1=disabled (powered=true)
  // JE enabled: toggle_bit 0 → "true", toggle_bit 1 → "false"

  "minecraft:hopper": [
    { "bedrock_states": { "facing_direction": 0, "toggle_bit": 0 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "true",  "facing": "down"  } },
    { "bedrock_states": { "facing_direction": 0, "toggle_bit": 1 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "false", "facing": "down"  } },
    { "bedrock_states": { "facing_direction": 2, "toggle_bit": 0 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "true",  "facing": "north" } },
    { "bedrock_states": { "facing_direction": 2, "toggle_bit": 1 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "false", "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3, "toggle_bit": 0 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "true",  "facing": "south" } },
    { "bedrock_states": { "facing_direction": 3, "toggle_bit": 1 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "false", "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4, "toggle_bit": 0 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "true",  "facing": "west"  } },
    { "bedrock_states": { "facing_direction": 4, "toggle_bit": 1 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "false", "facing": "west"  } },
    { "bedrock_states": { "facing_direction": 5, "toggle_bit": 0 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "true",  "facing": "east"  } },
    { "bedrock_states": { "facing_direction": 5, "toggle_bit": 1 }, "java_id": "minecraft:hopper", "java_states": { "enabled": "false", "facing": "east"  } },
  ],

  // --- Dropper ---
  // facing_direction: 0=down, 1=up, 2=north, 3=south, 4=west, 5=east
  // triggered_bit: 0=false, 1=true

  "minecraft:dropper": [
    { "bedrock_states": { "facing_direction": 0, "triggered_bit": 0 }, "java_id": "minecraft:dropper", "java_states": { "facing": "down",  "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "triggered_bit": 1 }, "java_id": "minecraft:dropper", "java_states": { "facing": "down",  "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "triggered_bit": 0 }, "java_id": "minecraft:dropper", "java_states": { "facing": "up",    "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "triggered_bit": 1 }, "java_id": "minecraft:dropper", "java_states": { "facing": "up",    "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "triggered_bit": 0 }, "java_id": "minecraft:dropper", "java_states": { "facing": "north", "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "triggered_bit": 1 }, "java_id": "minecraft:dropper", "java_states": { "facing": "north", "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "triggered_bit": 0 }, "java_id": "minecraft:dropper", "java_states": { "facing": "south", "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "triggered_bit": 1 }, "java_id": "minecraft:dropper", "java_states": { "facing": "south", "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "triggered_bit": 0 }, "java_id": "minecraft:dropper", "java_states": { "facing": "west",  "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "triggered_bit": 1 }, "java_id": "minecraft:dropper", "java_states": { "facing": "west",  "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "triggered_bit": 0 }, "java_id": "minecraft:dropper", "java_states": { "facing": "east",  "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "triggered_bit": 1 }, "java_id": "minecraft:dropper", "java_states": { "facing": "east",  "triggered": "true"  } },
  ],

  // --- Dispenser ---
  // facing_direction: 0=down, 1=up, 2=north, 3=south, 4=west, 5=east
  // triggered_bit: 0=false, 1=true

  "minecraft:dispenser": [
    { "bedrock_states": { "facing_direction": 0, "triggered_bit": 0 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "down",  "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "triggered_bit": 1 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "down",  "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "triggered_bit": 0 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "up",    "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "triggered_bit": 1 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "up",    "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "triggered_bit": 0 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "north", "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "triggered_bit": 1 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "north", "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "triggered_bit": 0 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "south", "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "triggered_bit": 1 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "south", "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "triggered_bit": 0 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "west",  "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "triggered_bit": 1 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "west",  "triggered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "triggered_bit": 0 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "east",  "triggered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "triggered_bit": 1 }, "java_id": "minecraft:dispenser", "java_states": { "facing": "east",  "triggered": "true"  } },
  ],

};
