/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 3
 *
 * 収録カテゴリ:
 *   1. フェンスゲート系 (Fence Gates)
 *      BE: direction(0-3), open_bit, in_wall_bit
 *      BE direction → JE facing: 0=south, 1=west, 2=north, 3=east
 *
 *   2. ボタン系 (Buttons)
 *      BE: facing_direction(0-5), button_pressed_bit
 *      BE facing_direction → JE face+facing:
 *        0=down(ceiling), 1=up(floor), 2=north, 3=south, 4=west, 5=east
 *
 *   3. レバー系 (Levers)
 *      BE: lever_direction(string), open_bit
 *      lever_direction values: down_east_west, east, west, south, north,
 *                              up_east_west, up_north_south, down_north_south
 *
 *   4. 圧力板系 (Pressure Plates)
 *      BE: redstone_signal (0 or 1→16 for weighted)
 *      JE: powered=false/true
 *
 *   5. レール系 (Rails)
 *      BE: rail_direction(0-9), rail_data_bit(powered rails)
 *      BE rail_direction → JE shape:
 *        0=north_south, 1=east_west, 2=ascending_east, 3=ascending_west,
 *        4=ascending_north, 5=ascending_south,
 *        6=south_east(curved), 7=south_west, 8=north_west, 9=north_east
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json, Amulet-Team/Amulet-Core translate/
 */

