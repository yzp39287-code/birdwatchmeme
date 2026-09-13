import * as THREE from 'three';
import { CONFIG } from './config.js?v=20260913c';
import { Bird } from './bird.js?v=20260913c';
import { World } from './world.js?v=20260913c';
import { BerryManager } from './berries.js?v=20260913c';
import { Leaves } from './leaves.js?v=20260913c';
import { UI } from './ui.js?v=20260913c';

// ---------- 基础渲染 ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 140);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);

// ---------- 光照：柔和自然光 + 太阳方向光（带阴影） ----------
scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x6a8a5a, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
sun.position.set(40, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
scene.add(sun);

// ---------- 游戏对象 ----------
const world = new World(scene);
const berries = new BerryManager(scene, world);
const bird = new Bird();
scene.add(bird.group);
const leaves = new Leaves(scene); // 轻量落叶氛围粒子

// ---------- 游戏状态 ----------
const state = {
  score: 0, level: 1,
  stamina: CONFIG.bird.staminaMax,
  staminaMax: CONFIG.bird.staminaMax,
  speedBonus: 0, // 升级获得的飞行速度加成
  yaw: 0, pitch: -0.15,
  vel: new THREE.Vector3(),
  landed: false,
};
const keys = {};
let gameActive = true;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyR') resetGame(); // R 键重置游戏
});
addEventListener('keyup', e => keys[e.code] = false);

// 重置：积分清零、等级回 1、耐力回满、浆果重生成、斑鸠回出生点
function resetGame() {
  state.score = 0;
  state.level = 1;
  state.staminaMax = CONFIG.bird.staminaMax;
  state.stamina = state.staminaMax;
  state.speedBonus = 0;
  state.yaw = 0;
  state.pitch = -0.15;
  state.vel.set(0, 0, 0);
  bird.group.position.set(0, 0.55, 0);
  bird.group.rotation.set(0, 0, 0);
  berries.reset();
}

const ui = new UI();
ui.onLock(() => {
  if (!gameActive) {
    resetGame();
    gameActive = true;
  }
  document.body.requestPointerLock();
});
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== document.body) return;
  state.yaw -= e.movementX * CONFIG.bird.turnSpeed;
  state.pitch = THREE.MathUtils.clamp(state.pitch - e.movementY * CONFIG.bird.turnSpeed, -1.2, 1.2);
});

