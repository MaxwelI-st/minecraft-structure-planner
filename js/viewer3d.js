/**
 * viewer3d.js - Three.js based 3D structure viewer
 * Uses InstancedMesh for performance. THREE must be available globally.
 */

import { getFaceUrls, isLoaded as packIsLoaded, getName as packName } from './resourcepack.js';
import { resolveGeometry, classifyShape } from './blockshapes.js';

const BLOCK_COLORS = {
    // Stone family
    stone: 0x808080, cobblestone: 0x8a8a8a, stone_bricks: 0x7a7a7a, deepslate: 0x505060,
    andesite: 0x909090, diorite: 0xd0d0d0, granite: 0xa06040,
    // Wood family
    oak_planks: 0xc8a060, spruce_planks: 0x8a5e30, birch_planks: 0xe0d0a0,
    jungle_planks: 0xb07050, acacia_planks: 0xc07040, dark_oak_planks: 0x502010,
    oak_log: 0x8a6030, spruce_log: 0x604020,
    // Earth
    dirt: 0x8b6340, grass_block: 0x5a9e3a, sand: 0xe0d070, gravel: 0x909090,
    // Brick
    bricks: 0xa04030, nether_bricks: 0x301020,
    // Concrete
    white_concrete: 0xe0e0e0, orange_concrete: 0xe06020, light_blue_concrete: 0x80b0e0,
    yellow_concrete: 0xe0d020, lime_concrete: 0x60c020, pink_concrete: 0xe080a0,
    gray_concrete: 0x606060, light_gray_concrete: 0xa0a0a0, cyan_concrete: 0x208090,
    purple_concrete: 0x8020a0, blue_concrete: 0x2040c0, brown_concrete: 0x602010,
    green_concrete: 0x406020, red_concrete: 0xc02020, black_concrete: 0x202020,
    // Glass
    glass: 0xb0d8f0, glass_pane: 0xb0d8f0,
    // Ore
    iron_ore: 0xc09090, gold_ore: 0xf0d060, diamond_ore: 0x70d8d8,
    emerald_ore: 0x50d870, lapis_ore: 0x3060d0, redstone_ore: 0xd02020,
    // Metal blocks
    iron_block: 0xd8d8d8, gold_block: 0xf0d020, diamond_block: 0x40e8e8,
    // Water/Lava
    water: 0x2040c0, lava: 0xff4400,
    // Misc
    obsidian: 0x200830, glowstone: 0xf0c840, netherrack: 0x803030,
    end_stone: 0xe8e8a8, purpur_block: 0xc080c0,
};

const CATEGORY_COLORS = {
    building: 0x8a8a8a,
    decoration: 0xba9455,
    redstone: 0xd04040,
    nature: 0x5a9e3a,
    other: 0x7080a0,
};

function getBlockColor(blockId) {
    const raw = blockId.replace('minecraft:', '');
    if (BLOCK_COLORS[raw]) return BLOCK_COLORS[raw];
    // Check partial matches
    for (const [key, color] of Object.entries(BLOCK_COLORS)) {
        if (raw.includes(key)) return color;
    }
    return 0x8a8a8a;
}

/** 形状を区別するキー */
function _shapeSignature(blockId, states) {
    const shape = classifyShape(blockId);
    if (shape === 'cube' || !states) return blockId;
    // 形状に応じて関連ステートだけを文字列化（ステート総当たりだとグループが細かく分かれすぎる）
    const keys = [];
    if (shape === 'stairs') keys.push('weirdo_direction', 'upside_down_bit');
    else if (shape === 'slab') keys.push('top_slot_bit', 'vertical_half', 'upside_down_bit');
    else if (shape === 'trapdoor') keys.push('open_bit', 'upside_down_bit', 'direction');
    else if (shape === 'door') keys.push('open_bit', 'direction');
    else if (shape === 'fence_gate') keys.push('open_bit', 'direction');
    const sigParts = keys.map(k => k + '=' + (states[k] ?? ''));
    return blockId + '|' + sigParts.join(',');
}

