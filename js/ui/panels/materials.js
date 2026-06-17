import { computeShulkerPacking } from '../../modules/logic/crafting-tree.js';
import { getBlockColor } from '../../render/viewer3d.js';
import * as ResourcePack from '../../resourcepack.js';
import { getInventoryIconCandidates, resolveInventoryIconId } from '../item-icon-resolver.js';

function _textureCandidates(app, id) {
  const bedrockToJava = app._bedrockToJava?.bind(app);
  const imgId = resolveInventoryIconId(id, bedrockToJava);
  const guess = app._guessRawIdAndStates ? app._guessRawIdAndStates(id) : { states: undefined };
  let packUrl = null;
  if (ResourcePack.isLoaded()) {
    if (imgId === 'nether_bricks') {
      const faces = ResourcePack.getFaceUrls(id, { states: guess.states });
      packUrl = (faces && faces.found) ? (faces.top || faces.side || faces.all)?.url : null;
    } else {
      packUrl = ResourcePack.getItemTextureUrl(id) || null;
    }
  }
  return getInventoryIconCandidates(id, { bedrockToJava, packUrl });
}

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

    // Group consecutive same-content boxes for compact display
    const renderSlot = (slot) => {
      if (!slot) return '<div class="shulker-slot empty"></div>';
      const label = _name(app, slot.id);
      const emoji = _blockEmoji(slot.id);
      const color = _colorHex(slot.id);
      const cands = _textureCandidates(app, slot.id);
      const candAttr = cands.slice(1).join('|');
      return '<div class="shulker-slot" title="' + label + ' × ' + slot.count + '" style="--slot-color:' + color + '">'
        + '<div class="slot-bg"></div>'
        + '<img class="slot-tex" src="' + cands[0] + '" data-fallbacks="' + candAttr + '" alt=""'
        + ' onerror="(function(im){const f=(im.dataset.fallbacks||\'\').split(\'|\').filter(Boolean);if(f.length){im.src=f.shift();im.dataset.fallbacks=f.join(\'|\');}else{im.style.display=\'none\';im.nextElementSibling.style.display=\'inline\';}})(this)">'
        + '<span class="slot-emoji" style="display:none">' + emoji + '</span>'
        + '<span class="slot-count">' + slot.count + '</span>'
        + '</div>';
    };

    // 1ボックスが単一アイテムのみかチェックして連続グループ化
    const compactGroups = []; // {id, totalSlots, totalCount, boxIndices[]}
    const fullBoxes = []; // {idx, slots}
    let i = 0;
    while (i < boxes.length) {
      const slots = boxes[i].filter(Boolean);
      const ids = new Set(slots.map(s => s.id));
      // 27スロット全部単一アイテムで埋まってる場合のみコンパクト化
      if (ids.size === 1 && slots.length === 27) {
        const id = [...ids][0];
        const group = { id, totalSlots: slots.length, totalCount: slots.reduce((a,s)=>a+s.count,0), boxIndices: [i] };
        // 連続する同一単一アイテムBoxを合体
        let j = i + 1;
        while (j < boxes.length) {
          const ns = boxes[j].filter(Boolean);
          const nids = new Set(ns.map(s => s.id));
          if (nids.size === 1 && [...nids][0] === id) {
            group.totalSlots += ns.length;
            group.totalCount += ns.reduce((a,s)=>a+s.count,0);
            group.boxIndices.push(j);
            j++;
          } else break;
        }
        compactGroups.push(group);
        i = j;
      } else {
        fullBoxes.push({ idx: i, slots: boxes[i] });
        i++;
      }
    }

    let compactHtml = '';
    if (compactGroups.length > 0) {
      compactHtml = '<div class="shulker-compact-row">' + compactGroups.map(g => {
        const label = _name(app, g.id);
        const cands = _textureCandidates(app, g.id);
        const candAttr = cands.slice(1).join('|');
        const emoji = _blockEmoji(g.id);
        const boxCount = g.boxIndices.length;
        const range = boxCount === 1 ? `Box ${g.boxIndices[0]+1}` : `Box ${g.boxIndices[0]+1}–${g.boxIndices[boxCount-1]+1}`;
        return '<div class="shulker-compact" title="' + label + ' × ' + g.totalCount + '">'
          + '<img class="compact-tex" src="' + cands[0] + '" data-fallbacks="' + candAttr + '" alt=""'
          + ' onerror="(function(im){const f=(im.dataset.fallbacks||\'\').split(\'|\').filter(Boolean);if(f.length){im.src=f.shift();im.dataset.fallbacks=f.join(\'|\');}else{im.style.display=\'none\';im.nextElementSibling.style.display=\'inline\';}})(this)">'
          + '<span class="compact-emoji" style="display:none">' + emoji + '</span>'
          + '<div class="compact-info">'
          + '<div class="compact-name">' + label + '</div>'
          + '<div class="compact-meta">📦 ' + boxCount + ' Box（' + range + '）× ' + g.totalCount.toLocaleString() + '個</div>'
          + '</div></div>';
      }).join('') + '</div>';
    }

    const boxesHtml = fullBoxes.map(({ idx, slots }) => {
      const slotCells = Array.from({ length: 27 }, (_, j) => renderSlot(slots[j])).join('');
      return '<div class="shulker-box-card">'
        + '<div class="shulker-box-header">📦 Box ' + (idx + 1) + ' / ' + totalBoxes + '</div>'
        + '<div class="shulker-grid">' + slotCells + '</div>'
        + '</div>';
    }).join('');

    body.innerHTML = summaryHtml + compactHtml + '<div class="shulker-boxes">' + boxesHtml + '</div>';

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
