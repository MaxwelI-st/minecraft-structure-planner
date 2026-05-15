/**
 * be_to_je_block_mapping_master.js — 全マッピングの統合マスター
 *
 * 統合元:
 *   - be_to_je_block_mapping_temp1.js (階段・ドア・トラップドア前半) ✅
 *   - be_to_je_block_mapping_temp2.js (レッドストーン・コンテナ・Flattening系) ⏳ pending
 *
 * MappingLoader は /data/be_to_je_block_mapping.json を fetch するため、
 * このファイルをビルド後に JSON 変換するか、下記の generateJSON() を使って
 * public/data/ に書き出してください。
 */

import { mapping as m1 } from './be_to_je_block_mapping_temp1.js';

// temp2 が完成したら以下のコメントを外す
// import { mapping as m2 } from './be_to_je_block_mapping_temp2.js';

/** 統合マッピングオブジェクト */
export const mapping = Object.assign(
  {},
  m1,
  // m2,  // temp2 pending
);

/** エントリ数のサマリーを返すデバッグ用ヘルパー */
export function summary() {
  const keys = Object.keys(mapping);
  const blocks = new Set(keys.map(k => k.split('|')[0]));
  return {
    totalEntries: keys.length,
    uniqueBlocks:  blocks.size,
    blocks: [...blocks].sort(),
  };
}
