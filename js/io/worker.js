/**
 * worker.js — マルチフォーマット構造パーサー
 *
 * 対応フォーマット:
 *   .mcstructure — Bedrock Edition (Little-Endian NBT, 8バイトヘッダー)
 *   .litematic   — Litematica (Big-Endian NBT, GZip, BitPack LongArray, YZX)
 *   .nbt         — Java Structure Block (Big-Endian NBT, GZip, 直接 blocks[] リスト)
 *
 * 出力は共通形式:
 *   { taskId, success, results, coords, edition, size, totalCount, uniqueCount, totalSlots }
 */
import { NBTParser, decompressIfNeeded, detectEndian } from './nbt-reader.js';
import { NBTReader, TAG } from '../modules/stream/nbt-reader.js';
import { unpackBlockStates } from '../modules/logic/bitpack.js';
import { normalizeBedrockBlock, normalizeId } from '../bedrock_normalize.js';

self.onmessage = async (e) => {
    const { taskId, buffer, fileName } = e.data;
    try {
        const ext = (fileName || '').toLowerCase().split('.').pop();

        let normalized;
        if (ext === 'litematic') {
            normalized = await parseLitematic(buffer);
        } else if (ext === 'nbt') {
            normalized = await parseJavaNbt(buffer);
        } else {
            // デフォルト: .mcstructure (Bedrock)
            const data   = await decompressIfNeeded(buffer);
            const endian = detectEndian(data, fileName || '');
            const parser = new NBTParser(data, endian);
            const result = parser.parse();
            if (!result || !result.value) throw new Error('NBT root not found');
            const root = result.value;
            if (!root.structure || !root.structure.block_indices) {
                throw new Error('非対応フォーマットです。Bedrock Edition の .mcstructure ファイルを使用してください。');
            }
            normalized = parseBedrock(root);
        }

        const { coords, counts, totalCount, sx, sy, sz, edition, worldOrigin, multiRegionCount } = normalized;
        const results = Array.from(counts.entries()).map(([id, count]) => {
            const stacks    = Math.floor(count / 64);
            const remainder = count % 64;
            const slots     = stacks + (remainder > 0 ? 1 : 0);
            return { id, count, stacks, remainder, slots, category: getCategory(id) };
        }).sort((a, b) => b.count - a.count);

        const warnings = [];
        if (multiRegionCount > 1) {
            warnings.push(`⚠️ このファイルには ${multiRegionCount} 個の Region がありますが、最初の Region のみ読み込みました。`);
        }

        // M-P-03: coords を typed array に変換して Transferable で送信
        // (structured clone のオーバーヘッドを排除、大規模構造で 5-10x 高速化)
        const coordsTA = _coordsToTypedArrays(coords);

        self.postMessage({
            taskId,
            success: true, results, edition, warnings,
            size: { x: sx, y: sy, z: sz },
            worldOrigin: worldOrigin ?? [0, 0, 0],
            totalCount, uniqueCount: counts.size,
            totalSlots: results.reduce((acc, r) => acc + r.slots, 0),
            coordsTA,
        }, [
            coordsTA.xs.buffer,
            coordsTA.ys.buffer,
            coordsTA.zs.buffer,
            coordsTA.blockIdIdx.buffer,
            coordsTA.rawIdIdx.buffer,
        ]);
    } catch (err) {
        self.postMessage({
            taskId,
            success: false,
            error: err.message,
            stack: err.stack ? String(err.stack).split('\n').slice(0, 4).join('\n') : null
        });
    }
};

