/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 7
 *
 * 収録カテゴリ:
 *   1. 葉 (Leaves) — 全木種
 *   2. 苗木 (Saplings)
 *   3. 基本ブロック (砂・砂利・土・泥等)
 *   4. 農業 (Crops/Farmland)
 *   5. 木材関連 (Wood/Stripped wood/Stripped logs)
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json
 */

export const BE_TO_JE_BLOCK_MAP_PART7 = {

  // ============================================================
  // SECTION 1: 葉 (Leaves)
  // ============================================================

  // --- minecraft:leaves (old_leaf_type: oak/spruce/birch/jungle) ---
  "minecraft:leaves": [
    // oak, persistent_bit=0, update_bit=0
    { "bedrock_states": { "old_leaf_type": "oak", "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:oak_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // oak, persistent_bit=0, update_bit=1
    { "bedrock_states": { "old_leaf_type": "oak", "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:oak_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // oak, persistent_bit=1, update_bit=0
    { "bedrock_states": { "old_leaf_type": "oak", "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:oak_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    // oak, persistent_bit=1, update_bit=1
    { "bedrock_states": { "old_leaf_type": "oak", "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:oak_leaves", "java_states": { "persistent": "true", "distance": "1" } },

    // spruce, persistent_bit=0, update_bit=0
    { "bedrock_states": { "old_leaf_type": "spruce", "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:spruce_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // spruce, persistent_bit=0, update_bit=1
    { "bedrock_states": { "old_leaf_type": "spruce", "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:spruce_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // spruce, persistent_bit=1, update_bit=0
    { "bedrock_states": { "old_leaf_type": "spruce", "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:spruce_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    // spruce, persistent_bit=1, update_bit=1
    { "bedrock_states": { "old_leaf_type": "spruce", "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:spruce_leaves", "java_states": { "persistent": "true", "distance": "1" } },

    // birch, persistent_bit=0, update_bit=0
    { "bedrock_states": { "old_leaf_type": "birch", "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:birch_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // birch, persistent_bit=0, update_bit=1
    { "bedrock_states": { "old_leaf_type": "birch", "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:birch_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // birch, persistent_bit=1, update_bit=0
    { "bedrock_states": { "old_leaf_type": "birch", "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:birch_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    // birch, persistent_bit=1, update_bit=1
    { "bedrock_states": { "old_leaf_type": "birch", "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:birch_leaves", "java_states": { "persistent": "true", "distance": "1" } },

    // jungle, persistent_bit=0, update_bit=0
    { "bedrock_states": { "old_leaf_type": "jungle", "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:jungle_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // jungle, persistent_bit=0, update_bit=1
    { "bedrock_states": { "old_leaf_type": "jungle", "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:jungle_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // jungle, persistent_bit=1, update_bit=0
    { "bedrock_states": { "old_leaf_type": "jungle", "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:jungle_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    // jungle, persistent_bit=1, update_bit=1
    { "bedrock_states": { "old_leaf_type": "jungle", "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:jungle_leaves", "java_states": { "persistent": "true", "distance": "1" } },
  ],

  // --- minecraft:leaves2 (new_leaf_type: acacia/dark_oak) ---
  "minecraft:leaves2": [
    // acacia, persistent_bit=0, update_bit=0
    { "bedrock_states": { "new_leaf_type": "acacia", "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:acacia_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // acacia, persistent_bit=0, update_bit=1
    { "bedrock_states": { "new_leaf_type": "acacia", "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:acacia_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // acacia, persistent_bit=1, update_bit=0
    { "bedrock_states": { "new_leaf_type": "acacia", "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:acacia_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    // acacia, persistent_bit=1, update_bit=1
    { "bedrock_states": { "new_leaf_type": "acacia", "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:acacia_leaves", "java_states": { "persistent": "true", "distance": "1" } },

    // dark_oak, persistent_bit=0, update_bit=0
    { "bedrock_states": { "new_leaf_type": "dark_oak", "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:dark_oak_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // dark_oak, persistent_bit=0, update_bit=1
    { "bedrock_states": { "new_leaf_type": "dark_oak", "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:dark_oak_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    // dark_oak, persistent_bit=1, update_bit=0
    { "bedrock_states": { "new_leaf_type": "dark_oak", "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:dark_oak_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    // dark_oak, persistent_bit=1, update_bit=1
    { "bedrock_states": { "new_leaf_type": "dark_oak", "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:dark_oak_leaves", "java_states": { "persistent": "true", "distance": "1" } },
  ],

  // --- minecraft:mangrove_leaves ---
  "minecraft:mangrove_leaves": [
    { "bedrock_states": { "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:mangrove_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    { "bedrock_states": { "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:mangrove_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    { "bedrock_states": { "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:mangrove_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    { "bedrock_states": { "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:mangrove_leaves", "java_states": { "persistent": "true", "distance": "1" } },
  ],

  // --- minecraft:cherry_leaves ---
  "minecraft:cherry_leaves": [
    { "bedrock_states": { "persistent_bit": 0, "update_bit": 0 }, "java_id": "minecraft:cherry_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    { "bedrock_states": { "persistent_bit": 0, "update_bit": 1 }, "java_id": "minecraft:cherry_leaves", "java_states": { "persistent": "false", "distance": "7" } },
    { "bedrock_states": { "persistent_bit": 1, "update_bit": 0 }, "java_id": "minecraft:cherry_leaves", "java_states": { "persistent": "true", "distance": "1" } },
    { "bedrock_states": { "persistent_bit": 1, "update_bit": 1 }, "java_id": "minecraft:cherry_leaves", "java_states": { "persistent": "true", "distance": "1" } },
  ],

  // --- minecraft:azalea_leaves (no states) ---
  "minecraft:azalea_leaves": [
    { "bedrock_states": {}, "java_id": "minecraft:azalea_leaves", "java_states": {} },
  ],

  // --- minecraft:flowering_azalea_leaves (no states) ---
  "minecraft:flowering_azalea_leaves": [
    { "bedrock_states": {}, "java_id": "minecraft:flowering_azalea_leaves", "java_states": {} },
  ],

  // ============================================================
  // SECTION 2: 苗木 (Saplings)
  // ============================================================

  // --- minecraft:sapling (sapling_type × age_bit) ---
  "minecraft:sapling": [
    // oak, age_bit=0
    { "bedrock_states": { "sapling_type": "oak", "age_bit": 0 }, "java_id": "minecraft:oak_sapling", "java_states": { "stage": "0" } },
    // oak, age_bit=1
    { "bedrock_states": { "sapling_type": "oak", "age_bit": 1 }, "java_id": "minecraft:oak_sapling", "java_states": { "stage": "1" } },

    // spruce, age_bit=0
    { "bedrock_states": { "sapling_type": "spruce", "age_bit": 0 }, "java_id": "minecraft:spruce_sapling", "java_states": { "stage": "0" } },
    // spruce, age_bit=1
    { "bedrock_states": { "sapling_type": "spruce", "age_bit": 1 }, "java_id": "minecraft:spruce_sapling", "java_states": { "stage": "1" } },

    // birch, age_bit=0
    { "bedrock_states": { "sapling_type": "birch", "age_bit": 0 }, "java_id": "minecraft:birch_sapling", "java_states": { "stage": "0" } },
    // birch, age_bit=1
    { "bedrock_states": { "sapling_type": "birch", "age_bit": 1 }, "java_id": "minecraft:birch_sapling", "java_states": { "stage": "1" } },

    // jungle, age_bit=0
    { "bedrock_states": { "sapling_type": "jungle", "age_bit": 0 }, "java_id": "minecraft:jungle_sapling", "java_states": { "stage": "0" } },
    // jungle, age_bit=1
    { "bedrock_states": { "sapling_type": "jungle", "age_bit": 1 }, "java_id": "minecraft:jungle_sapling", "java_states": { "stage": "1" } },

    // acacia, age_bit=0
    { "bedrock_states": { "sapling_type": "acacia", "age_bit": 0 }, "java_id": "minecraft:acacia_sapling", "java_states": { "stage": "0" } },
    // acacia, age_bit=1
    { "bedrock_states": { "sapling_type": "acacia", "age_bit": 1 }, "java_id": "minecraft:acacia_sapling", "java_states": { "stage": "1" } },

    // dark_oak, age_bit=0
    { "bedrock_states": { "sapling_type": "dark_oak", "age_bit": 0 }, "java_id": "minecraft:dark_oak_sapling", "java_states": { "stage": "0" } },
    // dark_oak, age_bit=1
    { "bedrock_states": { "sapling_type": "dark_oak", "age_bit": 1 }, "java_id": "minecraft:dark_oak_sapling", "java_states": { "stage": "1" } },
  ],

  // --- minecraft:bamboo_sapling ---
  "minecraft:bamboo_sapling": [
    { "bedrock_states": { "age_bit": 0 }, "java_id": "minecraft:bamboo_sapling", "java_states": { "stage": "0" } },
    { "bedrock_states": { "age_bit": 1 }, "java_id": "minecraft:bamboo_sapling", "java_states": { "stage": "1" } },
  ],

  // --- minecraft:cherry_sapling ---
  "minecraft:cherry_sapling": [
    { "bedrock_states": { "age_bit": 0 }, "java_id": "minecraft:cherry_sapling", "java_states": { "stage": "0" } },
    { "bedrock_states": { "age_bit": 1 }, "java_id": "minecraft:cherry_sapling", "java_states": { "stage": "1" } },
  ],

  // --- minecraft:mangrove_propagule ---
  "minecraft:mangrove_propagule": [
    // hanging=0, propagule_stage=0
    { "bedrock_states": { "propagule_stage": 0, "hanging": 0 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "0", "hanging": "false" } },
    // hanging=0, propagule_stage=1
    { "bedrock_states": { "propagule_stage": 1, "hanging": 0 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "1", "hanging": "false" } },
    // hanging=0, propagule_stage=2
    { "bedrock_states": { "propagule_stage": 2, "hanging": 0 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "2", "hanging": "false" } },
    // hanging=0, propagule_stage=3
    { "bedrock_states": { "propagule_stage": 3, "hanging": 0 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "3", "hanging": "false" } },
    // hanging=0, propagule_stage=4
    { "bedrock_states": { "propagule_stage": 4, "hanging": 0 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "4", "hanging": "false" } },
    // hanging=1, propagule_stage=0
    { "bedrock_states": { "propagule_stage": 0, "hanging": 1 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "0", "hanging": "true" } },
    // hanging=1, propagule_stage=1
    { "bedrock_states": { "propagule_stage": 1, "hanging": 1 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "1", "hanging": "true" } },
    // hanging=1, propagule_stage=2
    { "bedrock_states": { "propagule_stage": 2, "hanging": 1 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "2", "hanging": "true" } },
    // hanging=1, propagule_stage=3
    { "bedrock_states": { "propagule_stage": 3, "hanging": 1 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "3", "hanging": "true" } },
    // hanging=1, propagule_stage=4
    { "bedrock_states": { "propagule_stage": 4, "hanging": 1 }, "java_id": "minecraft:mangrove_propagule", "java_states": { "stage": "4", "hanging": "true" } },
  ],

  // ============================================================
  // SECTION 3: 基本ブロック (Basic Blocks)
  // ============================================================

  // --- minecraft:sand ---
  "minecraft:sand": [
    { "bedrock_states": { "sand_type": "normal" }, "java_id": "minecraft:sand", "java_states": {} },
    { "bedrock_states": { "sand_type": "red" }, "java_id": "minecraft:red_sand", "java_states": {} },
  ],

  // --- minecraft:gravel ---
  "minecraft:gravel": [
    { "bedrock_states": {}, "java_id": "minecraft:gravel", "java_states": {} },
  ],

  // --- minecraft:clay ---
  "minecraft:clay": [
    { "bedrock_states": {}, "java_id": "minecraft:clay", "java_states": {} },
  ],

  // --- minecraft:dirt ---
  "minecraft:dirt": [
    { "bedrock_states": { "dirt_type": "normal" }, "java_id": "minecraft:dirt", "java_states": {} },
    { "bedrock_states": { "dirt_type": "coarse" }, "java_id": "minecraft:coarse_dirt", "java_states": {} },
  ],

  // --- minecraft:podzol ---
  "minecraft:podzol": [
    { "bedrock_states": {}, "java_id": "minecraft:podzol", "java_states": {} },
  ],

  // --- minecraft:mycelium ---
  "minecraft:mycelium": [
    { "bedrock_states": { "top_snow": 0 }, "java_id": "minecraft:mycelium", "java_states": { "snowy": "false" } },
    { "bedrock_states": { "top_snow": 1 }, "java_id": "minecraft:mycelium", "java_states": { "snowy": "true" } },
  ],

  // --- minecraft:grass (short grass in JE 1.20.3+) ---
  "minecraft:grass": [
    { "bedrock_states": {}, "java_id": "minecraft:short_grass", "java_states": {} },
  ],

  // --- minecraft:tallgrass ---
  "minecraft:tallgrass": [
    { "bedrock_states": { "tall_grass_type": "default" }, "java_id": "minecraft:short_grass", "java_states": {} },
    { "bedrock_states": { "tall_grass_type": "tall" }, "java_id": "minecraft:fern", "java_states": {} },
  ],

  // --- minecraft:double_plant ---
  "minecraft:double_plant": [
    // sunflower, upper_block_bit=0 (lower)
    { "bedrock_states": { "double_plant_type": "sunflower", "upper_block_bit": 0 }, "java_id": "minecraft:sunflower", "java_states": { "half": "lower" } },
    // sunflower, upper_block_bit=1 (upper)
    { "bedrock_states": { "double_plant_type": "sunflower", "upper_block_bit": 1 }, "java_id": "minecraft:sunflower", "java_states": { "half": "upper" } },

    // syringa (lilac), upper_block_bit=0
    { "bedrock_states": { "double_plant_type": "syringa", "upper_block_bit": 0 }, "java_id": "minecraft:lilac", "java_states": { "half": "lower" } },
    // syringa (lilac), upper_block_bit=1
    { "bedrock_states": { "double_plant_type": "syringa", "upper_block_bit": 1 }, "java_id": "minecraft:lilac", "java_states": { "half": "upper" } },

    // grass (tall_grass), upper_block_bit=0
    { "bedrock_states": { "double_plant_type": "grass", "upper_block_bit": 0 }, "java_id": "minecraft:tall_grass", "java_states": { "half": "lower" } },
    // grass (tall_grass), upper_block_bit=1
    { "bedrock_states": { "double_plant_type": "grass", "upper_block_bit": 1 }, "java_id": "minecraft:tall_grass", "java_states": { "half": "upper" } },

    // fern (large_fern), upper_block_bit=0
    { "bedrock_states": { "double_plant_type": "fern", "upper_block_bit": 0 }, "java_id": "minecraft:large_fern", "java_states": { "half": "lower" } },
    // fern (large_fern), upper_block_bit=1
    { "bedrock_states": { "double_plant_type": "fern", "upper_block_bit": 1 }, "java_id": "minecraft:large_fern", "java_states": { "half": "upper" } },

    // rose (rose_bush), upper_block_bit=0
    { "bedrock_states": { "double_plant_type": "rose", "upper_block_bit": 0 }, "java_id": "minecraft:rose_bush", "java_states": { "half": "lower" } },
    // rose (rose_bush), upper_block_bit=1
    { "bedrock_states": { "double_plant_type": "rose", "upper_block_bit": 1 }, "java_id": "minecraft:rose_bush", "java_states": { "half": "upper" } },

    // paeonia (peony), upper_block_bit=0
    { "bedrock_states": { "double_plant_type": "paeonia", "upper_block_bit": 0 }, "java_id": "minecraft:peony", "java_states": { "half": "lower" } },
    // paeonia (peony), upper_block_bit=1
    { "bedrock_states": { "double_plant_type": "paeonia", "upper_block_bit": 1 }, "java_id": "minecraft:peony", "java_states": { "half": "upper" } },
  ],

  // --- minecraft:snow_layer (height 0-7 → JE layers 1-8) ---
  "minecraft:snow_layer": [
    { "bedrock_states": { "height": 0 }, "java_id": "minecraft:snow", "java_states": { "layers": "1" } },
    { "bedrock_states": { "height": 1 }, "java_id": "minecraft:snow", "java_states": { "layers": "2" } },
    { "bedrock_states": { "height": 2 }, "java_id": "minecraft:snow", "java_states": { "layers": "3" } },
    { "bedrock_states": { "height": 3 }, "java_id": "minecraft:snow", "java_states": { "layers": "4" } },
    { "bedrock_states": { "height": 4 }, "java_id": "minecraft:snow", "java_states": { "layers": "5" } },
    { "bedrock_states": { "height": 5 }, "java_id": "minecraft:snow", "java_states": { "layers": "6" } },
    { "bedrock_states": { "height": 6 }, "java_id": "minecraft:snow", "java_states": { "layers": "7" } },
    { "bedrock_states": { "height": 7 }, "java_id": "minecraft:snow", "java_states": { "layers": "8" } },
  ],

  // --- minecraft:ice ---
  "minecraft:ice": [
    { "bedrock_states": {}, "java_id": "minecraft:ice", "java_states": {} },
  ],

  // --- minecraft:packed_ice ---
  "minecraft:packed_ice": [
    { "bedrock_states": {}, "java_id": "minecraft:packed_ice", "java_states": {} },
  ],

  // --- minecraft:blue_ice ---
  "minecraft:blue_ice": [
    { "bedrock_states": {}, "java_id": "minecraft:blue_ice", "java_states": {} },
  ],

  // --- minecraft:netherrack ---
  "minecraft:netherrack": [
    { "bedrock_states": {}, "java_id": "minecraft:netherrack", "java_states": {} },
  ],

  // --- minecraft:soul_sand ---
  "minecraft:soul_sand": [
    { "bedrock_states": {}, "java_id": "minecraft:soul_sand", "java_states": {} },
  ],

  // --- minecraft:soul_soil ---
  "minecraft:soul_soil": [
    { "bedrock_states": {}, "java_id": "minecraft:soul_soil", "java_states": {} },
  ],

  // --- minecraft:glowstone ---
  "minecraft:glowstone": [
    { "bedrock_states": {}, "java_id": "minecraft:glowstone", "java_states": {} },
  ],

  // --- minecraft:obsidian ---
  "minecraft:obsidian": [
    { "bedrock_states": {}, "java_id": "minecraft:obsidian", "java_states": {} },
  ],

  // --- minecraft:crying_obsidian ---
  "minecraft:crying_obsidian": [
    { "bedrock_states": {}, "java_id": "minecraft:crying_obsidian", "java_states": {} },
  ],

  // --- minecraft:bedrock ---
  "minecraft:bedrock": [
    { "bedrock_states": { "infiniburn_bit": 0 }, "java_id": "minecraft:bedrock", "java_states": {} },
    { "bedrock_states": { "infiniburn_bit": 1 }, "java_id": "minecraft:bedrock", "java_states": {} },
  ],

  // --- minecraft:tuff ---
  "minecraft:tuff": [
    { "bedrock_states": {}, "java_id": "minecraft:tuff", "java_states": {} },
  ],

  // --- minecraft:calcite ---
  "minecraft:calcite": [
    { "bedrock_states": {}, "java_id": "minecraft:calcite", "java_states": {} },
  ],

  // --- minecraft:smooth_basalt ---
  "minecraft:smooth_basalt": [
    { "bedrock_states": {}, "java_id": "minecraft:smooth_basalt", "java_states": {} },
  ],

  // --- minecraft:basalt (pillar_axis: x/y/z) ---
  "minecraft:basalt": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:basalt", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:basalt", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:basalt", "java_states": { "axis": "z" } },
  ],

  // --- minecraft:polished_basalt (pillar_axis: x/y/z) ---
  "minecraft:polished_basalt": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:polished_basalt", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:polished_basalt", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:polished_basalt", "java_states": { "axis": "z" } },
  ],

  // ============================================================
  // SECTION 4: 農業 (Crops & Farmland)
  // ============================================================

  // --- minecraft:farmland (moisturized_amount 0-7 → moisture 0-7) ---
  "minecraft:farmland": [
    { "bedrock_states": { "moisturized_amount": 0 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "0" } },
    { "bedrock_states": { "moisturized_amount": 1 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "1" } },
    { "bedrock_states": { "moisturized_amount": 2 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "2" } },
    { "bedrock_states": { "moisturized_amount": 3 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "3" } },
    { "bedrock_states": { "moisturized_amount": 4 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "4" } },
    { "bedrock_states": { "moisturized_amount": 5 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "5" } },
    { "bedrock_states": { "moisturized_amount": 6 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "6" } },
    { "bedrock_states": { "moisturized_amount": 7 }, "java_id": "minecraft:farmland", "java_states": { "moisture": "7" } },
  ],

  // --- minecraft:wheat (growth 0-7 → age 0-7) ---
  "minecraft:wheat": [
    { "bedrock_states": { "growth": 0 }, "java_id": "minecraft:wheat", "java_states": { "age": "0" } },
    { "bedrock_states": { "growth": 1 }, "java_id": "minecraft:wheat", "java_states": { "age": "1" } },
    { "bedrock_states": { "growth": 2 }, "java_id": "minecraft:wheat", "java_states": { "age": "2" } },
    { "bedrock_states": { "growth": 3 }, "java_id": "minecraft:wheat", "java_states": { "age": "3" } },
    { "bedrock_states": { "growth": 4 }, "java_id": "minecraft:wheat", "java_states": { "age": "4" } },
    { "bedrock_states": { "growth": 5 }, "java_id": "minecraft:wheat", "java_states": { "age": "5" } },
    { "bedrock_states": { "growth": 6 }, "java_id": "minecraft:wheat", "java_states": { "age": "6" } },
    { "bedrock_states": { "growth": 7 }, "java_id": "minecraft:wheat", "java_states": { "age": "7" } },
  ],

  // --- minecraft:carrots (growth 0-7 → age 0-7) ---
  "minecraft:carrots": [
    { "bedrock_states": { "growth": 0 }, "java_id": "minecraft:carrots", "java_states": { "age": "0" } },
    { "bedrock_states": { "growth": 1 }, "java_id": "minecraft:carrots", "java_states": { "age": "1" } },
    { "bedrock_states": { "growth": 2 }, "java_id": "minecraft:carrots", "java_states": { "age": "2" } },
    { "bedrock_states": { "growth": 3 }, "java_id": "minecraft:carrots", "java_states": { "age": "3" } },
    { "bedrock_states": { "growth": 4 }, "java_id": "minecraft:carrots", "java_states": { "age": "4" } },
    { "bedrock_states": { "growth": 5 }, "java_id": "minecraft:carrots", "java_states": { "age": "5" } },
    { "bedrock_states": { "growth": 6 }, "java_id": "minecraft:carrots", "java_states": { "age": "6" } },
    { "bedrock_states": { "growth": 7 }, "java_id": "minecraft:carrots", "java_states": { "age": "7" } },
  ],

  // --- minecraft:potatoes (growth 0-7 → age 0-7) ---
  "minecraft:potatoes": [
    { "bedrock_states": { "growth": 0 }, "java_id": "minecraft:potatoes", "java_states": { "age": "0" } },
    { "bedrock_states": { "growth": 1 }, "java_id": "minecraft:potatoes", "java_states": { "age": "1" } },
    { "bedrock_states": { "growth": 2 }, "java_id": "minecraft:potatoes", "java_states": { "age": "2" } },
    { "bedrock_states": { "growth": 3 }, "java_id": "minecraft:potatoes", "java_states": { "age": "3" } },
    { "bedrock_states": { "growth": 4 }, "java_id": "minecraft:potatoes", "java_states": { "age": "4" } },
    { "bedrock_states": { "growth": 5 }, "java_id": "minecraft:potatoes", "java_states": { "age": "5" } },
    { "bedrock_states": { "growth": 6 }, "java_id": "minecraft:potatoes", "java_states": { "age": "6" } },
    { "bedrock_states": { "growth": 7 }, "java_id": "minecraft:potatoes", "java_states": { "age": "7" } },
  ],

  // --- minecraft:beetroot (growth 0-3 → age 0-3) ---
  "minecraft:beetroot": [
    { "bedrock_states": { "growth": 0 }, "java_id": "minecraft:beetroots", "java_states": { "age": "0" } },
    { "bedrock_states": { "growth": 1 }, "java_id": "minecraft:beetroots", "java_states": { "age": "1" } },
    { "bedrock_states": { "growth": 2 }, "java_id": "minecraft:beetroots", "java_states": { "age": "2" } },
    { "bedrock_states": { "growth": 3 }, "java_id": "minecraft:beetroots", "java_states": { "age": "3" } },
  ],

  // --- minecraft:melon_stem (growth 0-7 → age 0-7) ---
  "minecraft:melon_stem": [
    { "bedrock_states": { "growth": 0 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "0" } },
    { "bedrock_states": { "growth": 1 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "1" } },
    { "bedrock_states": { "growth": 2 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "2" } },
    { "bedrock_states": { "growth": 3 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "3" } },
    { "bedrock_states": { "growth": 4 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "4" } },
    { "bedrock_states": { "growth": 5 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "5" } },
    { "bedrock_states": { "growth": 6 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "6" } },
    { "bedrock_states": { "growth": 7 }, "java_id": "minecraft:melon_stem", "java_states": { "age": "7" } },
  ],

  // --- minecraft:pumpkin_stem (growth 0-7 → age 0-7) ---
  "minecraft:pumpkin_stem": [
    { "bedrock_states": { "growth": 0 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "0" } },
    { "bedrock_states": { "growth": 1 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "1" } },
    { "bedrock_states": { "growth": 2 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "2" } },
    { "bedrock_states": { "growth": 3 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "3" } },
    { "bedrock_states": { "growth": 4 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "4" } },
    { "bedrock_states": { "growth": 5 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "5" } },
    { "bedrock_states": { "growth": 6 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "6" } },
    { "bedrock_states": { "growth": 7 }, "java_id": "minecraft:pumpkin_stem", "java_states": { "age": "7" } },
  ],

  // ============================================================
  // SECTION 5: 木材関連 (Wood / Stripped Wood / Stripped Logs)
  // ============================================================

  // --- minecraft:wood (wood_type × pillar_axis × stripped_bit) ---
  // 6 wood types × 3 axes × 2 stripped values = 36 entries
  "minecraft:wood": [
    // oak, stripped_bit=0
    { "bedrock_states": { "wood_type": "oak", "pillar_axis": "x", "stripped_bit": 0 }, "java_id": "minecraft:oak_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "oak", "pillar_axis": "y", "stripped_bit": 0 }, "java_id": "minecraft:oak_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "oak", "pillar_axis": "z", "stripped_bit": 0 }, "java_id": "minecraft:oak_wood", "java_states": { "axis": "z" } },
    // oak, stripped_bit=1
    { "bedrock_states": { "wood_type": "oak", "pillar_axis": "x", "stripped_bit": 1 }, "java_id": "minecraft:stripped_oak_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "oak", "pillar_axis": "y", "stripped_bit": 1 }, "java_id": "minecraft:stripped_oak_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "oak", "pillar_axis": "z", "stripped_bit": 1 }, "java_id": "minecraft:stripped_oak_wood", "java_states": { "axis": "z" } },

    // spruce, stripped_bit=0
    { "bedrock_states": { "wood_type": "spruce", "pillar_axis": "x", "stripped_bit": 0 }, "java_id": "minecraft:spruce_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "spruce", "pillar_axis": "y", "stripped_bit": 0 }, "java_id": "minecraft:spruce_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "spruce", "pillar_axis": "z", "stripped_bit": 0 }, "java_id": "minecraft:spruce_wood", "java_states": { "axis": "z" } },
    // spruce, stripped_bit=1
    { "bedrock_states": { "wood_type": "spruce", "pillar_axis": "x", "stripped_bit": 1 }, "java_id": "minecraft:stripped_spruce_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "spruce", "pillar_axis": "y", "stripped_bit": 1 }, "java_id": "minecraft:stripped_spruce_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "spruce", "pillar_axis": "z", "stripped_bit": 1 }, "java_id": "minecraft:stripped_spruce_wood", "java_states": { "axis": "z" } },

    // birch, stripped_bit=0
    { "bedrock_states": { "wood_type": "birch", "pillar_axis": "x", "stripped_bit": 0 }, "java_id": "minecraft:birch_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "birch", "pillar_axis": "y", "stripped_bit": 0 }, "java_id": "minecraft:birch_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "birch", "pillar_axis": "z", "stripped_bit": 0 }, "java_id": "minecraft:birch_wood", "java_states": { "axis": "z" } },
    // birch, stripped_bit=1
    { "bedrock_states": { "wood_type": "birch", "pillar_axis": "x", "stripped_bit": 1 }, "java_id": "minecraft:stripped_birch_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "birch", "pillar_axis": "y", "stripped_bit": 1 }, "java_id": "minecraft:stripped_birch_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "birch", "pillar_axis": "z", "stripped_bit": 1 }, "java_id": "minecraft:stripped_birch_wood", "java_states": { "axis": "z" } },

    // jungle, stripped_bit=0
    { "bedrock_states": { "wood_type": "jungle", "pillar_axis": "x", "stripped_bit": 0 }, "java_id": "minecraft:jungle_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "jungle", "pillar_axis": "y", "stripped_bit": 0 }, "java_id": "minecraft:jungle_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "jungle", "pillar_axis": "z", "stripped_bit": 0 }, "java_id": "minecraft:jungle_wood", "java_states": { "axis": "z" } },
    // jungle, stripped_bit=1
    { "bedrock_states": { "wood_type": "jungle", "pillar_axis": "x", "stripped_bit": 1 }, "java_id": "minecraft:stripped_jungle_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "jungle", "pillar_axis": "y", "stripped_bit": 1 }, "java_id": "minecraft:stripped_jungle_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "jungle", "pillar_axis": "z", "stripped_bit": 1 }, "java_id": "minecraft:stripped_jungle_wood", "java_states": { "axis": "z" } },

    // acacia, stripped_bit=0
    { "bedrock_states": { "wood_type": "acacia", "pillar_axis": "x", "stripped_bit": 0 }, "java_id": "minecraft:acacia_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "acacia", "pillar_axis": "y", "stripped_bit": 0 }, "java_id": "minecraft:acacia_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "acacia", "pillar_axis": "z", "stripped_bit": 0 }, "java_id": "minecraft:acacia_wood", "java_states": { "axis": "z" } },
    // acacia, stripped_bit=1
    { "bedrock_states": { "wood_type": "acacia", "pillar_axis": "x", "stripped_bit": 1 }, "java_id": "minecraft:stripped_acacia_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "acacia", "pillar_axis": "y", "stripped_bit": 1 }, "java_id": "minecraft:stripped_acacia_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "acacia", "pillar_axis": "z", "stripped_bit": 1 }, "java_id": "minecraft:stripped_acacia_wood", "java_states": { "axis": "z" } },

    // dark_oak, stripped_bit=0
    { "bedrock_states": { "wood_type": "dark_oak", "pillar_axis": "x", "stripped_bit": 0 }, "java_id": "minecraft:dark_oak_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "dark_oak", "pillar_axis": "y", "stripped_bit": 0 }, "java_id": "minecraft:dark_oak_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "dark_oak", "pillar_axis": "z", "stripped_bit": 0 }, "java_id": "minecraft:dark_oak_wood", "java_states": { "axis": "z" } },
    // dark_oak, stripped_bit=1
    { "bedrock_states": { "wood_type": "dark_oak", "pillar_axis": "x", "stripped_bit": 1 }, "java_id": "minecraft:stripped_dark_oak_wood", "java_states": { "axis": "x" } },
    { "bedrock_states": { "wood_type": "dark_oak", "pillar_axis": "y", "stripped_bit": 1 }, "java_id": "minecraft:stripped_dark_oak_wood", "java_states": { "axis": "y" } },
    { "bedrock_states": { "wood_type": "dark_oak", "pillar_axis": "z", "stripped_bit": 1 }, "java_id": "minecraft:stripped_dark_oak_wood", "java_states": { "axis": "z" } },
  ],

  // --- Stripped logs (individual BE IDs, pillar_axis: x/y/z) ---

  // minecraft:stripped_oak_log
  "minecraft:stripped_oak_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_oak_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_oak_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_oak_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_spruce_log
  "minecraft:stripped_spruce_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_spruce_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_spruce_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_spruce_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_birch_log
  "minecraft:stripped_birch_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_birch_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_birch_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_birch_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_jungle_log
  "minecraft:stripped_jungle_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_jungle_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_jungle_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_jungle_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_acacia_log
  "minecraft:stripped_acacia_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_acacia_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_acacia_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_acacia_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_dark_oak_log
  "minecraft:stripped_dark_oak_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_dark_oak_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_dark_oak_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_dark_oak_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_mangrove_log
  "minecraft:stripped_mangrove_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_mangrove_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_mangrove_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_mangrove_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_cherry_log
  "minecraft:stripped_cherry_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_cherry_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_cherry_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_cherry_log", "java_states": { "axis": "z" } },
  ],

  // --- Mangrove / Cherry / Crimson / Warped logs ---

  // minecraft:mangrove_log
  "minecraft:mangrove_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:mangrove_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:mangrove_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:mangrove_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:cherry_log
  "minecraft:cherry_log": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:cherry_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:cherry_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:cherry_log", "java_states": { "axis": "z" } },
  ],

  // minecraft:crimson_stem
  "minecraft:crimson_stem": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:crimson_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:crimson_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:crimson_stem", "java_states": { "axis": "z" } },
  ],

  // minecraft:warped_stem
  "minecraft:warped_stem": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:warped_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:warped_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:warped_stem", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_crimson_stem
  "minecraft:stripped_crimson_stem": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_crimson_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_crimson_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_crimson_stem", "java_states": { "axis": "z" } },
  ],

  // minecraft:stripped_warped_stem
  "minecraft:stripped_warped_stem": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_warped_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_warped_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_warped_stem", "java_states": { "axis": "z" } },
  ],

};
