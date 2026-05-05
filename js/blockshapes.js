/**
 * blockshapes.js — Bedrock 統合版のブロック形状を Three.js ジオメトリで再現
 *
 * 設計方針：deepslate / prismarine-viewer の Java BlockModel 慣習を参考に、
 * 「element box の集合」で形状を表現し、Bedrock の block_states に応じて
 * 配置・回転を決定する。
 *
 * 座標系：Three.js の各 mesh はブロック中心 (0, 0, 0) を中央とする 1×1×1 空間。
 *   X+ = 東 / X- = 西 / Y+ = 上 / Y- = 下 / Z+ = 南 / Z- = 北
 *
 * Bedrock states:
 *   weirdo_direction (stairs):   0=east, 1=west, 2=south, 3=north
 *     ※ 「ステア（上段の半分）が出ている方向」= ascend する向きと一致
 *   upside_down_bit (stairs):    0=normal, 1=top（天井に張り付く形）
 *   top_slot_bit (slab):         0=bottom, 1=top（新形式）
 *   vertical_half (legacy slab): 'bottom' / 'top'
 *   open_bit (door/trapdoor/gate): 0=closed, 1=open
 *   direction (door/trapdoor):   0=south, 1=west, 2=north, 3=east
 */

/** ブロックID から形状種別を判定 */
export function classifyShape(blockId, states = {}) {
    const id = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    if (id === 'stone') console.log('--- BlockShapes v2.5.2: classifyShape ---', id);
    
    // ダブルスラブ判定：ID名または states の bit 値
    if (id.includes('double')) return 'cube';
    const type = _getState(states, 'type');
    const doubleSlabBit = _getState(states, 'double_slab_bit');
    if (type === 'double' || doubleSlabBit === 1 || doubleSlabBit === true) return 'cube';

    if (/_stairs$/.test(id)) return 'stairs';
    if (/_slab$/.test(id)) {
        // ダブルスラブ完全統合プロトコルをベースにしつつ、矛盾を突破する
        const fullBlockKeywords = ['brick', 'plank', 'quartz', 'stone', 'sandstone', 'oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark', 'crimson', 'warped', 'mangrove', 'cherry', 'pale', 'bamboo'];
        
        // 状態を取得（上付きかどうか）
        const verticalHalf = _getState(states, 'vertical_half');
        const topSlot = _getState(states, 'top_slot_bit');
        const upsideDown = _getState(states, 'upside_down_bit');
        const isTop = (verticalHalf === 'top') || (topSlot === 1 || topSlot === true) || (upsideDown === 1 || upsideDown === true);

        // 「重い素材」かつ「上付き」の場合のみ、隙間を埋めるためにフルブロック（cube）にする
        // 下付きの場合は、たとえ石素材でもハーフ（slab）として描画（煙突対策）
        if (isTop && fullBlockKeywords.some(k => id.includes(k))) return 'cube';
        
        return 'slab';
    }
    if (/_fence_gate$/.test(id)) return 'fence_gate';
    if (/_fence$|^nether_brick_fence$/.test(id)) return 'fence';
    if (/_wall$|cobblestone_wall$|red_sandstone_wall$/.test(id)) return 'wall';
    if (/_trapdoor$/.test(id)) return 'trapdoor';
    if (/_door$/.test(id)) return 'door';
    if (/_carpet$|moss_carpet/.test(id)) return 'carpet';
    if (/pressure_plate$/.test(id)) return 'pressure_plate';
    if (/_button$/.test(id)) return 'button';
    if (/_pane$|^iron_bars$|^chain$/.test(id)) return 'pane';
    if (/torch$|^lantern$|^soul_lantern$/.test(id)) return 'small';
    return 'cube';
}

/** 'minecraft:' プレフィックスの有無に関わらずステート値を取得し、NBT形式(value)なら展開する */
export function _getState(states, key) {
    if (!states) return undefined;
    const v = states[key] ?? states['minecraft:' + key];
    if (v === undefined) return undefined;
    
    // NBTオブジェクト { type, value } の場合は .value を返す
    if (typeof v === 'object' && v !== null && 'value' in v) {
        return v.value;
    }
    return v;
}

/** 値が 1, "1", true のいずれかであるか判定する (Bedrock のビット値・真偽値対応) */
export function _isTrue(val) {
    return val === 1 || val === "1" || val === true || val === "true";
}

/** 
 * 方向を統一して返す (0=south, 1=west, 2=north, 3=east)
 * ※ cardinal_direction (文字列) と direction (数値) を統合
 */
