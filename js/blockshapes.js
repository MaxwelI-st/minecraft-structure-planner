/**
 * blockshapes.js — Bedrock 統合版のブロック形状を Three.js ジオメトリで再現
 *
 * 対象: stairs / slab / fence / wall / fence_gate / trapdoor / door / carpet / pressure_plate
 *
 * Bedrock の主要ステート:
 *   - weirdo_direction (0..3) : stairs の向き（東西南北）
 *   - upside_down_bit (0|1)   : stairs/slab/trapdoor の上下反転
 *   - top_slot_bit (0|1)      : 1.x slab の上下半分
 *   - vertical_half ('top'|'bottom') : 旧 slab
 *   - facing_direction (0..5) : door / trapdoor の向き
 *   - open_bit (0|1)          : door / trapdoor / fence_gate
 *   - direction (0..3)        : 旧形式向き
 *   - in_wall_bit / wall_post_bit : wall / fence の繋がり
 *
 * すべてのジオメトリは原点が中心、サイズ 1×1×1 内に収まる。
 * worker.js の coords{x,y,z,blockId,states?} で states を保持する場合、
 * viewer3d.js から resolveShape(blockId, states) を呼んで Mesh を返す。
 */

/** ID から形状種別を判定 */
export function classifyShape(blockId) {
    const id = String(blockId).toLowerCase().replace(/^minecraft:/, '');
    if (/_stairs$/.test(id)) return 'stairs';
    if (/^double_/.test(id)) return 'cube';   // double_slab はフルブロック扱い
    if (/_slab$/.test(id)) return 'slab';
    if (/_fence$|^nether_brick_fence$/.test(id) && !/_gate$/.test(id)) return 'fence';
    if (/_fence_gate$/.test(id)) return 'fence_gate';
    if (/_wall$|cobblestone_wall$|red_sandstone_wall$/.test(id)) return 'wall';
    if (/_trapdoor$/.test(id)) return 'trapdoor';
    if (/_door$/.test(id) && !/trapdoor/.test(id)) return 'door';
    if (/_carpet$|moss_carpet/.test(id)) return 'carpet';
    if (/pressure_plate$/.test(id)) return 'pressure_plate';
    if (/_button$/.test(id)) return 'button';
    if (/_pane$|^iron_bars$|^chain$/.test(id)) return 'pane';
    if (/torch$|^lantern$|^soul_lantern$/.test(id)) return 'small';
    return 'cube';
}

/** Bedrock weirdo_direction (0..3) → 階段が指す方向（向き）
 *  0: east, 1: west, 2: south, 3: north
 */
const WD_TO_DIR = ['east', 'west', 'south', 'north'];

/* ─── ジオメトリビルダー（THREE は引数で受け取る） ─────────────────── */

/**
 * 階段ジオメトリ：下半身フル＋上半身を方向に応じて削った形
 * 戻り値: BufferGeometry（向きを既に適用済み）
 */
export function buildStairsGeometry(THREE, states = {}) {
    const wd = states.weirdo_direction ?? 0;
    const upsideDown = states.upside_down_bit === 1;
    const dir = WD_TO_DIR[wd];

    // 2つの BoxGeometry を組み合わせる（merge）
    const geos = [];
    // 下半分フル（または上半分フル if upsideDown）
    const halfA = new THREE.BoxGeometry(1, 0.5, 1);
    halfA.translate(0, upsideDown ? 0.25 : -0.25, 0);
    geos.push(halfA);

    // 上半分の小ブロック（または下半分 if upsideDown）
    // dir に応じて配置位置が変わる
    const halfB = new THREE.BoxGeometry(0.5, 0.5, 1);
    let dx = 0, dz = 0;
    let rotateY = false;
    if (dir === 'east')  dx =  0.25;
    if (dir === 'west')  dx = -0.25;
    if (dir === 'south') { dz =  0.25; rotateY = true; }
    if (dir === 'north') { dz = -0.25; rotateY = true; }
    if (rotateY) halfB.rotateY(Math.PI / 2);
    halfB.translate(dx, upsideDown ? -0.25 : 0.25, dz);
    geos.push(halfB);

    // BufferGeometryUtils が必要だが r128 では別ファイル。
    // 簡易マージ：頂点を単純結合
    return _mergeBufferGeometries(THREE, geos);
}

