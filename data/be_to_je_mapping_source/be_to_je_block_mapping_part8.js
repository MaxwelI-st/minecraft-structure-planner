/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 8
 *
 * 収録カテゴリ:
 *   1. レッドストーン素子 (Repeater, Comparator)
 *   2. ピストン系 (Piston, Sticky Piston, Observer)
 *   3. トーチ系 (Torch, Redstone Torch, Soul Torch, Lanterns)
 *   4. ドロッパー/ディスペンサー ← already in part6, skip
 *   5. デイライトセンサー
 *   6. トリップワイヤーフック
 *   7. レッドストーンワイヤー
 *   8. ターゲットブロック
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json
 */

export const BE_TO_JE_BLOCK_MAP_PART8 = {

  // ---------------------------------------------------------------------------
  // SECTION 1: REPEATER
  // ---------------------------------------------------------------------------

  "minecraft:unpowered_repeater": [
    { "bedrock_states": { "repeater_delay": 0, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "south", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 0, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "west", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 0, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "north", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 0, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "east", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "south", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "west", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "north", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "east", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "south", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "west", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "north", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "east", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "south", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "west", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "north", "locked": "false", "powered": "false" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "east", "locked": "false", "powered": "false" } },
  ],

  "minecraft:powered_repeater": [
    { "bedrock_states": { "repeater_delay": 0, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "south", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 0, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "west", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 0, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "north", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 0, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "1", "facing": "east", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "south", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "west", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "north", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 1, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "2", "facing": "east", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "south", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "west", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "north", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 2, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "3", "facing": "east", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 0 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "south", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 1 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "west", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 2 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "north", "locked": "false", "powered": "true" } },
    { "bedrock_states": { "repeater_delay": 3, "direction": 3 }, "java_id": "minecraft:repeater", "java_states": { "delay": "4", "facing": "east", "locked": "false", "powered": "true" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 2: COMPARATOR
  // ---------------------------------------------------------------------------

  "minecraft:unpowered_comparator": [
    { "bedrock_states": { "direction": 0, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "compare", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "subtract", "powered": "false" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "subtract", "powered": "false" } },
  ],

  "minecraft:powered_comparator": [
    { "bedrock_states": { "direction": 0, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 0, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 0, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 0, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "south", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 1, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "west", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 2, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "north", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": false, "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": false, "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "compare", "powered": "true" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": true,  "output_lit_bit": false }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "subtract", "powered": "true" } },
    { "bedrock_states": { "direction": 3, "output_subtract_bit": true,  "output_lit_bit": true  }, "java_id": "minecraft:comparator", "java_states": { "facing": "east", "mode": "subtract", "powered": "true" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 3: PISTONS
  // ---------------------------------------------------------------------------

  "minecraft:piston": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:piston", "java_states": { "extended": "false", "facing": "down" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:piston", "java_states": { "extended": "false", "facing": "up" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:piston", "java_states": { "extended": "false", "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:piston", "java_states": { "extended": "false", "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:piston", "java_states": { "extended": "false", "facing": "west" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:piston", "java_states": { "extended": "false", "facing": "east" } },
  ],

  "minecraft:sticky_piston": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:sticky_piston", "java_states": { "extended": "false", "facing": "down" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:sticky_piston", "java_states": { "extended": "false", "facing": "up" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:sticky_piston", "java_states": { "extended": "false", "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:sticky_piston", "java_states": { "extended": "false", "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:sticky_piston", "java_states": { "extended": "false", "facing": "west" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:sticky_piston", "java_states": { "extended": "false", "facing": "east" } },
  ],

  "minecraft:piston_arm_collision": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "down", "short": "false", "type": "normal" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "up", "short": "false", "type": "normal" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "north", "short": "false", "type": "normal" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "south", "short": "false", "type": "normal" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "west", "short": "false", "type": "normal" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "east", "short": "false", "type": "normal" } },
  ],

  "minecraft:sticky_piston_arm_collision": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "down", "short": "false", "type": "sticky" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "up", "short": "false", "type": "sticky" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "north", "short": "false", "type": "sticky" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "south", "short": "false", "type": "sticky" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "west", "short": "false", "type": "sticky" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:piston_head", "java_states": { "facing": "east", "short": "false", "type": "sticky" } },
  ],

  "minecraft:moving_block": [
    { "bedrock_states": {}, "java_id": "minecraft:moving_piston", "java_states": {} },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 4: OBSERVER
  // ---------------------------------------------------------------------------

  "minecraft:observer": [
    { "bedrock_states": { "facing_direction": 0, "powered_bit": false }, "java_id": "minecraft:observer", "java_states": { "facing": "down", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 0, "powered_bit": true  }, "java_id": "minecraft:observer", "java_states": { "facing": "down", "powered": "true" } },
    { "bedrock_states": { "facing_direction": 1, "powered_bit": false }, "java_id": "minecraft:observer", "java_states": { "facing": "up", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 1, "powered_bit": true  }, "java_id": "minecraft:observer", "java_states": { "facing": "up", "powered": "true" } },
    { "bedrock_states": { "facing_direction": 2, "powered_bit": false }, "java_id": "minecraft:observer", "java_states": { "facing": "north", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 2, "powered_bit": true  }, "java_id": "minecraft:observer", "java_states": { "facing": "north", "powered": "true" } },
    { "bedrock_states": { "facing_direction": 3, "powered_bit": false }, "java_id": "minecraft:observer", "java_states": { "facing": "south", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 3, "powered_bit": true  }, "java_id": "minecraft:observer", "java_states": { "facing": "south", "powered": "true" } },
    { "bedrock_states": { "facing_direction": 4, "powered_bit": false }, "java_id": "minecraft:observer", "java_states": { "facing": "west", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 4, "powered_bit": true  }, "java_id": "minecraft:observer", "java_states": { "facing": "west", "powered": "true" } },
    { "bedrock_states": { "facing_direction": 5, "powered_bit": false }, "java_id": "minecraft:observer", "java_states": { "facing": "east", "powered": "false" } },
    { "bedrock_states": { "facing_direction": 5, "powered_bit": true  }, "java_id": "minecraft:observer", "java_states": { "facing": "east", "powered": "true" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 5: TORCHES
  // ---------------------------------------------------------------------------

  "minecraft:torch": [
    { "bedrock_states": { "torch_facing_direction": "top"   }, "java_id": "minecraft:torch",       "java_states": {} },
    { "bedrock_states": { "torch_facing_direction": "east"  }, "java_id": "minecraft:wall_torch",  "java_states": { "facing": "east" } },
    { "bedrock_states": { "torch_facing_direction": "west"  }, "java_id": "minecraft:wall_torch",  "java_states": { "facing": "west" } },
    { "bedrock_states": { "torch_facing_direction": "north" }, "java_id": "minecraft:wall_torch",  "java_states": { "facing": "north" } },
    { "bedrock_states": { "torch_facing_direction": "south" }, "java_id": "minecraft:wall_torch",  "java_states": { "facing": "south" } },
  ],

  "minecraft:redstone_torch": [
    { "bedrock_states": { "torch_facing_direction": "top"   }, "java_id": "minecraft:redstone_torch",      "java_states": { "lit": "false" } },
    { "bedrock_states": { "torch_facing_direction": "east"  }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "east",  "lit": "false" } },
    { "bedrock_states": { "torch_facing_direction": "west"  }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "west",  "lit": "false" } },
    { "bedrock_states": { "torch_facing_direction": "north" }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "north", "lit": "false" } },
    { "bedrock_states": { "torch_facing_direction": "south" }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "south", "lit": "false" } },
  ],

  "minecraft:lit_redstone_torch": [
    { "bedrock_states": { "torch_facing_direction": "top"   }, "java_id": "minecraft:redstone_torch",      "java_states": { "lit": "true" } },
    { "bedrock_states": { "torch_facing_direction": "east"  }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "east",  "lit": "true" } },
    { "bedrock_states": { "torch_facing_direction": "west"  }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "west",  "lit": "true" } },
    { "bedrock_states": { "torch_facing_direction": "north" }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "north", "lit": "true" } },
    { "bedrock_states": { "torch_facing_direction": "south" }, "java_id": "minecraft:redstone_wall_torch", "java_states": { "facing": "south", "lit": "true" } },
  ],

  "minecraft:soul_torch": [
    { "bedrock_states": { "torch_facing_direction": "top"   }, "java_id": "minecraft:soul_torch",      "java_states": {} },
    { "bedrock_states": { "torch_facing_direction": "east"  }, "java_id": "minecraft:soul_wall_torch", "java_states": { "facing": "east" } },
    { "bedrock_states": { "torch_facing_direction": "west"  }, "java_id": "minecraft:soul_wall_torch", "java_states": { "facing": "west" } },
    { "bedrock_states": { "torch_facing_direction": "north" }, "java_id": "minecraft:soul_wall_torch", "java_states": { "facing": "north" } },
    { "bedrock_states": { "torch_facing_direction": "south" }, "java_id": "minecraft:soul_wall_torch", "java_states": { "facing": "south" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 6: LANTERNS
  // ---------------------------------------------------------------------------

  "minecraft:lantern": [
    { "bedrock_states": { "hanging": false }, "java_id": "minecraft:lantern", "java_states": { "hanging": "false", "waterlogged": "false" } },
    { "bedrock_states": { "hanging": true  }, "java_id": "minecraft:lantern", "java_states": { "hanging": "true",  "waterlogged": "false" } },
  ],

  "minecraft:soul_lantern": [
    { "bedrock_states": { "hanging": false }, "java_id": "minecraft:soul_lantern", "java_states": { "hanging": "false", "waterlogged": "false" } },
    { "bedrock_states": { "hanging": true  }, "java_id": "minecraft:soul_lantern", "java_states": { "hanging": "true",  "waterlogged": "false" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 7: DAYLIGHT SENSOR
  // ---------------------------------------------------------------------------

  "minecraft:daylight_detector": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "0"  } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "1"  } },
    { "bedrock_states": { "redstone_signal": 2  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "2"  } },
    { "bedrock_states": { "redstone_signal": 3  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "3"  } },
    { "bedrock_states": { "redstone_signal": 4  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "4"  } },
    { "bedrock_states": { "redstone_signal": 5  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "5"  } },
    { "bedrock_states": { "redstone_signal": 6  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "6"  } },
    { "bedrock_states": { "redstone_signal": 7  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "7"  } },
    { "bedrock_states": { "redstone_signal": 8  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "8"  } },
    { "bedrock_states": { "redstone_signal": 9  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "9"  } },
    { "bedrock_states": { "redstone_signal": 10 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "10" } },
    { "bedrock_states": { "redstone_signal": 11 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "11" } },
    { "bedrock_states": { "redstone_signal": 12 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "12" } },
    { "bedrock_states": { "redstone_signal": 13 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "13" } },
    { "bedrock_states": { "redstone_signal": 14 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "14" } },
    { "bedrock_states": { "redstone_signal": 15 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "false", "power": "15" } },
  ],

  "minecraft:daylight_detector_inverted": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "0"  } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "1"  } },
    { "bedrock_states": { "redstone_signal": 2  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "2"  } },
    { "bedrock_states": { "redstone_signal": 3  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "3"  } },
    { "bedrock_states": { "redstone_signal": 4  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "4"  } },
    { "bedrock_states": { "redstone_signal": 5  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "5"  } },
    { "bedrock_states": { "redstone_signal": 6  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "6"  } },
    { "bedrock_states": { "redstone_signal": 7  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "7"  } },
    { "bedrock_states": { "redstone_signal": 8  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "8"  } },
    { "bedrock_states": { "redstone_signal": 9  }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "9"  } },
    { "bedrock_states": { "redstone_signal": 10 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "10" } },
    { "bedrock_states": { "redstone_signal": 11 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "11" } },
    { "bedrock_states": { "redstone_signal": 12 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "12" } },
    { "bedrock_states": { "redstone_signal": 13 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "13" } },
    { "bedrock_states": { "redstone_signal": 14 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "14" } },
    { "bedrock_states": { "redstone_signal": 15 }, "java_id": "minecraft:daylight_detector", "java_states": { "inverted": "true", "power": "15" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 8: TRIPWIRE HOOK
  // ---------------------------------------------------------------------------

  "minecraft:tripwire_hook": [
    { "bedrock_states": { "direction": 0, "attached_bit": false, "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "south", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "attached_bit": false, "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "south", "powered": "true" } },
    { "bedrock_states": { "direction": 0, "attached_bit": true,  "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "south", "powered": "false" } },
    { "bedrock_states": { "direction": 0, "attached_bit": true,  "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "south", "powered": "true" } },
    { "bedrock_states": { "direction": 1, "attached_bit": false, "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "attached_bit": false, "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "west",  "powered": "true" } },
    { "bedrock_states": { "direction": 1, "attached_bit": true,  "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "west",  "powered": "false" } },
    { "bedrock_states": { "direction": 1, "attached_bit": true,  "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "west",  "powered": "true" } },
    { "bedrock_states": { "direction": 2, "attached_bit": false, "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "north", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "attached_bit": false, "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "north", "powered": "true" } },
    { "bedrock_states": { "direction": 2, "attached_bit": true,  "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "north", "powered": "false" } },
    { "bedrock_states": { "direction": 2, "attached_bit": true,  "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "north", "powered": "true" } },
    { "bedrock_states": { "direction": 3, "attached_bit": false, "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "attached_bit": false, "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "false", "facing": "east",  "powered": "true" } },
    { "bedrock_states": { "direction": 3, "attached_bit": true,  "powered_bit": false }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "east",  "powered": "false" } },
    { "bedrock_states": { "direction": 3, "attached_bit": true,  "powered_bit": true  }, "java_id": "minecraft:tripwire_hook", "java_states": { "attached": "true",  "facing": "east",  "powered": "true" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 9: REDSTONE WIRE
  // ---------------------------------------------------------------------------

  "minecraft:redstone_wire": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "0",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "1",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 2  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "2",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 3  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "3",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 4  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "4",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 5  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "5",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 6  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "6",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 7  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "7",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 8  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "8",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 9  }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "9",  "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 10 }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "10", "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 11 }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "11", "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 12 }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "12", "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 13 }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "13", "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 14 }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "14", "south": "none", "west": "none" } },
    { "bedrock_states": { "redstone_signal": 15 }, "java_id": "minecraft:redstone_wire", "java_states": { "east": "none", "north": "none", "power": "15", "south": "none", "west": "none" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 10: TARGET BLOCK
  // ---------------------------------------------------------------------------

  "minecraft:target": [
    { "bedrock_states": { "redstone_signal": 0  }, "java_id": "minecraft:target", "java_states": { "power": "0"  } },
    { "bedrock_states": { "redstone_signal": 1  }, "java_id": "minecraft:target", "java_states": { "power": "1"  } },
    { "bedrock_states": { "redstone_signal": 2  }, "java_id": "minecraft:target", "java_states": { "power": "2"  } },
    { "bedrock_states": { "redstone_signal": 3  }, "java_id": "minecraft:target", "java_states": { "power": "3"  } },
    { "bedrock_states": { "redstone_signal": 4  }, "java_id": "minecraft:target", "java_states": { "power": "4"  } },
    { "bedrock_states": { "redstone_signal": 5  }, "java_id": "minecraft:target", "java_states": { "power": "5"  } },
    { "bedrock_states": { "redstone_signal": 6  }, "java_id": "minecraft:target", "java_states": { "power": "6"  } },
    { "bedrock_states": { "redstone_signal": 7  }, "java_id": "minecraft:target", "java_states": { "power": "7"  } },
    { "bedrock_states": { "redstone_signal": 8  }, "java_id": "minecraft:target", "java_states": { "power": "8"  } },
    { "bedrock_states": { "redstone_signal": 9  }, "java_id": "minecraft:target", "java_states": { "power": "9"  } },
    { "bedrock_states": { "redstone_signal": 10 }, "java_id": "minecraft:target", "java_states": { "power": "10" } },
    { "bedrock_states": { "redstone_signal": 11 }, "java_id": "minecraft:target", "java_states": { "power": "11" } },
    { "bedrock_states": { "redstone_signal": 12 }, "java_id": "minecraft:target", "java_states": { "power": "12" } },
    { "bedrock_states": { "redstone_signal": 13 }, "java_id": "minecraft:target", "java_states": { "power": "13" } },
    { "bedrock_states": { "redstone_signal": 14 }, "java_id": "minecraft:target", "java_states": { "power": "14" } },
    { "bedrock_states": { "redstone_signal": 15 }, "java_id": "minecraft:target", "java_states": { "power": "15" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 11: NOTE BLOCK
  // ---------------------------------------------------------------------------

  "minecraft:noteblock": [
    { "bedrock_states": {}, "java_id": "minecraft:note_block", "java_states": { "instrument": "harp", "note": "0", "powered": "false" } },
  ],

  // ---------------------------------------------------------------------------
  // SECTION 12: MISC REDSTONE BLOCKS
  // ---------------------------------------------------------------------------

  "minecraft:redstone_block": [
    { "bedrock_states": {}, "java_id": "minecraft:redstone_block", "java_states": {} },
  ],

  "minecraft:tripwire": [
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": false, "powered_bit": false, "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "false", "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": false, "powered_bit": false, "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "false", "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": false, "powered_bit": true,  "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "false", "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": false, "powered_bit": true,  "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "false", "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": true,  "powered_bit": false, "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "true",  "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": true,  "powered_bit": false, "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "true",  "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": true,  "powered_bit": true,  "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "true",  "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": false, "disarmed_bit": true,  "powered_bit": true,  "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "false", "disarmed": "true",  "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": false, "powered_bit": false, "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "false", "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": false, "powered_bit": false, "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "false", "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": false, "powered_bit": true,  "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "false", "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": false, "powered_bit": true,  "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "false", "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": true,  "powered_bit": false, "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "true",  "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": true,  "powered_bit": false, "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "true",  "east": "false", "north": "false", "powered": "false", "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": true,  "powered_bit": true,  "suspended_bit": false }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "true",  "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
    { "bedrock_states": { "attached_bit": true,  "disarmed_bit": true,  "powered_bit": true,  "suspended_bit": true  }, "java_id": "minecraft:tripwire", "java_states": { "attached": "true",  "disarmed": "true",  "east": "false", "north": "false", "powered": "true",  "south": "false", "west": "false" } },
  ],

  "minecraft:end_rod": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:end_rod", "java_states": { "facing": "down" } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:end_rod", "java_states": { "facing": "up" } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:end_rod", "java_states": { "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:end_rod", "java_states": { "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:end_rod", "java_states": { "facing": "west" } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:end_rod", "java_states": { "facing": "east" } },
  ],

  "minecraft:lightning_rod": [
    { "bedrock_states": { "facing_direction": 0, "powered_bit": false }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "down",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 0, "powered_bit": true  }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "down",  "powered": "true",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 1, "powered_bit": false }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "up",    "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 1, "powered_bit": true  }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "up",    "powered": "true",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2, "powered_bit": false }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "north", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2, "powered_bit": true  }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "north", "powered": "true",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3, "powered_bit": false }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "south", "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3, "powered_bit": true  }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "south", "powered": "true",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4, "powered_bit": false }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "west",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4, "powered_bit": true  }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "west",  "powered": "true",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5, "powered_bit": false }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "east",  "powered": "false", "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5, "powered_bit": true  }, "java_id": "minecraft:lightning_rod", "java_states": { "facing": "east",  "powered": "true",  "waterlogged": "false" } },
  ],

  "minecraft:sculk_sensor": [
    { "bedrock_states": {}, "java_id": "minecraft:sculk_sensor", "java_states": { "power": "0", "sculk_sensor_phase": "inactive", "waterlogged": "false" } },
  ],

  "minecraft:calibrated_sculk_sensor": [
    { "bedrock_states": { "facing_direction": 2, "sculk_sensor_phase": "inactive"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "north", "power": "0", "sculk_sensor_phase": "inactive",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2, "sculk_sensor_phase": "active"    }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "north", "power": "0", "sculk_sensor_phase": "active",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 2, "sculk_sensor_phase": "cooldown"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "north", "power": "0", "sculk_sensor_phase": "cooldown",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3, "sculk_sensor_phase": "inactive"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "south", "power": "0", "sculk_sensor_phase": "inactive",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3, "sculk_sensor_phase": "active"    }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "south", "power": "0", "sculk_sensor_phase": "active",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 3, "sculk_sensor_phase": "cooldown"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "south", "power": "0", "sculk_sensor_phase": "cooldown",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4, "sculk_sensor_phase": "inactive"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "west",  "power": "0", "sculk_sensor_phase": "inactive",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4, "sculk_sensor_phase": "active"    }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "west",  "power": "0", "sculk_sensor_phase": "active",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 4, "sculk_sensor_phase": "cooldown"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "west",  "power": "0", "sculk_sensor_phase": "cooldown",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5, "sculk_sensor_phase": "inactive"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "east",  "power": "0", "sculk_sensor_phase": "inactive",  "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5, "sculk_sensor_phase": "active"    }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "east",  "power": "0", "sculk_sensor_phase": "active",    "waterlogged": "false" } },
    { "bedrock_states": { "facing_direction": 5, "sculk_sensor_phase": "cooldown"  }, "java_id": "minecraft:calibrated_sculk_sensor", "java_states": { "facing": "east",  "power": "0", "sculk_sensor_phase": "cooldown",  "waterlogged": "false" } },
  ],

};
