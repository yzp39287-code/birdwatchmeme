// HUD 更新
export class UI {
  constructor() {
    this.score = document.getElementById('score');
    this.level = document.getElementById('level');
    this.fill = document.getElementById('stamina-fill');
    this.overlay = document.getElementById('overlay');
    this.btn = document.getElementById('start-btn');
    this.flashEl = document.getElementById('buff-msg');
    this._flashTimer = 0;
  }

  // 升级提示短暂显示
  flash(msg) {
    if (!this.flashEl) return;
    this.flashEl.textContent = msg;
    this.flashEl.classList.add('show');
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => this.flashEl.classList.remove('show'), 2500);
  }

  update(score, level, stamina, max) {
    this.score.textContent = score;
    this.level.textContent = level;
    const pct = Math.max(0, stamina / max * 100);
    this.fill.style.width = pct + '%';
    this.fill.style.background = pct < 25 ? '#e06b5d' : '#7ee081';
  }

  showOverlay(show) { this.overlay.classList.toggle('hidden', !show); }

  onLock(fn) {
    this.btn.addEventListener('click', () => fn());
    // 指针解锁（Esc）时重新显示遮罩
    document.addEventListener('pointerlockchange', () => {
      this.showOverlay(document.pointerLockElement !== document.body);
    });
  }
}