/** ハーフブロック */
export function buildSlabGeometry(THREE, states = {}) {
    const top = states.top_slot_bit === 1
        || states.vertical_half === 'top'
        || states.upside_down_bit === 1;
    const geo = new THREE.BoxGeometry(1, 0.5, 1);
    geo.translate(0, top ? 0.25 : -0.25, 0);
    return geo;
}

/** カーペット（薄い 1/16 高さ） */
export function buildCarpetGeometry(THREE) {
    const geo = new THREE.BoxGeometry(1, 1/16, 1);
    geo.translate(0, -0.5 + 1/32, 0);
    return geo;
}

/** 圧力板 */
export function buildPressurePlateGeometry(THREE) {
    const geo = new THREE.BoxGeometry(14/16, 1/16, 14/16);
    geo.translate(0, -0.5 + 1/32, 0);
    return geo;
}

/** ボタン（壁/床は省略してとりあえず床配置） */
export function buildButtonGeometry(THREE) {
    const geo = new THREE.BoxGeometry(6/16, 2/16, 4/16);
    geo.translate(0, -0.5 + 1/16, 0);
    return geo;
}

/** フェンス（中央ポスト＋4方向の腕。隣接情報なしのため常に十字） */
export function buildFenceGeometry(THREE) {
    const geos = [];
    const post = new THREE.BoxGeometry(4/16, 1, 4/16);
    geos.push(post);
    // 4方向の腕（上下2本ずつ）
    const armX1 = new THREE.BoxGeometry(1, 3/16, 2/16);
    armX1.translate(0,  6/16, 0);
    geos.push(armX1);
    const armX2 = new THREE.BoxGeometry(1, 3/16, 2/16);
    armX2.translate(0, -2/16, 0);
    geos.push(armX2);
    const armZ1 = new THREE.BoxGeometry(2/16, 3/16, 1);
    armZ1.translate(0,  6/16, 0);
    geos.push(armZ1);
    const armZ2 = new THREE.BoxGeometry(2/16, 3/16, 1);
    armZ2.translate(0, -2/16, 0);
    geos.push(armZ2);
    return _mergeBufferGeometries(THREE, geos);
}

/** 壁（中央ポスト＋4方向の壁） */
export function buildWallGeometry(THREE) {
    const geos = [];
    const post = new THREE.BoxGeometry(8/16, 1, 8/16);
    geos.push(post);
    const armX = new THREE.BoxGeometry(1, 14/16, 6/16);
    armX.translate(0, -1/16, 0);
    geos.push(armX);
    const armZ = new THREE.BoxGeometry(6/16, 14/16, 1);
    armZ.translate(0, -1/16, 0);
    geos.push(armZ);
    return _mergeBufferGeometries(THREE, geos);
}

/** トラップドア */
export function buildTrapdoorGeometry(THREE, states = {}) {
    const open = states.open_bit === 1;
    const upsideDown = states.upside_down_bit === 1;
    const dir = states.direction ?? 0;
    if (!open) {
        // 閉：水平な薄板
        const geo = new THREE.BoxGeometry(1, 3/16, 1);
        geo.translate(0, upsideDown ? 0.5 - 1.5/16 : -0.5 + 1.5/16, 0);
        return geo;
    }
    // 開：垂直な薄板（dir に応じて貼り付け位置）
    const geo = new THREE.BoxGeometry(1, 1, 3/16);
    let dz = 0, dx = 0;
    if (dir === 0) dz =  0.5 - 1.5/16;
    if (dir === 1) dz = -0.5 + 1.5/16;
    if (dir === 2) { dx =  0.5 - 1.5/16; geo.rotateY(Math.PI / 2); }
    if (dir === 3) { dx = -0.5 + 1.5/16; geo.rotateY(Math.PI / 2); }
    geo.translate(dx, 0, dz);
    return geo;
}

