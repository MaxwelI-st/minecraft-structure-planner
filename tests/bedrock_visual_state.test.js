/**
 * bedrock_visual_state.test.js — レッドストーン関連 BE 状態 → visual hints 抽出のテスト
 */
import { describe, it, expect } from 'vitest';
import { getVisualHints, isRedstoneSignalSource } from '../js/modules/logic/bedrock_visual_state.js';

describe('getVisualHints — Repeater', () => {
  // Direction normalization lives in orientation.js. Geometry is canonical north,
  // so no second 180-degree flip is applied here.
  it('unpowered_repeater with repeater_delay=0 returns delay=1', () => {
    const h = getVisualHints('minecraft:unpowered_repeater', { repeater_delay: 0, direction: 2 });
    expect(h.delay).toBe(1);
    expect(h.facing).toBe('north');
    expect(h.powered).toBe(false);
  });

  it('powered_repeater with repeater_delay=3 returns delay=4 and powered=true', () => {
    const h = getVisualHints('minecraft:powered_repeater', { repeater_delay: 3, direction: 0 });
    expect(h.delay).toBe(4);
    expect(h.facing).toBe('south');
    expect(h.powered).toBe(true);
  });

  it('repeater with minecraft:cardinal_direction string overrides direction int', () => {
    const h = getVisualHints('minecraft:repeater', {
      repeater_delay: 2,
      'minecraft:cardinal_direction': 'east',
    });
    expect(h.delay).toBe(3);
    expect(h.facing).toBe('east');
  });

  it('out-of-range repeater_delay returns null delay', () => {
    const h = getVisualHints('minecraft:unpowered_repeater', { repeater_delay: 99 });
    expect(h.delay).toBe(null);
  });
});

describe('getVisualHints — Comparator', () => {
  it('output_subtract_bit=1 → mode=subtract', () => {
    const h = getVisualHints('minecraft:unpowered_comparator', {
      output_subtract_bit: 1,
      direction: 1,
    });
    expect(h.mode).toBe('subtract');
    expect(h.facing).toBe('west');
    expect(h.powered).toBe(false);
  });

  it('output_subtract_bit=0 → mode=compare', () => {
    const h = getVisualHints('minecraft:powered_comparator', {
      output_subtract_bit: 0,
      output_lit_bit: 1,
      direction: 3,
    });
    expect(h.mode).toBe('compare');
    expect(h.facing).toBe('east');
    expect(h.powered).toBe(true);
  });
});

describe('getVisualHints — Observer', () => {
  it('minecraft:facing_direction string → facing', () => {
    const h = getVisualHints('minecraft:observer', {
      'minecraft:facing_direction': 'up',
      powered_bit: 1,
    });
    expect(h.facing).toBe('up');
    expect(h.powered).toBe(true);
  });

  it('facing_direction (int) → facing', () => {
    const h = getVisualHints('minecraft:observer', { facing_direction: 2 }); // north
    expect(h.facing).toBe('north');
  });
});

describe('getVisualHints — Piston / Dropper / Dispenser / Hopper', () => {
  it('piston facing_direction=0 → down', () => {
    const h = getVisualHints('minecraft:piston', { facing_direction: 0 });
    expect(h.facing).toBe('down');
  });

  it('sticky_piston facing_direction=1 → up', () => {
    const h = getVisualHints('minecraft:sticky_piston', { facing_direction: 1 });
    expect(h.facing).toBe('up');
  });

  it('dropper facing_direction=5 → east, triggered_bit', () => {
    const h = getVisualHints('minecraft:dropper', { facing_direction: 5, triggered_bit: 1 });
    expect(h.facing).toBe('east');
    expect(h.powered).toBe(true);
  });

  it('hopper uses orientation hints and keeps down as canonical', () => {
    const h = getVisualHints('minecraft:hopper', { facing_direction: 0, toggle_bit: 0 });
    expect(h).toMatchObject({ facing: null, face: null, axis: null });
  });
});

describe('getVisualHints — Torch', () => {
  it('top-mounted redstone_torch → face=floor, lit=true', () => {
    const h = getVisualHints('minecraft:redstone_torch', { torch_facing_direction: 'top' });
    expect(h.face).toBe('floor');
    expect(h.lit).toBe(true);
    expect(h.facing).toBeNull();
  });

  it('wall-mounted redstone_torch (north) → face=wall, facing=north', () => {
    const h = getVisualHints('minecraft:redstone_torch', { torch_facing_direction: 'north' });
    expect(h.face).toBe('wall');
    expect(h.facing).toBe('north');
  });

  it('unlit_redstone_torch → lit=false', () => {
    const h = getVisualHints('minecraft:unlit_redstone_torch', { torch_facing_direction: 'top' });
    expect(h.lit).toBe(false);
    expect(h.face).toBe('floor');
  });
});

