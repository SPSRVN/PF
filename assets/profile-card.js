const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180
};

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

class ProfileCardController {
  constructor(wrapElement, options = {}) {
    this.wrap = wrapElement;
    this.shell = wrapElement.querySelector('.pc-card-shell');
    this.options = {
      enableTilt: true,
      enableMobileTilt: true,
      mobileTiltSensitivity: 5,
      ...options
    };

    if (!this.shell) return;

    this.rafId = null;
    this.running = false;
    this.lastTs = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.initialUntil = 0;
    
    this.DEFAULT_TAU = 0.14;
    this.INITIAL_TAU = 0.6;

    this.enterTimer = null;
    this.leaveRaf = null;

    this.init();
  }

  setVarsFromXY(x, y) {
    const width = this.shell.clientWidth || 1;
    const height = this.shell.clientHeight || 1;

    const percentX = clamp((100 / width) * x);
    const percentY = clamp((100 / height) * y);

    const centerX = percentX - 50;
    const centerY = percentY - 50;

    const properties = {
      '--pc-pointer-x': `${percentX}%`,
      '--pc-pointer-y': `${percentY}%`,
      '--pc-background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
      '--pc-background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
      '--pc-pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
      '--pc-pointer-from-top': `${percentY / 100}`,
      '--pc-pointer-from-left': `${percentX / 100}`,
      '--pc-rotate-x': `${round(-(centerX / 5))}deg`,
      '--pc-rotate-y': `${round(centerY / 4)}deg`
    };

    for (const [k, v] of Object.entries(properties)) {
      this.wrap.style.setProperty(k, v);
    }
  }

  step(ts) {
    if (!this.running) return;
    if (this.lastTs === 0) this.lastTs = ts;
    const dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;

    const tau = ts < this.initialUntil ? this.INITIAL_TAU : this.DEFAULT_TAU;
    const k = 1 - Math.exp(-dt / tau);

    this.currentX += (this.targetX - this.currentX) * k;
    this.currentY += (this.targetY - this.currentY) * k;

    this.setVarsFromXY(this.currentX, this.currentY);

    const stillFar = Math.abs(this.targetX - this.currentX) > 0.05 || Math.abs(this.targetY - this.currentY) > 0.05;

    if (stillFar || document.hasFocus()) {
      this.rafId = requestAnimationFrame(this.step.bind(this));
    } else {
      this.running = false;
      this.lastTs = 0;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTs = 0;
    this.rafId = requestAnimationFrame(this.step.bind(this));
  }

  setImmediate(x, y) {
    this.currentX = x;
    this.currentY = y;
    this.setVarsFromXY(this.currentX, this.currentY);
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.start();
  }

  toCenter() {
    this.setTarget(this.shell.clientWidth / 2, this.shell.clientHeight / 2);
  }

  beginInitial(durationMs) {
    this.initialUntil = performance.now() + durationMs;
    this.start();
  }

  getOffsets(evt) {
    const rect = this.shell.getBoundingClientRect();
    let clientX = evt.clientX;
    let clientY = evt.clientY;
    
    // Handle touch events
    if (evt.touches && evt.touches.length > 0) {
        clientX = evt.touches[0].clientX;
        clientY = evt.touches[0].clientY;
    }
    
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  handlePointerMove = (evt) => {
    const { x, y } = this.getOffsets(evt);
    this.setTarget(x, y);
  }

  handlePointerEnter = (evt) => {
    this.shell.classList.add('active');
    this.shell.classList.add('entering');
    if (this.enterTimer) window.clearTimeout(this.enterTimer);
    this.enterTimer = window.setTimeout(() => {
      this.shell.classList.remove('entering');
    }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

    const { x, y } = this.getOffsets(evt);
    this.setTarget(x, y);
  }

  handlePointerLeave = () => {
    this.toCenter();

    const checkSettle = () => {
      const settled = Math.hypot(this.targetX - this.currentX, this.targetY - this.currentY) < 0.6;
      if (settled) {
        this.shell.classList.remove('active');
        this.leaveRaf = null;
      } else {
        this.leaveRaf = requestAnimationFrame(checkSettle);
      }
    };
    if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
    this.leaveRaf = requestAnimationFrame(checkSettle);
  }

  handleDeviceOrientation = (event) => {
    const { beta, gamma } = event;
    if (beta == null || gamma == null) return;

    const centerX = this.shell.clientWidth / 2;
    const centerY = this.shell.clientHeight / 2;
    const x = clamp(centerX + gamma * this.options.mobileTiltSensitivity, 0, this.shell.clientWidth);
    const y = clamp(
      centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * this.options.mobileTiltSensitivity,
      0,
      this.shell.clientHeight
    );

    this.setTarget(x, y);
  }

  handleClick = () => {
    if (!this.options.enableMobileTilt || location.protocol !== 'https:') return;
    const anyMotion = window.DeviceMotionEvent;
    if (anyMotion && typeof anyMotion.requestPermission === 'function') {
      anyMotion
        .requestPermission()
        .then(state => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', this.handleDeviceOrientation);
    }
  }

  init() {
    if (!this.options.enableTilt) return;

    // Events
    this.shell.addEventListener('pointerenter', this.handlePointerEnter);
    this.shell.addEventListener('pointermove', this.handlePointerMove);
    this.shell.addEventListener('pointerleave', this.handlePointerLeave);
    
    // Touch support for mobile
    this.shell.addEventListener('touchstart', this.handlePointerEnter, {passive: true});
    this.shell.addEventListener('touchmove', this.handlePointerMove, {passive: true});
    this.shell.addEventListener('touchend', this.handlePointerLeave);
    
    this.shell.addEventListener('click', this.handleClick);

    // Initial animation
    const initialX = (this.shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    this.setImmediate(initialX, initialY);
    this.toCenter();
    this.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const pcWrappers = document.querySelectorAll('.pc-card-wrapper');
  pcWrappers.forEach(wrap => {
    new ProfileCardController(wrap);
  });
  
  // Handle contact button click in vanilla JS
  const contactBtn = document.querySelector('.pc-contact-btn');
  if (contactBtn) {
      contactBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetSection = document.getElementById('contact');
          if (targetSection) {
              const offset = 80;
              const targetPosition = targetSection.offsetTop - offset;
              window.scrollTo({
                  top: targetPosition,
                  behavior: 'smooth'
              });
          }
      });
  }
});
