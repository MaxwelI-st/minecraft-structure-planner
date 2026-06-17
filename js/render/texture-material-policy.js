const BLENDED_PATTERNS = [
  /(^|_)glass($|_)/,
  /(^|_)ice($|_)/,
  /(^|_)water($|_)/,
  /(^|_)portal($|_)/,
  /slime_block$/,
  /honey_block$/,
];

const CUTOUT_PATTERNS = [
  /leaves$/,
  /(^|_)(vine|fern|grass|sapling)($|_)/,
  /(^|_)(flower|mushroom|roots|bush|lichen|cobweb|seagrass|kelp)($|_)/,
  /(^|_)(door|trapdoor|ladder|rail|chain|iron_bars|scaffolding|lantern|campfire)($|_)/,
  /(^|_)(pane|coral|bamboo|sugar_cane|candle)($|_)/,
  /(^|_)redstone_(wire|torch)($|_)/,
  /(^|_)(repeater|comparator)($|_)/,
];

function localId(blockId) {
  return String(blockId || '').toLowerCase().replace(/^minecraft:/, '');
}

export function getTextureAlphaMode(blockId, layer = 'all') {
  if (layer === 'overlay') return 'cutout';
  const id = localId(blockId);
  if (id === 'grass_block' || id === 'grass' || id === 'flower_pot') return 'opaque';
  if (BLENDED_PATTERNS.some(pattern => pattern.test(id))) return 'blend';
  if (CUTOUT_PATTERNS.some(pattern => pattern.test(id))) return 'cutout';
  return 'opaque';
}

export function getTextureMaterialOptions(blockId, layer = 'all') {
  const mode = getTextureAlphaMode(blockId, layer);
  if (mode === 'blend') {
    return { transparent: true, alphaTest: 0.02, depthWrite: false };
  }
  if (mode === 'cutout') {
    return { transparent: false, alphaTest: 0.1, depthWrite: true };
  }
  return { transparent: false, alphaTest: 0, depthWrite: true };
}
