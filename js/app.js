import { DotArtEditor, DOT_PALETTE } from './dotart.js';
import { Viewer3D } from './viewer3d.js';
import * as ResourcePack from './resourcepack.js';
import * as Image2Dot from './image2dot.js';
import { NBTParser, NBTWriter, decompressIfNeeded } from './nbt.js';
import { DOWNGRADE_PRESETS, applyToCoords, applyToResults, applicablePairsForStructure } from './replacements.js';
import { BLOCK_CATALOG as BC_DATA } from './block_catalog.js';
import { normalizeId } from './bedrock_normalize.js';

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Minecraft 16色定義 ──────────────────────────────────────────────────────
const MC_COLORS = [
    { key: 'white',      hex: '#F9FFFE', name: '白' },
    { key: 'orange',     hex: '#F9801D', name: 'オレンジ' },
    { key: 'magenta',    hex: '#C74EBD', name: 'マゼンタ' },
    { key: 'light_blue', hex: '#3AB3DA', name: '空色' },
    { key: 'yellow',     hex: '#FED83D', name: '黄' },
    { key: 'lime',       hex: '#80C71F', name: '黄緑' },
    { key: 'pink',       hex: '#F38BAA', name: 'ピンク' },
    { key: 'gray',       hex: '#474F52', name: '灰' },
    { key: 'light_gray', hex: '#9D9D97', name: '薄灰' },
    { key: 'cyan',       hex: '#169C9C', name: 'シアン' },
    { key: 'purple',     hex: '#8932B8', name: '紫' },
    { key: 'blue',       hex: '#3C44AA', name: '青' },
    { key: 'brown',      hex: '#835432', name: '茶' },
    { key: 'green',      hex: '#5E7C16', name: '緑' },
    { key: 'red',        hex: '#B02E26', name: '赤' },
    { key: 'black',      hex: '#1D1D21', name: '黒' },
];

// ─── ブロックカタログは ./block_catalog.js から import (BC_DATA) ─────────────

// ─── ProjectManager ───────────────────────────────────────────────────────────
class ProjectManager {
    static KEY = 'mc_planner_v2';

    static load() {
        try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
        catch { return []; }
    }

    static save(projects) {
        try {
            // Limit: use constant
            const toSave = projects.slice(0, App.MAX_PROJECTS).map(p => ({
                ...p,
                structures: p.structures.map(s => {
                    const { coords, rawBuffer, ...rest } = s;
                    return rest;
                })
            }));
            const json = JSON.stringify(toSave);
            // ~5MB limit check
            if (json.length > App.STORAGE_WARNING_SIZE) {
                console.warn('プロジェクトJSON が 4MB 超：localStorage 上限に近づいています', json.length);
            }
            localStorage.setItem(this.KEY, json);
        } catch (e) {
            console.error('Save failed', e);
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
                // normalizeId を通して検索の不一致を防ぐ
                const normRId = normalizeId(r.id);
                const to = repMap ? (repMap.get(normRId) || repMap.get('minecraft:' + normRId.replace('minecraft:', '')) || repMap.get(normRId.replace('minecraft:', ''))) : null;
                const id = to || normRId;
                const lowId = id.toLowerCase();
                if (lowId === 'minecraft:air' || lowId === 'air') continue; 
                const existing = totals.get(id) || 0;
                totals.set(id, existing + r.count * mult);
            }
        }
        return Array.from(totals.entries()).map(([id, count]) => {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            const slots = stacks + (remainder > 0 ? 1 : 0);
            // サンプルを検索する際、置換先のカテゴリを考慮
            const sample = project.structures.flatMap(s => s.results).find(r => r.id === id);
            return { id, count, stacks, remainder, slots, category: sample?.category || 'other' };
        }).sort((a, b) => b.count - a.count);
    }
}

