/**
 * tools.js — サバイバルツールパネル
 *
 * 3Dビューの右サイドパネル内「🔧 サバイバルツール」セクションのイベント配線。
 * app インスタンス経由で bufferCache / coordsCache にアクセスする。
 */

import { generateScaffolding, generateInversion, convertResultToLitematic, downloadBuffer } from '../../main.js';

const $ = id => document.getElementById(id);

// Saved original structure state so any preview can be undone.
// Set once before the first preview render; reset when structure changes.
let _savedOriginalState = null; // { coords, size, blockId? }

// lightpatch でハイライトする光源ブロック ID
const LIGHT_BLOCK_IDS = [
  'minecraft:shroomlight', 'minecraft:soul_lantern', 'minecraft:lantern',
  'minecraft:glowstone', 'minecraft:sea_lantern', 'minecraft:jack_o_lantern',
  'minecraft:lit_pumpkin', 'minecraft:redstone_lamp', 'minecraft:lit_redstone_lamp',
  'minecraft:magma_block',
];

// scaffold プレビュー用ブロック ID
// 注: minecraft:scaffolding は半透明テクスチャでビューワに見えにくいため、
// 確実に水色で表示される light_blue_concrete を視覚マーカーとして使用する。
// 実際の .litematic 保存時は scaffold データから minecraft:scaffolding に書き戻される。
const SCAFFOLD_BLOCK_ID = 'minecraft:light_blue_concrete';

export function initToolsPanel(app) {
  // ── 構造セレクターの同期 ────────────────────────────────────────────────
  app.refreshToolsStructureSelect = () => _refreshSelect(app);

  // ── ボタン配線 ──────────────────────────────────────────────────────────
  $('btn-tool-scaffold')?.addEventListener('click', () => _runScaffold(app));
  $('btn-tool-hollow')?.addEventListener('click',   () => _runInvert(app, 'hollow'));
  $('btn-tool-invert')?.addEventListener('click',   () => _runInvert(app, 'invert'));
  $('btn-tool-lightpatch')?.addEventListener('click', () => _runInvert(app, 'lightpatch'));

  // ── 地面Y 自動検出ボタン ─────────────────────────────────────────────
  $('btn-scaffold-autoground')?.addEventListener('click', () => _autoDetectGround(app));

  // ── 構造選択変更 → 地面Y自動セット + プレビュー状態リセット ──────────
  $('tools-structure-select')?.addEventListener('change', () => {
    _savedOriginalState = null;
    _autoDetectGround(app, true);
  });

  // ── プレビュー「元に戻す」ボタン（動的に生成されるため委譲で捕捉）────
  document.addEventListener('click', (e) => {
    if (e.target?.id === 'btn-undo-preview') _restoreOriginalInViewer(app);
  });

  // 錆止めプリセット
  $('btn-preset-wax')?.addEventListener('click', () => {
    const fromVal = $('replace-from')?.value;
    if (!fromVal) { app._toast?.('置換元を先に選んでください', 'error'); return; }
    const waxedIds = fromVal.split(',').map(id =>
      id.startsWith('minecraft:waxed_') ? id : 'minecraft:waxed_' + id.replace('minecraft:', '')
    );
    const toId   = waxedIds.join(',');
    const toName = waxedIds.length === 1
      ? (app.langData?.[waxedIds[0]] || waxedIds[0].replace('minecraft:', ''))
      : `${waxedIds.length}件を錆止め`;
    if ($('replace-to'))      $('replace-to').value       = toId;
    if ($('replace-to-name')) $('replace-to-name').textContent = toName;
    app._toast?.('🛡️ 錆止め状態にセットしました');
  });
}

// ── 構造セレクター更新 ─────────────────────────────────────────────────────
function _refreshSelect(app) {
  const sel = $('tools-structure-select');
  if (!sel) return;
  const project    = app._currentProject?.();
  const structures = project?.structures ?? [];
  const prev       = sel.value;
  sel.innerHTML = structures.length === 0
    ? '<option value="">— 構造がありません —</option>'
    : structures.map(s => `<option value="${s.id}">${_esc(s.name || s.fileName || s.id)}</option>`).join('');
  if (prev && structures.some(s => s.id === prev)) sel.value = prev;
  _autoDetectGround(app, true);
}

// ── 地面Y 自動検出 ────────────────────────────────────────────────────────
function _autoDetectGround(app, silent = false) {
  const structId = $('tools-structure-select')?.value;
  if (!structId) return;
  const coords = app.coordsCache?.get(structId);
  if (!coords || coords.length === 0) return;
  const minY  = Math.min(...coords.map(c => c.y));
  const input = $('tools-scaffold-groundy');
  if (input) input.value = minY;
  if (!silent) app._toast?.(`🏗️ 地面Y を ${minY} に自動設定しました`);
}

