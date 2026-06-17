import { describe, expect, test } from 'vitest';
import {
  getTextureAlphaMode,
  getTextureMaterialOptions,
} from '../js/render/texture-material-policy.js';

describe('3D texture material policy', () => {
  test('treats glass and water as blended materials', () => {
    expect(getTextureAlphaMode('minecraft:white_stained_glass')).toBe('blend');
    expect(getTextureAlphaMode('minecraft:glass_pane')).toBe('blend');
    expect(getTextureAlphaMode('minecraft:water')).toBe('blend');
    expect(getTextureMaterialOptions('minecraft:glass').depthWrite).toBe(false);
  });

  test('uses alpha cutout for foliage and thin textured blocks', () => {
    expect(getTextureAlphaMode('minecraft:oak_leaves')).toBe('cutout');
    expect(getTextureAlphaMode('minecraft:oak_door')).toBe('cutout');
    expect(getTextureAlphaMode('minecraft:rail')).toBe('cutout');
    expect(getTextureMaterialOptions('minecraft:oak_leaves').transparent).toBe(false);
  });

  test('uses alpha cutout for redstone device overlays', () => {
    expect(getTextureAlphaMode('minecraft:repeater')).toBe('cutout');
    expect(getTextureAlphaMode('minecraft:powered_comparator')).toBe('cutout');
  });

  test('keeps opaque complex blocks out of transparency sorting', () => {
    expect(getTextureAlphaMode('minecraft:hopper')).toBe('opaque');
    expect(getTextureAlphaMode('minecraft:anvil')).toBe('opaque');
    expect(getTextureAlphaMode('minecraft:flower_pot')).toBe('opaque');
  });

  test('forces grass overlay into alpha cutout mode', () => {
    expect(getTextureAlphaMode('minecraft:grass_block', 'overlay')).toBe('cutout');
  });
});