// ─── .litematic パーサー ──────────────────────────────────────────────────
async function parseLitematic(rawBuffer) {
    // GZip 解凍（decompressIfNeeded は pako 使用）
    const data   = await decompressIfNeeded(rawBuffer);
    const reader = new NBTReader(data, { format: 'java' }); // Big-Endian
    const { bodyOffset } = reader.getRoot();

    let sx = 0, sy = 0, sz = 0;
    let palette = null;
    let longsRaw = null;
    let multiRegionCount = 0;

    // root を走査して Metadata.EnclosingSize と Regions.<name> を取得
    for (const tag of reader.walkCompound(bodyOffset)) {
        if (tag.name === 'Metadata' && tag.value?.__type === 'compound') {
            for (const mt of reader.walkCompound(tag.value.offset)) {
                if (mt.name === 'EnclosingSize' && mt.value?.__type === 'compound') {
                    for (const st of reader.walkCompound(mt.value.offset)) {
                        if (st.name === 'x') sx = st.value;
                        if (st.name === 'y') sy = st.value;
                        if (st.name === 'z') sz = st.value;
                    }
                }
            }
        }
        if (tag.name === 'Regions' && tag.value?.__type === 'compound') {
            let regionCount = 0;
            for (const rt of reader.walkCompound(tag.value.offset)) {
                if (rt.value?.__type !== 'compound') continue;
                regionCount++;
                if (regionCount > 1) continue; // 最初のリージョンのみ読み込む
                for (const ft of reader.walkCompound(rt.value.offset)) {
                    if (ft.name === 'Size' && ft.value?.__type === 'compound') {
                        for (const st of reader.walkCompound(ft.value.offset)) {
                            if (st.name === 'x') sx = Math.abs(st.value);
                            if (st.name === 'y') sy = Math.abs(st.value);
                            if (st.name === 'z') sz = Math.abs(st.value);
                        }
                    }
                    if (ft.name === 'BlockStatePalette' && ft.value?.__type === 'list') {
                        palette = [];
                        for (const pe of reader.walkList(ft.value.offset)) {
                            if (pe.value?.__type !== 'compound') continue;
                            let blockName = 'minecraft:air';
                            const props   = {};
                            for (const bt of reader.walkCompound(pe.value.offset)) {
                                if (bt.name === 'Name')       blockName = bt.value;
                                if (bt.name === 'Properties' && bt.value?.__type === 'compound') {
                                    for (const pt of reader.walkCompound(bt.value.offset)) {
                                        props[pt.name] = pt.value;
                                    }
                                }
                            }
                            palette.push({ name: blockName, states: props });
                        }
                    }
                    if (ft.name === 'BlockStates' && ft.typeId === TAG.LONG_ARRAY) {
                        longsRaw = ft.value;
                    }
                }
            }
            if (regionCount > 1) multiRegionCount = regionCount;
        }
    }

    if (!palette || !longsRaw || !sx || !sy || !sz) {
        throw new Error('.litematic の解析に失敗しました（BlockStatePalette または BlockStates が見つかりません）');
    }

    // ビットパック解凍（1.16+ no-wrap ルール）
    // readLongArray は常に BigInt64Array を返す（DataView ベースで BE/LE 対応済み）
    const total = sx * sy * sz;
    const MAX_LITEMATIC_BLOCKS = 10_000_000; // 1000万ブロック
    if (total > MAX_LITEMATIC_BLOCKS) {
        throw new Error(`.litematic が大きすぎます（${(total / 1_000_000).toFixed(1)}M ブロック）。最大 ${MAX_LITEMATIC_BLOCKS / 1_000_000}M ブロックまで対応しています。`);
    }
    const indices = unpackBlockStates(longsRaw, total, palette.length);

    // YZX → coords 構築（Litematic: idx = y*SZ*SX + z*SX + x）
    const counts  = new Map();
    const coords  = [];
    const AIR     = new Set(['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air']);

    for (let y = 0; y < sy; y++)
    for (let z = 0; z < sz; z++)
    for (let x = 0; x < sx; x++) {
        const idx     = y * sz * sx + z * sx + x;
        const palIdx  = indices[idx];
        const entry   = palette[palIdx];
        if (!entry) continue;
        const blockId = entry.name ?? 'minecraft:air';
        if (AIR.has(blockId)) continue;
        counts.set(blockId, (counts.get(blockId) ?? 0) + 1);
        coords.push({ x, y, z, blockId, rawId: blockId, states: entry.states ?? {} });
    }

    return { coords, counts, totalCount: Array.from(counts.values()).reduce((a,b)=>a+b,0), sx, sy, sz, edition: 'java', worldOrigin: [0, 0, 0], multiRegionCount };
}

// ─── .nbt (Java Structure Block) パーサー ────────────────────────────────
async function parseJavaNbt(rawBuffer) {
    const data   = await decompressIfNeeded(rawBuffer);
    const parser = new NBTParser(data, 'be'); // Big-Endian
    const result = parser.parse();
    if (!result?.value) throw new Error('.nbt の NBT 解析に失敗しました');
    const root   = result.value;

    // size: List of 3 Int
    const sizeArr = Array.isArray(root.size) ? root.size : [];
    const [sx, sy, sz] = sizeArr.length >= 3 ? sizeArr : [0, 0, 0];
    if (!sx || !sy || !sz) throw new Error('.nbt に size フィールドがありません');

    const palette = root.palette ?? [];
    const blocks  = root.blocks  ?? [];

    const counts = new Map();
    const coords = [];
    const AIR    = new Set(['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air']);

    for (const b of blocks) {
        const entry   = palette[b.state];
        if (!entry) continue;
        const blockId = entry.Name ?? entry.name ?? 'minecraft:air';
        if (AIR.has(blockId)) continue;
        const [x, y, z] = Array.isArray(b.pos) ? b.pos : [0, 0, 0];
        counts.set(blockId, (counts.get(blockId) ?? 0) + 1);
        coords.push({ x, y, z, blockId, rawId: blockId, states: entry.Properties ?? entry.states ?? {} });
    }

    return { coords, counts, totalCount: Array.from(counts.values()).reduce((a,b)=>a+b,0), sx, sy, sz, edition: 'java', worldOrigin: [0, 0, 0] };
}