export function _getDirection(states) {
    const d = _getState(states, 'direction') ?? _getState(states, 'cardinal_direction') ?? _getState(states, 'facing_direction');
    if (d === undefined) return 0;
    
    // 文字列形式 ("north", "south" 等)
    if (typeof d === 'string') {
        const map = { south: 0, west: 1, north: 2, east: 3, down: 4, up: 5 };
        return map[d.toLowerCase()] ?? 0;
    }
    
    // 数値形式 (Bedrock facing_direction: 2=N, 3=S, 4=W, 5=E)
    if (typeof d === 'number') {
        if (d === 2) return 2; // North
        if (d === 3) return 0; // South
        if (d === 4) return 1; // West
        if (d === 5) return 3; // East
        return d % 4;
    }
    return 0;
}

/* ─── 共通ヘルパー：位置と寸法から BoxGeometry を作る ──────────────────
 * cuboid(THREE, fromX, fromY, fromZ, toX, toY, toZ)
 *   from / to は 0..1 範囲（ブロック内座標）。
 *   生成された geometry は最終的に「ブロック中心 (0,0,0) を中央」にずらされる。
 */
function cuboid(THREE, fromX, fromY, fromZ, toX, toY, toZ) {
    const w = toX - fromX;
    const h = toY - fromY;
    const d = toZ - fromZ;
    const cx = (fromX + toX) / 2 - 0.5;
    const cy = (fromY + toY) / 2 - 0.5;
    const cz = (fromZ + toZ) / 2 - 0.5;
    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(cx, cy, cz);
    return geo;
}

/* ─── 階段 ───────────────────────────────────────────────────
 * Java BlockModel の block/stairs と同じ構造：
 *   element 1: bottom 半分 (1×0.5×1) — 全面に伸びる
 *   element 2: top 半分の半分 (0.5×0.5×1) — facing 方向の側だけ
 *
 * weirdo_direction の表記：
 *   0 = east  → top の半分が +X 側
 *   1 = west  → top の半分が -X 側
 *   2 = south → top の半分が +Z 側
 *   3 = north → top の半分が -Z 側
 *
 * upside_down_bit=1 のときは Y 軸対称に反転（bottom↔top 入れ替え）。
 */
export function buildStairsGeometry(THREE, states = {}) {
    // 階段の weirdo_direction: 0=east, 1=west, 2=south, 3=north
    let wd = _getState(states, 'weirdo_direction');
    if (wd === undefined) {
        // cardinal_direction からの変換
        const dir = _getDirection(states); // 0=S, 1=W, 2=N, 3=E
        const map = [2, 1, 3, 0]; // S=2, W=1, N=3, E=0
        wd = map[dir];
    } else {
        wd = parseInt(wd);
    }
    const upsideDown = _isTrue(_getState(states, 'upside_down_bit'));

    // 上下反転時は yLow/yHigh を入れ替えて作る
    const yLow  = upsideDown ? 0.5 : 0.0;   // bottom 半分の Y 範囲
    const yLowEnd = upsideDown ? 1.0 : 0.5;
    const yHigh = upsideDown ? 0.0 : 0.5;   // top 半分の Y 範囲
    const yHighEnd = upsideDown ? 0.5 : 1.0;

    const geos = [];

    // bottom 半分（フル幅）
    geos.push(cuboid(THREE, 0, yLow, 0, 1, yLowEnd, 1));

    // top 半分の小ブロック（向きに応じた半分）
    if (wd === 0) { // east → +X 半分
        geos.push(cuboid(THREE, 0.5, yHigh, 0, 1.0, yHighEnd, 1));
    } else if (wd === 1) { // west → -X 半分
        geos.push(cuboid(THREE, 0.0, yHigh, 0, 0.5, yHighEnd, 1));
    } else if (wd === 2) { // south → +Z 半分
        geos.push(cuboid(THREE, 0, yHigh, 0.5, 1, yHighEnd, 1.0));
    } else if (wd === 3) { // north → -Z 半分
        geos.push(cuboid(THREE, 0, yHigh, 0.0, 1, yHighEnd, 0.5));
    }

    return _mergeBufferGeometries(THREE, geos);
}

/* ─── ハーフブロック（slab）──────────────────────────────────
 * top_slot_bit (新)/ vertical_half='top'(旧) → 上半分
 * それ以外 → 下半分
 */
