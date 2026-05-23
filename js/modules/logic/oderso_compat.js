/**
 * OderSoClient Schematics互換のためのLitematicパレット安全化モジュール。
 * 互換モードフラグが立っている場合のみ _convertParsedToLitematic から呼ばれる。
 *
 * 設計原則:
 * - レッドストーン系ブロックはホワイトリストで除外（装置破壊防止）
 * - slab/stairs/fence/wall/door/trapdoor も除外（P1-Bで別途正規化）
 * - 変換はパレット上で行う（BlockStatesのビット列は変更不要）
 * - 変換件数と内容を返値に含め、UIに警告表示できるようにする
 */

// 無条件にair化するID（Javaでブロックとして存在しないもの）
const ALWAYS_AIR = new Set([
  'minecraft:frame',                // 額縁: Javaではエンティティ、Bedrockではブロック
  'minecraft:glow_frame',           // 光る額縁: 同上
  'minecraft:moving_block',         // ピストン移動中: 一時的ブロック
  'minecraft:piston_arm_collision', // ピストン腕: 同上
]);

// air化しない（手を加えない）ホワイトリスト
// レッドストーン系: 状態が壊れると装置が動かなくなるため
const REDSTONE_SAFE = new Set([
  'minecraft:redstone_wire',
  'minecraft:repeater',
  'minecraft:comparator',
  'minecraft:observer',
  'minecraft:piston',
  'minecraft:sticky_piston',
  'minecraft:piston_head',
  'minecraft:moving_piston',
  'minecraft:redstone_torch',
  'minecraft:redstone_wall_torch',
  'minecraft:lever',
  'minecraft:stone_button',
  'minecraft:oak_button',
  'minecraft:spruce_button',
  'minecraft:birch_button',
  'minecraft:jungle_button',
  'minecraft:acacia_button',
  'minecraft:dark_oak_button',
  'minecraft:mangrove_button',
  'minecraft:bamboo_button',
  'minecraft:cherry_button',
  'minecraft:crimson_button',
  'minecraft:warped_button',
  'minecraft:polished_blackstone_button',
  'minecraft:stone_pressure_plate',
  'minecraft:oak_pressure_plate',
  'minecraft:spruce_pressure_plate',
  'minecraft:birch_pressure_plate',
  'minecraft:jungle_pressure_plate',
  'minecraft:acacia_pressure_plate',
  'minecraft:dark_oak_pressure_plate',
  'minecraft:mangrove_pressure_plate',
  'minecraft:bamboo_pressure_plate',
  'minecraft:cherry_pressure_plate',
  'minecraft:crimson_pressure_plate',
  'minecraft:warped_pressure_plate',
  'minecraft:light_weighted_pressure_plate',
  'minecraft:heavy_weighted_pressure_plate',
  'minecraft:polished_blackstone_pressure_plate',
  'minecraft:rail',
  'minecraft:powered_rail',
  'minecraft:detector_rail',
  'minecraft:activator_rail',
  'minecraft:tripwire',
  'minecraft:tripwire_hook',
  'minecraft:target',
  'minecraft:daylight_detector',
  'minecraft:hopper',
  'minecraft:dropper',
  'minecraft:dispenser',
  'minecraft:redstone_lamp',
  'minecraft:sculk_sensor',
  'minecraft:calibrated_sculk_sensor',
]);

// slab/stairs等の接尾辞: ID正規化と責任分離のため除外
const VARIANT_SUFFIXES = [
  '_slab', '_stairs', '_fence', '_fence_gate', '_wall',
  '_door', '_trapdoor', '_sign', '_hanging_sign',
];

/**
 * パレットをOderSoClient互換に安全化する。
 *
 * @param {Array<{Name: string, Properties?: Object}>} palette - Java NBT形式のパレット
 * @param {Object} opts
 * @param {boolean} [opts.meridianMode=false] - Meridian型（負Y）対応モード（将来用）
 * @returns {{ palette: Array, log: Array<{original, replacement, reason, count}> }}
 */
export function sanitizeForOderso(palette, opts = {}) {
  const log = [];
  const countMap = new Map(); // key → {replacement, reason, count}

  const newPalette = palette.map(entry => {
    const id = entry.Name;
    const props = entry.Properties ? { ...entry.Properties } : {};

    // 1. 無条件air化（Javaにブロックとして存在しない）
    if (ALWAYS_AIR.has(id)) {
      const key = id;
      if (!countMap.has(key)) countMap.set(key, { replacement: 'minecraft:air', reason: 'Javaでブロックとして存在しない', count: 0 });
      countMap.get(key).count++;
      return { Name: 'minecraft:air', Properties: {} };
    }

    // 2. rail 系: 必須 state の補完 (M-B-06)
    //    plain rail は powered を持たない。powered_rail/detector_rail/activator_rail は powered 必須。
    if (id === 'minecraft:rail') {
      let changed = false;
      if (!props.shape) { props.shape = 'north_south'; changed = true; }
      if (props.waterlogged === undefined) { props.waterlogged = 'false'; changed = true; }
      if (changed) {
        const key = `${id}.補完`;
        if (!countMap.has(key)) countMap.set(key, { replacement: 'デフォルト補完', reason: '必須stateが欠落', count: 0 });
        countMap.get(key).count++;
      }
      return { Name: id, Properties: props };
    }
    if (id === 'minecraft:powered_rail' || id === 'minecraft:detector_rail' || id === 'minecraft:activator_rail') {
      let changed = false;
      if (!props.shape) { props.shape = 'north_south'; changed = true; }
      if (props.powered === undefined) { props.powered = 'false'; changed = true; }
      if (props.waterlogged === undefined) { props.waterlogged = 'false'; changed = true; }
      if (changed) {
        const key = `${id}.補完`;
        if (!countMap.has(key)) countMap.set(key, { replacement: 'デフォルト補完', reason: '必須stateが欠落', count: 0 });
        countMap.get(key).count++;
      }
      return { Name: id, Properties: props };
    }

    // 3. レッドストーン系: 除外（手を加えない）
    if (REDSTONE_SAFE.has(id)) {
      return entry; // 変更なし
    }

    // 4. slab/stairs系: 除外（P1-Bで別途正規化）
    if (VARIANT_SUFFIXES.some(s => id.endsWith(s))) {
      return entry; // 変更なし
    }

    // 5. beehive: honey_level の型チェック (M-B-07: 空文字列も補完対象)
    if (id === 'minecraft:beehive' || id === 'minecraft:bee_nest') {
      const hl = props.honey_level;
      if (hl === undefined || hl === '') {
        props.honey_level = '0';
        const key = `${id}.honey_level`;
        if (!countMap.has(key)) countMap.set(key, { replacement: 'honey_level=0', reason: 'honey_levelが欠落/空値', count: 0 });
        countMap.get(key).count++;
      } else {
        const num = Number(hl);
        if (!Number.isInteger(num) || num < 0 || num > 5) {
          props.honey_level = '0';
          const key = `${id}.honey_level`;
          if (!countMap.has(key)) countMap.set(key, { replacement: 'honey_level=0', reason: 'honey_levelが不正値', count: 0 });
          countMap.get(key).count++;
        }
      }
      return { Name: id, Properties: props };
    }

    return entry; // それ以外は変更なし
  });

  // countMapをlogに変換
  for (const [key, val] of countMap) {
    log.push({ original: key, replacement: val.replacement, reason: val.reason, count: val.count });
  }

  return { palette: newPalette, log };
}