// ── 足場生成 ──────────────────────────────────────────────────────────────
async function _runScaffold(app) {
  const structId = $('tools-structure-select')?.value;
  if (!structId) { app._toast?.('構造を選択してください', 'error'); return; }

  const coords = app.coordsCache?.get(structId);
  if (!coords || coords.length === 0) {
    app._toast?.('座標データがありません。ファイルを再読み込みしてください', 'error');
    return;
  }

  const inputEl = $('tools-scaffold-groundy');
  let groundY   = parseInt(inputEl?.value ?? '0', 10);
  const autoMinY = Math.min(...coords.map(c => c.y));
  if (groundY === 0 && autoMinY !== 0) {
    groundY = autoMinY;
    if (inputEl) inputEl.value = groundY;
  }

  const targetBlocks = coords
    .filter(c => c.blockId !== 'minecraft:air' && c.blockId !== 'air')
    .map(c => [c.x, c.y, c.z]);

  const resultEl = $('tool-scaffold-result');

  try {
    const { data, metadata } = await generateScaffolding({ targetBlocks, groundY });

    if (resultEl) {
      const uncovered = metadata.uncoveredCount ?? 0;
      resultEl.classList.remove('hidden');
      resultEl.innerHTML = `
        <div class="result-stat">足場ブロック: ${(metadata.totalScaffoldBlocks ?? 0).toLocaleString()} 個</div>
        <div class="result-stat">支柱数: ${metadata.pillarCount ?? 0}</div>
        ${uncovered > 0 ? `<div style="color:var(--accent)">⚠️ 未到達: ${uncovered} ブロック（手動補完が必要）</div>` : ''}
        <div style="display:flex;gap:0.4rem;margin-top:0.4rem;flex-wrap:wrap">
          <button class="mc-btn secondary small" id="btn-preview-scaffold">👁 3Dプレビュー</button>
          <button class="mc-btn primary small" id="btn-save-scaffold">💾 .litematic 保存</button>
        </div>
      `;
      $('btn-preview-scaffold')?.addEventListener('click', () =>
        _previewScaffoldInViewer(app, data, coords, structId)
      );
      $('btn-save-scaffold')?.addEventListener('click', () =>
        _saveResultAsLitematic(app, data, 'scaffold', structId)
      );
    }
  } catch (err) {
    app._toast?.('足場生成エラー: ' + err.message, 'error');
  }
}

// ── 足場 3Dプレビュー ─────────────────────────────────────────────────────
async function _previewScaffoldInViewer(app, dataBuf, originalCoords, structId) {
  let json;
  try {
    json = JSON.parse(new TextDecoder().decode(dataBuf));
  } catch {
    app._toast?.('プレビューデータの解析に失敗しました', 'error');
    return;
  }

  // 元の構造 coords にスキャフォールド(水色)を上乗せ
  const scaffoldSet = new Set((json.scaffoldBlocks ?? []).map(([x,y,z]) => `${x},${y},${z}`));

  const project   = app._currentProject?.();
  const structure = project?.structures.find(s => s.id === structId);

  // 元構造の座標 + 足場ブロックをマージ
  const combined = [...originalCoords];
  for (const [x, y, z] of (json.scaffoldBlocks ?? [])) {
    const key = `${x},${y},${z}`;
    if (!combined.some(c => `${c.x},${c.y},${c.z}` === key)) {
      combined.push({ x, y, z, blockId: SCAFFOLD_BLOCK_ID });
    }
  }

  if (combined.length === 0) {
    app._toast?.('表示できるブロックがありません', 'error');
    return;
  }

  // Switch to the 3D viewer tab only if not already there. Triggering the tab
  // button click on the active tab re-runs _initViewer3DTab() → _load3DView()
  // asynchronously, which races our loadStructure() call below and overwrites
  // the preview with the original (un-scaffolded / un-inverted) structure.
  if (app.currentTab !== 'viewer3d') {
    document.querySelector('[data-tab="viewer3d"]')?.click();
    // Wait one microtask so the async _load3DView() chain (if any) starts
    // before our preview render — but since our render is sync after this
    // and _load3DView is async, the preview will end up as the FINAL state.
    await new Promise(r => setTimeout(r, 0));
  }
  const viewer = app.viewer3d;
  if (!viewer) { app._toast?.('3Dビューが未初期化です', 'error'); return; }

  try {
    if (!viewer.isInitialized) await viewer.init();
    _saveOriginalState(app, structId);
    const size = structure?.size ?? { x: 64, y: 64, z: 64 };
    viewer.loadStructure(combined, size, { autoFocus: true });
    viewer.setHighlightBlocks([SCAFFOLD_BLOCK_ID]);
    _makeMeshesXrayed(viewer, SCAFFOLD_BLOCK_ID);

    // Show undo button inside the scaffold result section
    const resultEl = $('tool-scaffold-result');
    if (resultEl && !resultEl.querySelector('#btn-undo-preview')) {
      resultEl.insertAdjacentHTML('beforeend', _undoButtonHtml());
    }
    app._toast?.(`👁 足場 ${json.scaffoldBlocks?.length ?? 0} ブロックを水色でプレビュー`);
  } catch (err) {
    app._toast?.('プレビュー表示エラー: ' + err.message, 'error');
  }
}

