import { DotArtEditor, DOT_PALETTE } from './dotart.js';
import { Viewer3D } from './viewer3d.js';
import * as ResourcePack from './resourcepack.js';
import * as Image2Dot from './image2dot.js';
import { NBTParser, NBTWriter } from './nbt.js';
import { DOWNGRADE_PRESETS, applyToCoords, applyToResults, applicablePairsForStructure } from './replacements.js';

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── ProjectManager ───────────────────────────────────────────────────────────
class ProjectManager {
    static KEY = 'mc_planner_v2';

    static load() {
        try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
        catch { return []; }
    }

    static save(projects) {
        try {
            // Limit: 20 projects, strip coords + bufferCache before saving
            const toSave = projects.slice(0, 20).map(p => ({
                ...p,
                structures: p.structures.map(s => {
                    const { coords, rawBuffer, ...rest } = s;  // don't persist coords/buffer
                    return rest;
                })
            }));
            const json = JSON.stringify(toSave);
            // ~5MB が一般的な localStorage 上限。事前に検知して警告
            if (json.length > 4 * 1024 * 1024) {
                console.warn('プロジェクトJSON が 4MB 超：localStorage 上限に近づいています', json.length);
            }
            localStorage.setItem(this.KEY, json);
        } catch (e) {
            console.error('Save failed', e);
            // QuotaExceededError 対策：古いプロジェクトから削る
            if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message))) {
                const reduced = projects.slice(0, Math.max(1, Math.floor(projects.length / 2)));
                try {
                    localStorage.setItem(this.KEY, JSON.stringify(reduced));
                    console.warn('localStorage 容量超のため古いプロジェクトを削減:', projects.length, '→', reduced.length);
                } catch (e2) {
                    console.error('削減後も保存失敗:', e2);
                }
            }
        }
    }

    static create(name) {
        return { id: uid(), name, createdAt: Date.now(), structures: [] };
    }

    static addStructure(project, data) {
        // 最低限の整合性チェック
        if (!data.size || !Number.isFinite(data.size.x)) {
            throw new Error('構造データに size が不正です');
        }
        const s = {
            id: uid(),
            name: data.name,
            multiplier: 1,
            results: data.results,
            coords: data.coords,   // in-memory only
            size: data.size,
            totalCount: data.totalCount,
            uniqueCount: data.uniqueCount,
            totalSlots: data.totalSlots,
            parsedAt: Date.now()
        };
        project.structures.push(s);
        return s;
    }

    static getIntegrated(project, replacementsByStructure) {
        const totals = new Map();
        for (const s of project.structures) {
            const mult = s.multiplier || 1;
            const repMap = replacementsByStructure?.get(s.id);
            for (const r of s.results) {
                const id = repMap?.get(r.id) || r.id;
                const existing = totals.get(id) || 0;
                totals.set(id, existing + r.count * mult);
            }
        }
        return Array.from(totals.entries()).map(([id, count]) => {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            const slots = stacks + (remainder > 0 ? 1 : 0);
            const sample = project.structures.flatMap(s => s.results).find(r => r.id === id);
            return { id, count, stacks, remainder, slots, category: sample?.category || 'other' };
        }).sort((a, b) => b.count - a.count);
    }
}

// ─── App ──────────────────────────────────────────────────────────────────────
class App {
    constructor() {
        this.projects = ProjectManager.load();
        this.currentProjectId = null;
        this.currentTab = 'materials';
        this.langData = {};
        this.coordsCache = new Map(); // structureId → coords[]
        this.bufferCache = new Map(); // structureId → ArrayBuffer (再パース用)
        this.replacements = new Map(); // structureId → Map<fromId, toId>
        this.preparedItems = new Map(); // structureId → Set<blockId>
        this.currentFilter = 'all';
        this.viewer3d = null;
        this.dotArtEditor = null;
        this.worker = new Worker(new URL('./worker.js?v=2.5.6', import.meta.url), { type: 'module' });
        this.pendingParseResolve = null;
        this.settingsData = JSON.parse(localStorage.getItem('mc_planner_settings') || '{}');

        this._setupWorker();
        this._init();
    }

    async _init() {
        try {
            const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || './';
            const res = await fetch(baseUrl + 'data/lang_ja.json');
            this.langData = await res.json();
        } catch { console.warn('lang_ja.json not loaded'); }

        // Restore prepared items from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem('mc_planner_prepared') || '{}');
            for (const [pid, ids] of Object.entries(saved)) {
                this.preparedItems.set(pid, new Set(ids));
            }
        } catch { /* ignore */ }

        this._setupDOM();
        this._setupDragDrop();
        this._setupSidebarDropZone();
        this._renderProjectList();

