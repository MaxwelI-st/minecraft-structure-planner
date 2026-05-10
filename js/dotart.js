/**
 * dotart.js - Canvas-based dot art / pixel art editor
 * Allows drawing with Minecraft blocks on a 2D grid
 */

export const DOT_PALETTE = [
    // --- 羊毛 ---
    { id: 'minecraft:white_wool',      name: '白の羊毛',   color: '#E4E4E4' },
    { id: 'minecraft:orange_wool',     name: '橙の羊毛',   color: '#EA7E35' },
    { id: 'minecraft:magenta_wool',    name: '赤紫の羊毛', color: '#BE49C9' },
    { id: 'minecraft:light_blue_wool', name: '空色の羊毛', color: '#6387D2' },
    { id: 'minecraft:yellow_wool',     name: '黄の羊毛',   color: '#C2B51C' },
    { id: 'minecraft:lime_wool',       name: '黄緑の羊毛', color: '#39BA2E' },
    { id: 'minecraft:pink_wool',       name: '桃の羊毛',   color: '#D98199' },
    { id: 'minecraft:gray_wool',       name: '灰の羊毛',   color: '#414141' },
    { id: 'minecraft:light_gray_wool', name: '薄灰の羊毛', color: '#A0A7A7' },
    { id: 'minecraft:cyan_wool',       name: '青緑の羊毛', color: '#267191' },
    { id: 'minecraft:purple_wool',     name: '紫の羊毛',   color: '#7E34BF' },
    { id: 'minecraft:blue_wool',       name: '青の羊毛',   color: '#253192' },
    { id: 'minecraft:brown_wool',      name: '茶の羊毛',   color: '#56331C' },
    { id: 'minecraft:green_wool',      name: '緑の羊毛',   color: '#364B18' },
    { id: 'minecraft:red_wool',        name: '赤の羊毛',   color: '#9E2B27' },
    { id: 'minecraft:black_wool',      name: '黒の羊毛',   color: '#181414' },
    
    // --- コンクリート ---
    { id: 'minecraft:white_concrete',  name: '白のコンクリ', color: '#CFD5D6' },
    { id: 'minecraft:orange_concrete', name: '橙のコンクリ', color: '#E06100' },
    { id: 'minecraft:magenta_concrete', name: '赤紫のコンクリ', color: '#A9309F' },
    { id: 'minecraft:light_blue_concrete', name: '空色のコンクリ', color: '#2389C6' },
    { id: 'minecraft:yellow_concrete', name: '黄のコンクリ', color: '#F0AF15' },
    { id: 'minecraft:lime_concrete',   name: '黄緑のコンクリ', color: '#5EA818' },
    { id: 'minecraft:pink_concrete',   name: '桃のコンクリ', color: '#D5658E' },
    { id: 'minecraft:gray_concrete',   name: '灰のコンクリ', color: '#373A3E' },
    { id: 'minecraft:light_gray_concrete', name: '薄灰のコンクリ', color: '#7D7D73' },
    { id: 'minecraft:cyan_concrete',   name: '青緑のコンクリ', color: '#157788' },
    { id: 'minecraft:purple_concrete', name: '紫のコンクリ', color: '#641F9C' },
    { id: 'minecraft:blue_concrete',   name: '青のコンクリ', color: '#2C2E8F' },
    { id: 'minecraft:brown_concrete',  name: '茶のコンクリ', color: '#603B1F' },
    { id: 'minecraft:green_concrete',  name: '緑のコンクリ', color: '#495B24' },
    { id: 'minecraft:red_concrete',    name: '赤のコンクリ', color: '#8E2020' },
    { id: 'minecraft:black_concrete',  name: '黒のコンクリ', color: '#080A0F' },

    // --- テラコッタ ---
    { id: 'minecraft:white_terracotta', name: '白のテラコッタ', color: '#D1B1A1' },
    { id: 'minecraft:orange_terracotta', name: '橙のテラコッタ', color: '#9F5224' },
    { id: 'minecraft:magenta_terracotta', name: '赤紫のテラコッタ', color: '#95576C' },
    { id: 'minecraft:light_blue_terracotta', name: '空色のテラコッタ', color: '#706C8A' },
    { id: 'minecraft:yellow_terracotta', name: '黄のテラコッタ', color: '#BA8524' },
    { id: 'minecraft:lime_terracotta', name: '黄緑のテラコッタ', color: '#677535' },
    { id: 'minecraft:pink_terracotta', name: '桃のテラコッタ', color: '#A04D4E' },
    { id: 'minecraft:gray_terracotta', name: '灰のテラコッタ', color: '#392923' },
    { id: 'minecraft:light_gray_terracotta', name: '薄灰のテラコッタ', color: '#876B62' },
    { id: 'minecraft:cyan_terracotta', name: '青緑のテラコッタ', color: '#575C5C' },
    { id: 'minecraft:purple_terracotta', name: '紫のテラコッタ', color: '#7A4958' },
    { id: 'minecraft:blue_terracotta', name: '青のテラコッタ', color: '#4C3E5C' },
    { id: 'minecraft:brown_terracotta', name: '茶のテラコッタ', color: '#4C3223' },
    { id: 'minecraft:green_terracotta', name: '緑のテラコッタ', color: '#4C522A' },
    { id: 'minecraft:red_terracotta', name: '赤のテラコッタ', color: '#8E3C2E' },
    { id: 'minecraft:black_terracotta', name: '黒のテラコッタ', color: '#251610' },
    { id: 'minecraft:terracotta',      name: 'テラコッタ',     color: '#9D5224' },

    // --- 板材・木材 (中間色/肌色に重要) ---
    { id: 'minecraft:oak_planks',      name: 'オークの板材',   color: '#A3844F' },
    { id: 'minecraft:spruce_planks',   name: 'マツの板材',     color: '#675332' },
    { id: 'minecraft:birch_planks',    name: '白樺の板材',     color: '#C6B573' },
    { id: 'minecraft:mushroom_stem',   name: 'キノコの柄',     color: '#D0AF94' },
    { id: 'minecraft:jungle_planks',   name: 'ジャングルの板材', color: '#A07551' },
    { id: 'minecraft:acacia_planks',   name: 'アカシアの板材', color: '#A75933' },
    { id: 'minecraft:dark_oak_planks', name: 'ダークオークの板材', color: '#422A12' },
    { id: 'minecraft:mangrove_planks', name: 'マングローブの板材', color: '#763631' },
    { id: 'minecraft:cherry_planks',   name: '桜の板材',       color: '#E3B2C1' },
    { id: 'minecraft:bamboo_planks',   name: '竹の板材',       color: '#C3B349' },
    { id: 'minecraft:crimson_planks',  name: '真紅の板材',     color: '#693145' },
    { id: 'minecraft:warped_planks',   name: '歪んだ板材',     color: '#2F615C' },

    // --- 自然・石系 (質感向上) ---
    { id: 'minecraft:sand',            name: '砂',           color: '#F7E9A3' },
    { id: 'minecraft:sandstone',       name: '砂岩',         color: '#D8CB91' },
    { id: 'minecraft:calcite',         name: '方解石',       color: '#D9D9D9' },
    { id: 'minecraft:clay',            name: '粘土',         color: '#A2A7B5' },
    { id: 'minecraft:grass_block',     name: '草ブロック',   color: '#7FB238' },
    { id: 'minecraft:dirt',            name: '土',           color: '#976D4D' },
    { id: 'minecraft:stone',           name: '石',           color: '#707070' },
    { id: 'minecraft:cobblestone',     name: '丸石',         color: '#7C7C7C' },
    { id: 'minecraft:deepslate',       name: '深層岩',       color: '#646464' },
    { id: 'minecraft:snow_block',      name: '雪ブロック',   color: '#FFFFFF' },
    { id: 'minecraft:moss_block',      name: '苔ブロック',   color: '#597D30' },
    { id: 'minecraft:obsidian',        name: '黒曜石',       color: '#14101C' },
    { id: 'minecraft:packed_ice',      name: '氷塊',         color: '#8EBFFF' },
    { id: 'minecraft:blue_ice',        name: '青い氷',       color: '#74A8FF' },
    { id: 'minecraft:iron_block',      name: '鉄ブロック',   color: '#EBEBEB' },
    { id: 'minecraft:gold_block',      name: '金ブロック',   color: '#FCEE4E' },
    { id: 'minecraft:diamond_block',   name: 'ダイヤブロック', color: '#5CDED5' },
    { id: 'minecraft:emerald_block',   name: 'エメラルドブロック', color: '#00D93A' },
    { id: 'minecraft:lapis_block',     name: 'ラピスラズリブロック', color: '#4A80FF' },
    { id: 'minecraft:netherite_block', name: 'ネザライトブロック', color: '#443A3B' },
];

