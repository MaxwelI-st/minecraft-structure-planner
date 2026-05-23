/**
 * Bedrock/JavaのID揺れをJava正式IDに正規化する。
 *
 * 設計原則:
 * - フルブロック（単純な直方体）のみ変換する
 * - slab/stairs/fence/wall/door/trapdoor は変換しない（形状が異なり接尾辞が付く）
 * - 完全一致テーブル（正規表現を使わない）
 */

/**
 * フルブロックID変換テーブル（完全一致、優先度順）
 * slab/stairs等の派生形は含めない（接尾辞判定ガードで守る）
 */
const FULL_BLOCK_MAP = new Map([
  // ネザーレンガ系（最重要: 表示欠けの主原因）
  ['minecraft:nether_brick',         'minecraft:nether_bricks'],
  ['minecraft:red_nether_brick',     'minecraft:red_nether_bricks'],
  // 石レンガ系
  ['minecraft:stone_brick',          'minecraft:stone_bricks'],
  // レンガ
  ['minecraft:brick',                'minecraft:bricks'],
  // チゼルド
  ['minecraft:chiseled_stone_brick', 'minecraft:chiseled_stone_bricks'],
  // クラック
  ['minecraft:cracked_stone_brick',  'minecraft:cracked_stone_bricks'],
  // モス
  ['minecraft:mossy_stone_brick',    'minecraft:mossy_stone_bricks'],
  // エンドストーン
  ['minecraft:end_stone_brick',      'minecraft:end_stone_bricks'],
]);

// 変換を行わない接尾辞（これが付いているIDは無変換でスルー）
const SKIP_SUFFIXES = [
  '_slab', '_stairs', '_fence', '_fence_gate', '_wall',
  '_door', '_trapdoor', '_sign', '_hanging_sign',
  '_button', '_pressure_plate',
];

/**
 * IDに変換不要な接尾辞が含まれるか判定する
 * @param {string} id
 * @returns {boolean}
 */
function hasSkipSuffix(id) {
  return SKIP_SUFFIXES.some(s => id.endsWith(s));
}

/**
 * Litematic出力用のJava正式IDに変換する。
 * フルブロックのみ変換。slab/stairs等は変換しない。
 *
 * @param {string} id - 例: 'minecraft:nether_brick'
 * @returns {string} - 例: 'minecraft:nether_bricks'
 */
export function toJavaOutputId(id) {
  if (hasSkipSuffix(id)) return id; // 接尾辞ガード（誤変換防止の最重要ガード）
  return FULL_BLOCK_MAP.get(id) ?? id;
}

/**
 * テクスチャ解決用IDに変換する。
 * 現状は toJavaOutputId と同一だが、将来的に表示名の調整が必要になる場合に分離する。
 *
 * @param {string} id
 * @returns {string}
 */
export function toDisplayId(id) {
  return toJavaOutputId(id);
}

/**
 * パレット全体にID正規化を適用する。
 *
 * @param {Array<{Name: string, Properties?: Object}>} palette
 * @returns {{ palette: Array, changed: Array<{from: string, to: string}> }}
 */
export function normalizeJavaPalette(palette) {
  const changed = [];
  const newPalette = palette.map(entry => {
    const normalized = toJavaOutputId(entry.Name);
    if (normalized !== entry.Name) {
      changed.push({ from: entry.Name, to: normalized });
    }
    return { ...entry, Name: normalized };
  });
  return { palette: newPalette, changed };
}
