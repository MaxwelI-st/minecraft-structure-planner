/**
 * resourcepack.js
 * ────────────────────────────────────────────────────────────────────────────
 * Minecraft リソースパック（.zip / .jar / .mcpack）をブラウザ内で解凍し、
 * blockId → 6面テクスチャの Blob URL を返すマップを構築する。
 *
 * 対応形式:
 *   - Java版: assets/minecraft/textures/block/<name>.png（直引き）
 *   - Bedrock版: textures/blocks/<name>.png + blocks.json + textures/terrain_texture.json
 *     （Bedrock は名前が Java と全然違うので JSON 経由で解決する）
 *
 * 公開 API:
 *   - loadFromZip(file)               : .zip を解凍してパックをアクティブ化
 *   - getFaceUrls(blockId)            : { east, west, top, bottom, north, south }
 *   - hasTexture(blockId)             : 取得可能か
 *   - getName() / getTextureCount()   : 状態確認
 *   - clear()                         : 既存パックを破棄して URL を解放
 * ────────────────────────────────────────────────────────────────────────────
 */

import { normalizeBedrockBlock } from './bedrock_normalize.js';

// ─── Java版アセットの定数定義 ───────────────────────────────────────────
const ASSETS_BASE = 'https://assets.mcasset.cloud/1.20.1/assets/minecraft/textures/block/';
const JAVA_VARIANTS = {
    'hay_block': { top: 'hay_block_top', side: 'hay_block_side' },
    'grass_block': { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    'stone_bricks': { all: 'stone_bricks' },
    'bricks': { all: 'bricks' },
    'crafting_table': { top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks' },
    'furnace': { top: 'furnace_top', side: 'furnace_side', front: 'furnace_front' },
    'tnt': { top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
    'bed': { all: 'red_bed' },
    'iron_door': { top: 'iron_door_top', bottom: 'iron_door_bottom' },
    'oak_door': { top: 'oak_door_top', bottom: 'oak_door_bottom' },
    'spruce_door': { top: 'spruce_door_top', bottom: 'spruce_door_bottom' },
    'birch_door': { top: 'birch_door_top', bottom: 'birch_door_bottom' },
    'jungle_door': { top: 'jungle_door_top', bottom: 'jungle_door_bottom' },
    'acacia_door': { top: 'acacia_door_top', bottom: 'acacia_door_bottom' },
    'dark_oak_door': { top: 'dark_oak_door_top', bottom: 'dark_oak_door_bottom' },
    'mangrove_door': { top: 'mangrove_door_top', bottom: 'mangrove_door_bottom' },
    'cherry_door': { top: 'cherry_door_top', bottom: 'cherry_door_bottom' },
    'pale_oak_door': { top: 'pale_oak_door_top', bottom: 'pale_oak_door_bottom' },
    'bamboo_door': { top: 'bamboo_door_top', bottom: 'bamboo_door_bottom' },
};
import { _getState, _isTrue } from './blockshapes.js';

function _getJSZip() {
    if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
    if (typeof JSZip !== 'undefined') return JSZip;
    if (typeof window !== 'undefined' && window.__jszipFailed) {
        throw new Error('JSZip CDN の読み込みに失敗しました（オフライン or 広告ブロッカー？）。再読み込みをお試しください。');
    }
    throw new Error('JSZip がロードされていません');
}

/* ─── 動的に JSZip を再ロード（CDN失敗時の手動リトライ用） ─────────── */
export async function ensureJSZip() {
    if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            window.__jszipFailed = false;
            resolve(window.JSZip);
        };
        script.onerror = () => reject(new Error('JSZip 再ロード失敗'));
        document.head.appendChild(script);
    });
}

// 内部状態（複数のモジュールインスタンスが生成される問題への対策として window グローバルを使用）
if (typeof window !== 'undefined') {
    if (!window.__MC_RESOURCE_PACK_STATE__) {
        window.__MC_RESOURCE_PACK_STATE__ = {
            name: '',
            /** filename(no ext) → blob URL（zip 内の全 PNG をパス末尾名で索引） */
            textures: new Map(),
            /** 'textures/blocks/foo' → blob URL（フルパスでも引けるように） */
            fullPath: new Map(),
            /** Bedrock blocks.json の解析結果（minecraft:xxx → { up, down, side, all }） */
            bedrockBlocks: null,
            /** Bedrock terrain_texture.json の texture_data（name → file path string） */
            bedrockTerrain: null,
            /** 元パックが Bedrock か */
            isBedrock: false,
        };
    }
}
const _state = typeof window !== 'undefined' ? window.__MC_RESOURCE_PACK_STATE__ : {
    name: '',
    textures: new Map(),
    fullPath: new Map(),
    bedrockBlocks: null,
    bedrockTerrain: null,
    isBedrock: false,
};