/** ドア（縦長） */
export function buildDoorGeometry(THREE, states = {}) {
    const dir = states.direction ?? 0;
    const open = states.open_bit === 1;
    const geo = new THREE.BoxGeometry(1, 1, 3/16);
    let rot = 0;
    if (dir === 0) rot = 0;
    if (dir === 1) rot = Math.PI / 2;
    if (dir === 2) rot = Math.PI;
    if (dir === 3) rot = -Math.PI / 2;
    if (open) rot += Math.PI / 2;
    geo.rotateY(rot);
    return geo;
}

/** フェンスゲート */
export function buildFenceGateGeometry(THREE, states = {}) {
    const open = states.open_bit === 1;
    const dir = states.direction ?? 0;
    if (open) {
        // 開いた状態は壁に張り付く形（簡略）
        const post = new THREE.BoxGeometry(2/16, 12/16, 2/16);
        return post;
    }
    // 閉：横棒2本＋小ポスト2本
    const geos = [];
    const post1 = new THREE.BoxGeometry(2/16, 12/16, 2/16);
    post1.translate(-7/16, -2/16, 0);
    geos.push(post1);
    const post2 = new THREE.BoxGeometry(2/16, 12/16, 2/16);
    post2.translate(7/16, -2/16, 0);
    geos.push(post2);
    const bar1 = new THREE.BoxGeometry(12/16, 3/16, 2/16);
    bar1.translate(0, 5/16, 0);
    geos.push(bar1);
    const bar2 = new THREE.BoxGeometry(12/16, 3/16, 2/16);
    bar2.translate(0, -3/16, 0);
    geos.push(bar2);
    const merged = _mergeBufferGeometries(THREE, geos);
    if (dir === 1 || dir === 3) merged.rotateY(Math.PI / 2);
    return merged;
}

/** 窓ガラス・鉄格子（中央十字） */
export function buildPaneGeometry(THREE) {
    const geos = [];
    const post = new THREE.BoxGeometry(2/16, 1, 2/16);
    geos.push(post);
    const armX = new THREE.BoxGeometry(1, 1, 2/16);
    geos.push(armX);
    const armZ = new THREE.BoxGeometry(2/16, 1, 1);
    geos.push(armZ);
    return _mergeBufferGeometries(THREE, geos);
}

/** 小オブジェクト（松明など） */
export function buildSmallGeometry(THREE) {
    const geo = new THREE.BoxGeometry(2/16, 10/16, 2/16);
    geo.translate(0, -3/16, 0);
    return geo;
}

/* ─── 公開: 形状取得 ─────────────────────────────────────────────────── */

/**
 * blockId と states から BufferGeometry を返す。
 * cube の場合は null を返す（呼び出し側でフルキューブを使う）。
 */
export function resolveGeometry(THREE, blockId, states = {}) {
    const shape = classifyShape(blockId);
    switch (shape) {
        case 'stairs':         return buildStairsGeometry(THREE, states);
        case 'slab':           return buildSlabGeometry(THREE, states);
        case 'fence':          return buildFenceGeometry(THREE);
        case 'wall':           return buildWallGeometry(THREE);
        case 'fence_gate':     return buildFenceGateGeometry(THREE, states);
        case 'trapdoor':       return buildTrapdoorGeometry(THREE, states);
        case 'door':           return buildDoorGeometry(THREE, states);
        case 'carpet':         return buildCarpetGeometry(THREE);
        case 'pressure_plate': return buildPressurePlateGeometry(THREE);
        case 'button':         return buildButtonGeometry(THREE);
        case 'pane':           return buildPaneGeometry(THREE);
        case 'small':          return buildSmallGeometry(THREE);
        case 'cube':
        default:               return null;
    }
}

/* ─── 簡易 BufferGeometry マージ（r128 互換）─────────────────────────── */
function _mergeBufferGeometries(THREE, geometries) {
    // 全ジオメトリの position attribute を結合
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

    // index も
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
