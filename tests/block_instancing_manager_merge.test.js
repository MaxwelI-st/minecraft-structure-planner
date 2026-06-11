import { describe, it, expect } from 'vitest';
import { BlockInstancingManager } from '../js/render/BlockInstancingManager.js';

class FakePosition {
  constructor() { this.x = 0; this.y = 0; this.z = 0; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; }
}

class FakeMesh {
  constructor(geometry, material, capacity) {
    this.geometry = geometry;
    this.material = material;
    this.capacity = capacity;
    this.position = new FakePosition();
    this.userData = {};
    this.count = 0;
    this.instanceMatrix = { setUsage() {}, needsUpdate: false };
  }
  updateMatrixWorld() {}
}

class FakeObject3D {
  constructor() {
    this.position = new FakePosition();
    this.scale = new FakePosition();
    this.rotation = { order: 'XYZ', set() {} };
    this.matrix = {};
  }
  updateMatrix() {}
}

class FakeAttribute {
  constructor() {}
  setUsage() {}
}

const THREE = {
  Object3D: FakeObject3D,
  InstancedMesh: FakeMesh,
  InstancedBufferAttribute: FakeAttribute,
  DynamicDrawUsage: 1,
};

describe('BlockInstancingManager merge preview', () => {
  it('moves only meshes belonging to the selected structure', () => {
    const scene = { add() {}, remove() {} };
    const manager = new BlockInstancingManager(scene, THREE);
    manager.registerBlockType('a', {}, {}, 'minecraft:stone', 1, 'structure-a');
    manager.registerBlockType('b', {}, {}, 'minecraft:stone', 1, 'structure-b');

    manager.translateStructure('structure-a', 'x', 3);

    expect(manager.instancedMeshes.get('a').mesh.position.x).toBe(3);
    expect(manager.instancedMeshes.get('b').mesh.position.x).toBe(0);
  });

  it('resets preview translations before rebuilding instances', () => {
    const scene = { add() {}, remove() {} };
    const manager = new BlockInstancingManager(scene, THREE);
    manager.registerBlockType('a', {}, {}, 'minecraft:stone', 1, 'structure-a');
    manager.translateStructure('structure-a', 'z', -4);

    manager.clearInstances();

    expect(manager.instancedMeshes.get('a').mesh.position.z).toBe(0);
  });
});
