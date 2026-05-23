/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング Part 9
 *
 * 収録カテゴリ:
 *   1. ネザー系ブロック (Nether Bricks, Quartz, Blackstone, Basalt variants, etc.)
 *   2. 深層岩系 (Deepslate variants — non-stair)
 *   3. 銅系ブロック (Copper — non-stair/door)
 *   4. エンド系 (End Stone, Purpur, Chorus)
 *   5. 石系追加 (Andesite, Diorite, Granite, Polished variants — block form)
 *
 * 参照: GeyserMC/Geyser mappings/blocks.json
 */

export const BE_TO_JE_BLOCK_MAP_PART9 = {

  // ============================================================
  // SECTION 1: NETHER BLOCKS
  // ============================================================

  "minecraft:nether_brick": [
    { "bedrock_states": {}, "java_id": "minecraft:nether_bricks", "java_states": {} },
  ],

  "minecraft:cracked_nether_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:cracked_nether_bricks", "java_states": {} },
  ],

  "minecraft:chiseled_nether_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:chiseled_nether_bricks", "java_states": {} },
  ],

  "minecraft:red_nether_brick": [
    { "bedrock_states": {}, "java_id": "minecraft:red_nether_bricks", "java_states": {} },
  ],

  "minecraft:quartz_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:nether_quartz_ore", "java_states": {} },
  ],

  "minecraft:nether_wart_block": [
    { "bedrock_states": {}, "java_id": "minecraft:nether_wart_block", "java_states": {} },
  ],

  "minecraft:warped_wart_block": [
    { "bedrock_states": {}, "java_id": "minecraft:warped_wart_block", "java_states": {} },
  ],

  "minecraft:ancient_debris": [
    { "bedrock_states": {}, "java_id": "minecraft:ancient_debris", "java_states": {} },
  ],

  "minecraft:netherite_block": [
    { "bedrock_states": {}, "java_id": "minecraft:netherite_block", "java_states": {} },
  ],

  "minecraft:shroomlight": [
    { "bedrock_states": {}, "java_id": "minecraft:shroomlight", "java_states": {} },
  ],

  "minecraft:nether_sprouts": [
    { "bedrock_states": {}, "java_id": "minecraft:nether_sprouts", "java_states": {} },
  ],

  "minecraft:warped_fungus": [
    { "bedrock_states": {}, "java_id": "minecraft:warped_fungus", "java_states": {} },
  ],

  "minecraft:crimson_fungus": [
    { "bedrock_states": {}, "java_id": "minecraft:crimson_fungus", "java_states": {} },
  ],

  "minecraft:crimson_nylium": [
    { "bedrock_states": {}, "java_id": "minecraft:crimson_nylium", "java_states": {} },
  ],

  "minecraft:warped_nylium": [
    { "bedrock_states": {}, "java_id": "minecraft:warped_nylium", "java_states": {} },
  ],

  "minecraft:crimson_roots": [
    { "bedrock_states": {}, "java_id": "minecraft:crimson_roots", "java_states": {} },
  ],

  "minecraft:warped_roots": [
    { "bedrock_states": {}, "java_id": "minecraft:warped_roots", "java_states": {} },
  ],

  "minecraft:crimson_planks": [
    { "bedrock_states": {}, "java_id": "minecraft:crimson_planks", "java_states": {} },
  ],

  "minecraft:warped_planks": [
    { "bedrock_states": {}, "java_id": "minecraft:warped_planks", "java_states": {} },
  ],

  // Quartz Block — chisel_type × pillar_axis combinations
  "minecraft:quartz_block": [
    { "bedrock_states": { "chisel_type": "default", "pillar_axis": "y" }, "java_id": "minecraft:quartz_block", "java_states": {} },
    { "bedrock_states": { "chisel_type": "chiseled", "pillar_axis": "y" }, "java_id": "minecraft:chiseled_quartz_block", "java_states": {} },
    { "bedrock_states": { "chisel_type": "lines", "pillar_axis": "x" }, "java_id": "minecraft:quartz_pillar", "java_states": { "axis": "x" } },
    { "bedrock_states": { "chisel_type": "lines", "pillar_axis": "y" }, "java_id": "minecraft:quartz_pillar", "java_states": { "axis": "y" } },
    { "bedrock_states": { "chisel_type": "lines", "pillar_axis": "z" }, "java_id": "minecraft:quartz_pillar", "java_states": { "axis": "z" } },
    { "bedrock_states": { "chisel_type": "smooth", "pillar_axis": "y" }, "java_id": "minecraft:smooth_quartz", "java_states": {} },
  ],

  // Blackstone variants
  "minecraft:blackstone": [
    { "bedrock_states": {}, "java_id": "minecraft:blackstone", "java_states": {} },
  ],

  "minecraft:gilded_blackstone": [
    { "bedrock_states": {}, "java_id": "minecraft:gilded_blackstone", "java_states": {} },
  ],

  "minecraft:polished_blackstone": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_blackstone", "java_states": {} },
  ],

  "minecraft:chiseled_polished_blackstone": [
    { "bedrock_states": {}, "java_id": "minecraft:chiseled_polished_blackstone", "java_states": {} },
  ],

  "minecraft:polished_blackstone_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_blackstone_bricks", "java_states": {} },
  ],

  "minecraft:cracked_polished_blackstone_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:cracked_polished_blackstone_bricks", "java_states": {} },
  ],

  // ============================================================
  // SECTION 2: DEEPSLATE BLOCKS
  // ============================================================

  // Deepslate pillar (has axis)
  "minecraft:deepslate": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:deepslate", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:deepslate", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:deepslate", "java_states": { "axis": "z" } },
  ],

  "minecraft:cobbled_deepslate": [
    { "bedrock_states": {}, "java_id": "minecraft:cobbled_deepslate", "java_states": {} },
  ],

  "minecraft:polished_deepslate": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_deepslate", "java_states": {} },
  ],

  "minecraft:deepslate_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_bricks", "java_states": {} },
  ],

  "minecraft:cracked_deepslate_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:cracked_deepslate_bricks", "java_states": {} },
  ],

  "minecraft:deepslate_tiles": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_tiles", "java_states": {} },
  ],

  "minecraft:cracked_deepslate_tiles": [
    { "bedrock_states": {}, "java_id": "minecraft:cracked_deepslate_tiles", "java_states": {} },
  ],

  "minecraft:chiseled_deepslate": [
    { "bedrock_states": {}, "java_id": "minecraft:chiseled_deepslate", "java_states": {} },
  ],

  "minecraft:reinforced_deepslate": [
    { "bedrock_states": {}, "java_id": "minecraft:reinforced_deepslate", "java_states": {} },
  ],

  // Deepslate ores
  "minecraft:deepslate_coal_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_coal_ore", "java_states": {} },
  ],

  "minecraft:deepslate_iron_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_iron_ore", "java_states": {} },
  ],

  "minecraft:deepslate_gold_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_gold_ore", "java_states": {} },
  ],

  "minecraft:deepslate_diamond_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_diamond_ore", "java_states": {} },
  ],

  "minecraft:deepslate_emerald_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_emerald_ore", "java_states": {} },
  ],

  "minecraft:deepslate_lapis_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_lapis_ore", "java_states": {} },
  ],

  "minecraft:deepslate_redstone_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_redstone_ore", "java_states": {} },
  ],

  "minecraft:deepslate_copper_ore": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_copper_ore", "java_states": {} },
  ],

  // Deepslate slabs (top_slot_bit false/true)
  "minecraft:cobbled_deepslate_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:cobbled_deepslate_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:cobbled_deepslate_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_cobbled_deepslate_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:cobbled_deepslate_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:polished_deepslate_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:polished_deepslate_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:polished_deepslate_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_polished_deepslate_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:polished_deepslate_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:deepslate_brick_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:deepslate_brick_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:deepslate_brick_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_deepslate_brick_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:deepslate_brick_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:deepslate_tile_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:deepslate_tile_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:deepslate_tile_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_deepslate_tile_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:deepslate_tile_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  // Deepslate walls (simplified — all connection states defaulted to none)
  "minecraft:cobbled_deepslate_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:cobbled_deepslate_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "false", "waterlogged": "false", "west": "none" } },
  ],

  "minecraft:polished_deepslate_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_deepslate_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "false", "waterlogged": "false", "west": "none" } },
  ],

  "minecraft:deepslate_brick_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_brick_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "false", "waterlogged": "false", "west": "none" } },
  ],

  "minecraft:deepslate_tile_wall": [
    { "bedrock_states": {}, "java_id": "minecraft:deepslate_tile_wall", "java_states": { "east": "none", "north": "none", "south": "none", "up": "false", "waterlogged": "false", "west": "none" } },
  ],

  // ============================================================
  // SECTION 3: COPPER BLOCKS
  // ============================================================

  // Copper block variants (oxidation levels × waxed)
  "minecraft:copper_block": [
    { "bedrock_states": {}, "java_id": "minecraft:copper_block", "java_states": {} },
  ],

  "minecraft:exposed_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:exposed_copper", "java_states": {} },
  ],

  "minecraft:weathered_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:weathered_copper", "java_states": {} },
  ],

  "minecraft:oxidized_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:oxidized_copper", "java_states": {} },
  ],

  "minecraft:waxed_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_copper_block", "java_states": {} },
  ],

  "minecraft:waxed_exposed_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_exposed_copper", "java_states": {} },
  ],

  "minecraft:waxed_weathered_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_weathered_copper", "java_states": {} },
  ],

  "minecraft:waxed_oxidized_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_oxidized_copper", "java_states": {} },
  ],

  // Cut copper blocks
  "minecraft:cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:cut_copper", "java_states": {} },
  ],

  "minecraft:exposed_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:exposed_cut_copper", "java_states": {} },
  ],

  "minecraft:weathered_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:weathered_cut_copper", "java_states": {} },
  ],

  "minecraft:oxidized_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:oxidized_cut_copper", "java_states": {} },
  ],

  "minecraft:waxed_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_cut_copper", "java_states": {} },
  ],

  "minecraft:waxed_exposed_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_exposed_cut_copper", "java_states": {} },
  ],

  "minecraft:waxed_weathered_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_weathered_cut_copper", "java_states": {} },
  ],

  "minecraft:waxed_oxidized_cut_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_oxidized_cut_copper", "java_states": {} },
  ],

  // Cut copper slabs (top_slot_bit false/true + double variants)
  "minecraft:cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:exposed_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:exposed_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:exposed_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_exposed_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:exposed_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:weathered_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:weathered_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:weathered_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_weathered_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:weathered_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:oxidized_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:oxidized_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:oxidized_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_oxidized_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:oxidized_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:waxed_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:waxed_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_waxed_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:waxed_exposed_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_exposed_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:waxed_exposed_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_waxed_exposed_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_exposed_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:waxed_weathered_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_weathered_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:waxed_weathered_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_waxed_weathered_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_weathered_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  "minecraft:waxed_oxidized_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_oxidized_cut_copper_slab", "java_states": { "type": "bottom", "waterlogged": "false" } },
    { "bedrock_states": { "top_slot_bit": true }, "java_id": "minecraft:waxed_oxidized_cut_copper_slab", "java_states": { "type": "top", "waterlogged": "false" } },
  ],

  "minecraft:double_waxed_oxidized_cut_copper_slab": [
    { "bedrock_states": { "top_slot_bit": false }, "java_id": "minecraft:waxed_oxidized_cut_copper_slab", "java_states": { "type": "double", "waterlogged": "false" } },
  ],

  // Chiseled copper variants
  "minecraft:chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:chiseled_copper", "java_states": {} },
  ],

  "minecraft:exposed_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:exposed_chiseled_copper", "java_states": {} },
  ],

  "minecraft:weathered_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:weathered_chiseled_copper", "java_states": {} },
  ],

  "minecraft:oxidized_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:oxidized_chiseled_copper", "java_states": {} },
  ],

  "minecraft:waxed_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_chiseled_copper", "java_states": {} },
  ],

  "minecraft:waxed_exposed_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_exposed_chiseled_copper", "java_states": {} },
  ],

  "minecraft:waxed_weathered_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_weathered_chiseled_copper", "java_states": {} },
  ],

  "minecraft:waxed_oxidized_chiseled_copper": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_oxidized_chiseled_copper", "java_states": {} },
  ],

  // Copper grate variants
  "minecraft:copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:copper_grate", "java_states": {} },
  ],

  "minecraft:exposed_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:exposed_copper_grate", "java_states": {} },
  ],

  "minecraft:weathered_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:weathered_copper_grate", "java_states": {} },
  ],

  "minecraft:oxidized_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:oxidized_copper_grate", "java_states": {} },
  ],

  "minecraft:waxed_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_copper_grate", "java_states": {} },
  ],

  "minecraft:waxed_exposed_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_exposed_copper_grate", "java_states": {} },
  ],

  "minecraft:waxed_weathered_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_weathered_copper_grate", "java_states": {} },
  ],

  "minecraft:waxed_oxidized_copper_grate": [
    { "bedrock_states": {}, "java_id": "minecraft:waxed_oxidized_copper_grate", "java_states": {} },
  ],

  // Copper bulb variants (lit × powered_bit — 4 combos per oxidation level)
  "minecraft:copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:exposed_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:exposed_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:exposed_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:exposed_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:exposed_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:weathered_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:weathered_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:weathered_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:weathered_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:weathered_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:oxidized_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:oxidized_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:oxidized_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:oxidized_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:oxidized_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:waxed_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:waxed_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:waxed_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:waxed_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:waxed_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:waxed_exposed_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:waxed_exposed_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:waxed_exposed_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:waxed_exposed_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:waxed_exposed_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:waxed_weathered_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:waxed_weathered_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:waxed_weathered_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:waxed_weathered_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:waxed_weathered_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  "minecraft:waxed_oxidized_copper_bulb": [
    { "bedrock_states": { "lit": false, "powered_bit": false }, "java_id": "minecraft:waxed_oxidized_copper_bulb", "java_states": { "lit": "false", "powered": "false" } },
    { "bedrock_states": { "lit": false, "powered_bit": true }, "java_id": "minecraft:waxed_oxidized_copper_bulb", "java_states": { "lit": "false", "powered": "true" } },
    { "bedrock_states": { "lit": true, "powered_bit": false }, "java_id": "minecraft:waxed_oxidized_copper_bulb", "java_states": { "lit": "true", "powered": "false" } },
    { "bedrock_states": { "lit": true, "powered_bit": true }, "java_id": "minecraft:waxed_oxidized_copper_bulb", "java_states": { "lit": "true", "powered": "true" } },
  ],

  // ============================================================
  // SECTION 4: END BLOCKS
  // ============================================================

  "minecraft:end_stone": [
    { "bedrock_states": {}, "java_id": "minecraft:end_stone", "java_states": {} },
  ],

  "minecraft:end_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:end_stone_bricks", "java_states": {} },
  ],

  "minecraft:purpur_block": [
    { "bedrock_states": {}, "java_id": "minecraft:purpur_block", "java_states": {} },
  ],

  "minecraft:purpur_pillar": [
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:purpur_pillar", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:purpur_pillar", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:purpur_pillar", "java_states": { "axis": "z" } },
  ],

  // Chorus flower — age 0-5
  "minecraft:chorus_flower": [
    { "bedrock_states": { "age": 0 }, "java_id": "minecraft:chorus_flower", "java_states": { "age": "0" } },
    { "bedrock_states": { "age": 1 }, "java_id": "minecraft:chorus_flower", "java_states": { "age": "1" } },
    { "bedrock_states": { "age": 2 }, "java_id": "minecraft:chorus_flower", "java_states": { "age": "2" } },
    { "bedrock_states": { "age": 3 }, "java_id": "minecraft:chorus_flower", "java_states": { "age": "3" } },
    { "bedrock_states": { "age": 4 }, "java_id": "minecraft:chorus_flower", "java_states": { "age": "4" } },
    { "bedrock_states": { "age": 5 }, "java_id": "minecraft:chorus_flower", "java_states": { "age": "5" } },
  ],

  "minecraft:chorus_plant": [
    { "bedrock_states": {}, "java_id": "minecraft:chorus_plant", "java_states": { "down": "false", "east": "false", "north": "false", "south": "false", "up": "false", "west": "false" } },
  ],

  // End portal frame — end_portal_eye_bit (0/1) × direction (0=south,1=west,2=north,3=east)
  "minecraft:end_portal_frame": [
    { "bedrock_states": { "end_portal_eye_bit": false, "direction": 0 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "false", "facing": "south" } },
    { "bedrock_states": { "end_portal_eye_bit": false, "direction": 1 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "false", "facing": "west" } },
    { "bedrock_states": { "end_portal_eye_bit": false, "direction": 2 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "false", "facing": "north" } },
    { "bedrock_states": { "end_portal_eye_bit": false, "direction": 3 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "false", "facing": "east" } },
    { "bedrock_states": { "end_portal_eye_bit": true, "direction": 0 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "true", "facing": "south" } },
    { "bedrock_states": { "end_portal_eye_bit": true, "direction": 1 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "true", "facing": "west" } },
    { "bedrock_states": { "end_portal_eye_bit": true, "direction": 2 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "true", "facing": "north" } },
    { "bedrock_states": { "end_portal_eye_bit": true, "direction": 3 }, "java_id": "minecraft:end_portal_frame", "java_states": { "eye": "true", "facing": "east" } },
  ],

  // ============================================================
  // SECTION 5: STONE VARIANTS (block form)
  // ============================================================

  "minecraft:andesite": [
    { "bedrock_states": {}, "java_id": "minecraft:andesite", "java_states": {} },
  ],

  "minecraft:polished_andesite": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_andesite", "java_states": {} },
  ],

  "minecraft:diorite": [
    { "bedrock_states": {}, "java_id": "minecraft:diorite", "java_states": {} },
  ],

  "minecraft:polished_diorite": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_diorite", "java_states": {} },
  ],

  "minecraft:granite": [
    { "bedrock_states": {}, "java_id": "minecraft:granite", "java_states": {} },
  ],

  "minecraft:polished_granite": [
    { "bedrock_states": {}, "java_id": "minecraft:polished_granite", "java_states": {} },
  ],

  "minecraft:cobblestone": [
    { "bedrock_states": {}, "java_id": "minecraft:cobblestone", "java_states": {} },
  ],

  "minecraft:mossy_cobblestone": [
    { "bedrock_states": {}, "java_id": "minecraft:mossy_cobblestone", "java_states": {} },
  ],

  "minecraft:stone_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:stone_bricks", "java_states": {} },
  ],

  "minecraft:cracked_stone_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:cracked_stone_bricks", "java_states": {} },
  ],

  "minecraft:mossy_stone_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:mossy_stone_bricks", "java_states": {} },
  ],

  "minecraft:chiseled_stone_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:chiseled_stone_bricks", "java_states": {} },
  ],

  "minecraft:smooth_stone": [
    { "bedrock_states": {}, "java_id": "minecraft:smooth_stone", "java_states": {} },
  ],

  "minecraft:bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:bricks", "java_states": {} },
  ],

  // Sandstone — sand_stone_type variants
  "minecraft:sandstone": [
    { "bedrock_states": { "sand_stone_type": "default" }, "java_id": "minecraft:sandstone", "java_states": {} },
    { "bedrock_states": { "sand_stone_type": "chiseled" }, "java_id": "minecraft:chiseled_sandstone", "java_states": {} },
    { "bedrock_states": { "sand_stone_type": "cut" }, "java_id": "minecraft:cut_sandstone", "java_states": {} },
    { "bedrock_states": { "sand_stone_type": "smooth" }, "java_id": "minecraft:smooth_sandstone", "java_states": {} },
  ],

  // Red sandstone — sand_stone_type variants
  "minecraft:red_sandstone": [
    { "bedrock_states": { "sand_stone_type": "default" }, "java_id": "minecraft:red_sandstone", "java_states": {} },
    { "bedrock_states": { "sand_stone_type": "chiseled" }, "java_id": "minecraft:chiseled_red_sandstone", "java_states": {} },
    { "bedrock_states": { "sand_stone_type": "cut" }, "java_id": "minecraft:cut_red_sandstone", "java_states": {} },
    { "bedrock_states": { "sand_stone_type": "smooth" }, "java_id": "minecraft:smooth_red_sandstone", "java_states": {} },
  ],

  "minecraft:mud_bricks": [
    { "bedrock_states": {}, "java_id": "minecraft:mud_bricks", "java_states": {} },
  ],

  "minecraft:packed_mud": [
    { "bedrock_states": {}, "java_id": "minecraft:packed_mud", "java_states": {} },
  ],

  // Prismarine — prismarine_block_type variants
  "minecraft:prismarine": [
    { "bedrock_states": { "prismarine_block_type": "default" }, "java_id": "minecraft:prismarine", "java_states": {} },
    { "bedrock_states": { "prismarine_block_type": "bricks" }, "java_id": "minecraft:prismarine_bricks", "java_states": {} },
    { "bedrock_states": { "prismarine_block_type": "dark" }, "java_id": "minecraft:dark_prismarine", "java_states": {} },
  ],

};
