/**
 * crafting-tree.js — Material & Crafting Tree Calculation Engine (Phase 4-A)
 *
 * Functions:
 *   flattenMaterialList(blocks)   → Map<blockId, rawCount>
 *   expandCraftingTree(materials) → { rawMaterials, craftingSteps, smeltingCost }
 *   computeShulkerPacking(mats)   → { boxes, summary }
 *
 * Design goals:
 *   - Multi-level expansion: stairs → planks → logs (handles intermediate goods)
 *   - Smelting fuel cost included (items smelted × fuel ratio)
 *   - Works on Bedrock block names (Java names are handled by the caller mapping)
 *   - No DOM / Worker dependencies — pure computation
 */

// ─────────────────────────────────────────────────────────────────────────────
// Crafting Recipes Database
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recipe database.
 * Key:   Bedrock output block name (or Java name — looked up with startsWith for wood types)
 * Value: { inputs: Map<ingredientName, count>, yield: number, type: 'craft'|'smelt'|'stonecutting' }
 *
 * Block-family recipes use a wildcard suffix pattern "*" matched at lookup time.
 * e.g. "minecraft:*_planks" covers oak_planks, spruce_planks, etc.
 *
 * Numbers represent quantities per recipe output.
 */

const _RECIPES = [
  // ── Logs → Planks ──────────────────────────────────────────────────────────
  { output: 'minecraft:oak_planks',        yield: 4, type: 'craft', inputs: { 'minecraft:oak_log': 1 } },
  { output: 'minecraft:spruce_planks',     yield: 4, type: 'craft', inputs: { 'minecraft:spruce_log': 1 } },
  { output: 'minecraft:birch_planks',      yield: 4, type: 'craft', inputs: { 'minecraft:birch_log': 1 } },
  { output: 'minecraft:jungle_planks',     yield: 4, type: 'craft', inputs: { 'minecraft:jungle_log': 1 } },
  { output: 'minecraft:acacia_planks',     yield: 4, type: 'craft', inputs: { 'minecraft:acacia_log': 1 } },
  { output: 'minecraft:dark_oak_planks',   yield: 4, type: 'craft', inputs: { 'minecraft:dark_oak_log': 1 } },
  { output: 'minecraft:crimson_planks',    yield: 4, type: 'craft', inputs: { 'minecraft:crimson_stem': 1 } },
  { output: 'minecraft:warped_planks',     yield: 4, type: 'craft', inputs: { 'minecraft:warped_stem': 1 } },
  { output: 'minecraft:mangrove_planks',   yield: 4, type: 'craft', inputs: { 'minecraft:mangrove_log': 1 } },
  { output: 'minecraft:cherry_planks',     yield: 4, type: 'craft', inputs: { 'minecraft:cherry_log': 1 } },
  { output: 'minecraft:bamboo_planks',     yield: 2, type: 'craft', inputs: { 'minecraft:bamboo': 1 } },

  // ── Planks → Slabs ─────────────────────────────────────────────────────────
  { output: 'minecraft:oak_slab',          yield: 6, type: 'craft', inputs: { 'minecraft:oak_planks': 3 } },
  { output: 'minecraft:spruce_slab',       yield: 6, type: 'craft', inputs: { 'minecraft:spruce_planks': 3 } },
  { output: 'minecraft:birch_slab',        yield: 6, type: 'craft', inputs: { 'minecraft:birch_planks': 3 } },
  { output: 'minecraft:jungle_slab',       yield: 6, type: 'craft', inputs: { 'minecraft:jungle_planks': 3 } },
  { output: 'minecraft:acacia_slab',       yield: 6, type: 'craft', inputs: { 'minecraft:acacia_planks': 3 } },
  { output: 'minecraft:dark_oak_slab',     yield: 6, type: 'craft', inputs: { 'minecraft:dark_oak_planks': 3 } },
  { output: 'minecraft:crimson_slab',      yield: 6, type: 'craft', inputs: { 'minecraft:crimson_planks': 3 } },
  { output: 'minecraft:warped_slab',       yield: 6, type: 'craft', inputs: { 'minecraft:warped_planks': 3 } },

  // Stone slabs
  { output: 'minecraft:smooth_stone_slab', yield: 6, type: 'craft', inputs: { 'minecraft:smooth_stone': 3 } },
  { output: 'minecraft:stone_brick_slab',  yield: 6, type: 'craft', inputs: { 'minecraft:stone_bricks': 3 } },
  { output: 'minecraft:cobblestone_slab',  yield: 6, type: 'craft', inputs: { 'minecraft:cobblestone': 3 } },
  { output: 'minecraft:sandstone_slab',    yield: 6, type: 'craft', inputs: { 'minecraft:sandstone': 3 } },
  { output: 'minecraft:brick_slab',        yield: 6, type: 'craft', inputs: { 'minecraft:bricks': 3 } },
  { output: 'minecraft:quartz_slab',       yield: 6, type: 'craft', inputs: { 'minecraft:quartz_block': 3 } },
  { output: 'minecraft:nether_brick_slab', yield: 6, type: 'craft', inputs: { 'minecraft:nether_bricks': 3 } },

  // ── Planks → Stairs ────────────────────────────────────────────────────────
  { output: 'minecraft:oak_stairs',        yield: 4, type: 'craft', inputs: { 'minecraft:oak_planks': 6 } },
  { output: 'minecraft:spruce_stairs',     yield: 4, type: 'craft', inputs: { 'minecraft:spruce_planks': 6 } },
  { output: 'minecraft:birch_stairs',      yield: 4, type: 'craft', inputs: { 'minecraft:birch_planks': 6 } },
  { output: 'minecraft:jungle_stairs',     yield: 4, type: 'craft', inputs: { 'minecraft:jungle_planks': 6 } },
  { output: 'minecraft:acacia_stairs',     yield: 4, type: 'craft', inputs: { 'minecraft:acacia_planks': 6 } },
  { output: 'minecraft:dark_oak_stairs',   yield: 4, type: 'craft', inputs: { 'minecraft:dark_oak_planks': 6 } },
  { output: 'minecraft:crimson_stairs',    yield: 4, type: 'craft', inputs: { 'minecraft:crimson_planks': 6 } },
  { output: 'minecraft:warped_stairs',     yield: 4, type: 'craft', inputs: { 'minecraft:warped_planks': 6 } },

  // Stone stairs
  { output: 'minecraft:stone_stairs',      yield: 4, type: 'craft', inputs: { 'minecraft:stone': 6 } },
  { output: 'minecraft:cobblestone_stairs',yield: 4, type: 'craft', inputs: { 'minecraft:cobblestone': 6 } },
  { output: 'minecraft:stone_brick_stairs',yield: 4, type: 'craft', inputs: { 'minecraft:stone_bricks': 6 } },
  { output: 'minecraft:sandstone_stairs',  yield: 4, type: 'craft', inputs: { 'minecraft:sandstone': 6 } },
  { output: 'minecraft:brick_stairs',      yield: 4, type: 'craft', inputs: { 'minecraft:bricks': 6 } },
  { output: 'minecraft:quartz_stairs',     yield: 4, type: 'craft', inputs: { 'minecraft:quartz_block': 6 } },
  { output: 'minecraft:nether_brick_stairs',yield:4, type: 'craft', inputs: { 'minecraft:nether_bricks': 6 } },

  // ── Stone processing ───────────────────────────────────────────────────────
  { output: 'minecraft:stone',             yield: 1, type: 'smelt', inputs: { 'minecraft:cobblestone': 1 } },
  { output: 'minecraft:smooth_stone',      yield: 1, type: 'smelt', inputs: { 'minecraft:stone': 1 } },
  { output: 'minecraft:stone_bricks',      yield: 4, type: 'craft', inputs: { 'minecraft:stone': 4 } },
  { output: 'minecraft:chiseled_stone_bricks', yield: 1, type: 'craft', inputs: { 'minecraft:stone_brick_slab': 2 } },
  { output: 'minecraft:smooth_sandstone',  yield: 1, type: 'smelt', inputs: { 'minecraft:sandstone': 1 } },
  { output: 'minecraft:sandstone',         yield: 4, type: 'craft', inputs: { 'minecraft:sand': 4 } },
  { output: 'minecraft:red_sandstone',     yield: 4, type: 'craft', inputs: { 'minecraft:red_sand': 4 } },

  // ── Bricks ─────────────────────────────────────────────────────────────────
  { output: 'minecraft:bricks',            yield: 1, type: 'craft', inputs: { 'minecraft:brick': 4 } },
  { output: 'minecraft:brick',             yield: 1, type: 'smelt', inputs: { 'minecraft:clay_ball': 1 } },

  // ── Quartz ─────────────────────────────────────────────────────────────────
  { output: 'minecraft:quartz_block',      yield: 1, type: 'craft', inputs: { 'minecraft:quartz': 4 } },
  { output: 'minecraft:quartz_pillar',     yield: 2, type: 'craft', inputs: { 'minecraft:quartz_block': 2 } },
  { output: 'minecraft:chiseled_quartz_block', yield: 1, type: 'craft', inputs: { 'minecraft:quartz_slab': 2 } },
  { output: 'minecraft:smooth_quartz',     yield: 1, type: 'smelt', inputs: { 'minecraft:quartz_block': 1 } },

  // ── Nether Bricks ──────────────────────────────────────────────────────────
  { output: 'minecraft:nether_bricks',     yield: 1, type: 'craft', inputs: { 'minecraft:nether_brick': 4 } },

  // ── Concrete → Concrete Powder ─────────────────────────────────────────────
  // (concrete powder is the raw; concrete is placed + watered — no recipe)

  // ── Glass ──────────────────────────────────────────────────────────────────
  { output: 'minecraft:glass',             yield: 1, type: 'smelt', inputs: { 'minecraft:sand': 1 } },
  { output: 'minecraft:glass_pane',        yield: 16,type: 'craft', inputs: { 'minecraft:glass': 6 } },

  // ── Iron / Gold / Copper ───────────────────────────────────────────────────
  { output: 'minecraft:iron_ingot',        yield: 1, type: 'smelt', inputs: { 'minecraft:iron_ore': 1 } },
  { output: 'minecraft:gold_ingot',        yield: 1, type: 'smelt', inputs: { 'minecraft:gold_ore': 1 } },
  { output: 'minecraft:copper_ingot',      yield: 1, type: 'smelt', inputs: { 'minecraft:copper_ore': 1 } },
  { output: 'minecraft:iron_block',        yield: 1, type: 'craft', inputs: { 'minecraft:iron_ingot': 9 } },
  { output: 'minecraft:gold_block',        yield: 1, type: 'craft', inputs: { 'minecraft:gold_ingot': 9 } },
  { output: 'minecraft:copper_block',      yield: 1, type: 'craft', inputs: { 'minecraft:copper_ingot': 9 } },
  { output: 'minecraft:cut_copper',        yield: 4, type: 'craft', inputs: { 'minecraft:copper_block': 4 } },

  // ── Terracotta ─────────────────────────────────────────────────────────────
  { output: 'minecraft:terracotta',        yield: 1, type: 'smelt', inputs: { 'minecraft:clay': 1 } },

  // ── Wool → Carpet ──────────────────────────────────────────────────────────
  ...[
    'white','orange','magenta','light_blue','yellow','lime','pink','gray',
    'light_gray','cyan','purple','blue','brown','green','red','black'
  ].map(c => ({
    output: `minecraft:${c}_carpet`,
    yield:  3,
    type:   'craft',
    inputs: { [`minecraft:${c}_wool`]: 2 },
  })),

  // ── Concrete powder ────────────────────────────────────────────────────────
  ...[
    'white','orange','magenta','light_blue','yellow','lime','pink','gray',
    'light_gray','cyan','purple','blue','brown','green','red','black'
  ].map(c => ({
    output: `minecraft:${c}_concrete_powder`,
    yield:  8,
    type:   'craft',
    inputs: { [`minecraft:${c}_dye`]: 1, 'minecraft:sand': 4, 'minecraft:gravel': 4 },
  })),

  // ── Fences ────────────────────────────────────────────────────────────────
  { output: 'minecraft:oak_fence',         yield: 3, type: 'craft', inputs: { 'minecraft:oak_planks': 4, 'minecraft:stick': 2 } },
  { output: 'minecraft:spruce_fence',      yield: 3, type: 'craft', inputs: { 'minecraft:spruce_planks': 4, 'minecraft:stick': 2 } },
  { output: 'minecraft:birch_fence',       yield: 3, type: 'craft', inputs: { 'minecraft:birch_planks': 4, 'minecraft:stick': 2 } },
  { output: 'minecraft:jungle_fence',      yield: 3, type: 'craft', inputs: { 'minecraft:jungle_planks': 4, 'minecraft:stick': 2 } },
  { output: 'minecraft:acacia_fence',      yield: 3, type: 'craft', inputs: { 'minecraft:acacia_planks': 4, 'minecraft:stick': 2 } },
  { output: 'minecraft:dark_oak_fence',    yield: 3, type: 'craft', inputs: { 'minecraft:dark_oak_planks': 4, 'minecraft:stick': 2 } },
  { output: 'minecraft:nether_brick_fence',yield: 6, type: 'craft', inputs: { 'minecraft:nether_bricks': 6, 'minecraft:nether_brick': 2 } },

  // ── Sticks ────────────────────────────────────────────────────────────────
  { output: 'minecraft:stick',             yield: 4, type: 'craft', inputs: { 'minecraft:oak_planks': 2 } },
];

