import { expandCraftingTree, computeShulkerPacking } from '../../modules/logic/crafting-tree.js';
import { getBlockColor } from '../../render/viewer3d.js';

function _colorHex(id) {
  const c = getBlockColor(id);
  return '#' + c.toString(16).padStart(6, '0');
}

const $ = id => document.getElementById(id);

export function initMaterialsPanel(app) {
  $('crafting-tree-details')?.addEventListener('toggle', (e) => {
    if (e.target.open) _renderCraftingTree(app);
  });
  $('shulker-pack-details')?.addEventListener('toggle', (e) => {
    if (e.target.open) _renderShulkerPack(app);
  });

  app.onMaterialsUpdated = () => {
    if ($('crafting-tree-details')?.open) _renderCraftingTree(app);
    if ($('shulker-pack-details')?.open)  _renderShulkerPack(app);
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

// ── クラフトツリー ──────────────────────────────────────────────────
function _renderCraftingTree(app) {
  const body = $('crafting-tree-body');
  if (!body) return;

  try {
    const matMap = _toMap(app);
    if (!matMap) {
      body.innerHTML = '<p class="empty-hint">素材がありません</p>';
      return;
    }

    const tree = expandCraftingTree(matMap);

    // rawMaterials: Map<id, number>
    const rawRows = [];
    for (const [id, count] of tree.rawMaterials) {
      const c = typeof count === 'number' ? count : 0;
      rawRows.push({ id, count: c });
    }
    rawRows.sort((a, b) => b.count - a.count);

    const tableRows = rawRows.map(({ id, count }) => {
      const stacks = Math.floor(count / 64);
      const rem = count % 64;
      const stackStr = stacks > 0
        ? (rem > 0 ? stacks + 'st+' + rem : stacks + 'st')
        : String(count);
      return '<tr>'
        + '<td class="mat-name">' + _name(app, id) + '</td>'
        + '<td class="mat-count">' + count.toLocaleString() + '</td>'
        + '<td class="mat-stacks">' + stackStr + '</td>'
        + '</tr>';
    }).join('');

    // craftingSteps: Array<{ output, outputCount, runs, type, inputs }>
    const craftSteps = (tree.craftingSteps || []).filter(s => s && s.type === 'craft');
    const smeltSteps = (tree.craftingSteps || []).filter(s => s && s.type === 'smelt');

    let stepsHtml = '';
    if (craftSteps.length > 0) {
      const rows = craftSteps.map(s => {
        const cnt = typeof s.outputCount === 'number' ? s.outputCount : 0;
        return '<div class="craft-step-row">'
          + '<span class="step-name">' + _name(app, s.output) + ' × ' + cnt.toLocaleString() + '</span>'
          + '<span>' + (s.runs || 0) + ' バッチ</span>'
          + '</div>';
      }).join('');
      stepsHtml = '<div class="craft-steps-section">'
        + '<div class="craft-steps-title">🔨 クラフト手順（' + craftSteps.length + ' 種）</div>'
        + rows + '</div>';
    }

    let smeltHtml = '';
    if (smeltSteps.length > 0) {
      const coalCost = tree.coalCost || 0;
      const rows = smeltSteps.map(s => {
        const cnt = typeof s.outputCount === 'number' ? s.outputCount : 0;
        return '<div class="craft-step-row">'
          + '<span class="step-name">' + _name(app, s.output) + ' × ' + cnt.toLocaleString() + '</span>'
          + '<span>' + (s.runs || 0) + ' 回</span>'
          + '</div>';
      }).join('');
      const coalLine = coalCost > 0
        ? '<div class="craft-coal-info">⛏ 石炭合計: <strong>' + coalCost + ' 個</strong> ('
          + Math.ceil(coalCost / 64) + ' スタック)</div>'
        : '';
      smeltHtml = '<div class="craft-steps-section">'
        + '<div class="craft-steps-title">🔥 精錬（' + smeltSteps.length + ' 種）</div>'
        + rows + coalLine + '</div>';
    }

    body.innerHTML = '<table class="craft-table">'
      + '<thead><tr><th>原材料</th><th style="text-align:right">数量</th><th style="text-align:right">スタック</th></tr></thead>'
      + '<tbody>' + (tableRows || '<tr><td colspan="3" class="empty-hint">展開可能な素材がありません</td></tr>') + '</tbody>'
      + '</table>'
      + stepsHtml + smeltHtml;

  } catch (err) {
    body.innerHTML = '<p class="empty-hint" style="color:var(--red)">エラー: ' + err.message + '</p>';
    console.error('[materials] _renderCraftingTree error:', err);
  }
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