export const BE_TO_JE_BLOCK_MAP_PART3 = {

  // ============================================================
  // 1. フェンスゲート系 (Fence Gates)
  //    BE direction → JE facing: 0=south, 1=west, 2=north, 3=east
  //    in_wall_bit: false/true → JE in_wall: false/true
  //    open_bit: false/true → JE open: false/true
  //    powered(JE初期値false)
  // ============================================================

  "minecraft:fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:spruce_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:spruce_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:birch_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:birch_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:jungle_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:jungle_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:acacia_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:acacia_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:dark_oak_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:dark_oak_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:mangrove_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:mangrove_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:cherry_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:cherry_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:bamboo_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:bamboo_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:crimson_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:crimson_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  "minecraft:warped_fence_gate": [
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "south", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "south", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "west",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "west",  "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "north", "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "north", "in_wall": "true",  "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": false }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "east",  "in_wall": "false", "open": "true",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": false, "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "false", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "open_bit": true,  "in_wall_bit": true  }, "java_id": "minecraft:warped_fence_gate", "java_states": { "facing": "east",  "in_wall": "true",  "open": "true",  "powered": "false" } }
  ],

  // ============================================================
  // 2. ボタン系 (Buttons)
  //    BE: facing_direction(0-5), button_pressed_bit
  //    0=down→face:ceiling  1=up→face:floor
  //    2=north→face:wall facing:north  3=south→face:wall facing:south
  //    4=west→face:wall  facing:west   5=east→face:wall  facing:east
  // ============================================================

  "minecraft:wooden_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:oak_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:oak_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:oak_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:oak_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:oak_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:spruce_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:spruce_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:spruce_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:spruce_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:spruce_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:spruce_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:birch_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:birch_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:birch_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:birch_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:birch_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:birch_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:jungle_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:jungle_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:jungle_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:jungle_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:jungle_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:jungle_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:acacia_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:acacia_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:acacia_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:acacia_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:acacia_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:acacia_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:dark_oak_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:dark_oak_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:mangrove_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:mangrove_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:cherry_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:cherry_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:cherry_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:cherry_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:cherry_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:cherry_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:bamboo_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:bamboo_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:crimson_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:crimson_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:crimson_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:crimson_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:crimson_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:crimson_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:warped_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:warped_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:warped_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:warped_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:warped_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:warped_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:stone_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:stone_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:stone_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:stone_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:stone_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:stone_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  "minecraft:polished_blackstone_button": [
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": false }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "button_pressed_bit": true  }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": false }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "button_pressed_bit": true  }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": false }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "button_pressed_bit": true  }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": false }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "button_pressed_bit": true  }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": false }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "button_pressed_bit": true  }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": false }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "button_pressed_bit": true  }, "java_id": "minecraft:polished_blackstone_button", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  // ============================================================
  // 3. レバー系 (Levers)
  //    BE: lever_direction (string enum), open_bit
  //    lever_direction → JE face + facing:
  //      "down_east_west"   → face:ceiling, facing:west
  //      "east"             → face:wall,    facing:east
  //      "west"             → face:wall,    facing:west
  //      "south"            → face:wall,    facing:south
  //      "north"            → face:wall,    facing:north
  //      "up_east_west"     → face:floor,   facing:west
  //      "up_north_south"   → face:floor,   facing:north
  //      "down_north_south" → face:ceiling, facing:north
  // ============================================================

  "minecraft:lever": [
    { "bedrock_states": { "lever_direction": "down_east_west",   "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "ceiling", "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "lever_direction": "down_east_west",   "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "ceiling", "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "down_north_south", "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "ceiling", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "lever_direction": "down_north_south", "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "ceiling", "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "up_east_west",     "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "floor",   "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "lever_direction": "up_east_west",     "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "floor",   "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "up_north_south",   "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "floor",   "facing": "north", "powered": "false" } },
    { "bedrock_states": { "lever_direction": "up_north_south",   "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "floor",   "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "north",            "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "north", "powered": "false" } },
    { "bedrock_states": { "lever_direction": "north",            "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "north", "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "south",            "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "south", "powered": "false" } },
    { "bedrock_states": { "lever_direction": "south",            "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "south", "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "west",             "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "lever_direction": "west",             "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "west",  "powered": "true"  } },
    { "bedrock_states": { "lever_direction": "east",             "open_bit": false }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "lever_direction": "east",             "open_bit": true  }, "java_id": "minecraft:lever", "java_states": { "face": "wall",    "facing": "east",  "powered": "true"  } }
  ],

  // ============================================================
  // 4. 圧力板系 (Pressure Plates)
  //    BE: redstone_signal (0=off, 1+=on)
  //    JE: powered=false/true
  //    重み付き圧力板: redstone_signal 0〜15
  // ============================================================

  "minecraft:stone_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:stone_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:stone_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:wooden_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:oak_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:oak_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:spruce_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:spruce_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:spruce_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:birch_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:birch_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:birch_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:jungle_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:jungle_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:jungle_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:acacia_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:acacia_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:acacia_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:dark_oak_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:dark_oak_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:dark_oak_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:mangrove_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:mangrove_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:mangrove_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:cherry_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:cherry_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:cherry_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:bamboo_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:bamboo_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:bamboo_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:crimson_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:crimson_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:crimson_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:warped_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0 }, "java_id": "minecraft:warped_pressure_plate", "java_states": { "powered": "false" } },
    { "bedrock_states": { "redstone_signal": 1 }, "java_id": "minecraft:warped_pressure_plate", "java_states": { "powered": "true"  } }
  ],

  "minecraft:light_weighted_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "0"  } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "1"  } },
    { "bedrock_states": { "redstone_signal": 2  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "2"  } },
    { "bedrock_states": { "redstone_signal": 3  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "3"  } },
    { "bedrock_states": { "redstone_signal": 4  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "4"  } },
    { "bedrock_states": { "redstone_signal": 5  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "5"  } },
    { "bedrock_states": { "redstone_signal": 6  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "6"  } },
    { "bedrock_states": { "redstone_signal": 7  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "7"  } },
    { "bedrock_states": { "redstone_signal": 8  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "8"  } },
    { "bedrock_states": { "redstone_signal": 9  }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "9"  } },
    { "bedrock_states": { "redstone_signal": 10 }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "10" } },
    { "bedrock_states": { "redstone_signal": 11 }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "11" } },
    { "bedrock_states": { "redstone_signal": 12 }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "12" } },
    { "bedrock_states": { "redstone_signal": 13 }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "13" } },
    { "bedrock_states": { "redstone_signal": 14 }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "14" } },
    { "bedrock_states": { "redstone_signal": 15 }, "java_id": "minecraft:light_weighted_pressure_plate", "java_states": { "power": "15" } }
  ],

  "minecraft:heavy_weighted_pressure_plate": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "0"  } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "1"  } },
    { "bedrock_states": { "redstone_signal": 2  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "2"  } },
    { "bedrock_states": { "redstone_signal": 3  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "3"  } },
    { "bedrock_states": { "redstone_signal": 4  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "4"  } },
    { "bedrock_states": { "redstone_signal": 5  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "5"  } },
    { "bedrock_states": { "redstone_signal": 6  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "6"  } },
    { "bedrock_states": { "redstone_signal": 7  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "7"  } },
    { "bedrock_states": { "redstone_signal": 8  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "8"  } },
    { "bedrock_states": { "redstone_signal": 9  }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "9"  } },
    { "bedrock_states": { "redstone_signal": 10 }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "10" } },
    { "bedrock_states": { "redstone_signal": 11 }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "11" } },
    { "bedrock_states": { "redstone_signal": 12 }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "12" } },
    { "bedrock_states": { "redstone_signal": 13 }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "13" } },
    { "bedrock_states": { "redstone_signal": 14 }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "14" } },
    { "bedrock_states": { "redstone_signal": 15 }, "java_id": "minecraft:heavy_weighted_pressure_plate", "java_states": { "power": "15" } }
  ],

  // ============================================================
  // 5. レール系 (Rails)
  //    BE rail_direction → JE shape:
  //      0=north_south, 1=east_west,
  //      2=ascending_east, 3=ascending_west,
  //      4=ascending_north, 5=ascending_south,
  //      6=south_east, 7=south_west, 8=north_west, 9=north_east (通常レールのみ)
  //    powered rail: rail_data_bit=false/true → powered=false/true
  // ============================================================

  // --- 通常レール (curved shapes あり) ---
  "minecraft:rail": [
    { "bedrock_states": { "rail_direction": 0 }, "java_id": "minecraft:rail", "java_states": { "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1 }, "java_id": "minecraft:rail", "java_states": { "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2 }, "java_id": "minecraft:rail", "java_states": { "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3 }, "java_id": "minecraft:rail", "java_states": { "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4 }, "java_id": "minecraft:rail", "java_states": { "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5 }, "java_id": "minecraft:rail", "java_states": { "shape": "ascending_south","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 6 }, "java_id": "minecraft:rail", "java_states": { "shape": "south_east",     "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 7 }, "java_id": "minecraft:rail", "java_states": { "shape": "south_west",     "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 8 }, "java_id": "minecraft:rail", "java_states": { "shape": "north_west",     "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 9 }, "java_id": "minecraft:rail", "java_states": { "shape": "north_east",     "waterlogged": "false" } }
  ],

  // --- パワードレール ---
  "minecraft:golden_rail": [
    { "bedrock_states": { "rail_direction": 0, "rail_data_bit": false }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "false", "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 0, "rail_data_bit": true  }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "true",  "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1, "rail_data_bit": false }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "false", "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1, "rail_data_bit": true  }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "true",  "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2, "rail_data_bit": false }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "false", "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2, "rail_data_bit": true  }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "true",  "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3, "rail_data_bit": false }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "false", "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3, "rail_data_bit": true  }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "true",  "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4, "rail_data_bit": false }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "false", "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4, "rail_data_bit": true  }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "true",  "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5, "rail_data_bit": false }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "false", "shape": "ascending_south","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5, "rail_data_bit": true  }, "java_id": "minecraft:powered_rail", "java_states": { "powered": "true",  "shape": "ascending_south","waterlogged": "false" } }
  ],

  // --- ディテクターレール ---
  "minecraft:detector_rail": [
    { "bedrock_states": { "rail_direction": 0, "rail_data_bit": false }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "false", "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 0, "rail_data_bit": true  }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "true",  "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1, "rail_data_bit": false }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "false", "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1, "rail_data_bit": true  }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "true",  "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2, "rail_data_bit": false }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "false", "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2, "rail_data_bit": true  }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "true",  "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3, "rail_data_bit": false }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "false", "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3, "rail_data_bit": true  }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "true",  "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4, "rail_data_bit": false }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "false", "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4, "rail_data_bit": true  }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "true",  "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5, "rail_data_bit": false }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "false", "shape": "ascending_south","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5, "rail_data_bit": true  }, "java_id": "minecraft:detector_rail", "java_states": { "powered": "true",  "shape": "ascending_south","waterlogged": "false" } }
  ],

  // --- アクティベーターレール ---
  "minecraft:activator_rail": [
    { "bedrock_states": { "rail_direction": 0, "rail_data_bit": false }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "false", "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 0, "rail_data_bit": true  }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "true",  "shape": "north_south",    "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1, "rail_data_bit": false }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "false", "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 1, "rail_data_bit": true  }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "true",  "shape": "east_west",      "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2, "rail_data_bit": false }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "false", "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 2, "rail_data_bit": true  }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "true",  "shape": "ascending_east", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3, "rail_data_bit": false }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "false", "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 3, "rail_data_bit": true  }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "true",  "shape": "ascending_west", "waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4, "rail_data_bit": false }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "false", "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 4, "rail_data_bit": true  }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "true",  "shape": "ascending_north","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5, "rail_data_bit": false }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "false", "shape": "ascending_south","waterlogged": "false" } },
    { "bedrock_states": { "rail_direction": 5, "rail_data_bit": true  }, "java_id": "minecraft:activator_rail", "java_states": { "powered": "true",  "shape": "ascending_south","waterlogged": "false" } }
  ]

};
