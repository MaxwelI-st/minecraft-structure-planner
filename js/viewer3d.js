/**
 * viewer3d.js - Three.js based 3D structure viewer
 * Version: v2.5.11 (Forced Cache Busting)
 */

import { getFaceUrls, isLoaded as packIsLoaded, getName as packName } from './resourcepack.js';
import { resolveGeometry, classifyShape } from './blockshapes.js';
import { normalizeBedrockBlock } from './bedrock_normalize.js';
import { _getState, _isTrue } from './blockshapes.js';

console.log('##########################################');
console.log('###  Viewer v2.5.11: NEW VERSION LOADED  ###');
console.log('##########################################');

const BLOCK_COLORS = {
    // 基本
    grass_block: 0x79c05a, grass: 0x79c05a, dirt: 0x866043, stone: 0x7a7a7a, 
    cobblestone: 0x9a9a9a, mossy_cobblestone: 0x6a7a6a,
    sand: 0xe0d070, gravel: 0x909090, white_concrete_powder: 0xe0e0e0,
    
    // 木材
    oak: 0x9d814d, spruce: 0x684e2e, birch: 0xd7c185, jungle: 0xab7653, 
    acacia: 0xba6337, dark_oak: 0x493212, mangrove: 0x7a3030, cherry: 0xe2c1c6,
    bamboo: 0xc6b65a, crimson: 0x963a4c, warped: 0x3a8e8c,
    
    // 石・レンガ
    stone_brick: 0x7a7a7a, nether_brick: 0x301020, bricks: 0xa04030, 
    deepslate: 0x505060, blackstone: 0x2c252a, quartz: 0xede6df,
    andesite: 0x909090, diorite: 0xd0d0d0, granite: 0xa06040,
    
    // ユーティリティ
    barrel: 0x8a6030, chest: 0x8a6030, composter: 0x604020, smoker: 0x404040,
    beehive: 0xc6b65a, campfire: 0x604020, lantern: 0xf0c840, hopper: 0x404040,
    ladder: 0x8a6030, iron_bars: 0xd8d8d8, glass: 0xb0d8f0, glass_pane: 0xb0d8f0,
    flower_pot: 0xa04030, bed: 0xc02020, glowstone: 0xf0c840,
};

function getBlockColor(blockId) {
    const raw = String(blockId).toLowerCase().replace('minecraft:', '');
    
    // 1. 特殊ケース（草と土を最優先）
    if (raw.includes('grass')) return 0x79c05a;
    if (raw.includes('dirt')) return 0x866043;
    
    // 2. 部分一致（キーワードが含まれるものを探す）
    // 例: "spruce_slab" -> "spruce" に一致
    for (const [key, color] of Object.entries(BLOCK_COLORS)) { 
        if (raw.includes(key)) return color; 
    }
    
    // 3. フォールバック
    return 0x8a8a8a;
}

