/**
 * image2dot.js
 * ────────────────────────────────────────────────────────────────────────────
 * 画像 → Minecraft ブロック ドット絵 変換
 *
 * 入出力:
 *   - 入力: HTMLImageElement / Blob / File
 *   - 出力: 2次元配列 string[][] （DotArtEditor の grid と同じ形式）
 *
 * モード:
 *   - 'visual'  : 各ブロックの実テクスチャ平均色 or DOT_PALETTE 色で最近傍探索
 *   - 'mapcolor': MAP_COLORS の RGB（マップ表示色）で最近傍探索
 *
 * パレット制限:
 *   convert(image, { mode, gridW, gridH, paletteFilter }) で
 *   paletteFilter: { allow:[regex], deny:[regex], categories:Set<string> } を渡せる
 * ────────────────────────────────────────────────────────────────────────────
 */

import { DOT_PALETTE } from './dotart.js';
import { MAP_COLORS, MAP_TO_REPRESENTATIVE_BLOCK, virtualToRealBlockId } from './mapcolors.js';

/* ─── ブロックカテゴリ（パレット制限用） ─────────────────────────────── */
export const BLOCK_CATEGORIES = {
    wool:       /_wool$/,
    concrete:   /_concrete$|^minecraft:white_concrete$|^minecraft:.*_concrete$/,
    terracotta: /terracotta$/,
    glass:      /glass/,
    wood:       /_planks$|_log$|_wood$/,
    stone:      /stone|cobble|deepslate|andesite|granite|diorite|basalt|tuff/,
    nature:     /grass|dirt|sand|gravel|moss|leaves/,
    ore:        /diamond_block|emerald_block|gold_block|iron_block|netherite_block|raw_iron_block|raw_gold_block|raw_copper_block|copper_block|lapis_block/,
    rare:       /netherite|beacon|sponge|dragon_egg|nether_star/,
};

/* ─── ヘルパー: 画像→Image 要素 ──────────────────────────────────────── */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        if (typeof src === 'string') img.src = src;
        else if (src instanceof Blob) img.src = URL.createObjectURL(src);
        else reject(new Error('unsupported image source'));
    });
}

/* ─── HEX → RGB ──────────────────────────────────────────────────────── */
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

/* ─── パレット構築 ───────────────────────────────────────────────────── */

/**
 * パレットエントリ: { id, rgb: [r,g,b], name }
 * mode='visual'   : DOT_PALETTE の color を使う
 * mode='mapcolor' : MAP_COLORS の rgb を使う
 */
export function buildPalette(mode = 'visual', filter = null) {
    const out = [];
    if (mode === 'mapcolor') {
        // 不透明な map color id 全部 → 代表ブロック ID にマップ
        for (const [idStr, info] of Object.entries(MAP_COLORS)) {
            const id = Number(idStr);
            if (id === 0) continue;
            const realId = MAP_TO_REPRESENTATIVE_BLOCK[id] || 'mapcolor:' + info.name.toLowerCase();
            if (filter && !_passesFilter(realId, filter)) continue;
            out.push({ id: realId, rgb: info.rgb, name: info.name });
        }
    } else {
        for (const p of DOT_PALETTE) {
            const rgb = hexToRgb(p.color);
            if (!rgb) continue;
            if (filter && !_passesFilter(p.id, filter)) continue;
            out.push({ id: p.id, rgb, name: p.name });
        }
    }
    return out;
}

function _passesFilter(blockId, filter) {
    if (!filter) return true;
    const id = String(blockId).toLowerCase();
    if (filter.deny && filter.deny.length > 0) {
        for (const re of filter.deny) if (re.test(id)) return false;
    }
    if (filter.allow && filter.allow.length > 0) {
        for (const re of filter.allow) if (re.test(id)) return true;
        return false;
    }
    return true;
}

/* ─── 最近傍探索（CIE Lab + Delta E76 でも良いが、まずは速度重視で RGB） */
function _nearestRgb(target, palette) {
    let best = null;
    let bestD = Infinity;
    for (const p of palette) {
        const dr = p.rgb[0] - target[0];
        const dg = p.rgb[1] - target[1];
        const db = p.rgb[2] - target[2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = p; }
    }
    return best;
}

/* ─── ガンマ補正＆コントラスト ────────────────────────────────────────── */
function _applyGamma(rgb, gamma) {
    if (!gamma || gamma === 1) return rgb;
    return rgb.map(v => Math.pow(v / 255, 1 / gamma) * 255);
}

/* ─── メイン: 画像 → grid ───────────────────────────────────────────── */

