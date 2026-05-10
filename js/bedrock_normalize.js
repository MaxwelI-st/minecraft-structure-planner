/**
 * bedrock_normalize.js
 * ────────────────────────────────────────────────────────────────────────────
 * Bedrock の汎用 blockId + states を、現代の flat ID に正規化する。
 *
 * 例:
 *   minecraft:stone_block_slab + stone_slab_type=quartz
 *     → minecraft:quartz_slab
 *
 *   minecraft:planks + wood_type=oak
 *     → minecraft:oak_planks
 *
 *   minecraft:leaves + old_leaf_type=spruce
 *     → minecraft:spruce_leaves
 *
 * 戻り値: { id, increment }
 *   id        : 正規化済み flat blockId
 *   increment : double_slab → slab に変えた場合 2、それ以外 1
 *
 * 対応していない blockId は元の id をそのまま返す（無害）。
 * ────────────────────────────────────────────────────────────────────────────
 */

/* ─── stone_slab_type → flat ID（slab 用） ─────────────────────────────── */
const STONE_SLAB_TYPE = {
    'smooth_stone':    'smooth_stone_slab',
    'sandstone':       'sandstone_slab',
    'wood':            'petrified_oak_slab',
    'cobblestone':     'cobblestone_slab',
    'brick':           'brick_slab',
    'stone_brick':     'stone_brick_slab',
    'quartz':          'quartz_slab',
    'nether_brick':    'nether_brick_slab',
};

/* double_stone_block_slab はフル石版扱い */
const STONE_SLAB_TYPE_FULL = {
    'smooth_stone':    'smooth_stone',
    'sandstone':       'sandstone',
    'wood':            'oak_planks',
    'cobblestone':     'cobblestone',
    'brick':           'bricks',
    'stone_brick':     'stone_bricks',
    'quartz':          'quartz_block',
    'nether_brick':    'nether_bricks',
};

const STONE_SLAB_TYPE_2 = {
    'red_sandstone':       'red_sandstone_slab',
    'purpur':              'purpur_slab',
    'prismarine_rough':    'prismarine_slab',
    'prismarine_dark':     'dark_prismarine_slab',
    'prismarine_brick':    'prismarine_brick_slab',
    'mossy_cobblestone':   'mossy_cobblestone_slab',
    'smooth_sandstone':    'smooth_sandstone_slab',
    'red_nether_brick':    'red_nether_brick_slab',
};
const STONE_SLAB_TYPE_2_FULL = {
    'red_sandstone':       'red_sandstone',
    'purpur':              'purpur_block',
    'prismarine_rough':    'prismarine',
    'prismarine_dark':     'dark_prismarine',
    'prismarine_brick':    'prismarine_bricks',
    'mossy_cobblestone':   'mossy_cobblestone',
    'smooth_sandstone':    'smooth_sandstone',
    'red_nether_brick':    'red_nether_bricks',
};

const STONE_SLAB_TYPE_3 = {
    'end_stone_brick':       'end_stone_brick_slab',
    'smooth_red_sandstone':  'smooth_red_sandstone_slab',
    'polished_andesite':     'polished_andesite_slab',
    'andesite':              'andesite_slab',
    'diorite':               'diorite_slab',
    'polished_diorite':      'polished_diorite_slab',
    'granite':               'granite_slab',
    'polished_granite':      'polished_granite_slab',
};
const STONE_SLAB_TYPE_3_FULL = {
    'end_stone_brick':       'end_stone_bricks',
    'smooth_red_sandstone':  'smooth_red_sandstone',
    'polished_andesite':     'polished_andesite',
    'andesite':              'andesite',
    'diorite':               'diorite',
    'polished_diorite':      'polished_diorite',
    'granite':               'granite',
    'polished_granite':      'polished_granite',
};

const STONE_SLAB_TYPE_4 = {
    'mossy_stone_brick':   'mossy_stone_brick_slab',
    'smooth_quartz':       'smooth_quartz_slab',
    'stone':               'stone_slab',
    'cut_sandstone':       'cut_sandstone_slab',
    'cut_red_sandstone':   'cut_red_sandstone_slab',
};
const STONE_SLAB_TYPE_4_FULL = {
    'mossy_stone_brick':   'mossy_stone_bricks',
    'smooth_quartz':       'smooth_quartz',
    'stone':               'stone',
    'cut_sandstone':       'cut_sandstone',
    'cut_red_sandstone':   'cut_red_sandstone',
};

/* ─── wood_type → flat ID ─────────────────────────────────────────────── */
const WOOD_TYPE = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];