function _shapeSignature(blockId, states) {
    const shape = classifyShape(blockId, states);
    if (shape === 'cube' || !states) return blockId;
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(w, h);
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

        for (const mesh of this.meshes) { this.scene.remove(mesh); if (mesh.geometry?.dispose) mesh.geometry.dispose(); }
        this.meshes = [];
        const filtered = coords.filter(c => c.y >= yMin && c.y <= yMax);
        if (filtered.length === 0) return;
        // 隣接判定用の座標マップを作成
        const posMap = new Set();
        for (const c of filtered) posMap.add(`${c.x},${c.y},${c.z}`);

        const groups = new Map();
        for (const c of filtered) {
            const neighbors = {
                n: posMap.has(`${c.x},${c.y},${c.z - 1}`),
                s: posMap.has(`${c.x},${c.y},${c.z + 1}`),
                w: posMap.has(`${c.x - 1},${c.y},${c.z}`),
                e: posMap.has(`${c.x + 1},${c.y},${c.z}`)
            };
            const neighborSig = `|n${neighbors.n ? 1 : 0}s${neighbors.s ? 1 : 0}w${neighbors.w ? 1 : 0}e${neighbors.e ? 1 : 0}`;
            const sig = _shapeSignature(c.blockId, c.states) + neighborSig;

            if (!groups.has(sig)) {
                groups.set(sig, { blockId: c.blockId, rawId: c.rawId, states: c.states, neighbors, list: [] });
            }
            groups.get(sig).list.push(c);
        }
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const mat4 = new THREE.Matrix4();
        for (const grp of groups.values()) {
            const { blockId, rawId, states, neighbors, list } = grp;
            const mat = this._buildMaterial(THREE, blockId, rawId, states);
            let geo = boxGeo;
            try {
                const customGeo = resolveGeometry(THREE, blockId, states || {}, neighbors || {});
                if (customGeo?.attributes?.position?.count > 0) geo = customGeo;
            } catch (err) {}
            const mesh = new THREE.InstancedMesh(geo, mat, list.length);
            for (let i = 0; i < list.length; i++) { mat4.setPosition(list[i].x, list[i].y, list[i].z); mesh.setMatrixAt(i, mat4); }
            mesh.instanceMatrix.needsUpdate = true;
            this.scene.add(mesh);
            this.meshes.push(mesh);
        }
    }

    _buildMaterial(THREE, blockId, rawId, states) {
        const stateSig = states ? Object.entries(states).map(([k, v]) => `${k}=${v}`).sort().join(',') : '';
        const cacheKey = this.colorMode + '::' + blockId + '|' + (rawId || '') + '|' + stateSig;
        if (this._matCache.has(cacheKey)) return this._matCache.get(cacheKey);

        const shape = classifyShape(blockId, states);

        if (this.colorMode === 'realtexture') {
            const loaded = packIsLoaded();
            if (!loaded) {
                console.warn(`      -> Viewer3D: [${blockId}] realtexture skip (packIsLoaded is false)`);
            } else {
                const urls = getFaceUrls(blockId, { rawId, states });
                if (urls && urls.found) {
                    console.log(`      -> Viewer3D: [${blockId}] texture found:`, urls);
                    const loader = new THREE.TextureLoader();
                    const mkMat = (faceObj, faceName) => {
                        const url = faceObj?.url || faceObj;
                        if (!url) {
                            console.warn(`         -> No URL for face [${faceName}] of [${blockId}]`);
                            return new THREE.MeshLambertMaterial({ color: 0x888888 });
                        }
                        const tex = loader.load(url, (t) => { 
                            t.needsUpdate = true;
                        });
                        tex.magFilter = tex.minFilter = THREE.NearestFilter;
                        const m = new THREE.MeshLambertMaterial({ map: tex });
                        if (faceObj?.tint) m.color = new THREE.Color(faceObj.tint);
                        return m;
                    };

                    if (shape === 'cube') {
                        const arr = [ 
                            mkMat(urls.east, 'east'), mkMat(urls.west, 'west'), 
                            mkMat(urls.top, 'top'), mkMat(urls.bottom, 'bottom'), 
                            mkMat(urls.south, 'south'), mkMat(urls.north, 'north') 
                        ];
                        this._matCache.set(cacheKey, arr); return arr;
                    } else {
                        // 特殊形状（階段等）は単一マテリアル（上面優先）
                        const mainFace = urls.top || urls.side || urls.all || urls.east;
                        const mat = mkMat(mainFace, 'main');
                        this._matCache.set(cacheKey, mat); return mat;
                    }
                } else {
                    console.warn(`      -> Viewer3D: [${blockId}] getFaceUrls found=false`);
                }
            }
        }
        const mat = new THREE.MeshLambertMaterial({ color: getBlockColor(blockId) });
        this._matCache.set(cacheKey, mat); return mat;
    }

    setColorMode(mode) {
        this.colorMode = mode; this._matCache.clear();
        if (this._lastCoords) this.loadStructure(this._lastCoords, this._lastSize, this._lastOptions);
    }
    refreshTextures() { this.setColorMode(this.colorMode); }
    resetCamera() { this.spherical = { theta: 0.5, phi: 0.8, radius: 50 }; this._updateCamera(); }
}