        // 未捕捉エラー / Promise rejection をユーザに通知（無音でクラッシュさせない）
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error || e.message);
            this._toast?.('⚠️ 予期せぬエラー: ' + (e.message || 'unknown'), 'error');
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled rejection:', e.reason);
            this._toast?.('⚠️ 非同期エラー: ' + (e.reason?.message || e.reason || 'unknown'), 'error');
        });

        // Auto-restore saved resource pack
        this._autoRestorePack();
        // 構造バッファも IDB から復元（再アップロード不要に）
        this._autoRestoreStructureBuffers();

        // Restore last open project
        const lastId = localStorage.getItem('mc_planner_last');
        if (lastId && this.projects.find(p => p.id === lastId)) {
            this._selectProject(lastId);
        }
    }

    _setupWorker() {
        this.worker.onmessage = (e) => {
            const { success, error, results, coords, size, totalCount, uniqueCount, totalSlots } = e.data;
            this._hideLoading();
            if (this.pendingParseResolve) {
                this.pendingParseResolve({ success, error, results, coords, size, totalCount, uniqueCount, totalSlots });
                this.pendingParseResolve = null;
            }
        };
    }

    _parseFile(file) {
        return new Promise((resolve) => {
            this.pendingParseResolve = resolve;
            this._showLoading(`解析中: ${file.name}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                // 後で再パースできるように buffer をキャッシュへ渡す
                this._lastParsedBuffer = e.target.result;
                this.worker.postMessage({ buffer: e.target.result, fileName: file.name });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /** 既にメモリ上にある ArrayBuffer から再パースする（ファイル選択ダイアログを開かない） */
    _parseBuffer(buffer) {
        return new Promise((resolve) => {
            this.pendingParseResolve = resolve;
            this._showLoading('再解析中...');
            this.worker.postMessage({ buffer });
        });
    }

    // ─── DOM Setup ─────────────────────────────────────────────────────────────
    _setupDOM() {
        const $ = id => document.getElementById(id);

        // Sidebar buttons
        $('btn-new-project').onclick = () => this._showModal('modal-new-project');
        $('btn-go-home').onclick = () => this._goHome();
        $('btn-import-file').onclick = () => $('file-input').click();
        $('btn-confirm-new-project').onclick = () => {
            const name = $('new-project-name').value.trim();
            if (!name) { $('new-project-name').focus(); return; }
            const p = ProjectManager.create(name);
            this.projects.unshift(p);
            ProjectManager.save(this.projects);
            this._hideModal('modal-new-project');
            $('new-project-name').value = '';
            this._renderProjectList();
            this._selectProject(p.id);
        };
        $('new-project-name').addEventListener('keydown', e => {
            if (e.key === 'Enter') $('btn-confirm-new-project').click();
        });

        // Welcome screen
        $('btn-drop-file').onclick = () => $('file-input').click();
        $('btn-create-project-welcome').onclick = () => this._showModal('modal-new-project');

        // Project view
        $('btn-add-structure').onclick = () => {
            $('file-input').setAttribute('multiple', '');
            $('file-input').click();
        };
        $('btn-project-menu').onclick = (e) => this._showProjectMenu(e);

        // File input
        $('file-input').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            e.target.value = '';
            if (files.length > 0) this._handleFiles(files);
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
        });

        // Search & filter
        $('search-input').addEventListener('input', () => this._renderBlockList());
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentFilter = pill.dataset.category;
                this._renderBlockList();
            });
        });

        // Toggles
        $('id-toggle').addEventListener('change', () => this._renderBlockList());
        $('wiki-toggle').addEventListener('change', () => this._renderBlockList());

        // Modal close buttons
        document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
            btn.addEventListener('click', () => this._hideModal(btn.dataset.modal || btn.closest('.modal-overlay')?.id));
        });
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => { if (e.target === overlay) this._hideModal(overlay.id); });
        });

        // Multiplier modal
        this._setupMultiplierModal();

        // Settings tab - update stats when shown
        document.querySelector('[data-tab="settings"]').addEventListener('click', () => {
            const count = this.projects.length;
            $('setting-project-count').textContent = `${count} / 20`;
            try {
                const bytes = new Blob([localStorage.getItem('mc_planner_v2') || '']).size;
                $('setting-storage-size').textContent = bytes > 1024
                    ? `${(bytes / 1024).toFixed(1)} KB`
                    : `${bytes} B`;
            } catch { $('setting-storage-size').textContent = '—'; }
        });

        $('btn-export-all').onclick = () => this._exportAll();
        $('btn-import-data').onclick = () => this._importData();
        const csvBtn = document.getElementById('btn-export-csv');
        if (csvBtn) csvBtn.onclick = () => this._exportCsv();
        const mdBtn = document.getElementById('btn-copy-md');
        if (mdBtn) mdBtn.onclick = () => this._copyAsMarkdown(mdBtn);
        $('btn-clear-all-data').onclick = async () => {
            if (confirm('全データを削除しますか？この操作は取り消せません（プロジェクト・構造バッファ・テクスチャパック含む）。')) {
                localStorage.clear();
                try { await ResourcePack.clearAllStructureBuffers(); } catch (_) {}
                try { await ResourcePack.clearSavedPack(); } catch (_) {}
                location.reload();
            }
        };

        // IndexedDB 完全削除（DB自体を消す）
        const resetIdbBtn = document.getElementById('btn-reset-idb');
        if (resetIdbBtn) resetIdbBtn.onclick = async () => {
            if (!confirm('IndexedDB を完全にリセットします（すべてのプロジェクト・テクスチャパック・構造バッファが消えます）。続行しますか？')) return;
            try { await ResourcePack.clearAllStructureBuffers(); } catch(_) {}
            try { await ResourcePack.clearSavedPack(); } catch(_) {}
            try {
                // DB ごと削除（バージョン衝突対策）
                if (typeof indexedDB !== 'undefined') {
                    const req = indexedDB.deleteDatabase('mc-planner');
                    await new Promise((res) => {
                        req.onsuccess = res; req.onerror = res; req.onblocked = res;
                        setTimeout(res, 2000);
                    });
                }
            } catch(_) {}
            try { localStorage.clear(); } catch(_) {}
            this._toast('🗑️ IDB完全リセット完了。リロードします...');
            setTimeout(() => location.reload(), 800);
        };
        $('btn-clear-struct-cache').onclick = async () => {
            if (!confirm('構造解析キャッシュをクリアしますか？\n次回読み込み時に全ての構造が最新ロジックで再解析されます。')) return;
            await ResourcePack.clearAllStructureBuffers();
            this._toast('🧹 解析キャッシュをクリアしました。ページをリロードしてください。');
            setTimeout(() => location.reload(), 1500);
        };

        // Dot art tab
        this._setupDotArtTab();

        // 3D view tab
        this._setup3DViewTab();
    }

    _setupMultiplierModal() {
        const $ = id => document.getElementById(id);
        let currentStructureId = null;

        document.querySelectorAll('.mult-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mult-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const v = btn.dataset.mult;
                const customInput = $('custom-mult-input');
                if (v === 'custom') {
                    customInput.style.display = 'block';
                    customInput.focus();
                } else {
                    customInput.style.display = 'none';
                }
            });
        });

        $('btn-confirm-mult').onclick = () => {
            const active = document.querySelector('.mult-btn.active');
            if (!active) return;
            let mult;
            if (active.dataset.mult === 'custom') {
                mult = parseInt($('custom-mult-input').value, 10) || 1;
            } else {
                mult = parseInt(active.dataset.mult, 10);
            }
            mult = Math.max(1, mult);

            // Apply to structure
            const project = this._currentProject();
            if (project && currentStructureId) {
                const s = project.structures.find(s => s.id === currentStructureId);
                if (s) {
                    s.multiplier = mult;
                    ProjectManager.save(this.projects);
                    this._renderMaterialsTab();
                }
            }
            this._hideModal('modal-structure');
        };

        // Expose setter
        this._openMultiplierModal = (structureId, currentMult) => {
            currentStructureId = structureId;
            document.querySelectorAll('.mult-btn').forEach(b => b.classList.remove('active'));
            const matchBtn = document.querySelector(`.mult-btn[data-mult="${currentMult}"]`);
            if (matchBtn) {
                matchBtn.classList.add('active');
                $('custom-mult-input').style.display = 'none';
            } else {
                document.querySelector('.mult-btn[data-mult="custom"]').classList.add('active');
                $('custom-mult-input').style.display = 'block';
                $('custom-mult-input').value = currentMult;
            }
            this._showModal('modal-structure');
        };
    }

    _setupDotArtTab() {
        const $ = id => document.getElementById(id);

        // Block palette
        const palette = $('block-palette');
        DOT_PALETTE.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'palette-btn';
            btn.title = p.name;
            btn.style.background = p.color;
            btn.dataset.id = p.id;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.dotArtEditor) this.dotArtEditor.setBlock(p.id);
            });
            palette.appendChild(btn);
        });
        palette.children[0]?.classList.add('active');

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.dotArtEditor) this.dotArtEditor.setTool(btn.dataset.tool);
            });
        });

        // Resize grid
        $('btn-resize-grid').onclick = () => {
            const w = parseInt($('grid-width').value, 10);
            const h = parseInt($('grid-height').value, 10);
            if (this.dotArtEditor && w >= 8 && h >= 8 && w <= 128 && h <= 128) {
                this.dotArtEditor.resize(w, h);
            }
        };

        $('btn-clear-canvas').onclick = () => {
            if (confirm('キャンバスをクリアしますか？')) this.dotArtEditor?.clear();
        };

        // ─── 画像→ドット絵 ─────────────────────────────────────
        const imgInput = $('img2dot-file');
        $('btn-img2dot-pick').onclick = () => imgInput.click();
        imgInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                this._showLoading('画像を読み込み中...');
                const img = await Image2Dot.loadImage(file);

                // dotArtEditor 初期化（未起動のとき）
                if (!this.dotArtEditor) this._initDotArt();

                const gridW = parseInt($('grid-width').value, 10) || 64;
                const gridH = parseInt($('grid-height').value, 10) || 64;
                const mode = $('img2dot-mode').value;
                const filterKey = $('img2dot-filter').value;
                const filter = Image2Dot.FILTER_PRESETS[filterKey] || null;
                const dithering = $('img2dot-dither').checked;

                const { grid, counts } = Image2Dot.convert(img, {
                    mode, gridW, gridH, paletteFilter: filter, dithering
                });

                // dotArtEditor のグリッドサイズに合わせる
                this.dotArtEditor.gridW = gridW;
                this.dotArtEditor.gridH = gridH;
                $('grid-width').value = gridW;
                $('grid-height').value = gridH;
                this.dotArtEditor.grid = grid;
                this.dotArtEditor._resize();
                this.dotArtEditor.render();
                this._updateDotArtMaterials();

                this._hideLoading();
                this._toast(`🖼️ ${counts.size}種類のブロックで生成完了`);
            } catch (err) {
                console.error(err);
                this._hideLoading();
                this._toast('❌ 変換失敗: ' + err.message, 'error');
            } finally {
                e.target.value = '';
            }
        });
        $('btn-export-dotart').onclick = () => this._updateDotArtMaterials();
        $('btn-export-png').onclick = () => this._exportDotArtPng();
    }

    _setup3DViewTab() {
        const $ = id => document.getElementById(id);

        const layerMin = $('layer-min');
        const layerMax = $('layer-max');
        const minVal = $('layer-min-val');
        const maxVal = $('layer-max-val');

        layerMin.addEventListener('input', () => { minVal.textContent = layerMin.value; });
        layerMax.addEventListener('input', () => { maxVal.textContent = layerMax.value; });

        $('btn-load-3d').onclick = () => this._load3DView();
        $('btn-reset-camera').onclick = () => this.viewer3d?.resetCamera();

        // 床タイプ切替
        $('floor-type-select').addEventListener('change', (e) => {
            if (this.viewer3d) this.viewer3d.setFloorType(e.target.value);
        });

        // ─── ブロック置換 ────────────────────────────────
        $('btn-replace-add').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            const from = $('replace-from').value;
            const to = $('replace-to').value;
            if (!from || !to || from === to) {
                this._toast('置換元と置換先が同じ、または未選択です', 'error');
                return;
            }
            let map = this.replacements.get(sel);
            if (!map) { map = new Map(); this.replacements.set(sel, map); }
            map.set(from, to);
            this._renderReplaceList(sel);
            this._renderProjectView(); // 素材リスト・breakdownにも反映
            this._toast(`置換追加: ${from.replace('minecraft:','')} → ${to.replace('minecraft:','')}`);
            // 3D 表示中なら即時反映
            if (this.viewer3d?.isInitialized) this._load3DView();
        };
        $('btn-replace-reset').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            this.replacements.delete(sel);
            this._renderReplaceList(sel);
            this._renderProjectView(); // 素材リスト・breakdownにも反映
            this._toast('置換をリセットしました');
            if (this.viewer3d?.isInitialized) this._load3DView();
        };

        // ─── コストダウン一括適用 ────────────────────────────
        $('btn-apply-downgrade').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) { this._toast('構造が選択されていません', 'error'); return; }
            const presetKey = $('downgrade-preset').value;
            if (!presetKey) { this._toast('プリセットを選んでください', 'error'); return; }
            const preset = DOWNGRADE_PRESETS[presetKey];
            if (!preset) return;
            const project = this._currentProject();
            const structure = project?.structures.find(s => s.id === sel);
            if (!structure) return;
            const applicable = applicablePairsForStructure(structure, preset.map);
            if (applicable.size === 0) {
                this._toast(`このプリセットで置換可能なブロックはありません`, 'error');
                return;
            }
            let map = this.replacements.get(sel);
            if (!map) { map = new Map(); this.replacements.set(sel, map); }
            for (const [from, to] of applicable.entries()) map.set(from, to);
            this._renderReplaceList(sel);
            this._renderProjectView();
            this._toast(`💰 ${preset.name}：${applicable.size}件の置換を適用`);
            if (this.viewer3d?.isInitialized) this._load3DView();
        };

        // ─── 置換後 .mcstructure ダウンロード（NBT 書き出し）────
        $('btn-export-mcstructure').onclick = () => this._exportMcStructure();

        // ─── サイドパネル開閉 ────────────────────────────────
        const panel = document.getElementById('viewer3d-side-panel');
        const togglePanel = (forceState) => {
            if (!panel) return;
            const willCollapse = forceState !== undefined ? forceState : !panel.classList.contains('collapsed');
            panel.classList.toggle('collapsed', willCollapse);
            try { localStorage.setItem('v3d_panel_collapsed', willCollapse ? '1' : '0'); } catch (_) {}
            // canvas resize 通知
            setTimeout(() => this.viewer3d?._handleResize?.(), 300);
        };
        const toggleBtn = document.getElementById('btn-toggle-3d-panel');
        const collapseBtn = document.getElementById('btn-collapse-3d-panel');
        if (toggleBtn) toggleBtn.onclick = () => togglePanel();
        if (collapseBtn) collapseBtn.onclick = () => togglePanel(true);
        // 起動時に状態復元
        try {
            if (localStorage.getItem('v3d_panel_collapsed') === '1') {
                panel?.classList.add('collapsed');
            }
        } catch (_) {}

        // 各 details の開閉状態も保存
        document.querySelectorAll('.v3d-section').forEach(sec => {
            const key = 'v3d_sec_' + sec.dataset.section;
            try {
                const saved = localStorage.getItem(key);
                if (saved !== null) sec.open = saved === '1';
            } catch (_) {}
            sec.addEventListener('toggle', () => {
                try { localStorage.setItem(key, sec.open ? '1' : '0'); } catch (_) {}
            });
        });
        
        // 構造変更時に置換UIを更新
        $('viewer3d-structure-select').addEventListener('change', () => {
            this._populateReplaceFrom();
            this._renderReplaceList($('viewer3d-structure-select').value);
        });

        // 表示色モード切替
        document.querySelectorAll('input[name="viewer3d-colormode"]').forEach(r => {
            r.addEventListener('change', () => {
                console.log(`--- App: colormode change detected: ${r.value} (checked: ${r.checked}) ---`);
                if (!r.checked || !this.viewer3d) return;
                this.viewer3d.setColorMode(r.value);
            });
        });

        // テクスチャパックアップロード
        const packInput = $('pack-file-input');
        $('btn-upload-pack').onclick = () => packInput.click();
        packInput.addEventListener('change', async (e) => {
            const f = e.target.files[0];
            if (!f) return;
            await this._handlePackFile(f, true);
            e.target.value = '';
        });
        $('btn-clear-pack').onclick = async () => {
            if (!confirm('保存されたテクスチャパックを削除しますか？')) return;
            await ResourcePack.clearSavedPack();
            ResourcePack.clear();
            const ps = $('pack-status');
            if (ps) ps.textContent = '未読込';
            const realRadio = document.querySelector('input[name="viewer3d-colormode"][value="realtexture"]');
            if (realRadio) {
                realRadio.disabled = true;
                if (realRadio.checked) {
                    const matRadio = document.querySelector('input[name="viewer3d-colormode"][value="material"]');
                    if (matRadio) matRadio.checked = true;
                    this.viewer3d?.setColorMode('material');
                }
            }
            this._toast('🗑️ テクスチャパックを忘れました');
            this._renderBlockList?.();
        };
    }

    /** 置換元 select に現構造のユニークブロックを、置換先には DOT_PALETTE を埋める */
    _populateReplaceFrom() {
        const $ = id => document.getElementById(id);
        const sel = $('viewer3d-structure-select').value;
        const project = this._currentProject();
        if (!project || !sel) return;
        const structure = project.structures.find(s => s.id === sel);
        if (!structure) return;

        // 置換元（このストラクチャに含まれるブロック）
        const fromSel = $('replace-from');
        fromSel.innerHTML = '';
        for (const r of (structure.results || [])) {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = (this.langData[r.id] || r.id.replace('minecraft:','')) + ` (${r.count})`;
            fromSel.appendChild(opt);
        }

        // 置換先（DOT_PALETTE + 主要な置換候補）
        const toSel = $('replace-to');
        if (toSel.children.length === 0) {
            const candidates = [
                'minecraft:oak_planks','minecraft:spruce_planks','minecraft:birch_planks',
                'minecraft:jungle_planks','minecraft:acacia_planks','minecraft:dark_oak_planks',
                'minecraft:cherry_planks','minecraft:pale_oak_planks','minecraft:mangrove_planks',
                'minecraft:crimson_planks','minecraft:warped_planks','minecraft:bamboo_planks',
                'minecraft:stone','minecraft:cobblestone','minecraft:stone_bricks','minecraft:smooth_stone',
                'minecraft:deepslate','minecraft:cobbled_deepslate','minecraft:polished_deepslate',
                'minecraft:bricks','minecraft:nether_bricks','minecraft:red_nether_bricks',
                'minecraft:white_concrete','minecraft:gray_concrete','minecraft:black_concrete',
                'minecraft:white_terracotta','minecraft:gray_terracotta','minecraft:black_terracotta',
                'minecraft:white_wool','minecraft:red_wool','minecraft:blue_wool',
                'minecraft:glass','minecraft:white_stained_glass','minecraft:black_stained_glass',
                'minecraft:oak_log','minecraft:spruce_log','minecraft:dark_oak_log','minecraft:cherry_log',
                'minecraft:moss_block','minecraft:grass_block','minecraft:dirt','minecraft:sand',
                'minecraft:quartz_block','minecraft:smooth_quartz','minecraft:diamond_block',
            ];
            for (const id of candidates) {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = (this.langData[id] || id.replace('minecraft:',''));
                toSel.appendChild(opt);
            }
        }
    }

    _renderReplaceList(structureId) {
        const list = document.getElementById('replace-list');
        if (!list) return;
        const map = this.replacements.get(structureId);
        if (!map || map.size === 0) { list.innerHTML = '<em>（置換なし）</em>'; return; }

        // テクスチャURL取得ヘルパー（パック読込中なら使う）
        const getThumbUrl = (blockId) => {
            try {
                if (!ResourcePack.isLoaded()) return null;
                const urls = ResourcePack.getFaceUrls(blockId, {});
                return urls?.top?.url || urls?.east?.url || null;
            } catch (_) { return null; }
        };

        list.innerHTML = '';
        for (const [from, to] of map.entries()) {
            const fn = this.langData[from] || from.replace('minecraft:','');
            const tn = this.langData[to] || to.replace('minecraft:','');
            const fromThumb = getThumbUrl(from);
            const toThumb = getThumbUrl(to);
            const thumbStyle = 'width:20px;height:20px;object-fit:cover;image-rendering:pixelated;border-radius:2px;vertical-align:middle;margin-right:4px;background:#333;';
            const fromImg = fromThumb ? `<img src="${fromThumb}" style="${thumbStyle}" title="${fn}">` : '';
            const toImg   = toThumb   ? `<img src="${toThumb}"   style="${thumbStyle}" title="${tn}">` : '';
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:0.2rem 0;gap:0.3rem;';
            row.innerHTML = `
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                    ${fromImg}${this._escape(fn)} → ${toImg}${this._escape(tn)}
                </span>
                <button class="mc-btn small" data-from="${from}" style="flex-shrink:0;padding:0 0.4rem;font-size:0.7rem">✕</button>
            `;
            list.appendChild(row);
        }
        list.querySelectorAll('button[data-from]').forEach(b => {
            b.onclick = () => {
                map.delete(b.dataset.from);
                this._renderReplaceList(structureId);
                this._renderProjectView();
                if (this.viewer3d?.isInitialized) this._load3DView();
            };
        });
    }

    /** coords / results に置換を適用したコピーを返す */
    _applyReplacements(structureId, coords) {
        const map = this.replacements.get(structureId);
        if (!map || map.size === 0) return coords;
        return coords.map(c => {
            const to = map.get(c.blockId);
            return to ? { ...c, blockId: to } : c;
        });
    }

    /** プロジェクト一覧エリアへの D&D（Canva風 UX） */
    _setupSidebarDropZone() {
        // セクション全体（プロジェクト見出し ＋ project-list ＋ "新規プロジェクト" ボタン）を覆う
        const zone = document.querySelector('.sidebar-section');
        if (!zone) return;
        let depth = 0;

        const onEnter = (e) => {
            if (!Array.from(e.dataTransfer?.types || []).includes('Files')) return;
            depth++;
            zone.classList.add('drop-target-active');
        };
        const onLeave = () => {
            depth = Math.max(0, depth - 1);
            if (depth === 0) zone.classList.remove('drop-target-active');
        };
        const onDrop = async (e) => {
            e.preventDefault(); e.stopPropagation();
            depth = 0;
            zone.classList.remove('drop-target-active');
            const files = [...(e.dataTransfer?.files || [])].filter(f => /\.(mcstructure|nbt)$/i.test(f.name));
            if (files.length === 0) {
                this._toast('⚠️ .mcstructure / .nbt ファイルのみドロップできます', 'error');
                return;
            }
            // 各ファイル＝1プロジェクトとして自動作成（複数ドロップ対応）
            for (const f of files) {
                try {
                    const name = f.name.replace(/\.(mcstructure|nbt)$/i, '');
                    const p = ProjectManager.create(name);
                    this.projects.unshift(p);
                    this._renderProjectList();
                    // selectProject 経由で構造を追加するために currentProjectId をセット
                    this.currentProjectId = p.id;
                    await this._handleFiles([f]);
                } catch (err) {
                    console.error('D&D import failed:', err);
                    this._toast(`❌ ${f.name}: ${err.message}`, 'error');
                }
            }
            this._toast(`📥 ${files.length}件のプロジェクトを追加`);
        };

        zone.addEventListener('dragenter', onEnter);
        zone.addEventListener('dragleave', onLeave);
        zone.addEventListener('dragover', (e) => {
            if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault();
        });
        zone.addEventListener('drop', onDrop);
    }

    // ─── Drag & Drop ───────────────────────────────────────────────────────────
    _setupDragDrop() {
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const zone = document.getElementById('drop-zone');
            if (zone) zone.classList.add('active');
        });

        document.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget) {
                const zone = document.getElementById('drop-zone');
                if (zone) zone.classList.remove('active');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const zone = document.getElementById('drop-zone');
            if (zone) zone.classList.remove('active');
            const files = Array.from(e.dataTransfer.files).filter(f => /\.(mcstructure|nbt)$/i.test(f.name));
            if (files.length > 0) this._handleFiles(files);
        });

        // 貼り付け (Ctrl+V) 対応
        window.addEventListener('paste', async (e) => {
            const items = e.clipboardData.items;
            const files = [];
            for (const item of items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && /\.(mcstructure|nbt)$/i.test(file.name)) files.push(file);
                }
            }
            if (files.length > 0) {
                this._handleFiles(files);
                return;
            }

            // テキスト（拡張機能からのJSON）チェック
            const text = e.clipboardData.getData('text');
            if (!text) return;

            try {
                const data = JSON.parse(text);
                if (data.source === 'MC_DOT_COUNTER') {
                    const name = data.name || 'Imported Dot Art';
                    const p = ProjectManager.create(name);
                    
                    // 拡張機能のデータをアプリの構造データ形式に変換
                    // data.results は [{id, count, ...}] であることを期待
                    ProjectManager.addStructure(p, {
                        name: 'Dot Art Data',
                        results: data.results,
                        size: { x: data.width || 128, y: 1, z: data.height || 128 },
                        totalCount: data.total,
                        uniqueCount: data.unique,
                        totalSlots: data.totalSlots,
                        coords: [] // 3D用の座標データはない
                    });

                    this.projects.unshift(p);
                    ProjectManager.save(this.projects);
                    this._renderProjectList();
                    this._selectProject(p.id);
                    this._toast('🎨 ドット絵データをインポートしました', 'success');
                }
            } catch (err) {
                // JSONでない場合は無視
            }
        });
    }

    // ─── File Handling ─────────────────────────────────────────────────────────
    async _handleFiles(files) {
        const mcFiles = files.filter(f => /\.(mcstructure|nbt)$/i.test(f.name));
        // 巨大ファイル警告（解凍後 100MB 超は警告のみ）
        for (const f of mcFiles) {
            if (f.size > 50 * 1024 * 1024) {
                if (!confirm(`${f.name} は ${(f.size/1048576).toFixed(1)}MB あります。解析に時間がかかったりブラウザがフリーズする可能性があります。続行しますか？`)) {
                    return;
                }
            }
        }
        if (mcFiles.length === 0) { this._toast('⚠️ .mcstructure または .nbt ファイルのみ対応', 'error'); return; }

        // If no project, create one from first file
        if (!this.currentProjectId) {
            const name = mcFiles[0].name.replace('.mcstructure', '');
            const p = ProjectManager.create(name);
            this.projects.unshift(p);
            ProjectManager.save(this.projects);
            this._renderProjectList();
            this._selectProject(p.id);
        }

        let successCount = 0;
        for (const file of mcFiles) {
            const data = await this._parseFile(file);
            if (!data.success) {
                this._toast(`❌ ${file.name}: ${data.error}`, 'error');
                continue;
            }
            const project = this._currentProject();
            const name = file.name.replace(/\.(mcstructure|nbt)$/i, '');
            // Check duplicate
            const existing = project.structures.find(s => s.name === name);
            const buf = this._lastParsedBuffer;
            let savedId = null;
            if (existing) {
                Object.assign(existing, {
                    results: data.results, size: data.size,
                    totalCount: data.totalCount, uniqueCount: data.uniqueCount,
                    totalSlots: data.totalSlots, parsedAt: Date.now()
                });
                this.coordsCache.set(existing.id, data.coords);
                if (buf) this.bufferCache.set(existing.id, buf);
                savedId = existing.id;
            } else {
                const s = ProjectManager.addStructure(project, { name, ...data });
                this.coordsCache.set(s.id, data.coords);
                if (buf) this.bufferCache.set(s.id, buf);
                savedId = s.id;
            }
            // IndexedDB に元バッファを永続化（次回起動時に再アップロード不要）
            if (buf && savedId) {
                ResourcePack.saveStructureBuffer(savedId, buf, name, data.edition || 'bedrock')
                    .catch(err => console.warn('IDB save structure failed:', err));
            }
            successCount++;
        }

        if (successCount > 0) {
            ProjectManager.save(this.projects);
            this._toast(`🎉 ${successCount}件の解析完了！`);
            this._renderProjectView();
        }
    }

    // ─── Project Management ────────────────────────────────────────────────────
    _currentProject() {
        return this.projects.find(p => p.id === this.currentProjectId);
    }

    _selectProject(id) {
        this.currentProjectId = id;
        localStorage.setItem('mc_planner_last', id);
        this._renderProjectList();
        this._renderProjectView();
    }

    _showProjectMenu(e) {
        const existing = document.getElementById('project-context-menu');
        if (existing) { existing.remove(); return; }

        const menu = document.createElement('div');
        menu.id = 'project-context-menu';
        menu.className = 'context-menu glass-card';
        const project = this._currentProject();
        menu.innerHTML = `
            <button class="context-item" id="ctx-rename">✏️ 名前を変更</button>
            <button class="context-item danger" id="ctx-delete">🗑️ プロジェクトを削除</button>
        `;
        menu.style.cssText = `position:fixed;top:${e.clientY + 8}px;right:16px;z-index:1000;min-width:200px;`;
        document.body.appendChild(menu);

        document.getElementById('ctx-rename').onclick = () => {
            const name = prompt('新しい名前:', project?.name);
            if (name?.trim() && project) {
                project.name = name.trim();
                ProjectManager.save(this.projects);
                this._renderProjectList();
                this._renderProjectView();
            }
            menu.remove();
        };
        document.getElementById('ctx-delete').onclick = async () => {
            if (confirm(`「${project?.name}」を削除しますか？`)) {
                // このプロジェクトに属する構造バッファを IDB から消す
                if (project?.structures) {
                    for (const s of project.structures) {
                        ResourcePack.deleteStructureBuffer(s.id).catch(()=>{});
                        this.bufferCache.delete(s.id);
                        this.coordsCache.delete(s.id);
                    }
                }
                this.projects = this.projects.filter(p => p.id !== this.currentProjectId);
                this.currentProjectId = null;
                ProjectManager.save(this.projects);
                this._renderProjectList();
                this._showWelcome();
            }
            menu.remove();
        };
        setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
    }

    // ─── Rendering ─────────────────────────────────────────────────────────────
    _renderProjectList() {
        const list = document.getElementById('project-list');
        list.innerHTML = '';
        if (this.projects.length === 0) {
            list.innerHTML = '<p class="empty-hint">プロジェクトなし</p>';
            return;
        }
        this.projects.forEach(p => {
            const item = document.createElement('div');
            item.className = `project-item-container ${p.id === this.currentProjectId ? 'active' : ''}`;
            const structCount = p.structures.length;
            item.innerHTML = `
                <button class="project-item-btn" title="${this._escape(p.name)} を選択">
                    <span class="pi-icon">📁</span>
                    <div class="pi-info">
                        <span class="pi-name">${this._escape(p.name)}</span>
                        <span class="pi-meta">${structCount}構造 · ${this._relDate(p.createdAt)}</span>
                    </div>
                </button>
                <button class="delete-btn" title="プロジェクトを削除">🗑️</button>
            `;
            
            // 選択処理
            item.querySelector('.project-item-btn').onclick = () => this._selectProject(p.id);
            
            // 個別削除処理
            item.querySelector('.delete-btn').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`プロジェクト「${p.name}」を削除しますか？`)) {
                    // IDBのバッファも削除
                    if (p.structures) {
                        for (const s of p.structures) {
                            ResourcePack.deleteStructureBuffer(s.id).catch(()=>{});
                            this.bufferCache.delete(s.id);
                            this.coordsCache.delete(s.id);
                        }
                    }
                    this.projects = this.projects.filter(x => x.id !== p.id);
                    if (this.currentProjectId === p.id) {
                        this.currentProjectId = null;
                        this._showWelcome();
                    }
                    ProjectManager.save(this.projects);
                    this._renderProjectList();
                }
            };
            
            list.appendChild(item);
        });
    }

    _goHome() {
        this.currentProjectId = null;
        try { localStorage.removeItem('mc_planner_last'); } catch (_) {}
        this._renderProjectList();
        this._showWelcome();
    }

    _showWelcome() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('project-view').classList.add('hidden');
    }

    _renderProjectView() {
        const project = this._currentProject();
        if (!project) { this._showWelcome(); return; }

        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('project-view').classList.remove('hidden');
        document.getElementById('project-title').textContent = project.name;
        document.getElementById('project-date').textContent = new Date(project.createdAt).toLocaleDateString('ja-JP');

        // 構造を追加・更新したあとに必ず素材一覧を再描画
        this._switchTab(this.currentTab, true);
    }

    _switchTab(tab, doRender = true) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== `panel-${tab}`));

        if (!doRender) return;
        if (tab === 'materials') this._renderMaterialsTab();
        else if (tab === 'dotart') this._initDotArt();
        else if (tab === 'viewer3d') this._initViewer3DTab();
    }

    _renderMaterialsTab() {
        const project = this._currentProject();
        if (!project) return;
        this._renderStructureCards(project);
        this._renderIntegratedStats(project);
        this._renderBlockList();
        // Update 3D structure select too
        this._updateViewer3DSelect(project);
    }

    _renderStructureCards(project) {
        const list = document.getElementById('structures-list');
        list.innerHTML = '';

        if (project.structures.length === 0) {
            list.innerHTML = '<p class="empty-hint">「構造を追加」で .mcstructure ファイルを追加してください</p>';
            return;
        }

        project.structures.forEach(s => {
            const card = document.createElement('div');
            card.className = 'structure-card glass-card';
            const hasCoords = this.coordsCache.has(s.id);
            card.innerHTML = `
                <div class="sc-icon">🏗️</div>
                <div class="sc-info">
                    <div class="sc-name">${this._escape(s.name)}</div>
                    <div class="sc-meta">
                        ${s.totalCount?.toLocaleString() || '?'}ブロック · ${s.uniqueCount || '?'}種類 ·
                        ${s.size ? `${s.size.x}×${s.size.y}×${s.size.z}` : ''}
                        ${hasCoords ? '<span class="badge-3d">3D対応</span>' : ''}
                    </div>
                </div>
                <div class="sc-actions">
                    <button class="mult-display mc-btn secondary small" data-sid="${s.id}">
                        ×${s.multiplier || 1}
                    </button>
                    <button class="sc-remove icon-btn" data-sid="${s.id}" title="削除">✕</button>
                </div>
            `;

            card.querySelector('.mult-display').onclick = () => {
                this._openMultiplierModal(s.id, s.multiplier || 1);
            };
            card.querySelector('.sc-remove').onclick = () => {
                if (confirm(`「${s.name}」を削除しますか？`)) {
                    project.structures = project.structures.filter(x => x.id !== s.id);
                    this.coordsCache.delete(s.id);
                    this.bufferCache.delete(s.id);
                    ResourcePack.deleteStructureBuffer(s.id).catch(()=>{});
                    ProjectManager.save(this.projects);
                    this._renderMaterialsTab();
                }
            };
            list.appendChild(card);
        });
    }

    _renderIntegratedStats(project) {
        const integrated = ProjectManager.getIntegrated(project, this.replacements);
        const totalBlocks = integrated.reduce((a, r) => a + r.count, 0);
        const totalSlots = integrated.reduce((a, r) => a + r.slots, 0);
        const shulkers = Math.ceil(totalSlots / 27);
        const totalStacks = Math.floor(totalBlocks / 64);

        this._setStatVal('stat-total', totalBlocks.toLocaleString());
        this._setStatVal('stat-unique', integrated.length.toLocaleString());
        this._setStatVal('stat-stacks', totalStacks.toLocaleString());
        this._setStatVal('stat-shulkers', shulkers.toLocaleString());

        // Store for filtering
        this._integratedMaterials = integrated;

        // 構造別 breakdown
        this._renderStructureBreakdown(project);
    }

    _renderStructureBreakdown(project) {
        const container = document.getElementById('structure-breakdown-content');
        if (!container) return;
        if (!project.structures || project.structures.length === 0) {
            container.innerHTML = '<p class="empty-hint">構造が登録されていません</p>';
            return;
        }
        container.innerHTML = project.structures.map(s => {
            const mult = s.multiplier || 1;
            // この構造の置換マップを適用したresultsを使う
            const repMap = this.replacements.get(s.id);
            let effectiveResults = s.results || [];
            if (repMap && repMap.size > 0) {
                effectiveResults = applyToResults(effectiveResults, repMap);
            }
            const top = effectiveResults.slice(0, 10);
            const rows = top.map(r => `
                <tr>
                    <td style="padding:0.25rem 0.5rem">${this._escape(this.langData[r.id] || r.id.replace('minecraft:',''))}</td>
                    <td style="padding:0.25rem 0.5rem;text-align:right;font-family:var(--font-mono);color:var(--accent)">${(r.count * mult).toLocaleString()}</td>
                    <td style="padding:0.25rem 0.5rem;text-align:right;color:var(--muted2);font-size:0.75rem">${Math.floor(r.count*mult/64)}st+${(r.count*mult)%64}</td>
                </tr>
            `).join('');
            return `
                <div class="breakdown-card glass-card" style="padding:0.75rem;margin-bottom:0.5rem">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                        <strong>${this._escape(s.name)} ×${mult}</strong>
                        <span style="font-size:0.75rem;color:var(--muted2)">${(s.totalCount||0).toLocaleString()}ブロック × ${mult} = <strong style="color:var(--accent)">${((s.totalCount||0)*mult).toLocaleString()}</strong>${repMap && repMap.size > 0 ? ' <span style="color:#fb8">(置換適用中)</span>' : ''}</span>
                    </div>
                    <table style="width:100%;font-size:0.8rem;border-collapse:collapse">
                        <thead>
                            <tr style="border-bottom:1px solid var(--border, rgba(255,255,255,0.1));color:var(--muted2);font-size:0.7rem">
                                <th style="text-align:left;padding:0.25rem 0.5rem">ブロック</th>
                                <th style="text-align:right;padding:0.25rem 0.5rem">個数</th>
                                <th style="text-align:right;padding:0.25rem 0.5rem">スタック</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    ${(s.results || []).length > 10 ? `<p style="font-size:0.7rem;color:var(--muted2);margin-top:0.4rem">…他 ${(s.results || []).length - 10} 種類</p>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * 置換後 .mcstructure をダウンロード
     * - bufferCache から元 ArrayBuffer を取り出して再パース
     * - palette[i].name に置換マップを適用（state は維持）
     * - NBTWriter で再シリアライズ
     */
    async _exportMcStructure() {
        const sel = document.getElementById('viewer3d-structure-select')?.value;
        if (!sel) { this._toast('構造が選択されていません', 'error'); return; }
        const buf = this.bufferCache.get(sel);
        if (!buf) { this._toast('元バッファがありません（ファイルを再アップロードしてください）', 'error'); return; }
        const project = this._currentProject();
        const structure = project?.structures.find(s => s.id === sel);
        if (!structure) return;
        const repMap = this.replacements.get(sel);
        if (!repMap || repMap.size === 0) {
            // 置換が無い場合でも元のまま再エクスポート可能
            if (!confirm('置換が設定されていません。元のファイルをそのままダウンロードしますか？')) return;
        }
        try {
            this._showLoading('NBT を再構築中...');
            // gzip 解凍が必要なら解凍
            const { decompressIfNeeded } = await import('./nbt.js');
            const data = await decompressIfNeeded(buf);
            const parser = new NBTParser(data, 'le');
            const parsed = parser.parse();

            const palette = parsed.value?.structure?.palette?.default?.block_palette;
            if (!palette) throw new Error('palette が見つかりません');

            // 置換適用
            let replacedCount = 0;
            if (repMap && repMap.size > 0) {
                for (const entry of palette) {
                    const newName = repMap.get(entry.name);
                    if (newName) {
                        entry.name = newName;
                        // 置換に伴って states を消すと一部のブロックは不安定なので維持
                        replacedCount++;
                    }
                }
            }

            const writer = new NBTWriter('le');
            writer.writeRoot(parsed);
            const out = writer.toArrayBuffer();

            const blob = new Blob([out], { type: 'application/octet-stream' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (structure.name || 'structure') + '_modified.mcstructure';
            a.click();
            URL.revokeObjectURL(a.href);

            this._hideLoading();
            this._toast(`💾 .mcstructure をダウンロード（${replacedCount}件の置換適用）`);
        } catch (err) {
            console.error(err);
            this._hideLoading();
            this._toast('❌ エクスポート失敗: ' + err.message, 'error');
        }
    }

    /**
     * 合計素材を Markdown チェックリストとしてクリップボードへコピー
     */
    async _copyAsMarkdown(btn) {
        if (!this._integratedMaterials || this._integratedMaterials.length === 0) {
            this._toast('合計素材がありません', 'error'); return;
        }
        const project = this._currentProject();
        const lines = [];
        lines.push(`### 🏰 ${project?.name || '建築'} 必要素材リスト`);
        const totalBlocks = this._integratedMaterials.reduce((a, r) => a + r.count, 0);
        const totalSlots = this._integratedMaterials.reduce((a, r) => a + r.slots, 0);
        const totalShulkers = Math.ceil(totalSlots / 27);
        lines.push(`> 合計: **${totalBlocks.toLocaleString()}ブロック / ${this._integratedMaterials.length}種類 / シュルカー箱 約${totalShulkers}個**`);
        lines.push('');
        for (const r of this._integratedMaterials) {
            const ja = this.langData[r.id] || r.id.replace('minecraft:', '');
            const sh = Math.floor(r.slots / 27);
            const shRem = r.slots % 27;
            const detail = sh > 0
                ? `${sh}シュルカー + ${shRem}スタック残 + ${r.remainder}個`
                : `${r.stacks}スタック + ${r.remainder}個`;
            lines.push(`- [ ] **${ja}**: ${r.count.toLocaleString()}個 (${detail})`);
        }
        // 構造別 breakdown も末尾に
        if (project && project.structures.length > 1) {
            lines.push('');
            lines.push('### 📋 構造別内訳');
            for (const s of project.structures) {
                const mult = s.multiplier || 1;
                lines.push(`- **${s.name}** ×${mult}: ${(s.totalCount * mult).toLocaleString()}ブロック / ${s.uniqueCount || '?'}種類`);
            }
        }
        const text = lines.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            // ボタンの一時テキスト変更でフィードバック
            if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = '✅ コピー完了';
                btn.disabled = true;
                setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1500);
            }
            this._toast('📋 Markdown をクリップボードにコピー');
        } catch (e) {
            // フォールバック: textarea で選択
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            this._toast('📋 コピー完了（フォールバック）');
        }
    }

    _exportCsv() {
        if (!this._integratedMaterials) { this._toast('合計素材がありません', 'error'); return; }
        const project = this._currentProject();
        const lines = [];
        lines.push('id,name_ja,count,stacks,remainder,slots,category');
        for (const r of this._integratedMaterials) {
            const ja = this.langData[r.id] || r.id.replace('minecraft:', '');
            lines.push([
                r.id,
                '"' + ja.replace(/"/g, '""') + '"',
                r.count,
                r.stacks,
                r.remainder,
                r.slots,
                r.category,
            ].join(','));
        }
        // UTF-8 BOM 付きで Excel が UTF-8 を正しく読む
        const bom = '\ufeff';
        const csv = bom + lines.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (project?.name || 'materials') + '_' + new Date().toISOString().slice(0,10) + '.csv';
        a.click();
        URL.revokeObjectURL(a.href);
        this._toast('📤 CSV をダウンロードしました');
    }

    _setStatVal(id, val) {
        const el = document.getElementById(id)?.querySelector('.stat-value');
        if (el) el.textContent = val;
    }

    /** 素材カードクリック時の 3D ハイライト切替 */
    _toggleHighlight(blockId, card) {
        if (!this.viewer3d || !this.viewer3d.isInitialized) {
            this._toast('3Dビューを開始してから使えます', 'error');
            return;
        }
        const current = this.viewer3d.getHighlighted();
        document.querySelectorAll('.block-card.highlighted').forEach(c => c.classList.remove('highlighted'));
        if (current === blockId) {
            this.viewer3d.clearHighlight();
            return;
        }
        this.viewer3d.highlightBlock(blockId);
        if (card) card.classList.add('highlighted');
        // 3D タブに自動切替（既に 3D の場合は何もしない）
        if (this.currentTab !== 'viewer3d') {
            this._toast(`🔍 ${this.langData[blockId] || blockId} をハイライト中（3Dビューに切替）`);
            this._switchTab('viewer3d', false); // 既存 mesh は維持
        } else {
            this._toast(`🔍 ${this.langData[blockId] || blockId} をハイライト中`);
        }
    }

    _renderBlockList() {
        const list = document.getElementById('block-list');
        if (!this._integratedMaterials) { list.innerHTML = ''; return; }

        const query = document.getElementById('search-input').value.toLowerCase();
        const showId = document.getElementById('id-toggle').checked;
        const showWiki = document.getElementById('wiki-toggle').checked;
        const prepared = this._preparedSet();

        const filtered = this._integratedMaterials.filter(r => {
            const rawId = r.id.replace('minecraft:', '');
            const jaName = (this.langData[r.id] || rawId).toLowerCase();
            const matchQ = jaName.includes(query) || rawId.toLowerCase().includes(query);
            const matchCat = this.currentFilter === 'all' || r.category === this.currentFilter;
            return matchQ && matchCat;
        });

        list.innerHTML = '';
        const frag = document.createDocumentFragment();

        filtered.forEach(item => {
            const rawId = item.id.replace('minecraft:', '');
            const jaName = this.langData[item.id] || rawId;
            const displayName = showId ? rawId : jaName;
            const isPrepared = prepared.has(item.id);

            const imgId = this._bedrockToJava(rawId);
            const wikiName = imgId.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('_');

            // 1) リソースパックがロード済みなら最優先で top 面 (or all) のテクスチャを使う
            // flat ID を逆引きで Bedrock 汎用ID + states に推定（精度は現状粗いが有用）
            const guess = this._guessRawIdAndStates(item.id);
            let packUrl = null;
            if (ResourcePack.isLoaded()) {
                const faceObj = ResourcePack.getFaceUrls(item.id, guess)?.top;
                packUrl = faceObj ? (typeof faceObj === 'string' ? faceObj : faceObj.url) : null;
            }

            const sources = [
                ...(packUrl ? [packUrl] : []),
                `https://minecraft.wiki/images/Invicon_${wikiName}.png`,
                `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${imgId}.png`,
                `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${imgId}.png`,
                `/textures/${imgId}.png`,
                `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2270%22>📦</text></svg>`
            ];
            const wikiUrl = `https://ja.minecraft.wiki/w/${encodeURIComponent(jaName)}`;
            const shulkerCount = Math.floor(item.slots / 27);
            const shulkerRem = item.slots % 27;

            const card = document.createElement('div');
            card.className = `block-card glass-card ${isPrepared ? 'prepared' : ''}`;
            card.dataset.id = item.id;
            // クリックで 3D ビューにハイライト送信（トグル動作）
            card.addEventListener('click', (e) => {
                if (e.target.closest('.prepared-label, .wiki-overlay, .block-name')) return;
                this._toggleHighlight(item.id, card);
            });

            card.innerHTML = `
                ${showWiki ? `<a href="${wikiUrl}" target="_blank" class="wiki-overlay" title="Wikiで開く">📖</a>` : ''}
                <label class="prepared-label" title="準備済み">
                    <input type="checkbox" class="prepared-check" data-id="${item.id}" ${isPrepared ? 'checked' : ''}>
                    <span class="check-vis"></span>
                </label>
                <div class="block-icon-wrap">
                    <img src="${sources[0]}"
                         onerror="if(this.dataset.i===undefined)this.dataset.i=0;let srcs=${JSON.stringify(sources).replace(/"/g, '&quot;')};if(++this.dataset.i&lt;srcs.length)this.src=srcs[this.dataset.i];"
                         class="block-icon-img" alt="">
                </div>
                <div class="block-info">
                    <div class="block-name ${showId ? 'is-id' : ''}" data-fullid="${item.id}">${this._escape(displayName)}</div>
                    <div class="block-count">${item.count.toLocaleString()}</div>
                    <div class="block-stack">${item.stacks}st + ${item.remainder}個</div>
                    ${shulkerCount > 0 ? `<div class="shulker-badge">🔮 ${shulkerCount}箱 +${shulkerRem}st</div>` : ''}
                </div>
            `;

            // Copy on name click
            card.querySelector('.block-name').addEventListener('click', () => {
                navigator.clipboard.writeText(item.id).then(() => this._toast(`📋 ${item.id}`));
            });

            // Prepared checkbox
            card.querySelector('.prepared-check').addEventListener('change', (e) => {
                const pid = this.currentProjectId;
                if (!this.preparedItems.has(pid)) this.preparedItems.set(pid, new Set());
                const set = this.preparedItems.get(pid);
                if (e.target.checked) set.add(item.id); else set.delete(item.id);
                this._savePrepared();
                card.classList.toggle('prepared', e.target.checked);
            });

            frag.appendChild(card);
        });

        list.appendChild(frag);
    }

    _preparedSet() {
        return this.preparedItems.get(this.currentProjectId) || new Set();
    }

    _savePrepared() {
        const data = {};
        for (const [pid, set] of this.preparedItems) data[pid] = [...set];
        localStorage.setItem('mc_planner_prepared', JSON.stringify(data));
    }

    _exportDotArtPng() {
        if (!this.dotArtEditor) { this._toast('まだドット絵がありません', 'error'); return; }
        // ユーザーに倍率を尋ねる（4xでだいたいスマホ壁紙にちょうどいい）
        const scaleStr = prompt('画像スケール倍率 (1 / 4 / 16)', '4');
        const scale = parseInt(scaleStr, 10);
        if (!scale || scale < 1 || scale > 32) return;

        // 一時 canvas に高解像度で描画
        const ed = this.dotArtEditor;
        const tmp = document.createElement('canvas');
        tmp.width = ed.gridW * scale;
        tmp.height = ed.gridH * scale;
        const ctx = tmp.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        // 元のキャンバスを cellSize ではなく scale で再描画する代わりに、
        // 元キャンバスを drawImage してアップスケール
        ctx.drawImage(ed.canvas, 0, 0, tmp.width, tmp.height);
        const url = tmp.toDataURL('image/png');

        const proj = this._currentProject();
        const name = (proj?.name || 'dotart') + '_' + new Date().toISOString().slice(0,10) + '_x' + scale + '.png';
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        this._toast(`🖼️ ${name} を保存`);
    }

    // ─── Dot Art ───────────────────────────────────────────────────────────────
    _initDotArt() {
        const canvas = document.getElementById('dotart-canvas');
        if (!this.dotArtEditor) {
            this.dotArtEditor = new DotArtEditor(canvas, {
                gridW: 32, gridH: 32, cellSize: 16,
                onUpdate: (counts) => this._renderDotArtMaterials(counts)
            });
            this._setupDotArt();
        }
    }

    _setupDotArt() {
        const $ = id => document.getElementById(id);
        const ed = this.dotArtEditor;

        // パレット生成
        const paletteBox = $('block-palette');
        paletteBox.innerHTML = '';
        import('./dotart.js').then(m => {
            m.DOT_PALETTE.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'palette-btn';
                btn.style.backgroundColor = p.color;
                btn.title = p.name;
                btn.dataset.id = p.id;
                if (p.id === ed.selectedBlock) btn.classList.add('active');
                btn.onclick = () => {
                    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    ed.setBlock(p.id);
                };
                paletteBox.appendChild(btn);
            });
        });

        // ツール
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ed.setTool(btn.dataset.tool);
            };
        });

        // リサイズ
        $('btn-resize-grid').onclick = () => {
            const w = parseInt($('grid-width').value);
            const h = parseInt($('grid-height').value);
            if (w >= 8 && w <= 2048 && h >= 8 && h <= 2048) {
                ed.resize(w, h);
                this._toast(`📏 グリッドを ${w}x${h} にリサイズ`);
            }
        };

        // クリア
        $('btn-clear-canvas').onclick = () => {
            if (confirm('キャンバスをクリアしますか？')) ed.clear();
        };

        // 画像から生成
        const fileIn = $('img2dot-file');
        $('btn-img2dot-pick').onclick = () => fileIn.click();
        fileIn.onchange = (e) => {
            const f = e.target.files[0];
            if (f) this._img2dotConvert(f);
            e.target.value = '';
        };

        // 座標計算
        $('btn-map-calc-pos').onclick = () => {
            const x = parseInt($('map-cur-x').value) || 0;
            const z = parseInt($('map-cur-z').value) || 0;
            import('./image2dot.js').then(m => {
                const snapped = m.snapToMapGrid(x, z);
                const shifted = m.shiftForEdgeExclusion(snapped.x, snapped.z);
                const info = $('map-pos-info');
                info.style.display = 'block';
                info.innerHTML = `
                    <div>最寄り地図角: <strong>${snapped.x}, ${snapped.z}</strong></div>
                    <div style="color:var(--accent);margin-top:0.2rem">💡 推奨設置座標 (縁を回避):<br><strong>X: ${shifted.x}, Z: ${shifted.z}</strong></div>
                    <div style="font-size:0.6rem;margin-top:0.2rem;opacity:0.8">※統合版の仕様により、地図の最外周1ブロックは色が化けることがあるため、+1ずらして配置することを推奨します。</div>
                `;
            });
        };

        // 構造としてプロジェクトに追加
        $('btn-dotart-to-struct').onclick = () => this._addDotArtAsStructure();
    }

    async _img2dotConvert(file) {
        this._showLoading('画像をブロックに変換中...');
        try {
            const m = await import('./image2dot.js');
            const img = await m.loadImage(file);

            // 統合版地図仕様の読み取り
            const scale = parseInt(document.getElementById('map-scale').value);
            const tilesX = parseInt(document.getElementById('map-tiles-x').value) || 1;
            const tilesY = parseInt(document.getElementById('map-tiles-y').value) || 1;
            
            const unitSize = m.MAP_BASE_SIZE * Math.pow(2, scale);
            const gridW = unitSize * tilesX;
            const gridH = unitSize * tilesY;

            const mode = document.getElementById('img2dot-mode').value;
            const filterKey = document.getElementById('img2dot-filter').value;
            const dither = document.getElementById('img2dot-dither').checked;

            const res = m.convert(img, {
                mode, gridW, gridH,
                paletteFilter: m.FILTER_PRESETS[filterKey],
                dithering: dither
            });

            this.dotArtEditor.resize(gridW, gridH);
            this.dotArtEditor.grid = res.grid;
            this.dotArtEditor.render();
            this._renderDotArtMaterials(this.dotArtEditor.getMaterialCount());

            this._toast(`✨ ${gridW}x${gridH} のドット絵を生成しました`);
        } catch (e) {
            console.error(e);
            this._toast('❌ 変換失敗: ' + e.message, 'error');
        } finally {
            this._hideLoading();
        }
    }

    _addDotArtAsStructure() {
        const ed = this.dotArtEditor;
        if (!ed) return;
        const project = this._currentProject();
        if (!project) { this._toast('プロジェクトが開かれていません', 'error'); return; }

        const counts = ed.getMaterialCount();
        if (counts.length === 0) { this._toast('キャンバスが空です', 'error'); return; }

        const name = prompt('このドット絵に名前をつけて保存:', 'マップアート_' + new Date().toISOString().slice(11,16));
        if (!name) return;

        const results = counts.map(c => ({ id: c.id, count: c.count, stacks: c.stacks, remainder: c.remainder, slots: Math.ceil(c.count/64) }));
        const struct = {
            id: 'dotart_' + Date.now(),
            name: name,
            totalCount: counts.reduce((a, b) => a + b.count, 0),
            uniqueCount: counts.length,
            results: results,
            multiplier: 1,
            size: { x: ed.gridW, y: 1, z: ed.gridH }
        };

        project.structures.push(struct);
        ProjectManager.save(this.projects);
        this._toast(`➕ 「${name}」を構造リストに追加しました`);
        this._renderMaterialsTab();
    }

    _updateDotArtMaterials() {
        if (!this.dotArtEditor) return;
        const counts = this.dotArtEditor.getMaterialCount();
        this._renderDotArtMaterials(counts);
    }

    _renderDotArtMaterials(counts) {
        const list = document.getElementById('dotart-material-list');
        if (counts.length === 0) { list.innerHTML = '<p class="empty-hint">まだ何も描いていません</p>'; return; }
        list.innerHTML = counts.map(c => `
            <div class="dotart-mat-item">
                <span class="dotart-color" style="background:${c.color}"></span>
                <span class="dotart-mat-name">${this._escape(c.name)}</span>
                <span class="dotart-mat-count">${c.count}</span>
                <span class="dotart-mat-stacks">${c.stacks}st+${c.remainder}</span>
            </div>
        `).join('');
    }

    /** ZIP File → ResourcePack ロード（保存トグル付き） */
    async _handlePackFile(file, fromUpload = false) {
        const $ = id => document.getElementById(id);
        try {
            const status = $('pack-status');
            if (status) status.textContent = fromUpload ? '解凍中...' : '保存済みパック復元中...';
            const info = await ResourcePack.loadFromZip(file);
            if (status) status.textContent = `✅ ${info.name} (${info.count}テクスチャ${info.isBedrock ? ' / Bedrock' : ''})`;

            // realtexture モードを有効化し、自動で切り替え
            const realRadio = document.querySelector('input[name="viewer3d-colormode"][value="realtexture"]');
            if (realRadio) {
                realRadio.disabled = false;
                realRadio.checked = true;
                // change イベントを手動で発火させて Viewer3D に通知
                realRadio.dispatchEvent(new Event('change'));
            }

            // 保存トグルがON で、かつアップロード由来なら IndexedDB に保存
            if (fromUpload && $('pack-save-checkbox')?.checked) {
                try {
                    await ResourcePack.savePackToIDB(file, file.name);
                    this._toast(`📦 パック読み込み＋ブラウザに保存（${(file.size/1048576).toFixed(1)}MB）`);
                } catch (e) {
                    console.warn('IDB save failed:', e);
                    this._toast(`📦 パック読み込み完了（保存失敗：${e.message}）`, 'error');
                }
            } else if (fromUpload) {
                this._toast(`📦 リソースパック読み込み完了: ${info.count}個のテクスチャ`);
            }

            // 3D 表示中なら反映（置換後テクスチャも引き直し）
            if (this.viewer3d?.isInitialized) {
                this._load3DView();
            } else {
                this.viewer3d?.refreshTextures?.();
            }
            // 置換リストのサムネイルを更新
            const selVal = document.getElementById('viewer3d-structure-select')?.value;
            if (selVal) this._renderReplaceList(selVal);
            // 素材一覧のアイコンも更新
            this._renderBlockList?.();
        } catch (err) {
            console.error('Pack load failed:', err);
            const status = $('pack-status');
            if (status) status.textContent = '❌ ' + err.message;
            this._toast('リソースパック読み込み失敗: ' + err.message, 'error');
        }
    }

    /** 起動時に IndexedDB から全構造バッファを bufferCache へ */
    async _autoRestoreStructureBuffers() {
        try {
            const all = await ResourcePack.loadAllStructureBuffers();
            if (!all || all.size === 0) return;
            for (const [id, entry] of all.entries()) {
                if (!entry || !entry.buffer) continue;
                this.bufferCache.set(id, entry.buffer);
            }
            console.log(`[restore] ${all.size}件の構造バッファを IDB から復元`);
        } catch (e) {
            console.warn('Auto-restore structure buffers failed:', e);
        }
    }

    /** coords が無い場合、buffer から自動再解析する（無音） */
    async _ensureCoordsForStructure(structureId) {
        if (this.coordsCache.has(structureId)) return true;
        const buf = this.bufferCache.get(structureId);
        if (!buf) return false;
        try {
            const data = await this._parseBuffer(buf);
            this._hideLoading();
            if (data.success) {
                this.coordsCache.set(structureId, data.coords);
                // 構造メタも軽く更新（results が空だったら埋める）
                const project = this._currentProject();
                const structure = project?.structures.find(s => s.id === structureId);
                if (structure && (!structure.results || structure.results.length === 0)) {
                    Object.assign(structure, {
                        results: data.results, size: data.size,
                        totalCount: data.totalCount, uniqueCount: data.uniqueCount,
                        totalSlots: data.totalSlots
                    });
                }
                return true;
            }
        } catch (err) {
            console.warn('auto-parse failed:', err);
        }
        return false;
    }

    /** 起動時に IndexedDB から保存済みパックを復元 */
    async _autoRestorePack() {
        try {
            const saved = await ResourcePack.loadSavedPackFromIDB();
            if (!saved || !saved.blob) return;
            const $ = id => document.getElementById(id);
            const status = $('pack-status');
            if (status) status.textContent = `保存済みパック「${saved.name}」を復元中...`;
            // Blob を File-like として渡す
            const fakeFile = new File([saved.blob], saved.name, { type: saved.blob.type });
            await this._handlePackFile(fakeFile, false);
        } catch (e) {
            console.warn('Auto-restore pack failed:', e);
        }
    }

    // ─── 3D View ───────────────────────────────────────────────────────────────
    _initViewer3DTab() {
        const project = this._currentProject();
        if (project) this._updateViewer3DSelect(project);
    }

    _updateViewer3DSelect(project) {
        const sel = document.getElementById('viewer3d-structure-select');
        const prev = sel.value;
        sel.innerHTML = '';
        project.structures.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.size ? `${s.size.x}×${s.size.y}×${s.size.z}` : '?'})`;
            sel.appendChild(opt);
        });
        if (prev && sel.querySelector(`option[value="${prev}"]`)) sel.value = prev;
        this._populateReplaceFrom();
        this._renderReplaceList(sel.value);

        // Update layer slider max
        const selected = project.structures.find(s => s.id === sel.value);
        if (selected?.size) {
            const maxY = selected.size.y - 1;
            document.getElementById('layer-max').max = maxY;
            document.getElementById('layer-max').value = maxY;
            document.getElementById('layer-max-val').textContent = maxY;
        }
    }

    async _load3DView() {
        const container = document.getElementById('viewer3d-container');
        const sel = document.getElementById('viewer3d-structure-select');
        const project = this._currentProject();
        if (!project || !sel.value) { this._toast('構造が選択されていません', 'error'); return; }

        const structure = project.structures.find(s => s.id === sel.value);
        if (!structure) return;

        let coords = this.coordsCache.get(sel.value);
        if (!coords || coords.length === 0) {
            // 自動再解析を試みる（IDB から復元したバッファがあれば無音で）
            const ok = await this._ensureCoordsForStructure(sel.value);
            if (ok) {
                coords = this.coordsCache.get(sel.value);
            } else {
                const info = document.getElementById('viewer3d-info');
                if (info) {
                    info.innerHTML = `
                        <p class="warning-text">⚠️ 座標データもバッファもありません。ファイルを再度アップロードしてください。</p>
                        <button class="mc-btn secondary small" onclick="document.getElementById('file-input').click()">📂 ファイル選択</button>
                    `;
                }
                return;
            }
        }

        const btn = document.getElementById('btn-load-3d');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '読み込み中...';
        }

        try {
            if (!this.viewer3d || this.viewer3d.container !== container) {
                if (this.viewer3d) this.viewer3d.destroy();
                this.viewer3d = new Viewer3D(container);
            }
            await this.viewer3d.init();

            const yMinEl = document.getElementById('layer-min');
            const yMaxEl = document.getElementById('layer-max');
            const yMin = yMinEl ? parseInt(yMinEl.value, 10) : 0;
            const yMax = yMaxEl ? parseInt(yMaxEl.value, 10) : 999;

            const cmRadio = document.querySelector('input[name="viewer3d-colormode"]:checked');
            const colorMode = cmRadio ? cmRadio.value : 'material';
            const structureId = sel.value;
            const replacedCoords = this._applyReplacements(structureId, coords);
            // 置換が変わるたびにマテリアルキャッシュを破棄してテクスチャを引き直す
            this.viewer3d._matCache?.clear();
            this.viewer3d.loadStructure(replacedCoords, structure.size, { yMin, yMax, colorMode });

            const infoEl = document.getElementById('viewer3d-info');
            if (infoEl) {
                infoEl.innerHTML = `<p class="info-text">✅ ${coords.length.toLocaleString()}ブロック表示中 | ドラッグ:回転 / 右ドラッグ:パン / スクロール:ズーム</p>`;
            }
        } catch (err) {
            console.error('_load3DView failed:', err);
            this._toast('3D表示に失敗しました: ' + err.message, 'error');
        }

        if (btn) {
            btn.disabled = false;
            btn.textContent = '3D表示を更新';
        }
    }

    // ─── Settings ──────────────────────────────────────────────────────────────
    _exportAll() {
        const data = JSON.stringify({ projects: this.projects, version: 2 }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `mc_planner_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        this._toast('📤 エクスポート完了');
    }

    _importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            try {
                const data = JSON.parse(text);
                if (data.projects) {
                    this.projects = data.projects;
                    ProjectManager.save(this.projects);
                    this._renderProjectList();
                    this._toast('📥 インポート完了');
                }
            } catch { this._toast('⚠️ 無効なファイル', 'error'); }
        };
        input.click();
    }

    // ─── Utilities ─────────────────────────────────────────────────────────────
    _bedrockToJava(rawId) {
        const map = {
            brick_block: 'bricks', double_stone_block_slab: 'stone',
            stone_block_slab: 'stone_slab', iron_chain: 'chain',
            grass: 'grass_block', hardened_clay: 'terracotta',
            stained_hardened_clay: 'terracotta', sealantern: 'sea_lantern'
        };
        return map[rawId] || rawId;
    }

    /** flat blockId → Bedrock 汎用 ID + states を推定（素材一覧アイコン用） */
    _guessRawIdAndStates(blockId) {
        const local = String(blockId).replace(/^minecraft:/, '').toLowerCase();
        // 木材系
        const woodMatch = local.match(/^(oak|spruce|birch|jungle|acacia|dark_oak)_planks$/);
        if (woodMatch) return { rawId: 'minecraft:planks', states: { wood_type: woodMatch[1] } };
        const slabMatch = local.match(/^(oak|spruce|birch|jungle|acacia|dark_oak)_slab$/);
        if (slabMatch) return { rawId: 'minecraft:wooden_slab', states: { wood_type: slabMatch[1] } };
        const oldLogMatch = local.match(/^(oak|spruce|birch|jungle)_log$/);
        if (oldLogMatch) return { rawId: 'minecraft:log', states: { old_log_type: oldLogMatch[1] } };
        const newLogMatch = local.match(/^(acacia|dark_oak)_log$/);
        if (newLogMatch) return { rawId: 'minecraft:log2', states: { new_log_type: newLogMatch[1] } };
        const oldLeafMatch = local.match(/^(oak|spruce|birch|jungle)_leaves$/);
        if (oldLeafMatch) return { rawId: 'minecraft:leaves', states: { old_leaf_type: oldLeafMatch[1] } };
        const newLeafMatch = local.match(/^(acacia|dark_oak)_leaves$/);
        if (newLeafMatch) return { rawId: 'minecraft:leaves2', states: { new_leaf_type: newLeafMatch[1] } };
        // 色系
        const colorWoolMatch = local.match(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(wool|carpet|concrete|concrete_powder|stained_glass|stained_glass_pane|terracotta|shulker_box|bed)$/);
        if (colorWoolMatch) {
            const c = colorWoolMatch[1] === 'light_gray' ? 'silver' : colorWoolMatch[1];
            const baseMap = { wool:'wool', carpet:'carpet', concrete:'concrete', concrete_powder:'concretepowder', stained_glass:'stained_glass', stained_glass_pane:'stained_glass_pane', terracotta:'stained_hardened_clay', shulker_box:'shulker_box', bed:'bed' };
            return { rawId: 'minecraft:' + baseMap[colorWoolMatch[2]], states: { color: c } };
        }
        // 石系
        if (local === 'polished_andesite') return { rawId: 'minecraft:stone', states: { stone_type: 'andesite_smooth' } };
        if (local === 'andesite') return { rawId: 'minecraft:stone', states: { stone_type: 'andesite' } };
        if (local === 'polished_diorite') return { rawId: 'minecraft:stone', states: { stone_type: 'diorite_smooth' } };
        if (local === 'diorite') return { rawId: 'minecraft:stone', states: { stone_type: 'diorite' } };
        if (local === 'polished_granite') return { rawId: 'minecraft:stone', states: { stone_type: 'granite_smooth' } };
        if (local === 'granite') return { rawId: 'minecraft:stone', states: { stone_type: 'granite' } };
        // 石レンガ系
        if (local === 'mossy_stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'mossy' } };
        if (local === 'cracked_stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'cracked' } };
        if (local === 'chiseled_stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'chiseled' } };
        if (local === 'stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'default' } };
        // dirt
        if (local === 'coarse_dirt') return { rawId: 'minecraft:dirt', states: { dirt_type: 'coarse' } };
        // フォールバック
        return { rawId: blockId, states: null };
    }

    _escape(str) {
        return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    _relDate(ts) {
        const d = Date.now() - ts;
        if (d < 60000) return 'たった今';
        if (d < 3600000) return `${Math.floor(d / 60000)}分前`;
        if (d < 86400000) return `${Math.floor(d / 3600000)}時間前`;
        return new Date(ts).toLocaleDateString('ja-JP');
    }

    _showModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
    _hideModal(id) { if (id) document.getElementById(id)?.classList.add('hidden'); }

    _showLoading(msg = '解析中...') {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;
        const p = overlay.querySelector('p');
        if (p) p.textContent = msg;
        overlay.classList.remove('hidden');
    }

    _hideLoading() {
        document.getElementById('loading-overlay')?.classList.add('hidden');
    }

    _toast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

// Boot
new App();
