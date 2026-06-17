function boolState(states, ...keys) {
  for (const key of keys) {
    const value = states?.[key] ?? states?.[`minecraft:${key}`];
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
  }
  return false;
}

function facingState(states) {
  const value = states?.facing
    ?? states?.['minecraft:facing']
    ?? states?.facing_direction
    ?? states?.['minecraft:facing_direction'];
  if (value === 0 || value === '0' || value === 'down') return 'down';
  if (value === 1 || value === '1' || value === 'up') return 'up';
  return String(value || '').toLowerCase();
}

export function getRedstoneTextureSpec(blockId, states = {}) {
  const id = String(blockId || '').replace(/^minecraft:/, '').toLowerCase();

  if (id === 'redstone_wire') {
    const names = ['redstone_dust_dot', 'redstone_dust_cross', 'redstone_wire'];
    return {
      side: names, top: names, bottom: names, front: names, back: names,
      line: ['redstone_dust_line0', 'redstone_dust_line', 'redstone_dust_cross', 'redstone_wire'],
    };
  }

  if (id === 'redstone_torch' || id === 'lit_redstone_torch'
      || id === 'unlit_redstone_torch' || id === 'redstone_wall_torch') {
    const litValue = states?.lit ?? states?.['minecraft:lit'];
    const explicitlyUnlit = litValue === false || litValue === 0
      || litValue === '0' || litValue === 'false';
    const lit = id !== 'unlit_redstone_torch' && !explicitlyUnlit;
    const names = lit
      ? ['redstone_torch', 'redstone_torch_on']
      : ['redstone_torch_off', 'redstone_torch_unlit', 'redstone_torch'];
    return {
      side: names, top: names, bottom: names, front: names, back: names,
    };
  }

  if (id === 'piston' || id === 'sticky_piston') {
    const extended = boolState(states, 'extended', 'extended_bit');
    const pistonTop = id === 'sticky_piston'
      ? ['piston_top_sticky', 'piston_top_sticky_piston']
      : ['piston_top', 'piston_top_normal'];
    return {
      side: ['piston_side', 'piston_side_normal'],
      top: ['piston_side', 'piston_side_normal'],
      bottom: ['piston_side', 'piston_side_normal'],
      front: extended
        ? ['piston_inner', ...pistonTop]
        : pistonTop,
      back: ['piston_bottom', 'piston_bottom_normal'],
    };
  }

  if (id === 'dispenser' || id === 'dropper') {
    const vertical = facingState(states) === 'up' || facingState(states) === 'down';
    return {
      side: [`${id}_side`, 'furnace_side'],
      top: [`${id}_side`, 'furnace_top'],
      bottom: [`${id}_side`, 'furnace_top'],
      front: vertical
        ? [`${id}_front_vertical`, `${id}_front`]
        : [`${id}_front`, `${id}_front_horizontal`],
      back: [`${id}_side`, 'furnace_side'],
    };
  }

  if (id === 'observer') {
    const powered = boolState(states, 'powered', 'powered_bit');
    return {
      side: ['observer_side'],
      top: ['observer_top'],
      bottom: ['observer_top'],
      front: ['observer_front'],
      back: powered
        ? ['observer_back_on', 'observer_back_lit', 'observer_back']
        : ['observer_back'],
    };
  }

  if (/^(unpowered_|powered_)?repeater$/.test(id)) {
    const powered = id.startsWith('powered_') || boolState(states, 'powered');
    return {
      side: ['smooth_stone_slab_side', 'smooth_stone'],
      // Java: repeater.png(消灯)/repeater_on.png — Bedrock: repeater_off.png/repeater_on.png
      top: powered ? ['repeater_on'] : ['repeater', 'repeater_off'],
      baseTop: ['smooth_stone', 'smooth_stone_slab_top', 'smooth_stone_slab_side'],
      bottom: ['smooth_stone', 'smooth_stone_slab_side'],
      front: ['smooth_stone_slab_side', 'smooth_stone'],
      back: ['smooth_stone_slab_side', 'smooth_stone'],
      marker: [powered ? 'redstone_torch' : 'redstone_torch_off', 'redstone_torch'],
    };
  }

  if (/^(unpowered_|powered_)?comparator$/.test(id)) {
    const powered = id.startsWith('powered_')
      || boolState(states, 'powered', 'output_lit_bit');
    return {
      side: ['smooth_stone_slab_side', 'smooth_stone'],
      // Java: comparator.png(消灯)/comparator_on.png — Bedrock: comparator_off.png/comparator_on.png
      top: powered ? ['comparator_on'] : ['comparator', 'comparator_off'],
      baseTop: ['smooth_stone', 'smooth_stone_slab_top', 'smooth_stone_slab_side'],
      bottom: ['smooth_stone', 'smooth_stone_slab_side'],
      front: ['smooth_stone_slab_side', 'smooth_stone'],
      back: ['smooth_stone_slab_side', 'smooth_stone'],
      marker: [powered ? 'redstone_torch' : 'redstone_torch_off', 'redstone_torch'],
    };
  }

  if (id === 'redstone_lamp' || id === 'lit_redstone_lamp') {
    const lit = id === 'lit_redstone_lamp' || boolState(states, 'lit', 'powered');
    const names = lit
      ? ['redstone_lamp_on', 'redstone_lamp_lit', 'redstone_lamp']
      : ['redstone_lamp'];
    return {
      side: names, top: names, bottom: names, front: names, back: names,
    };
  }

  return null;
}
