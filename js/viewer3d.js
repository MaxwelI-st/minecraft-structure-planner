/**
 * viewer3d.js - Three.js based 3D structure viewer
 * Version: v2.5.12 (Fix: door open/close, glass transparency, grass biome color, corner stairs)
 */

import { getFaceUrls, isLoaded as packIsLoaded, getName as packName } from './resourcepack.js';
import { resolveGeometry, classifyShape } from './blockshapes.js';
import { normalizeBedrockBlock } from './bedrock_normalize.js';
import { _getState, _isTrue } from './blockshapes.js';

console.log('##########################################');
console.log('###  Viewer v2.5.12: NEW VERSION LOADED  ###');
console.log('##########################################');

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

/** ブロックIDがガラス系かどうか */
function _isGlass(blockId) {
    const local = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    return local.includes('glass') || local === 'ice' || local === 'blue_ice' || local === 'packed_ice';
}

/** ブロックIDが草ブロック系かどうか（上面グレースケール→バイオーム着色が必要） */
function _isGrassBlock(blockId) {
    const local = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    return local === 'grass_block' || local === 'grass';
}

const BLOCK_COLORS = {
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

function getBlockColor(blockId) {
    const raw = String(blockId).toLowerCase().replace('minecraft:', '');
    if (raw.includes('grass')) return 0x79c05a;
    if (raw.includes('dirt')) return 0x866043;
    for (const [key, color] of Object.entries(BLOCK_COLORS)) {
        if (raw.includes(key)) return color;
    }
    return 0x8a8a8a;
}

function _shapeSignature(blockId, states) {
    const shape = classifyShape(blockId, states);
    if (shape === 'cube' || !states) return blockId;
    const keys = [];
    if (shape === 'stairs')    keys.push('weirdo_direction', 'upside_down_bit');
    else if (shape === 'slab') keys.push('top_slot_bit', 'vertical_half', 'upside_down_bit');
    else if (shape === 'trapdoor') keys.push('open_bit', 'upside_down_bit', 'direction');
    else if (shape === 'door') keys.push('open_bit', 'direction', 'hinge_bit', 'upper_block_bit');
    else if (shape === 'fence_gate') keys.push('open_bit', 'direction');
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
        this._lastCoords = null; this._lastSize = null; this._lastOptions = null;
    }

    async init() {
        if (this.isInitialized) return;
        await this._loadThree();
        this._setupScene();
        this._setupControls();
        this.isInitialized = true;
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
        this._animate();
    }

    _setupControls() {
        const el = this.renderer.domElement;
        const orbitBy = (dx, dy) => {
            this.spherical.theta -= dx * 0.01;
            this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi + dy * 0.01));
            this._updateCamera();
        };
        let isDragging = false;
        let prevMouse = { x: 0, y: 0 };
        el.addEventListener('mousedown', (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            orbitBy(e.clientX - prevMouse.x, e.clientY - prevMouse.y);
            prevMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.spherical.radius = Math.max(2, Math.min(500, this.spherical.radius * (e.deltaY > 0 ? 1.1 : 0.9)));
            this._updateCamera();
        }, { passive: false });
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
        requestAnimationFrame(() => this._animate());
        this.renderer.render(this.scene, this.camera);
    }

    loadStructure(coords, size, options = {}) {
        if (!this.isInitialized) return;
        const THREE = window.THREE;
        const { yMin = 0, yMax = 999, colorMode } = options;
        if (colorMode) this.colorMode = colorMode;
        this._lastCoords = coords; this._lastSize = size; this._lastOptions = { yMin, yMax };

        // キャッシュをクリア（置換後ブロックIDでテクスチャを正しく引き直すため）
        this._matCache.clear();

        for (const mesh of this.meshes) {
            this.scene.remove(mesh);
            if (mesh.geometry?.dispose) mesh.geometry.dispose();
        }
        this.meshes = [];
        const filtered = coords.filter(c => c.y >= yMin && c.y <= yMax);
        if (filtered.length === 0) return;

        // ─── 隣接ブロック検索用マップ ─────────────────────────────────────
        // キー: "x,y,z" → ブロック情報 { blockId, states }
        const blockMap = new Map();
        for (const c of filtered) blockMap.set(`${c.x},${c.y},${c.z}`, c);

        /** 座標 (x,y,z) のブロックを取得する関数 */
        const getBlock = (x, y, z) => blockMap.get(`${x},${y},${z}`) || null;

        // ─── 接続フラグ用 Set（フェンス・壁・ペイン用）─────────────────────
        const posMap = new Set();
        for (const c of filtered) posMap.add(`${c.x},${c.y},${c.z}`);

        // ─── 形状シグネチャでグループ化（同一形状をまとめて InstancedMesh へ）
        // 階段はコーナー形状が隣接依存なので、シグネチャに隣接情報も含める
        const groups = new Map();
        for (const c of filtered) {
            // フェンス/壁/ペイン用の接続フラグ（boolean）
            const neighbors = {
                n: posMap.has(`${c.x},${c.y},${c.z - 1}`),
                s: posMap.has(`${c.x},${c.y},${c.z + 1}`),
                w: posMap.has(`${c.x - 1},${c.y},${c.z}`),
                e: posMap.has(`${c.x + 1},${c.y},${c.z}`)
            };

            // 階段コーナー判定用の隣接ブロック情報（blockId + states 付き）
            const neighborBlocks = {
                n: getBlock(c.x,     c.y, c.z - 1),
                s: getBlock(c.x,     c.y, c.z + 1),
                w: getBlock(c.x - 1, c.y, c.z),
                e: getBlock(c.x + 1, c.y, c.z)
            };

            const neighborSig = `|n${neighbors.n?1:0}s${neighbors.s?1:0}w${neighbors.w?1:0}e${neighbors.e?1:0}`;
            // 階段は隣接ブロックのIDと向きもシグネチャに含める
            let stairCornerSig = '';
            if (classifyShape(c.blockId, c.states) === 'stairs') {
                const nb = neighborBlocks;
                const nbStr = (b) => b ? `${b.blockId}:${b.states?.weirdo_direction ?? ''}` : 'null';
                stairCornerSig = `|stairs[${nbStr(nb.n)},${nbStr(nb.s)},${nbStr(nb.w)},${nbStr(nb.e)}]`;
            }
            const sig = _shapeSignature(c.blockId, c.states) + neighborSig + stairCornerSig;

            if (!groups.has(sig)) {
                groups.set(sig, {
                    blockId: c.blockId, rawId: c.rawId, states: c.states,
                    neighbors, neighborBlocks, list: []
                });
            }
            groups.get(sig).list.push(c);
        }

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const mat4 = new THREE.Matrix4();

        for (const grp of groups.values()) {
            const { blockId, rawId, states, neighbors, neighborBlocks, list } = grp;
            const mat = this._buildMaterial(THREE, blockId, rawId, states);
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

            const mesh = new THREE.InstancedMesh(geo, mat, list.length);
            // ガラス系は透過描画のため renderOrder を上げる
            if (_isGlass(blockId)) mesh.renderOrder = 1;
            for (let i = 0; i < list.length; i++) {
                mat4.setPosition(list[i].x, list[i].y, list[i].z);
                mesh.setMatrixAt(i, mat4);
            }
            mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(mesh);
            this.meshes.push(mesh);
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
    _buildMaterial(THREE, blockId, rawId, states) {
        const stateSig = states
            ? Object.entries(states).map(([k, v]) => `${k}=${v}`).sort().join(',')
            : '';
        const cacheKey = this.colorMode + '::' + blockId + '|' + (rawId || '') + '|' + stateSig;
        if (this._matCache.has(cacheKey)) return this._matCache.get(cacheKey);

        const shape = classifyShape(blockId, states);
        const isGlass = _isGlass(blockId);
        const isGrassBlock = _isGrassBlock(blockId);
        const biomeTint = getBiomeTint(blockId);

        if (this.colorMode === 'realtexture') {
            const loaded = packIsLoaded();
            if (!loaded) {
                console.warn(`      -> Viewer3D: [${blockId}] realtexture skip (packIsLoaded is false)`);
            } else {
                const urls = getFaceUrls(blockId, { rawId, states });
                if (urls && urls.found) {
                    console.log(`      -> Viewer3D: [${blockId}] texture found:`, urls);
                    const loader = new THREE.TextureLoader();

                    /**
                     * 1枚のテクスチャ面からマテリアルを生成する
                     * @param {object|string|null} faceObj - { url, tint } または URL 文字列
                     * @param {string} faceName - デバッグ用面名
                     * @param {boolean} forceGrassTint - 草ブロックのグレースケール面にバイオームカラーを強制適用
                     */
                    const mkMat = (faceObj, faceName, forceGrassTint = false) => {
                        const url = faceObj?.url || (typeof faceObj === 'string' ? faceObj : null);
                        if (!url) {
                            console.warn(`         -> No URL for face [${faceName}] of [${blockId}]`);
                            return new THREE.MeshLambertMaterial({ color: 0x888888 });
                        }
                        const tex = loader.load(url, (t) => { t.needsUpdate = true; });
                        tex.magFilter = tex.minFilter = THREE.NearestFilter;

                        // ─── マテリアル設定 ──────────────────────────────
                        const matOpts = { map: tex };

                        // ① ガラス系: 必ず透過設定を適用
                        if (isGlass) {
                            matOpts.transparent = true;
                            matOpts.alphaTest = 0.1;
                            matOpts.depthWrite = false; // 半透明の正しい描画のため
                        }

                        // ② 草ブロック側面の葉/草テクスチャ: alphaTest で黒つぶれ防止
                        if (isGrassBlock && faceName !== 'bottom') {
                            matOpts.alphaTest = 0.5;
                        }

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

                    if (shape === 'cube') {
                        // 草ブロックの各面に対してバイオームカラーを適切に適用
                        // top / east / west / north / south: tint あり（グレースケール→緑）
                        // bottom (dirt): tint なし
                        const applyGrassTint = (face) => isGrassBlock && face !== 'bottom';
                        const arr = [
                            mkMat(urls.east,   'east',   applyGrassTint('east')),
                            mkMat(urls.west,   'west',   applyGrassTint('west')),
                            mkMat(urls.top,    'top',    applyGrassTint('top')),
                            mkMat(urls.bottom, 'bottom', applyGrassTint('bottom')),
                            mkMat(urls.south,  'south',  applyGrassTint('south')),
                            mkMat(urls.north,  'north',  applyGrassTint('north')),
                        ];
                        this._matCache.set(cacheKey, arr);
                        return arr;
                    } else {
                        // 特殊形状（階段・スラブ・ドアなど）は上面優先の単一マテリアル
                        const mainFace = urls.top || urls.north || urls.east;
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
        const matOpts = { color };
        if (isGlass) {
            matOpts.transparent = true;
            matOpts.alphaTest = 0.1;
            matOpts.opacity = 0.6;
        }
        const mat = new THREE.MeshLambertMaterial(matOpts);
        this._matCache.set(cacheKey, mat);
        return mat;
    }

    setColorMode(mode) {
        this.colorMode = mode;
        this._matCache.clear();
        if (this._lastCoords) {
            this.loadStructure(this._lastCoords, this._lastSize, this._lastOptions);
        }
    }
    refreshTextures() {
        // テクスチャパックが更新された場合、キャッシュを全破棄して再描画
        this._matCache.clear();
        if (this._lastCoords) {
            this.loadStructure(this._lastCoords, this._lastSize, this._lastOptions || {});
        }
    }
    resetCamera() {
        this.spherical = { theta: 0.5, phi: 0.8, radius: 50 };
        this._updateCamera();
    }
}