describe('getVisualHints — Lever', () => {
  it('lever_direction=up_east_west → face=floor, facing=east', () => {
    const h = getVisualHints('minecraft:lever', { lever_direction: 'up_east_west', open_bit: 0 });
    expect(h.face).toBe('floor');
    expect(h.facing).toBe('east');
    expect(h.powered).toBe(false);
  });

  it('lever_direction=north (wall) + open_bit=1', () => {
    const h = getVisualHints('minecraft:lever', { lever_direction: 'north', open_bit: 1 });
    expect(h.face).toBe('wall');
    expect(h.facing).toBe('north');
    expect(h.powered).toBe(true);
  });

  it('lever_direction=down_north_south → ceiling', () => {
    const h = getVisualHints('minecraft:lever', { lever_direction: 'down_north_south' });
    expect(h.face).toBe('ceiling');
    expect(h.facing).toBe('north');
  });
});

describe('getVisualHints — Button', () => {
  it('button facing_direction=1 → floor', () => {
    const h = getVisualHints('minecraft:wooden_button', { facing_direction: 1, button_pressed_bit: 0 });
    expect(h.face).toBe('floor');
    expect(h.powered).toBe(false);
  });

  it('button facing_direction=0 → ceiling', () => {
    const h = getVisualHints('minecraft:stone_button', { facing_direction: 0 });
    expect(h.face).toBe('ceiling');
  });

  it('button facing_direction=2 → wall north', () => {
    const h = getVisualHints('minecraft:wooden_button', { facing_direction: 2, button_pressed_bit: 1 });
    expect(h.face).toBe('wall');
    expect(h.facing).toBe('north');
    expect(h.powered).toBe(true);
  });
});

describe('getVisualHints — Tripwire Hook', () => {
  it('direction=2 → facing=north, face=wall', () => {
    const h = getVisualHints('minecraft:tripwire_hook', {
      direction: 2,
      attached_bit: 1,
      powered_bit: 0,
    });
    expect(h.facing).toBe('north');
    expect(h.face).toBe('wall');
    expect(h.powered).toBe(false);
  });
});

describe('getVisualHints — Redstone Wire', () => {
  it('redstone_signal=15 → power=15, powered=true', () => {
    const h = getVisualHints('minecraft:redstone_wire', { redstone_signal: 15 });
    expect(h.power).toBe(15);
    expect(h.powered).toBe(true);
    expect(h.face).toBe('floor');
  });

  it('redstone_signal=0 → power=0, powered=false', () => {
    const h = getVisualHints('minecraft:redstone_wire', { redstone_signal: 0 });
    expect(h.power).toBe(0);
    expect(h.powered).toBe(false);
  });

  it('missing redstone_signal defaults to 0', () => {
    const h = getVisualHints('minecraft:redstone_wire', {});
    expect(h.power).toBe(0);
  });

  it('clamps redstone_signal > 15', () => {
    const h = getVisualHints('minecraft:redstone_wire', { redstone_signal: 99 });
    expect(h.power).toBe(15);
  });
});

describe('getVisualHints — Crafter', () => {
  it('orientation=north_up → facing=north', () => {
    const h = getVisualHints('minecraft:crafter', { orientation: 'north_up', triggered_bit: 0 });
    expect(h.facing).toBe('north');
  });

  it('orientation=down_east → facing=down', () => {
    const h = getVisualHints('minecraft:crafter', { orientation: 'down_east', triggered_bit: 1 });
    expect(h.facing).toBe('down');
    expect(h.powered).toBe(true);
  });
});

describe('getVisualHints — Daylight Detector / Pressure Plates', () => {
  it('daylight_detector reports power and face=floor', () => {
    const h = getVisualHints('minecraft:daylight_detector', { redstone_signal: 12 });
    expect(h.power).toBe(12);
    expect(h.face).toBe('floor');
  });

  it('stone_pressure_plate with signal', () => {
    const h = getVisualHints('minecraft:stone_pressure_plate', { redstone_signal: 15 });
    expect(h.power).toBe(15);
    expect(h.powered).toBe(true);
  });
});

describe('getVisualHints — Unknown blocks', () => {
  it('returns null for non-redstone blocks', () => {
    expect(getVisualHints('minecraft:stone', {})).toBeNull();
    expect(getVisualHints('minecraft:dirt', {})).toBeNull();
  });

  it('returns null for null blockId', () => {
    expect(getVisualHints(null, {})).toBeNull();
  });
});

describe('isRedstoneSignalSource', () => {
  it('recognizes core redstone blocks', () => {
    expect(isRedstoneSignalSource('minecraft:redstone_wire')).toBe(true);
    expect(isRedstoneSignalSource('minecraft:redstone_torch')).toBe(true);
    expect(isRedstoneSignalSource('minecraft:lever')).toBe(true);
    expect(isRedstoneSignalSource('minecraft:unpowered_repeater')).toBe(true);
    expect(isRedstoneSignalSource('minecraft:observer')).toBe(true);
  });

  it('returns false for non-source blocks', () => {
    expect(isRedstoneSignalSource('minecraft:stone')).toBe(false);
    expect(isRedstoneSignalSource('minecraft:piston')).toBe(false); // piston は信号源ではない
    expect(isRedstoneSignalSource(null)).toBe(false);
  });

  it('handles bare block names without minecraft: prefix', () => {
    expect(isRedstoneSignalSource('redstone_wire')).toBe(true);
  });
});
