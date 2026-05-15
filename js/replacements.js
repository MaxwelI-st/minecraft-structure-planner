/**
 * replacements.js
 * ────────────────────────────────────────────────────────────────────────────
 * ブロック置換ユーティリティ
 *
 *   - DOWNGRADE_PRESETS : 高級素材→廉価素材の一括置換マップ群
 *   - applyToCoords()   : coords[] にマップを当てて新しい配列を返す
 *   - applyToCounts()   : Map<id, count> を集計し直して返す
 *
 * プリセットは「現実主義（黒コンクリで代用）」「中級（テラコッタで代用）」など
 * 用途別にまとまっている。複数プリセットの合成も可能。
 * ────────────────────────────────────────────────────────────────────────────
 */

import { normalizeId } from './bedrock_normalize.js';

/* ─── プリセット定義 ───────────────────────────────────────────────────── */

/** 黒/暗色系の高級素材 → 黒コンクリ・石炭ブロック */
const PRESET_DARK_LUXURY = {
    'minecraft:netherite_block': 'minecraft:black_concrete',
    'minecraft:obsidian':         'minecraft:black_concrete',
    'minecraft:crying_obsidian':  'minecraft:black_concrete',
    'minecraft:reinforced_deepslate': 'minecraft:black_concrete',
    'minecraft:dragon_egg':       'minecraft:coal_block',
};

/** 白/明色系の高級素材 → 白コンクリ・滑らかな閃緑岩 */
const PRESET_LIGHT_LUXURY = {
    'minecraft:quartz_block':         'minecraft:white_concrete',
    'minecraft:smooth_quartz':        'minecraft:white_concrete',
    'minecraft:chiseled_quartz_block':'minecraft:polished_diorite',
    'minecraft:quartz_pillar':        'minecraft:polished_diorite',
    'minecraft:quartz_bricks':        'minecraft:polished_diorite',
    'minecraft:quartz_stairs':        'minecraft:polished_diorite_stairs',
    'minecraft:quartz_slab':          'minecraft:polished_diorite_slab',
    'minecraft:diamond_block':        'minecraft:light_blue_concrete',
    'minecraft:beacon':               'minecraft:white_stained_glass',
};

/** 金/黄色系の高級素材 → 黄色テラコッタ・羊毛 */
const PRESET_GOLD_LUXURY = {
    'minecraft:gold_block':       'minecraft:yellow_terracotta',
    'minecraft:raw_gold_block':   'minecraft:yellow_terracotta',
    'minecraft:gilded_blackstone':'minecraft:yellow_terracotta',
    'minecraft:bell':             'minecraft:yellow_concrete',
    'minecraft:honey_block':      'minecraft:yellow_concrete',
    'minecraft:honeycomb_block':  'minecraft:yellow_terracotta',
};

/** 緑/青系の高級素材 → 緑テラコッタ・水色コンクリ */
const PRESET_TEAL_LUXURY = {
    'minecraft:emerald_block': 'minecraft:green_terracotta',
    'minecraft:lapis_block':   'minecraft:blue_concrete',
};

/** 灰/銀系の高級素材 → 鉄ブロックは粘土に */
const PRESET_GRAY_LUXURY = {
    'minecraft:iron_block':      'minecraft:white_terracotta',
    'minecraft:raw_iron_block':  'minecraft:white_terracotta',
    'minecraft:copper_block':    'minecraft:orange_terracotta',
    'minecraft:exposed_copper':  'minecraft:terracotta',
    'minecraft:weathered_copper':'minecraft:green_terracotta',
    'minecraft:oxidized_copper': 'minecraft:warped_wart_block',
    'minecraft:raw_copper_block':'minecraft:terracotta',
};

/** ガラスの代替（不透過にしたい場合）— デフォルトでは適用しない */
const PRESET_GLASS_TO_OPAQUE = {
    'minecraft:glass':         'minecraft:white_stained_glass',
    'minecraft:tinted_glass':  'minecraft:gray_stained_glass',
};

/** 葉ブロック→木材 = サバイバルでは葉が手に入りやすいので普通は不要だが、
 *  逆にツリー系葉を「全部オークの葉」に統一したい場合のために残す */
const PRESET_LEAVES_UNIFY = {
    'minecraft:spruce_leaves':  'minecraft:oak_leaves',
    'minecraft:birch_leaves':   'minecraft:oak_leaves',
    'minecraft:jungle_leaves':  'minecraft:oak_leaves',
    'minecraft:acacia_leaves':  'minecraft:oak_leaves',
    'minecraft:dark_oak_leaves':'minecraft:oak_leaves',
    'minecraft:mangrove_leaves':'minecraft:oak_leaves',
    'minecraft:cherry_leaves':  'minecraft:oak_leaves',
    'minecraft:azalea_leaves':  'minecraft:oak_leaves',
    'minecraft:flowering_azalea_leaves':'minecraft:oak_leaves',
};

