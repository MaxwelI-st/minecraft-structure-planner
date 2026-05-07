const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

const missingMethods = `
    _initViewer3DTab() {
        if (!this.viewer3d) {
            const canvas = document.getElementById('viewer3d-canvas');
            this.viewer3d = new Viewer3D(canvas);
            this._setup3DViewTab();
        }
        const project = this._currentProject();
        if (project) this._updateViewer3DSelect(project);
    }

    _setup3DViewTab() {
        const $ = id => document.getElementById(id);
        $('btn-viewer3d-start').onclick = () => this._start3DRender();
        $('btn-export-mcstructure').onclick = () => this._exportMcStructure();

        // ─── ブロック置換 ────────────────────────────────
        $('btn-replace-add').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            const from = $('replace-from').value;
            const to = $('replace-to').value;
            if (!from || !to) return;
            if (!this.replacements.has(sel)) this.replacements.set(sel, new Map());
            this.replacements.get(sel).set(from, to);
            ProjectManager.saveReplacements(this.replacements);
            this._renderReplaceList(sel);
            this._renderMaterialsTab();
            this._toast('🔄 置換を追加しました');
        };
        $('btn-replace-reset').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            if (confirm('この構造の置換をリセットしますか？')) {
                this.replacements.delete(sel);
                ProjectManager.saveReplacements(this.replacements);
                this._renderReplaceList(sel);
                this._renderMaterialsTab();
            }
        };

        $('viewer3d-structure-select').onchange = (e) => {
            this._renderReplaceList(e.target.value);
            this._populateReplaceFrom();
        };

        // コストダウン一括置換
        $('btn-apply-preset').onclick = () => {
            const sel = $('viewer3d-structure-select').value;
            if (!sel) return;
            const preset = $('replace-preset-select').value;
            if (!preset) return;
            const map = this._getPresetMap(preset);
            if (!map) return;
            
            if (!this.replacements.has(sel)) this.replacements.set(sel, new Map());
            const currentMap = this.replacements.get(sel);
            for (const [f, t] of Object.entries(map)) {
                currentMap.set(f, t);
            }
            ProjectManager.saveReplacements(this.replacements);
            this._renderReplaceList(sel);
            this._renderMaterialsTab();
            this._toast('✅ プリセットを適用しました');
        };
    }

    _updateViewer3DSelect(project) {
        const sel = document.getElementById('viewer3d-structure-select');
        if (!sel) return;
        const val = sel.value;
        sel.innerHTML = '<option value="">表示する構造を選択...</option>';
        project.structures.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            sel.appendChild(opt);
        });
        if (val) sel.value = val;
    }

    /** 置換元 select に現構造のユニークブロックを、置換先には DOT_PALETTE を埋める */
    async _populateReplaceFrom() {
        const $ = id => document.getElementById(id);
        const structureId = $('viewer3d-structure-select').value;
        const project = this._currentProject();
        const fromSel = $('replace-from');
        const toSel = $('replace-to');
        if (!project || !structureId || !fromSel) return;

        const structure = project.structures.find(s => s.id === structureId);
        if (!structure) return;

        fromSel.innerHTML = '<option value="">現在の構造から選択...</option>';
        for (const r of (structure.results || [])) {
            const opt = document.createElement('option');
            opt.value = r.id;
            const ja = this.langData[r.id] || r.id.replace('minecraft:', '');
            opt.textContent = ja + ' (' + r.count + ')';
            fromSel.appendChild(opt);
        }

        // 置換先 (DOT_PALETTE を利用)
        if (toSel && toSel.options.length <= 1) {
            toSel.innerHTML = '<option value="">選択してください...</option>';
            const { DOT_PALETTE } = await import('./dotart.js');
            DOT_PALETTE.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                toSel.appendChild(opt);
            });
        }
    }

    _renderReplaceList(structureId) {
        const container = document.getElementById('replace-list');
        if (!container) return;
        container.innerHTML = '';
        const map = this.replacements.get(structureId);
        if (!map || map.size === 0) {
            container.innerHTML = '<p style="font-size:0.7rem;color:var(--muted2);margin:0.5rem 0">(置換なし)</p>';
            return;
        }
        for (const [from, to] of map.entries()) {
            const row = document.createElement('div');
            row.className = 'replace-item';
            row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.2rem 0;font-size:0.75rem';
            const fromJa = this.langData[from] || from.replace('minecraft:', '');
            const toJa = this.langData[to] || to.replace('minecraft:', '');
            row.innerHTML = \`
                <span>\${fromJa} → \${toJa}</span>
                <button class="icon-btn" style="color:var(--danger);padding:0 0.4rem">✕</button>
            \`;
            row.querySelector('button').onclick = () => {
                map.delete(from);
                ProjectManager.saveReplacements(this.replacements);
                this._renderReplaceList(structureId);
                this._renderMaterialsTab();
            };
            container.appendChild(row);
        }
    }

    _getPresetMap(id) {
        const maps = {
            'cobble': {
                'minecraft:stone': 'minecraft:cobblestone',
                'minecraft:stone_bricks': 'minecraft:cobblestone',
                'minecraft:mossy_stone_bricks': 'minecraft:cobblestone',
                'minecraft:polished_andesite': 'minecraft:cobblestone',
                'minecraft:andesite': 'minecraft:cobblestone',
                'minecraft:deepslate_bricks': 'minecraft:cobbled_deepslate',
                'minecraft:polished_deepslate': 'minecraft:cobbled_deepslate'
            },
            'dirt': {
                'minecraft:grass_block': 'minecraft:dirt',
                'minecraft:podzol': 'minecraft:dirt',
                'minecraft:mycelium': 'minecraft:dirt',
                'minecraft:rooted_dirt': 'minecraft:dirt'
            },
            'glass': {
                'minecraft:white_stained_glass': 'minecraft:glass',
                'minecraft:light_gray_stained_glass': 'minecraft:glass',
                'minecraft:gray_stained_glass': 'minecraft:glass',
                'minecraft:black_stained_glass': 'minecraft:glass'
            }
        };
        return maps[id];
    }

    async _start3DRender() {
        const sel = document.getElementById('viewer3d-structure-select').value;
        if (!sel) { this._toast('構造を選択してください', 'error'); return; }
        const coords = this.coordsCache.get(sel);
        if (!coords) {
            this._toast('3Dデータがありません。ファイルを再読込してください', 'error');
            return;
        }
        try {
            this._showLoading('3Dモデルを構築中...');
            // 置換マップ取得
            const repMap = this.replacements.get(sel);
            await this.viewer3d.renderStructure(coords, repMap);
            this.viewer3d.isInitialized = true;
            this._hideLoading();
        } catch (e) {
            console.error(e);
            this._hideLoading();
            this._toast('❌ 描画エラー: ' + e.message, 'error');
        }
    }

`;

// Insert before _renderMaterialsTab
const marker = '_renderMaterialsTab() {';
if (content.includes(marker)) {
    content = content.replace(marker, missingMethods + marker);
    console.log('Restored missing methods.');
} else {
    console.log('Could not find marker for insertion.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
