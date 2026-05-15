/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 2b
 *
 * 収録カテゴリ:
 *   3b. トラップドア続き (jungle_trapdoor 〜 iron_trapdoor)
 *   4.  フェンス系  (Fences)
 *   5.  壁系       (Walls)
 *   6.  板ガラス系  (Panes)
 *
 * BE trapdoor direction → JE facing:
 *   0 → north, 1 → south, 2 → west, 3 → east
 *
 * フェンス/壁/板ガラスの接続ステートはすべて初期値 false / none で出力。
 */

export const BE_TO_JE_BLOCK_MAP_PART2B = {

  // ============================================================
  // 3b. トラップドア続き
  // ============================================================

  // --- Jungle Trapdoor (続き) ---
  "minecraft:jungle_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:jungle_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Acacia Trapdoor ---
  "minecraft:acacia_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:acacia_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Dark Oak Trapdoor ---
  "minecraft:dark_oak_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:dark_oak_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Mangrove Trapdoor ---
  "minecraft:mangrove_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:mangrove_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Cherry Trapdoor ---
  "minecraft:cherry_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:cherry_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Bamboo Trapdoor ---
  "minecraft:bamboo_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:bamboo_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Crimson Trapdoor ---
  "minecraft:crimson_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:crimson_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Warped Trapdoor ---
  "minecraft:warped_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:warped_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // --- Iron Trapdoor ---
  "minecraft:iron_trapdoor": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "north", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "north", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "south", "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "south", "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "west",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "west",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": false }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "east",  "half": "bottom", "open": "true",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "false", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "upside_down_bit": true  }, "java_id": "minecraft:iron_trapdoor", "java_states": { "facing": "east",  "half": "top",    "open": "true",  "powered": "false", "waterlogged": "false" } }
  ],

  // ============================================================
  // 4. フェンス系 (Fences)
  //    BE: ステートなし (接続はワールドコンテキスト依存)
  //    JE: north/south/east/west=false (初期値), waterlogged=false
  // ============================================================

  "minecraft:fence": [
    { "bedrock_states": { "wood_type": "oak"      }, "java_id": "minecraft:oak_fence",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "wood_type": "spruce"   }, "java_id": "minecraft:spruce_fence",   "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "wood_type": "birch"    }, "java_id": "minecraft:birch_fence",    "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "wood_type": "jungle"   }, "java_id": "minecraft:jungle_fence",   "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "wood_type": "acacia"   }, "java_id": "minecraft:acacia_fence",   "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "wood_type": "dark_oak" }, "java_id": "minecraft:dark_oak_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  "minecraft:mangrove_fence": [
    { "bedrock_states": {}, "java_id": "minecraft:mangrove_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  "minecraft:cherry_fence": [
    { "bedrock_states": {}, "java_id": "minecraft:cherry_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  "minecraft:bamboo_fence": [
    { "bedrock_states": {}, "java_id": "minecraft:bamboo_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  "minecraft:crimson_fence": [
    { "bedrock_states": {}, "java_id": "minecraft:crimson_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  "minecraft:warped_fence": [
    { "bedrock_states": {}, "java_id": "minecraft:warped_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  "minecraft:nether_brick_fence": [
    { "bedrock_states": {}, "java_id": "minecraft:nether_brick_fence", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  // ============================================================
  // 5. 壁系 (Walls)
  //    BE: wall_block_type プロパティ (stone_brick等)
  //    JE: east/north/south/west=none, up=true, waterlogged=false
  //
  //    注: JE壁の接続ステートは none/low/tall の3値。
  //        初期値は none で出力。up=true はデフォルト非接続時の挙動。
  // ============================================================

  "minecraft:cobblestone_wall": [
    { "bedrock_states": { "wall_block_type": "cobblestone"        }, "java_id": "minecraft:cobblestone_wall",           "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "mossy_cobblestone"  }, "java_id": "minecraft:mossy_cobblestone_wall",      "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "granite"            }, "java_id": "minecraft:granite_wall",               "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "diorite"            }, "java_id": "minecraft:diorite_wall",               "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "andesite"           }, "java_id": "minecraft:andesite_wall",              "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "stone_brick"        }, "java_id": "minecraft:stone_brick_wall",           "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "mossy_stone_brick"  }, "java_id": "minecraft:mossy_stone_brick_wall",     "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "brick"              }, "java_id": "minecraft:brick_wall",                 "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "nether_brick"       }, "java_id": "minecraft:nether_brick_wall",          "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "end_brick"          }, "java_id": "minecraft:end_stone_brick_wall",       "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "prismarine"         }, "java_id": "minecraft:prismarine_wall",            "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "red_nether_brick"   }, "java_id": "minecraft:red_nether_brick_wall",      "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "red_sandstone"      }, "java_id": "minecraft:red_sandstone_wall",         "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } },
    { "bedrock_states": { "wall_block_type": "sandstone"          }, "java_id": "minecraft:sandstone_wall",             "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Blackstone Wall ---
  "minecraft:blackstone_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:blackstone_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Polished Blackstone Wall ---
  "minecraft:polished_blackstone_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_blackstone_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Polished Blackstone Brick Wall ---
  "minecraft:polished_blackstone_brick_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_blackstone_brick_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Cobbled Deepslate Wall ---
  "minecraft:cobbled_deepslate_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:cobbled_deepslate_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Polished Deepslate Wall ---
  "minecraft:polished_deepslate_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_deepslate_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Deepslate Brick Wall ---
  "minecraft:deepslate_brick_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_brick_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Deepslate Tile Wall ---
  "minecraft:deepslate_tile_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_tile_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // --- Mud Brick Wall ---
  "minecraft:mud_brick_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:mud_brick_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "true", "waterlogged": "false", "west": "none" } }
  ],

  // ============================================================
  // 6. 板ガラス系 (Panes / Bars)
  //    BE: ステートなし (接続はワールドコンテキスト依存)
  //    JE: east/north/south/west=false, waterlogged=false
  // ============================================================

  // --- Glass Pane ---
  "minecraft:glass_pane": [
    { "bedrock_states": {}, "java_id": "minecraft:glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  // --- Stained Glass Panes ---
  "minecraft:white_stained_glass_pane": [
    { "bedrock_states": { "color": "white"     }, "java_id": "minecraft:white_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "orange"    }, "java_id": "minecraft:orange_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "magenta"   }, "java_id": "minecraft:magenta_stained_glass_pane",    "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "light_blue"}, "java_id": "minecraft:light_blue_stained_glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "yellow"    }, "java_id": "minecraft:yellow_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "lime"      }, "java_id": "minecraft:lime_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "pink"      }, "java_id": "minecraft:pink_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "gray"      }, "java_id": "minecraft:gray_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "silver"    }, "java_id": "minecraft:light_gray_stained_glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "cyan"      }, "java_id": "minecraft:cyan_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "purple"    }, "java_id": "minecraft:purple_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "blue"      }, "java_id": "minecraft:blue_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "brown"     }, "java_id": "minecraft:brown_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "green"     }, "java_id": "minecraft:green_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "red"       }, "java_id": "minecraft:red_stained_glass_pane",        "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "black"     }, "java_id": "minecraft:black_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  // BE では stained_glass_pane が色を color プロパティで持つ別ID
  "minecraft:stained_glass_pane": [
    { "bedrock_states": { "color": "white"      }, "java_id": "minecraft:white_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "orange"     }, "java_id": "minecraft:orange_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "magenta"    }, "java_id": "minecraft:magenta_stained_glass_pane",    "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_stained_glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "yellow"     }, "java_id": "minecraft:yellow_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "lime"       }, "java_id": "minecraft:lime_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "pink"       }, "java_id": "minecraft:pink_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "gray"       }, "java_id": "minecraft:gray_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "silver"     }, "java_id": "minecraft:light_gray_stained_glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "cyan"       }, "java_id": "minecraft:cyan_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "purple"     }, "java_id": "minecraft:purple_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "blue"       }, "java_id": "minecraft:blue_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "brown"      }, "java_id": "minecraft:brown_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "green"      }, "java_id": "minecraft:green_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "red"        }, "java_id": "minecraft:red_stained_glass_pane",        "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } },
    { "bedrock_states": { "color": "black"      }, "java_id": "minecraft:black_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ],

  // --- Iron Bars ---
  "minecraft:iron_bars": [
    { "bedrock_states": {}, "java_id": "minecraft:iron_bars", "java_states": { "east": "false", "north": "false", "south": "false", "waterlogged": "false", "west": "false" } }
  ]

};
