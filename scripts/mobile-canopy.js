export function buildCanopy({ THREE, parent, pt, bar, suspension, crownAnchor, artworkCount = 20 }) {
  const silver = new THREE.MeshStandardMaterial({ color: 0xb2c4d0, metalness: .76, roughness: .31 });
  const champagne = new THREE.MeshStandardMaterial({ color: 0xc8b58c, metalness: .73, roughness: .34 });
  const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const mesh = (host, geometry, material, position) => {
    const item = new THREE.Mesh(geometry, material);
    if (position) item.position.copy(position);
    item.castShadow = true; item.receiveShadow = true;
    host.add(item);
    return item;
  };
  // A small real eye is welded to the beam; the returned point is its outer rim.
  function smallEye(host, point, direction, radius = .041, tube = .010) {
    const collarRadius = .028;
    mesh(host, new THREE.SphereGeometry(collarRadius, 12, 8), champagne, point);
    const outside = radius + tube;
    const center = point.clone().add(v(0, direction * (collarRadius + outside), 0));
    const ring = mesh(host, new THREE.TorusGeometry(radius, tube, 8, 28), champagne, center);
    const contact = center.clone().add(v(0, direction * outside, 0));
    contact.ringTube = tube;
    contact.ring = ring;
    return contact;
  }
  function wing(host, a, control, b) {
    const curve = new THREE.QuadraticBezierCurve3(a, control, b);
    mesh(host, new THREE.TubeGeometry(curve, 48, .024, 10, false), silver);
    // Short end sleeves read as crafted metal rather than stacked loose rings.
    for (const t of [0, 1]) {
      const cuff = mesh(host, new THREE.CylinderGeometry(.033, .033, .09, 12), champagne, curve.getPoint(t));
      cuff.quaternion.setFromUnitVectors(v(0, 1, 0), curve.getTangent(t));
    }
    return curve;
  }

  const main = new THREE.Group();
  main.name = 'Lunar canopy / six branching picture chains';
  const arc = bar(main, pt(-8.3, -2.40, -.12), pt(.08, -.39, .08), pt(8.3, -2.20, .12));
  const mainTop = smallEye(main, arc.getPoint(.5), 1, .050, .012);
  mainTop.ring.rotation.y = Math.PI / 2;
  const mainSuspension = suspension(parent, crownAnchor, crownAnchor, main, mainTop, true);
  mainSuspension.userData.pendulumLength = crownAnchor.distanceTo(mainTop);
  mainSuspension.userData.maxSwing = .050;

  const wings = [new THREE.Group(), new THREE.Group()];
  const branchStemLengths = [];
  wings[0].name = 'Left silver wing'; wings[1].name = 'Right silver wing';
  const curves = [
    wing(wings[0], pt(-6.875, -3.15, .06), pt(-4.8125, -2.18, -.31), pt(-2.75, -2.82, .30)),
    wing(wings[1], pt(2.75, -3.87, -.18), pt(4.8125, -3.36, .38), pt(6.875, -4.16, .08)),
  ];
  curves.forEach((curve, index) => {
    const upper = smallEye(main, arc.getPoint(index ? .75 : .25), -1, .047, .010);
    const lower = smallEye(wings[index], curve.getPoint(.5), 1, .047, .010);
    const hinge = suspension(main, upper, lower, wings[index], lower);
    hinge.userData.pendulumLength = upper.distanceTo(lower);
    hinge.userData.maxSwing = .040;
    branchStemLengths.push({ level: 1, side: index, length: upper.distanceTo(lower), drop: upper.y - lower.y });
  });

  // E's binary branching stops at a whole picture chain, not at every image.
  const innerWings = [new THREE.Group(), new THREE.Group()];
  innerWings[0].name = 'Left inner fork'; innerWings[1].name = 'Right inner fork';
  const innerCurves = [
    wing(innerWings[0], pt(-4.125, -4.92, -.15), pt(-2.75, -4.35, .26), pt(-1.375, -4.75, .14)),
    wing(innerWings[1], pt(1.375, -4.84, -.12), pt(2.75, -4.42, -.20), pt(4.125, -5.02, .22)),
  ];
  innerCurves.forEach((curve, index) => {
    const upper = smallEye(wings[index], curves[index].getPoint(index ? 0 : 1), -1, .047, .010);
    const lower = smallEye(innerWings[index], curve.getPoint(.5), 1, .047, .010);
    const hinge = suspension(wings[index], upper, lower, innerWings[index], lower);
    hinge.userData.pendulumLength = upper.distanceTo(lower);
    hinge.userData.maxSwing = .045;
    branchStemLengths.push({ level: 2, side: index, length: upper.distanceTo(lower), drop: upper.y - lower.y });
  });
  const chainBranches = [
    { host: wings[0], curve: curves[0], t: 0 },
    { host: innerWings[0], curve: innerCurves[0], t: 0 },
    { host: innerWings[0], curve: innerCurves[0], t: 1 },
    { host: innerWings[1], curve: innerCurves[1], t: 0 },
    { host: innerWings[1], curve: innerCurves[1], t: 1 },
    { host: wings[1], curve: curves[1], t: 1 },
  ];
  const chainCounts = Array.from({ length: 6 }, (_, index) => index < artworkCount ? 1 : 0);
  for (let remaining = artworkCount - 6; remaining > 0; remaining--) {
    const eligible = chainCounts.map((count, index) => count < 5 ? index : -1).filter(index => index >= 0);
    chainCounts[eligible[Math.floor(Math.random() * eligible.length)]]++;
  }
  if (artworkCount >= 8 && Math.max(...chainCounts) - Math.min(...chainCounts) < 2) {
    const long = chainCounts.indexOf(Math.max(...chainCounts));
    const short = chainCounts.findIndex((count, index) => count > 1 && index !== long);
    chainCounts[short]--; chainCounts[long]++;
  }

  const chains = [];
  const pictureTargets = [];
  // Larger eyes move their lower contact .038 down; keep the picture layout.
  const chainStemDrops = [1.262, 2.262, 1.062, 1.762, 1.312, 1.562];
  const chainRowGaps = [2.80, 2.75, 2.90, 2.85, 2.78, 2.82];
  const chainFirstYs = [];
  const chainStemLengths = [];
  let index = 0;
  for (let column = 0; column < 6; column++) {
    const { host, curve, t } = chainBranches[column];
    const branchPoint = curve.getPoint(t);
    const endpoint = smallEye(host, branchPoint, -1, .047, .010);
    const x = pt((column - 2.5) * 2.75, 0).x;
    const firstY = endpoint.y - chainStemDrops[column];
    const rowGap = chainRowGaps[column];
    chainFirstYs.push(firstY);
    const frameZ = .66;
    const firstTarget = v(x, firstY, frameZ);
    const indices = [];
    chainStemLengths.push(endpoint.distanceTo(firstTarget));
    for (let row = 0; row < chainCounts[column]; row++, index++) {
      const y = firstY - row * rowGap;
      indices.push(index);
      pictureTargets[index] = v(x, y, frameZ);
    }
    // The runtime joins each picture to its predecessor's real bottom anchor.
    // No fixed cable remains in this branch when its pictures turn independently.
    chains.push({ parent: host, point: endpoint, indices, firstTarget, rowGap });
  }
  const lowestFrame = Math.min(...pictureTargets.map(point => point.y - 1.964));
  const tailTarget = pt(0, lowestFrame - .25, -.15);
  const layoutBounds = {
    minX: -Math.abs(pt(8.3, 0).x) - .65,
    maxX: Math.abs(pt(8.3, 0).x) + .65,
    minY: tailTarget.y - .95,
    maxY: .65,
  };
  return {
    main,
    moonMount: { parent: main, point: smallEye(main, arc.getPoint(0), -1, .049, .012), insertionOffset: .048 },
    starMount: { parent: main, point: smallEye(main, arc.getPoint(1), -1, .049, .012), insertionOffset: .048 },
    chains,
    pictureTargets,
    chainCounts,
    branchStemLengths,
    chainStemDrops,
    chainStemLengths,
    chainFirstYs,
    chainRowGaps,
    fitWidth: layoutBounds.maxX - layoutBounds.minX + .4,
    fitHeight: layoutBounds.maxY - layoutBounds.minY + .9,
    viewCenterY: parent.position.y + (layoutBounds.maxY + layoutBounds.minY) / 2,
    tailTarget,
    layoutBounds,
    tailMount: { parent: main, point: smallEye(main, arc.getPoint(.5), -1, .031, .008) },
  };
}
