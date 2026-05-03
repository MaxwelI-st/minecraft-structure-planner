/**
 * textures.js
 * ────────────────────────────────────────────────────────────────────────────
 * 軽量プロシージャル PixelArt テクスチャ生成。
 * ライセンス問題のため Minecraft の本物のテクスチャは同梱できないので、
 * blockId からマップカラーをもとに 16×16 のドット風テクスチャを動的生成する。
 *
 *   - 同じ blockId に対しては一度だけ生成してキャッシュ
 *   - THREE.CanvasTexture を返す（NearestFilter でドット感を維持）
 *   - blockKind で簡単な模様を切り替え：stone / wood / grass / sand / leaves / metal / glass / default
 *
 * 公開 API:
 *   - generateTexture(blockId, THREE)        → THREE.CanvasTexture（キャッシュあり）
 *   - getTextureMaterial(blockId, THREE)     → THREE.MeshLambertMaterial（キャッシュあり）
 *   - clearCache()                           → メモリ開放
 * ────────────────────────────────────────────────────────────────────────────
 */

import { blockIdToMapColorId, getMapColorRgb, MAP_COLORS } from './mapcolors.js';

const TEX_SIZE = 16;
const _texCache = new Map();   // blockId → CanvasTexture
const _matCache = new Map();   // blockId → MeshLambertMaterial

/* 簡易擬似乱数（同じ blockId で常に同じ模様を出すため seed 化） */
function mulberry32(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return h >>> 0;
}

/* blockId から「種類」を推定して模様タイプを返す */
function inferKind(blockId) {
    const id = String(blockId).toLowerCase();
    if (id.includes('leaves'))   return 'leaves';
    if (id.includes('grass') && !id.includes('block_path')) {
        if (id.includes('grass_block')) return 'grass_block';
        return 'plant';
    }
    if (id.includes('log') || id.includes('stem') || id.includes('hyphae')) return 'log';
    if (id.includes('plank') || id.includes('wood')) return 'wood';
    if (id.includes('sand'))     return 'sand';
    if (id.includes('gravel'))   return 'gravel';
    if (id.includes('dirt') || id.includes('podzol') || id.includes('mycelium')) return 'dirt';
    if (id.includes('iron') || id.includes('gold') || id.includes('copper') ||
        id.includes('diamond_block') || id.includes('emerald_block') ||
        id.includes('lapis_block') || id.includes('netherite')) return 'metal';
    if (id.includes('glass'))    return 'glass';
    if (id.includes('water'))    return 'water';
    if (id.includes('lava'))     return 'lava';
    if (id.includes('ice'))      return 'ice';
    if (id.includes('snow'))     return 'snow';
    if (id.includes('wool') || id.includes('carpet') || id.includes('concrete')) return 'wool';
    if (id.includes('terracotta')) return 'terracotta';
    if (id.includes('brick'))    return 'brick';
    if (id.includes('stone') || id.includes('cobble') || id.includes('andesite') ||
        id.includes('granite') || id.includes('diorite') || id.includes('deepslate') ||
        id.includes('basalt') || id.includes('blackstone') || id.includes('netherrack')) return 'stone';
    return 'default';
}

/* 色操作 */
function rgbAdjust([r, g, b], delta) {
    return [
        Math.max(0, Math.min(255, r + delta)),
        Math.max(0, Math.min(255, g + delta)),
        Math.max(0, Math.min(255, b + delta)),
    ];
}
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128];
}

/* ─── パターン関数（Canvas 2D に直接描画） ───────────────────────────────── */

function drawNoise(ctx, base, rand, range = 18) {
    const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < TEX_SIZE * TEX_SIZE; i++) {
        const d = (rand() - 0.5) * 2 * range;
        const [r, g, b] = rgbAdjust(base, Math.round(d));
        img.data[i * 4 + 0] = r;
        img.data[i * 4 + 1] = g;
        img.data[i * 4 + 2] = b;
        img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
}

