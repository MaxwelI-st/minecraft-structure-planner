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
   * ブロックを1つ配置（座標・色・メタデータ・回転の登録）
   *
   * @param {string} sig
   * @param {{x:number,y:number,z:number}} coord
   * @param {boolean} isHighlighted
   * @param {THREE.Color} normalColor
   * @param {THREE.Color} hlColor
   * @param {Object|null} [visualHints] 描画用 hints — facing/face を読んで per-instance 回転を適用
   *                                    (詳細: js/modules/logic/bedrock_visual_state.js)
   */
  addBlockInstance(sig, coord, isHighlighted, normalColor, hlColor, visualHints = null) {
    const data = this.instancedMeshes.get(sig);
    if (!data) return; // 事前登録されていない場合はスキップ

    if (data.count >= data.capacity) {
      console.warn(`[BlockInstancingManager] シグネチャ ${sig} の最大配置数(${data.capacity})を超えました。`);
      return;
    }

    // 行列をセット — 位置 + visualHints から回転を適用
    this.dummy.position.set(coord.x, coord.y, coord.z);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.scale.set(1, 1, 1);
    if (visualHints) {
      _applyFacingRotation(this.dummy, visualHints);
    }
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
   * シグネチャに登録された Three.InstancedMesh が存在するか確認するヘルパー
   * @param {string} sig
   * @returns {boolean}
   */
  hasSig(sig) {
    return this.instancedMeshes.has(sig);
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

// ─────────────────────────────────────────────────────────────────────────────
// 内部ヘルパー: visualHints → dummy への rotation 適用
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Visual Hints (facing / face) から Three.Object3D の回転を設定する。
 *
 * 規約:
 *   ジオメトリは「facing=north (北向き), face=floor (床立て)」を基準形で生成されている。
 *   このヘルパーは hints に応じて Y/X/Z 軸の回転を適用する。
 *
 *   facing 一覧 (Y軸回転):
 *     north  ->  0
 *     east   -> -π/2
 *     south  ->  π
 *     west   -> +π/2
 *
 *   facing=up / down (X軸回転 ±π/2)
 *   face=ceiling: 上下反転 (Z軸 π回転) + facing
 *   face=wall   : Z軸 +π/2 回転 + facing
 *
 * @param {Object} dummy - Three.Object3D
 * @param {Object} hints - visualHints
 */
function _applyFacingRotation(dummy, hints) {
  const facing = hints.facing;
  const face   = hints.face;
  const PI     = Math.PI;
  const PI2    = PI / 2;

  // 1) Y 軸回転 (facing が water-level 4 方向の場合)
  // 注: blockshapes.js の方向性ブロック (piston/observer/dispenser/repeater/comparator) は
  //     基準形 facing=south (出力/正面が +Z 側) で実装されているため、yaw=0 は south に対応する。
  //     Three.js の Y 軸回転は反時計回り正 (上から見て): +PI/2 で +Z (south) → +X (east)
  const yawByFacing = {
    south: 0,        // 基準形 (出力 +Z)
    east:  PI2,      // +90° (south → east)
    north: PI,       // 180° (south → north)
    west:  -PI2,     // -90° (south → west)
  };

  if (face === 'wall' && facing && yawByFacing[facing] !== undefined) {
    // 壁設置: Z軸 π/2 回転で base を立てる + facing で Y 回転
    dummy.rotation.set(0, yawByFacing[facing], PI2);
    return;
  }

  if (face === 'ceiling') {
    // 天井設置: 上下反転 + facing
    const yaw = facing && yawByFacing[facing] !== undefined ? yawByFacing[facing] : 0;
    dummy.rotation.set(PI, yaw, 0);
    return;
  }

  if (facing === 'up') {
    dummy.rotation.set(-PI2, 0, 0);
    return;
  }
  if (facing === 'down') {
    dummy.rotation.set(PI2, 0, 0);
    return;
  }
  if (facing && yawByFacing[facing] !== undefined) {
    dummy.rotation.set(0, yawByFacing[facing], 0);
    return;
  }

  // 該当無し → デフォルト (回転なし)
  dummy.rotation.set(0, 0, 0);
}
