// A round crib mobile: arms radiate from a central hub, each carrying a chain of pictures that faces outward.
import { plush } from './plush-material.js';

export function buildCanopy({ THREE, parent, pt, bar, suspension, crownAnchor, artworkCount = 10 }) {
  const silver = plush('#9ab3d3');
  const champagne = plush('#e0bf80');
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

  const main = new THREE.Group();
  main.name = 'Lunar canopy / round crib mobile';
  const hubY = -.62, radius = pt(3.4, 0).x;
  // The hub is a champagne orb ringed by a silver band, so the arms meet at a crafted centre.
  mesh(main, new THREE.SphereGeometry(.2, 24, 16), champagne, v(0, hubY, 0));
  const band = mesh(main, new THREE.TorusGeometry(.215, .03, 10, 40), silver, v(0, hubY, 0));
  band.rotation.x = Math.PI / 2;
  const mainTop = smallEye(main, v(0, hubY + .2, 0), 1, .050, .012);
  mainTop.ring.rotation.y = Math.PI / 2;
  const mainSuspension = suspension(parent, crownAnchor, crownAnchor, main, mainTop, true);
  mainSuspension.userData.pendulumLength = crownAnchor.distanceTo(mainTop);
  mainSuspension.userData.maxSwing = .050;

  // Spread the pictures evenly over three to six arms, two per arm where possible.
  const armCount = Math.min(6, Math.max(3, Math.ceil(artworkCount / 2)));
  const chainCounts = Array.from({ length: armCount }, (_, index) => Math.floor(artworkCount / armCount) + (index < artworkCount % armCount ? 1 : 0));
  // Alternate stem lengths so neighbouring chains hang at different heights.
  const chainStemDrops = Array.from({ length: armCount }, (_, index) => index % 2 ? 1.95 : 1.05);
  const chainRowGaps = Array.from({ length: armCount }, (_, index) => 2.78 + (index % 3) * .05);
  const arms = [], chains = [], pictureTargets = [], chainFirstYs = [], chainStemLengths = [], branchStemLengths = [];
  let index = 0;
  for (let arm = 0; arm < armCount; arm++) {
    // Each arm is its own group turned around the hub; its local +z points outward, so pictures face out.
    const host = new THREE.Group();
    host.name = `Mobile arm ${arm + 1}`;
    host.rotation.y = arm / armCount * Math.PI * 2;
    main.add(host);
    const curve = bar(host, v(0, hubY, .16), v(0, hubY + .34, radius * .5), v(0, hubY - .22, radius));
    arms.push({ host, curve });
    const endpoint = smallEye(host, curve.getPoint(1), -1, .047, .010);
    const firstY = endpoint.y - chainStemDrops[arm];
    const rowGap = chainRowGaps[arm];
    const firstTarget = v(0, firstY, radius);
    const indices = [];
    chainFirstYs.push(firstY);
    chainStemLengths.push(endpoint.distanceTo(firstTarget));
    branchStemLengths.push({ level: 1, side: arm, length: endpoint.distanceTo(firstTarget), drop: endpoint.y - firstY });
    for (let row = 0; row < chainCounts[arm]; row++, index++) {
      indices.push(index);
      // Recorded in canopy space for layout checks.
      pictureTargets[index] = v(0, firstY - row * rowGap, radius).applyAxisAngle(v(0, 1, 0), host.rotation.y);
    }
    chains.push({ parent: host, point: endpoint, indices, firstTarget, rowGap });
  }
  // The moon and star hang partway along two opposite arms, inside the ring of pictures but clear of the hub.
  const charmArm = arm => arms[arm % armCount];
  const midEye = arm => smallEye(charmArm(arm).host, charmArm(arm).curve.getPoint(.64), -1, .049, .012);
  const lowestFrame = Math.min(...pictureTargets.map(point => point.y - 1.964));
  const tailTarget = v(0, lowestFrame - .25, 0);
  const reach = radius + .85;
  const layoutBounds = { minX: -reach, maxX: reach, minY: tailTarget.y - .95, maxY: .65 };
  return {
    main,
    moonMount: { parent: charmArm(0).host, point: midEye(0), insertionOffset: .048 },
    starMount: { parent: charmArm(Math.floor(armCount / 2)).host, point: midEye(Math.floor(armCount / 2)), insertionOffset: .048 },
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
    tailMount: { parent: main, point: smallEye(main, v(0, hubY - .2, 0), -1, .031, .008) },
  };
}
