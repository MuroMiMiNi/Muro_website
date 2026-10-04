// Calendar periods determine the branches. Undated files retain catalog order.
export function buildTimeline(artworks) {
  const periods = new Map();
  artworks.forEach(artwork => {
    const key = artwork.date?.slice(0, 7) ?? 'undated';
    if (!periods.has(key)) periods.set(key, { key, year: artwork.date?.slice(0, 4) ?? null, works: [] });
    periods.get(key).works.push(artwork);
  });
  return [...periods.values()].sort((a, b) => a.key === 'undated' ? 1 : b.key === 'undated' ? -1 : b.key.localeCompare(a.key))
    .map(period => ({ ...period, works: period.works.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')) }));
}

export class HangingMobile {
  constructor() {
    this.scene = null;
    this.frame = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.observer = new IntersectionObserver(entries => {
      if (!this.scene) return;
      this.scene.visible = entries.some(entry => entry.isIntersecting);
      this.scene.rig.classList.toggle('is-visible', this.scene.visible);
      this.start();
    }, { rootMargin: '100px' });
    this.resize = new ResizeObserver(() => this.measure());
    this.reduced.addEventListener('change', () => { this.stop(); this.measure(); this.start(); });
    document.addEventListener('visibilitychange', () => document.hidden ? this.stop() : this.start());
  }

  clear() { this.stop(); this.observer.disconnect(); this.resize.disconnect(); this.scene = null; }

  add(rig, artworks) {
    const figures = new Map([...rig.querySelectorAll('.hanging-work')].map(figure => [figure.querySelector('button').dataset.artwork, figure]));
    const leaves = new Map();
    const decoration = (parent, kind) => {
      const node = document.createElement('span'); node.className = kind; node.setAttribute('aria-hidden', 'true'); parent.append(node); return node;
    };
    const periods = buildTimeline(artworks).map(period => {
      const host = document.createElement('div'); host.className = 'timeline-branch'; host.dataset.period = period.key;
      if (period.year) host.dataset.year = period.year;
      rig.append(host);
      // Balance bars arrange the works of this period; they do not create time groups.
      let serial = 0;
      function balance(items, depth = 0) {
        const id = serial++;
        if (items.length === 1) {
          const artwork = items[0]; const figure = figures.get(artwork.id); host.append(figure);
          const leaf = { figure, index: period.works.indexOf(artwork), wire: decoration(host, 'mobile-link mobile-wire'), depth, id };
          leaves.set(figure, leaf); return leaf;
        }
        const middle = Math.ceil(items.length / 2);
        return {
          id, depth, wire: decoration(host, 'mobile-link mobile-wire'), beam: decoration(host, 'mobile-link mobile-rod'),
          children: [balance(items.slice(0, middle), depth + 1), balance(items.slice(middle), depth + 1)]
        };
      }
      const label = period.key === 'undated' ? null : decoration(host, 'period-label');
      if (label) { label.removeAttribute('aria-hidden'); label.textContent = period.key.replace('-', '.'); }
      return { ...period, host, tree: balance(period.works), rootWire: decoration(host, 'mobile-link mobile-wire'), joint: decoration(host, 'mobile-hub'), label, levels: Math.ceil(Math.log2(period.works.length)) };
    });
    const tail = decoration(rig, 'mobile-link mobile-wire');
    const charm = decoration(rig, 'mobile-charm'); charm.textContent = '✦';
    this.scene = { rig, periods, leaves, tail, charm, time: 0, rotationTime: 0, turnRate: 1, held: null, visible: false, width: rig.clientWidth, portraitBottom: 0 };
    this.measure(); this.observer.observe(rig); this.resize.observe(rig);
    this.resize.observe(document.querySelector('.portrait-hanger'));
  }

  hold(trigger) {
    const scene = this.scene; if (!scene) return;
    const leaf = scene.leaves.get(trigger?.closest('.hanging-work')) ?? null;
    if (leaf === scene.held) return;
    if (scene.held) scene.held.release = { pose: scene.held.pose, time: scene.time };
    scene.held = leaf;
    if (leaf) { leaf.release = null; scene.turnRate = 0; }
    scene.rig.classList.toggle('is-inspecting', Boolean(leaf));
  }

  measure() {
    const scene = this.scene; if (!scene) return;
    scene.width = scene.rig.clientWidth;
    scene.portraitBottom = document.querySelector('.portrait-hanger').getBoundingClientRect().bottom - scene.rig.getBoundingClientRect().top;
    this.draw();
  }

  start() {
    if (this.frame || !this.scene?.visible || this.reduced.matches || document.hidden) return;
    let previous = 0;
    const tick = now => {
      this.frame = 0;
      if (this.reduced.matches) { this.draw(); return; }
      const delta = previous ? Math.min((now - previous) / 1000, .08) : 0;
      if (!previous || delta >= 1 / 30) {
        previous = now;
        if (document.body.style.position !== 'fixed') {
          this.scene.time += delta;
          if (!this.scene.held) {
            this.scene.turnRate = Math.min(1, this.scene.turnRate + delta * 1.8);
            this.scene.rotationTime += delta * this.scene.turnRate;
          }
          this.draw();
        }
      }
      if (this.scene?.visible && !document.hidden) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() { cancelAnimationFrame(this.frame); this.frame = 0; }

  draw() {
    const scene = this.scene; if (!scene?.width) return;
    const w = scene.width; const compact = w < 600; const still = this.reduced.matches;
    const t = still ? 0 : scene.time;
    const rotation = still ? 0 : scene.rotationTime;
    const size = compact ? Math.max(57, Math.min(78, w * .18)) : Math.min(112, w * .12);
    const camera = w * 3.5;
    const project = point => {
      const scale = camera / (camera - point.z);
      return { x: Math.round(w / 2 + point.x * scale), y: Math.round(point.y + point.z * .24), scale };
    };
    function line(node, from, to) {
      const a = project(from); const b = project(to); const dx = b.x - a.x; const dy = b.y - a.y;
      node.style.width = `${Math.hypot(dx, dy)}px`;
      node.style.transform = `translate(${a.x}px, ${a.y}px) rotate(${Math.atan2(dy, dx)}rad)`;
      node.style.zIndex = 500 + Math.round((from.z + to.z) / 2);
    }
    const place = (node, point) => { const p = project(point); node.style.transform = `translate(${p.x}px, ${p.y}px)`; };
    let incoming = { x: 0, y: scene.portraitBottom, z: 0 };
    let top = 45;
    let bottom = top;
    scene.periods.forEach((period, periodIndex) => {
      const count = period.works.length;
      const rowGap = size + 46;
      const leafBase = top + Math.max(1, period.levels) * (compact ? 58 : 66) + 35;
      const origin = { x: incoming.x * .35, y: top, z: incoming.z * .35 };
      const yaw = .22 + periodIndex * .8 + rotation * .19;
      let continuation = origin;
      const staticPoint = index => ({
        x: (Math.floor(index / Math.ceil(count / 4)) - (Math.min(4, count) - 1) / 2) * w * .225,
        y: leafBase + (index % Math.ceil(count / 4)) * rowGap + Math.floor(index / Math.ceil(count / 4)) * 10,
        z: 0
      });
      function drawNode(node, mount, center, reach, heading) {
        if (node.figure) {
          let target = still ? staticPoint(node.index) : {
            x: mount.x + Math.sin(t * 1.15 + node.id) * 5,
            y: leafBase + node.index * (compact ? 27 : 23),
            z: mount.z + Math.sin(t * .9 + node.id) * 6
          };
          let tilt = still ? 0 : Math.sin(t * 1.15 + node.id) * 2;
          if (!still && scene.held === node && node.pose) {
            // Pin this ornament in space; its string still follows the moving mount.
            ({ target, tilt } = node.pose);
          } else if (!still && node.release) {
            const progress = Math.min(1, (t - node.release.time) / .6);
            const blend = progress * progress * (3 - 2 * progress);
            const from = node.release.pose;
            target = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, from.target[axis] + (target[axis] - from.target[axis]) * blend]));
            tilt = from.tilt + (tilt - from.tilt) * blend;
            if (progress === 1) node.release = null;
          }
          node.pose = { target, tilt };
          const p = project(target);
          node.figure.style.width = `${size}px`;
          node.figure.style.transform = `translate(${p.x}px, ${p.y}px) translateX(-50%) scale(${p.scale.toFixed(4)})`;
          node.figure.style.zIndex = 501 + Math.round(target.z);
          node.figure.dataset.depth = target.z.toFixed(2);
          node.figure.querySelector('.work-motion').style.transform = `rotate(${tilt}deg)`;
          line(node.wire, mount, target);
          return;
        }
        // Every child's stem starts at an actual endpoint of its parent's bar.
        line(node.wire, mount, center);
        const swing = still ? 0 : Math.sin(t * .65 + node.id) * .025;
        const ends = [-1, 1].map(side => ({
          x: center.x + Math.cos(heading) * reach * side,
          y: center.y + Math.sin(swing) * reach * side,
          z: center.z + Math.sin(heading) * reach * side
        }));
        line(node.beam, ends[0], ends[1]);
        if (node.depth === 0) continuation = ends[periodIndex % 2];
        node.children.forEach((child, side) => {
          let next = { ...ends[side], y: ends[side].y + (compact ? 58 : 66) };
          let nextHeading = heading + (still ? 0 : .5 + child.id * .8 + rotation * (child.id % 2 ? -.22 : .17));
          if (still) {
            const indices = [];
            const collect = branch => branch.figure ? indices.push(branch.index) : branch.children.forEach(collect);
            collect(child);
            next.x = indices.reduce((sum, i) => sum + staticPoint(i).x, 0) / indices.length; next.z = 0;
            nextHeading = 0;
          }
          drawNode(child, ends[side], next, reach * .62, nextHeading);
        });
      }
      line(period.rootWire, incoming, origin);
      drawNode(period.tree, origin, origin, w * (compact ? .16 : .19), still ? 0 : yaw);
      place(period.joint, origin);
      if (period.label) place(period.label, { ...origin, x: origin.x + 18, y: origin.y - 22 });
      period.host.dataset.firstDate = period.works[0].date ?? '';
      period.host.dataset.lastDate = period.works.at(-1).date ?? '';
      incoming = continuation;
      bottom = leafBase + (still ? (Math.ceil(count / 4) - 1) * rowGap + 30 : (count - 1) * (compact ? 27 : 23) + w * .095) + size * 1.2 + 35;
      top = bottom + 60;
    });
    const weight = { x: 0, y: bottom + 35, z: 0 };
    line(scene.tail, { x: 0, y: 45, z: 0 }, weight); place(scene.charm, weight);
    scene.rig.style.height = `${Math.ceil(weight.y + 50)}px`;
    scene.rig.dataset.motionTime = t.toFixed(3);
    scene.rig.dataset.rotationTime = rotation.toFixed(3);
  }
}
