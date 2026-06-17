const CDN = 'https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures';
const WIKI_IMAGE_BASE = 'https://minecraft.wiki/images';

// Wiki inventory image names are display names, not registry IDs.
const WIKI_NAME_OVERRIDES = Object.freeze({
  iron_block: 'Block_of_Iron',
  raw_iron_block: 'Block_of_Raw_Iron',
  gold_block: 'Block_of_Gold',
  raw_gold_block: 'Block_of_Raw_Gold',
  diamond_block: 'Block_of_Diamond',
  emerald_block: 'Block_of_Emerald',
  coal_block: 'Block_of_Coal',
  lapis_block: 'Block_of_Lapis_Lazuli',
  redstone_block: 'Block_of_Redstone',
  netherite_block: 'Block_of_Netherite',
  quartz_block: 'Block_of_Quartz',
  amethyst_block: 'Block_of_Amethyst',
  copper_block: 'Block_of_Copper',
  hay_block: 'Hay_Bale',
  nether_brick: 'Nether_Bricks',
  frame: 'Item_Frame',
  glow_frame: 'Glow_Item_Frame',
});

const ID_OVERRIDES = Object.freeze({
  brick_block: 'bricks',
  iron_chain: 'chain',
  nether_brick: 'nether_bricks',
});

function titleCaseId(id) {
  return id.split('_').map(word => (
    word ? word[0].toUpperCase() + word.slice(1) : ''
  )).join('_');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function rawBlockId(blockId) {
  return String(blockId || '')
    .replace(/^minecraft:/, '')
    .split(/[|\[]/, 1)[0]
    .toLowerCase();
}

export function resolveInventoryIconId(blockId, bedrockToJava) {
  const raw = rawBlockId(blockId);
  const converted = bedrockToJava ? bedrockToJava(raw) : raw;
  return ID_OVERRIDES[converted] || converted;
}

export function getInventoryIconCandidates(blockId, {
  bedrockToJava,
  packUrl = null,
  includeLocal = false,
} = {}) {
  const raw = rawBlockId(blockId);
  const iconId = resolveInventoryIconId(blockId, bedrockToJava);
  const wikiName = WIKI_NAME_OVERRIDES[raw]
    || WIKI_NAME_OVERRIDES[iconId]
    || titleCaseId(iconId);

  const blockNames = unique([iconId, raw]);
  const blockUrls = blockNames.flatMap(name => [
    `${CDN}/block/${name}.png`,
    `${CDN}/block/${name}_side.png`,
    `${CDN}/block/${name}_top.png`,
    `${CDN}/block/${name}_front.png`,
  ]);

  return unique([
    packUrl,
    `${WIKI_IMAGE_BASE}/Invicon_${wikiName}.png`,
    `${WIKI_IMAGE_BASE}/Invicon_${titleCaseId(iconId)}.png`,
    `${CDN}/item/${iconId}.png`,
    ...blockUrls,
    includeLocal ? `/textures/${iconId}.png` : null,
  ]);
}