// ---------- 主循环 ----------
const clock = new THREE.Clock();
const BIRD_R = 0.6; // 斑鸠碰撞半径

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const pos = bird.group.position;

  // 死亡后保持当前画面，不再更新移动、拾取或恢复耐力。
  if (!gameActive) {
    renderer.render(scene, camera);
    return;
  }

  // 飞行方向：WASD 相对相机朝向，S 反向，A/D 侧移
  const fwd = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const dir = new THREE.Vector3();
  if (keys['KeyW']) dir.add(fwd);
  if (keys['KeyS']) dir.sub(fwd);
  if (keys['KeyD']) dir.add(right);
  if (keys['KeyA']) dir.sub(right);
  const moving = dir.lengthSq() > 0;
  if (moving) dir.normalize();

  // 耐力：持续飞行消耗，加速消耗更快；耗尽后本局立即结束并重置。
  const wantBoost = keys['Space'] && moving && state.stamina > 0;
  if (moving) {
    state.stamina -= CONFIG.bird.staminaDrainFly * dt;
    if (wantBoost) state.stamina -= CONFIG.bird.staminaDrainBoost * dt;
  }
  if (state.stamina <= 0.5) {
    state.stamina = 0;
    state.vel.set(0, 0, 0);
    gameActive = false;
    Object.keys(keys).forEach(code => { keys[code] = false; });
    ui.update(state.score, state.level, 0, state.staminaMax);
    ui.gameOver();
    if (document.pointerLockElement) document.exitPointerLock();
    return;
  }
  const speed = CONFIG.bird.baseSpeed + state.speedBonus;

  // 垂直运动：鼠标俯仰决定升降（飞行感）
  if (moving) {
    const v = dir.clone().multiplyScalar(speed * (wantBoost ? CONFIG.bird.boostMult : 1));
    v.y = -Math.sin(state.pitch) * speed * (wantBoost ? CONFIG.bird.boostMult : 0.8);
    state.vel.lerp(v, 1 - Math.exp(-6 * dt)); // 平滑转向
  } else {
    state.vel.multiplyScalar(Math.exp(-2 * dt)); // 缓慢滑行减速
  }

  pos.addScaledVector(state.vel, dt);

  // 树干碰撞：被推出则按推出方向反弹并减速
  const before = pos.clone();
  world.resolveCollision(pos, BIRD_R);
  const pushed = pos.clone().sub(before);
  if (pushed.lengthSq() > 0.0001) {
    pushed.normalize();
    state.vel.addScaledVector(pushed, state.vel.length() * 0.6);
    state.vel.multiplyScalar(0.45);
  }

  // 高度限制：不穿地、不飞太高
  if (pos.y < 0.55) { pos.y = 0.55; state.vel.y = Math.max(0, state.vel.y); }
  if (pos.y > 30) { pos.y = 30; state.vel.y = Math.min(0, state.vel.y); }

  // 落地判定：停在地面（低且速度小）或贴近树枝 → 恢复耐力
  const nearBranch = world.branchSpots.some(s => pos.distanceTo(s) < 1.2) && state.vel.length() < 2;
  state.landed = (pos.y <= 0.6 && state.vel.length() < 2) || nearBranch;
  // 树枝休息恢复明显快于地面
  if (nearBranch) {
    state.stamina = Math.min(state.staminaMax, state.stamina + CONFIG.bird.staminaRegenBranch * dt);
  } else if (state.landed) {
    state.stamina = Math.min(state.staminaMax, state.stamina + CONFIG.bird.staminaRegen * dt);
  }
  state.stamina = Math.max(0, state.stamina);

  // 朝向：身体跟随水平速度方向，落地时朝向相机
  const faceDir = state.vel.lengthSq() > 1
    ? state.vel.clone().setY(0)
    : fwd.clone();
  if (faceDir.lengthSq() > 0.001) {
    const target = Math.atan2(faceDir.x, faceDir.z);
    bird.group.rotation.y = MathUtils_lerpAngle(bird.group.rotation.y, target, 1 - Math.exp(-8 * dt));
    bird.group.rotation.z = THREE.MathUtils.lerp(bird.group.rotation.z,
      -THREE.MathUtils.clamp(right.dot(state.vel) / 15, -0.5, 0.5), 0.1); // 转弯侧倾
  }

  // 翅膀扇动 & 浆果拾取
  bird.update(dt, { boosting: wantBoost, flying: moving, landed: state.landed });
  leaves.update(dt);
  const eaten = berries.update(dt, pos);
  if (eaten.red + eaten.gold > 0) {
    state.score += eaten.red * CONFIG.berry.score + eaten.gold * CONFIG.berry.goldScore;
    state.stamina = Math.min(state.staminaMax,
      state.stamina + eaten.red * CONFIG.berry.staminaGain + eaten.gold * CONFIG.berry.goldStaminaGain);
    // 升级：仅温和正向 buff（偶数级提速，奇数级加耐力上限）
    while (state.score >= state.level * CONFIG.berry.levelThreshold) {
      state.level++;
      if (state.level % 2 === 0) {
        state.speedBonus += CONFIG.bird.speedPerLevel;
        ui.flash(`升级 Lv${state.level}：飞行速度小幅提升`);
      } else {
        state.staminaMax += CONFIG.bird.staminaMaxPerLevel;
        state.stamina += CONFIG.bird.staminaMaxPerLevel;
        ui.flash(`升级 Lv${state.level}：耐力上限提升`);
      }
    }
  }

  // 相机第三人称跟随
  const camOffset = new THREE.Vector3(
    Math.sin(state.yaw) * Math.cos(state.pitch),
    -Math.sin(state.pitch) + 0.35,
    Math.cos(state.yaw) * Math.cos(state.pitch)
  ).multiplyScalar(6);
  camera.position.copy(pos).add(camOffset);
  camera.lookAt(pos.x, pos.y + 0.3, pos.z);

  ui.update(state.score, state.level, state.stamina, state.staminaMax);
  renderer.render(scene, camera);
}

function MathUtils_lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

tick();

// 调试钩子：自动化测试用
window.__game = { state, bird, berries, world, leaves, renderer, scene, camera };
