/**
 * app.js — メイン・オーケストレーター
 *
 * 各モジュールの初期化と、モジュール間の連携のみを行う軽量エントリーポイント。
 * ロジックはすべて各モジュールに委譲する。
 *
 * アーキテクチャ:
 *   ProjectManager  (js/core/project-manager.js) — データ管理
 *   exportCsv 等    (js/io/export-utils.js)       — 出力処理
 *   UIMixin         (js/ui/ui_events.js)           — UI/イベント
 *   Viewer3D        (js/render/viewer3d.js)        — 3D描画
 *   DotArtEditor    (js/ui/panels/dotart.js)       — ドット絵
 */

import { DotArtEditor, DOT_PALETTE } from './ui/panels/dotart.js';
import { Viewer3D } from './render/viewer3d.js';
import { initToolsPanel } from './ui/panels/tools.js';
import { initMaterialsPanel } from './ui/panels/materials.js';
import * as ResourcePack from './resourcepack.js';
import * as Image2Dot from './image2dot.js';
import { NBTParser, NBTWriter, decompressIfNeeded } from './io/nbt-reader.js';
import { DOWNGRADE_PRESETS, applyToCoords, applyToResults, applicablePairsForStructure } from './replacements.js';
import { BLOCK_CATALOG as BC_DATA } from './block_catalog.js';
import { normalizeId } from './bedrock_normalize.js';
import { ProjectManager, uid } from './core/project-manager.js';
import { exportCsv, copyAsMarkdown, exportAllProjects, exportMcStructure } from './io/export-utils.js';
import { UIMixin } from './ui/ui_events.js';
import { convertToLitematic, mergeAndConvertToLitematic, downloadBuffer } from './main.js';
import { snapStructure, DIRECTION_LABELS } from './modules/logic/snap.js';

// ─── App ──────────────────────────────────────────────────────────────────────
class App {
    static MAX_PROJECTS = 20;
    static STORAGE_WARNING_SIZE = 4 * 1024 * 1024; // 4MB
    static LARGE_FILE_WARNING = 50 * 1024 * 1024;  // 50MB

    constructor() {
        this.projects = ProjectManager.load();
        this.currentProjectId = null;
        // __ALL__ モード表示の固定原点（ドラッグで再正規化させないため）
        this._allModeOrigin = null;          // {x, y, z} | null
        this._allModeOriginProjectId = null; // どのプロジェクト用か
        this.currentTab = 'materials';
        this.langData = {};
        this.coordsCache = new Map();     // structureId → coords[]
        this.bufferCache = new Map();     // structureId → ArrayBuffer (再パース用)
        this.bufferFileNameCache = new Map(); // structureId → 元ファイル名 (再パース時のフォーマット判定用)
        this.replacements = new Map();    // structureId → Map<fromId, toId>
        this.preparedItems = new Map();   // structureId → Set<blockId>
        this.currentFilter = 'all';
        this.lastSearchQuery = '';
        this.viewer3d = null;
        this.dotArtEditor = null;
        this.worker = new Worker(new URL('./io/worker.js', import.meta.url), { type: 'module' });
        this.pendingParses = new Map();   // taskId => resolve
        this.settingsData = JSON.parse(localStorage.getItem('mc_planner_settings') || '{}');
        this._customFolders = JSON.parse(localStorage.getItem('mc_planner_block_folders') || '[]');

        // テーマ復元（DOM 描画前に適用するため constructor で）
        try {
            const savedTheme = localStorage.getItem('mc_planner_theme');
            if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
            if (localStorage.getItem('sp.theme.fontsDefault') === '1') {
                document.body.classList.add('fonts-default');
            }
        } catch (_) {}

        this._dragEditMode = false;
        this._deletedPositions = new Set();
        this._rangeStart = null;
        this._editHistory = [];

        // ストレージ容量警告をユーザーに見える形で通知 (従来は console.warn のみ)
        ProjectManager.onStorageWarning = (bytes) => {
            this._toast?.(`⚠️ ストレージ使用量 ${(bytes / 1048576).toFixed(1)}MB / 約5MB — 不要なプロジェクトの削除を推奨`, 'error');
        };

        this._setupWorker();
        this._init();
    }

    async _init() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark-1';
        document.querySelectorAll('[data-theme-icon]').forEach(el => {
            el.src = `/icons/${currentTheme}/${el.dataset.themeIcon}.png`;
        });

        try {
            const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || './';
            const res = await fetch(baseUrl + 'data/lang_ja.json');
            this.langData = await res.json();
        } catch { console.warn('lang_ja.json not loaded'); }

