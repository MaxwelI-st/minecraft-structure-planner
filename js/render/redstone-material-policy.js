/**
 * redstone-material-policy.js
 *
 * wire / repeater / comparator を colorMode に関わらず常に「様式化マテリアル」で
 * 描画するためのポリシー。実テクスチャモードだと配線・トーチの位置が読みにくく
 * なるため、回路の視認性を最優先する。
 *
 * 視認性ガイドライン:
 *   - 基盤は明るめのスムーズストーン風 (床に置いたとき配線が映える)
 *   - 配線/トーチは powered で鮮やかな赤、消灯はくすんだマルーン (コントラスト大)
 *   - リピーター: 入力 → 出力 の向きを示す黒い「矢印」マーカー
 *   - コンパレーター: compare=赤トーチ / subtract=紫トーチ + 上面に紫の「-」印
 */

export function isMaterialRedstoneDevice(blockId) {
  const id = String(blockId || '').replace(/^minecraft:/, '').toLowerCase();
  return id === 'redstone_wire'
    || /^(unpowered_|powered_)?repeater$/.test(id)
    || /^(unpowered_|powered_)?comparator$/.test(id);
}

function _bool(v) {
  return v === true || v === 1 || v === '1' || v === 'true';
}

export function getRedstoneMaterialColors(blockId, states = {}) {
  const id = String(blockId || '').replace(/^minecraft:/, '').toLowerCase();
  const powered = id.startsWith('powered_')
    || _bool(states?.powered) || _bool(states?.output_lit_bit);

  if (id === 'redstone_wire') {
    // 実色は viewer3d.js の per-instance color で signal 強度に応じて差し替える。
    // ここではベースを白にして HSL/RGB ベースの per-instance 着色が素直に乗るようにする。
    return { dust: 0xffffff, line: 0xffffff };
  }

  if (/^(unpowered_|powered_)?(repeater|comparator)$/.test(id)) {
    // comparator の subtract モード判定
    const isComparator = /comparator/.test(id);
    const subtract = isComparator && (
      _bool(states?.output_subtract_bit) || states?.mode === 'subtract'
      || states?.__comparator_subtract === true
    );
    return {
      // ── 基盤 (スムーズストーン風) ──
      // 明るめの中灰色で、上の赤い配線・トーチが映えるようにする。
      // テスト要件: side < top (上面が明るく光が当たって見える)、
      // かつ十分明るくて床配色との同化を避ける。
      side:   0x8a8a8a,
      top:    0xc0c0c0,
      bottom: 0x6a6a6a,
      // ── 配線・トーチ ──
      // powered: 鮮やかな赤+発光 / unpowered: くすんだマルーン
      circuit:  powered ? 0xff3838 : 0x8a1a1a,
      torch:    powered ? 0xff6050 : 0x701818,
      emissive: powered ? 0x882020 : 0x000000,
      // ── リピーター: 方向矢印 (黒で目立たせる) ──
      arrow:    0x1a1a1a,
      // ── コンパレーター: モードマーカー ──
      // subtract=紫 (引き算なので「マイナス的」な印象) / compare=濃い赤 (通常)
      modeColor:    subtract ? 0x9a30c8 : 0xff3838,
      modeEmissive: subtract ? 0x3a0c4a : 0x000000,
      subtract,
    };
  }

  return null;
}
