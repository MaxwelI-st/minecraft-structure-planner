import { NBTParser } from './nbt.js';

self.onmessage = async (e) => {
    const { buffer } = e.data;
    
    try {
        let data = buffer;
        const header = new Uint8Array(buffer, 0, 2);
        if (header[0] === 0x1f && header[1] === 0x8b) {
            const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
            const response = new Response(stream);
            data = await response.arrayBuffer();
        }

        const parser = new NBTParser(data);
        const result = parser.parse();
        
        if (!result || !result.value.structure) {
            throw new Error('Invalid .mcstructure format');
        }

        const structure = result.value.structure;
        const palette = structure.palette.default.block_palette;
        const layers = structure.block_indices;
        
        const counts = new Map();
        let totalCount = 0;

        for (const layer of layers) {
            for (const blockIndex of layer) {
                if (blockIndex === -1) continue;
                const blockData = palette[blockIndex];
                let blockId = blockData.name;
                let increment = 1;
                
                // Bedrock States Flattening
                if (blockData.states) {
                    const s = blockData.states;
                    if (s.color) blockId = `minecraft:${s.color}_${blockId.split(':')[1]}`;
                    else if (s.stone_type) blockId = `minecraft:${s.stone_type}`;
                    else if (s.wood_type) blockId = `minecraft:${s.wood_type}_${blockId.split(':')[1]}`;
                }

                // Double Slab 対策: IDをハーフブロックに変換し、カウントを2倍にする
                if (blockId.includes('double_slab')) {
                    blockId = blockId.replace('double_slab', 'slab');
                    increment = 2;
                } else if (blockId === 'minecraft:double_stone_block_slab') {
                    blockId = 'minecraft:stone_block_slab';
                    increment = 2;
                } else if (blockId === 'minecraft:double_cut_copper_slab') {
                    blockId = 'minecraft:cut_copper_slab';
                    increment = 2;
                }
                
                if (blockId === 'minecraft:air' || blockId === 'minecraft:structure_block' || blockId === 'minecraft:structure_void') continue;

                counts.set(blockId, (counts.get(blockId) || 0) + increment);
                totalCount += increment;
            }
        }

        const results = Array.from(counts.entries()).map(([id, count]) => {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            const slots = stacks + (remainder > 0 ? 1 : 0);
            return { 
                id, 
                count, 
                stacks, 
                remainder, 
                slots,
                category: getCategory(id)
            };
        }).sort((a, b) => b.count - a.count);

        self.postMessage({ 
            success: true, 
            results, 
            totalCount, 
            uniqueCount: counts.size,
            totalSlots: results.reduce((acc, r) => acc + r.slots, 0)
        });

    } catch (e) {
        self.postMessage({ success: false, error: e.message });
    }
};

function getCategory(id) {
    const blockId = id.replace('minecraft:', '');
    if (blockId.includes('planks') || blockId.includes('stone') || blockId.includes('brick') || blockId.includes('concrete') || blockId.includes('terracotta') || blockId.includes('wool') || blockId.includes('wood') || blockId.includes('log') || blockId.includes('deepslate')) return 'building';
    if (blockId.includes('stairs') || blockId.includes('slab') || blockId.includes('fence') || blockId.includes('door') || blockId.includes('trapdoor') || blockId.includes('glass') || blockId.includes('lantern') || blockId.includes('chest') || blockId.includes('sign') || blockId.includes('bed') || blockId.includes('banner') || blockId.includes('candle') || blockId.includes('pot')) return 'decoration';
    if (blockId.includes('redstone') || blockId.includes('piston') || blockId.includes('observer') || blockId.includes('hopper') || blockId.includes('repeater') || blockId.includes('comparator') || blockId.includes('rail') || blockId.includes('button') || blockId.includes('pressure_plate') || blockId.includes('dispenser') || blockId.includes('dropper')) return 'redstone';
    if (blockId.includes('leaf') || blockId.includes('leaves') || blockId.includes('sapling') || blockId.includes('flower') || blockId.includes('grass') || blockId.includes('dirt') || blockId.includes('sand') || blockId.includes('gravel') || blockId.includes('coral') || blockId.includes('spore') || blockId.includes('vine') || blockId.includes('moss')) return 'nature';
    return 'other';
}
