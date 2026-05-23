/**
 * crafting-tree.js — シュルカーパッキング計算
 *
 * 過去には flattenMaterialList / expandCraftingTree / computeFullMaterialPlan
 * を実装していたが、UI から参照されないまま未使用化したため Phase 4 整理で削除。
 * 現在 active な export は computeShulkerPacking のみ (panels/materials.js が使用)。
 */

// ─────────────────────────────────────────────────────────────────────────────
// computeShulkerPacking
// ─────────────────────────────────────────────────────────────────────────────

/** Max stack size for non-stackable items. */
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
 *   boxes: Array<Array<{ id: string, count: number }>>,
 *   totalBoxes: number,
 *   totalSlots: number,
 *   summary: { totalItems: number, totalStacks: number }
 * }}
 */
export function computeShulkerPacking(materials) {
  const slots = [];
  let totalItems = 0;

  for (const [id, count] of materials) {
    const ss         = stackSize(id);
    const fullStacks = Math.floor(count / ss);
    const remainder  = count % ss;
    totalItems += count;

    for (let i = 0; i < fullStacks; i++) slots.push({ id, count: ss });
    if (remainder > 0)                   slots.push({ id, count: remainder });
  }

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