export function buildSlabGeometry(THREE, states = {}) {
    const verticalHalf = _getState(states, 'vertical_half');
    const topSlot = _getState(states, 'top_slot_bit');
    const upsideDown = _getState(states, 'upside_down_bit');
    
    const top = (verticalHalf === 'top') || _isTrue(topSlot) || _isTrue(upsideDown);
    
    if (top) return cuboid(THREE, 0, 0.5, 0, 1, 1, 1);
    return cuboid(THREE, 0, 0, 0, 1, 0.5, 1);
}

/* ─── カーペット ────────────────────────────────────────── */
export function buildCarpetGeometry(THREE) {
    return cuboid(THREE, 0, 0, 0, 1, 1/16, 1);
}

/* ─── 圧力板 ───────────────────────────────────────────── */
export function buildPressurePlateGeometry(THREE) {
    return cuboid(THREE, 1/16, 0, 1/16, 15/16, 1/16, 15/16);
}

/* ─── ボタン（床配置簡易） ────────────────────────────────── */
export function buildButtonGeometry(THREE) {
    return cuboid(THREE, 5/16, 0, 6/16, 11/16, 2/16, 10/16);
}

/* ─── フェンス（中央ポスト＋4方向の腕、隣接情報無しで常に十字） ──── */
/* ─── フェンス（中央ポスト 4/16×4/16、隣接接続あり） ───────── */
export function buildFenceGeometry(THREE, states = {}, neighbors = {}) {
    const geos = [];
    const n = _isTrue(_getState(states, 'north_bit')) || neighbors.n;
    const s = _isTrue(_getState(states, 'south_bit')) || neighbors.s;
    const w = _isTrue(_getState(states, 'west_bit'))  || neighbors.w;
    const e = _isTrue(_getState(states, 'east_bit'))  || neighbors.e;

    geos.push(cuboid(THREE, 6/16, 0, 6/16, 10/16, 1, 10/16)); // 中央
    if (n) {
        geos.push(cuboid(THREE, 7/16, 6/16, 0, 9/16, 9/16, 6/16));
        geos.push(cuboid(THREE, 7/16, 12/16, 0, 9/16, 15/16, 6/16));
    }
    if (s) {
        geos.push(cuboid(THREE, 7/16, 6/16, 10/16, 9/16, 9/16, 1));
        geos.push(cuboid(THREE, 7/16, 12/16, 10/16, 9/16, 15/16, 1));
    }
    if (w) {
        geos.push(cuboid(THREE, 0, 6/16, 7/16, 6/16, 9/16, 9/16));
        geos.push(cuboid(THREE, 0, 12/16, 7/16, 6/16, 15/16, 9/16));
    }
    if (e) {
        geos.push(cuboid(THREE, 10/16, 6/16, 7/16, 1, 9/16, 9/16));
        geos.push(cuboid(THREE, 10/16, 12/16, 7/16, 1, 15/16, 9/16));
    }
    return _mergeBufferGeometries(THREE, geos);
}

/* ─── 壁（中央 8/16×8/16、隣接接続あり） ─────────────────── */
export function buildWallGeometry(THREE, states = {}, neighbors = {}) {
    const geos = [];
    const n = _isTrue(_getState(states, 'north_bit')) || neighbors.n;
    const s = _isTrue(_getState(states, 'south_bit')) || neighbors.s;
    const w = _isTrue(_getState(states, 'west_bit'))  || neighbors.w;
    const e = _isTrue(_getState(states, 'east_bit'))  || neighbors.e;

    geos.push(cuboid(THREE, 4/16, 0, 4/16, 12/16, 1, 12/16)); // 中央
    if (n) geos.push(cuboid(THREE, 5/16, 0, 0, 11/16, 14/16, 4/16));
    if (s) geos.push(cuboid(THREE, 5/16, 0, 12/16, 11/16, 14/16, 1));
    if (w) geos.push(cuboid(THREE, 0, 0, 5/16, 4/16, 14/16, 11/16));
    if (e) geos.push(cuboid(THREE, 12/16, 0, 5/16, 1, 14/16, 11/16));

    return _mergeBufferGeometries(THREE, geos);
}

/* ─── トラップドア ────────────────────────────────────────
 * direction: 0=south, 1=west, 2=north, 3=east（壁付け方向＝ヒンジ位置）
 * upside_down_bit: 0=床近く / 1=天井近く
 * open_bit: 0=水平 / 1=垂直に立つ
 */
