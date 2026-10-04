// The rods live in 3D; artwork stays as clear, front-facing DOM images.
// Project to whole CSS pixels to keep the structure consistent with the pixel scene.
export class HangingMobile {
  constructor() {
    this.scenes = [];
    this.frame = 0;
    this.lastTime = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const scene = this.scenes.find(item => item.tier === entry.target);
        if (scene) scene.visible = entry.isIntersecting;
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      }
      this.start();
    }, { rootMargin: '100px' });
    this.resize = new ResizeObserver(() => {
      for (const scene of this.scenes) {
        scene.width = scene.tier.clientWidth;
        this.draw(scene);
      }
    });
    this.reduced.addEventListener('change', () => {
      this.stop();
      // A spread-out pose keeps all eight works accessible without animation.
      for (const scene of this.scenes) this.draw(scene);
      this.start();
    });
    document.addEventListener('visibilitychange', () => document.hidden ? this.stop() : this.start());
  }

  clear() {
    this.stop(); this.observer.disconnect(); this.resize.disconnect(); this.scenes = [];
  }

  add(tier, index) {
    const figures = [...tier.querySelectorAll('.hanging-work')];
    function line(kind) {
      const node = document.createElement('span');
      node.className = `mobile-link ${kind}`; node.setAttribute('aria-hidden', 'true');
      tier.append(node); return node;
    }
    const branches = [];
    for (let arm = 0; arm < Math.ceil(figures.length / 2); arm++) {
      branches.push({
        arm: line('mobile-rod'), stem: line('mobile-wire'), beam: line('mobile-rod'),
        leaves: figures.slice(arm * 2, arm * 2 + 2).map(figure => ({ figure, wire: line('mobile-wire') }))
      });
    }
    const spine = line('mobile-wire');
    const tail = line('mobile-wire');
    const hub = document.createElement('span'); hub.className = 'mobile-hub'; hub.setAttribute('aria-hidden', 'true'); tier.append(hub);
    const charm = document.createElement('span'); charm.className = 'mobile-charm'; charm.textContent = '✦'; charm.setAttribute('aria-hidden', 'true'); tier.append(charm);
    const scene = { tier, index, branches, spine, tail, hub, charm, width: tier.clientWidth, time: 0, visible: false };
    this.scenes.push(scene); this.draw(scene); this.observer.observe(tier); this.resize.observe(tier);
  }

  start() {
    if (this.frame || this.reduced.matches || document.hidden || !this.scenes.some(scene => scene.visible)) return;
    this.lastTime = 0;
    const tick = now => {
      this.frame = 0;
      const delta = this.lastTime ? Math.min((now - this.lastTime) / 1000, .08) : 0;
      if (!this.lastTime || delta >= 1 / 30) {
        this.lastTime = now;
        for (const scene of this.scenes) {
          if (!scene.visible || scene.tier.classList.contains('is-inspecting') || document.body.style.position === 'fixed') continue;
          scene.time += delta; this.draw(scene);
        }
      }
      if (!this.reduced.matches && !document.hidden && this.scenes.some(scene => scene.visible)) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.lastTime = 0; }

  draw(scene) {
    const { width: w, time: time, index } = scene;
    if (!w) return;
    const compact = w < 600;
    const still = this.reduced.matches;
    const t = still ? 0 : time;
    const size = compact ? Math.max(58, Math.min(88, w * (still ? .19 : .22))) : Math.min(138, w * .16);
    const radius = w * .235;
    const reach = w * .105;
    const angle = .52 + index * .73 + t * (index % 2 ? -.18 : .21);
    const tilt = still ? 0 : Math.sin(t * .65 + index) * .035;
    const camera = w * 2.8;
    function project(point) {
      const x = point.x + Math.sin(tilt) * point.y;
      const scale = camera / (camera - point.z);
      return { x: Math.round(w / 2 + x * scale), y: Math.round(65 + (point.y + point.z * .33) * scale), z: point.z, scale };
    }
    function drawLine(node, a, b) {
      const start = project(a); const end = project(b);
      const dx = end.x - start.x; const dy = end.y - start.y;
      node.style.width = `${Math.hypot(dx, dy)}px`;
      node.style.transform = `translate(${start.x}px, ${start.y}px) rotate(${Math.atan2(dy, dx)}rad)`;
      node.style.zIndex = 500 + Math.round((a.z + b.z) / 2);
      node.style.opacity = .6 + .3 * Math.max(0, Math.min(1, (a.z + b.z + w) / (w * 2)));
    }
    const origin = { x: 0, y: 0, z: 0 };
    drawLine(scene.spine, { x: 0, y: -65, z: 0 }, origin);
    const hub = project(origin);
    scene.hub.style.transform = `translate(${hub.x}px, ${hub.y}px)`;
    scene.hub.style.zIndex = 502;
    const end = { x: Math.sin(t * .6) * 8, y: compact ? 500 : 540, z: 0 };
    drawLine(scene.tail, origin, end);
    const bottom = project(end);
    scene.charm.style.transform = `translate(${bottom.x}px, ${bottom.y}px)`;

    scene.branches.forEach((branch, arm) => {
      const yaw = angle + arm * Math.PI / 2;
      const tip = still
        ? { x: (arm - (scene.branches.length - 1) / 2) * w * .225, y: arm % 2 * 12, z: (arm % 2 ? 1 : -1) * w * .035 }
        : { x: Math.cos(yaw) * radius, y: Math.sin(t * .8 + arm) * 6, z: Math.sin(yaw) * radius };
      const center = { ...tip, y: tip.y + 95 + arm * (compact ? 28 : 32) };
      const swivel = -.35 + arm * 1.07 + index * .6 + t * (arm % 2 ? -.28 : .25);
      const ends = [-1, 1].map(side => ({ x: center.x + (still ? (compact ? 5 : 18) : Math.cos(swivel) * reach) * side, y: center.y + Math.sin(t + arm) * side * (still ? 0 : 5), z: center.z + (still ? 0 : Math.sin(swivel) * reach * side) }));
      drawLine(branch.arm, origin, tip); drawLine(branch.stem, tip, center); drawLine(branch.beam, ends[0], ends[1]);
      branch.leaves.forEach(({ figure, wire }, side) => {
        const mount = ends[side];
        const phase = arm * 1.9 + side;
        const point = { x: mount.x + Math.sin(t * 1.15 + phase) * (still ? 0 : 7), y: mount.y + 60 + side * (still ? (compact ? 150 : 195) : (compact ? 105 : 125)), z: mount.z + Math.sin(t * .9 + phase) * (still ? 0 : 10) };
        const projected = project(point);
        // Paused/reduced-motion poses still use perspective and a full branching rig.
        figure.style.width = `${size}px`;
        figure.style.transform = `translate(${projected.x}px, ${projected.y}px) translateX(-50%) scale(${projected.scale.toFixed(4)})`;
        figure.style.zIndex = 501 + Math.round(point.z);
        figure.dataset.depth = point.z.toFixed(2);
        figure.querySelector('.work-motion').style.transform = `rotate(${still ? 0 : Math.sin(t * 1.15 + phase) * 2.5}deg)`;
        drawLine(wire, mount, point);
      });
    });
    scene.tier.dataset.motionTime = t.toFixed(3);
  }
}