/** Build the recipe lookup Map at module init. */
const RECIPE_MAP = new Map(
  _RECIPES.map(r => [r.output, r])
);

// ─────────────────────────────────────────────────────────────────────────────
// Smelting fuel cost table (items of fuel per item smelted)
// Standard rule: 1 coal = 8 items, 1 log = 1.5 items, 1 plank = 1.5 items
// ─────────────────────────────────────────────────────────────────────────────

const SMELT_FUEL_EFFICIENCY = 8; // items per coal equivalent

/**
 * How many "coal units" does smelting N items cost?
 * @param {number} count
 * @returns {number}
 */
function smeltCost(count) {
  return Math.ceil(count / SMELT_FUEL_EFFICIENCY);
}

// ─────────────────────────────────────────────────────────────────────────────
// flattenMaterialList
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Take a list of placed blocks and produce the raw block count map,
 * stripping air and normalising names.
 *
 * @param {Array<{ id: string, count: number }>} blocks
 *   Each entry is a block ID (Bedrock or Java name) and its count.
 * @returns {Map<string, number>} blockId → total count
 */
export function flattenMaterialList(blocks) {
  const totals = new Map();
  for (const { id, count } of blocks) {
    const name = id?.toLowerCase?.() ?? '';
    if (!name || name === 'minecraft:air' || name === 'air') continue;
    totals.set(name, (totals.get(name) ?? 0) + count);
  }
  return totals;
}

