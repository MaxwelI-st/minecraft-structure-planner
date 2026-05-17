/**
 * worker.js - Bedrock Edition .mcstructure 専用パーサー
 *
 * Bedrock .mcstructure:
 *   root.size = [sx, sy, sz]
 *   root.structure.palette.default.block_palette = [{name, states, version}]
 */
import { NBTParser, decompressIfNeeded, detectEndian } from './nbt.js';
import { normalizeBedrockBlock, normalizeId } from './bedrock_normalize.js';

self.onmessage = async (e) => {
    const { taskId, buffer, fileName } = e.data;
    try {
        const data = await decompressIfNeeded(buffer);
        const endian = detectEndian(data, fileName || '');
        const parser = new NBTParser(data, endian);
        const result = parser.parse();
        if (!result || !result.value) throw new Error('NBT root not found');

        // 形式判定（統合版 .mcstructure 専用）
        const root = result.value;
        if (!root.structure || !root.structure.block_indices) {
            throw new Error('非対応フォーマットです。Bedrock Edition の .mcstructure ファイルを使用してください。');
        }
        let normalized;
        normalized = parseBedrock(root);

        const { coords, counts, totalCount, sx, sy, sz, edition } = normalized;
        const results = Array.from(counts.entries()).map(([id, count]) => {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            const slots = stacks + (remainder > 0 ? 1 : 0);
            return { id, count, stacks, remainder, slots, category: getCategory(id) };
        }).sort((a, b) => b.count - a.count);

        self.postMessage({
            taskId,
            success: true, results, coords, edition,
            size: { x: sx, y: sy, z: sz },
            totalCount, uniqueCount: counts.size,
            totalSlots: results.reduce((acc, r) => acc + r.slots, 0)
        });
    } catch (err) {
        self.postMessage({
            taskId,
            success: false,
            error: err.message,
            stack: err.stack ? String(err.stack).split('\n').slice(0, 4).join('\n') : null
        });
    }
};

/* ─── Bedrock パーサー ───────────────────────────────────────────── */
function parseBedrock(root) {
    const sizeArr = root.size || root.structure?.size;
    if (!sizeArr || sizeArr.length < 3) throw new Error('size missing');
    const [sx, sy, sz] = sizeArr;

    const layers = root.structure.block_indices || [];
    const palette = root.structure.palette?.default?.block_palette;
    if (!palette || layers.length === 0) throw new Error('palette or block_indices missing');

    const counts = new Map();
    const totalMap = new Map(); // "x,y,z" -> { blockId, rawId, states }

    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
        const layer = layers[layerIdx];
        for (let i = 0; i < layer.length; i++) {
            const blockIndex = layer[i];
            if (blockIndex === -1) continue;
            const blockData = palette[blockIndex];
            if (!blockData) continue;

            const z = i % sz;
            const y = Math.floor(i / sz) % sy;
            const x = Math.floor(i / (sy * sz));
            const posKey = `${x},${y},${z}`;

            const rawId = normalizeId(blockData.name);
            const rawStates = blockData.states || {};
            const norm = normalizeBedrockBlock(rawId, rawStates);
            if (norm.skip) continue;

            let blockId = norm.id;
            if (!blockId.includes(':')) blockId = 'minecraft:' + blockId;
            
            // 既にこの座標にブロックがある場合のマージ処理（ダブルスラブ対応 / 浸水対応）
            const existing = totalMap.get(posKey);
            if (existing) {
                // 両方がハーフブロック（slab）系ならフルブロックに合成
                const isExistingSlab = existing.blockId.includes('slab');
                const isNewSlab = blockId.includes('slab');

                if (isExistingSlab && isNewSlab) {
                    const baseE = existing.blockId.replace(/_slab$|slab_/, '').replace('minecraft:', '');
                    const oldId = existing.blockId;
                    const merged = normalizeBedrockBlock(baseE + '_double_slab', {});
                    existing.blockId = merged.id;
                    existing.states = {};
                    
                    // カウントの調整
                    counts.set(oldId, (counts.get(oldId) || 1) - 1);
                    if (counts.get(oldId) <= 0) counts.delete(oldId);
                    counts.set(merged.id, (counts.get(merged.id) || 0) + 2);
                    continue; 
                }
                
                // 水(water)がレイヤー1にある場合は水没として扱う（カウントのみ）
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

    const coords = Array.from(totalMap.values());
    const totalCount = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    
    // NOTE: 以前はここで完全に囲まれたブロックを除去していましたが、
    // Y軸フィルターなどで断面を表示した際に中身が空洞になってしまう問題を避けるため、
    // 物理的な除去はやめて全データを返します。面ごとのカリングは Viewer3D 側で動的に行います。
    return { coords, counts, totalCount, sx, sy, sz, edition: 'bedrock' };
}

/** 透過判定が必要なブロック ID パターン */
function _isTransparent(blockId) {
    return /glass|leaves|fence|trapdoor|door|stairs|slab|carpet|wall|pane|bars|water|lava|ice|cobweb|chain|ladder|sapling|grass$|fern|vine|kelp|seagrass|torch|button|pressure_plate|sign|banner|rail|hopper|piston/.test(blockId);
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