export function buildTrapdoorGeometry(THREE, states = {}) {
    const open = _isTrue(_getState(states, 'open_bit'));
    const upsideDown = _isTrue(_getState(states, 'upside_down_bit'));
    const dir = _getDirection(states);

    if (!open) {
        // 水平：薄板（天井 or 床）
        return upsideDown
            ? cuboid(THREE, 0, 13/16, 0, 1, 1,    1)
            : cuboid(THREE, 0, 0,     0, 1, 3/16, 1);
    }
    // 開いた状態：壁に張り付く垂直な薄板
    // dir=south(0) → +Z 側に板が立つ
    if (dir === 0) return cuboid(THREE, 0, 0, 13/16, 1, 1, 1);    // south wall (+Z)
    if (dir === 1) return cuboid(THREE, 0, 0, 0,     3/16, 1, 1); // west wall (-X)
    if (dir === 2) return cuboid(THREE, 0, 0, 0,     1, 1, 3/16); // north wall (-Z)
    if (dir === 3) return cuboid(THREE, 13/16, 0, 0, 1, 1, 1);    // east wall (+X)
    return cuboid(THREE, 0, 0, 13/16, 1, 1, 1);
}

/* ─── ドア（縦長 1×2×0.1875、頭部スキップは worker.js で済） ─── */
export function buildDoorGeometry(THREE, states = {}) {
    const dir = _getDirection(states);
    // プランナーで見栄えを良くするため、常に閉じた状態にする
    const open = false; 
    const hinge = _isTrue(_getState(states, 'hinge_bit'));
    
    let placement = dir; 
    if (open) {
        const offset = hinge ? -1 : 1;
        placement = (dir + offset + 4) % 4;
    }

    const t = 3/16; 
    switch (placement) {
        case 0: return cuboid(THREE, 0, 0, 1-t, 1, 1, 1);
        case 1: return cuboid(THREE, 0, 0, 0,   t, 1, 1);
        case 2: return cuboid(THREE, 0, 0, 0,   1, 1, t);
        case 3: return cuboid(THREE, 1-t, 0, 0, 1, 1, 1);
    }
    return cuboid(THREE, 0, 0, 1-t, 1, 1, 1);
}

/* ─── フェンスゲート ───────────────────────────────────────
 * direction: 0=south, 1=west, 2=north, 3=east
 * open_bit: 0=closed, 1=open
 */
export function buildFenceGateGeometry(THREE, states = {}) {
    const dir = _getDirection(states);
    const open = _isTrue(_getState(states, 'open_bit'));

    if (open) {
        // 開いた時は壁に張り付く小ポスト 2 つ
        const geos = [];
        if (dir === 0 || dir === 2) { // south/north：壁が +X/-X 方向に開く
            geos.push(cuboid(THREE, 0,    5/16, 7/16, 2/16, 1, 9/16));
            geos.push(cuboid(THREE, 14/16,5/16, 7/16, 1,    1, 9/16));
        } else {
            geos.push(cuboid(THREE, 7/16, 5/16, 0,    9/16, 1, 2/16));
            geos.push(cuboid(THREE, 7/16, 5/16, 14/16,9/16, 1, 1));
        }
        return _mergeBufferGeometries(THREE, geos);
    }
    // 閉じた状態：縦ポスト2 + 横棒2
    const geos = [];
    if (dir === 0 || dir === 2) { // south/north：ゲートが東西に伸びる
        geos.push(cuboid(THREE, 0,     5/16, 7/16, 2/16, 1,     9/16));
        geos.push(cuboid(THREE, 14/16, 5/16, 7/16, 1,    1,     9/16));
        geos.push(cuboid(THREE, 2/16, 12/16, 7/16, 14/16, 15/16, 9/16));
        geos.push(cuboid(THREE, 2/16,  6/16, 7/16, 14/16,  9/16, 9/16));
    } else { // east/west：南北に伸びる
        geos.push(cuboid(THREE, 7/16, 5/16, 0,     9/16, 1,     2/16));
        geos.push(cuboid(THREE, 7/16, 5/16, 14/16, 9/16, 1,     1));
        geos.push(cuboid(THREE, 7/16,12/16, 2/16,  9/16, 15/16,14/16));
        geos.push(cuboid(THREE, 7/16, 6/16, 2/16,  9/16,  9/16,14/16));
    }
    return _mergeBufferGeometries(THREE, geos);
}