// ─────────────────────────────────────────────────────────────────────────────
// expandCraftingTree
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expand a block material list into raw ingredients, following crafting recipes.
 * Performs multi-level expansion (e.g. stairs → planks → logs).
 *
 * @param {Map<string, number>} materials - From flattenMaterialList()
 * @param {object} [opts]
 * @param {number}  [opts.maxDepth=5]   - Maximum recipe expansion depth
 * @param {boolean} [opts.expandSmelt=true] - Expand smelting inputs too
 * @returns {{
 *   rawMaterials: Map<string, number>,
 *   craftingSteps: Array<{ output: string, count: number, inputs: object, type: string }>,
 *   smeltingItems: number,
 *   coalCost: number,
 *   unexpanded: Map<string, number>,
 * }}
 */
export function expandCraftingTree(materials, opts = {}) {
  const { maxDepth = 5, expandSmelt = true } = opts;

  /** Items that cannot be further broken down. */
  const rawMaterials = new Map();
  /** Items pending expansion. */
  let pending = new Map(materials);
  /** Ordered crafting steps for display. */
  const craftingSteps = [];
  /** Items with no known recipe. */
  const unexpanded = new Map();
  let smeltingItems = 0;

  for (let depth = 0; depth < maxDepth; depth++) {
    const next = new Map();

    for (const [id, count] of pending) {
      const recipe = RECIPE_MAP.get(id);

      if (!recipe) {
        // No recipe — this is a raw material
        rawMaterials.set(id, (rawMaterials.get(id) ?? 0) + count);
        continue;
      }

      if (recipe.type === 'smelt' && !expandSmelt) {
        rawMaterials.set(id, (rawMaterials.get(id) ?? 0) + count);
        continue;
      }

      // How many recipe runs are needed to produce `count` items?
      const runs = Math.ceil(count / recipe.yield);
      if (recipe.type === 'smelt') smeltingItems += count;

      craftingSteps.push({
        output: id,
        outputCount: count,
        runs,
        type: recipe.type,
        inputs: recipe.inputs,
      });

      // Accumulate inputs for next expansion round
      for (const [inputId, inputPer] of Object.entries(recipe.inputs)) {
        const needed = inputPer * runs;
        next.set(inputId, (next.get(inputId) ?? 0) + needed);
      }
    }

    pending = next;
    if (pending.size === 0) break;
  }

  // Anything left in pending after max depth = unexpandable
  for (const [id, count] of pending) {
    unexpanded.set(id, (unexpanded.get(id) ?? 0) + count);
    rawMaterials.set(id, (rawMaterials.get(id) ?? 0) + count);
  }

  const coalCost = smeltCost(smeltingItems);

  return { rawMaterials, craftingSteps, smeltingItems, coalCost, unexpanded };
}

