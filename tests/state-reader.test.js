import { describe, test, expect } from 'vitest';
import {
  readSlabType, readTrapdoorFacing, readTrapdoorHalf, readTrapdoorOpen,
  readStairsFacing, readStairsHalf, readDoorFacing, readDoorHalf,
  readDoorOpen, readDoorHinge, readFenceGateFacing, readFenceGateOpen,
  readAxis, readFacing6, readHanging, buildShapeSignature,
} from '../js/render/state-reader.js';

describe('readSlabType (Java優先 + Bedrock fallback)', () => {
  test('Java type=top', () => expect(readSlabType({ type: 'top' })).toBe('top'));
  test('Java type=bottom', () => expect(readSlabType({ type: 'bottom' })).toBe('bottom'));
  test('Java type=double', () => expect(readSlabType({ type: 'double' })).toBe('double'));
  test('Bedrock vertical_half=top', () => expect(readSlabType({ vertical_half: 'top' })).toBe('top'));
  test('Bedrock minecraft:vertical_half=bottom', () => expect(readSlabType({ 'minecraft:vertical_half': 'bottom' })).toBe('bottom'));
  test('Bedrock top_slot_bit=1', () => expect(readSlabType({ top_slot_bit: 1 })).toBe('top'));
  test('Bedrock top_slot_bit=0', () => expect(readSlabType({ top_slot_bit: 0 })).toBe('bottom'));
  test('empty → bottom', () => expect(readSlabType({})).toBe('bottom'));
});

describe('readTrapdoorFacing', () => {
  test('Java facing=north', () => expect(readTrapdoorFacing({ facing: 'north' })).toBe('north'));
  test('Java facing=east', () => expect(readTrapdoorFacing({ facing: 'east' })).toBe('east'));
  test('Bedrock direction=0 → west',  () => expect(readTrapdoorFacing({ direction: 0 })).toBe('west'));
  test('Bedrock direction=1 → east',  () => expect(readTrapdoorFacing({ direction: 1 })).toBe('east'));
  test('Bedrock direction=2 → north', () => expect(readTrapdoorFacing({ direction: 2 })).toBe('north'));
  test('Bedrock direction=3 → south', () => expect(readTrapdoorFacing({ direction: 3 })).toBe('south'));
  test('Bedrock minecraft:cardinal_direction=south', () => expect(readTrapdoorFacing({ 'minecraft:cardinal_direction': 'south' })).toBe('south'));
});

describe('readTrapdoorOpen / readTrapdoorHalf', () => {
  test('Java open=true', () => expect(readTrapdoorOpen({ open: 'true' })).toBe(true));
  test('Java open=false', () => expect(readTrapdoorOpen({ open: 'false' })).toBe(false));
  test('Bedrock open_bit=1', () => expect(readTrapdoorOpen({ open_bit: 1 })).toBe(true));
  test('Bedrock open_bit=0', () => expect(readTrapdoorOpen({ open_bit: 0 })).toBe(false));
  test('Java half=top', () => expect(readTrapdoorHalf({ half: 'top' })).toBe('top'));
  test('Bedrock upside_down_bit=1', () => expect(readTrapdoorHalf({ upside_down_bit: 1 })).toBe('top'));
});

describe('readDoorFacing (block-type aware)', () => {
  test('Java facing=east', () => expect(readDoorFacing({ facing: 'east' })).toBe('east'));
  test('Bedrock direction=0 → east', () => expect(readDoorFacing({ direction: 0 })).toBe('east'));
  test('Bedrock direction=1 → south', () => expect(readDoorFacing({ direction: 1 })).toBe('south'));
  test('Bedrock direction=2 → west', () => expect(readDoorFacing({ direction: 2 })).toBe('west'));
  test('Bedrock direction=3 → north', () => expect(readDoorFacing({ direction: 3 })).toBe('north'));
});

