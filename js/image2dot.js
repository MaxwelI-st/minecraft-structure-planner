/**
 * image2dot.js - Professional Flood-Fill Background Removal
 */

import { DOT_PALETTE } from './dotart.js';

/* ─── HEX → RGB ──────────────────────────────────────────────────────── */
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

/* ─── RGB → CIELAB ───────────────────────────────────────────────────── */
function rgbToLab(r, g, b) {
    let _r = r / 255, _g = g / 255, _b = b / 255;
    _r = (_r > 0.04045) ? Math.pow((_r + 0.055) / 1.055, 2.4) : _r / 12.92;
    _g = (_g > 0.04045) ? Math.pow((_g + 0.055) / 1.055, 2.4) : _g / 12.92;
    _b = (_b > 0.04045) ? Math.pow((_b + 0.055) / 1.055, 2.4) : _b / 12.92;
    _r *= 100; _g *= 100; _b *= 100;
    const x = _r * 0.4124 + _g * 0.3576 + _b * 0.1805;
    const y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722;
    const z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505;
    let _x = x / 95.047, _y = y / 100, _z = z / 108.883;
    _x = (_x > 0.008856) ? Math.pow(_x, 1/3) : (7.787 * _x) + (16/116);
    _y = (_y > 0.008856) ? Math.pow(_y, 1/3) : (7.787 * _y) + (16/116);
    _z = (_z > 0.008856) ? Math.pow(_z, 1/3) : (7.787 * _z) + (16/116);
    return [(116 * _y) - 16, 500 * (_x - _y), 200 * (_y - _z)];
}

/* ─── 最近傍探索 ─── */
function _nearestLab(l, a, b, palette, isSlightlyWarm) {
    let best = null;
    let bestD = Infinity;

    for (const p of palette) {
        const dL = l - p.lab[0];
        const da = a - p.lab[1];
        const db = b - p.lab[2];
        let d = dL * dL + da * da + db * db;

        const id = p.id.toLowerCase();

        // 質感の調整: ザラザラ・模様が強いブロックを一律で避ける
        if (id.includes('iron_block') || id.includes('quartz_block') || id.includes('calcite') || id.includes('sandstone')) {
            d += 400;
        }

        // お顔と背景を分離するための微調整
        if (isSlightlyWarm) {
            // 背景用の平坦すぎる白を避ける
            if (id.includes('white_wool') || id.includes('white_concrete') || id.includes('snow')) {
                d += 500; 
            }
            // お顔に最適な「滑らかな暖色ブロック」を強力に推す
            if (id.includes('mushroom_stem') || id.includes('birch_planks') || id.includes('white_terracotta')) {
                d -= 300;
            }
        }
        if (d < bestD) {
            bestD = d;
            best = p;
        }
    }
    return best;
}

