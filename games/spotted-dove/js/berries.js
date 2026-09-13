import * as THREE from 'three';
import { CONFIG } from './config.js';

// 浆果管理：红色普通浆果 + 少量金色浆果；被拾取后延迟自动重生（资源可再生）
export class BerryManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.berries = [];
    this.respawnQueue = []; // { t: 剩余秒数, golden }
    this.time = 0;

    this.geo = new THREE.SphereGeometry(CONFIG.berry.radius, 8, 6);
    this.goldGeo = new THREE.SphereGeometry(CONFIG.berry.radius, 8, 6);
    this.mat = new THREE.MeshLambertMaterial({ color: 0xd23b2e });
    // 金色使用不受场景阴影影响的材质，保持与红浆果同尺寸但确保肉眼可见。
    this.goldMat = new THREE.MeshBasicMaterial({ color: 0xffd51f });

    // 开局铺普通浆果 + 保底 1 颗金浆果
    for (let i = 0; i < CONFIG.berry.initialCount - 1; i++) this.spawn();
    this.spawn(true);
  }

  randomSpot() {
    const spots = Math.random() < 0.6 ? this.world.branchSpots : this.world.bushSpots;
    const s = spots[Math.floor(Math.random() * spots.length)];
    return new THREE.Vector3(s.x + (Math.random() - 0.5), s.y, s.z + (Math.random() - 0.5));
  }

  // 金浆果生成在中心区域的开阔低空，避免藏进树冠或灌木模型内部。
  randomGoldSpot() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 24;
    return new THREE.Vector3(Math.cos(angle) * distance, 0.55, Math.sin(angle) * distance);
  }

  _goldCount() {
    return this.berries.reduce((n, b) => n + (b.userData.golden ? 1 : 0), 0);
  }

  spawn(forceGold = false) {
    if (this.berries.length >= CONFIG.berry.maxCount) return;
    const golden = forceGold ||
      (Math.random() < CONFIG.berry.goldChance && this._goldCount() < CONFIG.berry.goldMax);
    const m = new THREE.Mesh(golden ? this.goldGeo : this.geo, golden ? this.goldMat : this.mat);
    m.userData.golden = golden;
    m.position.copy(golden ? this.randomGoldSpot() : this.randomSpot());
    // 记录实际生成高度；否则树枝上的金浆果会在下一帧被拉到地面附近。
    m.userData.baseY = m.position.y;
    m.castShadow = true;
    this.scene.add(m);
    this.berries.push(m);
  }

  // 返回本帧拾取数 { red, gold }
  update(dt, birdPos) {
    this.time += dt;
    // 被拾取浆果倒计时重生
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const q = this.respawnQueue[i];
      q.t -= dt;
      if (q.t <= 0) { this.spawn(q.golden); this.respawnQueue.splice(i, 1); }
    }
    let red = 0, gold = 0;
    const pickR = CONFIG.berry.radius + 0.8;
    for (let i = this.berries.length - 1; i >= 0; i--) {
      const b = this.berries[i];
      b.rotation.y += dt;
      // 金浆果上下浮动更醒目
      if (b.userData.golden) {
        b.position.y = b.userData.baseY + Math.sin(this.time * 3 + i) * 0.08;
      }
      if (b.position.distanceTo(birdPos) < pickR) {
        this.scene.remove(b);
        this.berries.splice(i, 1);
        this.respawnQueue.push({ t: CONFIG.berry.respawnDelay, golden: b.userData.golden });
        b.userData.golden ? gold++ : red++;
      }
    }
    return { red, gold };
  }

  // 重置：清空并重新随机生成
  reset() {
    for (const b of this.berries) this.scene.remove(b);
    this.berries.length = 0;
    this.respawnQueue.length = 0;
    for (let i = 0; i < CONFIG.berry.initialCount - 1; i++) this.spawn();
    this.spawn(true);
  }
}
