import { computeShulkerPacking } from '../../modules/logic/crafting-tree.js';
import { getBlockColor } from '../../render/viewer3d.js';

function _colorHex(id) {
  const c = getBlockColor(id);
  return '#' + c.toString(16).padStart(6, '0');
}

const $ = id => document.getElementById(id);

export function initMaterialsPanel(app) {
  $('shulker-pack-details')?.addEventListener('toggle', (e) => {
    if (e.target.open) _renderShulkerPack(app);
  });

  app.onMaterialsUpdated = () => {
    if ($('shulker-pack-details')?.open) _renderShulkerPack(app);
  };
}

function _toMap(app) {
  const mats = app._integratedMaterials;
  if (!mats || mats.length === 0) return null;
  const result = new Map();
  for (const r of mats) {
    if (r && r.id && typeof r.count === 'number' && isFinite(r.count)) {
      result.set(r.id, r.count);
    }
  }
  return result.size > 0 ? result : null;
}

function _name(app, id) {
  if (!id) return '不明';
  return (app.langData && app.langData[id]) || String(id).replace('minecraft:', '');
}

// ── シュルカーパッキング ────────────────────────────────────────────
function _renderShulkerPack(app) {
  const body = $('shulker-pack-body');
  if (!body) return;

  try {
    const matMap = _toMap(app);
    if (!matMap) {
      body.innerHTML = '<p class="empty-hint">素材がありません</p>';
      return;
    }

    const pack = computeShulkerPacking(matMap);
    const { boxes, totalBoxes, totalSlots } = pack;

    const summaryHtml = '<div class="shulker-summary">'
      + '<div><div class="shulker-summary-num">' + totalBoxes + '</div>'
      + '<div class="shulker-summary-label">シュルカーボックス</div></div>'
      + '<div><div class="shulker-summary-num" style="font-size:1.3rem">' + totalSlots + '</div>'
      + '<div class="shulker-summary-label">使用スロット</div></div>'
      + '<div><div class="shulker-summary-num" style="font-size:1.3rem">' + (totalBoxes * 27 - totalSlots) + '</div>'
      + '<div class="shulker-summary-label">空きスロット</div></div>'
      + '</div>';

    const boxesHtml = boxes.map((slots, i) => {
      const slotCells = Array.from({ length: 27 }, (_, j) => {
        const slot = slots[j];
        if (!slot) return '<div class="shulker-slot empty"></div>';
        const label = _name(app, slot.id);
        const emoji = _blockEmoji(slot.id);
        const color = _colorHex(slot.id);
        return '<div class="shulker-slot" title="' + label + ' × ' + slot.count + '" style="--slot-color:' + color + '">'
          + '<div class="slot-bg"></div>'
          + '<span class="slot-emoji">' + emoji + '</span>'
          + '<span class="slot-count">' + slot.count + '</span>'
          + '</div>';
      }).join('');
      return '<div class="shulker-box-card">'
        + '<div class="shulker-box-header">📦 Box ' + (i + 1) + ' / ' + totalBoxes + '</div>'
        + '<div class="shulker-grid">' + slotCells + '</div>'
        + '</div>';
    }).join('');

    body.innerHTML = summaryHtml + '<div class="shulker-boxes">' + boxesHtml + '</div>';

  } catch (err) {
    body.innerHTML = '<p class="empty-hint" style="color:var(--red)">エラー: ' + err.message + '</p>';
    console.error('[materials] _renderShulkerPack error:', err);
  }
}

function _blockEmoji(id) {
  const s = String(id || '').replace('minecraft:', '');
  if (s.includes('log') || s.includes('wood'))     return '🪵';
  if (s.includes('stone') || s.includes('cobble'))  return '🪨';
  if (s.includes('sand'))   return '🏖';
  if (s.includes('glass'))  return '🪟';
  if (s.includes('wool'))   return '🧶';
  if (s.includes('iron'))   return '⚙️';
  if (s.includes('gold'))   return '✨';
  if (s.includes('diamond')) return '💎';
  if (s.includes('coal'))   return '⛏';
  if (s.includes('torch') || s.includes('light') || s.includes('glow')) return '💡';
  if (s.includes('water'))  return '💧';
  if (s.includes('leaf') || s.includes('leave')) return '🍃';
  if (s.includes('dirt') || s.includes('grass')) return '🌱';
  if (s.includes('plank'))  return '🪵';
  if (s.includes('brick'))  return '🧱';
  if (s.includes('slab') || s.includes('stair')) return '📐';
  return '📦';
}