/* ─── stone_type → flat ID ────────────────────────────────────────────── */
const STONE_TYPE = {
    'stone':            'stone',
    'granite':          'granite',
    'granite_smooth':   'polished_granite',
    'diorite':          'diorite',
    'diorite_smooth':   'polished_diorite',
    'andesite':         'andesite',
    'andesite_smooth':  'polished_andesite',
};

/* ─── stonebrick + stone_brick_type → flat ID ─────────────────────────── */
const STONE_BRICK_TYPE = {
    'default':  'stone_bricks',
    'mossy':    'mossy_stone_bricks',
    'cracked':  'cracked_stone_bricks',
    'chiseled': 'chiseled_stone_bricks',
    'smooth':   'stone_bricks',
};

/* ─── sandstone + sand_stone_type → flat ID ───────────────────────────── */
const SAND_STONE_TYPE = {
    'default':     'sandstone',
    'heiroglyphs': 'chiseled_sandstone',
    'cut':         'cut_sandstone',
    'smooth':      'smooth_sandstone',
};
const RED_SAND_STONE_TYPE = {
    'default':     'red_sandstone',
    'heiroglyphs': 'chiseled_red_sandstone',
    'cut':         'cut_red_sandstone',
    'smooth':      'smooth_red_sandstone',
};

/* ─── leaves / leaves2 ────────────────────────────────────────────────── */
const OLD_LEAF_TYPE = {
    'oak': 'oak_leaves',
    'spruce': 'spruce_leaves',
    'birch': 'birch_leaves',
    'jungle': 'jungle_leaves',
};
const NEW_LEAF_TYPE = {
    'acacia': 'acacia_leaves',
    'dark_oak': 'dark_oak_leaves',
};

/* ─── log / log2 ──────────────────────────────────────────────────────── */
const OLD_LOG_TYPE = {
    'oak': 'oak_log',
    'spruce': 'spruce_log',
    'birch': 'birch_log',
    'jungle': 'jungle_log',
};
const NEW_LOG_TYPE = {
    'acacia': 'acacia_log',
    'dark_oak': 'dark_oak_log',
};

/* ─── dirt ─────────────────────────────────────────────────────────────── */
const DIRT_TYPE = {
    'normal': 'dirt',
    'coarse': 'coarse_dirt',
};

/* ─── monster_egg + monster_egg_stone_type ────────────────────────────── */
const MONSTER_EGG_TYPE = {
    'stone':         'infested_stone',
    'cobblestone':   'infested_cobblestone',
    'stone_brick':   'infested_stone_bricks',
    'mossy_stone_brick': 'infested_mossy_stone_bricks',
    'cracked_stone_brick': 'infested_cracked_stone_bricks',
    'chiseled_stone_brick': 'infested_chiseled_stone_bricks',
};

/* ─── concrete_powder / concretePowder + color ────────────────────────── */
const COLORS = ['white','orange','magenta','light_blue','yellow','lime','pink','gray','silver','cyan','purple','blue','brown','green','red','black'];
function colorVar(prefix, color) {
    // silver は light_gray にエイリアス
    const c = color === 'silver' ? 'light_gray' : color;
    return `minecraft:${c}_${prefix}`;
}

/* ─── 公開 API ─────────────────────────────────────────────────────────── */

/**
 * ID の正規化（小文字化、トリム、空白をアンダースコアへ変換）
 * 統合版の "minecraft:oak stairs" のような空白入りIDを "minecraft:oak_stairs" に統一する。
 */
