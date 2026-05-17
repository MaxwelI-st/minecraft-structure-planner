/**
 * BlockInstancingManager.js
 * THREE.InstancedMesh を用いたマイクラのブロック描画マネージャー
 * 形状や隣接状態をシグネチャ（sig）としてグループ化し、
 * 動的な描画数（count）変更に対応させることでパフォーマンスを最大化する。
 */
export class BlockInstancingManager {
  /**
   * @param {THREE.Scene} scene - 描画対象のシーン
   * @param {Object} THREE - window.THREE への参照
   */
  constructor(scene, THREE) {
    this.scene = scene;
    this.THREE = THREE;
    
    // sig をキーとして、InstancedMesh と管理データを保持するMap
    // value: { mesh, capacity, count }
    this.instancedMeshes = new Map(); 
    
    // 行列計算用のダミーオブジェクト
    this.dummy = new this.THREE.Object3D(); 
  }

  /**
   * シグネチャに対するブロックタイプ（マテリアル・形状）を登録する
   * すでに十分な容量のメッシュが存在する場合はスキップ（再利用）する
   * 
   * @param {string} sig - 形状シグネチャ (例: "stone|n0s0w0e0")
   * @param {THREE.BufferGeometry} geometry 
   * @param {THREE.Material|THREE.Material[]} material 
   * @param {string} blockId - メタデータ用
   * @param {number} requiredInstances - 今回必要な配置数
   */
  registerBlockType(sig, geometry, material, blockId, requiredInstances) {
    const data = this.instancedMeshes.get(sig);
    
    // すでに存在し、容量も十分な場合は再利用
    if (data && data.capacity >= requiredInstances) {
      // 念のためマテリアルとジオメトリは最新にする
      data.mesh.geometry = geometry;
      data.mesh.material = material;
      return;
    }

    // 容量が足りない、または新規作成の場合
    const currentCapacity = data ? data.capacity : 0;
    // 新しい容量は「要求数」または「既存の2倍」の大きい方（ただし最低100）
    const newCapacity = Math.max(requiredInstances, currentCapacity * 2, 100);

    const mesh = new this.THREE.InstancedMesh(geometry, material, newCapacity);
    mesh.instanceMatrix.setUsage(this.THREE.DynamicDrawUsage);

    // three.js の `setColorAt` は `mesh.count * 3` でバッファを生成するため、
    // 先に `mesh.count = 0` してしまうと長さ 0 のバッファが作られて以降の
    // 色設定がすべて無効になる。容量分の Float32Array を初期化色 (白) で
    // 事前確保しておくことで、ハイライト/アニメーション色設定を有効にする。
    const colorArr = new Float32Array(newCapacity * 3);
    colorArr.fill(1);  // default normalColor = white
    mesh.instanceColor = new this.THREE.InstancedBufferAttribute(colorArr, 3);
    mesh.instanceColor.setUsage(this.THREE.DynamicDrawUsage);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = 0;
    
    // userDataにblockIdとシグネチャを保持（ハイライト処理等で使用）
    mesh.userData = { blockId, sig, instanceCoords: [] };

    if (data) {
        // 容量不足で再作成する場合は、古いメッシュをシーンから削除しメモリ解放
        this.scene.remove(data.mesh);
        if (data.mesh.dispose) data.mesh.dispose();
    }
    
    this.scene.add(mesh);
    this.instancedMeshes.set(sig, { mesh, count: 0, capacity: newCapacity });
  }

  /**
   * 毎回のロード/スライス更新前に、すべての描画数を0にリセットする
   * メモリの再割り当ては行わず、ポインタだけ戻す
   */
  clearInstances() {
    for (const data of this.instancedMeshes.values()) {
      data.count = 0;
      data.mesh.count = 0; 
      data.mesh.userData.instanceCoords = []; // 座標リストもクリア
    }
  }

  /**
   * ブロックを1つ配置（座標・色・メタデータの登録）
   */
  addBlockInstance(sig, coord, isHighlighted, normalColor, hlColor) {
    const data = this.instancedMeshes.get(sig);
    if (!data) return; // 事前登録されていない場合はスキップ

    if (data.count >= data.capacity) {
      console.warn(`[BlockInstancingManager] シグネチャ ${sig} の最大配置数(${data.capacity})を超えました。`);
      return;
    }

    // 行列をセット
    this.dummy.position.set(coord.x, coord.y, coord.z);
    this.dummy.updateMatrix();
    data.mesh.setMatrixAt(data.count, this.dummy.matrix);
    
    // 色をセット — three.js は初回 setColorAt 呼び出しで instanceColor
    // バッファを遅延生成するので、未初期化チェックでスキップしてはいけない
    // (スキップすると instanceColor が永久に null のままになり、後段の
    // ハイライト処理 (setHighlightBlocks / _animate) が無効化される)
    data.mesh.setColorAt(data.count, isHighlighted ? hlColor : normalColor);

    // userData に座標を追加（クリック判定・マルチハイライト用）
    data.mesh.userData.instanceCoords.push(coord);

    data.count++;
  }

  /**
   * すべてのブロック配置が終わった後に呼び出し、GPUに変更を通知する
   */
  updateAll() {
    for (const data of this.instancedMeshes.values()) {
      if (data.count > 0) {
        data.mesh.count = data.count; // 実際の描画数を決定
        data.mesh.instanceMatrix.needsUpdate = true;
        if (data.mesh.instanceColor) {
          data.mesh.instanceColor.needsUpdate = true;
        }
      } else {
        data.mesh.count = 0; // 描画しない
      }
    }
  }

  /**
   * マネージャーが保持するすべての InstancedMesh を配列で返す
   * （既存の this.meshes と互換性を持たせるため）
   */
  getMeshes() {
    const meshes = [];
    for (const data of this.instancedMeshes.values()) {
      meshes.push(data.mesh);
    }
    return meshes;
  }

  /**
   * テクスチャパック変更時や、別プロジェクト読み込み時にメモリを完全に解放する
   */
  disposeAll() {
    for (const data of this.instancedMeshes.values()) {
      this.scene.remove(data.mesh);
      if (data.mesh.geometry) data.mesh.geometry.dispose();
      if (data.mesh.material) {
        if (Array.isArray(data.mesh.material)) {
          data.mesh.material.forEach(m => m.dispose());
        } else {
          data.mesh.material.dispose();
        }
      }
      if (data.mesh.dispose) data.mesh.dispose();
    }
    this.instancedMeshes.clear();
  }
}