describe('readDoorHinge / readDoorHalf / readDoorOpen', () => {
  test('Java hinge=right', () => expect(readDoorHinge({ hinge: 'right' })).toBe('right'));
  test('Java hinge=left', () => expect(readDoorHinge({ hinge: 'left' })).toBe('left'));
  // Bedrock door_hinge_bit は内側視点なので Java の外側視点と flip
  test('Bedrock door_hinge_bit=1 → left (flipped)', () => expect(readDoorHinge({ door_hinge_bit: 1 })).toBe('left'));
  test('Bedrock door_hinge_bit=0 → right (flipped)', () => expect(readDoorHinge({ door_hinge_bit: 0 })).toBe('right'));
  test('Java half=upper', () => expect(readDoorHalf({ half: 'upper' })).toBe('upper'));
  test('Bedrock upper_block_bit=1', () => expect(readDoorHalf({ upper_block_bit: 1 })).toBe('upper'));
});

describe('readStairsFacing / Half', () => {
  test('Java facing=north', () => expect(readStairsFacing({ facing: 'north' })).toBe('north'));
  test('Bedrock weirdo_direction=0 → east', () => expect(readStairsFacing({ weirdo_direction: 0 })).toBe('east'));
  test('Bedrock weirdo_direction=3 → north', () => expect(readStairsFacing({ weirdo_direction: 3 })).toBe('north'));
  test('Java half=top', () => expect(readStairsHalf({ half: 'top' })).toBe('top'));
  test('Bedrock upside_down_bit=1', () => expect(readStairsHalf({ upside_down_bit: 1 })).toBe('top'));
});

describe('readFenceGateFacing', () => {
  test('Java facing=south', () => expect(readFenceGateFacing({ facing: 'south' })).toBe('south'));
  test('Bedrock direction=0 → south', () => expect(readFenceGateFacing({ direction: 0 })).toBe('south'));
  test('Bedrock direction=3 → east', () => expect(readFenceGateFacing({ direction: 3 })).toBe('east'));
});

describe('readAxis / readFacing6 / readHanging', () => {
  test('Java axis=x', () => expect(readAxis({ axis: 'x' })).toBe('x'));
  test('Bedrock pillar_axis=z', () => expect(readAxis({ pillar_axis: 'z' })).toBe('z'));
  test('Java facing=up', () => expect(readFacing6({ facing: 'up' })).toBe('up'));
  test('Bedrock facing_direction=1 → up', () => expect(readFacing6({ facing_direction: 1 })).toBe('up'));
  test('Bedrock facing_direction=4 → west', () => expect(readFacing6({ facing_direction: 4 })).toBe('west'));
  test('Java hanging=true', () => expect(readHanging({ hanging: 'true' })).toBe(true));
  test('Bedrock hanging_bit=1', () => expect(readHanging({ hanging_bit: 1 })).toBe(true));
});

describe('buildShapeSignature (キャッシュ衝突防止)', () => {
  test('Java top vs bottom slab → 異なる signature', () => {
    const sigTop = buildShapeSignature('minecraft:dark_oak_slab', 'slab', { type: 'top' });
    const sigBot = buildShapeSignature('minecraft:dark_oak_slab', 'slab', { type: 'bottom' });
    expect(sigTop).not.toBe(sigBot);
  });

  test('Java open vs closed trapdoor → 異なる signature', () => {
    const sigOpen = buildShapeSignature('minecraft:spruce_trapdoor', 'trapdoor',
      { facing: 'north', half: 'bottom', open: 'true' });
    const sigClosed = buildShapeSignature('minecraft:spruce_trapdoor', 'trapdoor',
      { facing: 'north', half: 'bottom', open: 'false' });
    expect(sigOpen).not.toBe(sigClosed);
  });

  test('Java と Bedrock の同じ視覚状態 → 同じ signature', () => {
    // Per TRAPDOOR_DIR_TO_FACING = ['west', 'east', 'north', 'south']
    // direction=2 → north (same as Java facing='north')
    const javaSig = buildShapeSignature('minecraft:spruce_trapdoor', 'trapdoor',
      { facing: 'north', half: 'bottom', open: 'true' });
    const beSig   = buildShapeSignature('minecraft:spruce_trapdoor', 'trapdoor',
      { direction: 2, upside_down_bit: 0, open_bit: 1 });
    expect(javaSig).toBe(beSig);
  });
});