// ─── App ──────────────────────────────────────────────────────────────────────
class App {
    static MAX_PROJECTS = 20;
    static STORAGE_WARNING_SIZE = 4 * 1024 * 1024; // 4MB
    static LARGE_FILE_WARNING = 50 * 1024 * 1024; // 50MB

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
        this.lastSearchQuery = '';      // 素材検索の文字保持
        this.viewer3d = null;
        this.dotArtEditor = null;
        this.worker = new Worker(new URL('./worker.js?v=2.5.6', import.meta.url), { type: 'module' });
        this.pendingParses = new Map(); // taskId => resolve
        this.settingsData = JSON.parse(localStorage.getItem('mc_planner_settings') || '{}');
        // カスタムフォルダシステム: [{id, name, blockIds:[]}]
        this._customFolders = JSON.parse(localStorage.getItem('mc_planner_block_folders') || '[]');
        this._dragEditMode = false;
        this._deletedPositions = new Set(); // 3Dビューで1つだけ削除したブロック位置

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
        this._setupTour();
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
            const { taskId, success, error, results, coords, size, totalCount, uniqueCount, totalSlots } = e.data;
            this._hideLoading();
            const resolve = this.pendingParses.get(taskId);
            if (resolve) {
                resolve({ success, error, results, coords, size, totalCount, uniqueCount, totalSlots });
                this.pendingParses.delete(taskId);
            }
        };
    }

    _parseFile(file) {
        return new Promise((resolve) => {
            const taskId = uid();
            this.pendingParses.set(taskId, resolve);
            this._showLoading(`解析中: ${file.name}`);
            const reader = new FileReader();
            reader.onload = (e) => {
                this._lastParsedBuffer = e.target.result;
                this.worker.postMessage({ taskId, buffer: e.target.result, fileName: file.name });
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /** 既にメモリ上にある ArrayBuffer から再パースする（ファイル選択ダイアログを開かない） */
    _parseBuffer(buffer) {
        return new Promise((resolve) => {
            const taskId = uid();
            this.pendingParses.set(taskId, resolve);
            this._showLoading('再解析中...');
            this.worker.postMessage({ taskId, buffer });
        });
    }

    // ─── DOM Setup ─────────────────────────────────────────────────────────────
    _setupDOM() {
        const $ = id => document.getElementById(id);

        // Sidebar buttons
        $('btn-new-project').onclick = () => this._showModal('modal-new-project');
        $('btn-go-home').onclick = () => this._goHome();
        // btn-import-file は削除済み
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

        // Search & filter (P1デバウンス改善 & 文字保持)
        let searchTimeout;
        const searchInput = $('search-input');
        searchInput.value = this.lastSearchQuery;
        searchInput.addEventListener('input', () => {
            this.lastSearchQuery = searchInput.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this._renderBlockList(), 200);
        });
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

        // Undo / Redo for DotArt
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' || e.key === 'Z') {
                    if (this.currentTab === 'dotart' && this.dotArtEditor && !document.querySelector('.modal-overlay:not(.hidden)')) {
                        e.preventDefault();
                        if (e.shiftKey) this.dotArtEditor.redo();
                        else this.dotArtEditor.undo();
                    }
                } else if (e.key === 'y' || e.key === 'Y') {
                    if (this.currentTab === 'dotart' && this.dotArtEditor && !document.querySelector('.modal-overlay:not(.hidden)')) {
                        e.preventDefault();
                        this.dotArtEditor.redo();
                    }
                }
            }
        });

        // Multiplier modal
        this._setupMultiplierModal();

        // Settings tab - update stats when shown
        document.querySelector('[data-tab="settings"]').addEventListener('click', () => {
            const count = this.projects.length;
            $('setting-project-count').textContent = `${count} / ${App.MAX_PROJECTS}`;
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

    _setup3DViewTab() {
        const $ = id => document.getElementById(id);

        // ─── 断面スライダー（Y/X/Z）デバウンス付きリアルタイム反映 ───
        let sliceTimer = null;
        const sliders = [
            { id: 'layer-min',  val: 'layer-min-val'  },
            { id: 'layer-max',  val: 'layer-max-val'  },
            { id: 'layer-xmin', val: 'layer-xmin-val' },
            { id: 'layer-xmax', val: 'layer-xmax-val' },
            { id: 'layer-zmin', val: 'layer-zmin-val' },
            { id: 'layer-zmax', val: 'layer-zmax-val' },
        ];
        for (const { id, val } of sliders) {
            const el = $(id), valEl = $(val);
            if (!el) continue;
            el.addEventListener('input', () => {
                if (valEl) valEl.textContent = el.value;
                clearTimeout(sliceTimer);
                sliceTimer = setTimeout(() => this._applySlice(), 80);
            });
        }

        // リセットボタン
        $('btn-slice-reset')?.addEventListener('click', () => {
            const size = this.viewer3d?._lastSize;
            const setSlider = (id, valId, v) => {
                const el = $(id); const ve = $(valId);
                if (el) el.value = v; if (ve) ve.textContent = v;
            };
            setSlider('layer-min',  'layer-min-val',  0);
            setSlider('layer-max',  'layer-max-val',  size ? size.y - 1 : 255);
            setSlider('layer-xmin', 'layer-xmin-val', 0);
            setSlider('layer-xmax', 'layer-xmax-val', size ? size.x - 1 : 255);
            setSlider('layer-zmin', 'layer-zmin-val', 0);
            setSlider('layer-zmax', 'layer-zmax-val', size ? size.z - 1 : 255);
            this._applySlice();
        });

        $('btn-load-3d').onclick = () => this._load3DView();
        $('btn-reload-3d').onclick = () => this._load3DView();
        $('btn-reset-camera').onclick = () => this.viewer3d?.resetCamera();

        // 床タイプ切替
        $('floor-type-select').addEventListener('change', (e) => {
            if (this.viewer3d) this.viewer3d.setFloorType(e.target.value);
        });

        // ─── ブロック置換 ────────────────────────────────
        $('btn-replace-add').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            const fromRaw = $('replace-from').value;  // カンマ区切りで複数ID可
            const rawTo = $('replace-to').value;
            if (!fromRaw || !rawTo) {
                this._toast('置換元と置換先を選択してください', 'error');
                return;
            }
            const fromIds = fromRaw.split(',').map(s => normalizeId(s.trim())).filter(Boolean);
            const to = normalizeId(rawTo);
            // to が air の場合は「削除」
            const toLabel = (to === 'minecraft:air' || to === 'air') ? '削除（air）' : to.replace('minecraft:', '');
            // 同じIDを自分自身に置換しようとしていないかチェック
            const nonSelf = fromIds.filter(id => id !== to);
            if (!nonSelf.length) {
                this._toast('置換元と置換先が同じです', 'error');
                return;
            }
            let map = this.replacements.get(sel);
            if (!map) { map = new Map(); this.replacements.set(sel, map); }
            nonSelf.forEach(id => map.set(id, to));
            this._renderReplaceList(sel);
            this._renderProjectView();
            if (nonSelf.length === 1) {
                this._toast(`置換追加: ${nonSelf[0].replace('minecraft:','')} → ${toLabel}`);
            } else {
                this._toast(`置換追加: ${nonSelf.length}件 → ${toLabel}`);
            }
            // リセット
            // 置換先が air (削除) の場合は、対象が消えるためFromもリセットする。
            // それ以外（別のブロックに置換）の場合は、同じ対象に別の置換を試せるよう From を保持する。
            const isDelete = (to === 'minecraft:air');
            
            if (isDelete) {
                this._resetReplacePickers();
            } else {
                // 置換の場合は置換先（To）だけリセット
                $('replace-to').value = '';
                $('replace-to-name').textContent = '置換先を選択...';
                $('replace-to-icon-wrap').textContent = '📦';
            }
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
        // パネルは常に展開状態でスタート（collapsed だと pointer-events が無効になるため）
        try { localStorage.removeItem('v3d_panel_collapsed'); } catch (_) {}

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
            this._resetReplacePickers();
            this._renderReplaceList($('viewer3d-structure-select').value);
        });

        this._setupBlockSelectorModal();

        // 表示色モード切替
        document.querySelectorAll('input[name="viewer3d-colormode"]').forEach(r => {
            r.addEventListener('change', () => {
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

    /** 構造変更時に picker をリセット */
    _resetReplacePickers() {
        const $ = id => document.getElementById(id);
        $('replace-from').value = '';
        $('replace-to').value = '';
        $('replace-from-name').textContent = '現在の構造から選択...';
        $('replace-to-name').textContent = '置換先を選択...';
        $('replace-from-icon-wrap').textContent = '📦';
        $('replace-to-icon-wrap').textContent = '📦';
        this._fromSelections?.clear();
        document.getElementById('multi-select-bar')?.remove();
    }

    /** ブロック選択モーダルのセットアップ */
    _setupBlockSelectorModal() {
        try {
            const $ = id => document.getElementById(id);
            this._blockSelectorMode = 'to';
            this._fromSelections = new Set(); // 複数選択対応

            const fromBtn = $('replace-from-btn');
            const toBtn   = $('replace-to-btn');
            if (!fromBtn || !toBtn) {
                console.error('[BlockSelector] replace-from-btn / replace-to-btn が見つかりません');
                return;
            }

            fromBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._blockSelectorMode = 'from';
                this._openBlockSelector();
            });
            toBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._blockSelectorMode = 'to';
                this._openBlockSelector();
            });

            // タブ切替
            document.querySelectorAll('#modal-block-selector .tab-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#modal-block-selector .tab-pill').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this._renderBlockSelectorGrid(btn.dataset.cat);
                });
            });

            // 検索 (P1デバウンス改善)
            const searchEl = $('block-selector-search');
            if (searchEl) {
                let selSearchTimeout;
                searchEl.addEventListener('input', () => {
                    clearTimeout(selSearchTimeout);
                    selSearchTimeout = setTimeout(() => {
                        const active = document.querySelector('#modal-block-selector .tab-pill.active');
                        this._renderBlockSelectorGrid(active?.dataset.cat || 'current');
                    }, 200);
                });
            }
        } catch (err) {
            console.error('[BlockSelector] _setupBlockSelectorModal エラー:', err);
        }
    }

    _openBlockSelector() {
        try {
            const $ = id => document.getElementById(id);
            const searchEl = $('block-selector-search');
            if (searchEl) searchEl.value = '';
            const tabs = document.querySelectorAll('#modal-block-selector .tab-pill');

            if (this._blockSelectorMode === 'from') {
                const title = $('block-selector-title');
                const sub   = $('block-selector-sub');
                if (title) title.textContent = '置換元のブロック選択（複数選択可）';
                if (sub)   sub.textContent   = '現在の構造のブロックをクリックして選択（複数OK）';
                // 置換元モード: "現在のブロック"タブのみ表示
                tabs.forEach(t => { t.style.display = (t.dataset.cat === 'current') ? '' : 'none'; });
                tabs.forEach(t => t.classList.toggle('active', t.dataset.cat === 'current'));
                this._fromSelections.clear();
                this._showModal('modal-block-selector');
                this._renderBlockSelectorGrid('current');
            } else if (this._blockSelectorMode === 'to') {
                const title = $('block-selector-title');
                const sub   = $('block-selector-sub');
                if (title) title.textContent = '置換先のブロック選択';
                if (sub)   sub.textContent   = 'ブロックを選んでください（削除 = air に置換）';
                // 置換先モード: カタログタブを表示（dotartタブは非表示）
                tabs.forEach(t => {
                    t.style.display = (t.dataset.cat === 'current' || t.dataset.cat === 'dotart') ? 'none' : '';
                });
                const firstCatTab = [...tabs].find(t => t.dataset.cat !== 'current' && t.dataset.cat !== 'dotart');
                tabs.forEach(t => t.classList.remove('active'));
                if (firstCatTab) firstCatTab.classList.add('active');
                this._showModal('modal-block-selector');
                this._renderBlockSelectorGrid(firstCatTab?.dataset.cat || 'stone');
            } else if (this._blockSelectorMode === 'dotart' || this._blockSelectorMode === 'palette') {
                const title = $('block-selector-title');
                const sub   = $('block-selector-sub');
                if (this._blockSelectorMode === 'dotart') {
                    if (title) title.textContent = 'ドット絵ブロックの一括置換';
                    if (sub)   sub.textContent   = '新しいブロックをカタログから選んでください';
                } else {
                    if (title) title.textContent = 'パレットに追加するブロックを選択';
                    if (sub)   sub.textContent   = '描画に使用したいブロックを選んでください';
                }
                // ドット絵/パレットモード: 全てのカタログタブを表示
                tabs.forEach(t => {
                    t.style.display = (t.dataset.cat === 'current') ? 'none' : '';
                });
                const firstCatTab = [...tabs].find(t => t.dataset.cat === 'wool' || t.dataset.cat === 'dotart' || t.dataset.cat === 'stone');
                tabs.forEach(t => t.classList.remove('active'));
                if (firstCatTab) firstCatTab.classList.add('active');
                this._showModal('modal-block-selector');
                this._renderBlockSelectorGrid(firstCatTab?.dataset.cat || 'stone');
            }
        } catch (err) {
            console.error('[BlockSelector] _openBlockSelector エラー:', err);
        }
    }

    _renderBlockSelectorGrid(category) {
        const grid = document.getElementById('block-selector-grid');
        const search = document.getElementById('block-selector-search').value.toLowerCase();
        const sel = document.getElementById('viewer3d-structure-select').value;
        const project = this._currentProject();
        const structure = project?.structures.find(s => s.id === sel);
        const currentResults = structure?.results || [];

        grid.innerHTML = '';
        document.getElementById('multi-select-bar')?.remove();

        if (category === 'current') {
            const isFromMode = this._blockSelectorMode === 'from';
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;overflow-y:auto;';
            const repMap = this.replacements.get(sel);
            let blocks = currentResults.filter(r => {
                if (repMap) {
                    const normRId = normalizeId(r.id);
                    const to = repMap.get(normRId) || repMap.get('minecraft:' + normRId.replace('minecraft:', '')) || repMap.get(normRId.replace('minecraft:', ''));
                    if (to && (to.toLowerCase() === 'minecraft:air' || to.toLowerCase() === 'air')) return false;
                }
                if (search) {
                    const n = this.langData?.[r.id] || r.id.replace('minecraft:', '');
                    return n.toLowerCase().includes(search) || r.id.includes(search);
                }
                return true;
            });

            if (!blocks.length) {
                grid.innerHTML = '<p style="color:var(--muted2);text-align:center;padding:2rem;grid-column:1/-1">ブロックが見つかりません</p>';
                return;
            }

            if (isFromMode) {
                const bar = document.createElement('div');
                bar.id = 'multi-select-bar';
                bar.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:var(--surface2);border-top:1px solid var(--border);border-radius:0 0 8px 8px;';
                bar.innerHTML = `
                    <span id="multi-select-count" style="flex:1;font-size:0.8rem;color:var(--muted2);">${this._fromSelections.size}件選択中</span>
                    <button id="multi-select-clear" class="mc-btn small">クリア</button>
                    <button id="multi-select-confirm" class="mc-btn small" style="background:var(--accent);">確定 →</button>
                `;
                grid.parentElement.appendChild(bar);
                bar.querySelector('#multi-select-clear').onclick = () => { this._fromSelections.clear(); this._renderBlockSelectorGrid('current'); };
                bar.querySelector('#multi-select-confirm').onclick = () => {
                    if (!this._fromSelections.size) return this._toast('ブロックを選択してください', 'error');
                    const ids = [...this._fromSelections];
                    document.getElementById('replace-from').value = ids.join(',');
                    document.getElementById('replace-from-name').textContent = ids.length === 1 ? (this.langData?.[ids[0]] || ids[0].replace('minecraft:','')) : `${ids.length}件選択`;
                    this._hideModal('modal-block-selector');
                };
            }

            for (const r of blocks) {
                const name = this.langData?.[r.id] || r.id.replace('minecraft:', '');
                const card = document.createElement('button');
                card.className = 'block-pick-card';
                if (isFromMode && this._fromSelections.has(r.id)) { card.style.outline = '2px solid var(--accent)'; card.style.background = 'rgba(99,179,237,0.15)'; }
                const check = isFromMode ? `<span class="pick-check" style="position:absolute;top:3px;right:3px;font-size:0.7rem;color:var(--accent);">${this._fromSelections.has(r.id) ? '✔' : ''}</span>` : '';
                card.innerHTML = `<div class="block-pick-icon-wrap">${this._getBlockIconHtml(r.id)}</div><span class="block-pick-name">${this._escape(name)}</span>${check}`;
                card.onclick = () => {
                    if (isFromMode) {
                        if (this._fromSelections.has(r.id)) { this._fromSelections.delete(r.id); card.style.outline = ''; card.style.background = ''; card.querySelector('.pick-check').textContent = ''; }
                        else { this._fromSelections.add(r.id); card.style.outline = '2px solid var(--accent)'; card.style.background = 'rgba(99,179,237,0.15)'; card.querySelector('.pick-check').textContent = '✔'; }
                        document.getElementById('multi-select-count').textContent = `${this._fromSelections.size}件選択中`;
                    } else {
                        this._selectBlockFromModal(r.id, name, card.querySelector('img')?.src);
                    }
                };
                grid.appendChild(card);
            }
        } else if (category === 'dotart') {
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:0.5rem;overflow-y:auto;';
            const blocks = DOT_PALETTE.filter(p => {
                if (search) {
                    const n = p.name.toLowerCase();
                    return n.includes(search) || p.id.includes(search);
                }
                return true;
            });
            for (const p of blocks) {
                const name = p.name;
                const card = document.createElement('button');
                card.className = 'block-pick-card';
                card.innerHTML = `<div class="block-pick-icon-wrap">${this._getBlockIconHtml(p.id)}</div><span class="block-pick-name">${this._escape(name)}</span>`;
                card.onclick = () => this._selectBlockFromModal(p.id, name, card.querySelector('img')?.src);
                grid.appendChild(card);
            }
        } else {
            // カタログ
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));grid-auto-rows:min-content;gap:0.5rem;overflow-y:auto;align-items:start;align-content:start;';

            // 1) 削除ボタン (specialタブのみ表示)
            if (category === 'special') {
                const delCard = document.createElement('button');
                delCard.className = 'block-pick-card';
                delCard.style.border = '1.5px dashed var(--danger,#e55)';
                delCard.innerHTML = `<div class="block-pick-icon-wrap" style="font-size:1.6rem">🗑️</div><span class="block-pick-name" style="color:var(--danger,#e55)">削除 (air)</span>`;
                delCard.onclick = () => this._selectBlockFromModal('minecraft:air', '削除（air）', null);
                grid.appendChild(delCard);
            }

            // 2) 錆止め変換ボタン (specialタブのみ)
            if (category === 'special') {
                const waxCard = document.createElement('button');
                waxCard.className = 'block-pick-card';
                waxCard.style.border = '1.5px solid var(--accent)';
                waxCard.innerHTML = `<div class="block-pick-icon-wrap" style="font-size:1.6rem">🛡️</div><span class="block-pick-name" style="color:var(--accent)">置換元を錆止め版にする</span>`;
                waxCard.onclick = () => this._onWaxButtonClicked();
                grid.appendChild(waxCard);
            }

            // "すべて" タブはカスタムフォルダシステムを使用（検索なし時）
            if (category === 'all' && !search) {
                this._renderAllTabWithFolders(grid);
                return;
            }

            const allIds = this._getBlockCatalogEntries(category, search);
            
            // 特殊タブ用のグルーピングロジック (P2改善: サバイバル不可をまとめる)
            let standalone = allIds;
            const groups = {};

            if (category === 'special' && !search) {
                const sysIds = allIds.filter(id => /command_block|structure_block|structure_void|jigsaw|barrier|light_block/.test(id));
                if (sysIds.length > 0) {
                    groups['システム・サバイバル不可'] = sysIds;
                    standalone = allIds.filter(id => !sysIds.includes(id));
                }
            }

            for (const [gName, gIds] of Object.entries(groups)) {
                const folder = document.createElement('button');
                folder.className = 'block-pick-card folder-card';
                folder.style.background = 'rgba(255,255,255,0.05)';
                folder.innerHTML = `<div class="block-pick-icon-wrap" style="font-size:1.6rem">📁</div><span class="block-pick-name" style="font-weight:bold">${gName}</span><small style="font-size:0.6rem;color:var(--muted2)">${gIds.length}個</small>`;
                folder.onclick = () => {
                    grid.innerHTML = '';
                    const backBtn = document.createElement('button');
                    backBtn.className = 'block-pick-card';
                    backBtn.style.cssText = 'grid-column:1/-1;background:var(--surface3);height:30px;padding:0;font-size:0.8rem;';
                    backBtn.textContent = `← 戻る (${gName})`;
                    backBtn.onclick = () => this._renderBlockSelectorGrid(category);
                    grid.appendChild(backBtn);
                    for (const bid of gIds) this._renderBlockCard(grid, bid);
                };
                grid.appendChild(folder);
            }
            for (const bid of standalone) this._renderBlockCard(grid, bid);
        }
    }

    _renderBlockCard(grid, blockId) {
        const name = this.langData?.[blockId] || blockId.replace('minecraft:', '');
        const card = document.createElement('button');
        card.className = 'block-pick-card';
        card.innerHTML = `<div class="block-pick-icon-wrap">${this._getBlockIconHtml(blockId)}</div><span class="block-pick-name">${this._escape(name)}</span>`;
        card.onclick = () => this._selectBlockFromModal(blockId, name, card.querySelector('img')?.src);
        grid.appendChild(card);
    }

    _onWaxButtonClicked() {
        const fromVal = document.getElementById('replace-from').value;
        if (!fromVal) return this._toast('置換元を先に選んでください', 'error');
        const ids = fromVal.split(',');
        const waxedIds = ids.map(id => {
            if (id.startsWith('minecraft:waxed_')) return id;
            return 'minecraft:waxed_' + id.replace('minecraft:', '');
        });
        const toId = waxedIds.join(',');
        const toName = waxedIds.length === 1 ? (this.langData?.[waxedIds[0]] || waxedIds[0].replace('minecraft:','')) : `${waxedIds.length}件を錆止め`;
        document.getElementById('replace-to').value = toId;
        document.getElementById('replace-to-name').textContent = toName;
        this._hideModal('modal-block-selector');
        this._toast('🛡️ 錆止め状態にセットしました');
    }

    // ─── カスタムフォルダ保存 ───────────────────────────────────────────────
    _saveCustomFolders() {
        localStorage.setItem('mc_planner_block_folders', JSON.stringify(this._customFolders));
    }

    // ─── "すべて" タブ用カスタムフォルダ描画 ─────────────────────────────
    _renderAllTabWithFolders(grid) {
        const allIds = this._getBlockCatalogEntries('all');
        const inFolderSet = new Set(this._customFolders.flatMap(f => f.blockIds));
        const unassigned = allIds.filter(id => !inFolderSet.has(id));

        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));grid-auto-rows:min-content;gap:0.5rem;overflow-y:auto;align-items:start;align-content:start;';

        // ── ツールバー ──
        const toolbar = document.createElement('div');
        toolbar.id = 'folder-toolbar';
        toolbar.style.cssText = 'grid-column:1/-1;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;padding:0.25rem 0;';

        // 新規フォルダボタン
        const btnAdd = document.createElement('button');
        btnAdd.className = 'mc-btn small';
        btnAdd.style.cssText = 'background:var(--surface3);font-size:0.78rem;';
        btnAdd.textContent = '📁+ フォルダを作成';
        btnAdd.onclick = () => {
            const name = prompt('フォルダ名を入力してください:');
            if (!name?.trim()) return;
            this._customFolders.push({ id: Math.random().toString(36).slice(2, 10), name: name.trim(), blockIds: [] });
            this._saveCustomFolders();
            this._renderBlockSelectorGrid('all');
        };
        toolbar.appendChild(btnAdd);

        // ドラッグ編集モード toggle
        const btnDrag = document.createElement('button');
        btnDrag.className = 'mc-btn small' + (this._dragEditMode ? ' primary' : '');
        btnDrag.style.cssText = 'font-size:0.78rem;' + (this._dragEditMode ? 'background:var(--accent);' : 'background:var(--surface3);');
        btnDrag.textContent = this._dragEditMode ? '✏️ 編集中（クリックで終了）' : '✏️ ドラッグ編集';
        btnDrag.onclick = () => {
            this._dragEditMode = !this._dragEditMode;
            this._renderBlockSelectorGrid('all');
        };
        toolbar.appendChild(btnDrag);

        // 全体に反映ボタン（フォルダが存在する場合のみ）
        if (this._customFolders.length > 0) {
            const btnApply = document.createElement('button');
            btnApply.className = 'mc-btn small';
            btnApply.style.cssText = 'background:var(--surface3);font-size:0.78rem;margin-left:auto;';
            btnApply.textContent = '💾 整理を保存';
            btnApply.title = 'カスタムフォルダをlocalStorageに保存（既に自動保存されています）';
            btnApply.onclick = () => {
                this._saveCustomFolders();
                this._toast('✅ フォルダ構成を保存しました');
            };
            toolbar.appendChild(btnApply);
        }

        grid.appendChild(toolbar);

        // ── カスタムフォルダカード ──
        for (const folder of this._customFolders) {
            const card = document.createElement('div');
            card.className = 'block-pick-card folder-card';
            card.style.cssText = 'background:rgba(255,255,255,0.06);cursor:pointer;position:relative;user-select:none;';

            if (this._dragEditMode) {
                card.style.outline = '2px dashed var(--accent)';
                card.ondragover = (e) => { e.preventDefault(); card.style.background = 'rgba(99,179,237,0.2)'; };
                card.ondragleave = () => { card.style.background = 'rgba(255,255,255,0.06)'; };
                card.ondrop = (e) => {
                    e.preventDefault();
                    card.style.background = 'rgba(255,255,255,0.06)';
                    const blockId = e.dataTransfer.getData('text/plain');
                    if (!blockId) return;
                    // 他フォルダから削除
                    for (const f of this._customFolders) {
                        f.blockIds = f.blockIds.filter(id => id !== blockId);
                    }
                    // このフォルダに追加（重複なし）
                    if (!folder.blockIds.includes(blockId)) folder.blockIds.push(blockId);
                    this._saveCustomFolders();
                    this._renderBlockSelectorGrid('all');
                };
            }

            // フォルダ本体クリック → 中身を見る
            card.onclick = (e) => {
                if (e.target.closest('.folder-action-btn')) return;
                this._openCustomFolder(grid, folder);
            };

            card.innerHTML = `
                <div class="block-pick-icon-wrap" style="font-size:1.6rem">📁</div>
                <span class="block-pick-name" style="font-weight:bold">${this._escape(folder.name)}</span>
                <small style="font-size:0.6rem;color:var(--muted2)">${folder.blockIds.length}個</small>
                <div style="display:flex;gap:2px;justify-content:center;margin-top:3px;">
                  <button class="folder-action-btn" title="名前変更" style="background:none;border:none;cursor:pointer;font-size:0.75rem;color:var(--muted2);padding:1px 4px;">✏️</button>
                  <button class="folder-action-btn" title="削除" style="background:none;border:none;cursor:pointer;font-size:0.75rem;color:var(--danger,#e55);padding:1px 4px;">✕</button>
                </div>
            `;

            // ✏️ 名前変更
            card.querySelectorAll('.folder-action-btn')[0].onclick = (e) => {
                e.stopPropagation();
                const newName = prompt('新しいフォルダ名:', folder.name);
                if (!newName?.trim()) return;
                folder.name = newName.trim();
                this._saveCustomFolders();
                this._renderBlockSelectorGrid('all');
            };
            // ✕ 削除
            card.querySelectorAll('.folder-action-btn')[1].onclick = (e) => {
                e.stopPropagation();
                if (!confirm(`「${folder.name}」フォルダを削除しますか？（中のブロックは未分類に戻ります）`)) return;
                this._customFolders = this._customFolders.filter(f => f.id !== folder.id);
                this._saveCustomFolders();
                this._renderBlockSelectorGrid('all');
            };

            grid.appendChild(card);
        }

        // ── 未分類セクション ──
        if (unassigned.length > 0) {
            const label = document.createElement('div');
            label.style.cssText = 'grid-column:1/-1;font-size:0.72rem;color:var(--muted2);padding:0.25rem 0;margin-top:0.25rem;border-top:1px solid var(--border);';
            label.textContent = `未分類 (${unassigned.length})`;
            grid.appendChild(label);

            for (const bid of unassigned) {
                const name = this.langData?.[bid] || bid.replace('minecraft:', '');
                const bcard = document.createElement('div');
                bcard.className = 'block-pick-card';
                bcard.style.cssText = 'cursor:pointer;';

                if (this._dragEditMode) {
                    bcard.draggable = true;
                    bcard.style.cursor = 'grab';
                    bcard.ondragstart = (e) => {
                        e.dataTransfer.setData('text/plain', bid);
                        bcard.style.opacity = '0.5';
                    };
                    bcard.ondragend = () => { bcard.style.opacity = '1'; };
                } else {
                    bcard.onclick = () => this._selectBlockFromModal(bid, name, bcard.querySelector('img')?.src);
                }

                bcard.innerHTML = `<div class="block-pick-icon-wrap">${this._getBlockIconHtml(bid)}</div><span class="block-pick-name">${this._escape(name)}</span>`;
                grid.appendChild(bcard);
            }
        }
    }

    // フォルダの中身を表示
    _openCustomFolder(grid, folder) {
        grid.innerHTML = '';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));grid-auto-rows:min-content;gap:0.5rem;overflow-y:auto;align-items:start;align-content:start;';

        // 戻るボタン
        const backBtn = document.createElement('button');
        backBtn.className = 'mc-btn small';
        backBtn.style.cssText = 'grid-column:1/-1;background:var(--surface3);font-size:0.8rem;height:30px;';
        backBtn.textContent = `← 戻る (${folder.name})`;
        backBtn.onclick = () => this._renderBlockSelectorGrid('all');
        grid.appendChild(backBtn);

        if (folder.blockIds.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--muted2);padding:2rem;font-size:0.85rem;';
            empty.textContent = 'フォルダは空です。ドラッグ編集モードでブロックを追加してください。';
            grid.appendChild(empty);
            return;
        }

        for (const bid of folder.blockIds) {
            const name = this.langData?.[bid] || bid.replace('minecraft:', '');
            const bcard = document.createElement('div');
            bcard.className = 'block-pick-card';
            bcard.style.cssText = 'cursor:pointer;position:relative;';

            if (this._dragEditMode) {
                bcard.draggable = true;
                bcard.style.cursor = 'grab';
                bcard.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', bid);
                    bcard.style.opacity = '0.5';
                };
                bcard.ondragend = () => { bcard.style.opacity = '1'; };
                // フォルダ内でのみ：「このフォルダから削除」ボタン
                const removeBtn = document.createElement('button');
                removeBtn.title = 'このフォルダから削除';
                removeBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(229,85,85,0.8);border:none;border-radius:50%;width:16px;height:16px;font-size:0.6rem;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;';
                removeBtn.textContent = '✕';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    folder.blockIds = folder.blockIds.filter(id => id !== bid);
                    this._saveCustomFolders();
                    this._openCustomFolder(grid, folder);
                };
                bcard.appendChild(removeBtn);
            } else {
                bcard.onclick = () => this._selectBlockFromModal(bid, name, bcard.querySelector('img')?.src);
            }

            bcard.innerHTML = `<div class="block-pick-icon-wrap">${this._getBlockIconHtml(bid)}</div><span class="block-pick-name">${this._escape(name)}</span>`;
            if (this._dragEditMode) {
                const removeBtn2 = document.createElement('button');
                removeBtn2.title = 'このフォルダから削除';
                removeBtn2.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(229,85,85,0.85);border:none;border-radius:50%;width:16px;height:16px;font-size:0.6rem;cursor:pointer;color:#fff;line-height:1;';
                removeBtn2.textContent = '✕';
                removeBtn2.onclick = (e) => {
                    e.stopPropagation();
                    folder.blockIds = folder.blockIds.filter(id => id !== bid);
                    this._saveCustomFolders();
                    this._openCustomFolder(grid, folder);
                };
                bcard.appendChild(removeBtn2);
            }

            grid.appendChild(bcard);
        }
    }

    _getBlockIconHtml(blockId, states = {}) {
        const id = String(blockId);
        const local = id.replace(/^minecraft:/, '');
        if (ResourcePack.isLoaded()) {
            const packUrl = ResourcePack.getBestIconUrl(id, states);
            if (packUrl) return `<img src="${packUrl}" class="block-pick-icon" alt="${local}">`;
        }
        const imgId = this._bedrockToJava(local);
        const wikiName = imgId.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('_');
        
        const isBlock = /_block$|_ore$|_stone$|_planks$|_log$|_wood$|terracotta$|wool$|glass$|concrete$/.test(imgId);
        const f = isBlock ? 'block' : 'item', s = isBlock ? 'item' : 'block';
        
        const srcs = [
            `https://minecraft.wiki/images/Invicon_${wikiName}.png`,
            `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${imgId}.png`,
            `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${imgId}.png`
        ];
        if (isBlock) srcs.push(`https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${imgId}_top.png`);

        const first = srcs.shift(), fb = JSON.stringify(srcs).replace(/"/g, '&quot;');
        return `<img class="block-pick-icon" src="${first}" alt="${local}" data-fb="${fb}" onerror="var fb=JSON.parse(this.dataset.fb||'[]');if(fb.length){this.src=fb.shift();this.dataset.fb=JSON.stringify(fb)}else{this.parentNode.innerHTML='📦'}">`;
    }

    _selectBlockFromModal(id, name, imgUrl) {
        if (this._blockSelectorMode === 'dotart') {
            if (this.dotArtEditor && this._dotArtReplaceOldId) {
                this.dotArtEditor.replaceBlock(this._dotArtReplaceOldId, id);
                this._toast(`🪄 全て置換: ${id.replace('minecraft:', '')}`);
            }
            this._hideModal('modal-block-selector');
            this._dotArtReplaceOldId = null;
            return;
        }
        if (this._blockSelectorMode === 'palette') {
            if (this.dotArtEditor) {
                this.dotArtEditor.setBlock(id);
                // パレットに一時的に追加（UI表示用）
                this._addTempPaletteBlock(id, name);
                this._toast(`🎨 パレットにセット: ${name}`);
            }
            this._hideModal('modal-block-selector');
            return;
        }
        const which = this._blockSelectorMode === 'from' ? 'replace-from' : 'replace-to';
        document.getElementById(which).value = id;

        const nameEl = document.getElementById(`${which}-name`);
        const iconWrap = document.getElementById(`${which}-icon-wrap`);
        if (nameEl) nameEl.textContent = name;
        if (iconWrap) {
            // imgUrl が null の場合（カタログ選択時）はアイコンをウィキ等から取得
            let resolvedUrl = imgUrl;
            if (!resolvedUrl) {
                const rawId2 = id.replace('minecraft:', '');
                const imgId2 = this._bedrockToJava(rawId2);
                const wikiName2 = imgId2.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('_');
                const packUrl2 = ResourcePack.isLoaded() ? ResourcePack.getItemTextureUrl(id) : null;
                resolvedUrl = packUrl2 || `https://minecraft.wiki/images/Invicon_${wikiName2}.png`;
            }
            iconWrap.innerHTML = `<img src="${resolvedUrl}" style="width:20px;height:20px;image-rendering:pixelated;object-fit:contain;" onerror="this.parentNode.textContent='🧱'">`;
        }
        this._hideModal('modal-block-selector');
    }

    _getBlockCatalogEntries(category, search = '') {
        let rawIds;
        if (category === 'all') {
            const all = new Set();
            for (const key of Object.keys(BC_DATA)) {
                const data = BC_DATA[key];
                if (Array.isArray(data)) {
                    data.forEach(id => all.add(id));
                } else if (data && typeof data === 'object') {
                    Object.values(data).forEach(arr => Array.isArray(arr) && arr.forEach(id => all.add(id)));
                }
            }
            rawIds = [...all];
        } else {
            const catData = BC_DATA[category];
            if (!catData) {
                rawIds = [];
            } else if (Array.isArray(catData)) {
                rawIds = catData;
            } else {
                rawIds = Object.values(catData).flat();
            }
        }
        if (!search) return rawIds;
        const q = search.toLowerCase();
        return rawIds.filter(id => {
            const name = this.langData?.[id] || id.replace('minecraft:', '');
            return name.toLowerCase().includes(q) || id.includes(q);
        });
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
            const tn = to === 'minecraft:air' ? '🗑️ 削除' : (this.langData[to] || to.replace('minecraft:',''));
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
                <button class="mc-btn secondary small" data-from="${from}" style="flex-shrink:0;padding:0 0.4rem;font-size:0.7rem">✕</button>
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

    /** coords に置換を適用したコピーを返す（replacements.js の applyToCoords に委譲） */
    _applyReplacements(structureId, coords) {
        return applyToCoords(coords, this.replacements.get(structureId));
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
            const files = [...(e.dataTransfer?.files || [])].filter(f => /\.mcstructure$/i.test(f.name));
            if (files.length === 0) {
                this._toast('⚠️ .mcstructure ファイルのみドロップできます', 'error');
                return;
            }
            // 各ファイル＝1プロジェクトとして自動作成（複数ドロップ対応）
            for (const f of files) {
                try {
                    const name = f.name.replace(/\.mcstructure$/i, '');
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
        // サイドバーへのドロップ対応
        const sidebar = document.getElementById('sidebar');
        const sidebarHint = document.getElementById('sidebar-drop-hint');
        let sidebarDragCount = 0;
        sidebar.addEventListener('dragenter', (e) => {
            if (!Array.from(e.dataTransfer?.types || []).includes('Files')) return;
            sidebarDragCount++;
            if (sidebarHint) sidebarHint.classList.add('active');
        });
        sidebar.addEventListener('dragleave', () => {
            sidebarDragCount = Math.max(0, sidebarDragCount - 1);
            if (sidebarDragCount === 0 && sidebarHint) sidebarHint.classList.remove('active');
        });
        sidebar.addEventListener('dragover', (e) => {
            if (Array.from(e.dataTransfer?.types || []).includes('Files')) e.preventDefault();
        });
        sidebar.addEventListener('drop', async (e) => {
            e.preventDefault();
            sidebarDragCount = 0;
            if (sidebarHint) sidebarHint.classList.remove('active');
            const files = Array.from(e.dataTransfer.files).filter(f => /\.mcstructure$/i.test(f.name));
            if (files.length > 0) {
                e.stopPropagation(); // ウェルカム画面側のdropと重複しないよう
                await this._handleFiles(files);
            }
        });

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
            const files = Array.from(e.dataTransfer.files).filter(f => /\.mcstructure$/i.test(f.name));
            if (files.length > 0) this._handleFiles(files);
        });

        // 貼り付け (Ctrl+V) 対応
        window.addEventListener('paste', async (e) => {
            const items = e.clipboardData.items;
            const files = [];
            for (const item of items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && /\.mcstructure$/i.test(file.name)) files.push(file);
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
        const mcFiles = files.filter(f => /\.mcstructure$/i.test(f.name));
        // 巨大ファイル警告（解凍後 100MB 超は警告のみ）
        for (const f of mcFiles) {
            if (f.size > 50 * 1024 * 1024) {
                if (!confirm(`${f.name} は ${(f.size/1048576).toFixed(1)}MB あります。解析に時間がかかったりブラウザがフリーズする可能性があります。続行しますか？`)) {
                    return;
                }
            }
        }
        if (mcFiles.length === 0) { this._toast('⚠️ .mcstructure ファイルのみ対応しています', 'error'); return; }

        // If no project, create one from first file
        if (!this.currentProjectId) {
            const name = mcFiles[0].name.replace(/\.mcstructure$/i, '');
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
            const name = file.name.replace(/\.mcstructure$/i, '');
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

        // キャッシュ管理: 現在のプロジェクト以外の重いデータを解放 (P1改善)
        const currentProject = this._currentProject();
        if (currentProject) {
            const currentStructureIds = new Set(currentProject.structures.map(s => s.id));
            for (const cachedId of this.coordsCache.keys()) {
                if (!currentStructureIds.has(cachedId)) {
                    this.coordsCache.delete(cachedId);
                    this.bufferCache.delete(cachedId);
                }
            }
        }

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
                        // air（削除）に置換する場合は states を空にする
                        if (newName === 'minecraft:air') {
                            entry.states = {};
                        }
                        // 階段など向きのある素材は states を保持（方向・向きを引き継ぐ）
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
            this.viewer3d.clearSelectionIndicator();
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

            // 1) リソースパックがロード済みかつ item_texture.json に登録されている場合のみ使用
            const guess = this._guessRawIdAndStates(item.id);
            let packUrl = null;
            if (ResourcePack.isLoaded()) {
                // ネザーレンガ(ID: nether_brick)だけは単体アイテムアイコンではなくブロックの見た目を使いたい
                if (imgId === 'nether_brick') {
                    const faces = ResourcePack.getFaceUrls(item.id, { states: guess.states });
                    packUrl = (faces && faces.found) ? (faces.top || faces.side || faces.all)?.url : null;
                } else {
                    packUrl = ResourcePack.getItemTextureUrl(item.id) || null;
                }
            }

            const isNetherBrick = (imgId === 'nether_brick');
            const cdnBase = `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures`;
            const sources = [
                ...(packUrl ? [packUrl] : []),
                `https://minecraft.wiki/images/${isNetherBrick ? 'Nether_Bricks' : 'Invicon_' + wikiName}.png`,
                `${cdnBase}/item/${imgId}.png`,
                `${cdnBase}/block/${isNetherBrick ? 'nether_bricks' : imgId}.png`,
                // 一般的なブロック用フォールバック（側面など）
                `${cdnBase}/block/${imgId}_side.png`,
                `${cdnBase}/block/${imgId}_top.png`,
                `/textures/${imgId}.png`,
                `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2270%22>📦</text></svg>`
            ];
            const wikiUrl = `https://ja.minecraft.wiki/w/${encodeURIComponent(jaName)}`;
            const shulkerCount = Math.floor(item.slots / 27);
            const shulkerRem = item.slots % 27;

            const card = document.createElement('div');
            card.className = `block-card glass-card ${isPrepared ? 'prepared' : ''}`;
            card.dataset.id = item.id;
            card.title = 'クリックで3D表示をハイライト';
            // クリックで 3D ビューにハイライト送信（トグル動作）
            card.addEventListener('click', (e) => {
                if (e.target.closest('.prepared-label, .wiki-overlay, .block-name')) return;
                this._toggleHighlight(item.id, card);
            });

            card.innerHTML = `
                ${showWiki ? `<a href="${wikiUrl}" target="_blank" class="wiki-overlay" title="Wikiで開く">📖</a>` : ''}
                <label class="prepared-label" title="準備済み（完了）にマーク">
                    <input type="checkbox" class="prepared-check" data-id="${item.id}" ${isPrepared ? 'checked' : ''}>
                    <span class="check-vis"></span>
                </label>
                <div class="block-icon-wrap">
                    <img src="${sources[0]}"
                         onerror="if(this.dataset.i===undefined)this.dataset.i=0;let srcs=${JSON.stringify(sources).replace(/"/g, '&quot;')};if(++this.dataset.i&lt;srcs.length)this.src=srcs[this.dataset.i];"
                         class="block-icon-img" alt="">
                </div>
                <div class="block-info">
                    <div class="block-name ${showId ? 'is-id' : ''}" data-fullid="${item.id}" title="クリックでIDをコピー">${this._escape(displayName)}</div>
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
        try {
            localStorage.setItem('mc_planner_prepared', JSON.stringify(data));
        } catch (e) {
            console.warn('準備状況の保存に失敗しました(容量不足等):', e);
        }
    }

    _exportDotArtPng() {
        if (!this.dotArtEditor) { this._toast('まだドット絵がありません', 'error'); return; }
        // ユーザーに倍率を尋ねる（4xでだいたいスマホ壁紙にちょうどいい）
        const scaleStr = prompt('画像スケール倍率 (1 / 4 / 16)', '4');
        const scale = parseInt(scaleStr, 10);
        if (!scale || scale < 1 || scale > 32) return;

        const ed = this.dotArtEditor;
        
        const drawAndSave = (useIcons) => {
            // 毎回新しいキャンバスを作ることで「汚染」を引き継がないようにする
            const tmp = document.createElement('canvas');
            tmp.width = ed.gridW * scale;
            tmp.height = ed.gridH * scale;
            const ctx = tmp.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            ctx.clearRect(0, 0, tmp.width, tmp.height);
            // エディタの内部 grid を使って、指定した倍率で描画
            for (let y = 0; y < ed.gridH; y++) {
                for (let x = 0; x < ed.gridW; x++) {
                    const blockId = ed.grid[y][x];
                    if (blockId) {
                        const palette = DOT_PALETTE.find(p => p.id === blockId);
                        const px = x * scale;
                        const py = y * scale;
                        const icon = useIcons ? ed.icons[blockId] : null;

                        if (icon && icon.complete && icon.naturalWidth !== 0) {
                            try {
                                ctx.drawImage(icon, px, py, scale, scale);
                            } catch (e) {
                                // 描画に失敗（CORS 等）した場合は色で塗る
                                ctx.fillStyle = palette ? palette.color : '#888';
                                ctx.fillRect(px, py, scale, scale);
                            }
                        } else {
                            ctx.fillStyle = palette ? palette.color : '#888';
                            ctx.fillRect(px, py, scale, scale);
                        }
                    }
                }
            }
            
            try {
                const url = tmp.toDataURL('image/png');
                const proj = this._currentProject();
                const name = (proj?.name || 'dotart') + '_' + new Date().toISOString().slice(0,10) + '_x' + scale + '.png';
                const a = document.createElement('a');
                a.href = url;
                a.download = name;
                a.click();
                this._toast(`🖼️ ${name} を保存`);
            } catch (e) {
                if (useIcons) {
                    this._toast('⚠️ テクスチャ制限により、テクスチャ無しで保存を試みます。', 'warning');
                    drawAndSave(false);
                } else {
                    this._toast('❌ 保存に失敗しました。ブラウザの制限かもしれません。', 'error');
                }
            }
        };

        drawAndSave(true);
    }

    // ─── Dot Art ───────────────────────────────────────────────────────────────
    _initDotArt() {
        const canvas = document.getElementById('dotart-canvas');
        if (!this.dotArtEditor) {
            this.dotArtEditor = new DotArtEditor(canvas, {
                gridW: 32, gridH: 32, cellSize: 16,
                onUpdate: (counts) => this._renderDotArtMaterials(counts),
                getTexture: (id) => {
                    try {
                        if (!ResourcePack.isLoaded()) return null;
                        const faces = ResourcePack.getFaceUrls(id);
                        if (!faces) return null;
                        const face = faces.top || faces.all || faces.north || faces.up;
                        return face?.url || (typeof face === 'string' ? face : null);
                    } catch (e) {
                        return null;
                    }
                }
            });
            
            // 一括置換イベントのリスニング
            canvas.addEventListener('dotart-request-replace', (e) => {
                this._dotArtReplaceOldId = e.detail.oldId;
                this._blockSelectorMode = 'dotart';
                this._openBlockSelector();
            });

            this._setupDotArt();
        }
    }

    _setupDotArt() {
        const $ = id => document.getElementById(id);
        const ed = this.dotArtEditor;

        // モード切替
        const btnEdit = $('btn-dotart-mode-edit');
        const btnView = $('btn-dotart-mode-view');
        if (btnEdit && btnView) {
            btnEdit.onclick = () => {
                btnEdit.classList.replace('secondary', 'primary');
                btnView.classList.replace('primary', 'secondary');
                ed.setViewMode(false);
            };
            btnView.onclick = () => {
                btnView.classList.replace('secondary', 'primary');
                btnEdit.classList.replace('primary', 'secondary');
                ed.setViewMode(true);
            };
        }

        // ─── パレット生成（静的 import 済みの DOT_PALETTE を使用） ─────────
        const paletteBox = $('block-palette');
        paletteBox.innerHTML = '';
        DOT_PALETTE.forEach(p => {
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
                if (this.dotArtEditor) {
                    this.dotArtEditor.resize(w, h);
                    this._toast(`📏 グリッドを ${w}x${h} にリサイズ`);
                }
            } else {
                this._toast('サイズは 8 〜 2048 の範囲で指定してください', 'error');
            }
        };

        // パレット変更
        const btnPal = $('btn-palette-change');
        if (btnPal) {
            btnPal.onclick = () => {
                this._blockSelectorMode = 'palette';
                this._openBlockSelector();
            };
        }

        // クリア
        $('btn-clear-canvas').onclick = () => {
            if (confirm('キャンバスをクリアしますか？')) ed.clear();
        };

        // 画像から生成
        const fileIn = $('img2dot-file');
        $('btn-img2dot-pick').onclick = () => fileIn.click();
        fileIn.onchange = (e) => {
            const f = e.target.files[0];
            if (f) {
                this._lastDotArtFile = f;
                $('btn-img2dot-apply').disabled = false;
                this._img2dotConvert(f);
            }
            e.target.value = '';
        };

        // 再生成
        $('btn-img2dot-apply').onclick = () => {
            if (this._lastDotArtFile) this._img2dotConvert(this._lastDotArtFile);
        };

        // サイズモード切替
        const sizeMode = $('dotart-size-mode');
        const mapCtrls = $('dotart-map-size-controls');
        const cusCtrls = $('dotart-custom-size-controls');
        sizeMode.onchange = () => {
            const isMap = sizeMode.value === 'map';
            mapCtrls.style.display = isMap ? 'flex' : 'none';
            cusCtrls.style.display = isMap ? 'none' : 'flex';
        };

        // 地図サイズプレビュー
        const updateMapPreview = () => {
            const scale = parseInt($('map-scale').value);
            const tx = parseInt($('map-tiles-x').value) || 1;
            const ty = parseInt($('map-tiles-y').value) || 1;
            const unit = 128 * Math.pow(2, scale);
            $('map-size-preview').textContent = `計算後のサイズ: ${unit * tx} × ${unit * ty}`;
        };
        $('map-scale').addEventListener('change', updateMapPreview);
        $('map-tiles-x').addEventListener('input', updateMapPreview);
        $('map-tiles-y').addEventListener('input', updateMapPreview);

        // スライダーの数値表示更新
        ['contrast', 'saturation', 'dither'].forEach(id => {
            const range = $(`img2dot-${id}`);
            const val = $(`img2dot-${id}-val`);
            if (range && val) {
                range.addEventListener('input', () => { val.textContent = range.value; });
            }
        });

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

        // PNG保存
        $('btn-export-png').onclick = () => this._exportDotArtPng();

        // 構造としてプロジェクトに追加
        $('btn-dotart-to-struct').onclick = () => this._addDotArtAsStructure();
    }

    async _img2dotConvert(file) {
        this._showLoading('画像をブロックに変換中...');
        // UI描画の猶予を与える (P2改善)
        await new Promise(r => setTimeout(r, 50));

        try {
            const m = await import('./image2dot.js');
            const img = await m.loadImage(file);

            // サイズ決定モードの読み取り
            const sizeMode = document.getElementById('dotart-size-mode').value;
            let gridW, gridH;

            if (sizeMode === 'map') {
                const scale = parseInt(document.getElementById('map-scale').value);
                const tilesX = parseInt(document.getElementById('map-tiles-x').value) || 1;
                const tilesY = parseInt(document.getElementById('map-tiles-y').value) || 1;
                const unitSize = m.MAP_BASE_SIZE * Math.pow(2, scale);
                gridW = unitSize * tilesX;
                gridH = unitSize * tilesY;
            } else {
                gridW = parseInt(document.getElementById('grid-width').value) || 32;
                gridH = parseInt(document.getElementById('grid-height').value) || 32;
            }

            const mode = document.getElementById('img2dot-mode').value;
            const filterKey = document.getElementById('img2dot-filter').value;
            const trim = document.getElementById('img2dot-trim').checked;
            const airMode = document.getElementById('img2dot-air').checked;
            const contrast = parseFloat(document.getElementById('img2dot-contrast').value) || 1.0;
            const saturation = parseFloat(document.getElementById('img2dot-saturation').value) || 1.0;
            const dither = parseFloat(document.getElementById('img2dot-dither').value) || 0;

            const res = m.convert(img, {
                gridW, gridH,
                paletteFilter: m.FILTER_PRESETS[filterKey],
                autoTrim: trim,
                airMode,
                contrast,
                saturation,
                dither,
                mode: mode
            });

            this.dotArtEditor.resize(gridW, gridH);
            this.dotArtEditor.setData(res.grid); // setData で内部的に _saveState が呼ばれる
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

    _addTempPaletteBlock(id, name) {
        const $ = id => document.getElementById(id);
        const paletteBox = $('block-palette');
        if (!paletteBox) return;

        // 重複チェック
        const existing = [...paletteBox.querySelectorAll('.palette-btn')].find(b => b.dataset.id === id);
        if (existing) {
            existing.click();
            return;
        }

        const btn = document.createElement('button');
        btn.className = 'palette-btn active';
        btn.dataset.id = id;
        btn.title = name;
        
        // アイコン表示
        const iconUrl = ResourcePack.isLoaded() ? ResourcePack.getItemTextureUrl(id) : null;
        if (iconUrl) {
            btn.innerHTML = `<img src="${iconUrl}" style="width:100%;height:100%;image-rendering:pixelated;object-fit:contain;">`;
        } else {
            btn.style.backgroundColor = '#888';
            btn.textContent = '🧱';
        }

        document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
        btn.onclick = () => {
            document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (this.dotArtEditor) this.dotArtEditor.setBlock(id);
        };
        paletteBox.insertBefore(btn, paletteBox.firstChild);
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
        this._isRestoringBuffers = true;
        try {
            const all = await ResourcePack.loadAllStructureBuffers();
            if (!all || all.size === 0) return;
            for (const [id, entry] of all.entries()) {
                if (!entry || !entry.buffer) continue;
                this.bufferCache.set(id, entry.buffer);
            }
        } catch (e) {
            console.warn('Auto-restore structure buffers failed:', e);
        } finally {
            this._isRestoringBuffers = false;
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
        // サイドパネルを必ず展開（collapsedのままだとpointer-events:noneで操作不能になる）
        const panel = document.getElementById('viewer3d-side-panel');
        if (panel) {
            panel.classList.remove('collapsed');
            try { localStorage.removeItem('v3d_panel_collapsed'); } catch (_) {}
        }
        // ブロック編集セクションを必ず展開
        const replaceSection = document.querySelector('.v3d-section[data-section="replace"]');
        if (replaceSection) {
            replaceSection.open = true;
            try { localStorage.setItem('v3d_sec_replace', '1'); } catch (_) {}
        }

        const project = this._currentProject();
        if (project) {
            this._updateViewer3DSelect(project);
            // すでに3Dビューが初期化されている場合、プロジェクト切り替えに合わせて自動再読込
            if (this.viewer3d?.isInitialized) {
                this._load3DView();
            }
        }
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

    _getSliceValues() {
        const gi = id => parseInt(document.getElementById(id)?.value ?? 0, 10);
        return {
            yMin: gi('layer-min'),  yMax: gi('layer-max'),
            xMin: gi('layer-xmin'), xMax: gi('layer-xmax'),
            zMin: gi('layer-zmin'), zMax: gi('layer-zmax'),
        };
    }

    _onViewer3DClick(info) {
        // 既存ポップアップを閉じる
        document.getElementById('v3d-block-popup')?.remove();
        // ハイライト解除
        this.viewer3d?.clearSelectionIndicator();
        if (!info) return; // 空白クリック

        const { blockId, coord, screenX, screenY } = info;
        const name = this.langData?.[blockId] || blockId.replace('minecraft:', '');
        // 選択ブロックをハイライト（黄色）
        this.viewer3d?.setSelectionIndicator(coord);

        const popup = document.createElement('div');
        popup.id = 'v3d-block-popup';
        popup.style.cssText = `
            position:fixed; z-index:9999;
            left:${Math.min(screenX + 8, window.innerWidth - 230)}px;
            top:${Math.min(screenY + 8, window.innerHeight - 170)}px;
            background:var(--surface2,#1e2a3a); border:1px solid var(--border,#2a3f5a);
            border-radius:10px; padding:0.7rem 0.9rem; min-width:210px;
            box-shadow:0 8px 32px rgba(0,0,0,0.6); font-size:0.82rem; color:var(--text,#e2e8f0);
        `;

        const iconHtml = this._getBlockIconHtml(blockId);
        popup.innerHTML = `
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem;border-bottom:1px solid var(--border,#2a3f5a);padding-bottom:0.5rem">
                <div style="width:32px;height:32px;flex-shrink:0;outline:2px solid #f6d860;outline-offset:2px;border-radius:4px">${iconHtml}</div>
                <div>
                    <div style="font-weight:700;font-size:0.88rem;color:#f6d860">${this._escape(name)}</div>
                    <div style="font-size:0.65rem;color:var(--muted2,#64748b);margin-top:0.1rem">${this._escape(blockId)}</div>
                    ${coord ? `<div style="font-size:0.62rem;color:var(--muted2,#64748b)">X:${coord.x} Y:${coord.y} Z:${coord.z}</div>` : ''}
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.3rem">
                <button id="v3d-pop-set-replace" class="mc-btn secondary small" style="width:100%;text-align:left">🔄 置換元に設定</button>
                ${coord ? `<button id="v3d-pop-del-one" class="mc-btn secondary small" style="width:100%;text-align:left;color:var(--warning,#f6ad55)">🗑️ このブロック1つだけ削除</button>` : ''}
                <button id="v3d-pop-del-all" class="mc-btn secondary small" style="width:100%;text-align:left;color:var(--danger,#e55)">💥 この種類を全て削除</button>
                ${this._deletedPositions.size > 0 ? `<button id="v3d-pop-restore" class="mc-btn secondary small" style="width:100%;text-align:left;opacity:0.7">↺ 削除をリセット(${this._deletedPositions.size}件)</button>` : ''}
            </div>
        `;
        document.body.appendChild(popup);

        // 置換元に設定
        document.getElementById('v3d-pop-set-replace')?.addEventListener('click', () => {
            const fromEl = document.getElementById('replace-from');
            const fromNameEl = document.getElementById('replace-from-name');
            if (fromEl) fromEl.value = blockId;
            if (fromNameEl) fromNameEl.textContent = name;
            popup.remove();
            this._toast(`🔄 「${name}」を置換元に設定しました`);
        });

        // 1つだけ削除
        document.getElementById('v3d-pop-del-one')?.addEventListener('click', () => {
            if (coord) {
                this._deletedPositions.add(`${coord.x},${coord.y},${coord.z}`);
                this._applySlice();
                popup.remove();
                this._toast(`🗑️ 1ブロック削除しました (合計 ${this._deletedPositions.size} 件)`);
            }
        });

        // この種類を全て削除（置換として air に置換）
        document.getElementById('v3d-pop-del-all')?.addEventListener('click', () => {
            const fromEl = document.getElementById('replace-from');
            const toEl = document.getElementById('replace-to');
            const fromNameEl = document.getElementById('replace-from-name');
            const toNameEl = document.getElementById('replace-to-name');
            if (fromEl) fromEl.value = blockId;
            if (fromNameEl) fromNameEl.textContent = name;
            if (toEl) toEl.value = 'minecraft:air';
            if (toNameEl) toNameEl.textContent = 'air (削除)';
            // 置換リストに追加
            document.getElementById('btn-add-replace')?.click();
            popup.remove();
            this._toast(`💥 「${name}」を削除置換に追加しました`);
        });

        // 削除リセット
        document.getElementById('v3d-pop-restore')?.addEventListener('click', () => {
            this._deletedPositions.clear();
            this._applySlice();
            popup.remove();
            this._toast('↺ 削除をリセットしました');
        });

        // 他の場所クリックで閉じる（ハイライトも解除）
        const close = (e) => {
            if (!popup.contains(e.target)) {
                popup.remove();
                this.viewer3d?.clearSelectionIndicator();
                document.removeEventListener('pointerdown', close);
            }
        };
        setTimeout(() => document.addEventListener('pointerdown', close), 10);
    }

    _applySlice() {
        if (!this.viewer3d?.isInitialized || !this.viewer3d._lastCoords) return;
        const sel = document.getElementById('viewer3d-structure-select');
        const project = this._currentProject();
        const structure = project?.structures.find(s => s.id === sel?.value);
        if (!structure) return;
        const coords = this.coordsCache.get(sel.value);
        if (!coords) return;
        const replaced = this._applyReplacements(sel.value, coords);
        const filtered = this._deletedPositions.size > 0
            ? replaced.filter(c => !this._deletedPositions.has(`${c.x},${c.y},${c.z}`))
            : replaced;
        const { yMin, yMax, xMin, xMax, zMin, zMax } = this._getSliceValues();
        const cmRadio = document.querySelector('input[name="viewer3d-colormode"]:checked');
        this.viewer3d.loadStructure(filtered, structure.size, {
            yMin, yMax, xMin, xMax, zMin, zMax,
            colorMode: cmRadio?.value || 'material'
        });
    }

    async _load3DView() {
        if (this._isRestoringBuffers) {
            this._toast('構造データを復元中です。完了までお待ちください...', 'info');
            return;
        }
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
            
            // 現在の床タイプを適用
            const floorType = document.getElementById('floor-type-select')?.value || 'grass';
            this.viewer3d.setFloorType(floorType);

            // ─ スライダーの上限をこの構造に合わせてリセット ─
            const sz = structure.size;
            if (sz) {
                const setSlider = (id, valId, max, val) => {
                    const el = document.getElementById(id);
                    const vl = document.getElementById(valId);
                    if (el) { el.max = max; el.value = val; }
                    if (vl) vl.textContent = val;
                };
                setSlider('layer-min',  'layer-min-val',  sz.y - 1, 0);
                setSlider('layer-max',  'layer-max-val',  sz.y - 1, sz.y - 1);
                setSlider('layer-xmin', 'layer-xmin-val', sz.x - 1, 0);
                setSlider('layer-xmax', 'layer-xmax-val', sz.x - 1, sz.x - 1);
                setSlider('layer-zmin', 'layer-zmin-val', sz.z - 1, 0);
                setSlider('layer-zmax', 'layer-zmax-val', sz.z - 1, sz.z - 1);
            }

            const cmRadio = document.querySelector('input[name="viewer3d-colormode"]:checked');
            const colorMode = cmRadio ? cmRadio.value : 'material';
            const structureId = sel.value;
            const replacedCoords = this._applyReplacements(structureId, coords);
            // 置換が変わるたびにマテリアルキャッシュを破棄してテクスチャを引き直す
            this.viewer3d._matCache?.clear();
            const { yMin, yMax, xMin, xMax, zMin, zMax } = this._getSliceValues();
            // 1つ削除フィルタを適用
            const filteredCoords = this._deletedPositions.size > 0
                ? replacedCoords.filter(c => !this._deletedPositions.has(`${c.x},${c.y},${c.z}`))
                : replacedCoords;
            this.viewer3d.loadStructure(filteredCoords, structure.size, { yMin, yMax, xMin, xMax, zMin, zMax, colorMode });
            // クリックコールバックを毎回設定（再初期化後も有効）
            this.viewer3d.onBlockClick = (info) => this._onViewer3DClick(info);
            this._updateTextureStatusUI();

            const infoEl = document.getElementById('viewer3d-info');
            if (infoEl) {
                infoEl.innerHTML = `<p class="info-text">✅ ${coords.length.toLocaleString()}ブロック表示中 | ドラッグ:回転 / 右ドラッグ:パン / スクロール:ズーム</p>`;
            }
        } catch (err) {
            console.error('_load3DView failed:', err);
            this._toast('3D表示に失敗しました: ' + err.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.style.display = 'none'; // 開始ボタンは隠す
            }
            const reloadBtn = document.getElementById('btn-reload-3d');
            if (reloadBtn) reloadBtn.style.display = 'inline-block'; // 代わりに更新ボタンを出す
        }
    }

    /** テクスチャ読み込み状態のUI更新 */
    _updateTextureStatusUI() {
        const stats = this.viewer3d?.textureStats;
        const box = document.getElementById('v3d-texture-status');
        if (!box) return;

        if (!stats || this.viewer3d.colorMode !== 'realtexture') {
            box.querySelector('.status-summary').textContent = '— / —';
            box.querySelector('.status-detail').textContent = 'リアル表示モードではありません';
            return;
        }

        const total = stats.success + stats.missing;
        const successPercent = total > 0 ? Math.round((stats.success / total) * 100) : 0;
        
        box.querySelector('.status-summary').textContent = `${stats.success} / ${total} (${successPercent}%)`;
        
        if (stats.missing === 0) {
            box.querySelector('.status-detail').textContent = '✅ すべてのテクスチャが正常に解決されました';
            box.querySelector('.status-summary').style.color = 'var(--primary)';
        } else {
            const missingList = Array.from(stats.missingIds).slice(0, 3).map(id => id.replace('minecraft:', '')).join(', ');
            const more = stats.missingIds.size > 3 ? ` など計${stats.missingIds.size}種` : '';
            box.querySelector('.status-detail').innerHTML = `⚠️ <span style="color:var(--accent)">${stats.missing}個</span>のブロックでテクスチャ不足<br><small>${missingList}${more}</small>`;
            box.querySelector('.status-summary').style.color = 'var(--accent)';
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

    // ─────────────────────────────────────────────────────────────────────
    // TOUR SYSTEM
    // ─────────────────────────────────────────────────────────────────────

    _setupTour() {
        if (!document.getElementById('tour-style')) {
            const s = document.createElement('style');
            s.id = 'tour-style';
            s.textContent = [
                '#tour-overlay{position:fixed;inset:0;z-index:9000;pointer-events:none}',
                '#tour-overlay.active{display:block}',
                '#tour-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.01);z-index:9001;pointer-events:none}',
                '#tour-spotlight{position:fixed;z-index:9002;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.65);border-radius:6px}',
                /* フローティング説明カード */
                '#tour-card{position:fixed;z-index:9003;pointer-events:all;background:var(--surface2,#1e2840);border:1.5px solid var(--accent,#63b3ed);border-radius:12px;padding:1rem 1.2rem;width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.65)}',
                '#tour-title{font-size:1rem;font-weight:700;margin:0 0 0.5rem;color:var(--text,#e2e8f0)}',
                '#tour-body{font-size:0.86rem;color:var(--muted,#c8d4e8);margin:0;line-height:1.65;white-space:pre-line}',
                /* 固定ナビバー */
                '#tour-nav-bar{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:9004;display:flex;gap:0.6rem;align-items:center;background:var(--surface2,#1e2840);border:1.5px solid var(--accent,#63b3ed);border-radius:16px;padding:0.7rem 1.2rem;box-shadow:0 4px 28px rgba(0,0,0,0.65);pointer-events:all;white-space:nowrap}',
                '#tour-step-ind{font-size:0.9rem;color:var(--accent,#63b3ed);font-family:monospace;padding:0 0.6rem;min-width:54px;text-align:center;letter-spacing:.04em}',
                '#tour-prev-btn,#tour-next-btn{font-size:0.9rem!important;padding:0.48rem 1.1rem!important;min-width:84px}',
                '#tour-close-btn{font-size:0.82rem!important;padding:0.4rem 0.75rem!important;background:var(--surface3,#2d3748)!important;margin-left:0.4rem}',
                '#btn-tour:hover{background:rgba(99,179,237,0.15)!important}'
            ].join('\n');
            document.head.appendChild(s);
        }

        if (!document.getElementById('tour-overlay')) {
            const el = document.createElement('div');
            el.id = 'tour-overlay';
            /* 説明カード（スポットライト付近に浮かぶ、クリック透過） */
            el.innerHTML = '<div id="tour-backdrop"></div><div id="tour-spotlight"></div>'
                + '<div id="tour-card">'
                + '<h4 id="tour-title"></h4>'
                + '<p id="tour-body"></p>'
                + '</div>'
                /* ナビバー（常に画面下中央、マウス移動不要） */
                + '<div id="tour-nav-bar">'
                + '<button id="tour-prev-btn" class="mc-btn small secondary">← 前へ</button>'
                + '<span id="tour-step-ind">1 / 1</span>'
                + '<button id="tour-next-btn" class="mc-btn small primary">次へ →</button>'
                + '<button id="tour-close-btn" class="mc-btn small">✕ 閉じる</button>'
                + '</div>';
            document.body.appendChild(el);

            document.getElementById('tour-backdrop').onclick  = () => this._closeTour();
            document.getElementById('tour-close-btn').onclick = () => this._closeTour();
            document.getElementById('tour-prev-btn').onclick  = () => this._showTourStep(this._tourStep - 1);
            document.getElementById('tour-next-btn').onclick  = () => {
                if (this._tourStep < this._tourSteps.length - 1) this._showTourStep(this._tourStep + 1);
                else this._closeTour();
            };
            document.addEventListener('keydown', (e) => {
                if (!document.getElementById('tour-overlay')?.classList.contains('active')) return;
                if (e.key === 'Escape')    this._closeTour();
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') document.getElementById('tour-next-btn')?.click();
                if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   document.getElementById('tour-prev-btn')?.click();
            });
        }

        const btn = document.getElementById('btn-tour');
        if (btn) btn.onclick = () => this._startTour();
    }

    _startTour() {
        const nl = '\n';
        const TOURS = {
            materials: [
                { target: '#btn-add-structure',          pos: 'bottom', title: '① 構造ファイルを追加',    body: '「＋ 構造を追加」ボタンで .mcstructure ファイルを読み込みます。' + nl + 'ウェルカム画面へのドラッグ＆ドロップも使えます。' },
                { target: '#structures-list',            pos: 'bottom', title: '② 構造一覧',             body: '追加した構造ファイルがここに並びます。' + nl + '複数追加すると素材が自動的に合算されます。倍数設定も可能です。' },
                { target: '.stats-grid',                 pos: 'top',    title: '③ 合計素材',             body: '全構造のブロック数・種類・スタック数・シュルカー箱数が自動計算されます。' },
                { target: '#structure-breakdown-details',pos: 'top',    title: '④ 構造別の内訳',          body: 'クリックで展開すると、構造ごとの素材内訳を確認できます。' },
                { target: '#btn-copy-md',                pos: 'top',    title: '⑤ エクスポート',          body: 'Markdown形式でコピーしたり CSVとして書き出せます。' + nl + 'チェックリストや在庫管理表として使えます。' },
                { target: '#search-input',               pos: 'top',    title: '⑥ 検索とフィルター',       body: 'ブロック名で絞り込んだり、建築・装飾などカテゴリ別にフィルターをかけられます。' }
            ],
            viewer3d: [
                { target: '#btn-load-3d',                pos: 'bottom', title: '① 3D表示を開始',         body: 'このボタンを押すと構造が3Dでレンダリングされます。' + nl + 'はじめに必ず押してください。' },
                { target: '#viewer3d-structure-select',  pos: 'bottom', title: '② 構造を選択',           body: '複数の構造がある場合、ここで表示したいものを切り替えられます。' },
                { target: '#viewer3d-container',         pos: 'right',  title: '③ 3Dビューの操作',       body: '【回転】右ドラッグ' + nl + '【パン】Shift + 左ドラッグ' + nl + '【ズーム】マウスホイール' + nl + '【ブロック選択】左クリック → 名前・置換・削除メニュー' },
                { target: '[data-section="replace"]',    pos: 'left',   title: '④ ブロック置換',          body: '素材Aを素材Bに一括置換できます。' + nl + 'コスト削減やデザイン変更に便利です。' },
                { target: '[data-section="textures"]',   pos: 'left',   title: '⑤ テクスチャパック',      body: '公式リソースパック（zip）をアップロードすると' + nl + 'リアルなテクスチャになります。' },
                { target: '#btn-export-mcstructure',     pos: 'left',   title: '⑥ 構造をエクスポート',    body: '置換後の構造を .mcstructure でダウンロードできます。' + nl + 'そのままMinecraftでインポートして使えます。' },
                { target: '#layer-min',                      pos: 'left',   title: '⑦ 断面フィルター',          body: 'Y/X/Z 各軸の最小・最大スライダーを動かすと' + nl + 'その範囲だけを切り出して3D表示できます。' + nl + '内部構造の確認に便利です。↺ リセットで全体に戻ります。' }
            ],
            dotart: [
                { target: '#btn-img2dot-pick',           pos: 'bottom', title: '① 画像を選んで自動変換',  body: 'まずはこのボタンで画像を選びましょう。' + nl + '一瞬でマイクラのドット絵に変換されます！' },
                { target: '#dotart-size-mode',           pos: 'bottom', title: '② サイズを微調整する',  body: '思ったより大きい/小さい時はここで。' + nl + '設定を変えて「✨ 再生成」を押せば即座に反映されます。' },
                { target: '#dotart-canvas',              pos: 'right',  title: '③ 変換されたドット絵',  body: 'ここに結果が表示されます。' + nl + '細かい部分はペンや消しゴムで直接直せます。' },
                { target: '.tool-buttons',               pos: 'right',  title: '④ 便利な「一括置換」',   body: '魔法の杖 (🪄) ツールを使うと、' + nl + '特定の色を別のブロックに一気に置き換えられます。' },
                { target: '#btn-palette-change',         pos: 'left',   title: '⑤ パレットを自由に増やす',body: 'カタログから好きなブロックを選んで、' + nl + '自分だけのパレットを組み立てましょう。' },
                { target: '#dotart-materials',           pos: 'left',   title: '⑥ 必要なブロックを確認',  body: '最後はここで合計数を確認。' + nl + '「構造として追加」すれば、建築リストに合算されます！' }
            ],
            settings: [
                { target: '#panel-settings', pos: 'top', title: '⚙️ 設定',
                  body: 'アプリの外観・データ管理・初期化などが行えます。' + nl + '設定はブラウザに自動保存されます。' }
            ],
            home: [
                { target: '.welcome-icon',                pos: 'bottom', title: '👋 Structure Planner へようこそ',
                  body: '.mcstructure ファイルを読み込んで' + nl + '素材管理・3D表示・ドット絵作成ができるツールです。' },
                { target: '#btn-drop-file',               pos: 'bottom', title: '① ファイルを開く',
                  body: 'ボタンを押してファイル選択するか、' + nl + 'ファイルをこの画面にドラッグ＆ドロップで追加できます。' },
                { target: '#btn-create-project-welcome',  pos: 'bottom', title: '② 新規プロジェクト',
                  body: '空のプロジェクトを作って、後からファイルを追加していくこともできます。' },
                { target: '#sidebar-drop-hint',           pos: 'right',  title: '③ サイドバーにもドロップ',
                  body: '左のプロジェクト一覧エリアにもドラッグ＆ドロップできます。' + nl + 'ファイルを素早く追加したいときに便利です。' },
                { target: '#project-list',                pos: 'right',  title: '④ プロジェクト一覧',
                  body: '追加したプロジェクトがここに並びます。' + nl + 'クリックで開き、右クリックで削除・名前変更ができます。' },
                { target: '#btn-new-project',             pos: 'bottom', title: '⑤ 新規プロジェクト',
                  body: '新しいプロジェクトを作成します。' + nl + '作成後に構造ファイルを追加してください。' }
            ]
        };

        const isWelcome = !document.getElementById('welcome-screen').classList.contains('hidden');
        this._tourSteps = isWelcome ? TOURS.home : (TOURS[this.currentTab] || TOURS.materials);
        this._tourStep  = 0;
        document.getElementById('tour-overlay').classList.add('active');
        this._showTourStep(0);
    }

    // ─── スプリング状態（rAF + バネ物理アニメーション用）─────────────────
    _initTourSpring() {
        // スポットライト用 (x,y,w,h) とカード用 (cx,cy) を別々に管理
        // カードはスポットライトより少し遅れて追いかける（先行演出）
        return {
            // スポットライト現在値
            x:0, y:0, w:0, h:0,
            // スポットライト速度
            vx:0, vy:0, vw:0, vh:0,
            // スポットライト目標
            tx:0, ty:0, tw:0, th:0,
            // カード現在値
            cx:0, cy:0,
            // カード速度
            vcx:0, vcy:0,
            // カード目標（スポットライトと共通計算）
            tcx:0, tcy:0,
            init: false  // 最初だけ即座に配置
        };
    }

    _tickTourSpring(now) {
        if (!this._tourSpring || !document.getElementById('tour-overlay')?.classList.contains('active')) return;
        const s = this._tourSpring;
        const dt = Math.min((now - (s._prevTime || now)) / 1000, 0.05);
        s._prevTime = now;

        // バネ定数: K=stiffness, D=damping
        // ζ = D/(2√K) ≈ 0.72 → わずかにアンダーダンプ（小さなオーバーシュート）
        const K = 260, D = 26;
        // カードはスポットライトより少し柔らかく追いかける
        const CK = 200, CD = 22;

        const spring = (pos, vel, tgt, k, d) => {
            const acc = k * (tgt - pos) - d * vel;
            const nv = vel + acc * dt;
            const np = pos + nv * dt;
            return [np, nv];
        };

        [s.x, s.vx] = spring(s.x, s.vx, s.tx, K, D);
        [s.y, s.vy] = spring(s.y, s.vy, s.ty, K, D);
        [s.w, s.vw] = spring(s.w, s.vw, s.tw, K, D);
        [s.h, s.vh] = spring(s.h, s.vh, s.th, K, D);
        [s.cx, s.vcx] = spring(s.cx, s.vcx, s.tcx, CK, CD);
        [s.cy, s.vcy] = spring(s.cy, s.vcy, s.tcy, CK, CD);

        // 遠距離移動でも速度を制限（長距離ステップが高速になりすぎないよう）
        const MAX_V = 550;
        s.vx  = Math.max(-MAX_V, Math.min(MAX_V, s.vx));
        s.vy  = Math.max(-MAX_V, Math.min(MAX_V, s.vy));
        s.vw  = Math.max(-MAX_V, Math.min(MAX_V, s.vw));
        s.vh  = Math.max(-MAX_V, Math.min(MAX_V, s.vh));
        s.vcx = Math.max(-MAX_V, Math.min(MAX_V, s.vcx));
        s.vcy = Math.max(-MAX_V, Math.min(MAX_V, s.vcy));

        const sp = document.getElementById('tour-spotlight');
        if (sp) {
            sp.style.left   = s.x + 'px';
            sp.style.top    = s.y + 'px';
            sp.style.width  = s.w + 'px';
            sp.style.height = s.h + 'px';
        }
        const card = document.getElementById('tour-card');
        if (card) {
            card.style.left = s.cx + 'px';
            card.style.top  = s.cy + 'px';
        }

        // まだ動いているなら次フレームも走らせる
        const settled = [
            Math.abs(s.tx-s.x), Math.abs(s.ty-s.y), Math.abs(s.tw-s.w), Math.abs(s.th-s.h),
            Math.abs(s.tcx-s.cx), Math.abs(s.tcy-s.cy),
            Math.abs(s.vx), Math.abs(s.vy), Math.abs(s.vw), Math.abs(s.vh),
            Math.abs(s.vcx), Math.abs(s.vcy)
        ].every(v => v < 0.15);

        if (!settled) {
            this._tourRafId = requestAnimationFrame(t => this._tickTourSpring(t));
        } else {
            this._tourRafId = null;
        }
    }

    _startTourSpringRaf() {
        if (this._tourRafId) cancelAnimationFrame(this._tourRafId);
        if (!this._tourSpring) return;  // _closeTour後の安全ガード
        this._tourSpring._prevTime = performance.now();
        // 同じ位置でも必ずRAFを起動して settled チェックを通す
        this._tourRafId = requestAnimationFrame(t => this._tickTourSpring(t));
    }

    _showTourStep(idx) {
        const steps = this._tourSteps;
        if (!steps || idx < 0 || idx >= steps.length) return;
        this._tourStep = idx;
        const step = steps[idx];

        const el = document.querySelector(step.target);
        if (!el) {
            if (idx < steps.length - 1) { this._showTourStep(idx + 1); return; }
            else { this._closeTour(); return; }
        }

        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

        // スポットライト・カードの目標座標を計算してスプリングの目標に設定
        const computeTargets = () => {
            const rect = el.getBoundingClientRect();
            const pad  = 8;
            const s    = this._tourSpring;

            // スポットライト目標
            s.tx = rect.left   - pad;
            s.ty = rect.top    - pad;
            s.tw = rect.width  + pad * 2;
            s.th = rect.height + pad * 2;

            // カード目標
            const card = document.getElementById('tour-card');
            const vw = window.innerWidth, vh = window.innerHeight;
            const cw = 308, ch = (card?.offsetHeight || 190);
            const pos = step.pos || 'bottom';
            let cx, cy;
            if (pos === 'bottom')    { cx = Math.min(Math.max(rect.left, 8), vw-cw-8); cy = Math.min(rect.bottom+pad+8, vh-ch-8); }
            else if (pos === 'top')  { cx = Math.min(Math.max(rect.left, 8), vw-cw-8); cy = Math.max(rect.top-ch-pad-8, 8); }
            else if (pos === 'left') { cx = Math.max(rect.left-cw-pad-8, 8);           cy = Math.min(Math.max(rect.top, 8), vh-ch-8); }
            else                     { cx = Math.min(rect.right+pad+8, vw-cw-8);       cy = Math.min(Math.max(rect.top, 8), vh-ch-8); }
            s.tcx = cx; s.tcy = cy;

            // 初回のみ瞬間配置（アニメーションなし）
            if (!s.init) {
                s.x=s.tx; s.y=s.ty; s.w=s.tw; s.h=s.th;
                s.cx=cx; s.cy=cy;
                s.init = true;
            }
        };

        // スプリング初期化（未作成なら）
        if (!this._tourSpring) this._tourSpring = this._initTourSpring();
        computeTargets();
        this._startTourSpringRaf();

        // ページスクロール等で目標がずれるのを補正（軽量な再計算）
        if (this._tourTargetTimer) clearInterval(this._tourTargetTimer);
        this._tourTargetTimer = setInterval(() => {
            if (!this._tourSpring || !document.getElementById('tour-overlay')?.classList.contains('active')) {
                clearInterval(this._tourTargetTimer); return;
            }
            computeTargets();
            if (!this._tourRafId) this._startTourSpringRaf();
        }, 200);

        // カードの中身を更新
        const titleEl = document.getElementById('tour-title');
        if (titleEl) titleEl.textContent = step.title || '';
        const bodyEl = document.getElementById('tour-body');
        if (bodyEl) bodyEl.textContent  = step.body  || '';
        const stepInd = document.getElementById('tour-step-ind');
        if (stepInd) stepInd.textContent = `${idx + 1} / ${steps.length}`;
        const prevBtn = document.getElementById('tour-prev-btn');
        const nextBtn = document.getElementById('tour-next-btn');
        if (prevBtn) prevBtn.disabled = idx === 0;
        if (nextBtn) nextBtn.textContent = idx === steps.length - 1 ? '✓ 閉じる' : '次へ →';
    }

    _closeTour() {
        if (this._tourRafId) { cancelAnimationFrame(this._tourRafId); this._tourRafId = null; }
        clearInterval(this._tourTargetTimer);
        this._tourSpring = null; // 次回開始時に再初期化
        document.getElementById('tour-overlay')?.classList.remove('active');
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
