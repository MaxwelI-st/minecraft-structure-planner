import { describe, expect, test } from 'vitest';
import { getRedstoneTextureSpec } from '../js/render/redstone-texture-spec.js';

describe('redstone texture specs', () => {
  test('assigns distinct dropper and dispenser fronts', () => {
    expect(getRedstoneTextureSpec('minecraft:dropper').front[0]).toBe('dropper_front');
    expect(getRedstoneTextureSpec('minecraft:dispenser').front[0]).toBe('dispenser_front');
    expect(getRedstoneTextureSpec('minecraft:dropper', { facing_direction: 1 }).front[0])
      .toBe('dropper_front_vertical');
    expect(getRedstoneTextureSpec('minecraft:dispenser', { facing: 'down' }).front[0])
      .toBe('dispenser_front_vertical');
  });

  test('uses sticky and extended piston faces', () => {
    expect(getRedstoneTextureSpec('minecraft:sticky_piston').front[0]).toBe('piston_top_sticky');
    expect(getRedstoneTextureSpec('minecraft:piston', { extended: true }).front[0]).toBe('piston_inner');
  });

  test('switches observer output texture when powered', () => {
    expect(getRedstoneTextureSpec('minecraft:observer').front[0]).toBe('observer_front');
    expect(getRedstoneTextureSpec('minecraft:observer', { powered_bit: 1 }).back[0]).toBe('observer_back_on');
    expect(getRedstoneTextureSpec('minecraft:observer', { powered: true }).back)
      .toContain('observer_back_lit');
    expect(getRedstoneTextureSpec('minecraft:observer').back[0]).toBe('observer_back');
  });

  test('switches repeater and comparator top textures', () => {
    expect(getRedstoneTextureSpec('minecraft:unpowered_repeater').top[0]).toBe('repeater');
    expect(getRedstoneTextureSpec('minecraft:powered_repeater').top[0]).toBe('repeater_on');
    expect(getRedstoneTextureSpec('minecraft:comparator', { output_lit_bit: 1 }).top[0]).toBe('comparator_on');
  });

  test('supports common Java and Bedrock redstone texture aliases', () => {
    expect(getRedstoneTextureSpec('minecraft:redstone_wire').top)
      .toEqual(expect.arrayContaining(['redstone_dust_cross', 'redstone_wire']));
    expect(getRedstoneTextureSpec('minecraft:redstone_wire').line[0])
      .toBe('redstone_dust_line0');
    expect(getRedstoneTextureSpec('minecraft:piston').front)
      .toContain('piston_top_normal');
    expect(getRedstoneTextureSpec('minecraft:redstone_torch', { lit: false }).front)
      .toContain('redstone_torch_unlit');
  });

  test('keeps repeater overlays separate from their stone base', () => {
    expect(getRedstoneTextureSpec('minecraft:repeater').baseTop[0]).toBe('smooth_stone');
    expect(getRedstoneTextureSpec('minecraft:comparator').baseTop[0]).toBe('smooth_stone');
  });

  test('switches redstone lamp texture when lit', () => {
    expect(getRedstoneTextureSpec('minecraft:redstone_lamp').top[0]).toBe('redstone_lamp');
    expect(getRedstoneTextureSpec('minecraft:redstone_lamp', { lit: true }).top[0])
      .toBe('redstone_lamp_on');
    expect(getRedstoneTextureSpec('minecraft:lit_redstone_lamp').top[0])
      .toBe('redstone_lamp_on');
  });
});