// ─────────────────────────────────────────────────────────────────────────────
// computeShulkerPacking  (Phase 4-B)
// ─────────────────────────────────────────────────────────────────────────────

/** Max stack size for non-stackable items. */
const STACK_64 = new Set(); // items that stack to 64 (default)
const STACK_16 = new Set(['minecraft:ender_pearl', 'minecraft:snowball',
  'minecraft:egg', 'minecraft:bucket', 'minecraft:honey_bottle']);
const STACK_1  = new Set(['minecraft:shulker_box']); // can't stack shulkers inside shulkers

const SHULKER_SLOTS = 27;

/**
 * @param {string} id
 * @returns {number} Max stack size
 */
function stackSize(id) {
  if (STACK_1.has(id))  return 1;
  if (STACK_16.has(id)) return 16;
  return 64;
}

/**
 * Pack a material list into shulker boxes.
 * Returns an ordered list of box contents for display.
 *
 * @param {Map<string, number>} materials - blockId → count
 * @returns {{
 *   boxes: Array<Array<{ id: string, count: number, stacks: number, remainder: number }>>,
 *   totalBoxes: number,
 *   totalSlots: number,
 *   summary: { totalItems: number, totalStacks: number }
 * }}
 */
export function computeShulkerPacking(materials) {
  // Convert to slot list: each row = one partial or full stack
  const slots = [];
  let totalItems = 0;

  for (const [id, count] of materials) {
    const ss       = stackSize(id);
    const fullStacks = Math.floor(count / ss);
    const remainder  = count % ss;
    totalItems += count;

    for (let i = 0; i < fullStacks; i++) slots.push({ id, count: ss });
    if (remainder > 0)                   slots.push({ id, count: remainder });
  }

  // Group into shulker boxes of 27 slots each
  const boxes = [];
  for (let i = 0; i < slots.length; i += SHULKER_SLOTS) {
    boxes.push(slots.slice(i, i + SHULKER_SLOTS));
  }

  return {
    boxes,
    totalBoxes: boxes.length,
    totalSlots: slots.length,
    summary: {
      totalItems,
      totalStacks: slots.length,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full pipeline helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All-in-one: given a placed-block list, return raw materials + crafting steps
 * + shulker packing in one call.
 *
 * @param {Array<{ id: string, count: number }>} placedBlocks
 * @param {object} [opts] - Forwarded to expandCraftingTree
 * @returns {{
 *   placedMaterials:  Map<string, number>,
 *   rawMaterials:     Map<string, number>,
 *   craftingSteps:    Array,
 *   smeltingItems:    number,
 *   coalCost:         number,
 *   shulkerPacking:   object,
 * }}
 */
export function computeFullMaterialPlan(placedBlocks, opts = {}) {
  const placedMaterials = flattenMaterialList(placedBlocks);
  const { rawMaterials, craftingSteps, smeltingItems, coalCost, unexpanded } =
    expandCraftingTree(placedMaterials, opts);

  const shulkerPacking = computeShulkerPacking(rawMaterials);

  return {
    placedMaterials,
    rawMaterials,
    craftingSteps,
    smeltingItems,
    coalCost,
    unexpanded,
    shulkerPacking,
  };
}
