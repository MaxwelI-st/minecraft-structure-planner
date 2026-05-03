/**
 * dotart.js - Canvas-based dot art / pixel art editor
 * Allows drawing with Minecraft blocks on a 2D grid
 */

export const DOT_PALETTE = [
    { id: 'minecraft:stone',           name: '石',         color: '#808080' },
    { id: 'minecraft:cobblestone',     name: '丸石',       color: '#8a8a8a' },
    { id: 'minecraft:oak_planks',      name: 'オーク板',   color: '#c8a060' },
    { id: 'minecraft:spruce_planks',   name: 'トウヒ板',   color: '#8a5e30' },
    { id: 'minecraft:dark_oak_planks', name: 'ダークオーク板', color: '#502010' },
    { id: 'minecraft:bricks',          name: 'レンガ',     color: '#a04030' },
    { id: 'minecraft:dirt',            name: '土',         color: '#8b6340' },
    { id: 'minecraft:grass_block',     name: '草ブロック', color: '#5a9e3a' },
    { id: 'minecraft:sand',            name: '砂',         color: '#e0d070' },
    { id: 'minecraft:gravel',          name: '砂利',       color: '#909090' },
    { id: 'minecraft:oak_log',         name: 'オーク丸太', color: '#8a6030' },
    { id: 'minecraft:glass',           name: 'ガラス',     color: '#b0d8f0' },
    { id: 'minecraft:white_wool',      name: '白ウール',   color: '#e8e8e8' },
    { id: 'minecraft:red_wool',        name: '赤ウール',   color: '#c03020' },
    { id: 'minecraft:blue_wool',       name: '青ウール',   color: '#3050c0' },
    { id: 'minecraft:yellow_wool',     name: '黄ウール',   color: '#e0d020' },
    { id: 'minecraft:green_wool',      name: '緑ウール',   color: '#406020' },
    { id: 'minecraft:black_wool',      name: '黒ウール',   color: '#202020' },
    { id: 'minecraft:white_concrete',  name: '白コンクリ', color: '#e0e0e0' },
    { id: 'minecraft:orange_concrete', name: '橙コンクリ', color: '#e06020' },
    { id: 'minecraft:cyan_concrete',   name: '水コンクリ', color: '#208090' },
    { id: 'minecraft:black_concrete',  name: '黒コンクリ', color: '#202020' },
    { id: 'minecraft:iron_block',      name: '鉄ブロック', color: '#d8d8d8' },
    { id: 'minecraft:gold_block',      name: '金ブロック', color: '#f0d020' },
    { id: 'minecraft:diamond_block',   name: 'ダイヤブロック', color: '#40e8e8' },
    { id: 'minecraft:obsidian',        name: '黒曜石',     color: '#200830' },
    { id: 'minecraft:glowstone',       name: 'グロウストーン', color: '#f0c840' },
    { id: 'minecraft:netherrack',      name: 'ネザーラック', color: '#803030' },
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
        this.onUpdate = options.onUpdate || null;

        this._setupEvents();
        this._resize();
        this.render();
    }

    _createGrid() {
        return Array.from({ length: this.gridH }, () => Array(this.gridW).fill(null));
    }

    _resize() {
        const totalW = this.gridW * this.cellSize;
        const totalH = this.gridH * this.cellSize;
        this.canvas.width = totalW;
        this.canvas.height = totalH;
        const reservedSidebar = (typeof window !== 'undefined' && window.innerWidth < 768) ? 40 : 340;
        this.canvas.style.width = Math.min(totalW, Math.max(160, window.innerWidth - reservedSidebar)) + 'px';
        this.canvas.style.height = 'auto';
    }

    resize(newW, newH) {
        const old = this.grid;
        this.gridW = newW;
        this.gridH = newH;
        this.grid = this._createGrid();
        // Copy old data
        for (let y = 0; y < Math.min(newH, old.length); y++) {
            for (let x = 0; x < Math.min(newW, (old[y] || []).length); x++) {
                this.grid[y][x] = old[y][x];
            }
        }
        this._resize();
        this.render();
    }

    setTool(tool) { this.tool = tool; }
    setBlock(blockId) { this.selectedBlock = blockId; }

    _getCellFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const cx = Math.floor(((e.clientX - rect.left) * scaleX) / this.cellSize);
        const cy = Math.floor(((e.clientY - rect.top) * scaleY) / this.cellSize);
        return { cx, cy };
    }

    _applyTool(cx, cy) {
        if (cx < 0 || cx >= this.gridW || cy < 0 || cy >= this.gridH) return;
        if (this.tool === 'pen') {
            this.grid[cy][cx] = this.selectedBlock;
        } else if (this.tool === 'eraser') {
            this.grid[cy][cx] = null;
        } else if (this.tool === 'fill') {
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
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const { cx, cy } = this._getCellFromEvent(e);
            this._applyTool(cx, cy);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const { cx, cy } = this._getCellFromEvent(e);
            this._applyTool(cx, cy);
        });
        this.canvas.addEventListener('mouseup', () => { this.isDrawing = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDrawing = false; });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const { cx, cy } = this._getCellFromEvent(e.touches[0]);
            this._applyTool(cx, cy);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDrawing) return;
            const { cx, cy } = this._getCellFromEvent(e.touches[0]);
            this._applyTool(cx, cy);
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDrawing = false; });
    }

    render() {
        const { ctx, gridW, gridH, cellSize } = this;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw cells
        for (let y = 0; y < gridH; y++) {
            for (let x = 0; x < gridW; x++) {
                const blockId = this.grid[y][x];
                const px = x * cellSize;
                const py = y * cellSize;

                if (blockId) {
                    const palette = DOT_PALETTE.find(p => p.id === blockId);
                    ctx.fillStyle = palette ? palette.color : '#888888';
                    ctx.fillRect(px, py, cellSize, cellSize);
                    // Pixel art shading
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.fillRect(px, py, cellSize, 1);
                    ctx.fillRect(px, py, 1, cellSize);
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.fillRect(px, py + cellSize - 1, cellSize, 1);
                    ctx.fillRect(px + cellSize - 1, py, 1, cellSize);
                } else {
                    // Checkerboard background
                    ctx.fillStyle = (x + y) % 2 === 0 ? '#1a2236' : '#141d2e';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }
            }
        }

        // Grid lines (faint)
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= gridW; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, gridH * cellSize);
            ctx.stroke();
        }
        for (let y = 0; y <= gridH; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(gridW * cellSize, y * cellSize);
            ctx.stroke();
        }
    }

    getMaterialCount() {
        const counts = new Map();
        for (const row of this.grid) {
            for (const cell of row) {
                if (cell) counts.set(cell, (counts.get(cell) || 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .map(([id, count]) => {
                const palette = DOT_PALETTE.find(p => p.id === id);
                const stacks = Math.floor(count / 64);
                const remainder = count % 64;
                return { id, name: palette?.name || id, color: palette?.color || '#888', count, stacks, remainder };
            })
            .sort((a, b) => b.count - a.count);
    }

    clear() {
        this.grid = this._createGrid();
        this.render();
        if (this.onUpdate) this.onUpdate([]);
    }

    exportAsDataURL() {
        return this.canvas.toDataURL('image/png');
    }
}