export class DotArtEditor {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridW = options.gridW || 32;
        this.gridH = options.gridH || 32;
        this.cellSize = options.cellSize || 16;
        this.selectedBlock = DOT_PALETTE[0].id;
        this.tool = 'pen'; // pen | eraser | fill
        this.grid = this._createGrid();
        this.isDrawing = false;
        this.options = options;
        this.onUpdate = options.onUpdate || null;

        // ズーム・パン状態
        this.zoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.viewMode = true; // デフォルトを全体モードに変更
        this.history = [];
        this.historyIndex = -1;
        this._saveState();

        this._setupEvents();
        this._resize();
        this._loadIcons(); // アイコンのプリロード開始
        this.render();

        // ウィンドウリサイズ時にもスタイルを更新（全体モードのフィット維持）
        this._onWindowResize = () => this._updateCanvasStyle();
        window.addEventListener('resize', this._onWindowResize);
    }

    _loadIcons() {
        this.icons = {};
        DOT_PALETTE.forEach(p => {
            const providerUrl = this.options.getTexture ? this.options.getTexture(p.id) : null;
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => { this.icons[p.id] = img; this.render(); };
            if (providerUrl) {
                img.src = providerUrl;
            } else {
                const rawId = p.id.replace('minecraft:', '');
                const wikiName = rawId.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('_');
                img.src = `https://assets.mcasset.cloud/1.20.1/assets/minecraft/textures/block/${rawId}.png`;
                img.onerror = () => { if (img.src.includes('mcasset')) img.src = `https://minecraft.wiki/images/${wikiName}.png`; };
            }
        });
    }

    destroy() { window.removeEventListener('resize', this._onWindowResize); }

    setViewMode(isView) {
        this.viewMode = isView;
        if (isView) { this.zoom = 1.0; this.offsetX = 0; this.offsetY = 0; }
        this._updateCanvasStyle();
        this.render();
    }

    _updateCanvasStyle() {
        const totalW = this.gridW * this.cellSize;
        if (this.viewMode) {
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.maxWidth = '100%';
            this.canvas.style.maxHeight = '100%';
            this.canvas.style.objectFit = 'contain';
            this.canvas.style.cursor = 'default';
        } else {
            const reservedSidebar = (typeof window !== 'undefined' && window.innerWidth < 768) ? 40 : 340;
            this.canvas.style.maxWidth = 'none';
            this.canvas.style.maxHeight = 'none';
            this.canvas.style.objectFit = 'fill';
            this.canvas.style.width = Math.min(totalW, Math.max(160, window.innerWidth - reservedSidebar)) + 'px';
            this.canvas.style.height = 'auto';
            this.canvas.style.cursor = 'crosshair';
        }
    }

    _createGrid() { return Array.from({ length: this.gridH }, () => Array(this.gridW).fill(null)); }

    _resize() {
        this.canvas.width = this.gridW * this.cellSize;
        this.canvas.height = this.gridH * this.cellSize;
        this._updateCanvasStyle();
    }

    resize(newW, newH) {
        const old = this.grid;
        this.gridW = newW; this.gridH = newH;
        this.grid = this._createGrid();
        for (let y = 0; y < Math.min(newH, old.length); y++) {
            for (let x = 0; x < Math.min(newW, (old[y] || []).length); x++) {
                this.grid[y][x] = old[y][x];
            }
        }
        this._resize(); this._saveState(); this.render();
    }

    setData(grid) {
        if (!grid || !grid.length) return;
        this.grid = grid.map(row => [...row]);
        this.gridW = grid[0].length;
        this.gridH = grid.length;
        this.history = [];
        this.historyIndex = -1;
        this._resize();
        this._saveState(); // baseline
        this.render();
    }

    _saveState() {
        const snapshot = this.grid.map(row => [...row]);
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(snapshot);
        if (this.history.length > 50) this.history.shift(); else this.historyIndex++;
    }

    replaceBlock(oldId, newId) {
        if (!oldId || oldId === newId) return;
        let changed = false;
        for (let y = 0; y < this.gridH; y++) {
            for (let x = 0; x < this.gridW; x++) {
                if (this.grid[y][x] === oldId) { this.grid[y][x] = newId; changed = true; }
            }
        }
        if (changed) { this._saveState(); this.render(); if (this.onUpdate) this.onUpdate(this.getMaterialCount()); }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.grid = this.history[this.historyIndex].map(row => [...row]);
            this.render();
            if (this.onUpdate) this.onUpdate(this.getMaterialCount());
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.grid = this.history[this.historyIndex].map(row => [...row]);
            this.render();
            if (this.onUpdate) this.onUpdate(this.getMaterialCount());
        }
    }

    setTool(tool) { this.tool = tool; }
    setBlock(blockId) { this.selectedBlock = blockId; }

    _getCellFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const cssScaleX = this.canvas.width / rect.width;
        const cssScaleY = this.canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * cssScaleX;
        const my = (e.clientY - rect.top) * cssScaleY;
        const worldX = (mx - this.offsetX) / this.zoom;
        const worldY = (my - this.offsetY) / this.zoom;
        return { cx: Math.floor(worldX / this.cellSize), cy: Math.floor(worldY / this.cellSize) };
    }

    _applyTool(cx, cy) {
        if (cx < 0 || cx >= this.gridW || cy < 0 || cy >= this.gridH) return;
        if (this.tool === 'pen') this.grid[cy][cx] = this.selectedBlock;
        else if (this.tool === 'eraser') this.grid[cy][cx] = null;
        else if (this.tool === 'fill') {
            const target = this.grid[cy][cx];
            if (target === this.selectedBlock) return;
            this._floodFill(cx, cy, target, this.selectedBlock);
        }
        this.render();
        if (this.onUpdate) this.onUpdate(this.getMaterialCount());
    }

    _floodFill(sx, sy, target, replacement) {
        const stack = [[sx, sy]];
        const visited = new Set();
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            if (x < 0 || x >= this.gridW || y < 0 || y >= this.gridH) continue;
            const key = y * this.gridW + x;
            if (visited.has(key)) continue;
            if (this.grid[y][x] !== target) continue;
            visited.add(key);
            this.grid[y][x] = replacement;
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    _setupEvents() {
        // スペースキーの状態を管理
        this.isSpacePressed = false;
        window.addEventListener('keydown', (e) => { if (e.code === 'Space') this.isSpacePressed = true; });
        window.addEventListener('keyup', (e) => { if (e.code === 'Space') this.isSpacePressed = false; });

        this.canvas.addEventListener('mousedown', (e) => {
            // 中ボタン(1) または スペースキー押下中の左ボタン(0) でパン開始
            if (e.button === 1 || (e.button === 0 && this.isSpacePressed)) {
                this.isPanning = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                e.preventDefault();
                return;
            }

            const isReplaceTool = (this.tool === 'replace');
            if (this.viewMode && !isReplaceTool) return;
            if (e.button !== 0) return;

            // 履歴保存（描画開始前に保存）
            this._saveState();

            const { cx, cy } = this._getCellFromEvent(e);
            
            if (isReplaceTool) {
                const targetId = (cx >= 0 && cx < this.gridW && cy >= 0 && cy < this.gridH) ? this.grid[cy][cx] : null;
                if (targetId) {
                    this.canvas.dispatchEvent(new CustomEvent('dotart-request-replace', { detail: { oldId: targetId } }));
                }
                return;
            }

            this.isDrawing = true;
            this._applyTool(cx, cy);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                const rect = this.canvas.getBoundingClientRect();
                this.offsetX += dx * (this.canvas.width / rect.width);
                this.offsetY += dy * (this.canvas.height / rect.height);
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.render();
                return;
            }
            if (!this.isDrawing) return;
            const { cx, cy } = this._getCellFromEvent(e);
            this._applyTool(cx, cy);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 1 || e.button === 0) this.isPanning = false;
            if (this.isDrawing) this._saveState();
            this.isDrawing = false;
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.isPanning = false; if (this.isDrawing) this._saveState(); this.isDrawing = false;
        });
        this.canvas.addEventListener('wheel', (e) => {
            if (this.viewMode) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            const worldX = (mx - this.offsetX) / this.zoom;
            const worldY = (my - this.offsetY) / this.zoom;
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.1, Math.min(50, this.zoom * delta));
            this.offsetX = mx - worldX * this.zoom;
            this.offsetY = my - worldY * this.zoom;
            this.render();
        }, { passive: false });

        // Touch (basic)
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.viewMode) return;
            e.preventDefault(); this.isDrawing = true;
            const { cx, cy } = this._getCellFromEvent(e.touches[0]);
            this._applyTool(cx, cy);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); if (!this.isDrawing) return;
            const { cx, cy } = this._getCellFromEvent(e.touches[0]);
            this._applyTool(cx, cy);
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => {
            if (this.isDrawing) this._saveState(); this.isDrawing = false;
        });
    }

    _adjustColor(hex, factor) {
        const rgb = hex.replace('#','').match(/.{2}/g).map(x => parseInt(x, 16));
        const newRgb = rgb.map(v => Math.max(0, Math.min(255, Math.round(v * factor))));
        return '#' + newRgb.map(x => x.toString(16).padStart(2, '0')).join('');
    }

    render() {
        const { ctx, gridW, gridH, cellSize, icons } = this;
        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.zoom, this.zoom);

        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const blockId = this.grid[y][x];
                const px = x * cellSize;
                const py = y * cellSize;
                if (blockId) {
                    let baseId = blockId;
                    let shade = 1;
                    if (blockId.endsWith('_shade0')) { baseId = blockId.replace('_shade0', ''); shade = 0; }
                    else if (blockId.endsWith('_shade2')) { baseId = blockId.replace('_shade2', ''); shade = 2; }
                    const palette = DOT_PALETTE.find(p => p.id === baseId);
                    const icon = icons ? icons[baseId] : null;
                    if (icon && icon.complete && icon.naturalWidth !== 0) {
                        ctx.drawImage(icon, px, py, cellSize, cellSize);
                        if (shade === 0) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px, py, cellSize, cellSize); }
                        else if (shade === 2) { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(px, py, cellSize, cellSize); }
                    } else {
                        let color = palette ? palette.color : '#888888';
                        if (shade === 0) color = this._adjustColor(color, 0.82);
                        if (shade === 2) color = this._adjustColor(color, 1.16);
                        ctx.fillStyle = color; ctx.fillRect(px, py, cellSize, cellSize);
                    }
                    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px, py, cellSize, 1); ctx.fillRect(px, py, 1, cellSize);
                    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(px, py + cellSize - 1, cellSize, 1); ctx.fillRect(px + cellSize - 1, py, 1, cellSize);
                } else {
                    ctx.fillStyle = (x + y) % 2 === 0 ? '#1a2236' : '#141d2e';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }
            }
        }

        if (!this.viewMode) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 0.5 / this.zoom; // ズームしても線の太さを一定に保つ
            for (let x = 0; x <= gridW; x++) {
                ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, gridH * cellSize); ctx.stroke();
            }
            for (let y = 0; y <= gridH; y++) {
                ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(gridW * cellSize, y * cellSize); ctx.stroke();
            }
        }
        ctx.restore();
    }

    getMaterialCount() {
        const counts = new Map();
        for (const row of this.grid) {
            for (const cell of row) { if (cell) counts.set(cell, (counts.get(cell) || 0) + 1); }
        }
        return Array.from(counts.entries())
            .map(([id, count]) => {
                const palette = DOT_PALETTE.find(p => p.id === id);
                return { id, name: palette?.name || id, color: palette?.color || '#888', count, stacks: Math.floor(count/64), remainder: count%64 };
            })
            .sort((a, b) => b.count - a.count);
    }

    clear() { this.grid = this._createGrid(); this._saveState(); this.render(); if (this.onUpdate) this.onUpdate([]); }
    exportAsDataURL() { return this.canvas.toDataURL('image/png'); }
}
