/**
 * Minecraft Bedrock Edition → Java Edition ブロック変換マッピング
 *
 * 対象: The Flattening (Java 1.13+) 対応
 * 参照: GeyserMC/Geyser, PrismarineJS/minecraft-data, Amulet-Team/PyMCTranslate
 *
 * 構造:
 *   - キー: BEのブロックID
 *   - 値: マッピング配列。bedrock_states の条件に一致した場合に java_id へ変換する。
 *
 * top_slot_bit:
 *   false → JE type:"bottom"
 *   true  → JE type:"top"
 *   (double スラブは top_slot_bit なし → JE type:"double")
 *
 * カテゴリ一覧:
 *   1. 石系     (minecraft:stone)
 *   2. ハーフブロック系 (stone_block_slab / slab2 / slab3 / slab4 + double variants)
 *   3. 原木系   (minecraft:log, minecraft:log2)
 *   4. 木材系   (minecraft:planks)
 */

const BE_TO_JE_BLOCK_MAP = {

  // ============================================================
  // 1. 石系 (Stone) — stone_type プロパティで JE 独立 ID へ分岐
  // ============================================================

  "minecraft:stone": [
    {
      "bedrock_states": { "stone_type": "stone" },
      "java_id": "minecraft:stone",
      "java_states": {}
    },
    {
      "bedrock_states": { "stone_type": "granite" },
      "java_id": "minecraft:granite",
      "java_states": {}
    },
    {
      "bedrock_states": { "stone_type": "granite_smooth" },
      "java_id": "minecraft:polished_granite",
      "java_states": {}
    },
    {
      "bedrock_states": { "stone_type": "diorite" },
      "java_id": "minecraft:diorite",
      "java_states": {}
    },
    {
      "bedrock_states": { "stone_type": "diorite_smooth" },
      "java_id": "minecraft:polished_diorite",
      "java_states": {}
    },
    {
      "bedrock_states": { "stone_type": "andesite" },
      "java_id": "minecraft:andesite",
      "java_states": {}
    },
    {
      "bedrock_states": { "stone_type": "andesite_smooth" },
      "java_id": "minecraft:polished_andesite",
      "java_states": {}
    }
  ],

  // ============================================================
  // 2. ハーフブロック系 (Slabs) — stone_block_slab / 2 / 3 / 4
  //    + それぞれの double スラブ
  // ============================================================

  // --- slab1: smooth_stone / sandstone / wood(petrified_oak) /
  //            cobblestone / brick / stone_brick / quartz / nether_brick ---

  "minecraft:stone_block_slab": [
    {
      "bedrock_states": { "stone_slab_type": "smooth_stone", "top_slot_bit": false },
      "java_id": "minecraft:smooth_stone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "smooth_stone", "top_slot_bit": true },
      "java_id": "minecraft:smooth_stone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "sandstone", "top_slot_bit": false },
      "java_id": "minecraft:sandstone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "sandstone", "top_slot_bit": true },
      "java_id": "minecraft:sandstone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "wood", "top_slot_bit": false },
      "java_id": "minecraft:petrified_oak_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "wood", "top_slot_bit": true },
      "java_id": "minecraft:petrified_oak_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "cobblestone", "top_slot_bit": false },
      "java_id": "minecraft:cobblestone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "cobblestone", "top_slot_bit": true },
      "java_id": "minecraft:cobblestone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "brick", "top_slot_bit": false },
      "java_id": "minecraft:brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "brick", "top_slot_bit": true },
      "java_id": "minecraft:brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "stone_brick", "top_slot_bit": false },
      "java_id": "minecraft:stone_brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "stone_brick", "top_slot_bit": true },
      "java_id": "minecraft:stone_brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "quartz", "top_slot_bit": false },
      "java_id": "minecraft:quartz_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "quartz", "top_slot_bit": true },
      "java_id": "minecraft:quartz_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "nether_brick", "top_slot_bit": false },
      "java_id": "minecraft:nether_brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "nether_brick", "top_slot_bit": true },
      "java_id": "minecraft:nether_brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    }
  ],

  "minecraft:double_stone_block_slab": [
    {
      "bedrock_states": { "stone_slab_type": "smooth_stone" },
      "java_id": "minecraft:smooth_stone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "sandstone" },
      "java_id": "minecraft:sandstone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "wood" },
      "java_id": "minecraft:petrified_oak_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "cobblestone" },
      "java_id": "minecraft:cobblestone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "brick" },
      "java_id": "minecraft:brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "stone_brick" },
      "java_id": "minecraft:stone_brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "quartz" },
      "java_id": "minecraft:quartz_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type": "nether_brick" },
      "java_id": "minecraft:nether_brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    }
  ],

  // --- slab2: red_sandstone / purpur / prismarine variants /
  //            mossy_cobblestone / smooth_sandstone / red_nether_brick ---

  "minecraft:stone_block_slab2": [
    {
      "bedrock_states": { "stone_slab_type_2": "red_sandstone", "top_slot_bit": false },
      "java_id": "minecraft:red_sandstone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "red_sandstone", "top_slot_bit": true },
      "java_id": "minecraft:red_sandstone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "purpur", "top_slot_bit": false },
      "java_id": "minecraft:purpur_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "purpur", "top_slot_bit": true },
      "java_id": "minecraft:purpur_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_rough", "top_slot_bit": false },
      "java_id": "minecraft:prismarine_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_rough", "top_slot_bit": true },
      "java_id": "minecraft:prismarine_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_dark", "top_slot_bit": false },
      "java_id": "minecraft:dark_prismarine_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_dark", "top_slot_bit": true },
      "java_id": "minecraft:dark_prismarine_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_brick", "top_slot_bit": false },
      "java_id": "minecraft:prismarine_brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_brick", "top_slot_bit": true },
      "java_id": "minecraft:prismarine_brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "mossy_cobblestone", "top_slot_bit": false },
      "java_id": "minecraft:mossy_cobblestone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "mossy_cobblestone", "top_slot_bit": true },
      "java_id": "minecraft:mossy_cobblestone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "smooth_sandstone", "top_slot_bit": false },
      "java_id": "minecraft:smooth_sandstone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "smooth_sandstone", "top_slot_bit": true },
      "java_id": "minecraft:smooth_sandstone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "red_nether_brick", "top_slot_bit": false },
      "java_id": "minecraft:red_nether_brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "red_nether_brick", "top_slot_bit": true },
      "java_id": "minecraft:red_nether_brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    }
  ],

  "minecraft:double_stone_block_slab2": [
    {
      "bedrock_states": { "stone_slab_type_2": "red_sandstone" },
      "java_id": "minecraft:red_sandstone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "purpur" },
      "java_id": "minecraft:purpur_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_rough" },
      "java_id": "minecraft:prismarine_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_dark" },
      "java_id": "minecraft:dark_prismarine_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "prismarine_brick" },
      "java_id": "minecraft:prismarine_brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "mossy_cobblestone" },
      "java_id": "minecraft:mossy_cobblestone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "smooth_sandstone" },
      "java_id": "minecraft:smooth_sandstone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_2": "red_nether_brick" },
      "java_id": "minecraft:red_nether_brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    }
  ],

  // --- slab3: end_stone_brick / smooth_red_sandstone /
  //            andesite / polished_andesite /
  //            diorite / polished_diorite /
  //            granite / polished_granite ---

  "minecraft:stone_block_slab3": [
    {
      "bedrock_states": { "stone_slab_type_3": "end_stone_brick", "top_slot_bit": false },
      "java_id": "minecraft:end_stone_brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "end_stone_brick", "top_slot_bit": true },
      "java_id": "minecraft:end_stone_brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "smooth_red_sandstone", "top_slot_bit": false },
      "java_id": "minecraft:smooth_red_sandstone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "smooth_red_sandstone", "top_slot_bit": true },
      "java_id": "minecraft:smooth_red_sandstone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "andesite", "top_slot_bit": false },
      "java_id": "minecraft:andesite_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "andesite", "top_slot_bit": true },
      "java_id": "minecraft:andesite_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_andesite", "top_slot_bit": false },
      "java_id": "minecraft:polished_andesite_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_andesite", "top_slot_bit": true },
      "java_id": "minecraft:polished_andesite_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "diorite", "top_slot_bit": false },
      "java_id": "minecraft:diorite_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "diorite", "top_slot_bit": true },
      "java_id": "minecraft:diorite_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_diorite", "top_slot_bit": false },
      "java_id": "minecraft:polished_diorite_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_diorite", "top_slot_bit": true },
      "java_id": "minecraft:polished_diorite_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "granite", "top_slot_bit": false },
      "java_id": "minecraft:granite_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "granite", "top_slot_bit": true },
      "java_id": "minecraft:granite_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_granite", "top_slot_bit": false },
      "java_id": "minecraft:polished_granite_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_granite", "top_slot_bit": true },
      "java_id": "minecraft:polished_granite_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    }
  ],

  "minecraft:double_stone_block_slab3": [
    {
      "bedrock_states": { "stone_slab_type_3": "end_stone_brick" },
      "java_id": "minecraft:end_stone_brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "smooth_red_sandstone" },
      "java_id": "minecraft:smooth_red_sandstone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "andesite" },
      "java_id": "minecraft:andesite_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_andesite" },
      "java_id": "minecraft:polished_andesite_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "diorite" },
      "java_id": "minecraft:diorite_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_diorite" },
      "java_id": "minecraft:polished_diorite_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "granite" },
      "java_id": "minecraft:granite_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_3": "polished_granite" },
      "java_id": "minecraft:polished_granite_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    }
  ],

  // --- slab4: mossy_stone_brick / smooth_quartz / stone /
  //            cut_sandstone / cut_red_sandstone ---

  "minecraft:stone_block_slab4": [
    {
      "bedrock_states": { "stone_slab_type_4": "mossy_stone_brick", "top_slot_bit": false },
      "java_id": "minecraft:mossy_stone_brick_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "mossy_stone_brick", "top_slot_bit": true },
      "java_id": "minecraft:mossy_stone_brick_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "smooth_quartz", "top_slot_bit": false },
      "java_id": "minecraft:smooth_quartz_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "smooth_quartz", "top_slot_bit": true },
      "java_id": "minecraft:smooth_quartz_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "stone", "top_slot_bit": false },
      "java_id": "minecraft:stone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "stone", "top_slot_bit": true },
      "java_id": "minecraft:stone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "cut_sandstone", "top_slot_bit": false },
      "java_id": "minecraft:cut_sandstone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "cut_sandstone", "top_slot_bit": true },
      "java_id": "minecraft:cut_sandstone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "cut_red_sandstone", "top_slot_bit": false },
      "java_id": "minecraft:cut_red_sandstone_slab",
      "java_states": { "type": "bottom", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "cut_red_sandstone", "top_slot_bit": true },
      "java_id": "minecraft:cut_red_sandstone_slab",
      "java_states": { "type": "top", "waterlogged": "false" }
    }
  ],

  "minecraft:double_stone_block_slab4": [
    {
      "bedrock_states": { "stone_slab_type_4": "mossy_stone_brick" },
      "java_id": "minecraft:mossy_stone_brick_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "smooth_quartz" },
      "java_id": "minecraft:smooth_quartz_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "stone" },
      "java_id": "minecraft:stone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "cut_sandstone" },
      "java_id": "minecraft:cut_sandstone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "stone_slab_type_4": "cut_red_sandstone" },
      "java_id": "minecraft:cut_red_sandstone_slab",
      "java_states": { "type": "double", "waterlogged": "false" }
    }
  ],

  // ============================================================
  // 3. 原木系 (Logs)
  //
  //   BE: minecraft:log  (old_log_type)
  //       → oak / spruce / birch / jungle
  //   BE: minecraft:log2 (new_log_type)
  //       → acacia / dark_oak
  //   pillar_axis: x / y / z → JE axis: x / y / z
  //
  //   剥がした原木 (Stripped) は BE で独立 ID のため別エントリ。
  //   木の幹 (Wood / Hyphae) は BE で minecraft:wood (wood_type) として存在。
  // ============================================================

  "minecraft:log": [
    // --- oak (樫) ---
    {
      "bedrock_states": { "old_log_type": "oak", "pillar_axis": "y" },
      "java_id": "minecraft:oak_log",
      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "old_log_type": "oak", "pillar_axis": "x" },
      "java_id": "minecraft:oak_log",
      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "old_log_type": "oak", "pillar_axis": "z" },
      "java_id": "minecraft:oak_log",
      "java_states": { "axis": "z" }
    },
    // --- spruce (松) ---
    {
      "bedrock_states": { "old_log_type": "spruce", "pillar_axis": "y" },
      "java_id": "minecraft:spruce_log",
      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "old_log_type": "spruce", "pillar_axis": "x" },
      "java_id": "minecraft:spruce_log",
      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "old_log_type": "spruce", "pillar_axis": "z" },
      "java_id": "minecraft:spruce_log",
      "java_states": { "axis": "z" }
    },
    // --- birch (白樺) ---
    {
      "bedrock_states": { "old_log_type": "birch", "pillar_axis": "y" },
      "java_id": "minecraft:birch_log",
      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "old_log_type": "birch", "pillar_axis": "x" },
      "java_id": "minecraft:birch_log",
      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "old_log_type": "birch", "pillar_axis": "z" },
      "java_id": "minecraft:birch_log",
      "java_states": { "axis": "z" }
    },
    // --- jungle (ジャングル) ---
    {
      "bedrock_states": { "old_log_type": "jungle", "pillar_axis": "y" },
      "java_id": "minecraft:jungle_log",
      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "old_log_type": "jungle", "pillar_axis": "x" },
      "java_id": "minecraft:jungle_log",
      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "old_log_type": "jungle", "pillar_axis": "z" },
      "java_id": "minecraft:jungle_log",
      "java_states": { "axis": "z" }
    }
  ],

  "minecraft:log2": [
    // --- acacia (アカシア) ---
    {
      "bedrock_states": { "new_log_type": "acacia", "pillar_axis": "y" },
      "java_id": "minecraft:acacia_log",
      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "new_log_type": "acacia", "pillar_axis": "x" },
      "java_id": "minecraft:acacia_log",
      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "new_log_type": "acacia", "pillar_axis": "z" },
      "java_id": "minecraft:acacia_log",
      "java_states": { "axis": "z" }
    },
    // --- dark_oak (ダークオーク) ---
    {
      "bedrock_states": { "new_log_type": "dark_oak", "pillar_axis": "y" },
      "java_id": "minecraft:dark_oak_log",
      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "new_log_type": "dark_oak", "pillar_axis": "x" },
      "java_id": "minecraft:dark_oak_log",
      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "new_log_type": "dark_oak", "pillar_axis": "z" },
      "java_id": "minecraft:dark_oak_log",
      "java_states": { "axis": "z" }
    }
  ],

  // 木の幹 (Wood — 全面が樹皮のブロック)
  // BE: minecraft:wood (wood_type + stripped_bit)
  "minecraft:wood": [
    // --- 未剥がし (stripped_bit: false) ---
    {
      "bedrock_states": { "wood_type": "oak",      "stripped_bit": false, "pillar_axis": "y" },
      "java_id": "minecraft:oak_wood",      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "oak",      "stripped_bit": false, "pillar_axis": "x" },
      "java_id": "minecraft:oak_wood",      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "oak",      "stripped_bit": false, "pillar_axis": "z" },
      "java_id": "minecraft:oak_wood",      "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "spruce",   "stripped_bit": false, "pillar_axis": "y" },
      "java_id": "minecraft:spruce_wood",   "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "spruce",   "stripped_bit": false, "pillar_axis": "x" },
      "java_id": "minecraft:spruce_wood",   "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "spruce",   "stripped_bit": false, "pillar_axis": "z" },
      "java_id": "minecraft:spruce_wood",   "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "birch",    "stripped_bit": false, "pillar_axis": "y" },
      "java_id": "minecraft:birch_wood",    "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "birch",    "stripped_bit": false, "pillar_axis": "x" },
      "java_id": "minecraft:birch_wood",    "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "birch",    "stripped_bit": false, "pillar_axis": "z" },
      "java_id": "minecraft:birch_wood",    "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "jungle",   "stripped_bit": false, "pillar_axis": "y" },
      "java_id": "minecraft:jungle_wood",   "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "jungle",   "stripped_bit": false, "pillar_axis": "x" },
      "java_id": "minecraft:jungle_wood",   "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "jungle",   "stripped_bit": false, "pillar_axis": "z" },
      "java_id": "minecraft:jungle_wood",   "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "acacia",   "stripped_bit": false, "pillar_axis": "y" },
      "java_id": "minecraft:acacia_wood",   "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "acacia",   "stripped_bit": false, "pillar_axis": "x" },
      "java_id": "minecraft:acacia_wood",   "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "acacia",   "stripped_bit": false, "pillar_axis": "z" },
      "java_id": "minecraft:acacia_wood",   "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "dark_oak", "stripped_bit": false, "pillar_axis": "y" },
      "java_id": "minecraft:dark_oak_wood", "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "dark_oak", "stripped_bit": false, "pillar_axis": "x" },
      "java_id": "minecraft:dark_oak_wood", "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "dark_oak", "stripped_bit": false, "pillar_axis": "z" },
      "java_id": "minecraft:dark_oak_wood", "java_states": { "axis": "z" }
    },
    // --- 剥がし済み (stripped_bit: true) ---
    {
      "bedrock_states": { "wood_type": "oak",      "stripped_bit": true, "pillar_axis": "y" },
      "java_id": "minecraft:stripped_oak_wood",      "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "oak",      "stripped_bit": true, "pillar_axis": "x" },
      "java_id": "minecraft:stripped_oak_wood",      "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "oak",      "stripped_bit": true, "pillar_axis": "z" },
      "java_id": "minecraft:stripped_oak_wood",      "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "spruce",   "stripped_bit": true, "pillar_axis": "y" },
      "java_id": "minecraft:stripped_spruce_wood",   "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "spruce",   "stripped_bit": true, "pillar_axis": "x" },
      "java_id": "minecraft:stripped_spruce_wood",   "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "spruce",   "stripped_bit": true, "pillar_axis": "z" },
      "java_id": "minecraft:stripped_spruce_wood",   "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "birch",    "stripped_bit": true, "pillar_axis": "y" },
      "java_id": "minecraft:stripped_birch_wood",    "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "birch",    "stripped_bit": true, "pillar_axis": "x" },
      "java_id": "minecraft:stripped_birch_wood",    "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "birch",    "stripped_bit": true, "pillar_axis": "z" },
      "java_id": "minecraft:stripped_birch_wood",    "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "jungle",   "stripped_bit": true, "pillar_axis": "y" },
      "java_id": "minecraft:stripped_jungle_wood",   "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "jungle",   "stripped_bit": true, "pillar_axis": "x" },
      "java_id": "minecraft:stripped_jungle_wood",   "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "jungle",   "stripped_bit": true, "pillar_axis": "z" },
      "java_id": "minecraft:stripped_jungle_wood",   "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "acacia",   "stripped_bit": true, "pillar_axis": "y" },
      "java_id": "minecraft:stripped_acacia_wood",   "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "acacia",   "stripped_bit": true, "pillar_axis": "x" },
      "java_id": "minecraft:stripped_acacia_wood",   "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "acacia",   "stripped_bit": true, "pillar_axis": "z" },
      "java_id": "minecraft:stripped_acacia_wood",   "java_states": { "axis": "z" }
    },
    {
      "bedrock_states": { "wood_type": "dark_oak", "stripped_bit": true, "pillar_axis": "y" },
      "java_id": "minecraft:stripped_dark_oak_wood", "java_states": { "axis": "y" }
    },
    {
      "bedrock_states": { "wood_type": "dark_oak", "stripped_bit": true, "pillar_axis": "x" },
      "java_id": "minecraft:stripped_dark_oak_wood", "java_states": { "axis": "x" }
    },
    {
      "bedrock_states": { "wood_type": "dark_oak", "stripped_bit": true, "pillar_axis": "z" },
      "java_id": "minecraft:stripped_dark_oak_wood", "java_states": { "axis": "z" }
    }
  ],

  // 剥がした原木 (Stripped Logs) — BE では独立 ID
  "minecraft:stripped_oak_log": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_oak_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_oak_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_oak_log", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_spruce_log": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_spruce_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_spruce_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_spruce_log", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_birch_log": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_birch_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_birch_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_birch_log", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_jungle_log": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_jungle_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_jungle_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_jungle_log", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_acacia_log": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_acacia_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_acacia_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_acacia_log", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_dark_oak_log": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_dark_oak_log", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_dark_oak_log", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_dark_oak_log", "java_states": { "axis": "z" } }
  ],

  // Nether 木材系 (1.16+) — BE/JE ともに独立 ID だが軸は共通
  "minecraft:crimson_stem": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:crimson_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:crimson_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:crimson_stem", "java_states": { "axis": "z" } }
  ],
  "minecraft:warped_stem": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:warped_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:warped_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:warped_stem", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_crimson_stem": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_crimson_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_crimson_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_crimson_stem", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_warped_stem": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_warped_stem", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_warped_stem", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_warped_stem", "java_states": { "axis": "z" } }
  ],
  "minecraft:crimson_hyphae": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:crimson_hyphae", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:crimson_hyphae", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:crimson_hyphae", "java_states": { "axis": "z" } }
  ],
  "minecraft:warped_hyphae": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:warped_hyphae", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:warped_hyphae", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:warped_hyphae", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_crimson_hyphae": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_crimson_hyphae", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_crimson_hyphae", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_crimson_hyphae", "java_states": { "axis": "z" } }
  ],
  "minecraft:stripped_warped_hyphae": [
    { "bedrock_states": { "pillar_axis": "y" }, "java_id": "minecraft:stripped_warped_hyphae", "java_states": { "axis": "y" } },
    { "bedrock_states": { "pillar_axis": "x" }, "java_id": "minecraft:stripped_warped_hyphae", "java_states": { "axis": "x" } },
    { "bedrock_states": { "pillar_axis": "z" }, "java_id": "minecraft:stripped_warped_hyphae", "java_states": { "axis": "z" } }
  ],

  // ============================================================
  // 4. 木材系 (Planks)
  //
  //   BE: minecraft:planks (wood_type プロパティで 6 種類を保持)
  //   JE: 独立した ID へ完全分岐
  //   ※ Nether 木材 (crimson/warped) は BE でも JE でも独立 ID
  // ============================================================

  "minecraft:planks": [
    {
      "bedrock_states": { "wood_type": "oak" },
      "java_id": "minecraft:oak_planks",
      "java_states": {}
    },
    {
      "bedrock_states": { "wood_type": "spruce" },
      "java_id": "minecraft:spruce_planks",
      "java_states": {}
    },
    {
      "bedrock_states": { "wood_type": "birch" },
      "java_id": "minecraft:birch_planks",
      "java_states": {}
    },
    {
      "bedrock_states": { "wood_type": "jungle" },
      "java_id": "minecraft:jungle_planks",
      "java_states": {}
    },
    {
      "bedrock_states": { "wood_type": "acacia" },
      "java_id": "minecraft:acacia_planks",
      "java_states": {}
    },
    {
      "bedrock_states": { "wood_type": "dark_oak" },
      "java_id": "minecraft:dark_oak_planks",
      "java_states": {}
    }
  ],

  // Nether 木材プランク — BE/JE ともに独立 ID (状態なし)
  "minecraft:crimson_planks": [
    {
      "bedrock_states": {},
      "java_id": "minecraft:crimson_planks",
      "java_states": {}
    }
  ],
  "minecraft:warped_planks": [
    {
      "bedrock_states": {},
      "java_id": "minecraft:warped_planks",
      "java_states": {}
    }
  ],

  // ============================================================
  // 5. 葉・苗木・花・草系 (Leaves / Saplings / Flowers / Grass)
  //
  //   BE の leaves / leaves2 は old_leaf_type / new_leaf_type +
  //   persistent_bit (player-placed) + update_bit (decay check)
  //   の組み合わせ。JE は persistent / distance で管理。
  //
  //   変換方針:
  //     persistent_bit=true  → JE persistent=true,  distance=1
  //     persistent_bit=false → JE persistent=false, distance=7
  //     (distance の正確値は実配置依存のため変換時は最大値7を使用)
  //
  //   花系: BE は red_flower (flower_type), yellow_flower,
  //          double_plant (double_plant_type) でプロパティ分岐。
  //          JE では全て独立 ID。
  // ============================================================

  // --- 葉 (Leaves) — minecraft:leaves ---
  "minecraft:leaves": [
    // oak (樫)
    {
      "bedrock_states": { "old_leaf_type": "oak", "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:oak_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "old_leaf_type": "oak", "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:oak_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    },
    // spruce (松)
    {
      "bedrock_states": { "old_leaf_type": "spruce", "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:spruce_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "old_leaf_type": "spruce", "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:spruce_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    },
    // birch (白樺)
    {
      "bedrock_states": { "old_leaf_type": "birch", "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:birch_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "old_leaf_type": "birch", "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:birch_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    },
    // jungle (ジャングル)
    {
      "bedrock_states": { "old_leaf_type": "jungle", "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:jungle_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "old_leaf_type": "jungle", "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:jungle_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],

  // --- 葉 (Leaves2) — minecraft:leaves2 ---
  "minecraft:leaves2": [
    // acacia (アカシア)
    {
      "bedrock_states": { "new_leaf_type": "acacia", "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:acacia_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "new_leaf_type": "acacia", "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:acacia_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    },
    // dark_oak (ダークオーク)
    {
      "bedrock_states": { "new_leaf_type": "dark_oak", "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:dark_oak_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "new_leaf_type": "dark_oak", "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:dark_oak_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],

  // 1.16+ Nether 葉・1.19+ Mangrove 葉 — BE/JE ともに独立 ID
  "minecraft:azalea_leaves": [
    {
      "bedrock_states": { "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:azalea_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:azalea_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],
  "minecraft:azalea_leaves_flowered": [
    {
      "bedrock_states": { "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:flowering_azalea_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:flowering_azalea_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],
  "minecraft:mangrove_leaves": [
    {
      "bedrock_states": { "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:mangrove_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:mangrove_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],
  "minecraft:cherry_leaves": [
    {
      "bedrock_states": { "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:cherry_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:cherry_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],
  "minecraft:pale_oak_leaves": [
    {
      "bedrock_states": { "persistent_bit": true,  "update_bit": false },
      "java_id": "minecraft:pale_oak_leaves",
      "java_states": { "persistent": "true",  "distance": "1", "waterlogged": "false" }
    },
    {
      "bedrock_states": { "persistent_bit": false, "update_bit": false },
      "java_id": "minecraft:pale_oak_leaves",
      "java_states": { "persistent": "false", "distance": "7", "waterlogged": "false" }
    }
  ],

  // ============================================================
  // 苗木 (Saplings) — minecraft:sapling (sapling_type)
  //   JE では全て独立 ID。stage (成長段階) 0/1 も変換する。
  // ============================================================
  "minecraft:sapling": [
    // oak
    { "bedrock_states": { "sapling_type": "oak",      "age_bit": false }, "java_id": "minecraft:oak_sapling",      "java_states": { "stage": "0" } },
    { "bedrock_states": { "sapling_type": "oak",      "age_bit": true  }, "java_id": "minecraft:oak_sapling",      "java_states": { "stage": "1" } },
    // spruce
    { "bedrock_states": { "sapling_type": "spruce",   "age_bit": false }, "java_id": "minecraft:spruce_sapling",   "java_states": { "stage": "0" } },
    { "bedrock_states": { "sapling_type": "spruce",   "age_bit": true  }, "java_id": "minecraft:spruce_sapling",   "java_states": { "stage": "1" } },
    // birch
    { "bedrock_states": { "sapling_type": "birch",    "age_bit": false }, "java_id": "minecraft:birch_sapling",    "java_states": { "stage": "0" } },
    { "bedrock_states": { "sapling_type": "birch",    "age_bit": true  }, "java_id": "minecraft:birch_sapling",    "java_states": { "stage": "1" } },
    // jungle
    { "bedrock_states": { "sapling_type": "jungle",   "age_bit": false }, "java_id": "minecraft:jungle_sapling",   "java_states": { "stage": "0" } },
    { "bedrock_states": { "sapling_type": "jungle",   "age_bit": true  }, "java_id": "minecraft:jungle_sapling",   "java_states": { "stage": "1" } },
    // acacia
    { "bedrock_states": { "sapling_type": "acacia",   "age_bit": false }, "java_id": "minecraft:acacia_sapling",   "java_states": { "stage": "0" } },
    { "bedrock_states": { "sapling_type": "acacia",   "age_bit": true  }, "java_id": "minecraft:acacia_sapling",   "java_states": { "stage": "1" } },
    // dark_oak
    { "bedrock_states": { "sapling_type": "dark_oak", "age_bit": false }, "java_id": "minecraft:dark_oak_sapling", "java_states": { "stage": "0" } },
    { "bedrock_states": { "sapling_type": "dark_oak", "age_bit": true  }, "java_id": "minecraft:dark_oak_sapling", "java_states": { "stage": "1" } }
  ],

  // ============================================================
  // 花 — 単体 (1ブロック高)
  //
  //   BE: minecraft:yellow_flower → 常に dandelion (variants なし)
  //   BE: minecraft:red_flower    → flower_type で 8 種類に分岐
  //   JE: 全て独立 ID
  // ============================================================

  // タンポポ (Dandelion) — BE では variants なし
  "minecraft:yellow_flower": [
    {
      "bedrock_states": {},
      "java_id": "minecraft:dandelion",
      "java_states": {}
    }
  ],

  // ポピー・各種 1 ブロック花 (Red Flower group)
  "minecraft:red_flower": [
    {
      "bedrock_states": { "flower_type": "poppy" },
      "java_id": "minecraft:poppy",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "orchid" },
      "java_id": "minecraft:blue_orchid",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "allium" },
      "java_id": "minecraft:allium",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "houstonia" },
      "java_id": "minecraft:azure_bluet",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "tulip_red" },
      "java_id": "minecraft:red_tulip",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "tulip_orange" },
      "java_id": "minecraft:orange_tulip",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "tulip_white" },
      "java_id": "minecraft:white_tulip",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "tulip_pink" },
      "java_id": "minecraft:pink_tulip",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "oxeye" },
      "java_id": "minecraft:oxeye_daisy",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "cornflower" },
      "java_id": "minecraft:cornflower",
      "java_states": {}
    },
    {
      "bedrock_states": { "flower_type": "lily_of_the_valley" },
      "java_id": "minecraft:lily_of_the_valley",
      "java_states": {}
    }
  ],

  // ウィザーローズ / トーチフラワー — BE/JE ともに独立 ID
  "minecraft:wither_rose": [
    { "bedrock_states": {}, "java_id": "minecraft:wither_rose", "java_states": {} }
  ],
  "minecraft:torchflower": [
    { "bedrock_states": {}, "java_id": "minecraft:torchflower", "java_states": {} }
  ],

  // ============================================================
  // 花 — 2ブロック高 (Double Plants)
  //
  //   BE: minecraft:double_plant (double_plant_type)
  //       + upper_block_bit (true=上半分, false=下半分)
  //   JE: 独立 ID + half (lower/upper)
  // ============================================================
  "minecraft:double_plant": [
    // ひまわり (Sunflower)
    {
      "bedrock_states": { "double_plant_type": "sunflower", "upper_block_bit": false },
      "java_id": "minecraft:sunflower",
      "java_states": { "half": "lower" }
    },
    {
      "bedrock_states": { "double_plant_type": "sunflower", "upper_block_bit": true },
      "java_id": "minecraft:sunflower",
      "java_states": { "half": "upper" }
    },
    // ライラック (Lilac)
    {
      "bedrock_states": { "double_plant_type": "syringa", "upper_block_bit": false },
      "java_id": "minecraft:lilac",
      "java_states": { "half": "lower" }
    },
    {
      "bedrock_states": { "double_plant_type": "syringa", "upper_block_bit": true },
      "java_id": "minecraft:lilac",
      "java_states": { "half": "upper" }
    },
    // 大きな草 (Tall Grass)
    {
      "bedrock_states": { "double_plant_type": "grass", "upper_block_bit": false },
      "java_id": "minecraft:tall_grass",
      "java_states": { "half": "lower" }
    },
    {
      "bedrock_states": { "double_plant_type": "grass", "upper_block_bit": true },
      "java_id": "minecraft:tall_grass",
      "java_states": { "half": "upper" }
    },
    // 大きなシダ (Large Fern)
    {
      "bedrock_states": { "double_plant_type": "fern", "upper_block_bit": false },
      "java_id": "minecraft:large_fern",
      "java_states": { "half": "lower" }
    },
    {
      "bedrock_states": { "double_plant_type": "fern", "upper_block_bit": true },
      "java_id": "minecraft:large_fern",
      "java_states": { "half": "upper" }
    },
    // バラの茂み (Rose Bush)
    {
      "bedrock_states": { "double_plant_type": "rose", "upper_block_bit": false },
      "java_id": "minecraft:rose_bush",
      "java_states": { "half": "lower" }
    },
    {
      "bedrock_states": { "double_plant_type": "rose", "upper_block_bit": true },
      "java_id": "minecraft:rose_bush",
      "java_states": { "half": "upper" }
    },
    // ボタン (Peony)
    {
      "bedrock_states": { "double_plant_type": "paeonia", "upper_block_bit": false },
      "java_id": "minecraft:peony",
      "java_states": { "half": "lower" }
    },
    {
      "bedrock_states": { "double_plant_type": "paeonia", "upper_block_bit": true },
      "java_id": "minecraft:peony",
      "java_states": { "half": "upper" }
    }
  ],

  // ============================================================
  // 草・低木系 (Short Grass / Fern / Dead Bush)
  //
  //   BE: minecraft:tallgrass (tall_grass_type)
  //       → default / tall / fern / snow の4値
  //   JE: short_grass / tall_grass / fern は独立 ID
  // ============================================================
  "minecraft:tallgrass": [
    {
      "bedrock_states": { "tall_grass_type": "default" },
      "java_id": "minecraft:short_grass",
      "java_states": {}
    },
    {
      "bedrock_states": { "tall_grass_type": "tall" },
      "java_id": "minecraft:short_grass",
      "java_states": {}
    },
    {
      "bedrock_states": { "tall_grass_type": "fern" },
      "java_id": "minecraft:fern",
      "java_states": {}
    },
    {
      "bedrock_states": { "tall_grass_type": "snow" },
      "java_id": "minecraft:short_grass",
      "java_states": {}
    }
  ],

  // 枯れ木 — BE/JE ともに独立 ID (状態なし)
  "minecraft:deadbush": [
    { "bedrock_states": {}, "java_id": "minecraft:dead_bush", "java_states": {} }
  ],

  // ============================================================
  // 6. 土・砂・砂岩系 (Dirt / Sand / Sandstone)
  //
  //   BE: minecraft:dirt        → dirt_type: normal / coarse
  //   BE: minecraft:sand        → sand_type: normal / red
  //   BE: minecraft:sandstone   → sand_stone_type: default / heiroglyphs / cut / smooth
  //   BE: minecraft:red_sandstone → sand_stone_type: default / heiroglyphs / cut / smooth
  //   JE: 全て独立 ID
  //
  //   rooted_dirt / gravel / podzol / mycelium / mud は
  //   BE/JE ともに独立 ID のためパススルー。
  // ============================================================

  // --- 土 (Dirt) ---
  "minecraft:dirt": [
    {
      "bedrock_states": { "dirt_type": "normal" },
      "java_id": "minecraft:dirt",
      "java_states": {}
    },
    {
      "bedrock_states": { "dirt_type": "coarse" },
      "java_id": "minecraft:coarse_dirt",
      "java_states": {}
    }
  ],

  // rooted_dirt — BE/JE 独立 ID (1.17+)
  "minecraft:dirt_with_roots": [
    { "bedrock_states": {}, "java_id": "minecraft:rooted_dirt", "java_states": {} }
  ],

  // 砂利 / 菌糸 / ポドゾル / 泥 — パススルー
  "minecraft:gravel":  [ { "bedrock_states": {}, "java_id": "minecraft:gravel",  "java_states": {} } ],
  "minecraft:mycelium":[ { "bedrock_states": {}, "java_id": "minecraft:mycelium","java_states": {} } ],
  "minecraft:podzol":  [ { "bedrock_states": {}, "java_id": "minecraft:podzol",  "java_states": {} } ],
  "minecraft:mud":     [ { "bedrock_states": {}, "java_id": "minecraft:mud",     "java_states": {} } ],

  // --- 砂 (Sand) ---
  "minecraft:sand": [
    {
      "bedrock_states": { "sand_type": "normal" },
      "java_id": "minecraft:sand",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_type": "red" },
      "java_id": "minecraft:red_sand",
      "java_states": {}
    }
  ],

  // --- 砂岩 (Sandstone) —
  //   BE sand_stone_type: default / heiroglyphs(=chiseled) / cut / smooth
  "minecraft:sandstone": [
    {
      "bedrock_states": { "sand_stone_type": "default" },
      "java_id": "minecraft:sandstone",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_stone_type": "heiroglyphs" },
      "java_id": "minecraft:chiseled_sandstone",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_stone_type": "cut" },
      "java_id": "minecraft:cut_sandstone",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_stone_type": "smooth" },
      "java_id": "minecraft:smooth_sandstone",
      "java_states": {}
    }
  ],

  // --- 赤砂岩 (Red Sandstone) ---
  "minecraft:red_sandstone": [
    {
      "bedrock_states": { "sand_stone_type": "default" },
      "java_id": "minecraft:red_sandstone",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_stone_type": "heiroglyphs" },
      "java_id": "minecraft:chiseled_red_sandstone",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_stone_type": "cut" },
      "java_id": "minecraft:cut_red_sandstone",
      "java_states": {}
    },
    {
      "bedrock_states": { "sand_stone_type": "smooth" },
      "java_id": "minecraft:smooth_red_sandstone",
      "java_states": {}
    }
  ],

  // ============================================================
  // 7. 染色テラコッタ / 硬化粘土系 (Stained Terracotta)
  //
  //   BE: minecraft:stained_hardened_clay (color プロパティ 16色)
  //   JE: <color>_terracotta として独立 ID
  //   未染色: minecraft:hardened_clay → minecraft:terracotta (パススルー)
  // ============================================================

  "minecraft:hardened_clay": [
    { "bedrock_states": {}, "java_id": "minecraft:terracotta", "java_states": {} }
  ],

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
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_terracotta",      "java_states": {} }
  ],

  // ============================================================
  // 8. コンクリート / コンクリートパウダー (Concrete / Concrete Powder)
  //
  //   BE: minecraft:concrete         (color プロパティ 16色)
  //   BE: minecraft:concrete_powder  (color プロパティ 16色)
  //   JE: <color>_concrete / <color>_concrete_powder として独立 ID
  //
  //   ※ BE の color:"silver" → JE の "light_gray" (テラコッタと同様)
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
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_concrete",      "java_states": {} }
  ],

  "minecraft:concrete_powder": [
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
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_concrete_powder",      "java_states": {} }
  ],

  // ============================================================
  // 9. ウール (Wool)
  //
  //   BE: minecraft:wool (color プロパティ 16色)
  //   JE: <color>_wool として独立 ID
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
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_wool",      "java_states": {} }
  ],

  // ============================================================
  // 10. 染色ガラス / 染色ガラス板 (Stained Glass / Stained Glass Pane)
  //
  //   BE: minecraft:stained_glass      (color プロパティ 16色)
  //   BE: minecraft:stained_glass_pane (color プロパティ 16色)
  //   JE: <color>_stained_glass / <color>_stained_glass_pane として独立 ID
  //
  //   ガラス板は JE で east/north/south/west/waterlogged の接続状態を持つが、
  //   変換時は全て false / false で初期化し、ワールドロード時に再計算させる。
  //
  //   未染色: minecraft:glass / minecraft:glass_pane はパススルー。
  // ============================================================

  "minecraft:glass": [
    { "bedrock_states": {}, "java_id": "minecraft:glass", "java_states": {} }
  ],

  "minecraft:glass_pane": [
    {
      "bedrock_states": {},
      "java_id": "minecraft:glass_pane",
      "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" }
    }
  ],

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
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_stained_glass",      "java_states": {} }
  ],

  "minecraft:stained_glass_pane": [
    { "bedrock_states": { "color": "white" },      "java_id": "minecraft:white_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "orange" },     "java_id": "minecraft:orange_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "magenta" },    "java_id": "minecraft:magenta_stained_glass_pane",    "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "light_blue" }, "java_id": "minecraft:light_blue_stained_glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "yellow" },     "java_id": "minecraft:yellow_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "lime" },       "java_id": "minecraft:lime_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "pink" },       "java_id": "minecraft:pink_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "gray" },       "java_id": "minecraft:gray_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "silver" },     "java_id": "minecraft:light_gray_stained_glass_pane", "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "cyan" },       "java_id": "minecraft:cyan_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "purple" },     "java_id": "minecraft:purple_stained_glass_pane",     "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "blue" },       "java_id": "minecraft:blue_stained_glass_pane",       "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "brown" },      "java_id": "minecraft:brown_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "green" },      "java_id": "minecraft:green_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "red" },        "java_id": "minecraft:red_stained_glass_pane",        "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } },
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_stained_glass_pane",      "java_states": { "east": "false", "north": "false", "south": "false", "west": "false", "waterlogged": "false" } }
  ],

  // ============================================================
  // 11. カーペット (Carpet)
  //
  //   BE: minecraft:carpet (color プロパティ 16色)
  //   JE: <color>_carpet として独立 ID
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
    { "bedrock_states": { "color": "black" },      "java_id": "minecraft:black_carpet",      "java_states": {} }
  ],

  // ============================================================
  // 12. 染色シュルカーボックス (Shulker Box)
  //
  //   BE: minecraft:undyed_shulker_box → 未染色 (状態なし)
  //   BE: minecraft:shulker_box (color プロパティ 16色)
  //   JE: minecraft:shulker_box (未染色) / <color>_shulker_box (染色)
  //   facing: BE facing_direction(0-5) → JE facing (down/up/north/south/west/east)
  //
  //   facing_direction: 0=down, 1=up, 2=north, 3=south, 4=west, 5=east
  // ============================================================

  "minecraft:undyed_shulker_box": [
    { "bedrock_states": { "facing_direction": 0 }, "java_id": "minecraft:shulker_box", "java_states": { "facing": "down"  } },
    { "bedrock_states": { "facing_direction": 1 }, "java_id": "minecraft:shulker_box", "java_states": { "facing": "up"    } },
    { "bedrock_states": { "facing_direction": 2 }, "java_id": "minecraft:shulker_box", "java_states": { "facing": "north" } },
    { "bedrock_states": { "facing_direction": 3 }, "java_id": "minecraft:shulker_box", "java_states": { "facing": "south" } },
    { "bedrock_states": { "facing_direction": 4 }, "java_id": "minecraft:shulker_box", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "facing_direction": 5 }, "java_id": "minecraft:shulker_box", "java_states": { "facing": "east"  } }
  ],

  "minecraft:shulker_box": [
    { "bedrock_states": { "color": "white",      "facing_direction": 0 }, "java_id": "minecraft:white_shulker_box",      "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "white",      "facing_direction": 1 }, "java_id": "minecraft:white_shulker_box",      "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "white",      "facing_direction": 2 }, "java_id": "minecraft:white_shulker_box",      "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "white",      "facing_direction": 3 }, "java_id": "minecraft:white_shulker_box",      "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "white",      "facing_direction": 4 }, "java_id": "minecraft:white_shulker_box",      "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "white",      "facing_direction": 5 }, "java_id": "minecraft:white_shulker_box",      "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "orange",     "facing_direction": 0 }, "java_id": "minecraft:orange_shulker_box",     "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "orange",     "facing_direction": 1 }, "java_id": "minecraft:orange_shulker_box",     "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "orange",     "facing_direction": 2 }, "java_id": "minecraft:orange_shulker_box",     "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "orange",     "facing_direction": 3 }, "java_id": "minecraft:orange_shulker_box",     "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "orange",     "facing_direction": 4 }, "java_id": "minecraft:orange_shulker_box",     "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "orange",     "facing_direction": 5 }, "java_id": "minecraft:orange_shulker_box",     "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "magenta",    "facing_direction": 0 }, "java_id": "minecraft:magenta_shulker_box",    "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "magenta",    "facing_direction": 1 }, "java_id": "minecraft:magenta_shulker_box",    "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "magenta",    "facing_direction": 2 }, "java_id": "minecraft:magenta_shulker_box",    "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "magenta",    "facing_direction": 3 }, "java_id": "minecraft:magenta_shulker_box",    "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "magenta",    "facing_direction": 4 }, "java_id": "minecraft:magenta_shulker_box",    "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "magenta",    "facing_direction": 5 }, "java_id": "minecraft:magenta_shulker_box",    "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "light_blue", "facing_direction": 0 }, "java_id": "minecraft:light_blue_shulker_box", "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "light_blue", "facing_direction": 1 }, "java_id": "minecraft:light_blue_shulker_box", "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "light_blue", "facing_direction": 2 }, "java_id": "minecraft:light_blue_shulker_box", "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "light_blue", "facing_direction": 3 }, "java_id": "minecraft:light_blue_shulker_box", "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "light_blue", "facing_direction": 4 }, "java_id": "minecraft:light_blue_shulker_box", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "light_blue", "facing_direction": 5 }, "java_id": "minecraft:light_blue_shulker_box", "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "yellow",     "facing_direction": 0 }, "java_id": "minecraft:yellow_shulker_box",     "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "yellow",     "facing_direction": 1 }, "java_id": "minecraft:yellow_shulker_box",     "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "yellow",     "facing_direction": 2 }, "java_id": "minecraft:yellow_shulker_box",     "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "yellow",     "facing_direction": 3 }, "java_id": "minecraft:yellow_shulker_box",     "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "yellow",     "facing_direction": 4 }, "java_id": "minecraft:yellow_shulker_box",     "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "yellow",     "facing_direction": 5 }, "java_id": "minecraft:yellow_shulker_box",     "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "lime",       "facing_direction": 0 }, "java_id": "minecraft:lime_shulker_box",       "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "lime",       "facing_direction": 1 }, "java_id": "minecraft:lime_shulker_box",       "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "lime",       "facing_direction": 2 }, "java_id": "minecraft:lime_shulker_box",       "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "lime",       "facing_direction": 3 }, "java_id": "minecraft:lime_shulker_box",       "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "lime",       "facing_direction": 4 }, "java_id": "minecraft:lime_shulker_box",       "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "lime",       "facing_direction": 5 }, "java_id": "minecraft:lime_shulker_box",       "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "pink",       "facing_direction": 0 }, "java_id": "minecraft:pink_shulker_box",       "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "pink",       "facing_direction": 1 }, "java_id": "minecraft:pink_shulker_box",       "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "pink",       "facing_direction": 2 }, "java_id": "minecraft:pink_shulker_box",       "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "pink",       "facing_direction": 3 }, "java_id": "minecraft:pink_shulker_box",       "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "pink",       "facing_direction": 4 }, "java_id": "minecraft:pink_shulker_box",       "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "pink",       "facing_direction": 5 }, "java_id": "minecraft:pink_shulker_box",       "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "gray",       "facing_direction": 0 }, "java_id": "minecraft:gray_shulker_box",       "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "gray",       "facing_direction": 1 }, "java_id": "minecraft:gray_shulker_box",       "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "gray",       "facing_direction": 2 }, "java_id": "minecraft:gray_shulker_box",       "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "gray",       "facing_direction": 3 }, "java_id": "minecraft:gray_shulker_box",       "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "gray",       "facing_direction": 4 }, "java_id": "minecraft:gray_shulker_box",       "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "gray",       "facing_direction": 5 }, "java_id": "minecraft:gray_shulker_box",       "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "silver",     "facing_direction": 0 }, "java_id": "minecraft:light_gray_shulker_box", "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "silver",     "facing_direction": 1 }, "java_id": "minecraft:light_gray_shulker_box", "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "silver",     "facing_direction": 2 }, "java_id": "minecraft:light_gray_shulker_box", "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "silver",     "facing_direction": 3 }, "java_id": "minecraft:light_gray_shulker_box", "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "silver",     "facing_direction": 4 }, "java_id": "minecraft:light_gray_shulker_box", "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "silver",     "facing_direction": 5 }, "java_id": "minecraft:light_gray_shulker_box", "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "cyan",       "facing_direction": 0 }, "java_id": "minecraft:cyan_shulker_box",       "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "cyan",       "facing_direction": 1 }, "java_id": "minecraft:cyan_shulker_box",       "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "cyan",       "facing_direction": 2 }, "java_id": "minecraft:cyan_shulker_box",       "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "cyan",       "facing_direction": 3 }, "java_id": "minecraft:cyan_shulker_box",       "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "cyan",       "facing_direction": 4 }, "java_id": "minecraft:cyan_shulker_box",       "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "cyan",       "facing_direction": 5 }, "java_id": "minecraft:cyan_shulker_box",       "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "purple",     "facing_direction": 0 }, "java_id": "minecraft:purple_shulker_box",     "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "purple",     "facing_direction": 1 }, "java_id": "minecraft:purple_shulker_box",     "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "purple",     "facing_direction": 2 }, "java_id": "minecraft:purple_shulker_box",     "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "purple",     "facing_direction": 3 }, "java_id": "minecraft:purple_shulker_box",     "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "purple",     "facing_direction": 4 }, "java_id": "minecraft:purple_shulker_box",     "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "purple",     "facing_direction": 5 }, "java_id": "minecraft:purple_shulker_box",     "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "blue",       "facing_direction": 0 }, "java_id": "minecraft:blue_shulker_box",       "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "blue",       "facing_direction": 1 }, "java_id": "minecraft:blue_shulker_box",       "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "blue",       "facing_direction": 2 }, "java_id": "minecraft:blue_shulker_box",       "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "blue",       "facing_direction": 3 }, "java_id": "minecraft:blue_shulker_box",       "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "blue",       "facing_direction": 4 }, "java_id": "minecraft:blue_shulker_box",       "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "blue",       "facing_direction": 5 }, "java_id": "minecraft:blue_shulker_box",       "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "brown",      "facing_direction": 0 }, "java_id": "minecraft:brown_shulker_box",      "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "brown",      "facing_direction": 1 }, "java_id": "minecraft:brown_shulker_box",      "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "brown",      "facing_direction": 2 }, "java_id": "minecraft:brown_shulker_box",      "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "brown",      "facing_direction": 3 }, "java_id": "minecraft:brown_shulker_box",      "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "brown",      "facing_direction": 4 }, "java_id": "minecraft:brown_shulker_box",      "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "brown",      "facing_direction": 5 }, "java_id": "minecraft:brown_shulker_box",      "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "green",      "facing_direction": 0 }, "java_id": "minecraft:green_shulker_box",      "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "green",      "facing_direction": 1 }, "java_id": "minecraft:green_shulker_box",      "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "green",      "facing_direction": 2 }, "java_id": "minecraft:green_shulker_box",      "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "green",      "facing_direction": 3 }, "java_id": "minecraft:green_shulker_box",      "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "green",      "facing_direction": 4 }, "java_id": "minecraft:green_shulker_box",      "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "green",      "facing_direction": 5 }, "java_id": "minecraft:green_shulker_box",      "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "red",        "facing_direction": 0 }, "java_id": "minecraft:red_shulker_box",        "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "red",        "facing_direction": 1 }, "java_id": "minecraft:red_shulker_box",        "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "red",        "facing_direction": 2 }, "java_id": "minecraft:red_shulker_box",        "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "red",        "facing_direction": 3 }, "java_id": "minecraft:red_shulker_box",        "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "red",        "facing_direction": 4 }, "java_id": "minecraft:red_shulker_box",        "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "red",        "facing_direction": 5 }, "java_id": "minecraft:red_shulker_box",        "java_states": { "facing": "east"  } },
    { "bedrock_states": { "color": "black",      "facing_direction": 0 }, "java_id": "minecraft:black_shulker_box",      "java_states": { "facing": "down"  } },
    { "bedrock_states": { "color": "black",      "facing_direction": 1 }, "java_id": "minecraft:black_shulker_box",      "java_states": { "facing": "up"    } },
    { "bedrock_states": { "color": "black",      "facing_direction": 2 }, "java_id": "minecraft:black_shulker_box",      "java_states": { "facing": "north" } },
    { "bedrock_states": { "color": "black",      "facing_direction": 3 }, "java_id": "minecraft:black_shulker_box",      "java_states": { "facing": "south" } },
    { "bedrock_states": { "color": "black",      "facing_direction": 4 }, "java_id": "minecraft:black_shulker_box",      "java_states": { "facing": "west"  } },
    { "bedrock_states": { "color": "black",      "facing_direction": 5 }, "java_id": "minecraft:black_shulker_box",      "java_states": { "facing": "east"  } }
  ]

};

export { BE_TO_JE_BLOCK_MAP };