/** 本/絵画系オブジェクト → 木材（モブ用置物の代替） */
const PRESET_DECORATIONS = {
    'minecraft:bookshelf':         'minecraft:oak_planks',
    'minecraft:chiseled_bookshelf':'minecraft:oak_planks',
    'minecraft:enchanting_table':  'minecraft:obsidian_replacement_unused', // 触らない
    'minecraft:painting':          'minecraft:oak_planks',
};

export const DOWNGRADE_PRESETS = {
    'realism_full': {
        name: '現実主義（一括ダウングレード）',
        description: 'ネザライト/黒曜石→黒コン、クォーツ→白コン、金→黄テラコッタ、ダイヤ/ラピス→水色青コン、鉄→白テラコッタ',
        map: {
            ...PRESET_DARK_LUXURY,
            ...PRESET_LIGHT_LUXURY,
            ...PRESET_GOLD_LUXURY,
            ...PRESET_TEAL_LUXURY,
            ...PRESET_GRAY_LUXURY,
        },
    },
    'dark_only': {
        name: '黒系のみダウングレード',
        description: 'ネザライト・黒曜石・補強深層岩 → 黒コンクリ',
        map: PRESET_DARK_LUXURY,
    },
    'light_only': {
        name: '白系のみダウングレード',
        description: 'クォーツ・ダイヤ・ビーコン → 白系の代替',
        map: PRESET_LIGHT_LUXURY,
    },
    'gold_only': {
        name: '金/黄系のみダウングレード',
        description: '金ブロック・蜂蜜・蜂の巣 → 黄色テラコッタ系',
        map: PRESET_GOLD_LUXURY,
    },
    'teal_only': {
        name: '宝石系のみダウングレード',
        description: 'エメラルド→緑テラコッタ、ラピス→青コンクリ',
        map: PRESET_TEAL_LUXURY,
    },
    'gray_only': {
        name: '鉄/銅系のみダウングレード',
        description: '鉄ブロック・銅ブロック → テラコッタ系',
        map: PRESET_GRAY_LUXURY,
    },
    'leaves_unify': {
        name: '葉を統一（オークに）',
        description: '全種類の葉 → オークの葉（テクスチャ統一に）',
        map: PRESET_LEAVES_UNIFY,
    },
};

/* ─── 適用ヘルパー ───────────────────────────────────────────────────── */

/** coords[] に置換マップを適用（新しい配列を返す） */
export function applyToCoords(coords, replacementMap) {
    if (!replacementMap || replacementMap.size === 0) return coords;
    const out = [];
    for (const c of coords) {
        const normId = normalizeId(c.blockId);
        const to = replacementMap.get(normId) || replacementMap.get('minecraft:' + normId.replace('minecraft:', '')) || replacementMap.get(normId.replace('minecraft:', ''));
        if (to) {
            const lowTo = to.toLowerCase();
            if (lowTo === 'minecraft:air' || lowTo === 'air') continue;
            const newRawId = to.replace(/^minecraft:/, '');
            out.push({ ...c, blockId: to, rawId: newRawId });
        } else {
            out.push(c);
        }
    }
    return out;
}

/** results[] (id/count などの配列) に置換マップを適用して再集計 */
export function applyToResults(results, replacementMap, getCategory) {
    if (!replacementMap || replacementMap.size === 0) return results;
    const counts = new Map();
    for (const r of results) {
        const normRId = normalizeId(r.id);
        const to = replacementMap.get(normRId) || replacementMap.get('minecraft:' + normRId.replace('minecraft:', '')) || replacementMap.get(normRId.replace('minecraft:', ''));
        const id = to || normRId;
        const lowId = id.toLowerCase();
        if (lowId === 'minecraft:air' || lowId === 'air') continue; // 削除されたものは集計から除外
        const prev = counts.get(id);
        if (prev) {
            prev.count += r.count;
        } else {
            counts.set(id, { count: r.count, category: r.category });
        }
    }
    return Array.from(counts.entries()).map(([id, v]) => {
        const stacks = Math.floor(v.count / 64);
        const remainder = v.count % 64;
        const slots = stacks + (remainder > 0 ? 1 : 0);
        return { id, count: v.count, stacks, remainder, slots, category: v.category || (getCategory ? getCategory(id) : 'other') };
    }).sort((a, b) => b.count - a.count);
}

/** 構造の results に対してプリセットマップから「適用可能なもの」だけ抽出 */
export function applicablePairsForStructure(structure, presetMap) {
    const ids = new Set((structure.results || []).map(r => r.id));
    const out = new Map();
    for (const [from, to] of Object.entries(presetMap)) {
        if (ids.has(from)) out.set(from, to);
    }
    return out;
}