/**
 * Override material flags on every InstancedMesh whose blockId matches so
 * that the cubes render on top of opaque walls (x-ray effect). Used for
 * scaffold/light/marker preview blocks.
 */
function _makeMeshesXrayed(viewer, blockId) {
  if (!viewer?.meshes) return;
  const target = blockId.toLowerCase();
  for (const mesh of viewer.meshes) {
    if (mesh.userData?.blockId?.toLowerCase() !== target) continue;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m) continue;
      m.depthTest  = false;
      m.depthWrite = false;
      m.transparent = true;
      m.needsUpdate = true;
    }
    mesh.renderOrder = 999; // draw after everything else
  }
}

// ── 反転系（hollow / invert / lightpatch）─────────────────────────────────
async function _runInvert(app, mode) {
  const structId = $('tools-structure-select')?.value;
  if (!structId) { app._toast?.('構造を選択してください', 'error'); return; }

  const buf = app.bufferCache?.get(structId);
  if (!buf) {
    app._toast?.('元バッファがありません。ファイルを再アップロードしてください', 'error');
    return;
  }

  const project   = app._currentProject?.();
  const structure = project?.structures.find(s => s.id === structId);
  const modeLabel = { hollow: 'ハリボテ', invert: '掘削ガイド', lightpatch: '湧き潰し' }[mode] ?? mode;
  const resultEl  = $(`tool-${mode}-result`);

  try {
    const copy   = buf.slice(0);
    const result = await generateInversion(copy, { mode });
    if (!result?.data) return;

    const stats  = result.metadata ?? {};
    // モード別の主要カウントを選ぶ
    const count =
      mode === 'hollow'     ? (stats.replacedCount ?? 0)
      : mode === 'invert'   ? (stats.solidCount     ?? stats.markerCount ?? 0)
      : mode === 'lightpatch' ? (stats.patchCount   ?? 0)
      : null;

    const extra = mode === 'lightpatch' && (stats.slabPatternCount ?? 0) > 0
      ? `<div class="result-stat" style="color:var(--accent)">うちスラブ隠し: ${stats.slabPatternCount} 箇所</div>`
      : '';

    if (resultEl) {
      resultEl.classList.remove('hidden');
      resultEl.innerHTML = `
        ${count != null ? `<div class="result-stat">対象: ${count.toLocaleString()} ブロック</div>` : ''}
        ${extra}
        <div style="display:flex;gap:0.4rem;margin-top:0.4rem;flex-wrap:wrap">
          <button class="mc-btn secondary small" id="btn-preview-${mode}">👁 3Dプレビュー</button>
          <button class="mc-btn primary small" id="btn-save-${mode}">💾 .litematic 保存</button>
        </div>
      `;
      $(`btn-preview-${mode}`)?.addEventListener('click', () =>
        _previewInViewer(app, result.data, mode, structId)
      );
      $(`btn-save-${mode}`)?.addEventListener('click', () =>
        _saveResultAsLitematic(app, result.data, mode, structId)
      );
    }
  } catch (err) {
    app._toast?.(`${modeLabel}生成エラー: ` + err.message, 'error');
  }
}

