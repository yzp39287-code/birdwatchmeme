import * as THREE from 'three';
import { CONFIG } from './config.js';

// 树林场景：地面、树（树干+树枝）、灌木；并导出碰撞信息
export class World {
  constructor(scene) {
    this.scene = scene;
    this.trunkColliders = [];   // {x, z, r} 圆柱碰撞体
    this.branchSpots = [];      // {pos} 浆果可生成的树枝位置
    this.bushSpots = [];        // 地面灌木位置

    this.buildGround();
    this.buildTrees();
    this.buildBushes();
  }

  buildGround() {
    const geo = new THREE.PlaneGeometry(CONFIG.world.size, CONFIG.world.size);
    const mat = new THREE.MeshLambertMaterial({ color: 0x5d9e4a });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.half = CONFIG.world.size / 2;
  }

  randomXZ(margin) {
    const h = this.half - margin;
    return [Math.random() * 2 * h - h, Math.random() * 2 * h - h];
  }

  buildTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6e4f2f });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a33 });
    const branchMat = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });

    for (let i = 0; i < CONFIG.world.treeCount; i++) {
      const [x, z] = this.randomXZ(8);
      const tree = new THREE.Group();
      const h = 6 + Math.random() * 4;       // 树干高度
      const r = 0.45 + Math.random() * 0.2;  // 树干半径

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 8), trunkMat);
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      tree.add(trunk);

      // 树冠
      const crown = new THREE.Mesh(new THREE.SphereGeometry(h * 0.32, 10, 8), leafMat);
      crown.position.y = h + h * 0.18;
      crown.scale.y = 1.2;
      crown.castShadow = true;
      tree.add(crown);

      // 2~3 根横向树枝，浆果挂在末端
      const nBranch = 2 + Math.floor(Math.random() * 2);
      for (let b = 0; b < nBranch; b++) {
        const len = 1.6 + Math.random() * 1.2;
        const y = h * (0.65 + Math.random() * 0.25);
        const ang = Math.random() * Math.PI * 2;
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, len, 6), branchMat);
        branch.rotation.z = Math.PI / 2 - 0.25; // 略上翘
        branch.rotation.y = -ang;
        branch.position.set(Math.cos(ang) * len / 2, y, Math.sin(ang) * len / 2);
        tree.add(branch);
        // 树枝末端世界坐标（浆果生成点，略微抬高）
        this.branchSpots.push(new THREE.Vector3(
          x + Math.cos(ang) * len, y + 0.25, z + Math.sin(ang) * len));
      }

      tree.position.set(x, 0, z);
      this.scene.add(tree);
      this.trunkColliders.push({ x, z, r: r + 0.15 });
    }
  }

  buildBushes() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x4e8f3c });
    for (let i = 0; i < CONFIG.world.bushCount; i++) {
      const [x, z] = this.randomXZ(6);
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.5, 8, 6), mat);
      bush.scale.y = 0.7;
      bush.position.set(x, 0.5, z);
      bush.castShadow = true;
      this.scene.add(bush);
      this.bushSpots.push(new THREE.Vector3(x, 0.9, z));
    }
  }

  // 简单圆形碰撞：返回修正后的位置（阻止穿透树干）
  resolveCollision(pos, birdRadius) {
    for (const c of this.trunkColliders) {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const dist = Math.hypot(dx, dz);
      const min = c.r + birdRadius;
      if (dist < min && dist > 0.0001) {
        pos.x = c.x + (dx / dist) * min;
        pos.z = c.z + (dz / dist) * min;
      }
    }
    // 世界边界
    pos.x = THREE.MathUtils.clamp(pos.x, -this.half + 2, this.half - 2);
    pos.z = THREE.MathUtils.clamp(pos.z, -this.half + 2, this.half - 2);
    return pos;
  }
}
