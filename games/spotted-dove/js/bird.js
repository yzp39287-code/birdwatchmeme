import * as THREE from 'three';

// 山斑鸠 LowPoly 模型：几何分组 + 色块材质（无贴图）
// 特征：灰头 · 颈侧黑白条纹斑块 · 暖棕躯体 · 浅米棕腹部 · 扇贝鳞纹翅膀 · 白尖长尾
export class Bird {
  constructor() {
    this.group = new THREE.Group();

    const mat = {
      head:    this._mat(0xa8a6a0),  // 灰头
      body:    this._mat(0xbe9068),  // 暖棕褐躯体
      belly:   this._mat(0xe6d2b0),  // 浅米棕腹部
      wing:    new THREE.MeshLambertMaterial({ color: 0xb08a62, side: THREE.DoubleSide }),
      cream:   this._mat(0xecd9b8),  // 鳞纹浅色
      brown:   this._mat(0x8a6a52),  // 鳞纹深色
      feather: this._mat(0x69584c),  // 深色飞羽
      tail:    new THREE.MeshLambertMaterial({ color: 0x5f4d42, side: THREE.DoubleSide }),
      tailTip: new THREE.MeshLambertMaterial({ color: 0xf1e9d6, side: THREE.DoubleSide }),
      black:   this._mat(0x26221e),  // 颈侧黑斑
      white:   this._mat(0xf2efe4),  // 颈斑白纹
      beak:    this._mat(0x7d8288),
      leg:     this._mat(0xb08274),
      eyeRing: this._mat(0x9c3b2a),  // 暗红眼圈
      eye:     this._mat(0x1c1814),
    };

    this._buildBody(mat);
    this._buildHead(mat);
    this._buildWings(mat);
    this._buildTail(mat);
    this._buildLegs(mat);

    this.flapPhase = 0;
  }

  _mat(color) {
    return new THREE.MeshLambertMaterial({ color, flatShading: true });
  }