// ── 3Dビューへのプレビュー表示（invert / hollow / lightpatch）────────────
async function _previewInViewer(app, dataBuf, mode, structId) {
  let json;
  try {
    json = JSON.parse(new TextDecoder().decode(dataBuf));
  } catch {
    app._toast?.('プレビューデータの解析に失敗しました', 'error');
    return;
  }

  const [SX, SY, SZ] = json.dimensions ?? [0, 0, 0];
  const palette = json.palette ?? [];
  const indices  = json.indices  ?? [];

  if (!SX || !SY || !SZ || !palette.length || !indices.length) {
    app._toast?.('プレビューデータが空です', 'error');
    return;
  }

  const AIR_NAMES = new Set(['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air', 'air']);
  const coords = [];
  for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
  for (let z = 0; z < SZ; z++) {
    const flat    = SZ * SY * x + SZ * y + z;
    const palIdx  = indices[flat];
    const block   = palette[palIdx];
    if (!block) continue;
    const name = block.name ?? block.Name ?? 'minecraft:air';
    if (AIR_NAMES.has(name)) continue;
    coords.push({ x, y, z, blockId: name, states: block.states ?? {} });
  }

  if (coords.length === 0) {
    app._toast?.('プレビュー: 表示できるブロックがありません', 'error');
    return;
  }

  // Switch to the 3D viewer tab only if not already there. Triggering the tab
  // button click on the active tab re-runs _initViewer3DTab() → _load3DView()
  // asynchronously, which races our loadStructure() call below and overwrites
  // the preview with the original (un-scaffolded / un-inverted) structure.
  if (app.currentTab !== 'viewer3d') {
    document.querySelector('[data-tab="viewer3d"]')?.click();
    // Wait one microtask so the async _load3DView() chain (if any) starts
    // before our preview render — but since our render is sync after this
    // and _load3DView is async, the preview will end up as the FINAL state.
    await new Promise(r => setTimeout(r, 0));
  }
  const viewer = app.viewer3d;
  if (!viewer) { app._toast?.('3Dビューが未初期化です', 'error'); return; }

  try {
    if (!viewer.isInitialized) await viewer.init();
    if (structId) _saveOriginalState(app, structId);
    viewer.loadStructure(coords, { x: SX, y: SY, z: SZ }, { autoFocus: true });

    // ハイライト対象: モード別
    const hlIds = mode === 'lightpatch' ? LIGHT_BLOCK_IDS
                : mode === 'invert'     ? ['minecraft:glowstone']
                : [];

    if (hlIds.length > 0) {
      viewer.setHighlightBlocks(hlIds);
      for (const id of hlIds) _makeMeshesXrayed(viewer, id);
    }

    // Show undo button inside the mode result section
    const resultEl = $(`tool-${mode}-result`);
    if (resultEl && !resultEl.querySelector('#btn-undo-preview')) {
      resultEl.insertAdjacentHTML('beforeend', _undoButtonHtml());
    }

    const hlCount = hlIds.length > 0
      ? coords.filter(c => hlIds.some(id => c.blockId === id)).length
      : 0;
    const hlMsg = hlCount > 0 ? `（光源 ${hlCount} 箇所をハイライト）` : '';
    app._toast?.(`👁 ${coords.length.toLocaleString()} ブロックをプレビュー表示${hlMsg}`);
  } catch (err) {
    app._toast?.('プレビュー表示エラー: ' + err.message, 'error');
  }
}

// ── Phase 3 結果を .litematic として保存 ─────────────────────────────────
async function _saveResultAsLitematic(app, dataBuf, mode, structId) {
  let json;
  try {
    json = JSON.parse(new TextDecoder().decode(dataBuf));
  } catch {
    app._toast?.('結果データの解析に失敗しました', 'error');
    return;
  }

  const project = app._currentProject?.();
  const structure = project?.structures.find(s => s.id === structId);
  const baseName = (structure?.name || structure?.fileName || 'structure').replace(/\.(mcstructure|litematic|nbt)$/i, '');
  const filename = `${baseName}_${mode}.litematic`;

  const payload = mode === 'scaffold'
    ? { scaffoldBlocks: json.scaffoldBlocks ?? [], name: `${baseName}_scaffold` }
    : { dimensions: json.dimensions, palette: json.palette, indices: json.indices, name: `${baseName}_${mode}` };

  try {
    const { data } = await convertResultToLitematic(payload);
    downloadBuffer(data, filename);
    app._toast?.(`💾 ${filename} を保存しました`);
  } catch (err) {
    app._toast?.('.litematic 変換エラー: ' + err.message, 'error');
  }
}

function _esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── プレビュー前に元の構造状態を保存 ─────────────────────────────────────
function _saveOriginalState(app, structId) {
  if (_savedOriginalState) return; // already saved — don't overwrite
  const coords = app.coordsCache?.get(structId);
  const project = app._currentProject?.();
  const structure = project?.structures.find(s => s.id === structId);
  if (!coords) return;
  _savedOriginalState = {
    coords,
    size: structure?.size ?? { x: 64, y: 64, z: 64 },
  };
}

// ── 元の構造に戻す ──────────────────────────────────────────────────────────
async function _restoreOriginalInViewer(app) {
  const saved = _savedOriginalState;
  if (!saved) { app._toast?.('戻せる状態がありません', 'error'); return; }
  const viewer = app.viewer3d;
  if (!viewer) return;
  if (!viewer.isInitialized) await viewer.init();
  viewer.loadStructure(saved.coords, saved.size, { autoFocus: false });
  viewer.setHighlightBlocks([]);
  _savedOriginalState = null;
  app._toast?.('↩ 元の構造に戻しました');
}

// ── 「元に戻す」ボタンを挿入するHTML ──────────────────────────────────────
function _undoButtonHtml() {
  return `<button class="mc-btn secondary small" id="btn-undo-preview" style="margin-top:0.4rem;width:100%">↩ 元の構造に戻す</button>`;
}
