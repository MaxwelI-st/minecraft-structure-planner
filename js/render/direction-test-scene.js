/**
 * Synthetic scene for visually checking every directional block family.
 * Open with ?dirtest=1 or run window.__dirTest() from the console.
 */
import { Viewer3D } from './viewer3d.js';

const block = (x, y, z, blockId, states = {}) => ({ x, y: y + 1, z, blockId, states });
const horizontal = ['north', 'east', 'south', 'west'];

function row(output, z, blockId, variants) {
  variants.forEach((states, index) => output.push(block(index * 2, 0, z, blockId, states)));
}

export function generateDirectionTestScene() {
  const output = [];
  let z = 0;
  const next = () => (z += 3, z - 3);

  row(output, next(), 'minecraft:repeater', [
    ...horizontal.map(direction => ({ 'minecraft:cardinal_direction': direction, repeater_delay: 0 })),
    { 'minecraft:cardinal_direction': 'north', repeater_delay: 3 },
    ...[0, 1, 2, 3].map(direction => ({ direction, repeater_delay: 0 })),
  ]);
  row(output, next(), 'minecraft:comparator', [
    ...horizontal.map(direction => ({ 'minecraft:cardinal_direction': direction })),
    { 'minecraft:cardinal_direction': 'north', output_subtract_bit: 1 },
  ]);
  for (const id of ['piston', 'observer', 'dispenser']) {
    row(output, next(), `minecraft:${id}`, [0, 1, 2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  }
  row(output, next(), 'minecraft:hopper', [0, 2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  row(output, next(), 'minecraft:redstone_torch',
    ['top', 'north', 'south', 'east', 'west'].map(torch_facing_direction => ({ torch_facing_direction })));
  row(output, next(), 'minecraft:lever',
    ['up_north_south', 'down_east_west', 'north', 'south', 'east', 'west']
      .map(lever_direction => ({ lever_direction })));
  row(output, next(), 'minecraft:stone_button', [0, 1, 2, 3, 4, 5].map(facing_direction => ({ facing_direction })));

  row(output, next(), 'minecraft:oak_stairs', [
    ...[0, 1, 2, 3].map(weirdo_direction => ({ weirdo_direction })),
    { weirdo_direction: 0, upside_down_bit: 1 },
  ]);
  row(output, next(), 'minecraft:oak_trapdoor', [
    ...[0, 1, 2, 3].map(direction => ({ direction, open_bit: 1 })),
    { direction: 0, open_bit: 0 },
    { direction: 0, open_bit: 0, upside_down_bit: 1 },
  ]);
  row(output, next(), 'minecraft:wooden_door', [
    ...[0, 1, 2, 3].map(direction => ({ direction })),
    { direction: 0, open_bit: 1 },
    { direction: 0, open_bit: 1, door_hinge_bit: 1 },
  ]);
  row(output, next(), 'minecraft:oak_fence_gate', [
    ...[0, 1, 2, 3].map(direction => ({ direction })),
    { direction: 0, open_bit: 1 },
  ]);
  for (const id of ['ladder', 'darkoak_wall_sign']) {
    row(output, next(), `minecraft:${id}`, [2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  }
  row(output, next(), 'minecraft:anvil', [0, 1, 2, 3].map(direction => ({ direction })));
  row(output, next(), 'minecraft:campfire', [0, 1, 2, 3].map(direction => ({ direction })));
  row(output, next(), 'minecraft:end_rod', [0, 1, 2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  row(output, next(), 'minecraft:chain', ['x', 'y', 'z'].map(pillar_axis => ({ pillar_axis })));
  row(output, next(), 'minecraft:frame', [0, 1, 2, 3, 4, 5].map(facing_direction => ({ facing_direction })));

  row(output, next(), 'minecraft:oak_stairs', [
    ...horizontal.map(facing => ({ facing, half: 'bottom', shape: 'straight' })),
    { facing: 'north', half: 'bottom', shape: 'inner_left' },
    { facing: 'north', half: 'bottom', shape: 'outer_right' },
  ]);
  row(output, next(), 'minecraft:oak_door', [
    ...horizontal.map(facing => ({ facing, half: 'lower', open: 'false', hinge: 'left' })),
    { facing: 'north', half: 'lower', open: 'true', hinge: 'right' },
  ]);
  row(output, next(), 'minecraft:furnace', [2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  row(output, next(), 'minecraft:chest', [2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  row(output, next(), 'minecraft:barrel', [0, 1, 2, 3, 4, 5].map(facing_direction => ({ facing_direction })));
  row(output, next(), 'minecraft:oak_log', ['x', 'y', 'z'].map(pillar_axis => ({ pillar_axis })));

  const maxX = Math.max(...output.map(item => item.x)) + 2;
  const maxZ = z + 1;
  for (let x = -2; x <= maxX; x++) {
    for (let floorZ = -2; floorZ <= maxZ; floorZ++) {
      output.push({ x, y: 0, z: floorZ, blockId: 'minecraft:smooth_stone', states: {} });
    }
    output.push({ x, y: 1, z: -2, blockId: 'minecraft:blue_wool', states: {} });
    output.push({ x, y: 1, z: maxZ, blockId: 'minecraft:red_wool', states: {} });
  }
  for (let markerZ = -2; markerZ <= maxZ; markerZ++) {
    output.push({ x: maxX, y: 1, z: markerZ, blockId: 'minecraft:yellow_wool', states: {} });
    output.push({ x: -2, y: 1, z: markerZ, blockId: 'minecraft:lime_wool', states: {} });
  }

  return {
    coords: output.map(item => ({ ...item, x: item.x + 2, z: item.z + 2 })),
    size: { x: maxX + 3, y: 4, z: maxZ + 3 },
  };
}

export function installDirectionTest(app) {
  const run = async () => {
    if (app.currentTab !== 'viewer3d' && document.querySelector('[data-tab="viewer3d"]')) {
      document.querySelector('[data-tab="viewer3d"]')?.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    let viewer = app.viewer3d;
    if (!viewer) {
      let container = document.getElementById('dirtest-viewer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'dirtest-viewer';
        Object.assign(container.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '10000',
          background: '#111',
        });
        document.body.appendChild(container);
      }
      viewer = new Viewer3D(container);
      app.viewer3d = viewer;
    }
    if (!viewer.isInitialized) await viewer.init();
    const { coords, size } = generateDirectionTestScene();
    viewer.loadStructure(coords, size, { autoFocus: true, forceReload: true });
    console.info('[dirtest] north=blue, south=red, east=yellow, west=lime');
  };

  window.__dirTest = run;
  if (new URLSearchParams(location.search).has('dirtest')) setTimeout(run, 800);
}
