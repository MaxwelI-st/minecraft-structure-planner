/**
 * build-mapping-json.mjs
 *
 * data/be_to_je_mapping_source/ の各パートファイル（配列形式）を読み込み、
 * be-to-je.js が期待するフラットなキー形式の JSON に変換して
 * public/data/be_to_je_block_mapping.json として出力する。
 *
 * 使い方:
 *   node scripts/build-mapping-json.mjs
 *
 * キー形式 (be-to-je.js buildKey() と完全一致):
 *   boolean/int 0/false → "0", 1/true → "1", string → そのまま
 *   "minecraft:block|sortedKey1=val1,sortedKey2=val2"
 *
 * 出力形式:
 *   { "minecraft:block|...": { "Name": "minecraft:java_block", "Properties": { ... } } }
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── キービルダー (be-to-je.js buildKey() と同ロジック) ───────────────────────

function buildKey(blockName, bedrockStates) {
  const keys = Object.keys(bedrockStates).sort();
  if (keys.length === 0) return blockName;

  const stateStr = keys.map(k => {
    const v = bedrockStates[k];
    const normalized =
      (v === false || v === 0)  ? '0'
    : (v === true  || v === 1)  ? '1'
    : String(v);
    return `${k}=${normalized}`;
  }).join(',');

  return `${blockName}|${stateStr}`;
}

// ── 配列形式マップ → フラットオブジェクト変換 ─────────────────────────────────

function convertArrayMap(arrayMap) {
  const result = {};
  for (const [blockName, entries] of Object.entries(arrayMap)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const key = buildKey(blockName, entry.bedrock_states ?? {});
      result[key] = {
        Name: entry.java_id,
        Properties: entry.java_states ?? {},
      };
    }
  }
  return result;
}

// ── パートファイル一覧 ────────────────────────────────────────────────────────

const MAPPING_SRC_DIR = 'data/be_to_je_mapping_source';
const PART_FILES = [
  // Part 1: stone, slabs, logs, planks (配列形式)
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping.js`,
  // Part 2a: stairs, doors, oak/spruce/birch trapdoors
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part2a.js`,
  // Part 2b: trapdoors (jungle-iron), fences, walls, panes, iron bars
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part2b.js`,
  // Part 3: fence gates, buttons, levers, pressure plates, rails
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part3.js`,
  // Part 4: wool, concrete, concrete_powder, terracotta, carpet, stained glass
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part4.js`,
  // Part 5: glazed terracotta, shulker boxes, beds
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part5.js`,
  // Part 6: signs, containers (chest, barrel, furnace, hopper, dropper, dispenser)
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part6.js`,
  // Part 7: leaves, saplings, basic blocks, crops, wood variants
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part7.js`,
  // Part 8: redstone components (repeater, comparator, piston, torch, etc.)
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part8.js`,
  // Part 9: nether, deepslate, copper, end, stone variants
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part9.js`,
  // Part 10: flowers, plants, ores, misc building blocks, sculk, bamboo
  `${MAPPING_SRC_DIR}/be_to_je_block_mapping_part10.js`,
];

// ── メイン処理 ────────────────────────────────────────────────────────────────

async function main() {
  const merged = {};
  let totalEntries = 0;
  let loadedParts = 0;
  const skipped = [];

  for (const relPath of PART_FILES) {
    const absPath = resolve(ROOT, relPath);
    const fileUrl = pathToFileURL(absPath).href;

    let mod;
    try {
      mod = await import(fileUrl);
    } catch (err) {
      console.warn(`  ⚠ Skipping ${relPath}: ${err.message}`);
      skipped.push(relPath);
      continue;
    }

    // エクスポート名を探す (default or named)
    const mapValue = Object.values(mod).find(v => v && typeof v === 'object' && !Array.isArray(v));
    if (!mapValue) {
      console.warn(`  ⚠ No map export found in ${relPath}`);
      skipped.push(relPath);
      continue;
    }

    const converted = convertArrayMap(mapValue);
    const count = Object.keys(converted).length;

    // 後勝ちでマージ（より詳細なパートが上書き）
    Object.assign(merged, converted);
    totalEntries += count;
    loadedParts++;

    console.log(`  ✓ ${relPath.padEnd(55)} → ${String(count).padStart(5)} エントリ`);
  }

  // 出力先
  const outDir  = resolve(ROOT, 'public', 'data');
  const outPath = resolve(outDir, 'be_to_je_block_mapping.json');

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(merged), 'utf-8');

  const outSize = (JSON.stringify(merged).length / 1024).toFixed(1);
  const uniqueKeys = Object.keys(merged).length;

  console.log('');
  console.log(`✅ 完了`);
  console.log(`   パート数  : ${loadedParts} / ${PART_FILES.length}${skipped.length ? ` (${skipped.length}件スキップ)` : ''}`);
  console.log(`   エントリ数: ${uniqueKeys.toLocaleString()} キー (重複除去後)`);
  console.log(`   ファイルサイズ: ${outSize} KB`);
  console.log(`   出力先   : ${outPath}`);

  if (skipped.length) {
    console.log('');
    console.log('  スキップされたファイル:');
    skipped.forEach(f => console.log(`    - ${f}`));
  }
}

main().catch(err => {
  console.error('❌ エラー:', err);
  process.exit(1);
});