/**
 * @param {HTMLImageElement} image
 * @param {Object} opts
 *   mode: 'visual' | 'mapcolor'
 *   gridW, gridH: 出力グリッドの幅高（cells）
 *   paletteFilter: { allow:[regex], deny:[regex] }
 *   transparent: 透明セルを残す（blockId=null）
 *   gamma: number ガンマ補正（既定 1）
 *   dithering: boolean Floyd-Steinberg dithering
 * @returns {{ grid: string[][], counts: Map<string,number>, palette: array }}
 */
export function convert(image, opts = {}) {
    const {
        mode = 'visual',
        gridW = 64,
        gridH = 64,
        paletteFilter = null,
        transparent = true,
        gamma = 1,
        dithering = false,
    } = opts;

    const palette = buildPalette(mode, paletteFilter);
    if (palette.length === 0) throw new Error('パレットが空です（フィルタを緩めてください）');

    // 1) Canvas に gridW×gridH で縮小描画
    const canvas = document.createElement('canvas');
    canvas.width = gridW;
    canvas.height = gridH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, gridW, gridH);
    const imgData = ctx.getImageData(0, 0, gridW, gridH);
    const data = imgData.data;

    // ピクセルバッファ（ダイザリング用に書き換え可）
    const pixels = new Float32Array(gridW * gridH * 3);
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const i = (y * gridW + x) * 4;
            const a = data[i + 3] / 255;
            // alpha低 (<0.5) → 透明扱い
            const idx3 = (y * gridW + x) * 3;
            pixels[idx3 + 0] = a < 0.5 ? -1 : data[i + 0];
            pixels[idx3 + 1] = a < 0.5 ? -1 : data[i + 1];
            pixels[idx3 + 2] = a < 0.5 ? -1 : data[i + 2];
        }
    }

    const grid = Array.from({ length: gridH }, () => new Array(gridW).fill(null));
    const counts = new Map();

    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const idx3 = (y * gridW + x) * 3;
            if (pixels[idx3] < 0) continue;  // 透明スキップ
            let rgb = [pixels[idx3], pixels[idx3 + 1], pixels[idx3 + 2]];
            if (gamma !== 1) rgb = _applyGamma(rgb, gamma);
            const nearest = _nearestRgb(rgb, palette);
            grid[y][x] = nearest.id;
            counts.set(nearest.id, (counts.get(nearest.id) || 0) + 1);

            // Floyd-Steinberg dithering（誤差拡散）
            if (dithering) {
                const errR = rgb[0] - nearest.rgb[0];
                const errG = rgb[1] - nearest.rgb[1];
                const errB = rgb[2] - nearest.rgb[2];
                const distribute = (dx, dy, w) => {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) return;
                    const ni = (ny * gridW + nx) * 3;
                    if (pixels[ni] < 0) return;
                    pixels[ni + 0] = Math.max(0, Math.min(255, pixels[ni + 0] + errR * w));
                    pixels[ni + 1] = Math.max(0, Math.min(255, pixels[ni + 1] + errG * w));
                    pixels[ni + 2] = Math.max(0, Math.min(255, pixels[ni + 2] + errB * w));
                };
                distribute(+1, 0, 7 / 16);
                distribute(-1, +1, 3 / 16);
                distribute( 0, +1, 5 / 16);
                distribute(+1, +1, 1 / 16);
            }
        }
    }

    return { grid, counts, palette };
}

/* ─── プリセットフィルタ（UI で使いやすいよう公開） ───────────────────── */
export const FILTER_PRESETS = {
    'all':         null,
    'wool_only':   { allow: [/_wool$/] },
    'concrete_only': { allow: [/_concrete$/] },
    'terracotta_only': { allow: [/terracotta$/] },
    'wool_concrete_terracotta': { allow: [/_wool$|_concrete$|terracotta$/] },
    'no_ore':      { deny: [/diamond_block|emerald_block|gold_block|iron_block|netherite|lapis_block|raw_iron|raw_gold|raw_copper|copper_block/] },
    'no_rare':     { deny: [/netherite|beacon|sponge|dragon_egg|nether_star|conduit/] },
    'survival_friendly': {
        deny: [/netherite|beacon|sponge|dragon_egg|nether_star|conduit|diamond_block|emerald_block|raw_iron|raw_gold/]
    },
    'building_blocks': {
        allow: [/_planks$|_log$|stone|brick|cobble|deepslate|sand|gravel|dirt$|grass_block$/]
    },
};

/* ─── Bedrock 地図仕様定数 ────────────────────────────────────────── */
export const MAP_BASE_SIZE = 128;

/** 最寄りの地図の角（128の倍数）にスナップ */
export function snapToMapGrid(x, z) {
    return {
        x: Math.floor(x / MAP_BASE_SIZE) * MAP_BASE_SIZE,
        z: Math.floor(z / MAP_BASE_SIZE) * MAP_BASE_SIZE
    };
}

/** 縁の色バグを避けるための +1 シフト */
export function shiftForEdgeExclusion(x, z) {
    return { x: x + 1, z: z + 1 };
}