        try {
            const saved = JSON.parse(localStorage.getItem('mc_planner_prepared') || '{}');
            for (const [pid, ids] of Object.entries(saved)) {
                this.preparedItems.set(pid, new Set(ids));
            }
        } catch { /* ignore */ }

        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error || e.message);
            this._toast?.('⚠️ 予期せぬエラー: ' + (e.message || 'unknown'), 'error');
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled rejection:', e.reason);
            this._toast?.('⚠️ 非同期エラー: ' + (e.reason?.message || e.reason || 'unknown'), 'error');
        });

        this._autoRestorePack();
        this._autoRestoreStructureBuffers();

        this._setupDOM();
        this._setupDragDrop();
        this._setupTour();
        this._setupSidebarDropZone();
        this._setupLitematicConvert();
        initToolsPanel(this);
        initMaterialsPanel(this);
        this._renderProjectList();

        const lastId = localStorage.getItem('mc_planner_last');
        if (lastId && this.projects.find(p => p.id === lastId)) {
            this._selectProject(lastId);
        }
    }

    // ─── Worker ────────────────────────────────────────────────────────────────
    _setupWorker() {
        this.worker.onmessage = (e) => {
            const { taskId, success, error, results, coordsTA, size, totalCount, uniqueCount, totalSlots, warnings } = e.data;
            // M-P-03: typed-array で受信した coords を消費者向けにオブジェクト配列に復元
            let coords;
            if (coordsTA) {
                const { xs, ys, zs, blockIdIdx, rawIdIdx, blockIdPalette, statesArr } = coordsTA;
                const N = xs.length;
                coords = new Array(N);
                for (let i = 0; i < N; i++) {
                    const bId = blockIdPalette[blockIdIdx[i]];
                    coords[i] = {
                        x: xs[i], y: ys[i], z: zs[i],
                        blockId: bId,
                        rawId:   blockIdPalette[rawIdIdx[i]] ?? bId,
                        states:  statesArr[i] ?? {},
                    };
                }
            }
            this._hideLoading();
            const resolve = this.pendingParses.get(taskId);
            if (resolve) {
                resolve({ success, error, results, coords, size, totalCount, uniqueCount, totalSlots, warnings });
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

    _parseBuffer(buffer, fileName) {
        return new Promise((resolve) => {
            const taskId = uid();
            this.pendingParses.set(taskId, resolve);
            this._showLoading('再解析中...');
            this.worker.postMessage({ taskId, buffer, fileName });
        });
    }

    // ─── Drag & Drop ───────────────────────────────────────────────────────────
    _setupDragDrop() {
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
            const files = Array.from(e.dataTransfer.files).filter(f => /\.(mcstructure|litematic|nbt)$/i.test(f.name));
            if (files.length > 0) {
                e.stopPropagation();
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
            const files = Array.from(e.dataTransfer.files).filter(f => /\.(mcstructure|litematic|nbt)$/i.test(f.name));
            if (files.length > 0) this._handleFiles(files);
        });

        window.addEventListener('paste', async (e) => {
            const items = e.clipboardData.items;
            const files = [];
            for (const item of items) {
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && /\.(mcstructure|litematic|nbt)$/i.test(file.name)) files.push(file);
                }
            }
            if (files.length > 0) { this._handleFiles(files); return; }

            const text = e.clipboardData.getData('text');
            if (!text) return;
            try {
                const data = JSON.parse(text);
                if (data.source === 'MC_DOT_COUNTER') {
                    const name = data.name || 'Imported Dot Art';
                    const p = ProjectManager.create(name);
                    ProjectManager.addStructure(p, {
                        name: 'Dot Art Data',
                        results: data.results,
                        size: { x: data.width || 128, y: 1, z: data.height || 128 },
                        totalCount: data.total,
                        uniqueCount: data.unique,
                        totalSlots: data.totalSlots,
                        coords: []
                    });
                    this.projects.unshift(p);
                    ProjectManager.save(this.projects);
                    this._renderProjectList();
                    this._selectProject(p.id);
                    this._toast('🎨 ドット絵データをインポートしました', 'success');
                }
            } catch (_) { /* not JSON */ }
        });
    }

    // ─── Sidebar DropZone ──────────────────────────────────────────────────────
    _setupSidebarDropZone() {
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
            const files = [...(e.dataTransfer?.files || [])].filter(f => /\.(mcstructure|litematic|nbt)$/i.test(f.name));
            if (files.length === 0) {
                this._toast('⚠️ .mcstructure / .litematic / .nbt ファイルをドロップしてください', 'error');
                return;
            }
            for (const f of files) {
                try {
                    const name = f.name.replace(/\.(mcstructure|litematic|nbt)$/i, '');
                    const p = ProjectManager.create(name);
                    this.projects.unshift(p);
                    this._renderProjectList();
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

    // ─── File Handling ─────────────────────────────────────────────────────────
    async _handleFiles(files) {
        const mcFiles = files.filter(f => /\.(mcstructure|litematic|nbt)$/i.test(f.name));
        for (const f of mcFiles) {
            if (f.size > 50 * 1024 * 1024) {
                if (!confirm(`${f.name} は ${(f.size/1048576).toFixed(1)}MB あります。解析に時間がかかったりブラウザがフリーズする可能性があります。続行しますか？`)) {
                    return;
                }
            }
        }
        if (mcFiles.length === 0) { this._toast('⚠️ .mcstructure / .litematic / .nbt ファイルのみ対応しています', 'error'); return; }

        if (!this.currentProjectId) {
            const name = mcFiles[0].name.replace(/\.(mcstructure|litematic|nbt)$/i, '');
            const p = ProjectManager.create(name);
            this.projects.unshift(p);
            ProjectManager.save(this.projects);
            this._renderProjectList();
            this._selectProject(p.id);
        }

        let successCount = 0;
        for (const file of mcFiles) {
            const data = await this._parseFile(file);
            if (!data.success) { this._toast(`❌ ${file.name}: ${data.error}`, 'error'); continue; }
            for (const w of data.warnings ?? []) this._toast(w, 'warning');
            const project = this._currentProject();
            const name = file.name.replace(/\.(mcstructure|litematic|nbt)$/i, '');
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
                this.bufferFileNameCache.set(existing.id, file.name);
                savedId = existing.id;
                // 既存構造の再アップロード → viewer の mesh cache を invalidate
                if (this.viewer3d) {
                    this.viewer3d._matCache?.clear();
                    this.viewer3d._meshCache?.clear?.();
                }
            } else {
                const s = ProjectManager.addStructure(project, { name, ...data });
                // 既存構造があり、かつ新構造の初期 offset が 0,0,0 の場合は右端に自動配置
                const others = project.structures.filter(st => st.id !== s.id && st.size);
                if (others.length > 0 && s.offset.x === 0 && s.offset.y === 0 && s.offset.z === 0) {
                    let rightEdge = 0;
                    for (const other of others) {
                        const off = ProjectManager.getOffset(other);
                        const rs  = ProjectManager.rotatedSize(other.size, ProjectManager.getRotation(other));
                        rightEdge = Math.max(rightEdge, off.x + rs.x + 1);
                    }
                    s.offset = { x: rightEdge, y: 0, z: 0 };
                }
                this.coordsCache.set(s.id, data.coords);
                if (buf) this.bufferCache.set(s.id, buf);
                this.bufferFileNameCache.set(s.id, file.name);
                savedId = s.id;
            }
            if (buf && savedId) {
                ResourcePack.saveStructureBuffer(savedId, buf, name, data.edition || 'bedrock', file.name)
                    .catch(err => console.warn('IDB save structure failed:', err));
            }
            successCount++;
        }
        if (successCount > 0) {
            ProjectManager.save(this.projects);
            this._toast(`🎉 ${successCount}件の解析完了！`);
            this._renderProjectView();
        } else if (mcFiles.length > 0) {
            this._toast('❌ すべてのファイルが失敗しました', 'error');
        }
    }

    // ─── Project Management ────────────────────────────────────────────────────
    _currentProject() {
        return this.projects.find(p => p.id === this.currentProjectId);
    }

    _selectProject(id) {
        this.currentProjectId = id;
        this._allModeOrigin = null;
        this._allModeOriginProjectId = null;
        localStorage.setItem('mc_planner_last', id);
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
            item.querySelector('.project-item-btn').onclick = () => this._selectProject(p.id);
            item.querySelector('.delete-btn').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`プロジェクト「${p.name}」を削除しますか？`)) {
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
        else if (tab === 'themes') this._setupThemesTab();
    }

    // ── テーマ ──────────────────────────────────────────────────────────
    static THEMES = [
        // ── ダーク系 ───────────────────────────────
        { id: 'dark-1',  name: 'Default Dark',       kind: 'dark',    tags: ['ニュートラル','寒色'],     desc: 'ネイビー×グリーン',     sample: ['#070c14', '#f59e0b', '#4ade80'] },
        { id: 'dark-2',  name: 'RTX Neon Glass',     kind: 'dark',    tags: ['ネオン','クール'],         desc: 'ブラック×エメラルド',   sample: ['#121212', '#4ade80', '#22c55e'] },
        { id: 'dark-5',  name: 'Obsidian Architect', kind: 'dark',    tags: ['モノクロ','ミニマル'],     desc: '黒×シルバー',           sample: ['#000000', '#cbd5e1', '#64748b'] },
        { id: 'dark-6',  name: 'Midnight Espresso',  kind: 'dark',    tags: ['クレイ','温色'],           desc: 'コーヒー×オレンジ',     sample: ['#2a1810', '#fb923c', '#fed7aa'] },
        { id: 'dark-7',  name: 'Deep Ocean',         kind: 'dark',    tags: ['和風','ゼン'],             desc: '深緑×金',               sample: ['#0c1e3e', '#1e40af', '#ffffff'] },
        { id: 'dark-10', name: 'Brutalist Slate',    kind: 'dark',    tags: ['硬派','IDE'],              desc: 'スレート×グリーン',     sample: ['#1a1a1a', '#ffffff', '#666666'] },
        // ── パステル系 ─────────────────────────────
        { id: 'light-1', name: 'Lavender Mist',      kind: 'pastel',  tags: ['パステル','夢幻'],         desc: 'ラベンダー×パープル',   sample: ['#ede0f8', '#a878d8', '#dcc8f0'] },
        { id: 'light-2', name: 'Frosted Crystal',    kind: 'pastel',  tags: ['クリア','クール'],         desc: 'アイス×ブルー',         sample: ['#eef2f7', '#1d4ed8', '#ffffff'] },
        { id: 'light-3', name: 'Sakura Spring',      kind: 'pastel',  tags: ['パステル','春'],           desc: '桜×ピンク',             sample: ['#fce7f3', '#e11d48', '#fbcfe8'] },
        { id: 'light-5', name: 'Paper Sage',         kind: 'pastel',  tags: ['ナチュラル','マット'],     desc: 'ペーパー×セージ',       sample: ['#f5f1e8', '#4a5d3a', '#6b8050'] },
        { id: 'light-6', name: 'Mint Lab',           kind: 'pastel',  tags: ['クリア','クール'],         desc: 'ミント×ターコイズ',     sample: ['#ecfdf5', '#0f766e', '#14b8a6'] },
        { id: 'light-7', name: 'Latte Cafe',         kind: 'pastel',  tags: ['温色','クラフト'],         desc: 'ラテ×ブラウン',         sample: ['#faf3e0', '#78350f', '#b45309'] },
        { id: 'light-8', name: 'Coral Bloom',        kind: 'pastel',  tags: ['パステル','温色'],         desc: 'コーラル×ピーチ',       sample: ['#fac8b8', '#ec9080', '#fdddd4'] },
        { id: 'light-10',name: 'Aurora Bright',      kind: 'pastel',  tags: ['夢幻','パステル'],         desc: 'オーロラ×パステル',     sample: ['#f0f4ff', '#7c3aed', '#fce7f3'] },
        { id: 'light-13',name: 'Hydrangea',          kind: 'pastel',  tags: ['雨季','パステル'],         desc: '紫陽花×ライラック',     sample: ['#e8edf8', '#7c83b8', '#f4d4e0'] },
        // ── 特殊系 ─────────────────────────────────
        { id: 'dark-3',  name: 'Anemo Wanderer',     kind: 'special', tags: ['ファンタジー','ネオン'],   desc: '紫×マゼンタ×シアン',   sample: ['#0e1f24', '#67e8f9', '#a5f3fc'] },
        { id: 'dark-4',  name: 'Stim Rush',          kind: 'special', tags: ['サイバー','シャープ'],     desc: '黒×パープル×ライム',   sample: ['#1a1a1a', '#a3e635', '#c084fc'] },
        { id: 'dark-8',  name: 'Retro Terminal',     kind: 'special', tags: ['レトロ','ピクセル'],       desc: 'CRT×ピンク',           sample: ['#000000', '#ff00ff', '#00ffff'] },
        { id: 'dark-9',  name: 'Aurora Glass',       kind: 'special', tags: ['グラス','幻想'],           desc: 'オーロラ×ガラス',       sample: ['#0a0a18', '#4ade80', '#7c3aed'] },
        { id: 'dark-11', name: 'Cyberpunk Tokyo',    kind: 'special', tags: ['ネオン','ナイト'],         desc: 'シアン×ピンクネオン',   sample: ['#050006', '#00f0ff', '#ff0080'] },
        { id: 'dark-12', name: 'Holographic',        kind: 'special', tags: ['ホロ','虹彩'],             desc: 'ホログラム×パール',     sample: ['#0e0e1e', '#ff9adf', '#6ec5ff'] },
        { id: 'dark-13', name: 'Sunset Mirage',      kind: 'special', tags: ['夕焼け','グラデ'],         desc: 'コーラル×ピーチ',       sample: ['#1a0a14', '#ffc88a', '#ff9a8d'] },
        { id: 'light-4', name: 'Blueprint Paper',    kind: 'special', tags: ['設計','クラフト'],         desc: '紙×レッド',             sample: ['#fafaf5', '#dc2626', '#000000'] },
        { id: 'light-9', name: 'Brutalist Mono',     kind: 'special', tags: ['硬派','モノクロ'],         desc: '白×黒',                 sample: ['#f5f5f5', '#000000', '#555555'] },
        { id: 'light-11',name: 'Vintage Newspaper',  kind: 'special', tags: ['レトロ','紙'],             desc: 'セピア×レッド',         sample: ['#f5ecd9', '#c23030', '#333333'] },
        { id: 'light-12',name: 'Bento Box',          kind: 'special', tags: ['和風','クラフト'],         desc: '朱×金',                 sample: ['#f8f3e5', '#c0392b', '#e8a02e'] },
    ];

    static THEME_FONTS = {
        // ── ダーク系: Audiowide ─────────────────────────────────────
        'dark-2':  "'Audiowide', 'Noto Sans JP', sans-serif",
        'dark-5':  "'Audiowide', 'Noto Sans JP', sans-serif",
        'dark-6':  "'Audiowide', 'Noto Sans JP', sans-serif",
        'dark-7':  "'Audiowide', 'Noto Sans JP', sans-serif",
        'dark-10': "'Audiowide', 'Noto Sans JP', sans-serif",
        // ── パステル系: Lora ────────────────────────────────────────
        'light-1': "'Lora', 'Noto Serif JP', serif",
        'light-2': "'Lora', 'Noto Serif JP', serif",
        'light-3': "'Lora', 'Noto Serif JP', serif",
        'light-5': "'Lora', 'Noto Serif JP', serif",
        'light-6': "'Lora', 'Noto Serif JP', serif",
        'light-7': "'Lora', 'Noto Serif JP', serif",
        'light-8': "'Lora', 'Noto Serif JP', serif",
        'light-10':"'Lora', 'Noto Serif JP', serif",
        'light-13':"'Lora', 'Noto Serif JP', serif",
        // ── 特殊系: 雰囲気マッチ ──────────────────────────────────
        'dark-3':  "'Cinzel', 'Noto Serif JP', serif",
        'dark-4':  "'Orbitron', 'Noto Sans JP', sans-serif",
        'dark-8':  "'Press Start 2P', 'DotGothic16', monospace",
        'dark-9':  "'Quicksand', 'Zen Maru Gothic', sans-serif",
        'dark-11': "'Audiowide', 'Noto Sans JP', sans-serif",
        'dark-12': "'Orbitron', 'Noto Sans JP', sans-serif",
        'dark-13': "'Pacifico', 'Noto Serif JP', cursive",
        'light-4': "'Special Elite', 'Noto Serif JP', serif",
        'light-9': "'IBM Plex Mono', 'Klee One', monospace",
        'light-11':"'Playfair Display', 'Noto Serif JP', serif",
        'light-12':"'Shippori Mincho', 'Yu Mincho', serif",
    };

    static MESH_PREVIEW_BG = {
        'dark-9':  'radial-gradient(at 15% 20%, #1e3a8a 0%, transparent 50%), radial-gradient(at 80% 30%, #581c87 0%, transparent 55%), radial-gradient(at 30% 70%, #065f46 0%, transparent 45%), #0a0a18',
        'light-10':'radial-gradient(at 15% 20%, #fce7f3 0%, transparent 50%), radial-gradient(at 80% 25%, #dbeafe 0%, transparent 55%), radial-gradient(at 30% 75%, #dcfce7 0%, transparent 50%), #f0f4ff',
        'dark-12': 'radial-gradient(at 15% 15%, #ff9adf55 0%, transparent 45%), radial-gradient(at 85% 20%, #6ec5ff55 0%, transparent 50%), radial-gradient(at 40% 80%, #c8a8ff55 0%, transparent 45%), #0e0e1e',
        'dark-13': 'radial-gradient(at 15% 15%, #ffadd055 0%, transparent 45%), radial-gradient(at 85% 20%, #ffc88a55 0%, transparent 50%), radial-gradient(at 40% 80%, #ff9a8d55 0%, transparent 45%), #1a0a14',
        'dark-11': 'radial-gradient(at 20% 80%, #ff008030 0%, transparent 50%), radial-gradient(at 80% 20%, #00f0ff30 0%, transparent 50%), #050006',
        'dark-3':  'linear-gradient(180deg, #15082c 0%, #240e4a 60%, #4d1a6a 100%)',
    };

    static FAV_KEY = 'sp.theme.favorites';
    static FONT_KEY = 'sp.theme.fontsDefault';

    _getFavorites() {
        try { return JSON.parse(localStorage.getItem(App.FAV_KEY) || '[]'); }
        catch { return []; }
    }
    _toggleFavorite(id) {
        let favs = this._getFavorites();
        if (favs.includes(id)) favs = favs.filter(x => x !== id);
        else favs.unshift(id);
        localStorage.setItem(App.FAV_KEY, JSON.stringify(favs));
        return favs.includes(id);
    }

    _getThemeVars(id) {
        const el = document.createElement('div');
        el.setAttribute('data-preview-theme', id);
        el.style.cssText = 'position:fixed;pointer-events:none;opacity:0;top:-999px;';
        document.body.appendChild(el);
        const s = getComputedStyle(el);
        const get = (p) => s.getPropertyValue(p).trim();
        const vars = {
            bg: get('--bg'), bg2: get('--bg2'), sidebar: get('--sidebar'),
            card: get('--card'), border: get('--border'), border2: get('--border2'),
            text: get('--text'), muted: get('--muted'), muted2: get('--muted2'),
            primary: get('--primary'), accent: get('--accent'),
            radius: get('--radius'), shadow: get('--shadow'),
            btnText: get('--btn-primary-text'),
            activeBar: get('--active-border') || get('--primary'),
        };
        document.body.removeChild(el);
        return vars;
    }

    _makeInlineVars(v) {
        return [
            `--bg:${v.bg}`, `--bg2:${v.bg2}`, `--sidebar:${v.sidebar}`,
            `--card:${v.card}`, `--border:${v.border}`, `--border2:${v.border2}`,
            `--text:${v.text}`, `--muted:${v.muted}`, `--muted2:${v.muted2}`,
            `--primary:${v.primary}`, `--accent:${v.accent}`,
            `--radius:${v.radius}`, `--shadow:${v.shadow}`,
            `--btn-primary-text:${v.btnText}`,
            `--active-border:${v.activeBar}`, `--active-bg:${v.activeBar}1a`,
            `--hover-bg:${v.primary}18`,
        ].join(';');
    }

    _buildThemeCardHTML(t, currentId, favs) {
        const v = this._getThemeVars(t.id);
        const isFav = favs.includes(t.id);
        const themeFont = App.THEME_FONTS[t.id] || "'Outfit', sans-serif";
        const inlineVars = this._makeInlineVars(v);
        const previewBg = App.MESH_PREVIEW_BG[t.id] || v.bg;
        const rNum = parseFloat(v.radius) || 8;
        const previewRadius = Math.round(rNum * 0.65) + 'px';
        const isActive = t.id === currentId;
        const tone = t.id.startsWith('dark-') ? '🌙 Dark' : '☀️ Light';
        const catLabel = t.kind === 'dark' ? 'ダーク' : t.kind === 'pastel' ? 'パステル' : '特殊';
        const tagsHtml = (t.tags || []).map(tag =>
          `<span class="theme-tag" style="border:1px solid ${v.border2};color:${v.muted2};">${tag}</span>`
        ).join('');
        const descHtml = t.desc ? `<div class="theme-card-desc" style="color:${v.muted2};">· ${t.desc}</div>` : '';
        const cardBg = `linear-gradient(180deg, ${v.bg2 || v.bg} 0%, ${v.bg} 100%)`;
        return `
            <div class="theme-card${isActive ? ' active' : ''}" data-theme-id="${t.id}" style="${inlineVars};background:${cardBg};border:1px solid ${v.border};">
                <div class="theme-card-preview" style="background:${previewBg};border-radius:${previewRadius};font-family:${themeFont};">
                    <div class="preview-sidebar" style="background:${v.sidebar};border-right:1px solid ${v.border};">
                        <div class="preview-logo" style="background:${v.accent};box-shadow:0 0 6px ${v.accent}66;"></div>
                        <div class="preview-btn-primary" style="background:${v.primary};color:${v.btnText};border-radius:calc(${v.radius} * 0.45);">＋ NEW</div>
                        <div class="preview-project active" style="background:${v.primary}22;border:1px solid ${v.activeBar || v.primary}55;border-radius:3px;height:9px;"></div>
                        <div class="preview-project" style="background:${v.card};border:1px solid ${v.border};border-radius:3px;height:9px;"></div>
                        <div class="preview-project" style="background:${v.card};border:1px solid ${v.border};border-radius:3px;height:9px;"></div>
                    </div>
                    <div class="preview-main" style="background:${v.bg2};">
                        <div class="preview-tabs" style="border-bottom:1px solid ${v.border};">
                            <div class="preview-tab active" style="color:${v.primary};background:${v.card};font-weight:800;">素材</div>
                            <div class="preview-tab" style="color:${v.muted2};">3D</div>
                            <div class="preview-tab" style="color:${v.muted2};">ドット</div>
                        </div>
                        <div class="preview-stats">
                            <div class="preview-stat" style="background:${v.card};border:1px solid ${v.border};border-radius:calc(${v.radius} * 0.5);">
                                <div class="preview-stat-num" style="color:${v.accent};">2.4k</div>
                                <div class="preview-stat-label" style="color:${v.muted};">TOTAL</div>
                            </div>
                            <div class="preview-stat" style="background:${v.card};border:1px solid ${v.border};border-radius:calc(${v.radius} * 0.5);">
                                <div class="preview-stat-num" style="color:${v.accent};">18</div>
                                <div class="preview-stat-label" style="color:${v.muted};">TYPES</div>
                            </div>
                        </div>
                        <div class="preview-btn-sample" style="background:${v.primary};color:${v.btnText};border-radius:calc(${v.radius} * 0.45);">適用</div>
                    </div>
                </div>
                <div class="theme-card-name" style="color:${v.text};font-family:${themeFont};display:flex;align-items:center;gap:6px;justify-content:space-between;min-width:0;">
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;">${t.name}</span>
                    <span class="theme-fav-btn${isFav ? ' active' : ''}" data-fav-id="${t.id}" title="${isFav ? 'お気に入り解除' : 'お気に入り'}" style="color:${isFav ? v.accent : v.muted};cursor:pointer;">${isFav ? '★' : '☆'}</span>
                </div>
                <div class="theme-card-tags" style="display:flex;gap:5px;flex-wrap:wrap;margin-top:2px;">${tagsHtml}</div>
                ${descHtml}
            </div>`;
    }

    _setupThemesTab(filter) {
        // Ensure filter bar exists
        this._setupThemeFilter();
        const f = filter || document.querySelector('.theme-filter-bar .filter-pill.active')?.dataset.themeFilter || 'all';
        const grid = document.getElementById('themes-grid');
        if (!grid) return;
        const current = document.documentElement.getAttribute('data-theme') || 'dark-1';
        const list = f === 'all' ? App.THEMES : App.THEMES.filter(t => t.kind === f);
        const favs = this._getFavorites();
        const sorted = [...list].sort((a, b) => {
            const ai = favs.indexOf(a.id), bi = favs.indexOf(b.id);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
        grid.innerHTML = sorted.map(t => this._buildThemeCardHTML(t, current, favs)).join('');
        grid.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('theme-fav-btn')) {
                    e.stopPropagation();
                    this._toggleFavorite(card.dataset.themeId);
                    this._setupThemesTab(f);
                    return;
                }
                this._applyTheme(card.dataset.themeId);
            });
        });
    }

    _setupThemeFilter() {
        const panel = document.getElementById('panel-themes');
        if (!panel || panel.querySelector('.theme-filter-bar')) return;
        const grid = panel.querySelector('#themes-grid');
        if (!grid) return;
        const bar = document.createElement('div');
        bar.className = 'theme-filter-bar';
        const totalAll = App.THEMES.length;
        const totalDark = App.THEMES.filter(t => t.kind === 'dark').length;
        const totalPastel = App.THEMES.filter(t => t.kind === 'pastel').length;
        const totalSpecial = App.THEMES.filter(t => t.kind === 'special').length;
        bar.innerHTML = `
            <div class="filter-pills" style="margin-bottom:1rem">
              <button class="filter-pill active" data-theme-filter="all">すべて (${totalAll})</button>
              <button class="filter-pill" data-theme-filter="dark">🌙 ダーク (${totalDark})</button>
              <button class="filter-pill" data-theme-filter="pastel">🌸 パステル (${totalPastel})</button>
              <button class="filter-pill" data-theme-filter="special">✨ 特殊 (${totalSpecial})</button>
              <button class="filter-pill" data-theme-action="random" style="margin-left:auto">🎲 ランダム</button>
              <button class="filter-pill" data-theme-action="reset">↺ デフォルトに戻す</button>
              <button class="filter-pill" data-theme-action="font-toggle" title="テーマ固有フォントを無効化">🔤 デフォルトフォント</button>
            </div>`;
        grid.parentNode.insertBefore(bar, grid);

        bar.querySelectorAll('[data-theme-filter]').forEach(b => {
            b.addEventListener('click', () => {
                bar.querySelectorAll('[data-theme-filter]').forEach(x => x.classList.toggle('active', x === b));
                this._setupThemesTab(b.dataset.themeFilter);
            });
        });
        bar.querySelector('[data-theme-action="random"]')?.addEventListener('click', () => {
            const pick = App.THEMES[Math.floor(Math.random() * App.THEMES.length)];
            this._applyTheme(pick.id);
        });
        bar.querySelector('[data-theme-action="reset"]')?.addEventListener('click', () => {
            this._applyTheme('dark-1');
        });
        const fontBtn = bar.querySelector('[data-theme-action="font-toggle"]');
        if (fontBtn) {
            const setFontMode = (isDefault) => {
                document.body.classList.toggle('fonts-default', isDefault);
                fontBtn.classList.toggle('active', isDefault);
                fontBtn.textContent = isDefault ? '✨ テーマ固有に戻す' : '🔤 デフォルトフォント';
                localStorage.setItem(App.FONT_KEY, isDefault ? '1' : '0');
            };
            setFontMode(localStorage.getItem(App.FONT_KEY) === '1');
            fontBtn.addEventListener('click', () => {
                setFontMode(!document.body.classList.contains('fonts-default'));
            });
        }
    }

    _applyTheme(id) {
        document.documentElement.setAttribute('data-theme', id);
        try { localStorage.setItem('mc_planner_theme', id); } catch (_) {}
        document.querySelectorAll('.theme-card').forEach(c => {
            c.classList.toggle('active', c.dataset.themeId === id);
        });
        document.querySelectorAll('[data-theme-icon]').forEach(el => {
            el.src = `/icons/${id}/${el.dataset.themeIcon}.png`;
        });
    }

    _renderMaterialsTab() {
        const project = this._currentProject();
        if (!project) return;
        this._renderStructureCards(project);
        this._renderIntegratedStats(project);
        this._renderBlockList();
        this._updateViewer3DSelect(project);
    }

    _renderStructureCards(project) {
        const list = document.getElementById('structures-list');
        list.innerHTML = '';
        if (project.structures.length === 0) {
            list.innerHTML = '<p class="empty-hint">「構造を追加」で .mcstructure / .litematic / .nbt ファイルを追加してください</p>';
            return;
        }
        const themeId = document.documentElement.getAttribute('data-theme') || 'dark-1';
        const showOffsetUI = project.structures.length >= 2;  // 単一構造ではノイズになるので隠す
        for (const s of project.structures) {
            list.appendChild(this._buildStructureCard(s, project, showOffsetUI, themeId));
        }
    }

    /**
     * 1 構造分の DOM (card 要素) を生成。ハンドラ紐付け済み。
     * M-P-01: 単独カード更新で全カード再生成を回避するため抽出。
     */
    _buildStructureCard(s, project, showOffsetUI, themeId) {
        const card = document.createElement('div');
        card.className = 'structure-card glass-card';
        card.dataset.sid = s.id;
        const hasCoords = this.coordsCache.has(s.id);
        const off = ProjectManager.getOffset(s);
        const init = ProjectManager.getInitialOffset(s);
        const isInit = off.x === init.x && off.y === init.y && off.z === init.z;
        const offsetRow = showOffsetUI ? `
            <div class="sc-offset-row" data-sid="${s.id}">
                <span class="sc-offset-label">📐 位置</span>
                <span class="sc-off-label">X
                    <button class="sc-off-step icon-btn" data-axis="x" data-delta="-1" title="-1">−</button>
                    <input type="number" class="size-input sc-off-input sc-off-x" data-axis="x" step="1" value="${off.x}">
                    <button class="sc-off-step icon-btn" data-axis="x" data-delta="1" title="+1">+</button>
                </span>
                <span class="sc-off-label">Y
                    <button class="sc-off-step icon-btn" data-axis="y" data-delta="-1" title="-1">−</button>
                    <input type="number" class="size-input sc-off-input sc-off-y" data-axis="y" step="1" value="${off.y}">
                    <button class="sc-off-step icon-btn" data-axis="y" data-delta="1" title="+1">+</button>
                </span>
                <span class="sc-off-label">Z
                    <button class="sc-off-step icon-btn" data-axis="z" data-delta="-1" title="-1">−</button>
                    <input type="number" class="size-input sc-off-input sc-off-z" data-axis="z" step="1" value="${off.z}">
                    <button class="sc-off-step icon-btn" data-axis="z" data-delta="1" title="+1">+</button>
                </span>
                <button class="sc-snap-btn mc-btn secondary small" title="他の構造の面に合わせる">↔ 整列</button>
                <button class="sc-offset-reset icon-btn" title="初期値に戻す" ${isInit ? 'disabled' : ''}>↺</button>
            </div>
        ` : '';
        card.innerHTML = `
            <div class="sc-row-main">
                <div class="sc-icon"><img class="sc-icon-img" data-theme-icon="logo" src="/icons/${themeId}/logo.png" alt=""></div>
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
            </div>
            ${offsetRow}
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
                this._allModeOrigin = null; // 構造削除で原点リセット
                ProjectManager.save(this.projects);
                this._renderMaterialsTab();
            }
        };
        if (showOffsetUI) {
            card.querySelectorAll('.sc-off-input').forEach(inp => {
                inp.addEventListener('change', () => {
                    this._setStructureOffset(s.id, inp.dataset.axis, parseInt(inp.value, 10) || 0);
                });
            });
            card.querySelectorAll('.sc-off-step').forEach(btn => {
                btn.addEventListener('click', () => {
                    const axis = btn.dataset.axis;
                    const delta = parseInt(btn.dataset.delta, 10);
                    const inp = card.querySelector(`.sc-off-${axis}`);
                    const newVal = (parseInt(inp.value, 10) || 0) + delta;
                    inp.value = newVal;
                    this._setStructureOffset(s.id, axis, newVal);
                });
            });
            card.querySelector('.sc-offset-reset').onclick = () => {
                this._resetStructureOffset(s.id);
            };
            card.querySelector('.sc-snap-btn').onclick = (ev) => {
                this._openSnapPopover(s.id, ev.currentTarget);
            };
        }
        return card;
    }

    /**
     * 単独カードを差分更新 (M-P-01)。全カード再生成より大幅に軽い。
     * 該当カードが見つからない場合はフォールバックで _renderStructureCards 全体を呼ぶ。
     */
    _updateStructureCard(structureId) {
        const project = this._currentProject();
        if (!project) return;
        const s = project.structures.find(x => x.id === structureId);
        const oldCard = document.querySelector(`.structure-card[data-sid="${structureId}"]`);
        if (!s || !oldCard) {
            // 構造数の増減や DOM 不在ならフル再生成にフォールバック
            this._renderStructureCards(project);
            return;
        }
        const themeId = document.documentElement.getAttribute('data-theme') || 'dark-1';
        const showOffsetUI = project.structures.length >= 2;
        const newCard = this._buildStructureCard(s, project, showOffsetUI, themeId);
        oldCard.replaceWith(newCard);
    }

    /** 1軸だけ更新して永続化＋3D再描画スケジュール */
    _setStructureOffset(structureId, axis, value) {
        const project = this._currentProject();
        if (!project) return;
        const s = project.structures.find(x => x.id === structureId);
        if (!s) return;
        if (!s.offset) s.offset = { x: 0, y: 0, z: 0 };
        const prevOffset = { ...s.offset };
        const newVal = value | 0;
        if (prevOffset[axis] === newVal) return; // 変化なしなら履歴に積まない
        this._pushHistory({ type: 'offset', structureId, prevOffset });
        s.offset[axis] = newVal;
        ProjectManager.save(this.projects);
        // リセットボタンの disabled 状態を更新するためにカードを再描画
        // ただし入力中のフォーカスを失いたくないので軽量更新だけ
        this._refreshOffsetResetState(structureId);
        this._scheduleViewer3DRefresh();
    }

    _resetStructureOffset(structureId) {
        const project = this._currentProject();
        if (!project) return;
        const s = project.structures.find(x => x.id === structureId);
        if (!s) return;
        const init = ProjectManager.getInitialOffset(s);
        const prevOffset = { ...(s.offset || { x: 0, y: 0, z: 0 }) };
        if (prevOffset.x === init.x && prevOffset.y === init.y && prevOffset.z === init.z) return;
        this._pushHistory({ type: 'offset', structureId, prevOffset });
        s.offset = { x: init.x, y: init.y, z: init.z };
        ProjectManager.save(this.projects);
        this._updateStructureCard(structureId);
        this._scheduleViewer3DRefresh();
    }

    _refreshOffsetResetState(structureId) {
        const card = document.querySelector(`.sc-offset-row[data-sid="${structureId}"]`);
        if (!card) return;
        const project = this._currentProject();
        const s = project?.structures.find(x => x.id === structureId);
        if (!s) return;
        const off = ProjectManager.getOffset(s);
        const init = ProjectManager.getInitialOffset(s);
        const isInit = off.x === init.x && off.y === init.y && off.z === init.z;
        const btn = card.querySelector('.sc-offset-reset');
        if (btn) btn.disabled = isInit;
    }

    /** __ALL__ モード時のみ、デバウンスして 3D 再描画。
     *  ドロップダウン値で判定するので、まだ「3D表示を開始」を押していなくても
     *  初回回転/移動クリックでロード＆描画が走る。 */
    _scheduleViewer3DRefresh() {
        const sel = document.getElementById('viewer3d-structure-select');
        if (sel?.value !== '__ALL__') return;
        clearTimeout(this._viewer3dRefreshTimer);
        this._viewer3dRefreshTimer = setTimeout(() => this._load3DView(), 150);
    }

    /** 整列ポップオーバー：B (= structureId) を別構造 A の指定面に貼り付ける。 */
    _openSnapPopover(structureId, anchorBtn) {
        this._closeSnapPopover();
        const project = this._currentProject();
        if (!project) return;
        const target = project.structures.find(s => s.id === structureId);
        if (!target) return;
        const others = project.structures.filter(s => s.id !== structureId);
        if (others.length === 0) {
            this._toast('整列の基準にする別の構造がありません', 'info');
            return;
        }

        const pop = document.createElement('div');
        pop.className = 'sc-snap-popover glass-card';
        pop.setAttribute('role', 'dialog');
        const optionsHtml = others.map(s => `<option value="${s.id}">${this._escape(s.name)}</option>`).join('');
        pop.innerHTML = `
            <div class="snap-pop-header">「${this._escape(target.name)}」を整列</div>
            <label class="snap-pop-base">
                基準:
                <select class="control-select snap-pop-base-sel">${optionsHtml}</select>
            </label>
            <div class="snap-pop-dirs">
                <button class="mc-btn secondary small snap-dir-btn" data-dir="+y">⬆ 上 (+Y)</button>
                <button class="mc-btn secondary small snap-dir-btn" data-dir="-y">⬇ 下 (-Y)</button>
                <button class="mc-btn secondary small snap-dir-btn" data-dir="+x">➡ 東 (+X)</button>
                <button class="mc-btn secondary small snap-dir-btn" data-dir="-x">⬅ 西 (-X)</button>
                <button class="mc-btn secondary small snap-dir-btn" data-dir="+z">⬇ 南 (+Z)</button>
                <button class="mc-btn secondary small snap-dir-btn" data-dir="-z">⬆ 北 (-Z)</button>
            </div>
            <div class="snap-pop-footer">
                <button class="mc-btn secondary small snap-pop-close">閉じる</button>
            </div>
        `;
        document.body.appendChild(pop);

        // 位置: アンカー直下に表示。画面外にはみ出すなら左に寄せる。
        const rect = anchorBtn.getBoundingClientRect();
        const popRect = pop.getBoundingClientRect();
        let left = rect.left;
        if (left + popRect.width > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - popRect.width - 8);
        }
        let top = rect.bottom + 4;
        if (top + popRect.height > window.innerHeight - 8) {
            top = Math.max(8, rect.top - popRect.height - 4);
        }
        pop.style.position = 'fixed';
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';

        const baseSel = pop.querySelector('.snap-pop-base-sel');
        pop.querySelectorAll('.snap-dir-btn').forEach(btn => {
            btn.onclick = () => {
                const baseId = baseSel.value;
                const baseStruct = project.structures.find(s => s.id === baseId);
                if (!baseStruct) return;
                const prevOffset = { ...ProjectManager.getOffset(target) };
                const newOffset = snapStructure(
                    { offset: ProjectManager.getOffset(baseStruct), size: baseStruct.size },
                    { offset: prevOffset, size: target.size },
                    btn.dataset.dir,
                );
                this._pushHistory({ type: 'offset', structureId: target.id, prevOffset });
                target.offset = newOffset;
                ProjectManager.save(this.projects);
                // 入力欄の値も更新
                const card = document.querySelector(`.sc-offset-row[data-sid="${structureId}"]`);
                if (card) {
                    card.querySelector('.sc-off-x').value = newOffset.x;
                    card.querySelector('.sc-off-y').value = newOffset.y;
                    card.querySelector('.sc-off-z').value = newOffset.z;
                }
                this._refreshOffsetResetState(structureId);
                this._scheduleViewer3DRefresh();
                this._toast(`「${target.name}」を ${DIRECTION_LABELS[btn.dataset.dir]} に整列`, 'success');
            };
        });
        pop.querySelector('.snap-pop-close').onclick = () => this._closeSnapPopover();

        // 外側クリック・Esc で閉じる
        this._snapPopover = pop;
        this._snapPopoverHandler = (ev) => {
            if (pop.contains(ev.target) || anchorBtn.contains(ev.target)) return;
            this._closeSnapPopover();
        };
        this._snapPopoverKeyHandler = (ev) => {
            if (ev.key === 'Escape') this._closeSnapPopover();
        };
        setTimeout(() => {
            document.addEventListener('pointerdown', this._snapPopoverHandler);
            document.addEventListener('keydown', this._snapPopoverKeyHandler);
        }, 0);
    }

    _closeSnapPopover() {
        if (this._snapPopover) {
            this._snapPopover.remove();
            this._snapPopover = null;
        }
        if (this._snapPopoverHandler) {
            document.removeEventListener('pointerdown', this._snapPopoverHandler);
            this._snapPopoverHandler = null;
        }
        if (this._snapPopoverKeyHandler) {
            document.removeEventListener('keydown', this._snapPopoverKeyHandler);
            this._snapPopoverKeyHandler = null;
        }
    }

    _renderIntegratedStats(project) {
        const integrated = ProjectManager.getIntegrated(project, this.replacements)
            .filter(r => !/structure_block|structure_void|jigsaw|barrier/.test(r.id));
        const totalBlocks = integrated.reduce((a, r) => a + r.count, 0);
        const totalSlots = integrated.reduce((a, r) => a + r.slots, 0);
        const shulkers = Math.ceil(totalSlots / 27);
        const totalStacks = Math.floor(totalBlocks / 64);
        this._setStatVal('stat-total', totalBlocks.toLocaleString());
        this._setStatVal('stat-unique', integrated.length.toLocaleString());
        this._setStatVal('stat-stacks', totalStacks.toLocaleString());
        this._setStatVal('stat-shulkers', shulkers.toLocaleString());
        this._integratedMaterials = integrated;
        this.onMaterialsUpdated?.();
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

    // ─── Litematic Conversion ──────────────────────────────────────────────────
    _setupLitematicConvert() {
        const btn      = document.getElementById('convert-litematic-btn');
        const mergeBtn = document.getElementById('merge-convert-litematic-btn');
        if (btn)      btn.addEventListener('click',      () => this._convertToLitematic());
        if (mergeBtn) mergeBtn.addEventListener('click', () => this._mergeAndConvertToLitematic());
    }

    async _mergeAndConvertToLitematic() {
        const project = this._currentProject();
        if (!project || project.structures.length === 0) {
            this._toast('プロジェクトに構造がありません', 'error');
            return;
        }

        // すべての構造のバッファ + ユーザー設定 offset + 回転 を取得
        const buffers = [];
        const offsets = [];
        const rotations = [];
        const missing = [];
        for (const s of project.structures) {
            const buf = this.bufferCache.get(s.id);
            if (buf) {
                buffers.push(buf.slice(0));
                const o = ProjectManager.getOffset(s);
                offsets.push([o.x | 0, o.y | 0, o.z | 0]);
                rotations.push(ProjectManager.getRotation(s) | 0);
            } else {
                missing.push(s.name);
            }
        }

        if (missing.length > 0) {
            this._toast(`元バッファ未取得: ${missing.join(', ')} を再アップロードしてください`, 'error');
            return;
        }

        const btn       = document.getElementById('merge-convert-litematic-btn');
        const statusEl  = document.getElementById('litematic-status');
        if (btn) btn.disabled = true;
        if (statusEl) { statusEl.textContent = `⏳ ${buffers.length} 構造を合体変換中...`; statusEl.style.color = 'var(--muted2)'; }

        try {
            const baseName  = `${project.name || 'merged'}_${buffers.length}structs`.replace(/\s+/g, '_');
            const litemBuf  = await mergeAndConvertToLitematic(buffers, {
                minecraftDataVersion: 3700,
                name: baseName,
                worldOrigins: offsets,
                rotations,
            });
            downloadBuffer(litemBuf, `${baseName}.litematic`);
            if (statusEl) { statusEl.textContent = `✅ ${baseName}.litematic (${buffers.length}構造合体) をダウンロード`; statusEl.style.color = 'var(--primary)'; }
        } catch (err) {
            if (statusEl) { statusEl.textContent = `❌ 合体変換失敗: ${err.message}`; statusEl.style.color = '#fc8181'; }
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async _convertToLitematic() {
        const sel = document.getElementById('viewer3d-structure-select')?.value;
        if (!sel) { this._toast('構造が選択されていません', 'error'); return; }
        const buf = this.bufferCache.get(sel);
        if (!buf) { this._toast('元バッファがありません（ファイルを再アップロードしてください）', 'error'); return; }
        const structure = this._currentProject()?.structures.find(s => s.id === sel);
        if (!structure) return;

        const btn = document.getElementById('convert-litematic-btn');
        const statusEl = document.getElementById('litematic-status');
        if (btn) btn.disabled = true;
        if (statusEl) { statusEl.textContent = '⏳ 変換中...'; statusEl.style.color = 'var(--muted2)'; }
        try {
            // buf は bufferCache に残すため slice(0) でコピーして転送
            const litemBuffer = await convertToLitematic(buf.slice(0), { minecraftDataVersion: 3700 });
            const baseName = structure.name.replace(/\s+/g, '_');
            downloadBuffer(litemBuffer, `${baseName}.litematic`);
            if (statusEl) { statusEl.textContent = `✅ ${baseName}.litematic をダウンロードしました`; statusEl.style.color = 'var(--primary)'; }
        } catch (err) {
            if (statusEl) { statusEl.textContent = `❌ 変換失敗: ${err.message}`; statusEl.style.color = '#fc8181'; }
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // ─── Export / Import (App layer — delegates to export-utils) ──────────────
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
            if (!confirm('置換が設定されていません。元のファイルをそのままダウンロードしますか？')) return;
        }
        try {
            this._showLoading('NBT を再構築中...');
            const count = await exportMcStructure(buf, repMap, structure.name);
            this._hideLoading();
            this._toast(`💾 .mcstructure をダウンロード（${count}件の置換適用）`);
        } catch (err) {
            console.error(err);
            this._hideLoading();
            this._toast('❌ エクスポート失敗: ' + err.message, 'error');
        }
    }

    async _copyAsMarkdown(btn) {
        try {
            await copyAsMarkdown(this._integratedMaterials, this.langData, this._currentProject(), btn);
            this._toast('📋 Markdown をクリップボードにコピー');
        } catch (e) {
            this._toast(e.message || '合計素材がありません', 'error');
        }
    }

    _exportCsv() {
        if (!this._integratedMaterials) { this._toast('合計素材がありません', 'error'); return; }
        exportCsv(this._integratedMaterials, this.langData, this._currentProject()?.name);
        this._toast('📤 CSV をダウンロードしました');
    }

    _exportAll() {
        exportAllProjects(this.projects);
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

    // ─── Materials ─────────────────────────────────────────────────────────────
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
        if (this.currentTab !== 'viewer3d') {
            this._toast(`🔍 ${this.langData[blockId] || blockId} をハイライト中（3Dビューに切替）`);
            this._switchTab('viewer3d', false);
        } else {
            this._toast(`🔍 ${this.langData[blockId] || blockId} をハイライト中`);
        }
    }

    /** 資材リスト直上の「準備済み」プログレスバーを描画/更新する (additive UI) */
    _renderPreparedProgress() {
        const list = document.getElementById('block-list');
        if (!list || !list.parentNode) return;
        let bar = document.getElementById('prepared-progress');
        const items = this._integratedMaterials || [];
        if (items.length === 0) { if (bar) bar.style.display = 'none'; return; }
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'prepared-progress';
            bar.style.cssText = 'margin:0 0 0.6rem';
            bar.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:var(--muted,#9ab0c8);margin-bottom:0.25rem">
                    <span>✅ 準備済み</span><span id="prepared-progress-text"></span>
                </div>
                <div style="height:8px;border-radius:4px;background:var(--bg2,rgba(128,128,128,0.25));overflow:hidden">
                    <div id="prepared-progress-fill" style="height:100%;width:0%;border-radius:4px;background:var(--accent,#63b3ed);transition:width .25s ease"></div>
                </div>`;
            list.parentNode.insertBefore(bar, list);
        }
        bar.style.display = '';
        const prepared = this._preparedSet();
        const done = items.reduce((n, r) => n + (prepared.has(r.id) ? 1 : 0), 0);
        const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
        const text = document.getElementById('prepared-progress-text');
        const fill = document.getElementById('prepared-progress-fill');
        if (text) text.textContent = `${done} / ${items.length} 種 (${pct}%)`;
        if (fill) {
            fill.style.width = `${pct}%`;
            fill.style.background = pct >= 100 ? 'var(--success, #48bb78)' : 'var(--accent, #63b3ed)';
        }
    }

    _renderBlockList() {
        const list = document.getElementById('block-list');
        if (!list) return;
        this._renderPreparedProgress();
        if (!this._integratedMaterials) { list.innerHTML = ''; return; }
        const query = document.getElementById('search-input')?.value.toLowerCase() ?? '';
        const showId = document.getElementById('id-toggle')?.checked ?? false;
        const showWiki = document.getElementById('wiki-toggle')?.checked ?? false;
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
            const guess = this._guessRawIdAndStates(item.id);
            let packUrl = null;
            if (ResourcePack.isLoaded()) {
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
                         onerror="if(this.dataset.i===undefined)this.dataset.i=0;let srcs=${JSON.stringify(sources).replace(/"/g, '&quot;')};if(++this.dataset.i<srcs.length)this.src=srcs[this.dataset.i];"
                         class="block-icon-img" alt="">
                </div>
                <div class="block-info">
                    <div class="block-name ${showId ? 'is-id' : ''}" data-fullid="${item.id}" title="クリックでIDをコピー">${this._escape(displayName)}</div>
                    <div class="block-count">${item.count.toLocaleString()}</div>
                    <div class="block-stack">${item.stacks}st + ${item.remainder}個</div>
                    ${shulkerCount > 0 ? `<div class="shulker-badge">🔮 ${shulkerCount}箱 +${shulkerRem}st</div>` : ''}
                </div>
            `;
            card.querySelector('.block-name').addEventListener('click', () => {
                navigator.clipboard.writeText(item.id)
                    .then(() => this._toast(`📋 ${item.id}`))
                    .catch(() => this._toast('コピーに失敗しました', 'error'));
            });
            card.querySelector('.prepared-check').addEventListener('change', (e) => {
                const pid = this.currentProjectId;
                if (!this.preparedItems.has(pid)) this.preparedItems.set(pid, new Set());
                const set = this.preparedItems.get(pid);
                if (e.target.checked) set.add(item.id); else set.delete(item.id);
                this._savePrepared();
                card.classList.toggle('prepared', e.target.checked);
                this._renderPreparedProgress();
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
                    } catch (e) { return null; }
                }
            });
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
        const btnEdit = $('btn-dotart-mode-edit');
        const btnView = $('btn-dotart-mode-view');
        if (btnEdit && btnView) {
            btnEdit.onclick = () => { btnEdit.classList.replace('secondary', 'primary'); btnView.classList.replace('primary', 'secondary'); ed.setViewMode(false); };
            btnView.onclick = () => { btnView.classList.replace('secondary', 'primary'); btnEdit.classList.replace('primary', 'secondary'); ed.setViewMode(true); };
        }
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
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ed.setTool(btn.dataset.tool);
            };
        });
        $('btn-resize-grid').onclick = () => {
            const w = parseInt($('grid-width').value);
            const h = parseInt($('grid-height').value);
            if (w >= 8 && w <= 2048 && h >= 8 && h <= 2048) {
                if (this.dotArtEditor) { this.dotArtEditor.resize(w, h); this._toast(`📏 グリッドを ${w}x${h} にリサイズ`); }
            } else {
                this._toast('サイズは 8 〜 2048 の範囲で指定してください', 'error');
            }
        };
        const btnPal = $('btn-palette-change');
        if (btnPal) btnPal.onclick = () => { this._blockSelectorMode = 'palette'; this._openBlockSelector(); };
        $('btn-clear-canvas').onclick = () => { if (confirm('キャンバスをクリアしますか？')) ed.clear(); };
        const fileIn = $('img2dot-file');
        $('btn-img2dot-pick').onclick = () => fileIn.click();
        fileIn.onchange = (e) => {
            const f = e.target.files[0];
            if (f) { this._lastDotArtFile = f; $('btn-img2dot-apply').disabled = false; this._img2dotConvert(f); }
            e.target.value = '';
        };
        $('btn-img2dot-apply').onclick = () => { if (this._lastDotArtFile) this._img2dotConvert(this._lastDotArtFile); };
        const sizeMode = $('dotart-size-mode');
        const mapCtrls = $('dotart-map-size-controls');
        const cusCtrls = $('dotart-custom-size-controls');
        sizeMode.onchange = () => {
            const isMap = sizeMode.value === 'map';
            mapCtrls.style.display = isMap ? 'flex' : 'none';
            cusCtrls.style.display = isMap ? 'none' : 'flex';
        };
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
        ['contrast', 'saturation', 'dither'].forEach(id => {
            const range = $(`img2dot-${id}`);
            const val = $(`img2dot-${id}-val`);
            if (range && val) range.addEventListener('input', () => { val.textContent = range.value; });
        });
        $('btn-map-calc-pos').onclick = () => {
            const x = parseInt($('map-cur-x').value) || 0;
            const z = parseInt($('map-cur-z').value) || 0;
            import('./image2dot.js').then(m => {
                const snapped = m.snapToMapGrid(x, z);
                const shifted = m.shiftForEdgeExclusion(snapped.x, snapped.z);
                const info = $('map-pos-info');
                if (!info) return;
                info.style.display = 'block';
                info.innerHTML = `
                    <div>最寄り地図角: <strong>${snapped.x}, ${snapped.z}</strong></div>
                    <div style="color:var(--accent);margin-top:0.2rem">💡 推奨設置座標 (縁を回避):<br><strong>X: ${shifted.x}, Z: ${shifted.z}</strong></div>
                    <div style="font-size:0.6rem;margin-top:0.2rem;opacity:0.8">※統合版の仕様により、地図の最外周1ブロックは色が化けることがあるため、+1ずらして配置することを推奨します。</div>
                `;
            }).catch(err => {
                console.error('map-calc-pos failed:', err);
                this._toast?.('地図座標の計算に失敗しました', 'error');
            });
        };
        $('btn-export-png').onclick = () => this._exportDotArtPng();
        $('btn-dotart-to-struct').onclick = () => this._addDotArtAsStructure();
        $('btn-dotart-pdf')?.addEventListener('click', () => this._exportDotArtPDF());
    }

    async _exportDotArtPDF() {
        const editor = this.dotArtEditor;
        if (!editor || !editor.grid) { this._toast?.('ドット絵が空です', 'error'); return; }
        const tileSize = Math.max(8, Math.min(64, parseInt($('dotart-pdf-tile')?.value || '16', 10)));
        try {
            this._showLoading('PDF を生成中…');
            const { exportDotArtTiledPDF } = await import('./ui/panels/dotart-pdf.js');
            await exportDotArtTiledPDF(editor, DOT_PALETTE, tileSize, this.langData || {});
            this._toast?.('📄 PDF をダウンロードしました');
        } catch (err) {
            console.error('[dotart-pdf]', err);
            this._toast?.('PDF 生成エラー: ' + err.message, 'error');
        } finally {
            this._hideLoading();
        }
    }

    async _img2dotConvert(file) {
        this._showLoading('画像をブロックに変換中...');
        await new Promise(r => setTimeout(r, 50));
        try {
            const m = await import('./image2dot.js');
            const img = await m.loadImage(file);
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
            this.dotArtEditor.setData(res.grid);
            this._renderDotArtMaterials(this.dotArtEditor.getMaterialCount());
            this._toast(`✨ ${gridW}x${gridH} のドット絵を生成しました`);
        } catch (e) {
            console.error(e);
            this._toast('❌ 変換失敗: ' + e.message, 'error');
        } finally {
            this._hideLoading();
        }
    }

    _exportDotArtPng() {
        if (!this.dotArtEditor) { this._toast('まだドット絵がありません', 'error'); return; }
        const scaleStr = prompt('画像スケール倍率 (1 / 4 / 16)', '4');
        const scale = parseInt(scaleStr, 10);
        if (!scale || scale < 1 || scale > 32) return;
        const ed = this.dotArtEditor;
        const drawAndSave = (useIcons) => {
            const tmp = document.createElement('canvas');
            tmp.width = ed.gridW * scale;
            tmp.height = ed.gridH * scale;
            const ctx = tmp.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, tmp.width, tmp.height);
            for (let y = 0; y < ed.gridH; y++) {
                for (let x = 0; x < ed.gridW; x++) {
                    const blockId = ed.grid[y][x];
                    if (blockId) {
                        const palette = DOT_PALETTE.find(p => p.id === blockId);
                        const px = x * scale, py = y * scale;
                        const icon = useIcons ? ed.icons[blockId] : null;
                        if (icon && icon.complete && icon.naturalWidth !== 0) {
                            try {
                                ctx.drawImage(icon, px, py, scale, scale);
                            } catch (e) {
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
                a.href = url; a.download = name; a.click();
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
            id: 'dotart_' + Date.now(), name,
            totalCount: counts.reduce((a, b) => a + b.count, 0),
            uniqueCount: counts.length, results, multiplier: 1,
            size: { x: ed.gridW, y: 1, z: ed.gridH }
        };
        project.structures.push(struct);
        ProjectManager.save(this.projects);
        this._toast(`➕ 「${name}」を構造リストに追加しました`);
        this._renderMaterialsTab();
        this._scheduleViewer3DRefresh();
    }

    _addTempPaletteBlock(id, name) {
        const paletteBox = document.getElementById('block-palette');
        if (!paletteBox) return;
        const existing = [...paletteBox.querySelectorAll('.palette-btn')].find(b => b.dataset.id === id);
        if (existing) { existing.click(); return; }
        const btn = document.createElement('button');
        btn.className = 'palette-btn active';
        btn.dataset.id = id;
        btn.title = name;
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

    // ─── Resource Pack ─────────────────────────────────────────────────────────
    async _handlePackFile(file, fromUpload = false) {
        const $ = id => document.getElementById(id);
        try {
            const status = $('pack-status');
            if (status) status.textContent = fromUpload ? '解凍中...' : '保存済みパック復元中...';
            const info = await ResourcePack.loadFromZip(file);
            if (status) status.textContent = `✅ ${info.name} (${info.count}テクスチャ${info.isBedrock ? ' / Bedrock' : ''})`;
            const realRadio = document.querySelector('input[name="viewer3d-colormode"][value="realtexture"]');
            if (realRadio) {
                realRadio.disabled = false;
                realRadio.checked = true;
                realRadio.dispatchEvent(new Event('change'));
            }
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
            if (this.viewer3d?.isInitialized) { this._load3DView(); }
            else { this.viewer3d?.refreshTextures?.(); }
            const selVal = document.getElementById('viewer3d-structure-select')?.value;
            if (selVal) this._renderReplaceList(selVal);
            this._renderBlockList?.();
        } catch (err) {
            console.error('Pack load failed:', err);
            const status = document.getElementById('pack-status');
            if (status) status.textContent = '❌ ' + err.message;
            this._toast('リソースパック読み込み失敗: ' + err.message, 'error');
        }
    }

    async _autoRestoreStructureBuffers() {
        this._isRestoringBuffers = true;
        try {
            const all = await ResourcePack.loadAllStructureBuffers();
            if (!all || all.size === 0) return;
            for (const [id, entry] of all.entries()) {
                if (!entry || !entry.buffer) continue;
                this.bufferCache.set(id, entry.buffer);
                // 旧データには fileName が無い場合がある → edition から推測でフォールバック
                const fn = entry.fileName
                    || (entry.edition === 'java' ? (entry.name || 'restored') + '.litematic' : (entry.name || 'restored') + '.mcstructure');
                this.bufferFileNameCache.set(id, fn);
            }
        } catch (e) {
            console.warn('Auto-restore structure buffers failed:', e);
        } finally {
            this._isRestoringBuffers = false;
        }
    }

    async _ensureCoordsForStructure(structureId) {
        if (this.coordsCache.has(structureId)) return true;
        const buf = this.bufferCache.get(structureId);
        if (!buf) return false;
        const fileName = this.bufferFileNameCache.get(structureId);
        try {
            const data = await this._parseBuffer(buf, fileName);
            this._hideLoading();
            if (data.success) {
                this.coordsCache.set(structureId, data.coords);
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

    async _autoRestorePack() {
        try {
            const saved = await ResourcePack.loadSavedPackFromIDB();
            if (!saved || !saved.blob) return;
            const status = document.getElementById('pack-status');
            if (status) status.textContent = `保存済みパック「${saved.name}」を復元中...`;
            const fakeFile = new File([saved.blob], saved.name, { type: saved.blob.type });
            await this._handlePackFile(fakeFile, false);
        } catch (e) {
            console.warn('Auto-restore pack failed:', e);
        }
    }

    // ─── 3D View ───────────────────────────────────────────────────────────────
    _initViewer3DTab() {
        const panel = document.getElementById('viewer3d-side-panel');
        if (panel) panel.classList.remove('collapsed');

        // ── サブタブ切り替え配線（初回のみ） ──
        if (!this._v3dSubtabsInited) {
            this._v3dSubtabsInited = true;
            document.querySelectorAll('.v3d-subtab').forEach(btn => {
                btn.addEventListener('click', () => this._switchV3dSubtab(btn.dataset.subtab));
            });
        }

        const project = this._currentProject();
        if (project) {
            this._updateViewer3DSelect(project);
            if (this.viewer3d?.isInitialized) {
                this._load3DView();
                requestAnimationFrame(() => this.viewer3d.handleResize());
            }
        }
    }

    _switchV3dSubtab(name) {
        document.querySelectorAll('.v3d-subtab').forEach(b => b.classList.toggle('active', b.dataset.subtab === name));
        document.querySelectorAll('.v3d-subtab-panel').forEach(p => p.classList.toggle('hidden', p.id !== `v3d-subtab-${name}`));
    }

    _updateViewer3DSelect(project) {
        const sel = document.getElementById('viewer3d-structure-select');
        const prev = sel.value;
        sel.innerHTML = '';
        // 2構造以上なら先頭に「全構造」モードを追加
        if (project.structures.length >= 2) {
            const optAll = document.createElement('option');
            optAll.value = '__ALL__';
            optAll.textContent = '▼ 全構造（位置調整プレビュー）';
            sel.appendChild(optAll);
        }
        project.structures.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.size ? `${s.size.x}×${s.size.y}×${s.size.z}` : '?'})`;
            sel.appendChild(opt);
        });
        // 直前の選択を維持。初回かつ 2+ 構造なら __ALL__ を自動選択。
        if (prev && sel.querySelector(`option[value="${prev}"]`)) {
            sel.value = prev;
        } else if (project.structures.length >= 2) {
            sel.value = '__ALL__';
        }
        this.refreshToolsStructureSelect?.();
        if (sel.value !== '__ALL__') {
            this._renderReplaceList(sel.value);
            // __ALL__ から離れたら、次回 __ALL__ ロード時に autoFocus を再実行
            this._viewer3dAllAutofocused = false;
            // 個別構造でも位置調整パネルを表示（その1構造のみ）
            const targetStruct = project.structures.find(s => s.id === sel.value);
            if (targetStruct) {
                this._renderV3dOffsetPanel(project, [targetStruct]);
            } else {
                const op = document.getElementById('v3d-offset-panel');
                if (op) op.classList.add('hidden');
            }
        } else {
            // __ALL__ 選択時は即座に位置調整UIを表示（3D描画ボタン押下不要）
            this._switchV3dSubtab('advanced');
            this._renderV3dOffsetPanel(project);
        }
        const selected = project.structures.find(s => s.id === sel.value);
        if (selected?.size) {
            const maxY = selected.size.y - 1;
            document.getElementById('layer-max').max = maxY;
            document.getElementById('layer-max').value = maxY;
            document.getElementById('layer-max-val').textContent = maxY;
        }
        const convertBtn = document.getElementById('convert-litematic-btn');
        if (convertBtn) convertBtn.disabled = sel.value === '__ALL__' || !this.bufferCache.has(sel.value);

        // 合体変換ボタン: プロジェクトに 2+ 構造がありかつ全 buffer が取得済みなら有効化
        const mergeBtn = document.getElementById('merge-convert-litematic-btn');
        if (mergeBtn) {
            const allHaveBuf = project.structures.length >= 2
              && project.structures.every(s => this.bufferCache.has(s.id));
            mergeBtn.disabled = !allHaveBuf;
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

    _applyReplacements(structureId, coords) {
        return applyToCoords(coords, this.replacements.get(structureId));
    }

    _onViewer3DClick(info) {
        document.getElementById('v3d-block-popup')?.remove();
        this.viewer3d?.clearSelectionIndicator();
        if (!info) return;
        const { blockId, coord, screenX, screenY } = info;
        const name = this.langData?.[blockId] || blockId.replace('minecraft:', '');
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
                ${this._deletedPositions.size > 0 ? `<button id="v3d-pop-restore" class="mc-btn secondary small" style="width:100%;text-align:left;opacity:0.8">↺ 直前の削除を1つ戻す (残り ${this._deletedPositions.size}件)</button>` : ''}
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('v3d-pop-set-replace')?.addEventListener('click', () => {
            const fromEl = document.getElementById('replace-from');
            const fromNameEl = document.getElementById('replace-from-name');
            if (fromEl) fromEl.value = blockId;
            if (fromNameEl) fromNameEl.textContent = name;
            popup.remove();
            this._toast(`🔄 「${name}」を置換元に設定しました`);
        });
        document.getElementById('v3d-pop-del-one')?.addEventListener('click', () => {
            if (coord) {
                const pos = `${coord.x},${coord.y},${coord.z}`;
                this._deletedPositions.add(pos);
                this._pushHistory({ type: 'delete', positions: [pos] });
                this._applySlice();
                popup.remove();
                this._toast(`🗑️ 1ブロック削除しました`);
            }
        });
        document.getElementById('v3d-pop-del-all')?.addEventListener('click', () => {
            const fromEl = document.getElementById('replace-from');
            const toEl = document.getElementById('replace-to');
            const fromNameEl = document.getElementById('replace-from-name');
            const toNameEl = document.getElementById('replace-to-name');
            if (fromEl) fromEl.value = blockId;
            if (fromNameEl) fromNameEl.textContent = name;
            if (toEl) toEl.value = 'minecraft:air';
            if (toNameEl) toNameEl.textContent = 'air (削除)';
            document.getElementById('btn-add-replace')?.click();
            popup.remove();
            this._toast(`💥 「${name}」を削除置換に追加しました`);
        });
        document.getElementById('v3d-pop-restore')?.addEventListener('click', () => {
            this._undoLastAction();
            popup.remove();
        });
        const close = (e) => {
            if (!popup.contains(e.target)) {
                popup.remove();
                this.viewer3d?.clearSelectionIndicator();
                document.removeEventListener('pointerdown', close);
            }
        };
        setTimeout(() => document.addEventListener('pointerdown', close), 10);
    }

    _onViewer3DRangeClick(info) {
        document.getElementById('v3d-range-popup')?.remove();
        if (!info) {
            this._rangeStart = null;
            this.viewer3d?.clearRangeIndicator();
            return;
        }
        const { coord, screenX, screenY } = info;
        if (!this._rangeStart) {
            this._rangeStart = coord;
            this.viewer3d?.setRangeIndicator(coord, null);
            this._toast('📍 始点を選択しました。終点を Shift+右クリック してください。');
        } else {
            const start = this._rangeStart;
            const end = coord;
            this.viewer3d?.setRangeIndicator(start, end);
            const popup = document.createElement('div');
            popup.id = 'v3d-range-popup';
            popup.className = 'glass-card';
            popup.style.cssText = `
                position:fixed; z-index:9999;
                left:${Math.min(screenX + 8, window.innerWidth - 230)}px;
                top:${Math.min(screenY + 8, window.innerHeight - 170)}px;
                background:var(--surface2,#1e2a3a); border:1px solid var(--accent,#63b3ed);
                border-radius:10px; padding:0.8rem; min-width:220px;
                box-shadow:0 8px 32px rgba(0,0,0,0.7); font-size:0.82rem; color:var(--text,#e2e8f0);
            `;
            const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
            const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);
            const minZ = Math.min(start.z, end.z), maxZ = Math.max(start.z, end.z);
            const volume = (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
            popup.innerHTML = `
                <div style="font-weight:bold;color:var(--accent);margin-bottom:0.5rem;border-bottom:1px solid var(--border);padding-bottom:0.4rem">
                    📐 範囲選択 (${volume}ブロック)
                </div>
                <div style="font-size:0.7rem;color:var(--muted2);margin-bottom:0.6rem">
                    始点: ${start.x},${start.y},${start.z}<br>
                    終点: ${end.x},${end.y},${end.z}
                </div>
                <div style="display:flex;flex-direction:column;gap:0.4rem">
                    <button id="v3d-range-del" class="mc-btn secondary small" style="width:100%;text-align:left;color:var(--danger)">🗑️ この範囲をすべて削除</button>
                    <button id="v3d-range-prepared" class="mc-btn secondary small" style="width:100%;text-align:left">✅ この範囲をすべて準備済みにする</button>
                    <div id="v3d-range-block-list" style="margin-top:0.4rem;border-top:1px solid var(--border);padding-top:0.4rem;max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;">
                        <div style="font-size:0.65rem;color:var(--muted2);margin-bottom:2px">範囲内のブロック (クリックで置換元へ):</div>
                    </div>
                    <button id="v3d-range-cancel" class="mc-btn secondary small" style="width:100%;text-align:left;opacity:0.7;margin-top:0.2rem">✕ 選択を解除</button>
                </div>
            `;
            document.body.appendChild(popup);
            const selId = document.getElementById('viewer3d-structure-select')?.value;
            const coords = this.coordsCache.get(selId);
            const uniqueBlocksInRange = new Set();
            if (coords) {
                coords.forEach(c => {
                    if (c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY && c.z >= minZ && c.z <= maxZ) {
                        uniqueBlocksInRange.add(c.blockId);
                    }
                });
            }
            const listEl = document.getElementById('v3d-range-block-list');
            uniqueBlocksInRange.forEach(bid => {
                if (bid.includes('air')) return;
                const bname = this.langData[bid] || bid.replace('minecraft:', '');
                const row = document.createElement('button');
                row.className = 'mc-btn secondary small';
                row.style.cssText = 'width:100%;text-align:left;font-size:0.7rem;padding:2px 6px;display:flex;align-items:center;gap:4px;';
                row.innerHTML = `<span style="width:16px;height:16px;display:inline-block;flex-shrink:0;">${this._getBlockIconHtml(bid)}</span> <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${bname}</span>`;
                row.onclick = () => {
                    const fromEl = document.getElementById('replace-from');
                    const fromNameEl = document.getElementById('replace-from-name');
                    if (fromEl) fromEl.value = bid;
                    if (fromNameEl) fromNameEl.textContent = bname;
                    this._toast(`🔄 「${bname}」を置換元に設定しました`);
                };
                listEl.appendChild(row);
            });
            document.getElementById('v3d-range-del').onclick = () => {
                if (confirm(`${volume} ブロックを一括削除しますか？`)) {
                    const deletedInThisAction = [];
                    for (let x = minX; x <= maxX; x++) {
                        for (let y = minY; y <= maxY; y++) {
                            for (let z = minZ; z <= maxZ; z++) {
                                const pos = `${x},${y},${z}`;
                                if (!this._deletedPositions.has(pos)) {
                                    this._deletedPositions.add(pos);
                                    deletedInThisAction.push(pos);
                                }
                            }
                        }
                    }
                    if (deletedInThisAction.length > 0) {
                        this._pushHistory({ type: 'delete', positions: deletedInThisAction });
                    }
                    this._applySlice();
                    this._rangeStart = null;
                    this.viewer3d?.clearRangeIndicator();
                    popup.remove();
                    this._toast(`🗑️ ${deletedInThisAction.length}ブロックを一括削除しました（履歴から戻せます）`);
                }
            };
            document.getElementById('v3d-range-prepared').onclick = () => {
                const sel = document.getElementById('viewer3d-structure-select')?.value;
                const project = this._currentProject();
                if (!sel || !project) return;
                const coords = this.coordsCache.get(sel);
                if (!coords) return;
                let count = 0;
                let preparedSet = this.preparedItems.get(sel);
                if (!preparedSet) { preparedSet = new Set(); this.preparedItems.set(sel, preparedSet); }
                coords.forEach(c => {
                    if (c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY && c.z >= minZ && c.z <= maxZ) {
                        if (!preparedSet.has(c.blockId)) { preparedSet.add(c.blockId); count++; }
                    }
                });
                this._savePrepared();
                this._renderBlockList();
                this._rangeStart = null;
                this.viewer3d?.clearRangeIndicator();
                popup.remove();
                this._toast(`✅ 範囲内のブロックを「準備済み」にしました`);
            };
            document.getElementById('v3d-range-cancel').onclick = () => {
                this._rangeStart = null;
                this.viewer3d?.clearRangeIndicator();
                popup.remove();
            };
            const close = (e) => {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('pointerdown', close);
                }
            };
            setTimeout(() => document.addEventListener('pointerdown', close), 10);
        }
    }

    /** Undo 履歴に1件追加。MAX_UNDO を超えたら古い方から捨てる。 */
    _pushHistory(entry) {
        const MAX_UNDO = 50;
        this._editHistory.push(entry);
        if (this._editHistory.length > MAX_UNDO) {
            this._editHistory.splice(0, this._editHistory.length - MAX_UNDO);
        }
    }

    _undoLastAction() {
        if (this._editHistory.length === 0) { this._toast('履歴がありません', 'info'); return; }
        const last = this._editHistory.pop();
        const project = this._currentProject();
        switch (last.type) {
            case 'delete': {
                last.positions.forEach(p => this._deletedPositions.delete(p));
                this._applySlice();
                this._toast(`↺ ${last.positions.length}ブロックの削除を取り消しました`);
                break;
            }
            case 'offset': {
                const s = project?.structures.find(st => st.id === last.structureId);
                if (s) {
                    s.offset = { ...last.prevOffset };
                    ProjectManager.save(this.projects);
                    this._renderV3dOffsetPanel(project);
                    this._scheduleViewer3DRefresh();
                    this._toast(`↺ ${s.name} の位置を戻しました`);
                }
                break;
            }
            case 'rotation': {
                const s = project?.structures.find(st => st.id === last.structureId);
                if (s) {
                    s.rotation = last.prevRotation;
                    ProjectManager.save(this.projects);
                    this._renderV3dOffsetPanel(project);
                    this._scheduleViewer3DRefresh();
                    this._toast(`↺ ${s.name} の回転を戻しました`);
                }
                break;
            }
            case 'multi-offset': {
                if (project && Array.isArray(last.entries)) {
                    for (const e of last.entries) {
                        const s = project.structures.find(st => st.id === e.structureId);
                        if (!s) continue;
                        if (e.prevOffset)   s.offset   = { ...e.prevOffset };
                        if (e.prevRotation !== undefined) s.rotation = e.prevRotation;
                    }
                    ProjectManager.save(this.projects);
                    this._renderV3dOffsetPanel(project);
                    this._scheduleViewer3DRefresh();
                    this._toast(`↺ ${last.entries.length}個の構造配置を戻しました`);
                }
                break;
            }
            default:
                this._toast('対応していない履歴タイプ: ' + last.type, 'info');
        }
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
        if (sel.value === '__ALL__') {
            this._viewer3dMode = 'all';
            this._switchV3dSubtab('advanced');
            return this._load3DViewAll(project, container);
        }
        this._viewer3dMode = 'single';
        const structure = project.structures.find(s => s.id === sel.value);
        if (!structure) return;
        let coords = this.coordsCache.get(sel.value);
        if (!coords || coords.length === 0) {
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
        if (btn) { btn.disabled = true; btn.textContent = '読み込み中...'; }
        try {
            // container が DOM から外れていたら強制再生成 (タブ切替で detach されたケース対応)
            const containerDetached = this.viewer3d?.container && !document.body.contains(this.viewer3d.container);
            if (!this.viewer3d || this.viewer3d.container !== container || containerDetached) {
                if (this.viewer3d) this.viewer3d.destroy();
                this.viewer3d = new Viewer3D(container);
                this.viewer3d.onBlockClick = (info) => this._onViewer3DClick(info);
                this.viewer3d.onBlockRightClick = (info) => this._onViewer3DRangeClick(info);
                this._attachAltDragCallbacks();
            }
            await this.viewer3d.init();
            const undoBtn = document.getElementById('btn-v3d-undo');
            if (undoBtn) undoBtn.onclick = () => this._undoLastAction();
            const floorType = document.getElementById('floor-type-select')?.value || 'grass';
            this.viewer3d.setFloorType(floorType);
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
            this.viewer3d._matCache?.clear();
            const { yMin, yMax, xMin, xMax, zMin, zMax } = this._getSliceValues();
            const filteredCoords = this._deletedPositions.size > 0
                ? replacedCoords.filter(c => !this._deletedPositions.has(`${c.x},${c.y},${c.z}`))
                : replacedCoords;
            this.viewer3d.loadStructure(filteredCoords, structure.size, { yMin, yMax, xMin, xMax, zMin, zMax, colorMode });
            this._updateTextureStatusUI();
            this._renderV3dOffsetPanel(project, [structure]);
            const infoEl = document.getElementById('viewer3d-info');
            if (infoEl) {
                infoEl.innerHTML = `<p class="info-text">✅ ${coords.length.toLocaleString()}ブロック表示中 | ドラッグ:回転 / 右ドラッグ:パン / スクロール:ズーム</p>`;
            }
        } catch (err) {
            console.error('_load3DView failed:', err);
            this._toast('3D表示に失敗しました: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🧊 3D表示を開始'; }
        }
    }

    /**
     * 全構造を一度に表示（位置調整プレビュー用）。
     * 各構造の (offset, coords) を合成 AABB に正規化して flat 配列を作り、
     * 既存 viewer3d.loadStructure に渡す（パイプライン側は単一構造扱い）。
     */
    async _load3DViewAll(project, container) {
        const btn = document.getElementById('btn-load-3d');
        if (btn) { btn.disabled = true; btn.textContent = '読み込み中...'; }
        try {
            // 1. 全構造の coords を保証
            for (const s of project.structures) {
                if (!this.coordsCache.has(s.id)) {
                    await this._ensureCoordsForStructure(s.id);
                }
            }

            // 2. 合体 AABB を計算（各構造の offset と size から）
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            const usableStructures = [];
            for (const s of project.structures) {
                if (!this.coordsCache.has(s.id)) continue;
                if (!s.size) continue;
                const off = ProjectManager.getOffset(s);
                const rot = ProjectManager.getRotation(s);
                const rs  = ProjectManager.rotatedSize(s.size, rot);
                minX = Math.min(minX, off.x);
                minY = Math.min(minY, off.y);
                minZ = Math.min(minZ, off.z);
                maxX = Math.max(maxX, off.x + rs.x - 1);
                maxY = Math.max(maxY, off.y + rs.y - 1);
                maxZ = Math.max(maxZ, off.z + rs.z - 1);
                usableStructures.push(s);
            }
            if (usableStructures.length === 0) {
                this._toast('表示できる構造がありません', 'error');
                return;
            }
            // ★ 表示原点を初回のみ確定（ドラッグでの再正規化を防ぐ）
            if (!this._allModeOrigin || this._allModeOriginProjectId !== project.id) {
                this._allModeOrigin = { x: minX, y: minY, z: minZ };
                this._allModeOriginProjectId = project.id;
            }
            const origin = this._allModeOrigin;
            const mergedSize = {
                x: Math.max(maxX - origin.x + 1, 1),
                y: Math.max(maxY - origin.y + 1, 1),
                z: Math.max(maxZ - origin.z + 1, 1),
            };

            // 3. 全構造の coords を offset + 回転 反映してフラット化（state も回転）
            const combined = [];
            for (const s of usableStructures) {
                const off = ProjectManager.getOffset(s);
                const rot = ProjectManager.getRotation(s);
                const dx = off.x - origin.x, dy = off.y - origin.y, dz = off.z - origin.z;
                const raw = this.coordsCache.get(s.id) || [];
                const replaced = this._applyReplacements(s.id, raw);
                for (const c of replaced) {
                    const { rx, rz } = ProjectManager.applyRotation(c.x, c.z, s.size, rot);
                    const rStates = rot === 0
                        ? c.states
                        : ProjectManager.rotateBlockStates(c.states, rot, c.blockId);
                    combined.push({
                        x: rx + dx, y: c.y + dy, z: rz + dz,
                        blockId: c.blockId, states: rStates, rawId: c.rawId,
                        structureId: s.id,
                    });
                }
            }

            // 3b. 構造ごとの表示AABB（ハイライト用）
            this._structureBounds = new Map();
            for (const c of combined) {
                if (!c.structureId) continue;
                let b = this._structureBounds.get(c.structureId);
                if (!b) { b = { minX: c.x, minY: c.y, minZ: c.z, maxX: c.x, maxY: c.y, maxZ: c.z }; this._structureBounds.set(c.structureId, b); }
                if (c.x < b.minX) b.minX = c.x; if (c.x > b.maxX) b.maxX = c.x;
                if (c.y < b.minY) b.minY = c.y; if (c.y > b.maxY) b.maxY = c.y;
                if (c.z < b.minZ) b.minZ = c.z; if (c.z > b.maxZ) b.maxZ = c.z;
            }

            // 4. viewer3d を初期化（既存と同じ手順）
            const containerDetached = this.viewer3d?.container && !document.body.contains(this.viewer3d.container);
            if (!this.viewer3d || this.viewer3d.container !== container || containerDetached) {
                if (this.viewer3d) this.viewer3d.destroy();
                this.viewer3d = new Viewer3D(container);
                this.viewer3d.onBlockClick = (info) => this._onViewer3DClick(info);
                this.viewer3d.onBlockRightClick = (info) => this._onViewer3DRangeClick(info);
                this._attachAltDragCallbacks();
            }
            await this.viewer3d.init();
            const undoBtn = document.getElementById('btn-v3d-undo');
            if (undoBtn) undoBtn.onclick = () => this._undoLastAction();
            const floorType = document.getElementById('floor-type-select')?.value || 'grass';
            this.viewer3d.setFloorType(floorType);

            // 5. スライダーを合成サイズ基準に
            const setSlider = (id, valId, max, val) => {
                const el = document.getElementById(id);
                const vl = document.getElementById(valId);
                if (el) { el.max = max; el.value = val; }
                if (vl) vl.textContent = val;
            };
            setSlider('layer-min',  'layer-min-val',  mergedSize.y - 1, 0);
            setSlider('layer-max',  'layer-max-val',  mergedSize.y - 1, mergedSize.y - 1);
            setSlider('layer-xmin', 'layer-xmin-val', mergedSize.x - 1, 0);
            setSlider('layer-xmax', 'layer-xmax-val', mergedSize.x - 1, mergedSize.x - 1);
            setSlider('layer-zmin', 'layer-zmin-val', mergedSize.z - 1, 0);
            setSlider('layer-zmax', 'layer-zmax-val', mergedSize.z - 1, mergedSize.z - 1);

            const cmRadio = document.querySelector('input[name="viewer3d-colormode"]:checked');
            const colorMode = cmRadio ? cmRadio.value : 'material';
            this.viewer3d._matCache?.clear();
            const { yMin, yMax, xMin, xMax, zMin, zMax } = this._getSliceValues();
            const filtered = this._deletedPositions.size > 0
                ? combined.filter(c => !this._deletedPositions.has(`${c.x},${c.y},${c.z}`))
                : combined;
            // 初回 __ALL__ ロード時のみ autoFocus。以降のオフセット/回転変更ではカメラを保持。
            const isFirstAllRender = !this._viewer3dAllAutofocused;
            this._viewer3dAllAutofocused = true;
            this.viewer3d.loadStructure(filtered, mergedSize, {
                yMin, yMax, xMin, xMax, zMin, zMax, colorMode,
                autoFocus: isFirstAllRender,
            });
            this._updateTextureStatusUI();
            this._renderV3dOffsetPanel(project);
            const infoEl = document.getElementById('viewer3d-info');
            if (infoEl) {
                infoEl.innerHTML = `<p class="info-text">✅ 全構造表示中（${usableStructures.length}個・${combined.length.toLocaleString()}ブロック）</p>`;
            }
            // ★ ドラッグ継続中なら新 bounds でハイライトを復元
            if (this._altDragStructureId && this._structureBounds) {
                const hb = this._structureBounds.get(this._altDragStructureId);
                const hs = project.structures.find(st => st.id === this._altDragStructureId);
                if (hb && hs) this.viewer3d.setStructureHighlight(hb, hs.name);
            }
        } catch (err) {
            console.error('_load3DViewAll failed:', err);
            this._toast('全構造表示に失敗しました: ' + err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🧊 3D表示を開始'; }
        }
    }

    /**
     * viewer3d に Alt+ドラッグ（建造物移動）コールバックを設定する。
     * __ALL__ モード時のみ有効（structureId が coord に含まれる場合のみ動作）。
     */
    _attachAltDragCallbacks() {
        if (!this.viewer3d) return;

        // ドラッグ開始: どの建造物か特定してハイライト（ラベル付き）+ 開始時 offset をスナップショット
        this.viewer3d.onAltDragStart = ({ coord, axis }) => {
            this._altDragStructureId = coord?.structureId ?? null;
            this._altDragAccum = 0;
            this._altDragMoved = false;
            // Undo 用に開始時オフセットを保存
            if (this._altDragStructureId) {
                const project = this._currentProject();
                const s = project?.structures.find(st => st.id === this._altDragStructureId);
                if (s) this._altDragOffsetSnapshot = { ...ProjectManager.getOffset(s) };
            }
            this.viewer3d.clearStructureHighlight();
            if (this._altDragStructureId && this._structureBounds) {
                const bounds = this._structureBounds.get(this._altDragStructureId);
                if (bounds) {
                    const project = this._currentProject();
                    const s = project?.structures.find(st => st.id === this._altDragStructureId);
                    this.viewer3d.setStructureHighlight(bounds, s?.name || '');
                }
            }
        };

        // ドラッグ終了: ハイライト解除 + 移動があれば Undo 履歴へ push
        this.viewer3d.onAltDragEnd = () => {
            this.viewer3d.clearStructureHighlight();
            if (this._altDragMoved && this._altDragStructureId && this._altDragOffsetSnapshot) {
                this._pushHistory({
                    type: 'offset',
                    structureId: this._altDragStructureId,
                    prevOffset: this._altDragOffsetSnapshot,
                });
            }
            this._altDragStructureId = null;
            this._altDragOffsetSnapshot = null;
            this._altDragMoved = false;
        };

        // ドラッグ中: ピクセル累積 → ブロック単位で offset を更新 + ハイライト追従
        this.viewer3d.onAltDragMove = ({ axis, dx }) => {
            if (!this._altDragStructureId) return;
            this._altDragAccum = (this._altDragAccum || 0) + dx;
            // 距離に比例したスケール（ズームアウト時は大きく動く）
            const radius = this.viewer3d?.spherical?.radius || 50;
            const pixelsPerBlock = Math.max(4, radius * 0.12);
            const blocks = Math.trunc(this._altDragAccum / pixelsPerBlock);
            if (blocks === 0) return;
            this._altDragAccum -= blocks * pixelsPerBlock;

            const project = this._currentProject();
            if (!project) return;
            const s = project.structures.find(st => st.id === this._altDragStructureId);
            if (!s) return;
            const off = ProjectManager.getOffset(s);
            s.offset = { ...off, [axis]: off[axis] + blocks };
            this._altDragMoved = true;
            ProjectManager.save(this.projects);
            // offset パネルの数値も即時更新
            const inp = document.querySelector(`.v3dp-inp[data-sid="${s.id}"][data-axis="${axis}"]`);
            if (inp) inp.value = s.offset[axis];
            // ★ ハイライト枠+ラベルをそのまま追従（再描画前でも動く）
            this.viewer3d.translateStructureHighlight(axis, blocks);
            this._scheduleViewer3DRefresh();
        };
    }

    /**
     * 全構造を X 軸方向に順番に並べる。
     * - 1番目の構造の offset を基準（y, z は固定）
     * - 2番目以降は前の構造の右端 + 1 ブロック隙間に配置
     * - 回転後サイズを考慮（rotatedSize.x）
     */
    _arrangeAllInX() {
        const project = this._currentProject();
        if (!project || project.structures.length === 0) return;
        const arr = project.structures;
        if (arr.length < 2) {
            this._toast('構造が2つ以上必要です');
            return;
        }

        // Undo 用: 変更前の全構造 offset をスナップショット
        const snapshot = arr.map(s => ({ structureId: s.id, prevOffset: { ...ProjectManager.getOffset(s) } }));

        const base = ProjectManager.getOffset(arr[0]);
        const baseY = base.y, baseZ = base.z;
        let cursor = base.x + ProjectManager.rotatedSize(arr[0].size, ProjectManager.getRotation(arr[0])).x;

        for (let i = 1; i < arr.length; i++) {
            const s = arr[i];
            s.offset = { x: cursor + 1, y: baseY, z: baseZ };
            const rs = ProjectManager.rotatedSize(s.size, ProjectManager.getRotation(s));
            cursor = s.offset.x + rs.x;
        }

        this._pushHistory({ type: 'multi-offset', entries: snapshot });
        ProjectManager.save(this.projects);
        // 表示座標が大きく変わるので原点もリセット → 再フィット
        this._allModeOrigin = null;
        this._viewer3dAllAutofocused = false;
        this._renderV3dOffsetPanel(project);
        this._scheduleViewer3DRefresh();
        this._toast(`✨ ${arr.length} 個の構造を X 軸に整列しました`);
    }

    /** __ALL__ モード用: 右パネルに各構造のオフセット調整UIを描画 */
    _renderV3dOffsetPanel(project, structuresToShow = null) {
        const panel = document.getElementById('v3d-offset-panel');
        if (!panel) return;
        panel.innerHTML = '';
        panel.classList.remove('hidden');

        const isAllMode = structuresToShow === null;
        const structures = isAllMode ? project.structures : structuresToShow;

        const header = document.createElement('div');
        header.className = 'v3dp-header';
        if (isAllMode) {
            header.innerHTML = `
                <span>📐 位置調整</span>
                <button id="btn-arrange-x" class="mc-btn secondary small" title="全構造を +X 方向に 1 ブロック隙間で順に並べる">
                    ✨ X軸に並べる
                </button>
            `;
        } else {
            header.innerHTML = `<span>📐 位置調整</span>`;
        }
        panel.appendChild(header);
        const arrangeBtn = header.querySelector('#btn-arrange-x');
        if (arrangeBtn) arrangeBtn.onclick = () => this._arrangeAllInX();

        for (const s of structures) {
            const off = ProjectManager.getOffset(s);
            const init = ProjectManager.getInitialOffset(s);
            const isInit = off.x === init.x && off.y === init.y && off.z === init.z;

            const rot = ProjectManager.getRotation(s);
            const rotLabels = ['0°', '90°', '180°', '270°'];

            const row = document.createElement('div');
            row.className = 'v3dp-row';
            row.dataset.sid = s.id;
            row.innerHTML = `
                <div class="v3dp-name" title="${this._escape(s.name)}">${this._escape(s.name)}</div>
                <div class="v3dp-axes">
                    ${['x','y','z'].map(ax => `
                    <span class="v3dp-axis">
                        <span class="v3dp-ax-label">${ax.toUpperCase()}</span>
                        <button class="sc-off-step icon-btn" data-axis="${ax}" data-delta="-1">−</button>
                        <input type="number" class="size-input v3dp-inp v3dp-inp-${ax}" data-axis="${ax}" data-sid="${s.id}" step="1" value="${off[ax]}">
                        <button class="sc-off-step icon-btn" data-axis="${ax}" data-delta="1">+</button>
                    </span>`).join('')}
                    <button class="sc-offset-reset icon-btn v3dp-reset" title="初期値に戻す" ${isInit ? 'disabled' : ''}>↺</button>
                </div>
                <div class="v3dp-rot-row">
                    <span class="v3dp-ax-label" style="margin-right:0.3rem">🔄 Y軸回転</span>
                    <button class="v3dp-rot-btn icon-btn" data-delta="-1" title="90° 反時計回り">↺</button>
                    <span class="v3dp-rot-val" style="min-width:2.8rem;text-align:center;font-size:0.72rem;color:var(--text)">${rotLabels[rot]}</span>
                    <button class="v3dp-rot-btn icon-btn" data-delta="1" title="90° 時計回り">↻</button>
                </div>
            `;
            panel.appendChild(row);

            // +/- ボタン
            row.querySelectorAll('.sc-off-step').forEach(btn => {
                btn.addEventListener('click', () => {
                    const axis = btn.dataset.axis;
                    const delta = parseInt(btn.dataset.delta, 10);
                    const inp = row.querySelector(`.v3dp-inp-${axis}`);
                    const newVal = (parseInt(inp.value, 10) || 0) + delta;
                    inp.value = newVal;
                    this._setStructureOffset(s.id, axis, newVal);
                    // リセットボタンの活性制御
                    const o = ProjectManager.getOffset(s);
                    const i2 = ProjectManager.getInitialOffset(s);
                    const resetBtn = row.querySelector('.v3dp-reset');
                    if (resetBtn) resetBtn.disabled = (o.x===i2.x && o.y===i2.y && o.z===i2.z);
                });
            });
            // 手入力
            row.querySelectorAll('.v3dp-inp').forEach(inp => {
                inp.addEventListener('change', () => {
                    this._setStructureOffset(s.id, inp.dataset.axis, parseInt(inp.value, 10) || 0);
                    const o = ProjectManager.getOffset(s);
                    const i2 = ProjectManager.getInitialOffset(s);
                    const resetBtn = row.querySelector('.v3dp-reset');
                    if (resetBtn) resetBtn.disabled = (o.x===i2.x && o.y===i2.y && o.z===i2.z);
                });
            });
            // リセット
            row.querySelector('.v3dp-reset').onclick = () => {
                this._resetStructureOffset(s.id);
                const i2 = ProjectManager.getInitialOffset(s);
                row.querySelector('.v3dp-inp-x').value = i2.x;
                row.querySelector('.v3dp-inp-y').value = i2.y;
                row.querySelector('.v3dp-inp-z').value = i2.z;
                row.querySelector('.v3dp-reset').disabled = true;
            };
            // 回転ボタン
            const rotLabels2 = ['0°', '90°', '180°', '270°'];
            row.querySelectorAll('.v3dp-rot-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const delta = parseInt(btn.dataset.delta, 10);
                    const cur = ProjectManager.getRotation(s);
                    this._pushHistory({ type: 'rotation', structureId: s.id, prevRotation: cur });
                    s.rotation = ((cur + delta) % 4 + 4) % 4;
                    ProjectManager.save(this.projects);
                    row.querySelector('.v3dp-rot-val').textContent = rotLabels2[s.rotation];
                    this._scheduleViewer3DRefresh();
                });
            });
        }
    }

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
}

// ── UIMixin を App に適用 ──────────────────────────────────────────────────────
Object.assign(App.prototype, UIMixin);

// ── Boot ─────────────────────────────────────────────────────────────────────
new App();
