/**
 * viewer3d.js - Three.js based 3D structure viewer
 * Version: v2.6.0 (Fix: door open/close, glass transparency, grass biome color, corner stairs)
 */

import { getFaceUrls, isLoaded as packIsLoaded, getName as packName } from '../resourcepack.js';
import { resolveGeometry, classifyShape } from '../blockshapes.js';
import { normalizeBedrockBlock } from '../bedrock_normalize.js';
import { _getState, _isTrue } from '../blockshapes.js';
import { BlockInstancingManager } from './BlockInstancingManager.js';
import { getVisualHints } from '../modules/logic/bedrock_visual_state.js';
import { computeWireConnections, encodeConnections } from '../modules/logic/redstone_wire_connect.js';
import { readOrientation, computeStairsShape } from './orientation.js';
import { getTextureAlphaMode, getTextureMaterialOptions } from './texture-material-policy.js';
import {
    getRedstoneMaterialColors,
    isMaterialRedstoneDevice,
} from './redstone-material-policy.js';

// ─── バイオームカラー定数 ──────────────────────────────────────────────────
// 平原バイオーム準拠（Minecraft 標準）
const BIOME_GRASS_COLOR  = 0x91bd59; // 草ブロック上面・側面オーバーレイ
const BIOME_FOLIAGE_COLOR = 0x77ab2f; // 葉っぱ類
const BIOME_WATER_COLOR   = 0x3f76e4; // 水

// ブロック ID → バイオームカラーのマッピング
const BIOME_TINT_MAP = {
    // 草ブロック上面・側面オーバーレイ
    'grass_block':  BIOME_GRASS_COLOR,
    'grass':        BIOME_GRASS_COLOR,
    // 葉っぱ類
    'oak_leaves':        BIOME_FOLIAGE_COLOR,
    'spruce_leaves':     0x619961,  // スプルースは少し青緑
    'birch_leaves':      0x80a755,
    'jungle_leaves':     0x30bb0b,
    'acacia_leaves':     BIOME_FOLIAGE_COLOR,
    'dark_oak_leaves':   BIOME_FOLIAGE_COLOR,
    'mangrove_leaves':   BIOME_FOLIAGE_COLOR,
    'azalea_leaves':     BIOME_FOLIAGE_COLOR,
    'flowering_azalea_leaves': BIOME_FOLIAGE_COLOR,
    'pale_oak_leaves':   0xa8b08c,
    // ツタ・草
    'vine':         BIOME_FOLIAGE_COLOR,
    'tall_grass':   BIOME_GRASS_COLOR,
    'short_grass':  BIOME_GRASS_COLOR,
    'fern':         BIOME_FOLIAGE_COLOR,
    'large_fern':   BIOME_FOLIAGE_COLOR,
    // 水
    'water':        BIOME_WATER_COLOR,
    'flowing_water':BIOME_WATER_COLOR,
};

/** blockId に対応するバイオームカラーを返す。対応なしは null */
function getBiomeTint(blockId) {
    const local = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    return BIOME_TINT_MAP[local] ?? null;
}

/** ブロックが透過やアルファテスト（切り抜き）を必要とするかどうか */
/** ブロックIDが草ブロック系かどうか（上面グレースケール→バイオーム着色が必要） */
function _isGrassBlock(blockId) {
    const local = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    return local === 'grass_block' || local === 'grass';
}

/** 透過判定（カリング用）: 完全なキューブでないブロックはすべて transparent 扱い */
function _isTransparent(blockId) {
    const shape = classifyShape(blockId, null);
    if (shape === 'cube') {
        // 葉・ガラス・氷系のキューブは透過
        return /glass|leaves|ice/.test(blockId);
    }
    // 空気は描画しないので透過扱い不要だが、念のため true
    return true;
}

export const BLOCK_COLORS = {
    grass_block: 0x79c05a, grass: 0x79c05a, dirt: 0x866043, stone: 0x7a7a7a,
    cobblestone: 0x9a9a9a, mossy_cobblestone: 0x6a7a6a,
    sand: 0xe0d070, gravel: 0x909090, white_concrete_powder: 0xe0e0e0,
    oak: 0x9d814d, spruce: 0x684e2e, birch: 0xd7c185, jungle: 0xab7653,
    acacia: 0xba6337, dark_oak: 0x493212, mangrove: 0x7a3030, cherry: 0xe2c1c6,
    bamboo: 0xc6b65a, crimson: 0x963a4c, warped: 0x3a8e8c,
    stone_brick: 0x7a7a7a, nether_brick: 0x301020, bricks: 0xa04030,
    deepslate: 0x505060, blackstone: 0x2c252a, quartz: 0xede6df,
    andesite: 0x909090, diorite: 0xd0d0d0, granite: 0xa06040,
    barrel: 0x8a6030, chest: 0x8a6030, composter: 0x604020, smoker: 0x404040,
    beehive: 0xc6b65a, campfire: 0x604020, lantern: 0xf0c840, hopper: 0x404040,
    ladder: 0x8a6030, iron_bars: 0xd8d8d8, glass: 0xb0d8f0, glass_pane: 0xb0d8f0,
    flower_pot: 0xa04030, bed: 0xc02020, glowstone: 0xf0c840,
};

export function getBlockColor(blockId) {
    const raw = String(blockId).toLowerCase().replace('minecraft:', '');
    if (raw.includes('grass')) return 0x79c05a;
    if (raw.includes('dirt')) return 0x866043;
    for (const [key, color] of Object.entries(BLOCK_COLORS)) {
        if (raw.includes(key)) return color;
    }
    return 0x8a8a8a;
}

/** 階段の half (top/bottom) 判定。Bedrock byte (1/true/'1'/{value:1}) と Java half= に両対応 */
function _stairHalf(states) {
    let v = states?.upside_down_bit ?? states?.['minecraft:upside_down_bit'];
    if (v && typeof v === 'object' && 'value' in v) v = v.value;
    const flipped = v === 1 || v === true || v === '1' || v === 'true';
    return (flipped || states?.half === 'top') ? 'top' : 'bottom';
}

function _shapeSignature(blockId, states) {
    const shape = classifyShape(blockId, states);
    if (shape === 'cube' || !states) return blockId;
    const keys = [];
    // Bedrock + Java の両方の state 名を含めてキャッシュ衝突を防ぐ
    if      (shape === 'stairs')         keys.push('upside_down_bit', 'half');
    else if (shape === 'slab')           keys.push('top_slot_bit', 'vertical_half', 'minecraft:vertical_half', 'upside_down_bit', 'type');
    else if (shape === 'trapdoor')       keys.push('open_bit', 'open', 'upside_down_bit', 'half');
    else if (shape === 'door')           keys.push('open_bit', 'open', 'upper_block_bit', 'half', 'door_hinge_bit', 'hinge_bit', 'hinge');
    else if (shape === 'fence_gate')     keys.push('open_bit', 'open');
    else if (shape === 'lantern')        keys.push('hanging_bit', 'hanging');
    else if (shape === 'chain')          { /* rotation only */ }
    else if (shape === 'rail')           keys.push('rail_direction', 'shape');
    else if (shape === 'frame')          { /* rotation only */ }
    else if (shape === 'end_rod')        { /* rotation only */ }
    else if (shape === 'snow_layer')     keys.push('height', 'snow_layer_height');
    else if (shape === 'button')         keys.push('facing_direction', 'face');
    else if (shape === 'hopper')         { /* rotation + hopper topology sig */ }
    else if (shape === 'anvil')          { /* rotation only */ }
    else if (shape === 'shelf')          { /* rotation only */ }
    else if (shape === 'campfire')       { /* rotation only */ }
    else if (shape === 'torch')          keys.push('torch_facing_direction');
    const sigParts = keys.map(k => k + '=' + (states[k] ?? ''));
    return blockId + '|' + sigParts.join(',');
}

export class Viewer3D {
    constructor(container) {
        this.container = container;
        this.scene = null; this.camera = null; this.renderer = null;
        this.meshes = []; this.isInitialized = false;
        this.spherical = { theta: 0.5, phi: 0.8, radius: 50 };
        this.target = { x: 0, y: 0, z: 0 };
        this.colorMode = 'material';
        this._matCache = new Map();
        this._textureCache = new Map();
        this.blockManager = null;
        this._lastCoords = null; this._lastSize = null; this._lastOptions = null;
        this._highlightedBlockId = null;
        this._highlightedBlockIds = new Set(); // マルチハイライト用
        this._pulseTargetMeshes = null; // パルスアニメーション対象 mesh キャッシュ (_animate で構築)
        this.pulseHighlight = false; // パルス点滅をデフォルト無効（チカチカ防止）
        // 置換を再適用して再描画が必要な場合に呼び出すコールバック（app.js がセット）
        this.onNeedsReload = null;
        // Alt+ドラッグ（建造物移動）コールバック
        this.onAltDragStart = null;   // ({coord, axis}) => void
        this.onAltDragMove  = null;   // ({axis, dx}) => void
        this.onAltDragEnd   = null;   // () => void
        // 建造物ハイライト（Alt+ドラッグ中に対象構造を囲むボックス）
        this._structureHighlightMeshes = [];
        // 範囲選択用の始点マーカーとボックス
        this._rangeStartMesh = null;
        this._rangeBoxMesh = null;
    }

