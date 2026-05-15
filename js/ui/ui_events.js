import { DotArtEditor, DOT_PALETTE } from '../ui/panels/dotart.js';
import { Viewer3D } from '../render/viewer3d.js';
import * as ResourcePack from '../resourcepack.js';
import * as Image2Dot from '../image2dot.js';
import { DOWNGRADE_PRESETS, applyToCoords, applyToResults, applicablePairsForStructure } from '../replacements.js';
import { BLOCK_CATALOG as BC_DATA } from '../block_catalog.js';
import { normalizeId } from '../bedrock_normalize.js';
import { ProjectManager } from '../core/project-manager.js';
import { exportCsv, copyAsMarkdown, exportAllProjects, exportMcStructure } from '../io/export-utils.js';

/**
 * ui_events.js — プレゼンテーション層
 * DOM 要素の取得、イベントリスナーの登録、モーダル表示、タブ切り替え、
 * トースト通知、ローディング、ブロック選択モーダル、ツアーシステム など。
 *
 * App クラスに mixin する形で使用する。
 * 各メソッドは this が App インスタンスを指すことを前提とする。
 */

// ─── MC_COLORS 定数（dotart との共有） ────────────────────────────────────────
export const MC_COLORS = [
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

// ─── DOM ヘルパー ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── UI メソッド群（App クラスへ mixin） ─────────────────────────────────────
export const UIMixin = {

    // ── モーダル ────────────────────────────────────────────────────────────
    _showModal(id) { $(id)?.classList.remove('hidden'); },
    _hideModal(id) { if (id) $(id)?.classList.add('hidden'); },

    // ── ローディング ─────────────────────────────────────────────────────────
    _showLoading(msg = '解析中...') {
        const overlay = $('loading-overlay');
        if (!overlay) return;
        const p = overlay.querySelector('p');
        if (p) p.textContent = msg;
        overlay.classList.remove('hidden');
    },
    _hideLoading() {
        $('loading-overlay')?.classList.add('hidden');
    },

    // ── トースト ─────────────────────────────────────────────────────────────
    _toast(msg, type = 'success') {
        const container = $('toast-container');
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
    },

    // ── ユーティリティ ────────────────────────────────────────────────────────
    _escape(str) {
        return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    },
    _relDate(ts) {
        const d = Date.now() - ts;
        if (d < 60000) return 'たった今';
        if (d < 3600000) return `${Math.floor(d / 60000)}分前`;
        if (d < 86400000) return `${Math.floor(d / 3600000)}時間前`;
        return new Date(ts).toLocaleDateString('ja-JP');
    },
    _setStatVal(id, val) {
        const el = $(id)?.querySelector('.stat-value');
        if (el) el.textContent = val;
    },
    _bedrockToJava(rawId) {
        const map = {
            brick_block: 'bricks', double_stone_block_slab: 'stone',
            stone_block_slab: 'stone_slab', iron_chain: 'chain',
            grass: 'grass_block', hardened_clay: 'terracotta',
            stained_hardened_clay: 'terracotta', sealantern: 'sea_lantern'
        };
        return map[rawId] || rawId;
    },
    _guessRawIdAndStates(blockId) {
        const local = String(blockId).replace(/^minecraft:/, '').toLowerCase();
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
        const colorWoolMatch = local.match(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(wool|carpet|concrete|concrete_powder|stained_glass|stained_glass_pane|terracotta|shulker_box|bed)$/);
        if (colorWoolMatch) {
            const c = colorWoolMatch[1] === 'light_gray' ? 'silver' : colorWoolMatch[1];
            const baseMap = { wool:'wool', carpet:'carpet', concrete:'concrete', concrete_powder:'concretepowder', stained_glass:'stained_glass', stained_glass_pane:'stained_glass_pane', terracotta:'stained_hardened_clay', shulker_box:'shulker_box', bed:'bed' };
            return { rawId: 'minecraft:' + baseMap[colorWoolMatch[2]], states: { color: c } };
        }
        if (local === 'polished_andesite') return { rawId: 'minecraft:stone', states: { stone_type: 'andesite_smooth' } };
        if (local === 'andesite') return { rawId: 'minecraft:stone', states: { stone_type: 'andesite' } };
        if (local === 'polished_diorite') return { rawId: 'minecraft:stone', states: { stone_type: 'diorite_smooth' } };
        if (local === 'diorite') return { rawId: 'minecraft:stone', states: { stone_type: 'diorite' } };
        if (local === 'polished_granite') return { rawId: 'minecraft:stone', states: { stone_type: 'granite_smooth' } };
        if (local === 'granite') return { rawId: 'minecraft:stone', states: { stone_type: 'granite' } };
        if (local === 'mossy_stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'mossy' } };
        if (local === 'cracked_stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'cracked' } };
        if (local === 'chiseled_stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'chiseled' } };
        if (local === 'stone_bricks') return { rawId: 'minecraft:stonebrick', states: { stone_brick_type: 'default' } };
        if (local === 'coarse_dirt') return { rawId: 'minecraft:dirt', states: { dirt_type: 'coarse' } };
        return { rawId: blockId, states: null };
    },

    // ── DOM セットアップ ──────────────────────────────────────────────────────
    _setupDOM() {
        $('btn-new-project').onclick = () => this._showModal('modal-new-project');
        $('btn-go-home').onclick = () => this._goHome();
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

        $('btn-drop-file').onclick = () => $('file-input').click();
        $('btn-create-project-welcome').onclick = () => this._showModal('modal-new-project');

        $('btn-add-structure').onclick = () => {
            $('file-input').setAttribute('multiple', '');
            $('file-input').click();
        };
        $('btn-project-menu').onclick = (e) => this._showProjectMenu(e);

        $('file-input').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            e.target.value = '';
            if (files.length > 0) this._handleFiles(files);
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
        });

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

        $('id-toggle').addEventListener('change', () => this._renderBlockList());
        $('wiki-toggle').addEventListener('change', () => this._renderBlockList());

        document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
            btn.addEventListener('click', () => this._hideModal(btn.dataset.modal || btn.closest('.modal-overlay')?.id));
        });
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => { if (e.target === overlay) this._hideModal(overlay.id); });
        });

        document.addEventListener('keydown', (e) => {
            const active = document.activeElement;
            const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable);

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' || e.key === 'Z') {
                    if (this.currentTab === 'dotart' && this.dotArtEditor && !document.querySelector('.modal-overlay:not(.hidden)')) {
                        e.preventDefault();
                        if (e.shiftKey) this.dotArtEditor.redo();
                        else this.dotArtEditor.undo();
                    } else if (this.currentTab === 'viewer3d' && !isInput) {
                        e.preventDefault();
                        this._undoLastAction();
                    }
                } else if (e.key === 'y' || e.key === 'Y') {
                    if (this.currentTab === 'dotart' && this.dotArtEditor && !document.querySelector('.modal-overlay:not(.hidden)')) {
                        e.preventDefault();
                        this.dotArtEditor.redo();
                    }
                }
                return;
            }

            if (isInput) return;

            if (['1','2','3','4'].includes(e.key)) {
                const tabs = ['materials', 'viewer3d', 'dotart', 'settings'];
                this._switchTab(tabs[parseInt(e.key) - 1]);
            }

            if (e.code === 'Space' && this.currentTab === 'viewer3d' && this.viewer3d) {
                e.preventDefault();
                this.viewer3d.resetCamera();
            }
        });

        this._setupMultiplierModal();

        document.querySelector('[data-tab="settings"]').addEventListener('click', () => {
            const count = this.projects.length;
            $('setting-project-count').textContent = `${count} / ${ProjectManager.MAX_PROJECTS}`;
            try {
                const bytes = new Blob([localStorage.getItem('mc_planner_v2') || '']).size;
                $('setting-storage-size').textContent = bytes > 1024
                    ? `${(bytes / 1024).toFixed(1)} KB`
                    : `${bytes} B`;
            } catch { $('setting-storage-size').textContent = '—'; }
        });

        if ($('btn-export-all')) $('btn-export-all').onclick = () => this._exportAll();
        if ($('btn-import-data')) $('btn-import-data').onclick = () => this._importData();
        const csvBtn = $('btn-export-csv');
        if (csvBtn) csvBtn.onclick = () => this._exportCsv();
        const mdBtn = $('btn-copy-md');
        if (mdBtn) mdBtn.onclick = () => this._copyAsMarkdown(mdBtn);
        if ($('btn-clear-all-data')) $('btn-clear-all-data').onclick = async () => {
            if (confirm('全データを削除しますか？この操作は取り消せません（プロジェクト・構造バッファ・テクスチャパック含む）。')) {
                localStorage.clear();
                try { await ResourcePack.clearAllStructureBuffers(); } catch (_) {}
                try { await ResourcePack.clearSavedPack(); } catch (_) {}
                location.reload();
            }
        };

        const resetIdbBtn = $('btn-reset-idb');
        if (resetIdbBtn) resetIdbBtn.onclick = async () => {
            if (!confirm('IndexedDB を完全にリセットします（すべてのプロジェクト・テクスチャパック・構造バッファが消えます）。続行しますか？')) return;
            try { await ResourcePack.clearAllStructureBuffers(); } catch(_) {}
            try { await ResourcePack.clearSavedPack(); } catch(_) {}
            try {
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
        if ($('btn-clear-struct-cache')) $('btn-clear-struct-cache').onclick = async () => {
            if (!confirm('構造解析キャッシュをクリアしますか？\n次回読み込み時に全ての構造が最新ロジックで再解析されます。')) return;
            await ResourcePack.clearAllStructureBuffers();
            this._toast('🧹 解析キャッシュをクリアしました。ページをリロードしてください。');
            setTimeout(() => location.reload(), 1500);
        };

        this._setup3DViewTab();
    },

    // ── マルチプライヤーモーダル ───────────────────────────────────────────────
    _setupMultiplierModal() {
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

        const confirmBtn = $('btn-confirm-mult');
        if (confirmBtn) confirmBtn.onclick = () => {
            const active = document.querySelector('.mult-btn.active');
            if (!active) return;
            let mult;
            if (active.dataset.mult === 'custom') {
                mult = parseInt($('custom-mult-input').value, 10) || 1;
            } else {
                mult = parseInt(active.dataset.mult, 10);
            }
            mult = Math.max(1, mult);
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
    },

    // ── 3D ビュータブ セットアップ ───────────────────────────────────────────
    _setup3DViewTab() {
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

        const btnLoad3d = $('btn-load-3d');
        if (btnLoad3d) btnLoad3d.onclick = () => this._load3DView();
        const btnReload3d = $('btn-reload-3d');
        if (btnReload3d) btnReload3d.onclick = () => this._load3DView();
        const btnResetCam = $('btn-reset-camera');
        if (btnResetCam) btnResetCam.onclick = () => this.viewer3d?.resetCamera();

        $('floor-type-select').addEventListener('change', (e) => {
            if (this.viewer3d) this.viewer3d.setFloorType(e.target.value);
        });

        const btnReplaceAdd = $('btn-replace-add');
        if (btnReplaceAdd) btnReplaceAdd.onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            const fromRaw = $('replace-from').value;
            const rawTo = $('replace-to').value;
            if (!fromRaw || !rawTo) {
                this._toast('置換元と置換先を選択してください', 'error');
                return;
            }
            const fromIds = fromRaw.split(',').map(s => normalizeId(s.trim())).filter(Boolean);
            const to = normalizeId(rawTo);
            const toLabel = (to === 'minecraft:air' || to === 'air') ? '削除（air）' : to.replace('minecraft:', '');
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
            const isDelete = (to === 'minecraft:air');
            if (isDelete) {
                this._resetReplacePickers();
            } else {
                $('replace-to').value = '';
                $('replace-to-name').textContent = '置換先を選択...';
                $('replace-to-icon-wrap').textContent = '📦';
            }
            if (this.viewer3d?.isInitialized) this._load3DView();
        };
        const btnReplaceReset = $('btn-replace-reset');
        if (btnReplaceReset) btnReplaceReset.onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            this.replacements.delete(sel);
            this._renderReplaceList(sel);
            this._renderProjectView();
            this._toast('置換をリセットしました');
            if (this.viewer3d?.isInitialized) this._load3DView();
        };

        const btnApplyDowngrade = $('btn-apply-downgrade');
        if (btnApplyDowngrade) btnApplyDowngrade.onclick = () => {
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

        const btnExportMc = $('btn-export-mcstructure');
        if (btnExportMc) btnExportMc.onclick = () => this._exportMcStructure();

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

        $('viewer3d-structure-select').addEventListener('change', () => {
            this._resetReplacePickers();
            this._renderReplaceList($('viewer3d-structure-select').value);
        });

        this._setupBlockSelectorModal();

        document.querySelectorAll('input[name="viewer3d-colormode"]').forEach(r => {
            r.addEventListener('change', () => {
                if (!r.checked || !this.viewer3d) return;
                this.viewer3d.setColorMode(r.value);
            });
        });

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
    },

    // ── 置換ピッカーリセット ──────────────────────────────────────────────────
    _resetReplacePickers() {
        $('replace-from').value = '';
        $('replace-to').value = '';
        $('replace-from-name').textContent = '現在の構造から選択...';
        $('replace-to-name').textContent = '置換先を選択...';
        $('replace-from-icon-wrap').textContent = '📦';
        $('replace-to-icon-wrap').textContent = '📦';
        this._fromSelections?.clear();
        $('multi-select-bar')?.remove();
    },

    // ── 置換リスト描画 ────────────────────────────────────────────────────────
    _renderReplaceList(structureId) {
        const list = $('replace-list');
        if (!list) return;
        const map = this.replacements.get(structureId);
        if (!map || map.size === 0) { list.innerHTML = '<em>（置換なし）</em>'; return; }

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
    },

    // ── ブロック選択モーダル ──────────────────────────────────────────────────
    _setupBlockSelectorModal() {
        try {
            this._blockSelectorMode = 'to';
            this._fromSelections = new Set();

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

            document.querySelectorAll('#modal-block-selector .tab-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#modal-block-selector .tab-pill').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this._renderBlockSelectorGrid(btn.dataset.cat);
                });
            });

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
    },

    _openBlockSelector() {
        try {
            const searchEl = $('block-selector-search');
            if (searchEl) searchEl.value = '';
            const tabs = document.querySelectorAll('#modal-block-selector .tab-pill');

            if (this._blockSelectorMode === 'from') {
                const title = $('block-selector-title');
                const sub   = $('block-selector-sub');
                if (title) title.textContent = '置換元のブロック選択（複数選択可）';
                if (sub)   sub.textContent   = '現在の構造のブロックをクリックして選択（複数OK）';
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
    },

    _renderBlockSelectorGrid(category) {
        const grid = $('block-selector-grid');
        const search = $('block-selector-search').value.toLowerCase();
        const sel = $('viewer3d-structure-select').value;
        const project = this._currentProject();
        const structure = project?.structures.find(s => s.id === sel);
        const currentResults = structure?.results || [];

        grid.innerHTML = '';
        $('multi-select-bar')?.remove();

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
                    $('replace-from').value = ids.join(',');
                    $('replace-from-name').textContent = ids.length === 1 ? (this.langData?.[ids[0]] || ids[0].replace('minecraft:','')) : `${ids.length}件選択`;
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
                        $('multi-select-count').textContent = `${this._fromSelections.size}件選択中`;
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
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));grid-auto-rows:min-content;gap:0.5rem;overflow-y:auto;align-items:start;align-content:start;';

            if (category === 'special') {
                const delCard = document.createElement('button');
                delCard.className = 'block-pick-card';
                delCard.style.border = '1.5px dashed var(--danger,#e55)';
                delCard.innerHTML = `<div class="block-pick-icon-wrap" style="font-size:1.6rem">🗑️</div><span class="block-pick-name" style="color:var(--danger,#e55)">削除 (air)</span>`;
                delCard.onclick = () => this._selectBlockFromModal('minecraft:air', '削除（air）', null);
                grid.appendChild(delCard);
            }


            if (category === 'all' && !search) {
                this._renderAllTabWithFolders(grid);
                return;
            }

            const allIds = this._getBlockCatalogEntries(category, search);
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
    },

    _renderBlockCard(grid, blockId) {
        const name = this.langData?.[blockId] || blockId.replace('minecraft:', '');
        const card = document.createElement('button');
        card.className = 'block-pick-card';
        card.innerHTML = `<div class="block-pick-icon-wrap">${this._getBlockIconHtml(blockId)}</div><span class="block-pick-name">${this._escape(name)}</span>`;
        card.onclick = () => this._selectBlockFromModal(blockId, name, card.querySelector('img')?.src);
        grid.appendChild(card);
    },

    _onWaxButtonClicked() {
        const fromVal = $('replace-from').value;
        if (!fromVal) return this._toast('置換元を先に選んでください', 'error');
        const ids = fromVal.split(',');
        const waxedIds = ids.map(id => {
            if (id.startsWith('minecraft:waxed_')) return id;
            return 'minecraft:waxed_' + id.replace('minecraft:', '');
        });
        const toId = waxedIds.join(',');
        const toName = waxedIds.length === 1 ? (this.langData?.[waxedIds[0]] || waxedIds[0].replace('minecraft:','')) : `${waxedIds.length}件を錆止め`;
        $('replace-to').value = toId;
        $('replace-to-name').textContent = toName;
        this._hideModal('modal-block-selector');
        this._toast('🛡️ 錆止め状態にセットしました');
    },

    _saveCustomFolders() {
        localStorage.setItem('mc_planner_block_folders', JSON.stringify(this._customFolders));
    },

    _renderAllTabWithFolders(grid) {
        const allIds = this._getBlockCatalogEntries('all');
        const inFolderSet = new Set(this._customFolders.flatMap(f => f.blockIds));
        const unassigned = allIds.filter(id => !inFolderSet.has(id));

        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));grid-auto-rows:min-content;gap:0.5rem;overflow-y:auto;align-items:start;align-content:start;';

        const toolbar = document.createElement('div');
        toolbar.id = 'folder-toolbar';
        toolbar.style.cssText = 'grid-column:1/-1;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;padding:0.25rem 0;';

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

        const btnDrag = document.createElement('button');
        btnDrag.className = 'mc-btn small' + (this._dragEditMode ? ' primary' : '');
        btnDrag.style.cssText = 'font-size:0.78rem;' + (this._dragEditMode ? 'background:var(--accent);' : 'background:var(--surface3);');
        btnDrag.textContent = this._dragEditMode ? '✏️ 編集中（クリックで終了）' : '✏️ ドラッグ編集';
        btnDrag.onclick = () => {
            this._dragEditMode = !this._dragEditMode;
            this._renderBlockSelectorGrid('all');
        };
        toolbar.appendChild(btnDrag);

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
                    for (const f of this._customFolders) {
                        f.blockIds = f.blockIds.filter(id => id !== blockId);
                    }
                    if (!folder.blockIds.includes(blockId)) folder.blockIds.push(blockId);
                    this._saveCustomFolders();
                    this._renderBlockSelectorGrid('all');
                };
            }

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

            card.querySelectorAll('.folder-action-btn')[0].onclick = (e) => {
                e.stopPropagation();
                const newName = prompt('新しいフォルダ名:', folder.name);
                if (!newName?.trim()) return;
                folder.name = newName.trim();
                this._saveCustomFolders();
                this._renderBlockSelectorGrid('all');
            };
            card.querySelectorAll('.folder-action-btn')[1].onclick = (e) => {
                e.stopPropagation();
                if (!confirm(`「${folder.name}」フォルダを削除しますか？（中のブロックは未分類に戻ります）`)) return;
                this._customFolders = this._customFolders.filter(f => f.id !== folder.id);
                this._saveCustomFolders();
                this._renderBlockSelectorGrid('all');
            };

            grid.appendChild(card);
        }

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
    },

    _openCustomFolder(grid, folder) {
        grid.innerHTML = '';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));grid-auto-rows:min-content;gap:0.5rem;overflow-y:auto;align-items:start;align-content:start;';

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
    },

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
        const srcs = [
            `https://minecraft.wiki/images/Invicon_${wikiName}.png`,
            `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${imgId}.png`,
            `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${imgId}.png`
        ];
        if (isBlock) srcs.push(`https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${imgId}_top.png`);
        const first = srcs.shift(), fb = JSON.stringify(srcs).replace(/"/g, '&quot;');
        return `<img class="block-pick-icon" src="${first}" alt="${local}" data-fb="${fb}" onerror="var fb=JSON.parse(this.dataset.fb||'[]');if(fb.length){this.src=fb.shift();this.dataset.fb=JSON.stringify(fb)}else{this.parentNode.innerHTML='📦'}">`;
    },

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
                this._addTempPaletteBlock(id, name);
                this._toast(`🎨 パレットにセット: ${name}`);
            }
            this._hideModal('modal-block-selector');
            return;
        }
        const which = this._blockSelectorMode === 'from' ? 'replace-from' : 'replace-to';
        $(which).value = id;
        const nameEl = $(`${which}-name`);
        const iconWrap = $(`${which}-icon-wrap`);
        if (nameEl) nameEl.textContent = name;
        if (iconWrap) {
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
    },

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
    },

    // ── ツアーシステム ────────────────────────────────────────────────────────
    _setupTour() {
        if (!$('tour-style')) {
            const s = document.createElement('style');
            s.id = 'tour-style';
            s.textContent = [
                '#tour-overlay{position:fixed;inset:0;z-index:9000;pointer-events:none;display:none}',
                '#tour-overlay.active{display:block}',
                '#tour-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.01);z-index:9001;pointer-events:none}',
                '#tour-spotlight{position:fixed;z-index:9002;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,0.65);border-radius:6px}',
                '#tour-card{position:fixed;z-index:9003;pointer-events:all;background:var(--surface2,#1e2840);border:1.5px solid var(--accent,#63b3ed);border-radius:12px;padding:1rem 1.2rem;width:300px;box-shadow:0 8px 32px rgba(0,0,0,0.65)}',
                '#tour-title{font-size:1rem;font-weight:700;margin:0 0 0.5rem;color:var(--text,#e2e8f0)}',
                '#tour-body{font-size:0.86rem;color:var(--muted,#c8d4e8);margin:0;line-height:1.65;white-space:pre-line}',
                '#tour-nav-bar{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:9004;display:flex;gap:0.6rem;align-items:center;background:var(--surface2,#1e2840);border:1.5px solid var(--accent,#63b3ed);border-radius:16px;padding:0.7rem 1.2rem;box-shadow:0 4px 28px rgba(0,0,0,0.65);pointer-events:all;white-space:nowrap}',
                '#tour-step-ind{font-size:0.9rem;color:var(--accent,#63b3ed);font-family:monospace;padding:0 0.6rem;min-width:54px;text-align:center;letter-spacing:.04em}',
                '#tour-prev-btn,#tour-next-btn{font-size:0.9rem!important;padding:0.48rem 1.1rem!important;min-width:84px}',
                '#tour-close-btn{font-size:0.82rem!important;padding:0.4rem 0.75rem!important;background:var(--surface3,#2d3748)!important;margin-left:0.4rem}',
                '#btn-tour:hover{background:rgba(99,179,237,0.15)!important}'
            ].join('\n');
            document.head.appendChild(s);
        }

        if (!$('tour-overlay')) {
            const el = document.createElement('div');
            el.id = 'tour-overlay';
            el.innerHTML = '<div id="tour-backdrop"></div><div id="tour-spotlight"></div>'
                + '<div id="tour-card">'
                + '<h4 id="tour-title"></h4>'
                + '<p id="tour-body"></p>'
                + '</div>'
                + '<div id="tour-nav-bar">'
                + '<button id="tour-prev-btn" class="mc-btn small secondary">← 前へ</button>'
                + '<span id="tour-step-ind">1 / 1</span>'
                + '<button id="tour-next-btn" class="mc-btn small primary">次へ →</button>'
                + '<button id="tour-close-btn" class="mc-btn small">✕ 閉じる</button>'
                + '</div>';
            document.body.appendChild(el);

            $('tour-backdrop').onclick  = () => this._closeTour();
            $('tour-close-btn').onclick = () => this._closeTour();
            $('tour-prev-btn').onclick  = () => this._showTourStep(this._tourStep - 1);
            $('tour-next-btn').onclick  = () => {
                if (this._tourStep < this._tourSteps.length - 1) this._showTourStep(this._tourStep + 1);
                else this._closeTour();
            };
            document.addEventListener('keydown', (e) => {
                if (!$('tour-overlay')?.classList.contains('active')) return;
                if (e.key === 'Escape')    this._closeTour();
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') $('tour-next-btn')?.click();
                if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   $('tour-prev-btn')?.click();
            });
        }

        const btn = $('btn-tour');
        if (btn) btn.onclick = () => this._startTour();
    },

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
                { target: '#viewer3d-container',         pos: 'right',  title: '③ 3Dビューの操作',       body: '【回転】左ドラッグ' + nl + '【パン】右ドラッグ' + nl + '【ズーム】マウスホイール' + nl + '【単体選択】Shift + 左クリック' + nl + '【範囲選択】Shift + 右クリック (2回)' },
                { target: '#viewer3d-container',         pos: 'right',  title: '④ 範囲選択と一括編集',    body: 'Shift + 右クリックで始点と終点を選ぶと、' + nl + '範囲内のブロックを「一括削除」したり、' + nl + '「準備済み」に設定したりできます。履歴からUndoも可能です。' },
                { target: '[data-section="replace"]',    pos: 'left',   title: '⑤ ブロック置換',          body: '素材Aを素材Bに一括置換できます。' + nl + 'コスト削減やデザイン変更に便利です。' },
                { target: '[data-section="textures"]',   pos: 'left',   title: '⑥ テクスチャパック',      body: '公式リソースパック（zip）をアップロードすると' + nl + 'リアルなテクスチャになります。' },
                { target: '#btn-export-mcstructure',     pos: 'left',   title: '⑦ 構造をエクスポート',    body: '置換後の構造を .mcstructure でダウンロードできます。' + nl + 'そのままMinecraftでインポートして使えます。' },
                { target: '#layer-min',                  pos: 'left',   title: '⑧ 断面フィルター',          body: 'Y/X/Z 各軸の最小・最大スライダーを動かすと' + nl + 'その範囲だけを切り出して3D表示できます。' + nl + '内部構造の確認に便利です。↺ リセットで全体に戻ります。' }
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

        const isWelcome = !$('welcome-screen').classList.contains('hidden');
        this._tourSteps = isWelcome ? TOURS.home : (TOURS[this.currentTab] || TOURS.materials);
        this._tourStep  = 0;
        $('tour-overlay').classList.add('active');
        this._showTourStep(0);
    },

    _initTourSpring() {
        return {
            x:0, y:0, w:0, h:0, vx:0, vy:0, vw:0, vh:0,
            tx:0, ty:0, tw:0, th:0,
            cx:0, cy:0, vcx:0, vcy:0, tcx:0, tcy:0,
            init: false
        };
    },

    _tickTourSpring(now) {
        if (!this._tourSpring || !$('tour-overlay')?.classList.contains('active')) return;
        const s = this._tourSpring;
        const dt = Math.min((now - (s._prevTime || now)) / 1000, 0.05);
        s._prevTime = now;
        const K = 260, D = 26, CK = 200, CD = 22;
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
        const MAX_V = 550;
        s.vx  = Math.max(-MAX_V, Math.min(MAX_V, s.vx));
        s.vy  = Math.max(-MAX_V, Math.min(MAX_V, s.vy));
        s.vw  = Math.max(-MAX_V, Math.min(MAX_V, s.vw));
        s.vh  = Math.max(-MAX_V, Math.min(MAX_V, s.vh));
        s.vcx = Math.max(-MAX_V, Math.min(MAX_V, s.vcx));
        s.vcy = Math.max(-MAX_V, Math.min(MAX_V, s.vcy));
        const sp = $('tour-spotlight');
        if (sp) {
            sp.style.left   = s.x + 'px';
            sp.style.top    = s.y + 'px';
            sp.style.width  = s.w + 'px';
            sp.style.height = s.h + 'px';
        }
        const card = $('tour-card');
        if (card) {
            card.style.left = s.cx + 'px';
            card.style.top  = s.cy + 'px';
        }
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
    },

    _startTourSpringRaf() {
        if (this._tourRafId) cancelAnimationFrame(this._tourRafId);
        if (!this._tourSpring) return;
        this._tourSpring._prevTime = performance.now();
        this._tourRafId = requestAnimationFrame(t => this._tickTourSpring(t));
    },

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
        const computeTargets = () => {
            const rect = el.getBoundingClientRect();
            const pad  = 8;
            const s    = this._tourSpring;
            s.tx = rect.left   - pad; s.ty = rect.top    - pad;
            s.tw = rect.width  + pad * 2; s.th = rect.height + pad * 2;
            const card = $('tour-card');
            const vw = window.innerWidth, vh = window.innerHeight;
            const cw = 308, ch = (card?.offsetHeight || 190);
            const pos = step.pos || 'bottom';
            let cx, cy;
            if (pos === 'bottom')    { cx = Math.min(Math.max(rect.left, 8), vw-cw-8); cy = Math.min(rect.bottom+pad+8, vh-ch-8); }
            else if (pos === 'top')  { cx = Math.min(Math.max(rect.left, 8), vw-cw-8); cy = Math.max(rect.top-ch-pad-8, 8); }
            else if (pos === 'left') { cx = Math.max(rect.left-cw-pad-8, 8);           cy = Math.min(Math.max(rect.top, 8), vh-ch-8); }
            else                     { cx = Math.min(rect.right+pad+8, vw-cw-8);       cy = Math.min(Math.max(rect.top, 8), vh-ch-8); }
            s.tcx = cx; s.tcy = cy;
            if (!s.init) {
                s.x=s.tx; s.y=s.ty; s.w=s.tw; s.h=s.th;
                s.cx=cx; s.cy=cy; s.init = true;
            }
        };
        if (!this._tourSpring) this._tourSpring = this._initTourSpring();
        computeTargets();
        this._startTourSpringRaf();
        if (this._tourTargetTimer) clearInterval(this._tourTargetTimer);
        this._tourTargetTimer = setInterval(() => {
            if (!this._tourSpring || !$('tour-overlay')?.classList.contains('active')) {
                clearInterval(this._tourTargetTimer); return;
            }
            computeTargets();
            if (!this._tourRafId) this._startTourSpringRaf();
        }, 200);
        const titleEl = $('tour-title');
        if (titleEl) titleEl.textContent = step.title || '';
        const bodyEl = $('tour-body');
        if (bodyEl) bodyEl.textContent  = step.body  || '';
        const stepInd = $('tour-step-ind');
        if (stepInd) stepInd.textContent = `${idx + 1} / ${steps.length}`;
        const prevBtn = $('tour-prev-btn');
        const nextBtn = $('tour-next-btn');
        if (prevBtn) prevBtn.disabled = idx === 0;
        if (nextBtn) nextBtn.textContent = idx === steps.length - 1 ? '✓ 閉じる' : '次へ →';
    },

    _closeTour() {
        if (this._tourRafId) { cancelAnimationFrame(this._tourRafId); this._tourRafId = null; }
        clearInterval(this._tourTargetTimer);
        this._tourSpring = null;
        $('tour-overlay')?.classList.remove('active');
    },

};
