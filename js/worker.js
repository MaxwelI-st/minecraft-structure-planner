/**
 * worker.js - .mcstructure (Bedrock LE) / .nbt (Java BE) 両対応
 *
 * Bedrock .mcstructure:
 *   root.size = [sx, sy, sz]
 *   root.structure.block_indices[0] = [palette_idx...]    （x*sy*sz + y*sz + z）
 *   root.structure.palette.default.block_palette = [{name, states, version}]
 *
 * Java .nbt (structure block format):
 *   root.size = [sx, sy, sz]
 *   root.palette = [{Name, Properties}]
 *   root.blocks = [{pos:[x,y,z], state:idx}]
 */
import { NBTParser, decompressIfNeeded, detectEndian } from './nbt.js';
import { normalizeBedrockBlock } from './bedrock_normalize.js';

self.onmessage = async (e) => {
    const { buffer, fileName } = e.data;
    try {
        const data = await decompressIfNeeded(buffer);
        const endian = detectEndian(data, fileName || '');
        const parser = new NBTParser(data, endian);
        const result = parser.parse();
        if (!result || !result.value) throw new Error('NBT root not found');

        // 形式判定
        const root = result.value;
        let normalized;
        if (root.structure && root.structure.block_indices) {
            normalized = parseBedrock(root);
        } else if (root.palette && root.blocks) {
            normalized = parseJava(root);
        } else {
            throw new Error('未知のフォーマット (Bedrock/Java NBT 両方とも不一致)');
        }

        const { coords, counts, totalCount, sx, sy, sz, edition } = normalized;
        const results = Array.from(counts.entries()).map(([id, count]) => {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            const slots = stacks + (remainder > 0 ? 1 : 0);
            return { id, count, stacks, remainder, slots, category: getCategory(id) };
        }).sort((a, b) => b.count - a.count);

        self.postMessage({
            success: true, results, coords, edition,
            size: { x: sx, y: sy, z: sz },
            totalCount, uniqueCount: counts.size,
            totalSlots: results.reduce((acc, r) => acc + r.slots, 0)
        });
    } catch (err) {
        self.postMessage({
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

    const palette = root.structure.palette?.default?.block_palette;
    const layer = root.structure.block_indices?.[0];
    if (!palette || !layer) throw new Error('palette or block_indices missing');

    const counts = new Map();
    const coords = [];
    let totalCount = 0;

    for (let i = 0; i < layer.length; i++) {
        const blockIndex = layer[i];
        if (blockIndex === -1) continue;
        const blockData = palette[blockIndex];
        if (!blockData) continue;

        // Bedrock 汎用ID + states を最新の flat ID に正規化
        const norm = normalizeBedrockBlock(blockData.name, blockData.states);
        if (norm.skip) continue;
        let blockId = norm.id;
        let increment = norm.increment;

        // double_cut_copper_slab 等のレガシー double 対応
        if (blockId === 'minecraft:double_cut_copper_slab') { blockId = 'minecraft:cut_copper_slab'; increment = 2; }

        if (blockId === 'minecraft:air' || blockId === 'minecraft:structure_block' || blockId === 'minecraft:structure_void') continue;

        counts.set(blockId, (counts.get(blockId) || 0) + increment);
        totalCount += increment;

        // Bedrock: index = x * sy * sz + y * sz + z
        const z = i % sz;
        const y = Math.floor(i / sz) % sy;
        const x = Math.floor(i / (sy * sz));
        coords.push({ x, y, z, blockId, states: blockData.states || null });
    }
    return { coords, counts, totalCount, sx, sy, sz, edition: 'bedrock' };
}

/* ─── Java パーサー ───────────────────────────────────────────────
 * Java の structure NBT 形式：
 *   - palette: [{ Name: 'minecraft:stone', Properties: {...} }, ...]
 *   - blocks: [{ pos: [x,y,z], state: idx, nbt: {...} }, ...]
 * もしくは litematica 系の場合は root の中に Regions が入る（未対応）
 *
 * 二段スラブ等の上半身判定は Properties.half === 'upper' / Properties.part === 'head' を見る。
 */
function parseJava(root) {
    const sizeArr = root.size;
    if (!sizeArr || sizeArr.length < 3) throw new Error('Java NBT: size missing');
    const [sx, sy, sz] = sizeArr;

    const palette = root.palette;
    const blocks = root.blocks;

    const counts = new Map();
    const coords = [];
    let totalCount = 0;

    for (const b of blocks) {
        if (!b || !b.pos || b.state === undefined) continue;
        const entry = palette[b.state];
        if (!entry) continue;
        let blockId = entry.Name;
        const props = entry.Properties || {};

        // 上半身/頭部の重複除去
        if (props.half === 'upper') continue;
        if (props.part === 'head') continue;

        if (blockId === 'minecraft:air' || blockId === 'minecraft:structure_block' || blockId === 'minecraft:structure_void') continue;

        counts.set(blockId, (counts.get(blockId) || 0) + 1);
        totalCount++;

        const [x, y, z] = b.pos;
        coords.push({ x, y, z, blockId, states: props });
    }
    return { coords, counts, totalCount, sx, sy, sz, edition: 'java' };
}

/* ─── カテゴリ分類 ────────────────────────────────────────────── */
function getCategory(id) {
    const b = id.replace('minecraft:', '');
    if (/planks|stone|brick|concrete|terracotta|wool|wood|log|deepslate|cobblestone|quartz|sandstone|basalt|blackstone/.test(b)) return 'building';
    if (/stairs|slab|fence|door|trapdoor|glass|lantern|chest|sign|bed|banner|candle|pot|carpet|wall/.test(b)) return 'decoration';
    if (/redstone|piston|observer|hopper|repeater|comparator|rail|button|pressure_plate|dispenser|dropper|lever|tripwire|daylight/.test(b)) return 'redstone';
    if (/leaf|leaves|sapling|flower|grass|dirt|sand|gravel|coral|spore|vine|moss|mushroom|cactus|bamboo|sugarcane/.test(b)) return 'nature';
    return 'other';
}