/* ─── Java 用 多面オーバーライド ───────────────────────────────────────── */
const FACE_OVERRIDES_JAVA = {
    'grass_block': { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    'mycelium':    { top: 'mycelium_top',    side: 'mycelium_side',    bottom: 'dirt' },
    'podzol':      { top: 'podzol_top',      side: 'podzol_side',      bottom: 'dirt' },
    'dirt_path':   { top: 'dirt_path_top',   side: 'dirt_path_side',   bottom: 'dirt' },
    'farmland':    { top: 'farmland',        side: 'dirt',             bottom: 'dirt' },
    'crafting_table': { top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks' },
    'furnace':     { top: 'furnace_top', side: 'furnace_side', front: 'furnace_front', bottom: 'furnace_top' },
    'tnt':         { top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
    'pumpkin':     { top: 'pumpkin_top', side: 'pumpkin_side' },
    'sandstone':   { top: 'sandstone_top', side: 'sandstone', bottom: 'sandstone_bottom' },
    'red_sandstone': { top: 'red_sandstone_top', side: 'red_sandstone', bottom: 'red_sandstone_bottom' },
    'quartz_block':{ top: 'quartz_block_top', side: 'quartz_block_side', bottom: 'quartz_block_bottom' },
    'hay_block':   { top: 'hay_block_top', side: 'hay_block_side' },
    'bone_block':  { top: 'bone_block_top', side: 'bone_block_side' },
    'magma_block': { all: 'magma' },
};

/* ─── Bedrock state → variant array index 早見表 ─────────────────────────
 * terrain_texture.json の textures が配列で variant を持つときのインデックス決定。
 */
const STATE_VARIANT_INDEX = {
    wood_type:        ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'],
    old_log_type:     ['oak', 'spruce', 'birch', 'jungle'],
    new_log_type:     ['acacia', 'dark_oak'],
    old_leaf_type:    ['oak', 'spruce', 'birch', 'jungle'],
    new_leaf_type:    ['acacia', 'dark_oak'],
    stone_type:       ['stone', 'granite', 'granite_smooth', 'diorite', 'diorite_smooth', 'andesite', 'andesite_smooth'],
    stone_brick_type: ['default', 'mossy', 'cracked', 'chiseled', 'smooth'],
    sand_stone_type:  ['default', 'heiroglyphs', 'cut', 'smooth'],
    dirt_type:        ['normal', 'coarse'],
    color:            ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'silver', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'],
    stone_slab_type:  ['smooth_stone', 'sandstone', 'wood', 'cobblestone', 'brick', 'stone_brick', 'quartz', 'nether_brick'],
    stone_slab_type_2:['red_sandstone', 'purpur', 'prismarine_rough', 'prismarine_dark', 'prismarine_brick', 'mossy_cobblestone', 'smooth_sandstone', 'red_nether_brick'],
    stone_slab_type_3:['end_stone_brick', 'smooth_red_sandstone', 'polished_andesite', 'andesite', 'diorite', 'polished_diorite', 'granite', 'polished_granite'],
    stone_slab_type_4:['mossy_stone_brick', 'smooth_quartz', 'stone', 'cut_sandstone', 'cut_red_sandstone'],
    monster_egg_stone_type: ['stone', 'cobblestone', 'stone_brick', 'mossy_stone_brick', 'cracked_stone_brick', 'chiseled_stone_brick'],
    upper_block_bit:  [0, 1], // 0=lower, 1=upper
    head_piece_bit:   [0, 1], // 0=foot, 1=head
};

function _resolveVariantIndex(states) {
    if (!states) return 0;
    
    // すべてのキーから 'minecraft:' を取り除いたクリーンなステートを作る
    const cleanStates = {};
    for (const k in states) {
        const cleanKey = k.replace(/^minecraft:/, '');
        cleanStates[cleanKey] = states[k];
    }

    // cleanStates を使って検索する
    for (const key of Object.keys(STATE_VARIANT_INDEX)) {
        if (cleanStates[key] !== undefined) {
            const arr = STATE_VARIANT_INDEX[key];
            const v = cleanStates[key];
            
            // 型に柔軟に対応してインデックスを探す
            let idx = arr.indexOf(v);
            if (idx === -1) idx = arr.indexOf(String(v));
            if (idx === -1) idx = arr.indexOf(Number(v));
            
            if (idx >= 0) return idx;
        }
    }
    return 0;
}

/* ─── 統合版→Java（直引きのフォールバック用）────────────────────────────── */
const BEDROCK_TO_JAVA = {
    'planks':            'oak_planks',
    'log':               'oak_log',
    'wool':              'white_wool',
    'concrete':          'white_concrete',
    'stained_glass':     'white_stained_glass',
    'stained_hardened_clay': 'white_terracotta',
    'hardened_clay':     'terracotta',
    'brick_block':       'bricks',
    'snow_layer':        'snow',
    'flowing_water':     'water_still',
    'water':             'water_still',
    'flowing_lava':      'lava_still',
    'lava':              'lava_still',
};

/* ─── ヘルパー ───────────────────────────────────────────────────────── */

function _parseLooseJSON(text) {
    // Bedrock の JSON は //コメント や末尾カンマを含む場合がある
    const stripped = text
        .replace(/\/\*[\s\S]*?\*\//g, '')        // /* */
        .replace(/^\s*\/\/.*$/gm, '')               // // line
        .replace(/,(\s*[}\]])/g, '$1');             // trailing commas
    return JSON.parse(stripped);
}

function _baseName(p) {
    return p.replace(/\\/g, '/').split('/').pop().replace(/\.(png|tga|jpe?g|webp)$/i, '').replace(/\.[^.]+$/, '');
}

/* ─── 公開 API ─────────────────────────────────────────────────────────── */


/* ─── IndexedDB 永続化（1つまで保存） ──────────────────────────────────── */
const _IDB_NAME = 'mc-planner';
const _IDB_STORE = 'packs';
const _IDB_STORE_STRUCTURES = 'structures';
const _IDB_VERSION = 10;
const _IDB_KEY = 'active';

function _openDB() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB が利用できません'));
            return;
        }
        const req = indexedDB.open(_IDB_NAME, _IDB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(_IDB_STORE)) {
                db.createObjectStore(_IDB_STORE);
            }
            if (!db.objectStoreNames.contains(_IDB_STORE_STRUCTURES)) {
                db.createObjectStore(_IDB_STORE_STRUCTURES);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** ZIP Blob を IndexedDB に保存（1つだけ。既存は上書き） */
export async function savePackToIDB(blob, fileName) {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(_IDB_STORE, 'readwrite');
        const store = tx.objectStore(_IDB_STORE);
        store.put({
            blob,
            name: fileName || 'pack.zip',
            savedAt: Date.now(),
            size: blob.size,
        }, _IDB_KEY);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** 保存されたパックを取得 */
export async function loadSavedPackFromIDB() {
    let db;
    try { db = await _openDB(); } catch (e) { return null; }
    return new Promise((resolve, reject) => {
        const tx = db.transaction(_IDB_STORE, 'readonly');
        const store = tx.objectStore(_IDB_STORE);
        const req = store.get(_IDB_KEY);
        req.onsuccess = () => { db.close(); resolve(req.result || null); };
        req.onerror = () => { db.close(); reject(req.error); };
    });
}

/** 保存されたパックを削除 */
export async function clearSavedPack() {
    let db;
    try { db = await _openDB(); } catch (e) { return; }
    return new Promise((resolve) => {
        const tx = db.transaction(_IDB_STORE, 'readwrite');
        tx.objectStore(_IDB_STORE).delete(_IDB_KEY);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); resolve(false); };
    });
}


/** TGA ファイルをデコードして PNG Blob に変換 */
async function _tgaToPngBlob(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const header = data.slice(0, 18);
    const idLength = header[0];
    const imageType = header[2]; // 2=Uncompressed True-Color, 10=Run-length encoded True-Color
    const width = header[12] | (header[13] << 8);
    const height = header[14] | (header[15] << 8);
    const pixelDepth = header[16];

    if (imageType !== 2 && imageType !== 10) return null;
    if (pixelDepth !== 24 && pixelDepth !== 32) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const pixels = imgData.data;

    let offset = 18 + idLength;
    const bytesPerPixel = pixelDepth / 8;

    const getPixel = (idx) => {
        const b = data[offset++];
        const g = data[offset++];
        const r = data[offset++];
        const a = (bytesPerPixel === 4) ? data[offset++] : 255;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = a;
    };

    let p = 0;
    const totalPixels = width * height;
    if (imageType === 2) {
        for (let i = 0; i < totalPixels; i++) getPixel(i * 4);
    } else {
        while (p < totalPixels) {
            const chunkHeader = data[offset++];
            const count = (chunkHeader & 0x7f) + 1;
            if (chunkHeader & 0x80) {
                const b = data[offset++]; const g = data[offset++]; const r = data[offset++];
                const a = (bytesPerPixel === 4) ? data[offset++] : 255;
                for (let i = 0; i < count; i++) {
                    pixels[(p + i) * 4] = r; pixels[(p + i) * 4 + 1] = g;
                    pixels[(p + i) * 4 + 2] = b; pixels[(p + i) * 4 + 3] = a;
                }
                p += count;
            } else {
                for (let i = 0; i < count; i++) getPixel((p + i) * 4);
                p += count;
            }
        }
    }
    if (!(header[17] & 0x20)) {
        const rowSize = width * 4;
        const temp = new Uint8Array(rowSize);
        for (let y = 0; y < Math.floor(height / 2); y++) {
            const top = y * rowSize;
            const bottom = (height - 1 - y) * rowSize;
            temp.set(pixels.subarray(top, top + rowSize));
            pixels.set(pixels.subarray(bottom, bottom + rowSize), top);
            pixels.set(temp, bottom);
        }
    }
    ctx.putImageData(imgData, 0, 0);
    return new Promise(res => canvas.toBlob(res, 'image/png'));
}


export async function loadFromZip(file) {
    clear();
    let JSZipLib;
    try {
        JSZipLib = _getJSZip();
    } catch (e) {
        JSZipLib = await ensureJSZip();
    }
    const zip = await JSZipLib.loadAsync(file);

    const tasks = [];
    let textureCount = 0;
    zip.forEach((path, entry) => {
        if (entry.dir) return;
        const lPath = path.toLowerCase();
        const isPng = lPath.endsWith('.png');
        const isTga = lPath.endsWith('.tga');
        if (!isPng && !isTga) return;

        tasks.push((async () => {
            try {
                let blob;
                if (isPng) {
                    blob = await entry.async('blob');
                } else {
                    const buf = await entry.async('arraybuffer');
                    blob = await _tgaToPngBlob(buf);
                    if (!blob) return;
                }
                const url = URL.createObjectURL(blob);
                const normPath = path.replace(/\\/g, '/');
                const name = _baseName(normPath);
                if (!_state.textures.has(name)) _state.textures.set(name, url);
                const fullKey = lPath.replace(/\.(png|tga)$/, '');
                _state.fullPath.set(fullKey, url);
                textureCount++;
            } catch (e) { console.warn('Texture load fail:', path, e); }
        })());
    });
    await Promise.all(tasks);

    // 2) Bedrock の JSON マッピングがあればパース
    //    Mojang の bedrock-samples は resource_pack/ 配下、Faithful 等は root
    const ttFile = zip.file('textures/terrain_texture.json')
                || zip.file('resource_pack/textures/terrain_texture.json');
    const bjFile = zip.file('blocks.json')
                || zip.file('resource_pack/blocks.json');
    if (ttFile) {
        try {
            const ttJson = _parseLooseJSON(await ttFile.async('text'));
            _state.bedrockTerrain = ttJson.texture_data || null;
            _state.isBedrock = true;
        } catch (e) {
            console.warn('terrain_texture.json parse failed:', e.message);
        }
    }
    // terrain_texture.json がなくても textures/blocks/ があれば Bedrock 扱いにする
    if (!_state.isBedrock) {
        const hasBlockDir = zip.folder(/textures\/blocks/i).length > 0 
                         || zip.folder(/resource_pack\/textures\/blocks/i).length > 0;
        if (hasBlockDir) {
            console.log('--- ResourcePack: No terrain_texture.json found, but textures/blocks/ folder exists. Enabling Bedrock mode. ---');
            _state.isBedrock = true;
        }
    }
    if (bjFile) {
        try {
            const bjJson = _parseLooseJSON(await bjFile.async('text'));
            // メタフィールドを除外しつつ、prefix 付き・無し 両方の形でインデックス
            const blocks = {};
            const META = new Set(['format_version']);
            for (const [k, v] of Object.entries(bjJson)) {
                if (META.has(k)) continue;
                if (typeof v !== 'object' || v === null) continue;
                if (!v.textures && !v.carried_textures) continue;
                const lower = k.toLowerCase();
                blocks[lower] = v;
                // prefix 付きでも引けるように
                if (!lower.startsWith('minecraft:')) blocks['minecraft:' + lower] = v;
                else blocks[lower.replace(/^minecraft:/, '')] = v;
            }
            _state.bedrockBlocks = blocks;
            _state.isBedrock = true;
        } catch (e) {
            console.warn('blocks.json parse failed:', e.message);
        }
    }



    _state.name = (file.name || 'pack').replace(/\.(zip|jar|mcpack)$/i, '');
    if (textureCount === 0) throw new Error('PNG が見つかりませんでした');

    return {
        name: _state.name,
        count: textureCount,
        isBedrock: _state.isBedrock,
        bedrockBlockEntries: _state.bedrockBlocks ? Object.keys(_state.bedrockBlocks).length : 0,
    };
}

export function clear() {
    for (const url of _state.textures.values()) {
        try { URL.revokeObjectURL(url); } catch (_) {}
    }
    _state.textures.clear();
    _state.fullPath.clear();
    _state.bedrockBlocks = null;
    _state.bedrockTerrain = null;
    _state.isBedrock = false;
    _state.name = '';
}

export function getName() { return _state.name; }
export function getTextureCount() { return _state.textures.size; }
export function isLoaded() { return _state.textures.size > 0; }

/* ─── テクスチャ名 → URL の解決（Bedrock の terrain_texture を介す）────── */
function _resolveTextureKey(key, variantIdx = 0) {
    if (!key) return null;
    let tint = null;

    if (typeof key !== 'string') {
        if (Array.isArray(key) && key.length > 0) {
            const i = Math.min(Math.max(0, variantIdx), key.length - 1);
            key = key[i];
        } else if (typeof key === 'object' && key.path) {
            if (key.overlay_color) tint = key.overlay_color;
            key = key.path;
        } else return null;
    }

    // terrain_texture.json 経由での解決
    if (_state.bedrockTerrain && _state.bedrockTerrain[key]) {
        let entry = _state.bedrockTerrain[key];
        let path = entry.textures;
        if (Array.isArray(path)) {
            const i = Math.min(Math.max(0, variantIdx), path.length - 1);
            path = path[i];
        }
        if (typeof path === 'object' && path !== null) {
            if (path.overlay_color) tint = path.overlay_color;
            path = path.path;
        }
        if (typeof path === 'string') {
            const lower = path.toLowerCase();
            let url = _state.fullPath.get(lower) || _state.fullPath.get('resource_pack/' + lower) || _state.textures.get(_baseName(lower));
            if (url) return tint ? { url, tint } : url;
        }
    }

    // terrain_texture に無い場合、キー名を直接パスとみなして探す (Faithful対策)
    const lower = key.toLowerCase();
    // flattened_stone -> stone のように変換して試行
    const altKeys = [lower, lower.replace(/^flattened_/, '')];
    for (const k of altKeys) {
        let url = _state.fullPath.get(k) || _state.fullPath.get('textures/blocks/' + k) || _state.fullPath.get('resource_pack/textures/blocks/' + k) || _state.textures.get(k);
        if (url) return tint ? { url, tint } : url;
    }
    return null;
}

/* ─── Bedrock blocks.json 形式の textures プロパティを 6面に展開 ───────── */

/* ─── flat blockId → 推定 states（variant index 解決のため） ───────────── */
function _deriveStatesFromFlatId(blockId) {
    const local = String(blockId).toLowerCase().replace(/^minecraft:/, '');

    // 色プリフィックス
    const colorMatch = local.match(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(.+)$/);
    if (colorMatch) {
        const c = colorMatch[1] === 'light_gray' ? 'silver' : colorMatch[1];
        return { color: c };
    }

    // 木材
    const woodMatch = local.match(/^(oak|spruce|birch|jungle|acacia|dark_oak)_/);
    if (woodMatch) {
        const w = woodMatch[1];
        return { wood_type: w, old_log_type: w, new_log_type: w, old_leaf_type: w, new_leaf_type: w };
    }

    // 石/閃緑岩/安山岩 派生
    const stoneTypeMap = {
        'polished_andesite': 'andesite_smooth',
        'andesite': 'andesite',
        'polished_diorite': 'diorite_smooth',
        'diorite': 'diorite',
        'polished_granite': 'granite_smooth',
        'granite': 'granite',
    };
    if (stoneTypeMap[local]) return { stone_type: stoneTypeMap[local] };

    // 石レンガ
    if (local === 'mossy_stone_bricks') return { stone_brick_type: 'mossy' };
    if (local === 'cracked_stone_bricks') return { stone_brick_type: 'cracked' };
    if (local === 'chiseled_stone_bricks') return { stone_brick_type: 'chiseled' };
    if (local === 'stone_bricks') return { stone_brick_type: 'default' };

    // 砂岩
    if (local === 'chiseled_sandstone') return { sand_stone_type: 'heiroglyphs' };
    if (local === 'cut_sandstone') return { sand_stone_type: 'cut' };
    if (local === 'smooth_sandstone') return { sand_stone_type: 'smooth' };

    // 砂
    if (local === 'coarse_dirt') return { dirt_type: 'coarse' };

    return null;
}


/* ─── 葉/草/植物のハードコード biome tint ─────────────────────────────
 * terrain_texture.json に overlay_color が無いパック（Faithful の一部 / Java互換）でも
 * 緑の葉になるよう、blockId ベースで定数着色を当てる。
 */
const HARDCODED_TINTS = {
    // 葉（明るい樹木の葉色 / ジャングルは少し濃い）
    'oak_leaves':     '#48b518',
    'spruce_leaves':  '#619961',
    'birch_leaves':   '#80a755',
    'jungle_leaves':  '#30bb0b',
    'acacia_leaves':  '#48b518',
    'dark_oak_leaves':'#48b518',
    'mangrove_leaves':'#48b518',
    'azalea_leaves':  '#48b518',
    'flowering_azalea_leaves': '#48b518',
    'pale_oak_leaves': '#a8b08c',
    // ツタ・苔（Bedrock では通常 tint 不要だが念のため）
    'vine':           '#48b518',
    // 高い草（短い草・シダ）
    'tall_grass':     '#7fb238',
    'short_grass':    '#7fb238',
    'fern':           '#7fb238',
    'large_fern':     '#7fb238',
    // 草ブロックは grass_side が overlay_color を持っているので除外（重複適用回避）
};

function _hardcodedTintFor(blockId) {
    const local = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    return HARDCODED_TINTS[local] || null;
}

/* ─── 安全な明示エイリアス（Bedrock blocks.json に flat ID 入っていない場合のみ） ───
 * NOTE: 旧 FLAT_TO_AGGREGATE は撤廃。
 *   理由: 'grass_block' → 'grass' のような置換は、blocks.json 仕様によっては
 *   別ブロック（背の高い草）にぶつかって無関係なテクスチャを誤って引いてしまう。
 *   現代の bedrock-samples (1.21+) では各 flat ID が直接エントリ化されているため、
 *   このフォールバックは原則不要。どうしても必要なものだけ最小限ホワイトリスト。
 */
const SAFE_ALIASES = {
    // grass_block: bedrock-samples の blocks.json では 'grass' エントリが grass_block に対応
    // （Tall Grass は別の 'tall_grass' エントリ）
    'grass_block': 'grass',
    'dirt_path':   'grass_path',
};

function _expandBedrockTextures(blockId, rawId) {
    if (!_state.bedrockBlocks) return { entry: null, fallbackUsed: false };
    
    // 1. 最初にサニタイズを完了させる
    const idLower = blockId.toLowerCase();
    let local = idLower.replace(/^minecraft:/, '');
    let fallbackUsed = false;

    if (local.includes('double')) {
        local = local.replace(/_double_|^double_|_double/g, '').replace(/^_|_$/g, '');
        if (!local.includes('slab')) local += '_slab';
        fallbackUsed = true;
    }
    const id = 'minecraft:' + local;

    // 2. 書き換えた ID で辞書を引く
    let entry = _state.bedrockBlocks[id];

    // rawId が与えられたらそれを優先で見る（汎用ID + states 経路）
    if (rawId && String(rawId).toLowerCase() !== id) {
        const rawEntry = _state.bedrockBlocks[String(rawId).toLowerCase()];
        if (rawEntry) { entry = rawEntry; fallbackUsed = true; }
    }
    if (!entry) {
        const local = id.replace(/^minecraft:/, '');

        fallbackUsed = true;
        // (a) 安全な明示エイリアスのみ（ハードコード／少数）
        if (SAFE_ALIASES[local]) {
            entry = _state.bedrockBlocks['minecraft:' + SAFE_ALIASES[local]]
                 || _state.bedrockBlocks[SAFE_ALIASES[local]];
        }

        // (b) 派生 → base block（階段/ハーフ/壁/フェンス門/ドア/落し戸）
        // 例: cobblestone_wall → cobblestone, stone_brick_stairs → stone_bricks
        // 注：bedrock blocks.json は 'cobblestone_wall' を直接持つことが多いので
        // ここに落ちるのは古いパック or 未収録のブロックだけ。
        if (!entry) {
            // 優先度の高い順に剥ぎ取る： double -> slab/stairs -> その他
            const REPLACEMENTS = [
                [/_double_|^double_|_double$/g, '_'], // まず double を消してハーフ/階段の状態にする
                [/_stairs$/, ''],
                [/_slab$/, ''],
                [/_wall$/, ''],
                [/_fence_gate$/, '_fence'],
                [/_trapdoor$/, ''],
            ];

            let currentId = local;
            for (const [re, repl] of REPLACEMENTS) {
                const nextId = currentId.replace(re, repl).replace('__', '_').replace(/^_|_$/g, '');
                if (nextId !== currentId) {
                    currentId = nextId;
                    entry = _state.bedrockBlocks['minecraft:' + currentId] || _state.bedrockBlocks[currentId];
                    if (entry) break;
                }
            }

            // まだ見つからない場合、'oak' -> 'oak_planks' のようにサフィックス補完を試す
            if (!entry && currentId !== local) {
                const bases = [currentId + 's', currentId + '_planks', currentId + '_block'];
                for (const b of bases) {
                    entry = _state.bedrockBlocks['minecraft:' + b] || _state.bedrockBlocks[b];
                    if (entry) break;
                }
            }
        }

        // (c) 色プリフィックス除去（white_concrete → concrete 等）
        if (!entry) {
            const colorMatch = local.match(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_(.+)$/);
            if (colorMatch) {
                const base = colorMatch[2];
                const SAFE_COLOR_BASES = new Set([
                    'wool', 'concrete', 'concrete_powder', 'stained_glass', 'stained_glass_pane',
                    'terracotta', 'glazed_terracotta', 'shulker_box', 'bed', 'carpet', 'candle', 'banner',
                ]);
                if (SAFE_COLOR_BASES.has(base)) {
                    entry = _state.bedrockBlocks['minecraft:' + base]
                         || _state.bedrockBlocks[base];
                }
            }
        }

        // (d) 木材プリフィックス除去（spruce_planks → planks 等、variant index は別途解決）
        // SAFE_WOOD_BASES に登録された aggregate のみ許可。
        if (!entry) {
            const woodMatch = local.match(/^(oak|spruce|birch|jungle|acacia|dark_oak)_(.+)$/);
            if (woodMatch) {
                const w = woodMatch[1];
                const base = woodMatch[2];
                // 木材→aggregate の置換。一部は log/leaves が log2/leaves2 に分かれているので個別ハンドル。
                const isLog = (base === 'log' || base === 'wood');
                const isLeaves = (base === 'leaves');
                let aggregate = null;
                if (base === 'planks') aggregate = 'planks';
                else if (base === 'slab') aggregate = 'wooden_slab';
                else if (isLog && (w === 'acacia' || w === 'dark_oak')) aggregate = 'log2';
                else if (isLog) aggregate = 'log';
                else if (isLeaves && (w === 'acacia' || w === 'dark_oak')) aggregate = 'leaves2';
                else if (isLeaves) aggregate = 'leaves';
                if (aggregate) {
                    entry = _state.bedrockBlocks['minecraft:' + aggregate]
                         || _state.bedrockBlocks[aggregate];
                }
            }
        }
    }
    if (!entry) return null;
    const tex = entry.textures || entry.carried_textures;
    if (!tex) return null;
    // 戻り値に fallback フラグを混ぜる：getFaceUrls で variantIdx を再計算するため
    if (typeof tex === 'string') {
        return { all: tex, _fallback: fallbackUsed };
    }
    if (typeof tex === 'string') {
        return { all: tex };
    }
    if (typeof tex === 'object') {
        return {
            up:    tex.up,
            down:  tex.down,
            side:  tex.side,
            north: tex.north || tex.side,
            south: tex.south || tex.side,
            east:  tex.east  || tex.side,
            west:  tex.west  || tex.side,
            _fallback: fallbackUsed,
        };
    }
    return null;
}

/**
 * blockId → 6面テクスチャ URL（BoxGeometry の groups 順）
 */
export function getFaceUrls(blockId, options = {}) {
    if (options.debug) {
        console.log(` --- ResourcePack v2.5.11: getFaceUrls --- [${blockId}]`);
    }
    if (!isLoaded()) {
        console.log('   -> Pack not loaded (textures.size is 0).');
        return null;
    }
    const { rawId = null, states = null } = options;
    const idLower = String(blockId).toLowerCase();
    let local = idLower.replace(/^minecraft:/, '');

    // normalizeBedrockBlock を使用して正規化（一貫性のため）
    const norm = normalizeBedrockBlock(blockId, states || {});
    let sanitizedIdLower = norm.id;
    // ダブルスラブ完全統合プロトコル: _double_slab の場合はベース素材にフォールバック
    if (sanitizedIdLower.endsWith('_double_slab')) {
        // もし _double_slab 自体が辞書にない場合は、元素材のテクスチャを探す
        if (!_state.bedrockBlocks?.[sanitizedIdLower] && !_state.bedrockTerrain?.[sanitizedIdLower]) {
             const baseSlab = sanitizedIdLower.replace('_double_slab', '_slab');
             if (_state.bedrockBlocks?.[baseSlab] || _state.bedrockTerrain?.[baseSlab]) {
                 sanitizedIdLower = baseSlab;
             } else {
                 const base = sanitizedIdLower.replace('_double_slab', '');
                 if (_state.bedrockBlocks?.[base] || _state.bedrockTerrain?.[base]) sanitizedIdLower = base;
             }
        }
    }
    local = sanitizedIdLower.replace(/^minecraft:/, '');

    // 1. 最優先で着色（Tint）を決定
    let tint = null;
    if (local.includes('grass') || local.includes('leaves') || 
        local.includes('vine') || local.includes('fern') || 
        local.includes('stem') || local.includes('lily_pad')) {
        tint = 0x79c05a; 
    }

    // 2. ドアの上下判定（最優先で処理、無限ループ防止のため直接処理）
    if (local.includes('_door') && !local.includes('item')) {
        const isUpper = _isTrue(_getState(options.states, 'upper_block_bit'));
        const doorBase = local.replace('minecraft:', '').replace('_door', '');
        const javaDoorId = doorBase + '_door';
        const variant = JAVA_VARIANTS[javaDoorId];
        
        if (variant) {
            const halfTex = isUpper ? (ASSETS_BASE + variant.top + '.png') : (ASSETS_BASE + variant.bottom + '.png');
            const edgeTex = (ASSETS_BASE + variant.top + '.png');
            const normU = (u) => ({ url: u, tint: null });
            return {
                east: normU(halfTex), west: normU(halfTex),
                top: normU(edgeTex), bottom: normU(edgeTex),
                north: normU(halfTex), south: normU(halfTex),
                found: true
            };
        }
    }

    // states が薄い場合は flat blockId から推定（color/wood_type/stone_type 等）
    let effectiveStates = states;
    if (!states || Object.keys(states).length === 0) {
        const derived = _deriveStatesFromFlatId(blockId);
        if (derived) effectiveStates = derived;
    }
    const variantIdx = _resolveVariantIndex(effectiveStates);

    // ─── (A) Bedrock 経路 ─────────────────────────────────────────────
    if (_state.isBedrock) {
        const expanded = _expandBedrockTextures(sanitizedIdLower, rawId);
        if (expanded) {
            let useVariantIdx = variantIdx;
            if (expanded._fallback && (!effectiveStates || Object.keys(effectiveStates).length === 0)) {
                const derived = _deriveStatesFromFlatId(idLower);
                if (derived) useVariantIdx = _resolveVariantIndex(derived);
            } else if (expanded._fallback) {
                const derived = _deriveStatesFromFlatId(idLower);
                if (derived) useVariantIdx = _resolveVariantIndex({ ...derived, ...effectiveStates });
            }
            const top    = _resolveTextureKey(expanded.up   ?? expanded.all, useVariantIdx);
            const bottom = _resolveTextureKey(expanded.down ?? expanded.all, useVariantIdx) || top;
            const side   = _resolveTextureKey(expanded.side ?? expanded.all, useVariantIdx) || top;
            const east   = _resolveTextureKey(expanded.east, useVariantIdx) || side;
            const west   = _resolveTextureKey(expanded.west, useVariantIdx) || side;
            const north  = _resolveTextureKey(expanded.north, useVariantIdx) || side;
            const south  = _resolveTextureKey(expanded.south, useVariantIdx) || side;

            if (top || side) {
                console.log(`   -> Found in Bedrock dict: ${sanitizedIdLower}`);
                const toFaceObj = (v) => v == null ? null : (typeof v === 'string' ? { url: v, tint: null } : v);
                const hard = _hardcodedTintFor(idLower);
                const apply = (face) => {
                    if (!face) return null;
                    const o = { ...face };
                    if (hard && !o.tint) o.tint = hard;
                    return o;
                };
                return {
                    east: apply(toFaceObj(east)), west: apply(toFaceObj(west)),
                    top: apply(toFaceObj(top || side)), bottom: apply(toFaceObj(bottom || side)),
                    north: apply(toFaceObj(north)), south: apply(toFaceObj(south)),
                    found: true,
                };
            }
        }
        // Bedrock fallback: blocks.json に無くても textures/blocks/<local>.png があるか？
        const direct = _state.fullPath.get('textures/blocks/' + local) || _state.fullPath.get('resource_pack/textures/blocks/' + local);
        // 3. Bedrock ダイレクトパス
        if (direct) {
            const d = { url: direct, tint: tint };
            return { east: d, west: d, top: d, bottom: d, north: d, south: d, found: true };
        }

        const directTex = _state.textures.get(local);
        
        // 草ブロックの特殊処理
        if (local === 'grass_block' || local === 'grass') {
            const top = _state.textures.get('grass_carried') || _state.textures.get('grass_top') || directTex;
            const side = directTex;
            const bottom = _state.textures.get('dirt') || directTex;
            return {
                east: { url: side, tint: tint }, west: { url: side, tint: tint },
                top: { url: top, tint: tint }, bottom: { url: bottom, tint: null },
                north: { url: side, tint: tint }, south: { url: side, tint: tint },
                found: true
            };
        }

        const d = { url: directTex, tint: tint };
        if (directTex) return { east: d, west: d, top: d, bottom: d, north: d, south: d, found: true };

        const FILE_REPLACEMENTS = [
            [/_double_slab$/, '_slab'], // 最優先: double_slab -> slab
            [/_double_|^double_|_double$/g, '_'],
            [/_stairs$/, ''],
            [/_slab$/, ''],
            [/_wall$/, ''],
            [/_fence_gate$/, '_fence'],
            [/_trapdoor$/, ''],
        ];
        for (const [re, repl] of FILE_REPLACEMENTS) {
            const nextId = currentFileId.replace(re, repl).replace('__', '_').replace(/^_|_$/g, '');
            if (nextId !== currentFileId) {
                currentFileId = nextId;
                const baseUrl = _state.fullPath.get('textures/blocks/' + currentFileId)
                    || _state.fullPath.get('resource_pack/textures/blocks/' + currentFileId)
                    || _state.textures.get(currentFileId);
                if (baseUrl) {
                    const b = { url: baseUrl, tint: null };
                    return { east: b, west: b, top: b, bottom: b, north: b, south: b, found: true };
                }
            }
        }
    }

    // ─── (B-2) オンライン Java Assets (assets.mcasset.cloud) へのフォールバック
    console.log(`   -> Falling back to Java online assets for: ${local}`);
    
    // すべて normalizeBedrockBlock に任せる（一貫性のため）
    const normResult = normalizeBedrockBlock(blockId, options.states || {});
    let javaBaseId = normResult.id.replace('minecraft:', '');

    const variant = JAVA_VARIANTS[javaBaseId];
    const getU = (name) => name ? ASSETS_BASE + name + '.png' : null;

    // 草ブロックや葉っぱの色（緑色）を決定
    if (javaBaseId.includes('grass') || javaBaseId.includes('leaves') || 
        javaBaseId.includes('vine') || javaBaseId.includes('fern') || 
        javaBaseId.includes('stem') || javaBaseId.includes('lily_pad')) {
        tint = 0x79c05a; // マイクラの標準的な草の色
    }

    const normU = (u, forceTint = null) => {
        if (!u) return null;
        // top 以外は基本色をつけない（草ブロックの土部分を守るため）などの調整が可能だが
        // ここではシンプルに指定があれば適用する
        return { url: u, tint: forceTint };
    };

    if (variant) {
        const isUpper = _isTrue(_getState(options.states, 'upper_block_bit'));
        const isDoor = javaBaseId.includes('_door');

        let t = getU(variant.top || variant.all);
        let b = getU(variant.bottom || variant.all);
        let s = getU(variant.side || variant.all);
        let f = getU(variant.front || variant.side || variant.all);

        // ドアの場合：上下ステートに応じて全ての面を top か bottom に統一
        if (isDoor) {
            const halfTex = isUpper ? getU(variant.top) : getU(variant.bottom);
            const edgeTex = getU(variant.top); // 縁は適当に
            return {
                east: normU(halfTex, null), west: normU(halfTex, null),
                top: normU(edgeTex, null), bottom: normU(edgeTex, null),
                north: normU(halfTex, null), south: normU(halfTex, null),
                found: true
            };
        }

        // 草ブロックの場合、上面(top)と側面(side)の一部に色をつけ、底面(bottom=土)にはつけない
        if (javaBaseId === 'grass_block') {
            return { 
                east: normU(s, tint), west: normU(s, tint), 
                top: normU(t, tint), bottom: normU(b, null), 
                north: normU(f, tint), south: normU(s, tint), 
                found: true 
            };
        }

        return { east: normU(s, tint), west: normU(s, tint), top: normU(t, tint), bottom: normU(b, tint), north: normU(f, tint), south: normU(s, tint), found: true };
    }

    const fallbackUrl = ASSETS_BASE + javaBaseId + '.png';
    const f = normU(fallbackUrl, tint);
    return { east: f, west: f, top: f, bottom: f, north: f, south: f, found: true };
}

export function listAvailable() { return Array.from(_state.textures.keys()).sort(); }


/* ─── 構造バッファ永続化 (.mcstructure を再アップロード不要に) ─────────── */

/** 構造の ArrayBuffer / Blob を IndexedDB に保存 */
export async function saveStructureBuffer(structureId, buffer, name = '', edition = 'bedrock') {
    const db = await _openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(_IDB_STORE_STRUCTURES, 'readwrite');
        const store = tx.objectStore(_IDB_STORE_STRUCTURES);
        // ArrayBuffer はそのまま保存可能（IDB は ArrayBuffer 対応）
        store.put({
            buffer,
            name,
            edition,
            savedAt: Date.now(),
            size: buffer.byteLength || buffer.size || 0,
        }, structureId);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** 構造1つを取得 */
export async function loadStructureBuffer(structureId) {
    let db;
    try { db = await _openDB(); } catch (_) { return null; }
    return new Promise((resolve) => {
        const tx = db.transaction(_IDB_STORE_STRUCTURES, 'readonly');
        const req = tx.objectStore(_IDB_STORE_STRUCTURES).get(structureId);
        req.onsuccess = () => { db.close(); resolve(req.result || null); };
        req.onerror = () => { db.close(); resolve(null); };
    });
}

/** 全構造のバッファを Map で返す */
export async function loadAllStructureBuffers() {
    let db;
    try { db = await _openDB(); } catch (_) { return new Map(); }
    return new Promise((resolve) => {
        const out = new Map();
        const tx = db.transaction(_IDB_STORE_STRUCTURES, 'readonly');
        const store = tx.objectStore(_IDB_STORE_STRUCTURES);
        const req = store.openCursor();
        req.onsuccess = () => {
            const cur = req.result;
            if (cur) { out.set(cur.key, cur.value); cur.continue(); }
            else { db.close(); resolve(out); }
        };
        req.onerror = () => { db.close(); resolve(out); };
    });
}

/** 構造1つを削除 */
export async function deleteStructureBuffer(structureId) {
    let db;
    try { db = await _openDB(); } catch (_) { return false; }
    return new Promise((resolve) => {
        const tx = db.transaction(_IDB_STORE_STRUCTURES, 'readwrite');
        tx.objectStore(_IDB_STORE_STRUCTURES).delete(structureId);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); resolve(false); };
    });
}

/** 全構造バッファを削除（プロジェクト全消し時用） */
export async function clearAllStructureBuffers() {
    let db;
    try { db = await _openDB(); } catch (_) { return false; }
    return new Promise((resolve) => {
        const tx = db.transaction(_IDB_STORE_STRUCTURES, 'readwrite');
        tx.objectStore(_IDB_STORE_STRUCTURES).clear();
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); resolve(false); };
    });
}