    async init() {
        if (this.isInitialized) return;
        await this._loadThree();
        this._setupScene();
        this._setupControls();
        this.isInitialized = true;
    }

    /** WebGL リソースとイベントの解放 */
    destroy() {
        if (!this.isInitialized) return;

        // 描画ループ停止 (_animate は renderer=null でも自衛するが、即時停止する)
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        // window に登録した resize/mousemove/mouseup/blur リスナーを一括解除
        if (this._listenerAbort) { this._listenerAbort.abort(); this._listenerAbort = null; }

        for (const mesh of this._structureHighlightMeshes ?? []) {
            mesh.geometry?.dispose();
            mesh.material?.dispose();
            this.scene?.remove(mesh);
        }
        this._structureHighlightMeshes = [];

        if (this.blockManager) {
            this.blockManager.disposeAll();
            this.blockManager = null;
        } else if (this.scene) {
            // シーン全体の走査による完全解放 (fallback)
            this.scene.traverse((object) => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
        }
        
        this.meshes = [];
        this._matCache.clear();
        this._clearTextureCache();

        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.remove();
            }
        }
        
        if (this._compassCanvas) {
            this._compassCanvas.remove();
            this._compassCanvas = null;
        }
        if (this.floor) {
            this.floor = null;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isInitialized = false;
    }

    _loadThree() {
        return new Promise((resolve, reject) => {
            if (typeof window.THREE !== 'undefined') { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Three.js load failed'));
            document.head.appendChild(script);
        });
    }

    _setupScene() {
        const THREE = window.THREE;
        const w = this.container.clientWidth || 600;
        const h = this.container.clientHeight || 450;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1a);
        this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
        this._updateCamera();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(w, h);
        if (THREE.sRGBEncoding !== undefined) {
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        // ガラスの透過を正しく描画するためにソート済みレンダリングを有効化
        this.renderer.sortObjects = true;
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0x8899bb, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 80, 50);
        this.scene.add(dirLight);
        this.floor = new THREE.GridHelper(100, 20, 0x224444, 0x112233);
        this.scene.add(this.floor);
        this._setupCompass();
        this._animate();
    }

    _setupCompass() {
        const cv = document.createElement('canvas');
        cv.width = 84; cv.height = 84;
        cv.style.cssText = 'position:absolute;bottom:8px;right:8px;pointer-events:none;';
        this.container.style.position = 'relative';
        this.container.appendChild(cv);
        this._compassCanvas = cv;
    }