/* ─── メイン: 変換ロジック ───────────────────────────────────────────── */
export function convert(image, opts = {}) {
    const { gridW = 128, gridH = 128, paletteFilter = null, autoTrim = true, contrast = 1.0, saturation = 1.0, dither = 0.0, airMode = false } = opts;

    const canvas = document.createElement('canvas');
    canvas.width = gridW; canvas.height = gridH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const imgRatio = image.width / image.height;
    const gridRatio = gridW / gridH;

    if (autoTrim) {
        // Cover: 縦横比を維持して中央を切り抜き、グリッド全体を埋める
        let sw, sh, sx, sy;
        if (imgRatio > gridRatio) {
            sh = image.height;
            sw = sh * gridRatio;
            sx = (image.width - sw) / 2;
            sy = 0;
        } else {
            sw = image.width;
            sh = sw / gridRatio;
            sx = 0;
            sy = (image.height - sh) / 2;
        }
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, gridW, gridH);
    } else {
        // Contain: 縦横比を維持して全体を収め、余白を作る
        let dw, dh, dx, dy;
        if (imgRatio > gridRatio) {
            dw = gridW;
            dh = dw / imgRatio;
            dx = 0;
            dy = (gridH - dh) / 2;
        } else {
            dh = gridH;
            dw = dh * imgRatio;
            dx = (gridW - dw) / 2;
            dy = 0;
        }
        ctx.drawImage(image, 0, 0, image.width, image.height, dx, dy, dw, dh);
    }

    const imgData = ctx.getImageData(0, 0, gridW, gridH);
    const pixels = new Float32Array(imgData.data);
    const isBgMap = new Uint8Array(gridW * gridH); // 0: Character, 1: Background(Air)

    // 【強化】Flood-Fill 背景除去
    if (airMode) {
        const labs = [];
        for (let i = 0; i < pixels.length; i += 4) {
            labs.push(rgbToLab(pixels[i], pixels[i+1], pixels[i+2]));
        }

        const stack = [];
        const visited = new Uint8Array(gridW * gridH);
        
        // 四隅から開始
        [[0,0], [gridW-1, 0], [0, gridH-1], [gridW-1, gridH-1]].forEach(([sx, sy]) => {
            const idx = sy * gridW + sx;
            if (!visited[idx]) {
                stack.push([sx, sy, labs[idx]]);
                visited[idx] = 1;
            }
        });

        while (stack.length > 0) {
            const [x, y, refLab] = stack.pop();
            const idx = y * gridW + x;
            isBgMap[idx] = 1; // ここは背景

            [[1,0], [-1,0], [0,1], [0,-1]].forEach(([dx, dy]) => {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                    const nIdx = ny * gridW + nx;
                    if (!visited[nIdx]) {
                        const nLab = labs[nIdx];
                        const dist = Math.pow(refLab[0]-nLab[0],2) + Math.pow(refLab[1]-nLab[1],2) + Math.pow(refLab[2]-nLab[2],2);
                        // 色が近く、かつ輝度が高い(白背景用) または 基準色に非常に近い(単色背景用)
                        if (dist < 80 || (nLab[0] > 98)) {
                            visited[nIdx] = 1;
                            stack.push([nx, ny, refLab]);
                        }
                    }
                }
            });
        }
    }

    // プリプロセス (色補正)
    for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i], g = pixels[i+1], b = pixels[i+2];
        if (contrast !== 1.0) { r = 128 + (r - 128) * contrast; g = 128 + (g - 128) * contrast; b = 128 + (b - 128) * contrast; }
        if (saturation !== 1.0) {
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            r = gray + (r - gray) * saturation; g = gray + (g - gray) * saturation; b = gray + (b - gray) * saturation;
        }
        pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b;
    }

    const palette = DOT_PALETTE.map(p => {
        const rgb = hexToRgb(p.color);
        return { id: p.id, lab: rgbToLab(rgb[0], rgb[1], rgb[2]), rgb };
    });

    const grid = Array.from({ length: gridH }, () => new Array(gridW).fill(null));
    const counts = new Map();

    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const idx = y * gridW + x;
            if (airMode && isBgMap[idx]) continue; // 背景としてマークされた場所はAir

            const i = idx * 4;
            if (pixels[i+3] < 50) continue;

            const r = Math.max(0, Math.min(255, pixels[i]));
            const g = Math.max(0, Math.min(255, pixels[i+1]));
            const b = Math.max(0, Math.min(255, pixels[i+2]));
            let lab = rgbToLab(r, g, b);
            
            // エッジ検出 (口や目などの細部を保護)
            let isEdge = false;
            let edgeStrength = 0;
            if (x < gridW - 1 && y < gridH - 1) {
                const nIdxX = (idx + 1) * 4;
                const nIdxY = (idx + gridW) * 4;
                const dX = Math.abs(pixels[i] - pixels[nIdxX]) + Math.abs(pixels[i+1] - pixels[nIdxX+1]);
                const dY = Math.abs(pixels[i] - pixels[nIdxY]) + Math.abs(pixels[i+1] - pixels[nIdxY+1]);
                edgeStrength = Math.max(dX, dY);
                if (edgeStrength > 30) isEdge = true;
            }

            const isSlightlyWarm = (lab[1] > 0.3 && lab[2] > 0.3);

            // 【新機能】細部強調: エッジ部分のコントラストと彩度を強制的に強めて口や目を出す
            if (isEdge) {
                if (lab[0] < 60) {
                    lab[0] *= 0.85; // 暗い線（口など）はより暗く
                } else {
                    lab[0] *= 1.05; // 明るい部分はより明るく
                }
                lab[1] *= 1.2; // 彩度も少し盛る
                lab[2] *= 1.2;
            }

            const nearest = _nearestLab(lab[0], lab[1], lab[2], palette, isSlightlyWarm);
            grid[y][x] = nearest.id;
            counts.set(nearest.id, (counts.get(nearest.id) || 0) + 1);

            // ディザリング処理 (お肌の場合は弱めるが、エッジ部分は細部描写のため維持する)
            const currentDither = (isSlightlyWarm && !isEdge) ? dither * 0.2 : dither;
            if (currentDither > 0) {
                const errR = (r - nearest.rgb[0]) * currentDither;
                const errG = (g - nearest.rgb[1]) * currentDither;
                const errB = (b - nearest.rgb[2]) * currentDither;
                if (x + 1 < gridW) { pixels[i+4] += errR * 7/16; pixels[i+5] += errG * 7/16; pixels[i+6] += errB * 7/16; }
                if (y + 1 < gridH) {
                    if (x > 0) { const i1 = ((y+1)*gridW+(x-1))*4; pixels[i1] += errR * 3/16; pixels[i1+1] += errG * 3/16; pixels[i1+2] += errB * 3/16; }
                    const i2 = ((y+1)*gridW+x)*4; pixels[i2] += errR * 5/16; pixels[i2+1] += errG * 5/16; pixels[i2+2] += errB * 5/16;
                    if (x + 1 < gridW) { const i3 = ((y+1)*gridW+(x+1))*4; pixels[i3] += errR * 1/16; pixels[i3+1] += errG * 1/16; pixels[i3+2] += errB * 1/16; }
                }
            }
        }
    }
    return { grid, counts, palette };
}

export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img); img.onerror = reject;
        if (typeof src === 'string') img.src = src;
        else if (src instanceof Blob) img.src = URL.createObjectURL(src);
        else reject(new Error('fail'));
    });
}
export const FILTER_PRESETS = { 'all': null, 'clean_only': { allow: [/_wool$|_concrete$|terracotta$/] } };
export const MAP_BASE_SIZE = 128;
export function snapToMapGrid(x, z) { return { x: Math.floor(x/128)*128, z: Math.floor(z/128)*128 }; }
export function shiftForEdgeExclusion(x, z) { return { x: x+1, z: z+1 }; }
