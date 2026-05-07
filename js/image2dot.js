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

/* ─── RGB → CIELAB 変換 ──────────────────────────────────────────────── */
// 参考: https://www.easyrgb.com/en/math.php
function rgbToLab(r, g, b) {
    // RGB -> XYZ
    let _r = r / 255, _g = g / 255, _b = b / 255;
    _r = (_r > 0.04045) ? Math.pow((_r + 0.055) / 1.055, 2.4) : _r / 12.92;
    _g = (_g > 0.04045) ? Math.pow((_g + 0.055) / 1.055, 2.4) : _g / 12.92;
    _b = (_b > 0.04045) ? Math.pow((_b + 0.055) / 1.055, 2.4) : _b / 12.92;

    _r *= 100; _g *= 100; _b *= 100;

    const x = _r * 0.4124 + _g * 0.3576 + _b * 0.1805;
    const y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722;
    const z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505;

    // XYZ -> LAB (Observer= 2°, Illuminant= D65)
    let _x = x / 95.047, _y = y / 100.0, _z = z / 108.883;

    _x = (_x > 0.008856) ? Math.pow(_x, 1 / 3) : (7.787 * _x) + (16 / 116);
    _y = (_y > 0.008856) ? Math.pow(_y, 1 / 3) : (7.787 * _y) + (16 / 116);
    _z = (_z > 0.008856) ? Math.pow(_z, 1 / 3) : (7.787 * _z) + (16 / 116);

    return [
        (116 * _y) - 16,        // L
        500 * (_x - _y),        // a
        200 * (_y - _z)         // b
    ];
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
        const SHADE_FACTORS = [180 / 255, 220 / 255, 255 / 255];
        for (const [idStr, info] of Object.entries(MAP_COLORS)) {
            const id = Number(idStr);
            if (id === 0) continue;
            const realId = MAP_TO_REPRESENTATIVE_BLOCK[id] || 'mapcolor:' + info.name.toLowerCase();
            if (filter && !_passesFilter(realId, filter)) continue;
            
            for (let shade = 0; shade < 3; shade++) {
                const f = SHADE_FACTORS[shade];
                const r = Math.round(info.rgb[0] * f);
                const g = Math.round(info.rgb[1] * f);
                const b = Math.round(info.rgb[2] * f);
                out.push({ 
                    id: realId + (shade === 1 ? '' : `_shade${shade}`), 
                    rgb: [r, g, b],
                    lab: rgbToLab(r, g, b),
                    name: info.name + (shade === 1 ? '' : ` (${shade === 0 ? '暗' : '明'})`),
                    shade 
                });
            }
        }
    } else {
        for (const p of DOT_PALETTE) {
            const rgb = hexToRgb(p.color);
            if (!rgb) continue;
            if (filter && !_passesFilter(p.id, filter)) continue;
            out.push({ 
                id: p.id, 
                rgb, 
                lab: rgbToLab(rgb[0], rgb[1], rgb[2]), 
                name: p.name 
            });
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

/* ─── 最近傍探索（CIELAB マンハッタン距離） ─── */
// minecraft-dot.pictures のロジックに倣い、人間の知覚に近い LAB 空間での差を計算
function _nearestLab(targetLab, palette) {
    let best = null;
    let bestD = Infinity;

    for (const p of palette) {
        // L1ノルム（マンハッタン距離）
        let d = Math.abs(targetLab[0] - p.lab[0]) + 
                Math.abs(targetLab[1] - p.lab[1]) + 
                Math.abs(targetLab[2] - p.lab[2]);

        // 彩度（Chroma）の差によるペナルティ
        // これにより、肌などの地味な色部分に鮮やかな「黄色羊毛」などが混ざるのを防ぐ
        const pChroma = Math.sqrt(p.lab[1] * p.lab[1] + p.lab[2] * p.lab[2]);
        const tChroma = Math.sqrt(targetLab[1] * targetLab[1] + targetLab[2] * targetLab[2]);
        const chromaDiff = Math.abs(pChroma - tChroma);
        d += chromaDiff * 1.5; // 彩度の差を重み付けして距離に加算

        // 滑らかなブロック（羊毛、コンクリート、テラコッタ）を強力に優先
        const isSmooth = /_wool|_concrete|terracotta/.test(p.id);
        if (isSmooth) {
            d *= 0.85; 
        } else {
            if (/gravel|dirt|grass_block|cobblestone|moss|raw_|ore|log|leaves/.test(p.id)) {
                d *= 1.4; 
            }
        }

        if (d < bestD) {
            bestD = d;
            best = p;
        }
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
        autoTrim = true,
    } = opts;

    const palette = buildPalette(mode, paletteFilter);
    if (palette.length === 0) throw new Error('パレットが空です（フィルタを緩めてください）');

    // 1) Canvas に描画
    const canvas = document.createElement('canvas');
    canvas.width = gridW;
    canvas.height = gridH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (autoTrim) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0);
        const tempDat = tempCtx.getImageData(0, 0, image.width, image.height).data;
        
        // 背景色の推定（左上のピクセルを基準とする）
        const bgR = tempDat[0], bgG = tempDat[1], bgB = tempDat[2], bgA = tempDat[3];
        const w = image.width, h = image.height;
        const corners = [0, (w-1)*4, ((h-1)*w)*4, ((h-1)*w + w-1)*4];
        let isSolidBg = true;
        for (let c of corners) {
            if (Math.abs(tempDat[c] - bgR) > 15 || Math.abs(tempDat[c+1] - bgG) > 15 || Math.abs(tempDat[c+2] - bgB) > 15) {
                isSolidBg = false; break;
            }
        }

        const rowCount = new Int32Array(h);
        const colCount = new Int32Array(w);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = tempDat[idx], g = tempDat[idx+1], b = tempDat[idx+2], a = tempDat[idx+3];
                
                let isBg = false;
                if (a < 10) {
                    isBg = true;
                } else if (isSolidBg) {
                    if (Math.abs(r - bgR) < 20 && Math.abs(g - bgG) < 20 && Math.abs(b - bgB) < 20) {
                        isBg = true;
                    }
                }
                
                if (!isBg) {
                    rowCount[y]++;
                    colCount[x]++;
                }
            }
        }

        function getBestSpan(counts) {
            let spans = [];
            let start = -1;
            let total = 0;
            let gapSize = 0;
            for (let i = 0; i < counts.length; i++) {
                if (counts[i] > 0) {
                    if (start === -1) {
                        start = i - gapSize; // include the ignored gap if it was inside the object
                        total = 0;
                    }
                    total += counts[i];
                    gapSize = 0;
                } else {
                    if (start !== -1) {
                        gapSize++;
                        // 20ピクセル以上の隙間があれば別のオブジェクト（ウォーターマーク等）とみなして分割
                        if (gapSize > 20) {
                            spans.push({ start, end: i - gapSize, pixels: total });
                            start = -1;
                        }
                    }
                }
            }
            if (start !== -1) spans.push({ start, end: counts.length - 1 - gapSize, pixels: total });
            
            if (spans.length === 0) return null;
            spans.sort((a,b) => b.pixels - a.pixels);
            return spans[0];
        }

        const bestRow = getBestSpan(rowCount);
        const bestCol = getBestSpan(colCount);

        if (bestRow && bestCol) {
            const minX = bestCol.start;
            const maxX = bestCol.end;
            const minY = bestRow.start;
            const maxY = bestRow.end;

            const trimW = maxX - minX + 1;
            const trimH = maxY - minY + 1;
            const paddingX = Math.max(1, Math.floor(gridW * 0.05)); // 5%に戻す
            const paddingY = Math.max(1, Math.floor(gridH * 0.05));
            const availW = gridW - paddingX * 2;
            const availH = gridH - paddingY * 2;
            const scale = Math.min(availW / trimW, availH / trimH);
            const drawW = trimW * scale;
            const drawH = trimH * scale;
            const drawX = (gridW - drawW) / 2;
            const drawY = (gridH - drawH) / 2;

            if (isSolidBg) {
                ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${bgA / 255})`;
                ctx.fillRect(0, 0, gridW, gridH);
            }

            ctx.drawImage(image, minX, minY, trimW, trimH, drawX, drawY, drawW, drawH);
        } else {
            ctx.drawImage(image, 0, 0, gridW, gridH);
        }
    } else {
        ctx.drawImage(image, 0, 0, gridW, gridH);
    }

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
            
            // RGB -> LAB
            const lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
            const nearest = _nearestLab(lab, palette);
            
            grid[y][x] = nearest.id;
            counts.set(nearest.id, (counts.get(nearest.id) || 0) + 1);

            // Floyd-Steinberg dithering（誤差拡散） - 拡散率を 80% に抑えてノイズ感を軽減
            if (dithering) {
                const diffusion = 0.8;
                const errR = (rgb[0] - nearest.rgb[0]) * diffusion;
                const errG = (rgb[1] - nearest.rgb[1]) * diffusion;
                const errB = (rgb[2] - nearest.rgb[2]) * diffusion;
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
    'clean_only': { allow: [/_wool$|_concrete$|terracotta$/] }, // 追加
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