    _drawCompass() {
        const cv = this._compassCanvas;
        if (!cv) return;
        const ctx = cv.getContext('2d');
        const cx = 42, cy = 42, r = 36;
        const theta = this.spherical.theta;

        ctx.clearRect(0, 0, 84, 84);

        // 背景
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(8,14,26,0.80)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,140,200,0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 目盛り（8方位）
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const inner = i % 2 === 0 ? r - 7 : r - 4;
            ctx.beginPath();
            ctx.moveTo(cx + inner * Math.sin(a), cy - inner * Math.cos(a));
            ctx.lineTo(cx + r * Math.sin(a),     cy - r * Math.cos(a));
            ctx.strokeStyle = 'rgba(100,150,200,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // N 矢印（赤）
        const nx = cx + (r - 12) * Math.sin(theta);
        const ny = cy - (r - 12) * Math.cos(theta);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = '#ff5555';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // 矢先
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff5555';
        ctx.fill();

        // S 矢印（グレー）
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - (r - 14) * Math.sin(theta), cy + (r - 14) * Math.cos(theta));
        ctx.strokeStyle = '#667799';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // N/S/E/W ラベル
        const dirs = [
            { t: 'N', a: theta,                 col: '#ff5555' },
            { t: 'S', a: theta + Math.PI,        col: '#6688aa' },
            { t: 'E', a: theta + Math.PI / 2,    col: '#88bbdd' },
            { t: 'W', a: theta - Math.PI / 2,    col: '#88bbdd' },
        ];
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const d of dirs) {
            const lx = cx + (r + 1) * Math.sin(d.a);
            const ly = cy - (r + 1) * Math.cos(d.a);
            // 枠外に出るラベルは描画しない
            if (lx < 4 || lx > 80 || ly < 4 || ly > 80) continue;
            ctx.fillStyle = d.col;
            ctx.fillText(d.t, lx, ly);
        }

        // 中心点
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ccddee';
        ctx.fill();
    }

    _setupControls() {
        const el = this.renderer.domElement;

        // destroy() で window 側リスナーを一括解除するための AbortController。
        // el (renderer.domElement) 側は canvas ごと破棄されるが、同じ signal に統一しておく。
        this._listenerAbort = new AbortController();
        const signal = this._listenerAbort.signal;

        // ─── リサイズ対応 ─────────────────────────────────────────────
        window.addEventListener('resize', () => this.handleResize(), { signal });

        // ─── 回転（左ドラッグ）─────────────────────────────────────────────
        const orbitBy = (dx, dy) => {
            // 右ドラッグ → カメラが右へ周回（直感的なターンテーブル回転）
            this.spherical.theta += dx * 0.006;
            this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi + dy * 0.006));
            this._updateCamera();
        };

        // ─── パン（右ドラッグ / 中ボタンドラッグ）────────────────────────────
        // カメラのローカル右・上ベクトルでターゲットを移動（掴んで動かす感覚）
        const panBy = (dx, dy) => {
            // キャンバスの高さ基準で1pxあたりの移動量を決める（距離に比例）
            const speed = this.spherical.radius * 0.006;
            const { theta, phi } = this.spherical;
            // カメラ右方向（水平）
            const rx =  Math.cos(theta);
            const rz = -Math.sin(theta);
            // カメラ上方向（ティルト考慮）
            const ux =  Math.sin(theta) * Math.cos(phi);
            const uy = -Math.sin(phi);
            const uz =  Math.cos(theta) * Math.cos(phi);
            // drag right → scene right → target left (-dx)
            // drag down  → scene down  → target up   (-dy、uyが負なので打ち消し合いに注意)
            this.target.x += (-dx * rx - dy * ux) * speed;
            this.target.y += (-dy * uy) * speed;  // uy<0 なので -dy*uy = dy*sin(phi) > 0 when dy>0 ✓
            this.target.z += (-dx * rz - dy * uz) * speed;
            this._updateCamera();
        };

        // dragMode: 'orbit' | 'pan' | 'click' | null
        let dragMode = null;
        let prevMouse = { x: 0, y: 0 };
        let _mouseDownAt = { x: 0, y: 0 };
        let _dragMoved = false;

        el.addEventListener('mousedown', (e) => {
            prevMouse = { x: e.clientX, y: e.clientY };
            _mouseDownAt = { x: e.clientX, y: e.clientY };
            _dragMoved = false;
            if (e.button === 0) {
                if (e.altKey) {
                    // Alt+左: 建造物をX軸方向にドラッグ移動
                    dragMode = 'pan-x';
                    this._altDragRaycast(e, 'x');
                } else {
                    // 左: Shift押しなら選択待ち、それ以外は回転
                    dragMode = e.shiftKey ? 'click' : 'orbit';
                }
            } else if (e.button === 2) {
                if (e.altKey) {
                    // Alt+右: 建造物をZ軸方向にドラッグ移動
                    dragMode = 'pan-z';
                    this._altDragRaycast(e, 'z');
                } else {
                    // 右: Shift押しなら範囲選択待ち、それ以外はパン
                    dragMode = e.shiftKey ? 'range-click' : 'pan';
                }
            } else if (e.button === 1) {
                // 中ドラッグ → パン
                dragMode = 'pan';
            }
            e.preventDefault();
        }, { signal });
        window.addEventListener('mousemove', (e) => {
            if (!dragMode) return;
            const dx = e.clientX - prevMouse.x;
            const dy = e.clientY - prevMouse.y;
            if (Math.abs(e.clientX - _mouseDownAt.x) > 4 || Math.abs(e.clientY - _mouseDownAt.y) > 4) {
                _dragMoved = true;
            }
            if (dragMode === 'orbit') orbitBy(dx, dy);
            else if (dragMode === 'pan') panBy(dx, dy);
            else if (dragMode === 'pan-x') {
                // Alt+左ドラッグ: 建造物をX軸方向に移動（app.js コールバックへ委譲）
                if (this.onAltDragMove) this.onAltDragMove({ axis: 'x', dx });
            } else if (dragMode === 'pan-z') {
                // Alt+右ドラッグ: 建造物をZ軸方向に移動（app.js コールバックへ委譲）
                if (this.onAltDragMove) this.onAltDragMove({ axis: 'z', dx });
            }
            prevMouse = { x: e.clientX, y: e.clientY };
        }, { signal });
        window.addEventListener('mouseup', (e) => {
            // Alt+ドラッグ終了 → 構造ハイライト解除
            if (dragMode === 'pan-x' || dragMode === 'pan-z') {
                if (this.onAltDragEnd) this.onAltDragEnd();
            }
            // 左クリック → ブロック選択（Shift時は移動制限しているので多少の動きを許容）
            else if (dragMode === 'click' && e.button === 0) {
                if (!_dragMoved || e.shiftKey) this._handleClick(e, false);
            }
            // 右クリック → 範囲選択（Shift時は移動制限しているので多少の動きを許容）
            else if (dragMode === 'range-click' && e.button === 2) {
                this._handleClick(e, true);
            }
            dragMode = null;
        }, { signal });
        // ウィンドウ外でマウスを離すと mouseup が届かないため、フォーカス喪失時に
        // ドラッグ状態を強制解除する (Alt+ドラッグのハイライト残留・移動継続を防止)
        window.addEventListener('blur', () => {
            if (dragMode === 'pan-x' || dragMode === 'pan-z') {
                if (this.onAltDragEnd) this.onAltDragEnd();
            }
            dragMode = null;
        }, { signal });
        // 右クリックメニューを抑制
        el.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });

        // ─── ズーム（ホイール）────────────────────────────────────────────
        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.spherical.radius = Math.max(2, Math.min(500, this.spherical.radius * (e.deltaY > 0 ? 1.1 : 0.9)));
            this._updateCamera();
        }, { passive: false, signal });

        // ─── タッチ操作（スマホ・タブレット）────────────────────────────────
        let touches = [];
        let prevPinchDist = null;
        el.addEventListener('touchstart', (e) => {
            touches = Array.from(e.touches);
            prevPinchDist = null;
            e.preventDefault();
        }, { passive: false, signal });
        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = Array.from(e.touches);
            if (t.length === 1 && touches.length === 1) {
                // 1本指: 回転
                orbitBy(t[0].clientX - touches[0].clientX, t[0].clientY - touches[0].clientY);
            } else if (t.length === 2 && touches.length === 2) {
                // 2本指: ピンチでズーム
                const dist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
                if (prevPinchDist !== null) {
                    const ratio = prevPinchDist / dist;
                    this.spherical.radius = Math.max(2, Math.min(500, this.spherical.radius * ratio));
                    this._updateCamera();
                }
                prevPinchDist = dist;
                // 2本指の中点移動でパン
                const cx = (t[0].clientX + t[1].clientX) / 2;
                const cy = (t[0].clientY + t[1].clientY) / 2;
                const pcx = (touches[0].clientX + touches[1].clientX) / 2;
                const pcy = (touches[0].clientY + touches[1].clientY) / 2;
                panBy(cx - pcx, cy - pcy);
            }
            touches = t;
        }, { passive: false, signal });
        el.addEventListener('touchend', (e) => { touches = Array.from(e.touches); prevPinchDist = null; }, { passive: false, signal });
    }

    /** Alt+ドラッグ開始時にクリックしたブロックをレイキャストしてコールバックを呼ぶ */
    _altDragRaycast(e, axis) {
        if (!this.onAltDragStart || !this.meshes.length) return;
        const THREE = window.THREE;
        if (!THREE) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width)  * 2 - 1,
           -((e.clientY - rect.top)  / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const hits = raycaster.intersectObjects(this.meshes);
        const coord = hits.length > 0
            ? (hits[0].object.userData.instanceCoords?.[hits[0].instanceId] ?? null)
            : null;
        this.onAltDragStart({ coord, axis });
    }

    _updateCamera() {
        const { theta, phi, radius } = this.spherical;
        const x = radius * Math.sin(phi) * Math.sin(theta) + this.target.x;
        const y = radius * Math.cos(phi) + this.target.y;
        const z = radius * Math.sin(phi) * Math.cos(theta) + this.target.z;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);
    }

    _animate() {
        // destroy() 後はループを止める (renderer は null になっているため)。
        // ※ isInitialized は使わない — 初回の _animate は init() が完了する前に
        //   _setupScene() から呼ばれるため、isInitialized 判定だと起動できない。
        if (!this.renderer) { this._rafId = null; return; }
        this._rafId = requestAnimationFrame(() => this._animate());
        // マルチハイライトのパルスアニメーション (デフォルト無効 — pulseHighlight=true で有効化)
        if (this.pulseHighlight && this._highlightedBlockIds.size > 0 && this.meshes.length > 0) {
            // ハイライト対象 mesh は毎フレーム filter せずキャッシュ
            // _highlightedBlockIds 変更 or mesh 再生成のたびに setHighlightBlocks() でリセットされる
            if (!this._pulseTargetMeshes) {
                this._pulseTargetMeshes = this.meshes.filter(m =>
                    m.instanceColor && m.userData.blockId &&
                    this._highlightedBlockIds.has(m.userData.blockId.toLowerCase())
                );
            }
            if (this._pulseTargetMeshes.length > 0) {
                const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 400);
                const r = 0.1, g = pulse, b = pulse;
                // setColorAt のループは関数呼び出しオーバーヘッドが大きいため、
                // 内部の typed array に直接書き込む (3要素/インスタンス、float32)
                for (const mesh of this._pulseTargetMeshes) {
                    const arr = mesh.instanceColor.array;
                    const n = mesh.count * 3;
                    for (let i = 0; i < n; i += 3) {
                        arr[i] = r; arr[i + 1] = g; arr[i + 2] = b;
                    }
                    mesh.instanceColor.needsUpdate = true;
                }
            }
        }
        this.renderer.render(this.scene, this.camera);
        this._drawCompass();
    }

    loadStructure(coords, size, options = {}) {
        if (!this.isInitialized) return;
        const THREE = window.THREE;
        const { yMin = 0, yMax = 999, xMin = 0, xMax = 9999, zMin = 0, zMax = 9999, colorMode, autoFocus = true } = options;
        if (colorMode) this.colorMode = colorMode;
        this._lastCoords = coords; this._lastSize = size; this._lastOptions = { yMin, yMax, xMin, xMax, zMin, zMax };
        this._pulseTargetMeshes = null; // mesh 再生成のため、パルスキャッシュ無効化

        // ─── near/far は size が変わるたびに常に更新（autoFocus 不問） ──────────
        if (size && size.x !== undefined) {
            const maxDim = Math.max(size.x, size.y, size.z);
            // ドラッグ後に構造が far クリップ外に消えないよう十分な余裕を取る
            const newFar = Math.max(500, maxDim * 12);
            if (newFar !== this.camera.far) {
                this.camera.near = Math.max(0.1, maxDim * 0.001);
                this.camera.far  = newFar;
                this.camera.updateProjectionMatrix();
            }
        }

        // ─── オートフォーカス（注視点と距離の自動調整） ───────────────────────
        if (autoFocus && size && size.x !== undefined) {
            // 中心を注視点に
            this.target.x = size.x / 2;
            this.target.y = size.y / 2;
            this.target.z = size.z / 2;
            // 最大辺の約1.5倍の距離を確保
            const maxDim = Math.max(size.x, size.y, size.z);
            this.spherical.radius = Math.max(10, maxDim * 1.5);
            // 平面構造判定: y が x/z の 1/5 未満 → 上方視点に寄せる
            const isFlat = size.y < size.x / 5 && size.y < size.z / 5;
            this.spherical.phi = isFlat ? 0.22 : 0.8;
            this._updateCamera();
        }

        if (!this.blockManager) {
            this.blockManager = new BlockInstancingManager(this.scene, window.THREE);
        }

        // 状態の変化に応じてキャッシュとマネージャーをクリアする
        const isSameStructure = (this._lastCoords === coords);
        if (options.forceReload || !isSameStructure) {
            this.blockManager.disposeAll();
            this._matCache.clear();
        } else if (options.colorMode && this.colorMode !== options.colorMode) {
            // colorMode のみ変わった場合もマテリアル再構築が必要
            this.blockManager.disposeAll();
            this._matCache.clear();
        }

        // 次の描画のために配置数をリセット
        this.blockManager.clearInstances();

        // ─── 1-pass: filter + blockMap + visiblePosSet + opaquePosSet 同時構築 ─
        // 数値キー (15 bit/axis = 32768 範囲、±16384) で string concat を排除
        const POS_OFFSET = 16384, POS_RANGE = 32768, POS_RANGE2 = POS_RANGE * POS_RANGE;
        const encodePos = (x, y, z) =>
            (x + POS_OFFSET) * POS_RANGE2 + (y + POS_OFFSET) * POS_RANGE + (z + POS_OFFSET);

        const filtered = [];
        const blockMap = new Map();      // numeric key → coord
        const visiblePosSet = new Set(); // numeric keys
        const opaquePosSet = new Set();
        for (const c of coords) {
            const k = encodePos(c.x, c.y, c.z);
            blockMap.set(k, c);
            const inRange = c.y >= yMin && c.y <= yMax
                         && c.x >= xMin && c.x <= xMax
                         && c.z >= zMin && c.z <= zMax;
            if (!inRange) continue;
            const bid = c.blockId.toLowerCase();
            if (bid === 'minecraft:air' || bid === 'air') continue;
            filtered.push(c);
            visiblePosSet.add(k);
            if (!_isTransparent(c.blockId)) opaquePosSet.add(k);
        }
        if (filtered.length === 0) return;

        /** 座標 (x,y,z) のブロックを取得 */
        const getBlock = (x, y, z) => blockMap.get(encodePos(x, y, z)) || null;

        /** 周囲が不透過ブロックで囲まれているか判定（カリング用） */
        const isOccluded = (x, y, z) => opaquePosSet.has(encodePos(x, y, z));

        // ─── 形状シグネチャでグループ化（同一形状をまとめて InstancedMesh へ）
        // 階段はコーナー形状が隣接依存なので、シグネチャに隣接情報も含める
        // visualHints (facing/face) は per-instance Matrix4 で扱うため sig には含めない
        // dust の接続パターンは形状が変わるので sig に含める
        const groups = new Map();
        // visualHints は coord ごとに必要なので、Map<coord-ref, hints> でキャッシュ
        const coordHints = new WeakMap();
        for (const c of filtered) {
            // 全方位が「現在表示されている不透過ブロック」に囲まれているなら、そのブロック自体を描画しない
            // （ただし透過ブロックは常に描画）
            const trans = _isTransparent(c.blockId);
            if (!trans &&
                isOccluded(c.x + 1, c.y, c.z) && isOccluded(c.x - 1, c.y, c.z) &&
                isOccluded(c.x, c.y + 1, c.z) && isOccluded(c.x, c.y - 1, c.z) &&
                isOccluded(c.x, c.y, c.z + 1) && isOccluded(c.x, c.y, c.z - 1)
            ) {
                continue; // 完全に隠れているので描画スキップ
            }

            // フェンス/壁/ペイン用の接続フラグ（これは「現在表示されているか」で判定）
            const neighbors = {
                n: visiblePosSet.has(encodePos(c.x,     c.y, c.z - 1)),
                s: visiblePosSet.has(encodePos(c.x,     c.y, c.z + 1)),
                w: visiblePosSet.has(encodePos(c.x - 1, c.y, c.z)),
                e: visiblePosSet.has(encodePos(c.x + 1, c.y, c.z))
            };

            // 階段コーナー判定用の隣接ブロック情報（blockId + states 付き）
            const neighborBlocks = {
                n: getBlock(c.x,     c.y, c.z - 1),
                s: getBlock(c.x,     c.y, c.z + 1),
                w: getBlock(c.x - 1, c.y, c.z),
                e: getBlock(c.x + 1, c.y, c.z)
            };

            const neighborSig = `|n${neighbors.n?1:0}s${neighbors.s?1:0}w${neighbors.w?1:0}e${neighbors.e?1:0}`;
            let stairCornerSig = '';

            // Redstone 関連の visual hints を取得
            let hints = getVisualHints(c.blockId, c.states);
            let dustSig = '';
            let effectiveStates = c.states;
            let repeaterSig = '';
            let comparatorSig = '';
            let redstoneStateSig = '';
            let hopperSig = '';
            if (c.blockId === 'minecraft:redstone_wire') {
                // 接続フラグを計算 (完全 MC 準拠)
                const conn = computeWireConnections(c, getBlock);
                const code = encodeConnections(conn);
                dustSig = `|d${code}`;
                // 接続情報を states にコピー (builder が読む)
                effectiveStates = { ...(c.states || {}), __dust_conn: conn };
                hints = { ...(hints || {}), connections: conn };
            } else if (
                c.blockId === 'minecraft:repeater' ||
                c.blockId === 'minecraft:unpowered_repeater' ||
                c.blockId === 'minecraft:powered_repeater'
            ) {
                // リピーター: delay 1..4 を states と sig に注入 (前トーチ位置が変わる)
                const delay = hints?.delay ?? 1;
                const powered = hints?.powered === true;
                repeaterSig = `|del${delay}|pow${powered ? 1 : 0}`;
                effectiveStates = { ...(c.states || {}), __repeater_delay: delay, powered };
            } else if (
                c.blockId === 'minecraft:comparator' ||
                c.blockId === 'minecraft:unpowered_comparator' ||
                c.blockId === 'minecraft:powered_comparator'
            ) {
                // コンパレーター: subtract モードを states と sig に注入
                // (subtract モードは back torch を高く描く)
                const subtract = hints?.mode === 'subtract';
                const powered = hints?.powered === true;
                comparatorSig = `|m${subtract ? 's' : 'c'}|pow${powered ? 1 : 0}`;
                effectiveStates = { ...(c.states || {}), __comparator_subtract: subtract, powered };
            } else if (c.blockId === 'minecraft:observer') {
                const powered = hints?.powered === true;
                redstoneStateSig = `|pow${powered ? 1 : 0}`;
                effectiveStates = { ...(c.states || {}), powered };
            } else if (
                c.blockId === 'minecraft:piston' ||
                c.blockId === 'minecraft:sticky_piston'
            ) {
                const extended = hints?.extended === true;
                redstoneStateSig = `|ext${extended ? 1 : 0}`;
                effectiveStates = { ...(c.states || {}), extended };
            } else if (
                c.blockId === 'minecraft:redstone_torch' ||
                c.blockId === 'minecraft:lit_redstone_torch' ||
                c.blockId === 'minecraft:unlit_redstone_torch' ||
                c.blockId === 'minecraft:redstone_wall_torch'
            ) {
                const lit = c.blockId !== 'minecraft:unlit_redstone_torch'
                    && hints?.lit !== false;
                redstoneStateSig = `|lit${lit ? 1 : 0}`;
                effectiveStates = { ...(c.states || {}), lit };
                if (hints?.face === 'wall') {
                    effectiveStates.__torch_face = 'wall';
                    hints = { ...hints, face: null };
                }
            } else if (
                c.blockId === 'minecraft:redstone_lamp' ||
                c.blockId === 'minecraft:lit_redstone_lamp'
            ) {
                const stateLit = c.states?.lit ?? c.states?.['minecraft:lit']
                    ?? c.states?.powered ?? c.states?.['minecraft:powered'];
                const lit = c.blockId === 'minecraft:lit_redstone_lamp'
                    || stateLit === true || stateLit === 1
                    || stateLit === '1' || stateLit === 'true';
                redstoneStateSig = `|lit${lit ? 1 : 0}`;
                effectiveStates = { ...(c.states || {}), lit };
            } else if (classifyShape(c.blockId, c.states) === 'torch') {
                if (hints?.face === 'wall') {
                    effectiveStates = { ...(c.states || {}), __torch_face: 'wall' };
                    hints = { ...hints, face: null };
                }
            } else if (classifyShape(c.blockId, c.states) === 'stairs') {
                const facing = hints?.facing ?? readOrientation(c.blockId, c.states)?.facing ?? 'north';
                const half = _stairHalf(c.states);
                const getNeighborByDirection = (direction) => {
                    const delta = {
                        north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
                    }[direction];
                    const neighbor = getBlock(c.x + delta[0], c.y, c.z + delta[1]);
                    if (!neighbor || classifyShape(neighbor.blockId, neighbor.states) !== 'stairs') return null;
                    const neighborOrientation = readOrientation(neighbor.blockId, neighbor.states);
                    return { isStairs: true, facing: neighborOrientation?.facing ?? 'north', half: _stairHalf(neighbor.states) };
                };
                const stairShape = c.states?.shape ?? computeStairsShape(facing, half, getNeighborByDirection);
                stairCornerSig = `|sh=${stairShape}`;
                effectiveStates = { ...(c.states || {}), __stair_shape: stairShape };
                hints = { ...(hints || {}), facing };
            } else if (c.blockId === 'minecraft:hopper') {
                // down 判定は readOrientation 経由の hints に任せる (NBT wrap {value} や
                // minecraft: プレフィックスを解決済み)。横4方向のときだけ facing が入る。
                const isDown = !hints?.facing;
                if (isDown) effectiveStates = { ...(c.states || {}), __hopper_down: true };
                hopperSig = isDown ? '|hd' : '|hs';
            }

            const structureSig = c.structureId ? `|sid=${c.structureId}` : '';
            const sig = _shapeSignature(c.blockId, c.states) + neighborSig + stairCornerSig +
                dustSig + repeaterSig + comparatorSig + redstoneStateSig + hopperSig + structureSig;

            // 後段 (addBlockInstance) で coord → hints を引けるよう保存
            if (hints) coordHints.set(c, hints);

            if (!groups.has(sig)) {
                groups.set(sig, {
                    blockId: c.blockId, rawId: c.rawId, states: effectiveStates,
                    neighbors, neighborBlocks, structureId: c.structureId ?? null, list: []
                });
            }
            groups.get(sig).list.push(c);
        }

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const mat4 = new THREE.Matrix4();

        // テクスチャ統計の初期化
        this.textureStats = { success: 0, missing: 0, missingIds: new Set() };
        
        const hlColor = new THREE.Color(0xffff00); // 黄色でハイライト
        const normalColor = new THREE.Color(0xffffff);
        const wireScratchColor = new THREE.Color(); // redstone_wire の per-instance 色用

        for (const [sig, grp] of groups.entries()) {
            const { blockId, rawId, states, neighbors, neighborBlocks, structureId, list } = grp;
            const requiredInstances = list.length;

            const isGrass = _isGrassBlock(blockId) && this.colorMode === 'realtexture';
            const isRedstoneWire = (blockId === 'minecraft:redstone_wire');
            const isRedstoneTorch = (blockId === 'minecraft:redstone_torch'
                                  || blockId === 'minecraft:lit_redstone_torch'
                                  || blockId === 'minecraft:unlit_redstone_torch'
                                  || blockId === 'minecraft:redstone_wall_torch');

            let geo = boxGeo;
            try {
                // resolveGeometry に neighborBlocks を渡してコーナー階段を有効化
                const customGeo = resolveGeometry(
                    THREE, blockId, states || {}, neighbors || {}, neighborBlocks || null
                );
                if (customGeo?.attributes?.position?.count > 0) geo = customGeo;
            } catch (err) {
                console.warn(`resolveGeometry error [${blockId}]:`, err);
            }

            // 統計の更新
            const isReal = (this.colorMode === 'realtexture');
            if (isReal) {
                const urls = getFaceUrls(blockId, { rawId, states });
                if (urls && urls.found) {
                    this.textureStats.success += list.length;
                } else {
                    this.textureStats.missing += list.length;
                    this.textureStats.missingIds.add(blockId);
                }
            }

            // インスタンスを追加
            const isHighlighted = (this._highlightedBlockId === blockId);

            if (isGrass) {
                // 1. 土ベース（内側の不透明な土ブロック）
                const matBase = this._buildMaterial(THREE, blockId, rawId, states, 'base');
                this.blockManager.registerBlockType(sig + '_base', geo, matBase, blockId, requiredInstances, structureId);

                // 2. 草オーバーレイ（外側の透過テクスチャ）
                const matOverlay = this._buildMaterial(THREE, blockId, rawId, states, 'overlay');
                const overlayGeo = geo.clone();
                overlayGeo.scale(1.001, 1.001, 1.001); // 0.001だけ大きくしてZファイティング防止
                this.blockManager.registerBlockType(sig + '_overlay', overlayGeo, matOverlay, blockId, requiredInstances, structureId);

                for (let i = 0; i < list.length; i++) {
                    const hints = coordHints.get(list[i]) || null;
                    this.blockManager.addBlockInstance(sig + '_base', list[i], isHighlighted, normalColor, hlColor, hints);
                    this.blockManager.addBlockInstance(sig + '_overlay', list[i], isHighlighted, normalColor, hlColor, hints);
                }
            } else {
                const mat = this._buildMaterial(THREE, blockId, rawId, states, 'all');
                // マネージャーにブロックタイプを登録（容量不足時は自動拡張）
                this.blockManager.registerBlockType(sig, geo, mat, blockId, requiredInstances, structureId);
                for (let i = 0; i < list.length; i++) {
                    const hints = coordHints.get(list[i]) || null;
                    // Redstone Wire: 信号レベルに応じた赤の濃淡 (per-instance color)
                    // MC は power=0 で非常に暗いが、planner ツールでは視認性のため底上げ。
                    let instColor = normalColor;
                    if (isRedstoneWire) {
                        const power = list[i].states?.redstone_signal ?? 0;
                        const p = Math.max(0, Math.min(15, power)) / 15;
                        const intensity = 0.55 + p * 0.45; // 0.55..1.00
                        wireScratchColor.setRGB(intensity, intensity * 0.15, intensity * 0.08);
                        instColor = wireScratchColor;
                    } else if (isRedstoneTorch && this.colorMode !== 'realtexture') {
                        // 点灯: 鮮やかな赤 / 消灯: 暗い赤
                        const lit = (hints?.lit !== false) && (blockId !== 'minecraft:unlit_redstone_torch');
                        if (lit) wireScratchColor.setRGB(1.0, 0.25, 0.20);
                        else     wireScratchColor.setRGB(0.45, 0.10, 0.10);
                        instColor = wireScratchColor;
                    }
                    this.blockManager.addBlockInstance(sig, list[i], isHighlighted, instColor, hlColor, hints);
                }
            }
        }
        
        // 最後にGPUへ変更を通知
        this.blockManager.updateAll();
        // 既存の互換性のため meshes 配列を更新
        this.meshes = this.blockManager.getMeshes();
    }

    /** 特定のブロックタイプをハイライトする */
    highlightBlock(blockId) {
        if (!this.isInitialized) return;
        const THREE = window.THREE;
        this._highlightedBlockId = blockId;
        
        const hlColor = new THREE.Color(0xffff00); // 黄色
        const normalColor = new THREE.Color(0xffffff);

        for (const mesh of this.meshes) {
            if (!mesh.instanceColor) continue;
            const isTarget = (mesh.userData.blockId === blockId);
            for (let i = 0; i < mesh.count; i++) {
                mesh.setColorAt(i, isTarget ? hlColor : normalColor);
            }
            mesh.instanceColor.needsUpdate = true;
        }
    }

    /**
     * 複数ブロックIDをハイライト
     * @param {string[]} ids - minecraft:xxx 形式のブロックID配列（空で解除）
     * @param {object} [opts]
     * @param {boolean} [opts.pulse] - 指定された場合 this.pulseHighlight を上書き
     */
    setHighlightBlocks(ids, opts = {}) {
        this._highlightedBlockIds = new Set(ids.map(id => id.toLowerCase()));
        if (opts.pulse !== undefined) this.pulseHighlight = opts.pulse;
        this._pulseTargetMeshes = null; // パルス対象キャッシュ無効化
        if (!this.isInitialized) return;
        const THREE = window.THREE;
        const normalColor = new THREE.Color(1, 1, 1);
        // 静的水色（pulse OFF のときの仕上げ色）
        const staticHlColor = new THREE.Color(0.1, 0.85, 1.0);

        for (const mesh of this.meshes) {
            if (!mesh.instanceColor || !mesh.userData.blockId) continue;
            const isHl = this._highlightedBlockIds.has(mesh.userData.blockId.toLowerCase());
            if (isHl && !this.pulseHighlight) {
                // パルスOFF: 一度だけ静的な水色で塗る
                for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, staticHlColor);
                mesh.instanceColor.needsUpdate = true;
            } else if (!isHl) {
                // ハイライト解除されたブロックは白に戻す
                for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, normalColor);
                mesh.instanceColor.needsUpdate = true;
            }
            // isHl && pulseHighlight の場合は _animate() がフレーム毎に上書き
        }
    }

    /** 現在ハイライトされているブロックIDを取得 */
    getHighlighted() {
        return this._highlightedBlockId;
    }

    /** ハイライトを解除 */
    clearSelectionIndicator() {
        this.highlightBlock(null);
    }

    /** カメラを初期位置にリセット（オートフォーカスを再適用） */
    resetCamera() {
        if (this._lastSize) {
            const size = this._lastSize;
            this.target.x = size.x / 2;
            this.target.y = size.y / 2;
            this.target.z = size.z / 2;
            const maxDim = Math.max(size.x, size.y, size.z);
            this.spherical.radius = Math.max(10, maxDim * 1.5);
            this.spherical.theta = 0.5;
            const isFlat = size.y < size.x / 5 && size.y < size.z / 5;
            this.spherical.phi = isFlat ? 0.22 : 0.8;
            this._updateCamera();
        }
    }

    /**
     * マテリアルを生成する
     * 修正点:
     *   1. ガラス系: transparent=true, alphaTest=0.1 を必ず設定
     *   2. 草ブロック: 上面グレースケール画像にバイオームカラーを乗算
     *   3. 葉っぱ・ツタ: バイオームカラーを乗算
     *   4. 草ブロック側面: alphaTest を設定して黒つぶれ防止
     */
    _buildMaterial(THREE, blockId, rawId, states, layer = 'all') {
        const stateSig = states
            ? Object.entries(states).map(([k, v]) => `${k}=${v}`).sort().join(',')
            : '';
        const cacheKey = this.colorMode + '::' + blockId + '|' + (rawId || '') + '|' + stateSig + '|' + layer;
        if (this._matCache.has(cacheKey)) return this._matCache.get(cacheKey);

        // wire/repeater/comparator は colorMode に関わらず常に専用の様式化マテリアル
        // (色分け) でレンダリングする。実テクスチャだとトーチ位置・配線が分かりにくく
        // なりがちなので、回路の視認性を最優先する (ユーザー要望)。
        if (isMaterialRedstoneDevice(blockId)) {
            const colors = getRedstoneMaterialColors(blockId, states);
            const invisible = new THREE.MeshBasicMaterial({ visible: false });
            if (blockId.replace(/^minecraft:/, '') === 'redstone_wire') {
                const dot = new THREE.MeshLambertMaterial({ color: colors.dust });
                const line = new THREE.MeshLambertMaterial({ color: colors.line });
                const arr = [invisible, invisible, dot, invisible, invisible, invisible, line, invisible];
                this._matCache.set(cacheKey, arr);
                return arr;
            }

            const side = new THREE.MeshLambertMaterial({ color: colors.side });
            const top = new THREE.MeshLambertMaterial({ color: colors.top });
            const bottom = new THREE.MeshLambertMaterial({ color: colors.bottom });
            const torch = new THREE.MeshLambertMaterial({
                color: colors.torch,
                emissive: colors.emissive,
            });
            const circuit = new THREE.MeshLambertMaterial({
                color: colors.circuit,
                emissive: colors.emissive,
            });
            // index 9 = リピーターの方向矢印 (黒) — top 面に描いて入力/出力の向きを示す
            const arrow = new THREE.MeshLambertMaterial({ color: colors.arrow ?? 0x1a1a1a });
            // index 10 = コンパレーターの mode マーカー (compare=赤 / subtract=紫)
            const modeMarker = new THREE.MeshLambertMaterial({
                color: colors.modeColor ?? colors.torch,
                emissive: colors.modeEmissive ?? colors.emissive,
            });
            const arr = [side, side, top, bottom, side, side, torch, circuit, invisible, arrow, modeMarker];
            this._matCache.set(cacheKey, arr);
            return arr;
        }

        // Redstone wire / torch: 白マテリアルにして per-instance 色 (赤の濃淡) を素直に出す
        if (this.colorMode !== 'realtexture' && (
            blockId === 'minecraft:redstone_wire' ||
            blockId === 'minecraft:redstone_torch' ||
            blockId === 'minecraft:lit_redstone_torch' ||
            blockId === 'minecraft:unlit_redstone_torch' ||
            blockId === 'minecraft:redstone_wall_torch')) {
            const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
            this._matCache.set(cacheKey, mat);
            return mat;
        }

        // Repeater/Comparator + 方向性キューブ系: index 6 にマーカーマテリアル
        // (実テクスチャは既存パイプライン経由で取得し、index 6 を append する)
        const isPistonLike =
            blockId === 'minecraft:piston' || blockId === 'minecraft:sticky_piston';
        const isObserverLike = blockId === 'minecraft:observer';
        const isDispenserLike =
            blockId === 'minecraft:dispenser' || blockId === 'minecraft:dropper' ||
            blockId === 'minecraft:crafter';
        const isRepeaterLike =
            blockId === 'minecraft:repeater' || blockId === 'minecraft:unpowered_repeater' ||
            blockId === 'minecraft:powered_repeater';
        const isComparatorLike =
            blockId === 'minecraft:comparator' || blockId === 'minecraft:unpowered_comparator' ||
            blockId === 'minecraft:powered_comparator';
        const isRedstoneDust = blockId === 'minecraft:redstone_wire';
        const isDirectional = isPistonLike || isObserverLike || isDispenserLike ||
                              isRepeaterLike || isComparatorLike;
        const isPoweredDevice =
            blockId === 'minecraft:powered_repeater' ||
            blockId === 'minecraft:powered_comparator' ||
            states?.powered === true || states?.powered === 1 ||
            states?.powered === '1' || states?.powered === 'true';
        const _getMarkerMat = () => {
            let markerColor = 0x303030;
            if (isPistonLike) {
                markerColor = (blockId === 'minecraft:sticky_piston') ? 0x4ac74a : 0xc89060;
            } else if (isObserverLike) {
                markerColor = 0xff3030;
            } else if (isDispenserLike) {
                markerColor = 0x202020;
            } else if (isRepeaterLike || isComparatorLike) {
                // リピーター/コンパレーターのトーチは赤
                markerColor = isPoweredDevice ? 0xff3030 : 0x6a1414;
            }
            const opts = { color: markerColor };
            if (isRepeaterLike || isComparatorLike) {
                opts.emissive = isPoweredDevice ? 0x661414 : 0x000000;
            }
            return new THREE.MeshLambertMaterial(opts);
        };

        const shape = classifyShape(blockId, states);
        const alphaMode = getTextureAlphaMode(blockId, layer);
        const isGrassBlock = _isGrassBlock(blockId);
        const biomeTint = getBiomeTint(blockId);

        if (this.colorMode === 'realtexture') {
            const loaded = packIsLoaded();
            if (!loaded) {
                console.warn(`      -> Viewer3D: [${blockId}] realtexture skip (packIsLoaded is false)`);
            } else {
                const urls = getFaceUrls(blockId, { rawId, states });
                if (urls && urls.found) {
                    const loader = new THREE.TextureLoader();

                    /**
                     * 1枚のテクスチャ面からマテリアルを生成する
                     * @param {object|string|null} faceObj - { url, tint } または URL 文字列
                     * @param {string} faceName - デバッグ用面名
                     * @param {boolean} forceGrassTint - 草ブロックのグレースケール面にバイオームカラーを強制適用
                     */
                    const mkMat = (faceObj, faceName, forceGrassTint = false) => {
                        // grass block base layer -> always use bottom texture (dirt)
                        if (layer === 'base' && isGrassBlock) {
                            faceObj = urls.bottom;
                            forceGrassTint = false;
                        }

                        // grass block overlay layer bottom -> totally invisible
                        if (layer === 'overlay' && isGrassBlock && faceName === 'bottom') {
                            return new THREE.MeshBasicMaterial({ visible: false });
                        }

                        const url = faceObj?.url || (typeof faceObj === 'string' ? faceObj : null);
                        if (!url) {
                            console.warn(`         -> No URL for face [${faceName}] of [${blockId}]`);
                            return new THREE.MeshLambertMaterial({ color: 0x888888 });
                        }
                        let tex = this._textureCache.get(url);
                        if (!tex) {
                            tex = loader.load(url, (t) => {
                                // Animated strips use the first frame only.
                                if (t.image && t.image.height > t.image.width) {
                                    const numFrames = Math.floor(t.image.height / t.image.width);
                                    t.repeat.set(1, 1 / numFrames);
                                    t.offset.y = (numFrames - 1) / numFrames;
                                    t.generateMipmaps = false;
                                    t.minFilter = THREE.NearestFilter;
                                    t.wrapT = THREE.ClampToEdgeWrapping;
                                }
                                t.needsUpdate = true;
                            });
                            tex.magFilter = THREE.NearestFilter;
                            tex.minFilter = THREE.NearestMipmapNearestFilter || THREE.NearestFilter;
                            tex.anisotropy = Math.min(
                                4,
                                this.renderer?.capabilities?.getMaxAnisotropy?.() || 1
                            );
                            if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
                            this._textureCache.set(url, tex);
                        }

                        // ─── マテリアル設定 ──────────────────────────────
                        const matOpts = {
                            map: tex,
                            ...getTextureMaterialOptions(blockId, layer),
                        };

                        const m = new THREE.MeshLambertMaterial(matOpts);

                        // ③ カラー（バイオームtint）の適用
                        //   優先度: faceObj.tint > forceGrassTint > biomeTint
                        let tintColor = null;
                        if (faceObj?.tint) {
                            tintColor = faceObj.tint;
                        } else if (forceGrassTint && biomeTint !== null) {
                            // 草ブロック上面・側面オーバーレイ面: バイオームカラーを乗算
                            tintColor = biomeTint;
                        } else if (biomeTint !== null && !isGrassBlock) {
                            // 葉っぱ・ツタなどは全面にバイオームカラーを乗算
                            tintColor = biomeTint;
                        }
                        if (tintColor !== null) {
                            m.color = new THREE.Color(tintColor);
                        }
                        return m;
                    };

                    // M-V-1: 方向性ブロック (piston/observer/dispenser/repeater/comparator) も 6 面テクスチャを使う
                    const multiMatShapes = ['cube', 'hopper', 'anvil', 'scaffolding', 'stairs', 'slab', 'lantern', 'campfire', 'bed', 'flower_pot', 'ladder', 'shelf', 'hanging_sign', 'redstone_dust', 'piston', 'observer', 'dispenser', 'repeater', 'comparator'];
                    if (multiMatShapes.includes(shape)) {
                        // 草ブロックの各面に対してバイオームカラーを適切に適用
                        const applyGrassTint = (face) => {
                            if (!isGrassBlock) return false;
                            if (layer === 'overlay') return face !== 'bottom'; // オーバーレイは上面と側面に適用
                            if (layer === 'base') return false; // 土台には適用しない
                            return face === 'top';
                        };
                        const arr = [
                            mkMat(urls.east,   'east',   applyGrassTint('east')),
                            mkMat(urls.west,   'west',   applyGrassTint('west')),
                            mkMat(
                                (isRepeaterLike || isComparatorLike) ? (urls.baseTop || urls.top) : urls.top,
                                'top',
                                applyGrassTint('top')
                            ),
                            mkMat(urls.bottom, 'bottom', applyGrassTint('bottom')),
                            mkMat(urls.south,  'south',  applyGrassTint('south')),
                            mkMat(urls.north,  'north',  applyGrassTint('north')),
                        ];
                        if (isRepeaterLike || isComparatorLike) {
                            arr.push(_getMarkerMat());
                            arr.push(mkMat(urls.top, 'top-overlay'));
                            arr.push(new THREE.MeshBasicMaterial({ visible: false }));
                        } else if (isRedstoneDust) {
                            arr.push(mkMat(urls.line || urls.top, 'line'));
                            arr.push(new THREE.MeshBasicMaterial({ visible: false }));
                        } else if (isDirectional) {
                            // Direction is already encoded in the real front/back textures.
                            arr.push(new THREE.MeshBasicMaterial({ visible: false }));
                        }
                        this._matCache.set(cacheKey, arr);
                        return arr;
                    } else {
                        // 特殊形状（階段・スラブ・ドアなど）の単一マテリアル
                        // ドアは north/east/west が正面テクスチャ（top は3/16の薄い端面なので避ける）
                        // トラップドア・フェンスゲートなども同様に north 優先
                        let mainFace;
                        if (shape === 'door' || shape === 'trapdoor' || shape === 'fence_gate') {
                            mainFace = urls.north || urls.east || urls.south || urls.west || urls.top;
                        } else {
                            // 階段・スラブ等は上面テクスチャが最も見栄えよい
                            mainFace = urls.top || urls.north || urls.east;
                        }
                        const mat = mkMat(mainFace, 'main');
                        this._matCache.set(cacheKey, mat);
                        return mat;
                    }
                } else {
                    console.warn(`      -> Viewer3D: [${blockId}] getFaceUrls found=false`);
                }
            }
        }

        // ─── マテリアルモード / フォールバック ─────────────────────────────
        const color = biomeTint !== null ? biomeTint : getBlockColor(blockId);
        const matOpts = { color, ...getTextureMaterialOptions(blockId, layer) };
        if (alphaMode === 'blend') {
            // フォールバック時は少し透明感を持たせる
            matOpts.opacity = 0.72;
        }
        const mat = new THREE.MeshLambertMaterial(matOpts);
        // M-V-1: 方向性ブロックは 7 要素配列にして index 6 にマーカー
        if (isDirectional) {
            const arr = [mat, mat, mat, mat, mat, mat, _getMarkerMat()];
            if (isRepeaterLike || isComparatorLike) {
                arr.push(new THREE.MeshBasicMaterial({ visible: false }));
                arr.push(new THREE.MeshBasicMaterial({ visible: false }));
            }
            this._matCache.set(cacheKey, arr);
            return arr;
        }
        this._matCache.set(cacheKey, mat);
        return mat;
    }

    setColorMode(mode) {
        this.colorMode = mode;
        this._matCache.clear();
        // 置換を再適用するためにapp.js側の再描画コールバックを呼ぶ
        if (this.onNeedsReload) {
            this.onNeedsReload();
        } else if (this._lastCoords) {
            // フォールバック（コールバック未設定の場合）
            this.loadStructure(this._lastCoords, this._lastSize, this._lastOptions);
        }
    }
    refreshTextures() {
        // テクスチャパックが更新された場合、キャッシュを全破棄して再描画
        this._matCache.clear();
        this._clearTextureCache();
        // 置換を再適用するためにapp.js側の再描画コールバックを呼ぶ
        if (this.onNeedsReload) {
            this.onNeedsReload();
        } else if (this._lastCoords) {
            this.loadStructure(this._lastCoords, this._lastSize, this._lastOptions || {});
        }
    }

    _clearTextureCache() {
        for (const texture of this._textureCache?.values?.() || []) {
            texture?.dispose?.();
        }
        this._textureCache?.clear?.();
    }

    /** 合体モードの構造ドラッグを再メッシュ化せずにプレビューする。 */
    translateStructurePreview(structureId, axis, delta) {
        this.blockManager?.translateStructure(structureId, axis, delta);
    }

    _handleClick(e, isRightClick = false) {
        if (!isRightClick && !this.onBlockClick) return;
        if (isRightClick && !this.onBlockRightClick) return;

        const THREE = window.THREE;
        if (!THREE) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width)  * 2 - 1,
           -((e.clientY - rect.top)  / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const hits = raycaster.intersectObjects(this.meshes);
        if (hits.length === 0) {
            if (!isRightClick) this.onBlockClick(null);
            else this.onBlockRightClick(null);
            return;
        }
        const hit = hits[0];
        const mesh = hit.object;
        const coord = mesh.userData.instanceCoords?.[hit.instanceId] ?? null;

        const callbackInfo = {
            blockId: mesh.userData.blockId,
            coord,
            screenX: e.clientX,
            screenY: e.clientY
        };

        if (isRightClick) this.onBlockRightClick(callbackInfo);
        else this.onBlockClick(callbackInfo);
    }

    /** 範囲選択の可視化 */
    setRangeIndicator(start, end) {
        this.clearRangeIndicator();
        if (!start || !this.scene) return;
        const THREE = window.THREE;

        // 始点マーカー（小さな青い箱）
        const startGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
        const startMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, depthTest: false });
        this._rangeStartMesh = new THREE.Mesh(startGeo, startMat);
        this._rangeStartMesh.position.set(start.x, start.y, start.z);
        this._rangeStartMesh.renderOrder = 999;
        this.scene.add(this._rangeStartMesh);

        if (!end) return;

        // 範囲ボックス
        const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);
        const minZ = Math.min(start.z, end.z), maxZ = Math.max(start.z, end.z);

        const width = maxX - minX + 1.1, height = maxY - minY + 1.1, depth = maxZ - minZ + 1.1;
        const boxGeo = new THREE.BoxGeometry(width, height, depth);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const boxMat = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 2, depthTest: false });
        this._rangeBoxMesh = new THREE.LineSegments(edges, boxMat);
        this._rangeBoxMesh.renderOrder = 1000;
        this._rangeBoxMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
        this.scene.add(this._rangeBoxMesh);
    }

    clearRangeIndicator() {
        if (this._rangeStartMesh) {
            this.scene?.remove(this._rangeStartMesh);
            this._rangeStartMesh.geometry?.dispose();
            this._rangeStartMesh.material?.dispose();
            this._rangeStartMesh = null;
        }
        if (this._rangeBoxMesh) {
            this.scene?.remove(this._rangeBoxMesh);
            this._rangeBoxMesh.geometry?.dispose();
            this._rangeBoxMesh.material?.dispose();
            this._rangeBoxMesh = null;
        }
    }

    /**
     * Alt+ドラッグ中に操作対象の建造物を目立たせるワイヤーフレームボックスを描画。
     * @param {{minX,minY,minZ,maxX,maxY,maxZ}} bounds  表示座標系での AABB
     * @param {string} [label]  建造物名（将来用）
     */
    /**
     * Canvas テクスチャでスプライトラベルを生成（名前タグ）
     * @param {string} text
     */
    _createLabelSprite(text) {
        const THREE = window.THREE;
        const W = 320, H = 64, r = 10, pad = 14;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        // 角丸背景
        ctx.fillStyle = 'rgba(2, 18, 30, 0.88)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(W - r, 0); ctx.quadraticCurveTo(W, 0, W, r);
        ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
        ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
        ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // テキスト（長い名前は省略）
        ctx.fillStyle = '#e0f4ff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let displayText = text;
        if (ctx.measureText(text).width > W - pad * 2) {
            while (ctx.measureText(displayText + '…').width > W - pad * 2 && displayText.length > 1)
                displayText = displayText.slice(0, -1);
            displayText += '…';
        }
        ctx.fillText(displayText, W / 2, H / 2);

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(10, 2, 1); // ワールド単位（10ブロック幅 × 2高）
        return sprite;
    }

    /**
     * Alt+ドラッグ中に操作対象の建造物を目立たせるワイヤーフレームボックスを描画。
     * @param {{minX,minY,minZ,maxX,maxY,maxZ}} bounds  表示座標系での AABB
     * @param {string} [label]  建造物名
     */
    setStructureHighlight(bounds, label = '') {
        this.clearStructureHighlight();
        if (!this.scene) return;
        const THREE = window.THREE;
        if (!THREE) return;

        const pad = 0.3; // ブロック表面より少し外側
        const w = bounds.maxX - bounds.minX + 1 + pad * 2;
        const h = bounds.maxY - bounds.minY + 1 + pad * 2;
        const d = bounds.maxZ - bounds.minZ + 1 + pad * 2;
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        const cz = (bounds.minZ + bounds.maxZ) / 2;

        const boxGeo = new THREE.BoxGeometry(w, h, d);

        // ① 半透明フィル（薄いシアン）
        const fillMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.07,
            depthWrite: false,
            side: THREE.BackSide,  // 内側から見えるように
        });
        const fillMesh = new THREE.Mesh(boxGeo, fillMat);
        fillMesh.position.set(cx, cy, cz);
        fillMesh.renderOrder = 990;
        this.scene.add(fillMesh);
        this._structureHighlightMeshes.push(fillMesh);

        // ② エッジワイヤーフレーム（くっきりしたシアン、depthTest OFF で常に見える）
        const edges = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            linewidth: 1,
            depthTest: false,
        });
        const lineMesh = new THREE.LineSegments(edges, lineMat);
        lineMesh.position.set(cx, cy, cz);
        lineMesh.renderOrder = 991;
        this.scene.add(lineMesh);
        this._structureHighlightMeshes.push(lineMesh);

        // ③ ラベルスプライト（建造物名）
        if (label) {
            const sprite = this._createLabelSprite(label);
            sprite.position.set(cx, bounds.maxY + 2.0, cz);
            sprite.renderOrder = 992;
            this.scene.add(sprite);
            this._structureHighlightMeshes.push(sprite);
        }
    }

    /** ハイライト全体（枠+ラベル）を相対移動。Alt+ドラッグ中に呼んで追従させる */
    translateStructureHighlight(axis, delta) {
        for (const m of this._structureHighlightMeshes) {
            m.position[axis] += delta;
        }
    }

    /** 建造物ハイライトを解除 */
    clearStructureHighlight() {
        for (const m of this._structureHighlightMeshes) {
            this.scene?.remove(m);
            m.geometry?.dispose();
            if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
            else m.material?.dispose();
        }
        this._structureHighlightMeshes = [];
    }

    resetCamera() {
        this.spherical = { theta: 0.5, phi: 0.8, radius: 50 };
        this._updateCamera();
    }

    /** 床タイプの設定 */
    setFloorType(type) {
        if (!this.scene) return;
        if (this.floor) {
            this.scene.remove(this.floor);
            this.floor = null;
        }

        const THREE = window.THREE;
        if (type === 'none') return;

        let color = 0x222222;
        let gridColor = 0x444444;
        let opacity = 1.0;
        let showPlane = true;

        switch (type) {
            case 'grid': // 透明グリッド
                gridColor = 0x000000;
                showPlane = false;
                break;
            case 'grass': 
                color = 0x5e8a4d; // Minecraft grass
                gridColor = 0xffffff; 
                break;
            case 'snow':  
                color = 0xffffff; 
                gridColor = 0x888888; 
                break;
            case 'stone': 
                color = 0x5a5a5a; 
                gridColor = 0xffffff; 
                break;
            case 'nether':
                color = 0x4a1010; // Crimson/Netherrack
                gridColor = 0xffffff; 
                break;
            case 'end':   
                color = 0xd8d6a3; // End stone
                gridColor = 0x444444; 
                break;
            case 'water': 
                color = 0x1a4a8a; 
                gridColor = 0xffffff; 
                opacity = 0.5;
                break;
            case 'sand':
                color = 0xd2b48c; // Sandy beige
                gridColor = 0x8b7e66;
                break;
            default:      
                color = 0x111111; 
                gridColor = 0x333333; 
                break;
        }

        this.floor = new THREE.Group();

        // 1. 板ポリゴン（表示する場合のみ）
        if (showPlane) {
            const geo = new THREE.PlaneGeometry(200, 200);
            const mat = new THREE.MeshLambertMaterial({ 
                color: color, 
                side: THREE.DoubleSide,
                transparent: (opacity < 1.0),
                opacity: opacity
            });
            const plane = new THREE.Mesh(geo, mat);
            plane.rotation.x = Math.PI / 2;
            plane.position.y = -0.02; // 重なり防止
            this.floor.add(plane);
        }

        // 2. グリッド（位置把握用）
        const grid = new THREE.GridHelper(200, 40, gridColor, gridColor);
        if (grid.material) {
            grid.material.transparent = true;
            grid.material.opacity = (type === 'grid' ? 0.4 : 0.15); // 透明グリッドモードでは少し濃くする
        }
        grid.position.y = 0;
        this.floor.add(grid);

        this.scene.add(this.floor);
    }

    // ─── ハイライト（素材一覧との連動） ────────────────────────────────────
    // ─── 選択インジケーター（クリックした1ブロックに縁を表示）────────────────
    setSelectionIndicator(coord) {
        this.clearSelectionIndicator();
        if (!coord || !this.scene) return;
        const THREE = window.THREE;
        if (!THREE) return;
        // EdgesGeometry で12辺だけ描画 → 面を塗らずに縁だけ光る
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.08, 1.08, 1.08));
        const mat   = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 1 });
        this._selectionMesh = new THREE.LineSegments(edges, mat);
        this._selectionMesh.position.set(coord.x, coord.y, coord.z);
        this.scene.add(this._selectionMesh);
        // ゆっくり点滅アニメーション
        this._selectionMesh.userData.birthTime = performance.now();
        this._animateSelection();
    }

    _animateSelection() {
        if (!this._selectionMesh || !this.scene?.children.includes(this._selectionMesh)) return;
        const t = (performance.now() - this._selectionMesh.userData.birthTime) / 1000;
        // 0.6〜1.0 の間で sin 点滅
        const op = 0.7 + 0.3 * Math.sin(t * Math.PI * 2);
        this._selectionMesh.material.opacity = op;
        this._selectionMesh.material.transparent = true;
        this._selAnimRaf = requestAnimationFrame(() => this._animateSelection());
    }

    clearSelectionIndicator() {
        if (this._selAnimRaf) { cancelAnimationFrame(this._selAnimRaf); this._selAnimRaf = null; }
        if (this._selectionMesh) {
            this.scene?.remove(this._selectionMesh);
            this._selectionMesh.geometry?.dispose();
            this._selectionMesh.material?.dispose();
            this._selectionMesh = null;
        }
    }

    // 旧APIとの互換ラッパー
    highlightBlock(blockId) {}
    clearHighlight() { this.clearSelectionIndicator(); }

    /**
     * 現在のビューを PNG data URL として取得。
     * preserveDrawingBuffer なしの WebGL は描画後にバッファが消えるため、
     * render() 直後に同期で toDataURL() を読むことで対応する。
     * @returns {string|null} data URL (失敗時 null)
     */
    captureScreenshot() {
        if (!this.isInitialized || !this.renderer || !this.scene || !this.camera) return null;
        try {
            this.renderer.render(this.scene, this.camera);
            return this.renderer.domElement.toDataURL('image/png');
        } catch (e) {
            console.error('captureScreenshot failed:', e);
            return null;
        }
    }

    /** ウィンドウリサイズ時の処理 */
    handleResize() {
        if (!this.isInitialized || !this.container || !this.renderer || !this.camera) return;
        
        // タブ切り替え直後などは clientWidth が 0 になることがあるため、
        // 0 の場合は少し待ってから再試行するか、デフォルト値を使う
        let w = this.container.clientWidth;
        let h = this.container.clientHeight;
        
        if (w === 0 || h === 0) {
            // サイズが確定していない場合は、アニメーションフレームのタイミングで再試行
            requestAnimationFrame(() => this.handleResize());
            return;
        }

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}
