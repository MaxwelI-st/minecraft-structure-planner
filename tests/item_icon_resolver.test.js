import { describe, expect, test } from 'vitest';
import {
  getInventoryIconCandidates,
  resolveInventoryIconId,
} from '../js/ui/item-icon-resolver.js';

const bedrockToJava = id => ({
  brick_block: 'bricks',
  iron_chain: 'chain',
}[id] || id);

describe('inventory icon resolver', () => {
  test('uses display-name aliases for mineral blocks', () => {
    const urls = getInventoryIconCandidates('minecraft:iron_block', { bedrockToJava });
    expect(urls[0]).toBe('https://minecraft.wiki/images/Invicon_Block_of_Iron.png');
    expect(urls).toContain('https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/iron_block.png');
  });

  test('uses Hay Bale inventory art before flat block faces', () => {
    const urls = getInventoryIconCandidates('minecraft:hay_block', { bedrockToJava });
    expect(urls[0]).toBe('https://minecraft.wiki/images/Invicon_Hay_Bale.png');
    expect(urls.findIndex(url => url.endsWith('/block/hay_block_side.png'))).toBeGreaterThan(0);
  });

  test('normalizes legacy Bedrock IDs and state suffixes', () => {
    expect(resolveInventoryIconId('minecraft:iron_chain', bedrockToJava)).toBe('chain');
    expect(resolveInventoryIconId('minecraft:brick_block|foo=bar', bedrockToJava)).toBe('bricks');
  });

  test('keeps resource-pack item art at highest priority', () => {
    const urls = getInventoryIconCandidates('minecraft:iron_block', {
      bedrockToJava,
      packUrl: 'blob:iron-item',
    });
    expect(urls[0]).toBe('blob:iron-item');
    expect(new Set(urls).size).toBe(urls.length);
  });
});