  // 躯干：粗壮暖棕低模椭圆 + 浅米棕色腹部色块
  _buildBody(mat) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat.body);
    body.scale.set(1, 0.95, 1.55);
    body.position.z = -0.08;
    body.castShadow = true;
    this.group.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 6), mat.belly);
    belly.scale.set(0.94, 0.82, 1.3);
    belly.position.set(0, -0.16, 0.14);
    this.group.add(belly);
  }

  // 灰头 + 喙 + 红圈眼 + 颈侧黑白条纹斑块
  _buildHead(mat) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 6), mat.head);
    head.position.set(0, 0.34, 0.68);
    head.castShadow = true;
    this.group.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.3, 5), mat.beak);
    beak.rotation.x = Math.PI / 2 + 0.12;
    beak.position.set(0, 0.3, 0.98);
    this.group.add(beak);

    for (const side of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 5, 10), mat.eyeRing);
      ring.rotation.y = side * Math.PI / 2;
      ring.position.set(side * 0.26, 0.4, 0.82);
      this.group.add(ring);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), mat.eye);
      eye.position.set(side * 0.28, 0.4, 0.83);
      this.group.add(eye);

      // 颈侧黑斑 + 三道白纹（山斑鸠特征）
      const patch = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 5), mat.black);
      patch.scale.set(0.045, 0.15, 0.18);
      patch.position.set(side * 0.26, 0.22, 0.6);
      this.group.add(patch);
      for (let i = 0; i < 3; i++) {
        const st = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 4), mat.white);
        st.scale.set(0.025, 0.028, 0.16);
        st.position.set(side * 0.285, 0.14 + i * 0.07, 0.6);
        this.group.add(st);
      }
    }
  }

  // 左右翅膀：独立 pivot，可绕肩部扇动
  _buildWings(mat) {
    this.wings = [];
    const scallop = new THREE.SphereGeometry(0.085, 6, 4);
    scallop.scale(1, 0.3, 0.72); // 扁平扇贝壳状鳞片
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.3, 0.3, 0.1);
      const wing = this._buildWingMesh(mat, scallop);
      if (side === -1) wing.scale.x = -1; // 左翼镜像
      pivot.add(wing);
      this.group.add(pivot);
      this.wings.push({ pivot, side });
    }
  }

  // 单侧翅膀：暖棕翼面 + 扇贝鳞纹 + 后缘深色飞羽
  _buildWingMesh(mat, scallop) {
    const wing = new THREE.Group();

    const s = new THREE.Shape();
    s.moveTo(0, 0.26);
    s.lineTo(0.9, 0.24);
    s.lineTo(1.45, 0.0);
    s.lineTo(0.95, -0.4);
    s.lineTo(0.15, -0.34);
    s.closePath();
    const panelGeo = new THREE.ShapeGeometry(s);
    panelGeo.rotateX(-Math.PI / 2);
    const panel = new THREE.Mesh(panelGeo, mat.wing);
    panel.castShadow = true;
    wing.add(panel);

    // 扇贝状鳞纹：交错排列的奶油/棕色鳞片
    let row = 0;
    for (let x = 0.25; x <= 1.1; x += 0.28, row++) {
      let col = 0;
      for (let z = -0.28; z <= 0.2; z += 0.17, col++) {
        const sc = new THREE.Mesh(scallop, (row + col) % 2 ? mat.cream : mat.brown);
        sc.position.set(x, 0.03, z + (row % 2 ? 0.08 : -0.08));
        wing.add(sc);
      }
    }

    // 飞羽：4 片深色羽片沿后缘向后展开
    const featherGeo = new THREE.BoxGeometry(0.8, 0.018, 0.15);
    featherGeo.translate(0.4, 0, 0);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(featherGeo, mat.feather);
      f.position.set(0.4 + i * 0.22, 0.012 + i * 0.006, -0.3 - i * 0.01);
      f.rotation.y = 0.12 + i * 0.26;
      wing.add(f);
    }
    return wing;
  }

  // 长尾：深棕主羽 + 白色尾端边缘
  _buildTail(mat) {
    const tail = new THREE.Group();
    tail.position.set(0, 0.1, -0.7);
    tail.rotation.x = -0.08; // 尾尖略下垂

    const s = new THREE.Shape();
    s.moveTo(0, 0.22);
    s.lineTo(0.7, 0.28);
    s.lineTo(1.05, 0.16);
    s.lineTo(1.12, 0);
    s.lineTo(1.05, -0.16);
    s.lineTo(0.7, -0.28);
    s.lineTo(0, -0.22);
    s.closePath();
    const g = new THREE.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    g.rotateY(Math.PI / 2);
    const main = new THREE.Mesh(g, mat.tail);
    main.castShadow = true;
    tail.add(main);

    const t = new THREE.Shape();
    t.moveTo(0.92, 0.17);
    t.lineTo(1.05, 0.16);
    t.lineTo(1.12, 0);
    t.lineTo(1.05, -0.16);
    t.lineTo(0.92, -0.17);
    t.closePath();
    const g2 = new THREE.ShapeGeometry(t);
    g2.rotateX(-Math.PI / 2);
    g2.rotateY(Math.PI / 2);
    const tip = new THREE.Mesh(g2, mat.tailTip);
    tip.position.y = 0.004; // 抬高避免与主羽共面闪烁
    tail.add(tip);

    this.group.add(tail);
  }

  // 粉灰色短腿（落地时可见）
  _buildLegs(mat) {
    const legGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.3, 5);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, mat.leg);
      leg.position.set(side * 0.15, -0.42, 0.15);
      this.group.add(leg);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), mat.leg);
      foot.scale.set(1, 0.5, 1.6);
      foot.position.set(side * 0.15, -0.55, 0.2);
      this.group.add(foot);
    }
  }

  // 扇翅动画：飞行持续扇动，加速更快；落地收拢静止
  update(dt, { boosting = false, flying = false, landed = false } = {}) {
    if (landed) {
      for (const w of this.wings) {
        w.pivot.rotation.z = THREE.MathUtils.lerp(w.pivot.rotation.z, w.side * 0.15, 1 - Math.exp(-8 * dt));
      }
      return;
    }
    const speed = boosting ? 20 : flying ? 9 : 4;
    const amp = boosting ? 1.0 : flying ? 0.7 : 0.35;
    this.flapPhase += dt * speed;
    const a = Math.sin(this.flapPhase) * amp;
    for (const w of this.wings) w.pivot.rotation.z = -w.side * a;
  }
}
