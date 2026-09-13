import * as THREE from 'three';
import { CONFIG } from './config.js';

// 轻量落叶：InstancedMesh 单次绘制，缓慢摇摆飘落，落地后回到高处循环
export class Leaves {
  constructor(scene) {
    const N = CONFIG.leaves.count;
    this.mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.16, 0.22),
      new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }),
      N
    );
    this.mesh.frustumCulled = false;
    const colors = [0x7a9a4e, 0x9a8a3e, 0xb0763a];
    const c = new THREE.Color();
    this.items = [];
    for (let i = 0; i < N; i++) {
      this.items.push(this._respawn(true));
      this.mesh.setColorAt(i, c.setHex(colors[i % colors.length]));
    }
    this.mesh.instanceColor.needsUpdate = true;
    scene.add(this.mesh);

    // 复用临时对象，避免每帧分配
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3(1, 1, 1);
  }

  _respawn(anyHeight) {
    return {
      x: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
      y: anyHeight ? 1 + Math.random() * 10 : 7 + Math.random() * 4,
      vy: 0.45 + Math.random() * 0.4,             // 缓慢下落
      sway: Math.random() * Math.PI * 2,           // 摇摆相位
      swaySpeed: 0.8 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.5,
    };
  }

  update(dt) {
    for (let i = 0; i < this.items.length; i++) {
      const l = this.items[i];
      l.y -= l.vy * dt;
      l.sway += l.swaySpeed * dt;
      l.rot += l.rotSpeed * dt;
      if (l.y < 0.05) Object.assign(l, this._respawn(false));
      this._e.set(l.rot, l.sway, 0);
      this._q.setFromEuler(this._e);
      this._p.set(l.x + Math.sin(l.sway) * 0.7, l.y, l.z + Math.cos(l.sway * 0.6) * 0.7);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