/* ─── 窓ガラスペイン・鉄格子（中央十字、隣接接続あり） ────── */
export function buildPaneGeometry(THREE, states = {}, neighbors = {}) {
    const geos = [];
    const n = _isTrue(_getState(states, 'north_bit')) || neighbors.n;
    const s = _isTrue(_getState(states, 'south_bit')) || neighbors.s;
    const w = _isTrue(_getState(states, 'west_bit'))  || neighbors.w;
    const e = _isTrue(_getState(states, 'east_bit'))  || neighbors.e;

    // 中央にわずかな隙間も残さないよう、腕を 8.5/16 まで伸ばして重ねる
    if (n) geos.push(cuboid(THREE, 7/16, 0, 0,    9/16, 1, 8.5/16));
    if (s) geos.push(cuboid(THREE, 7/16, 0, 7.5/16, 9/16, 1, 1));
    if (w) geos.push(cuboid(THREE, 0,    0, 7/16, 8.5/16, 1, 9/16));
    if (e) geos.push(cuboid(THREE, 7.5/16, 0, 7/16, 1,    1, 9/16));

    // 全く接続がない場合のみ、中央の支柱を表示
    if (!(n || s || w || e)) {
        geos.push(cuboid(THREE, 7/16, 0, 7/16, 9/16, 1, 9/16));
    }

    return _mergeBufferGeometries(THREE, geos);
}

/* ─── 小オブジェクト（松明など） ─────────────────────────── */
export function buildSmallGeometry(THREE) {
    return cuboid(THREE, 7/16, 0, 7/16, 9/16, 10/16, 9/16);
}

/* ─── 公開：形状取得 ─────────────────────────────────────── */
export function resolveGeometry(THREE, blockId, states = {}, neighbors = {}) {
    const shape = classifyShape(blockId, states);
    switch (shape) {
        case 'stairs':         return buildStairsGeometry(THREE, states);
        case 'slab':           return buildSlabGeometry(THREE, states);
        case 'fence':          return buildFenceGeometry(THREE, states, neighbors);
        case 'wall':           return buildWallGeometry(THREE, states, neighbors);
        case 'fence_gate':     return buildFenceGateGeometry(THREE, states);
        case 'trapdoor':       return buildTrapdoorGeometry(THREE, states);
        case 'door':           return buildDoorGeometry(THREE, states);
        case 'carpet':         return buildCarpetGeometry(THREE);
        case 'pressure_plate': return buildPressurePlateGeometry(THREE);
        case 'button':         return buildButtonGeometry(THREE);
        case 'pane':           return buildPaneGeometry(THREE, states, neighbors);
        case 'small':          return buildSmallGeometry(THREE);
        case 'cube':
        default:               return cuboid(THREE, 0, 0, 0, 1, 1, 1);
    }
}

/* ─── 簡易 BufferGeometry マージ（r128 互換）───────────────── */
function _mergeBufferGeometries(THREE, geometries) {
    let totalVertices = 0;
    let hasNormal = true;
    let hasUV = true;
    for (const g of geometries) {
        totalVertices += g.attributes.position.count;
        if (!g.attributes.normal) hasNormal = false;
        if (!g.attributes.uv) hasUV = false;
    }
    const positions = new Float32Array(totalVertices * 3);
    const normals = hasNormal ? new Float32Array(totalVertices * 3) : null;
    const uvs = hasUV ? new Float32Array(totalVertices * 2) : null;

    let totalIndex = 0;
    for (const g of geometries) totalIndex += (g.index ? g.index.count : g.attributes.position.count);
    const Indices = totalVertices < 65536 ? Uint16Array : Uint32Array;
    const indices = new Indices(totalIndex);

    let posOffset = 0, normOffset = 0, uvOffset = 0, idxOffset = 0, vertOffset = 0;
    for (const g of geometries) {
        const pCount = g.attributes.position.count;
        positions.set(g.attributes.position.array, posOffset);
        if (normals) normals.set(g.attributes.normal.array, normOffset);
        if (uvs) uvs.set(g.attributes.uv.array, uvOffset);
        if (g.index) {
            for (let i = 0; i < g.index.count; i++) indices[idxOffset + i] = g.index.array[i] + vertOffset;
            idxOffset += g.index.count;
        } else {
            for (let i = 0; i < pCount; i++) indices[idxOffset + i] = i + vertOffset;
            idxOffset += pCount;
        }
        posOffset += pCount * 3;
        normOffset += pCount * 3;
        uvOffset += pCount * 2;
        vertOffset += pCount;
        g.dispose && g.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (normals) merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (uvs) merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    return merged;
}