export function normalizeId(id) {
    if (!id) return '';
    return String(id).toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * 汎用 ID + states → 正規化された flat ID
 * 戻り値: { id, increment, skip }
 */
export function normalizeBedrockBlock(rawId, states) {
    const id = normalizeId(rawId);
    const s = states || {};
    let result = { id, increment: 1, skip: false };

    // air / structure 系は早期スキップ判定
    if (id === 'minecraft:air' || id === 'minecraft:structure_block' || id === 'minecraft:structure_void') {
        result.skip = true;
        return result;
    }

    // ステート取得ヘルパー（プレフィックスの有無、NBTオブジェクト形式の両方に対応）
    const _get = (key) => {
        if (!s) return undefined;
        // 1. 直値を確認
        let v = s[key];
        // 2. プレフィックス付きを確認
        if (v === undefined) v = s['minecraft:' + key];
        
        if (v === undefined) return undefined;
        // 3. NBTオブジェクト形式 { value: ... } なら展開
        if (typeof v === 'object' && v !== null && 'value' in v) return v.value;
        return v;
    };

    const local = id.replace(/^minecraft:/, '');

    // ─── stone_block_slab 系 ───────────────────────────────
    const stoneSlabType = _get('stone_slab_type');
    if (local === 'stone_block_slab' && stoneSlabType !== undefined) {
        const m = STONE_SLAB_TYPE[stoneSlabType] || 'stone_slab';
        result.id = 'minecraft:' + m;
        return result;
    }
    if (local === 'double_stone_block_slab' && stoneSlabType !== undefined) {
        const m = STONE_SLAB_TYPE_FULL[stoneSlabType] || 'stone';
        result.id = 'minecraft:' + m;
        result.increment = 2;
        return result;
    }
    const stoneSlabType2 = _get('stone_slab_type_2');
    if (local === 'stone_block_slab2' && stoneSlabType2 !== undefined) {
        const m = STONE_SLAB_TYPE_2[stoneSlabType2] || 'red_sandstone_slab';
        result.id = 'minecraft:' + m;
        return result;
    }
    if (local === 'double_stone_block_slab2' && stoneSlabType2 !== undefined) {
        result.id = 'minecraft:' + (STONE_SLAB_TYPE_2_FULL[stoneSlabType2] || 'red_sandstone');
        result.increment = 2;
        return result;
    }
    const stoneSlabType3 = _get('stone_slab_type_3');
    if (local === 'stone_block_slab3' && stoneSlabType3 !== undefined) {
        result.id = 'minecraft:' + (STONE_SLAB_TYPE_3[stoneSlabType3] || 'andesite_slab');
        return result;
    }
    if (local === 'double_stone_block_slab3' && stoneSlabType3 !== undefined) {
        result.id = 'minecraft:' + (STONE_SLAB_TYPE_3_FULL[stoneSlabType3] || 'andesite');
        result.increment = 2;
        return result;
    }
    const stoneSlabType4 = _get('stone_slab_type_4');
    if (local === 'stone_block_slab4' && stoneSlabType4 !== undefined) {
        result.id = 'minecraft:' + (STONE_SLAB_TYPE_4[stoneSlabType4] || 'stone_slab');
        return result;
    }
    if (local === 'double_stone_block_slab4' && stoneSlabType4 !== undefined) {
        result.id = 'minecraft:' + (STONE_SLAB_TYPE_4_FULL[stoneSlabType4] || 'stone');
        result.increment = 2;
        return result;
    }

    // ─── wooden_slab + wood_type ───────────────────────────
    const woodType = _get('wood_type');
    if (local === 'wooden_slab' && woodType !== undefined) {
        const w = String(woodType);
        if (WOOD_TYPE.includes(w)) {
            result.id = `minecraft:${w}_slab`;
            return result;
        }
    }
    if (local === 'double_wooden_slab' && woodType !== undefined) {
        const w = String(woodType);
        if (WOOD_TYPE.includes(w)) {
            result.id = `minecraft:${w}_planks`;
            result.increment = 2;
            return result;
        }
    }

    // ─── planks + wood_type ────────────────────────────────
    if (local === 'planks' && woodType !== undefined) {
        const w = String(woodType);
        if (WOOD_TYPE.includes(w)) { result.id = `minecraft:${w}_planks`; return result; }
    }

    // ─── log + old_log_type / log2 + new_log_type ──────────
    const oldLogType = _get('old_log_type');
    if (local === 'log' && oldLogType !== undefined) {
        const w = String(oldLogType);
        if (OLD_LOG_TYPE[w]) { result.id = 'minecraft:' + OLD_LOG_TYPE[w]; return result; }
    }
    const newLogType = _get('new_log_type');
    if (local === 'log2' && newLogType !== undefined) {
        const w = String(newLogType);
        if (NEW_LOG_TYPE[w]) { result.id = 'minecraft:' + NEW_LOG_TYPE[w]; return result; }
    }

    // ─── leaves / leaves2 ──────────────────────────────────
    const oldLeafType = _get('old_leaf_type');
    if (local === 'leaves' && oldLeafType !== undefined) {
        const t = String(oldLeafType);
        if (OLD_LEAF_TYPE[t]) { result.id = 'minecraft:' + OLD_LEAF_TYPE[t]; return result; }
    }
    const newLeafType = _get('new_leaf_type');
    if (local === 'leaves2' && newLeafType !== undefined) {
        const t = String(newLeafType);
        if (NEW_LEAF_TYPE[t]) { result.id = 'minecraft:' + NEW_LEAF_TYPE[t]; return result; }
    }

    // ─── stone + stone_type ────────────────────────────────
    const stoneType = _get('stone_type');
    if (local === 'stone' && stoneType !== undefined) {
        const t = String(stoneType);
        if (STONE_TYPE[t]) { result.id = 'minecraft:' + STONE_TYPE[t]; return result; }
    }

    // ─── stonebrick + stone_brick_type ─────────────────────
    const stoneBrickType = _get('stone_brick_type');
    if (local === 'stonebrick' && stoneBrickType !== undefined) {
        result.id = 'minecraft:' + (STONE_BRICK_TYPE[String(stoneBrickType)] || 'stone_bricks');
        return result;
    }

    // ─── sandstone + sand_stone_type ───────────────────────
    const sandStoneType = _get('sand_stone_type');
    if (local === 'sandstone' && sandStoneType !== undefined) {
        result.id = 'minecraft:' + (SAND_STONE_TYPE[String(sandStoneType)] || 'sandstone');
        return result;
    }
    if (local === 'red_sandstone' && sandStoneType !== undefined) {
        result.id = 'minecraft:' + (RED_SAND_STONE_TYPE[String(sandStoneType)] || 'red_sandstone');
        return result;
    }

    // ─── dirt + dirt_type ──────────────────────────────────
    const dirtType = _get('dirt_type');
    if (local === 'dirt' && dirtType !== undefined) {
        result.id = 'minecraft:' + (DIRT_TYPE[String(dirtType)] || 'dirt');
        return result;
    }

    // ─── monster_egg ───────────────────────────────────────
    const monsterEggStoneType = _get('monster_egg_stone_type');
    if (local === 'monster_egg' && monsterEggStoneType !== undefined) {
        result.id = 'minecraft:' + (MONSTER_EGG_TYPE[String(monsterEggStoneType)] || 'infested_stone');
        return result;
    }

    // ─── color 系（color state） ───────────────────────────
    let color = _get('color');
    // Bedrock では数字 (0-15) で来る場合が多いので変換
    if (typeof color === 'number') {
        color = COLORS[color] || 'white';
    }
    
    if (color !== undefined && local && !local.includes(String(color))) {
        const colorKey = String(color);
        if (COLORS.includes(colorKey)) {
            const c = colorKey === 'silver' ? 'light_gray' : colorKey;
            const flatTargets = {
                'wool':           `${c}_wool`,
                'carpet':         `${c}_carpet`,
                'concrete':       `${c}_concrete`,
                'concretepowder': `${c}_concrete_powder`,
                'concrete_powder':`${c}_concrete_powder`,
                'stained_glass':  `${c}_stained_glass`,
                'stained_glass_pane': `${c}_stained_glass_pane`,
                'stained_hardened_clay': `${c}_terracotta`,
                'shulker_box':    `${c}_shulker_box`,
                'bed':            `${c}_bed`,
                'terracotta':     `${c}_terracotta`,
            };
            if (flatTargets[local]) {
                result.id = 'minecraft:' + flatTargets[local];
                return result;
            }
        }
    } else if (color === undefined) {
        // デフォルト値ガード
        const DEFAULT_IDS = {
            'wool': 'white_wool', 'carpet': 'white_carpet', 'concrete': 'white_concrete',
            'concrete_powder': 'white_concrete_powder', 'concretepowder': 'white_concrete_powder',
            'stained_glass': 'white_stained_glass', 'stained_glass_pane': 'white_stained_glass_pane',
            'stained_hardened_clay': 'white_terracotta', 'shulker_box': 'white_shulker_box',
            'bed': 'white_bed', 'terracotta': 'white_terracotta',
            'trapdoor': 'oak_trapdoor', 'fence': 'oak_fence', 'fence_gate': 'oak_fence_gate',
            'wooden_button': 'oak_button', 'wooden_pressure_plate': 'oak_pressure_plate'
        };
        if (DEFAULT_IDS[local]) {
            result.id = 'minecraft:' + DEFAULT_IDS[local];
            return result;
        }
    }

    // ─── double_slab 一般（汎用フォールバック） ────────────
    // Bedrock: xxx_double_slab or double_xxx_slab
    if (local.includes('double_slab')) {
        let base = local.replace('double_', '').replace('_double_', '').replace('_slab', '');
        
        // 特殊な名称変更が必要な素材（複数形など）
        const PLURALS = {
            'nether_brick': 'nether_bricks',
            'stone_brick': 'stone_bricks',
            'quartz': 'quartz_block',
            'prismarine_brick': 'prismarine_bricks',
            'red_nether_brick': 'red_nether_bricks',
            'mud_brick': 'mud_bricks',
            'deepslate_brick': 'deepslate_bricks',
            'deepslate_tile': 'deepslate_tiles',
            'blackstone_brick': 'blackstone_bricks',
            'polished_blackstone_brick': 'polished_blackstone_bricks',
        };
        
        if (PLURALS[base]) {
            base = PLURALS[base];
        } else if (['oak','spruce','birch','jungle','acacia','dark_oak','mangrove','cherry','pale_oak','bamboo','crimson','warped'].includes(base)) {
            // wood系なら planks に
            base += '_planks';
        }
        
        result.id = 'minecraft:' + base;
        result.increment = 2;
        return result;
    }

    return result;
}