function drawWoodGrain(ctx, base, rand) {
    const dark  = rgbAdjust(base, -25);
    const light = rgbAdjust(base, 12);
    drawNoise(ctx, base, rand, 8);
    // 縦縞
    for (let x = 0; x < TEX_SIZE; x++) {
        const f = Math.sin((x / TEX_SIZE) * Math.PI * 4 + rand() * 6.28) * 0.5 + 0.5;
        const c = f > 0.7 ? light : (f < 0.3 ? dark : null);
        if (!c) continue;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        for (let y = 0; y < TEX_SIZE; y++) {
            if (rand() > 0.4) ctx.fillRect(x, y, 1, 1);
        }
    }
}

function drawLogRings(ctx, base, rand) {
    drawNoise(ctx, base, rand, 8);
    const dark  = rgbAdjust(base, -30);
    const light = rgbAdjust(base, 10);
    const cx = TEX_SIZE / 2, cy = TEX_SIZE / 2;
    for (let y = 0; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const d = Math.hypot(x - cx, y - cy);
            const ring = Math.floor(d / 1.5) % 2 === 0 ? dark : light;
            if (rand() > 0.6) {
                ctx.fillStyle = `rgb(${ring[0]},${ring[1]},${ring[2]})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

function drawGrassBlock(ctx, rand) {
    // 緑の上部 + 茶の下部のシンプルな複合模様（top面想定）
    const grass = [127, 178, 56];
    const dirt  = [134, 96, 67];
    drawNoise(ctx, grass, rand, 14);
    // 下半分はランダムに dirt が混じる
    for (let y = 12; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            if (rand() > 0.6) {
                const c = rgbAdjust(dirt, Math.round((rand() - 0.5) * 30));
                ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

function drawBricks(ctx, base, rand) {
    drawNoise(ctx, base, rand, 12);
    const mortar = rgbAdjust(base, -45);
    ctx.fillStyle = `rgb(${mortar[0]},${mortar[1]},${mortar[2]})`;
    // 横ライン
    for (let y = 3; y < TEX_SIZE; y += 5) {
        ctx.fillRect(0, y, TEX_SIZE, 1);
    }
    // 縦ライン（オフセット）
    for (let row = 0; row < TEX_SIZE / 5 + 1; row++) {
        const offset = (row % 2 === 0) ? 0 : 4;
        for (let x = offset; x < TEX_SIZE; x += 8) {
            ctx.fillRect(x, row * 5, 1, 4);
        }
    }
}

function drawGlass(ctx, base) {
    // 半透明風の薄い枠線だけ
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
    ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},0.35)`;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    ctx.strokeStyle = `rgba(${base[0]},${base[1]},${base[2]},0.85)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TEX_SIZE - 1, TEX_SIZE - 1);
}

function drawWaterLava(ctx, base, rand, animated = false) {
    drawNoise(ctx, base, rand, 25);
    const lighter = rgbAdjust(base, 20);
    for (let y = 0; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const w = Math.sin((x + y * 0.7) * 0.6 + rand() * 6.28);
            if (w > 0.6) {
                ctx.fillStyle = `rgb(${lighter[0]},${lighter[1]},${lighter[2]})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

function drawIceSnow(ctx, base, rand) {
    drawNoise(ctx, base, rand, 6);
    const sparkle = [255, 255, 255];
    for (let i = 0; i < 6; i++) {
        const x = Math.floor(rand() * TEX_SIZE);
        const y = Math.floor(rand() * TEX_SIZE);
        ctx.fillStyle = `rgb(${sparkle[0]},${sparkle[1]},${sparkle[2]})`;
        ctx.fillRect(x, y, 1, 1);
    }
}

function drawLeaves(ctx, base, rand) {
    drawNoise(ctx, base, rand, 30);
    const dark = rgbAdjust(base, -30);
    for (let i = 0; i < 14; i++) {
        const x = Math.floor(rand() * TEX_SIZE);
        const y = Math.floor(rand() * TEX_SIZE);
        ctx.fillStyle = `rgb(${dark[0]},${dark[1]},${dark[2]})`;
        ctx.fillRect(x, y, 2, 1);
    }
}

function drawMetal(ctx, base, rand) {
    drawNoise(ctx, base, rand, 8);
    // 横方向ハイライト
    const hi = rgbAdjust(base, 25);
    ctx.fillStyle = `rgb(${hi[0]},${hi[1]},${hi[2]})`;
    ctx.fillRect(0, 3, TEX_SIZE, 1);
    ctx.fillRect(0, 11, TEX_SIZE, 1);
}

function drawWool(ctx, base, rand) {
    drawNoise(ctx, base, rand, 14);
    // 細かい X 字パターン
    const dark = rgbAdjust(base, -12);
    ctx.fillStyle = `rgb(${dark[0]},${dark[1]},${dark[2]})`;
    for (let i = 0; i < 24; i++) {
        const x = Math.floor(rand() * TEX_SIZE);
        const y = Math.floor(rand() * TEX_SIZE);
        ctx.fillRect(x, y, 1, 1);
    }
}

/* ─── メイン：blockId 用テクスチャ生成 ──────────────────────────────────── */
function _renderTextureCanvas(blockId) {
    const canvas = (typeof document !== 'undefined')
        ? document.createElement('canvas')
        : null;
    if (!canvas) return null;
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d');

    const mapId = blockIdToMapColorId(blockId);
    const baseRgb = mapId === 0
        ? [128, 128, 128]
        : [...MAP_COLORS[mapId].rgb];

    const rand = mulberry32(hashStr(String(blockId)));
    const kind = inferKind(blockId);

    switch (kind) {
        case 'grass_block': drawGrassBlock(ctx, rand); break;
        case 'log':         drawLogRings(ctx, baseRgb, rand); break;
        case 'wood':
        case 'plant':       drawWoodGrain(ctx, baseRgb, rand); break;
        case 'sand':        drawNoise(ctx, baseRgb, rand, 12); break;
        case 'gravel':      drawNoise(ctx, baseRgb, rand, 22); break;
        case 'dirt':        drawNoise(ctx, baseRgb, rand, 18); break;
        case 'leaves':      drawLeaves(ctx, baseRgb, rand); break;
        case 'metal':       drawMetal(ctx, baseRgb, rand); break;
        case 'glass':       drawGlass(ctx, baseRgb); break;
        case 'water':       drawWaterLava(ctx, baseRgb, rand); break;
        case 'lava':        drawWaterLava(ctx, baseRgb, rand); break;
        case 'ice':         drawIceSnow(ctx, baseRgb, rand); break;
        case 'snow':        drawIceSnow(ctx, baseRgb, rand); break;
        case 'wool':        drawWool(ctx, baseRgb, rand); break;
        case 'terracotta':  drawNoise(ctx, baseRgb, rand, 16); break;
        case 'brick':       drawBricks(ctx, baseRgb, rand); break;
        case 'stone':       drawNoise(ctx, baseRgb, rand, 16); break;
        default:            drawNoise(ctx, baseRgb, rand, 14);
    }
    return canvas;
}

/* ─── 公開 API ─────────────────────────────────────────────────────────── */

export function generateTexture(blockId, THREE) {
    if (_texCache.has(blockId)) return _texCache.get(blockId);
    const canvas = _renderTextureCanvas(blockId);
    if (!canvas || !THREE) return null;
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    _texCache.set(blockId, tex);
    return tex;
}

export function getTextureMaterial(blockId, THREE) {
    if (_matCache.has(blockId)) return _matCache.get(blockId);
    const tex = generateTexture(blockId, THREE);
    const isGlass = String(blockId).toLowerCase().includes('glass');
    const opts = { map: tex };
    if (isGlass) { opts.transparent = true; opts.opacity = 0.6; }
    const mat = new THREE.MeshLambertMaterial(opts);
    _matCache.set(blockId, mat);
    return mat;
}

export function clearCache() {
    for (const m of _matCache.values()) m.dispose?.();
    for (const t of _texCache.values()) t.dispose?.();
    _matCache.clear();
    _texCache.clear();
}

/** デバッグ用 */
export function getCacheSize() {
    return { textures: _texCache.size, materials: _matCache.size };
}
