// 置換ピッカーのクリックイベントを追加するスクリプト
// btn-open-from-picker / btn-open-block-picker の機能を _setup3DViewTab 内に追加
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(file, 'utf8');

// 挿入位置: "// ─── ブロック置換 ────" の直前
const marker = '        // ─── ブロック置換 ────────────────────────────────';

if (!content.includes(marker)) {
    console.log('WARN: マーカーが見つかりません');
    // デバッグ: 近い文字列を探す
    const idx = content.indexOf('ブロック置換');
    if (idx !== -1) {
        console.log('近い文字列 at:', idx, JSON.stringify(content.substring(idx - 30, idx + 60)));
    }
    process.exit(1);
}

const pickerCode = `
        // ─── 置換元・置換先ピッカー ────────────────────────────
        // 「現在の構造から選択」ボタン → ドロップダウンで構造内のブロックを選択
        $('btn-open-from-picker').addEventListener('click', () => {
            this._openBlockDropdown('from');
        });
        // 「選択してください」ボタン → ドロップダウンで置換先ブロックを選択
        $('btn-open-block-picker').addEventListener('click', () => {
            this._openBlockDropdown('to');
        });

`;

content = content.replace(marker, pickerCode + marker);

// _openBlockDropdown メソッドを追加
// _populateReplaceFrom の後に追加する
const popMarker = '    _renderReplaceList(structureId) {';
if (!content.includes(popMarker)) {
    console.log('WARN: _renderReplaceList マーカーが見つかりません');
    process.exit(1);
}

const dropdownMethod = `    /**
     * 置換元 or 置換先のブロック選択ドロップダウンを開く
     * @param {'from'|'to'} mode
     */
    _openBlockDropdown(mode) {
        const $ = id => document.getElementById(id);
        // 既存のドロップダウンがあれば閉じる
        document.querySelectorAll('.block-dropdown-overlay').forEach(el => el.remove());

        const btn = mode === 'from' ? $('btn-open-from-picker') : $('btn-open-block-picker');
        const rect = btn.getBoundingClientRect();

        // ドロップダウンの候補リストを作成
        let candidates = [];
        if (mode === 'from') {
            // 置換元: 現在の構造に含まれるブロック
            const sel = $('viewer3d-structure-select')?.value;
            const project = this._currentProject();
            if (project && sel) {
                const structure = project.structures.find(s => s.id === sel);
                if (structure) {
                    candidates = (structure.results || []).map(r => ({
                        id: r.id,
                        label: (this.langData[r.id] || r.id.replace('minecraft:', '')) + \` (\${r.count})\`
                    }));
                }
            }
            if (candidates.length === 0) {
                this._toast('構造が選択されていないか、ブロックがありません', 'error');
                return;
            }
        } else {
            // 置換先: 代表的なブロック一覧
            const ids = [
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
            candidates = ids.map(id => ({
                id,
                label: this.langData[id] || id.replace('minecraft:', '')
            }));
        }

        // オーバーレイ（クリックで閉じる）
        const overlay = document.createElement('div');
        overlay.className = 'block-dropdown-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9998;';
        overlay.addEventListener('click', () => overlay.remove());

        // ドロップダウン本体
        const dropdown = document.createElement('div');
        dropdown.style.cssText = \`
            position:fixed;
            top:\${Math.min(rect.bottom + 4, window.innerHeight - 320)}px;
            left:\${rect.left}px;
            width:\${Math.max(rect.width, 260)}px;
            max-height:300px;
            overflow-y:auto;
            background:rgba(15,20,30,0.97);
            border:1px solid rgba(255,255,255,0.15);
            border-radius:8px;
            z-index:9999;
            box-shadow:0 8px 32px rgba(0,0,0,0.6);
            backdrop-filter:blur(12px);
        \`;

        // 検索入力
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '検索...';
        searchInput.style.cssText = \`
            width:100%;box-sizing:border-box;padding:0.5rem 0.75rem;
            background:rgba(0,0,0,0.4);border:none;border-bottom:1px solid rgba(255,255,255,0.1);
            color:#fff;font-size:0.8rem;outline:none;
        \`;
        dropdown.appendChild(searchInput);

        // 候補リスト
        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'overflow-y:auto;max-height:252px;';

        const renderItems = (filter) => {
            listContainer.innerHTML = '';
            const filtered = filter
                ? candidates.filter(c => c.label.toLowerCase().includes(filter) || c.id.toLowerCase().includes(filter))
                : candidates;
            for (const c of filtered) {
                const item = document.createElement('div');
                item.style.cssText = \`
                    padding:0.45rem 0.75rem;cursor:pointer;font-size:0.78rem;
                    color:rgba(255,255,255,0.85);transition:background 0.15s;
                    display:flex;align-items:center;gap:0.5rem;
                \`;
                item.addEventListener('mouseenter', () => { item.style.background = 'rgba(74,222,128,0.15)'; });
                item.addEventListener('mouseleave', () => { item.style.background = ''; });
                item.textContent = c.label;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 値をセット
                    const hidden = mode === 'from' ? $('replace-from') : $('replace-to');
                    const nameEl = mode === 'from' ? $('replace-from-name') : $('replace-to-name');
                    hidden.value = c.id;
                    nameEl.textContent = c.label;
                    // アイコンも更新
                    const iconEl = mode === 'from' ? $('replace-from-icon') : $('replace-to-icon');
                    if (iconEl) {
                        const iconUrl = ResourcePack.getBestIconUrl(c.id, {});
                        if (iconUrl) iconEl.src = iconUrl;
                    }
                    overlay.remove();
                });
                listContainer.appendChild(item);
            }
            if (filtered.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'padding:1rem;text-align:center;color:rgba(255,255,255,0.4);font-size:0.8rem;';
                empty.textContent = '該当なし';
                listContainer.appendChild(empty);
            }
        };

        searchInput.addEventListener('input', () => renderItems(searchInput.value.toLowerCase()));
        renderItems('');

        dropdown.appendChild(listContainer);
        overlay.appendChild(dropdown);
        document.body.appendChild(overlay);

        // フォーカス
        setTimeout(() => searchInput.focus(), 50);
    }

    `;

content = content.replace(popMarker, dropdownMethod + popMarker);

fs.writeFileSync(file, content, 'utf8');
console.log('OK: ピッカー機能を追加しました');