export class Viewer3D {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animFrameId = null;
        this.meshes = [];
        this.isInitialized = false;
        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
        this.spherical = { theta: 0.5, phi: 0.8, radius: 50 };
        this.target = { x: 0, y: 0, z: 0 };
        this.colorMode = 'material';   // 'material' | 'realtexture'
        this._matCache = new Map();    // blockId → Material or Material[6]
        this._lastCoords = null;
        this._lastSize = null;
        this._lastOptions = null;
    }

    async init() {
        if (this.isInitialized) return;
        // Load Three.js from CDN dynamically
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
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                if (typeof window.THREE === 'undefined') {
                    reject(new Error('Three.js のロードに成功しましたが THREE が undefined です'));
                } else {
                    resolve();
                }
            };
            script.onerror = () => {
                // 別 CDN へフォールバック
                const fallback = document.createElement('script');
                fallback.src = 'https://unpkg.com/three@0.128.0/build/three.min.js';
                fallback.onload = () => resolve();
                fallback.onerror = () => reject(new Error('Three.js のロードに失敗しました（CDN到達不可）'));
                document.head.appendChild(fallback);
            };
            document.head.appendChild(script);
        });
    }

    _setupScene() {
        const THREE = window.THREE;
        const w = this.container.clientWidth || 600;
        const h = this.container.clientHeight || 450;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0f1a);
        this.scene.fog = new THREE.Fog(0x0a0f1a, 80, 200);

        this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
        this._updateCamera();

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x8899bb, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 80, 50);
        this.scene.add(dirLight);
        const dirLight2 = new THREE.DirectionalLight(0x4488ff, 0.3);
        dirLight2.position.set(-30, -20, -30);
        this.scene.add(dirLight2);

        // Grid helper（this.floor として保持。床タイプは setFloorType で切り替え）
        this.floor = null;
        this.floorType = 'grid';
        this._setupFloor('grid');

        this._animate();
    }

    /** 床タイプを切り替え。'grid' | 'grass' | 'snow' | 'sand' | 'nether' | 'end' | 'none' */
    setFloorType(type) {
        if (this.floorType === type) return;
        this.floorType = type;
        this._setupFloor(type);
    }
    getFloorType() { return this.floorType; }

    _setupFloor(type) {
        const THREE = window.THREE;
        // 既存の床を除去
        if (this.floor) {
            this.scene.remove(this.floor);
            if (this.floor.geometry) this.floor.geometry.dispose();
            if (this.floor.material) {
                if (Array.isArray(this.floor.material)) this.floor.material.forEach(m => m.dispose());
                else this.floor.material.dispose();
            }
            this.floor = null;
        }
        if (type === 'none') return;

        if (type === 'grid') {
            this.floor = new THREE.GridHelper(100, 20, 0x224444, 0x112233);
            this.scene.add(this.floor);
            return;
        }

        // カラー床（巨大な PlaneGeometry にマップカラーで色付け）
        const colorMap = {
            grass:  0x6e9a30,   // GRASS
            snow:   0xdfdfff,   // SNOW
            sand:   0xd5c98d,   // SAND
            nether: 0x6e0100,   // NETHER
            end:    0xd5c98d,   // SAND（END_STONE 風）
            stone:  0x707070,
            water:  0x3737dc,
        };
        const baseColor = colorMap[type] ?? 0x444444;
        const planeGeo = new THREE.PlaneGeometry(120, 120);
        const planeMat = new THREE.MeshLambertMaterial({ color: baseColor });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.01;
        // ついでに薄いグリッドも上に重ねる（位置感が掴みやすい）
        const grid = new THREE.GridHelper(120, 24, 0x000000, 0x000000);
        grid.material.opacity = 0.18;
        grid.material.transparent = true;
        const group = new THREE.Group();
        group.add(plane);
        group.add(grid);
        this.scene.add(group);
        this.floor = group;
    }

    _setupControls() {
        const el = this.renderer.domElement;
        el.style.touchAction = 'none';
        el.style.cursor = 'grab';
        el.addEventListener('contextmenu', e => e.preventDefault());

        // 操作モード: 'orbit'（左ドラッグ・回転）/ 'pan'（右or中or shift+左・並行移動）
        let mode = null;

        const setMode = (m) => {
            mode = m;
            el.style.cursor = m === 'pan' ? 'move' : (m === 'orbit' ? 'grabbing' : 'grab');
        };

        // パン: カメラ向きに対する右方向と上方向にターゲットを動かす
        const panBy = (dx, dy) => {
            const THREE = window.THREE;
            // 距離に応じてパン速度を調整（遠くから見ているほど速く動く）
            const factor = this.spherical.radius * 0.0015;
            // カメラ前方ベクトル（target → camera の逆）
            const camPos = this.camera.position;
            const fwd = new THREE.Vector3(
                this.target.x - camPos.x,
                this.target.y - camPos.y,
                this.target.z - camPos.z
            ).normalize();
            // 右ベクトル = fwd × world up
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
            // カメラ向きの上ベクトル = right × fwd
            const camUp = new THREE.Vector3().crossVectors(right, fwd).normalize();

            this.target.x += (-dx * right.x + dy * camUp.x) * factor;
            this.target.y += (-dx * right.y + dy * camUp.y) * factor;
            this.target.z += (-dx * right.z + dy * camUp.z) * factor;
            this._updateCamera();
        };

        const orbitBy = (dx, dy) => {
            this.spherical.theta -= dx * 0.01;
            this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi + dy * 0.01));
            this._updateCamera();
        };

        // ─── マウス ─────────────────────────────────────────────────────
        el.addEventListener('mousedown', (e) => {
            // 右クリック or 中クリック or Shift+左 → パン
            // 左クリック → 回転
            if (e.button === 2 || e.button === 1 || e.shiftKey) setMode('pan');
            else if (e.button === 0) setMode('orbit');
            this.isDragging = true;
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.prevMouse.x;
            const dy = e.clientY - this.prevMouse.y;
            if (mode === 'pan') panBy(dx, dy);
            else orbitBy(dx, dy);
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            mode = null;
            el.style.cursor = 'grab';
        });

        el.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.1 : (1 / 1.1);
            this.spherical.radius = Math.max(2, Math.min(500, this.spherical.radius * factor));
            this._updateCamera();
        }, { passive: false });

        // ─── キーボード（WASD でターゲット移動・QE で上下）────────────────
        window.addEventListener('keydown', (e) => {
            if (!this.container.matches(':hover') && document.activeElement?.tagName === 'INPUT') return;
            const step = this.spherical.radius * 0.05;
            switch (e.key) {
                case 'w': case 'W': panBy(0, step * 6); break;
                case 's': case 'S': panBy(0, -step * 6); break;
                case 'a': case 'A': panBy(step * 6, 0); break;
                case 'd': case 'D': panBy(-step * 6, 0); break;
                case 'q': case 'Q': this.target.y -= step; this._updateCamera(); break;
                case 'e': case 'E': this.target.y += step; this._updateCamera(); break;
                case 'r': case 'R': this.resetCamera(); break;
                default: return;
            }
        });

        // ─── タッチ（1本=回転、2本=ピンチズーム＋パン）────────────────
        let lastTouchDist = 0;
        let lastTouchMid = null;
        el.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                mode = 'orbit';
                this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else if (e.touches.length === 2) {
                this.isDragging = false;
                lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                lastTouchMid = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                };
            }
        });
        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.isDragging) {
                const dx = e.touches[0].clientX - this.prevMouse.x;
                const dy = e.touches[0].clientY - this.prevMouse.y;
                orbitBy(dx, dy);
                this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else if (e.touches.length === 2) {
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                const mid = {
                    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                };
                if (lastTouchDist) {
                    const factor = lastTouchDist / dist;
                    this.spherical.radius = Math.max(2, Math.min(500, this.spherical.radius * factor));
                }
                if (lastTouchMid) {
                    panBy(mid.x - lastTouchMid.x, mid.y - lastTouchMid.y);
                }
                lastTouchDist = dist;
                lastTouchMid = mid;
            }
        }, { passive: false });
        el.addEventListener('touchend', () => { this.isDragging = false; lastTouchDist = 0; });

        window.addEventListener('resize', () => this._handleResize());
    }

    _handleResize() {
        if (!this.renderer) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
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
        this.animFrameId = requestAnimationFrame(() => this._animate());
        this.renderer.render(this.scene, this.camera);
    }

    loadStructure(coords, size, options = {}) {
        if (!this.isInitialized) return;
        const THREE = window.THREE;
        const { yMin = 0, yMax = 999, colorMode } = options;
        if (colorMode === 'material' || colorMode === 'realtexture') this.colorMode = colorMode;

        // 再描画用に保存
        this._lastCoords = coords;
        this._lastSize = size;
        this._lastOptions = { yMin, yMax };

        // Remove existing block meshes
        for (const mesh of this.meshes) {
            this.scene.remove(mesh);
            if (mesh.userData.ownsGeometry && mesh.geometry?.dispose) mesh.geometry.dispose();
        }
        this.meshes = [];

        // Filter by Y range
        const filtered = coords.filter(c => c.y >= yMin && c.y <= yMax);
        if (filtered.length === 0) return;

        // Center the structure
        const cx = size.x / 2;
        const cy = size.y / 2;
        const cz = size.z / 2;
        this.target = { x: cx, y: cy, z: cz };

        // Auto-fit camera
        const maxDim = Math.max(size.x, size.y, size.z);
        this.spherical.radius = maxDim * 1.5;
        this._updateCamera();

        // Group by (blockId × shape signature)
        // 同じ blockId でも向き・ステートが違えば別グループ
        const groups = new Map();
        for (const c of filtered) {
            const sig = _shapeSignature(c.blockId, c.states);
            if (!groups.has(sig)) groups.set(sig, { blockId: c.blockId, states: c.states, list: [] });
            groups.get(sig).list.push(c);
        }

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const mat4 = new THREE.Matrix4();

        for (const grp of groups.values()) {
            const { blockId, states, list } = grp;
            const mat = this._buildMaterial(THREE, blockId);
            // 形状ごとに専用ジオメトリを使う（cube 以外は resolveGeometry が返す）
            let geo = resolveGeometry(THREE, blockId, states || {});
            if (!geo) geo = boxGeo;
            const mesh = new THREE.InstancedMesh(geo, mat, list.length);
            mesh.castShadow = false;

            for (let i = 0; i < list.length; i++) {
                const { x, y, z } = list[i];
                mat4.setPosition(x, y, z);
                mesh.setMatrixAt(i, mat4);
            }
            mesh.instanceMatrix.needsUpdate = true;
            // 専用 geo は所有を mesh に移し、後で dispose 可能にマーク
            if (geo !== boxGeo) {
                mesh.userData.ownsGeometry = true;
            }
            this.scene.add(mesh);
            this.meshes.push(mesh);
        }
    }

    /** colorMode と blockId から Material（または 6面 Material[]）を返す。キャッシュあり。 */
    _buildMaterial(THREE, blockId) {
        const cacheKey = this.colorMode + '::' + blockId;
        if (this._matCache.has(cacheKey)) return this._matCache.get(cacheKey);

        // realtexture モード：リソースパックから 6面マテリアルを生成
        if (this.colorMode === 'realtexture' && packIsLoaded()) {
            const urls = getFaceUrls(blockId);
            if (urls && urls.found) {
                const loader = new THREE.TextureLoader();
                const makeTex = (url) => {
                    if (!url) return null;
                    const t = loader.load(url);
                    t.magFilter = THREE.NearestFilter;
                    t.minFilter = THREE.NearestFilter;
                    t.wrapS = THREE.RepeatWrapping;
                    t.wrapT = THREE.RepeatWrapping;
                    return t;
                };
                // BoxGeometry groups: [+X, -X, +Y, -Y, +Z, -Z] = [east, west, top, bottom, south, north]
                const mkMat = (url, alpha) => {
                    const opts = { map: makeTex(url) };
                    if (alpha) { opts.transparent = true; opts.alphaTest = 0.5; }
                    return new THREE.MeshLambertMaterial(opts);
                };
                const isGlassLeaves = /glass|leaves|fence|trapdoor|door|stairs|slab|carpet|grass$|ladder|pane/.test(blockId);
                const arr = [
                    mkMat(urls.east,  isGlassLeaves),
                    mkMat(urls.west,  isGlassLeaves),
                    mkMat(urls.top,   isGlassLeaves),
                    mkMat(urls.bottom, isGlassLeaves),
                    mkMat(urls.south, isGlassLeaves),
                    mkMat(urls.north, isGlassLeaves),
                ];
                this._matCache.set(cacheKey, arr);
                return arr;
            }
            // テクスチャ無し → カラーフォールバック
        }

        const color = getBlockColor(blockId);
        const mat = new THREE.MeshLambertMaterial({ color });
        this._matCache.set(cacheKey, mat);
        return mat;
    }

    /** colorMode を切り替えて再描画。 */
    setColorMode(mode) {
        if (mode !== 'material' && mode !== 'realtexture') return;
        if (mode === this.colorMode) return;
        this.colorMode = mode;
        if (this._lastCoords && this._lastSize) {
            this.loadStructure(this._lastCoords, this._lastSize, { ...this._lastOptions, colorMode: mode });
        }
    }
    getColorMode() { return this.colorMode; }

    /** リソースパックを読み込み直したときに呼んで material キャッシュをクリア＆再描画 */
    refreshTextures() {
        // realtexture キャッシュだけクリア（material モードは色のみなので残す）
        for (const k of [...this._matCache.keys()]) {
            if (k.startsWith('realtexture::')) {
                const m = this._matCache.get(k);
                if (Array.isArray(m)) m.forEach(mm => mm.dispose && mm.dispose());
                else if (m && m.dispose) m.dispose();
                this._matCache.delete(k);
            }
        }
        if (this.colorMode === 'realtexture' && this._lastCoords) {
            this.loadStructure(this._lastCoords, this._lastSize, this._lastOptions);
        }
    }

    resetCamera() {
        this.spherical = { theta: 0.5, phi: 0.8, radius: 50 };
        this._updateCamera();
    }

    destroy() {
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        for (const mesh of this.meshes) { this.scene.remove(mesh); mesh.geometry.dispose(); }
        for (const m of this._matCache.values()) {
            if (Array.isArray(m)) m.forEach(mm => mm.dispose && mm.dispose());
            else if (m && m.dispose) m.dispose();
        }
        this._matCache.clear();
        if (this.renderer) { this.renderer.dispose(); }
        this.isInitialized = false;
    }
}
