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

const _state = {
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
    return p.replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '');
}

/* ─── 公開 API ─────────────────────────────────────────────────────────── */


/* ─── IndexedDB 永続化（1つまで保存） ──────────────────────────────────── */
const _IDB_NAME = 'mc-planner';
const _IDB_STORE = 'packs';
const _IDB_STORE_STRUCTURES = 'structures';
const _IDB_VERSION = 2;
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

export async function loadFromZip(file) {
    clear();
    let JSZipLib;
    try {
        JSZipLib = _getJSZip();
    } catch (e) {
        // CDN 失敗時に再ロードを試みる
        JSZipLib = await ensureJSZip();
    }
    const zip = await JSZipLib.loadAsync(file);

    // 1) PNG 全部抽出
    const pngTasks = [];
    let textureCount = 0;
    zip.forEach((path, entry) => {
        if (entry.dir) return;
        if (!/\.png$/i.test(path)) return;
        pngTasks.push(entry.async('blob').then(blob => {
            const url = URL.createObjectURL(blob);
            const lower = path.toLowerCase();
            const name = _baseName(lower);
            if (!_state.textures.has(name)) _state.textures.set(name, url);
            // フルパスから .png 抜きを保存（terrain_texture から引くため）
            const fullKey = lower.replace(/\.png$/, '');
            _state.fullPath.set(fullKey, url);
            textureCount++;
        }));
    });

    // 2) Bedrock の JSON マッピングがあればパース
    const ttFile = zip.file('textures/terrain_texture.json');
    const bjFile = zip.file('blocks.json');
    if (ttFile) {
        try {
            const ttJson = _parseLooseJSON(await ttFile.async('text'));
            _state.bedrockTerrain = ttJson.texture_data || null;
            _state.isBedrock = true;
        } catch (e) {
            console.warn('terrain_texture.json parse failed:', e.message);
        }
    }
    if (bjFile) {
        try {
            const bjJson = _parseLooseJSON(await bjFile.async('text'));
            // format_version / 他のメタは除外
            const blocks = {};
            for (const [k, v] of Object.entries(bjJson)) {
                if (k.includes(':')) blocks[k.toLowerCase()] = v;
            }
            _state.bedrockBlocks = blocks;
            _state.isBedrock = true;
        } catch (e) {
            console.warn('blocks.json parse failed:', e.message);
        }
    }

    await Promise.all(pngTasks);

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
function _resolveTextureKey(key) {
    if (!key) return null;
    if (typeof key !== 'string') {
        // 配列の場合は先頭採用
        if (Array.isArray(key) && key.length > 0) key = key[0];
        else if (typeof key === 'object' && key.path) key = key.path;
        else return null;
    }
    // Bedrock terrain_texture.json から引く
    if (_state.bedrockTerrain && _state.bedrockTerrain[key]) {
        let entry = _state.bedrockTerrain[key];
        let path = entry.textures;
        // textures が配列の場合は先頭
        if (Array.isArray(path)) path = path[0];
        // textures がオブジェクトの場合（{path, overlay_color}など）
        if (typeof path === 'object' && path !== null) path = path.path;
        if (typeof path === 'string') {
            const url = _state.fullPath.get(path.toLowerCase());
            if (url) return url;
            // ファイル名末尾だけで再試行
            return _state.textures.get(_baseName(path.toLowerCase())) || null;
        }
    }
    // 直接 ベース名 / フルパスとして引く
    const lower = key.toLowerCase();
    return _state.fullPath.get(lower) || _state.textures.get(_baseName(lower)) || null;
}

/* ─── Bedrock blocks.json 形式の textures プロパティを 6面に展開 ───────── */
/* flat ID → 旧 aggregate ID マッピング（Bedrock 仕様の歴史的差分） */
const FLAT_TO_AGGREGATE = {
    'grass_block': 'grass',
    'dirt_path': 'grass_path',
    'oak_leaves': 'leaves',
    'spruce_leaves': 'leaves',
    'birch_leaves': 'leaves',
    'jungle_leaves': 'leaves',
    'acacia_leaves': 'leaves2',
    'dark_oak_leaves': 'leaves2',
    'oak_log': 'log',
    'spruce_log': 'log',
    'birch_log': 'log',
    'jungle_log': 'log',
    'acacia_log': 'log2',
    'dark_oak_log': 'log2',
    'oak_planks': 'planks',
    'spruce_planks': 'planks',
    'birch_planks': 'planks',
    'jungle_planks': 'planks',
    'acacia_planks': 'planks',
    'dark_oak_planks': 'planks',
    'snow_block': 'snow',
    'snow': 'snow_layer',
    'redstone_wire': 'redstone_dust',
};

function _expandBedrockTextures(blockId) {
    if (!_state.bedrockBlocks) return null;
    const id = blockId.toLowerCase();
    let entry = _state.bedrockBlocks[id];
    if (!entry) {
        const local = id.replace(/^minecraft:/, '');
        // (a) flat → aggregate 名で再試行
        if (FLAT_TO_AGGREGATE[local]) {
            entry = _state.bedrockBlocks['minecraft:' + FLAT_TO_AGGREGATE[local]];
        }
        // (b) 階段/ハーフ/壁/フェンス/ドア → base block
        if (!entry) {
            const baseId = local
                .replace(/_stairs$/, '')
                .replace(/_slab$/, '')
                .replace(/^double_/, '')
                .replace(/_wall$/, '')
                .replace(/_fence_gate$/, '_fence')
                .replace(/_door$/, '')
                .replace(/_trapdoor$/, '');
            if (baseId !== local) {
                entry = _state.bedrockBlocks['minecraft:' + baseId];
                // base block 自体に「_planks」付きで存在することも
                if (!entry && !baseId.endsWith('_planks')) {
                    entry = _state.bedrockBlocks['minecraft:' + baseId + '_planks'];
                }
            }
        }
        // (c) 色プリフィックス除去
        if (!entry) {
            const candidates = [
                'minecraft:' + local.replace(/^(white|orange|magenta|light_blue|yellow|lime|pink|gray|light_gray|cyan|purple|blue|brown|green|red|black)_/, ''),
            ];
            for (const c of candidates) {
                if (_state.bedrockBlocks[c]) { entry = _state.bedrockBlocks[c]; break; }
            }
        }
    }
    if (!entry || !entry.textures) return null;
    const tex = entry.textures;
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
        };
    }
    return null;
}