/* ─── Bedrock パーサー（既存） ───────────────────────────────────────── */
function parseBedrock(root) {
    const sizeArr = root.size || root.structure?.size;
    if (!sizeArr || sizeArr.length < 3) throw new Error('size missing');
    const [sx, sy, sz] = sizeArr;

    // structure_world_origin: ゲーム内ワールド座標。マルチ構造合体時のオフセット起点。
    const woArr = root.structure_world_origin;
    const worldOrigin = (Array.isArray(woArr) && woArr.length >= 3)
        ? [Number(woArr[0]) || 0, Number(woArr[1]) || 0, Number(woArr[2]) || 0]
        : [0, 0, 0];

    const layers  = root.structure.block_indices || [];
    const palette = root.structure.palette?.default?.block_palette;
    if (!palette || layers.length === 0) throw new Error('palette or block_indices missing');

    const counts   = new Map();
    const totalMap = new Map();

    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
        const layer = layers[layerIdx];
        for (let i = 0; i < layer.length; i++) {
            const blockIndex = layer[i];
            if (blockIndex === -1) continue;
            const blockData = palette[blockIndex];
            if (!blockData) continue;

            const z      = i % sz;
            const y      = Math.floor(i / sz) % sy;
            const x      = Math.floor(i / (sy * sz));
            const posKey = `${x},${y},${z}`;

            const rawId    = normalizeId(blockData.name);
            const rawStates = blockData.states || {};
            const norm     = normalizeBedrockBlock(rawId, rawStates);
            if (norm.skip) continue;

            let blockId = norm.id;
            if (!blockId.includes(':')) blockId = 'minecraft:' + blockId;

            const existing = totalMap.get(posKey);
            if (existing) {
                const isExistingSlab = existing.blockId.includes('slab');
                const isNewSlab      = blockId.includes('slab');
                if (isExistingSlab && isNewSlab) {
                    const baseE  = existing.blockId.replace(/_slab$|slab_/, '').replace('minecraft:', '');
                    const oldId  = existing.blockId;
                    const merged = normalizeBedrockBlock(baseE + '_double_slab', {});
                    existing.blockId = merged.id;
                    existing.states  = {};
                    counts.set(oldId, (counts.get(oldId) || 1) - 1);
                    if (counts.get(oldId) <= 0) counts.delete(oldId);
                    counts.set(merged.id, (counts.get(merged.id) || 0) + 2);
                    continue;
                }
                if (blockId === 'minecraft:water' || blockId === 'minecraft:flowing_water') {
                    counts.set('minecraft:water', (counts.get('minecraft:water') || 0) + 1);
                    continue;
                }
                continue;
            }

            totalMap.set(posKey, { x, y, z, blockId, rawId, states: rawStates });
            counts.set(blockId, (counts.get(blockId) || 0) + norm.increment);
        }
    }

    const coords     = Array.from(totalMap.values());
    const totalCount = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    return { coords, counts, totalCount, sx, sy, sz, edition: 'bedrock', worldOrigin };
}

/* ─── M-P-03: coords (objects) → 分割 TypedArray 形式 ─────────────
 * postMessage は構造化クローンで N 個のオブジェクトを deep-copy するため
 * 大規模 (>100k blocks) では深刻なボトルネック。x/y/z/blockIdIdx を
 * TypedArray にして transferList 経由でゼロコピー転送、palette/states のみ
 * 通常クローンで送る。
 */
function _coordsToTypedArrays(coords) {
    const N = coords.length;
    const xs = new Int32Array(N);
    const ys = new Int32Array(N);
    const zs = new Int32Array(N);
    const blockIdIdx = new Uint32Array(N);
    const rawIdIdx   = new Uint32Array(N);
    const statesArr  = new Array(N);

    const blockIdPalette = [];
    const idToIdx = new Map();
    const internId = (id) => {
        let idx = idToIdx.get(id);
        if (idx === undefined) {
            idx = blockIdPalette.length;
            blockIdPalette.push(id);
            idToIdx.set(id, idx);
        }
        return idx;
    };

    for (let i = 0; i < N; i++) {
        const c = coords[i];
        xs[i] = c.x | 0;
        ys[i] = c.y | 0;
        zs[i] = c.z | 0;
        blockIdIdx[i] = internId(c.blockId);
        rawIdIdx[i]   = internId(c.rawId ?? c.blockId);
        statesArr[i]  = c.states ?? {};
    }

    return { xs, ys, zs, blockIdIdx, rawIdIdx, blockIdPalette, statesArr };
}

/* ─── カテゴリ分類 ────────────────────────────────────────────── */
function getCategory(id) {
    const b = normalizeId(id).replace('minecraft:', '');
    if (/planks|stone|brick|concrete|terracotta|wool|wood|log|deepslate|cobblestone|quartz|sandstone|basalt|blackstone/.test(b)) return 'building';
    if (/stairs|slab|fence|door|trapdoor|glass|lantern|chest|sign|bed|banner|candle|pot|carpet|wall/.test(b)) return 'decoration';
    if (/redstone|piston|observer|hopper|repeater|comparator|rail|button|pressure_plate|dispenser|dropper|lever|tripwire|daylight/.test(b)) return 'redstone';
    if (/leaf|leaves|sapling|flower|grass|dirt|sand|gravel|coral|spore|vine|moss|mushroom|cactus|bamboo|sugarcane/.test(b)) return 'nature';
    return 'other';
}