/**
 * blockId → 6面テクスチャ URL（BoxGeometry の groups 順）
 */
export function getFaceUrls(blockId) {
    if (!isLoaded()) return null;
    const idLower = String(blockId).toLowerCase();
    const local = idLower.replace(/^minecraft:/, '');

    // ─── (A) Bedrock 経路 ─────────────────────────────────────────────
    if (_state.isBedrock) {
        const expanded = _expandBedrockTextures(idLower);
        if (expanded) {
            const top    = _resolveTextureKey(expanded.up   ?? expanded.all);
            const bottom = _resolveTextureKey(expanded.down ?? expanded.all) || top;
            const side   = _resolveTextureKey(expanded.side ?? expanded.all) || top;
            const east   = _resolveTextureKey(expanded.east) || side;
            const west   = _resolveTextureKey(expanded.west) || side;
            const north  = _resolveTextureKey(expanded.north) || side;
            const south  = _resolveTextureKey(expanded.south) || side;
            if (top || side) {
                return { east, west, top: top || side, bottom: bottom || side, north, south, found: true };
            }
        }
        // Bedrock fallback: blocks.json に無くても textures/blocks/<local>.png があるか？
        const direct = _state.fullPath.get('textures/blocks/' + local);
        if (direct) {
            return { east: direct, west: direct, top: direct, bottom: direct, north: direct, south: direct, found: true };
        }
        // 派生 → base 名でも試す
        const baseId = local
            .replace(/_stairs$/, '')
            .replace(/_slab$/, '')
            .replace(/^double_/, '')
            .replace(/_wall$/, '')
            .replace(/_fence_gate$/, '_fence')
            .replace(/_door$/, '')
            .replace(/_trapdoor$/, '');
        if (baseId !== local) {
            const baseUrl = _state.fullPath.get('textures/blocks/' + baseId)
                || _state.textures.get(baseId);
            if (baseUrl) {
                return { east: baseUrl, west: baseUrl, top: baseUrl, bottom: baseUrl, north: baseUrl, south: baseUrl, found: true };
            }
        }
    }

    // ─── (B) Java 経路 ────────────────────────────────────────────────
    const javaId = BEDROCK_TO_JAVA[local] || local;
    const ov = FACE_OVERRIDES_JAVA[javaId];
    if (ov) {
        const top    = _state.textures.get(ov.top);
        const bottom = _state.textures.get(ov.bottom) || top;
        const side   = _state.textures.get(ov.side) || top;
        const front  = _state.textures.get(ov.front) || side;
        if (top || side) {
            return { east: side, west: side, top: top || side, bottom: bottom || top || side, north: front || side, south: side, found: true };
        }
    }
    let single = _state.textures.get(javaId);
    const top    = _state.textures.get(javaId + '_top') || single;
    const bottom = _state.textures.get(javaId + '_bottom') || single;
    const side   = _state.textures.get(javaId + '_side') || _state.textures.get(javaId + '_front') || single;
    if (single || top || side) {
        const t = top || side || single;
        const s = side || single || top;
        const b = bottom || single || top;
        return { east: s, west: s, top: t, bottom: b, north: s, south: s, found: true };
    }

    return null;
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
