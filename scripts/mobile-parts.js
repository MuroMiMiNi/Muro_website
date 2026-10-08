import * as THREE from './vendor/three.module.js';

// Every component hangs from its origin: the outer top edge of its real ring.
const silver = new THREE.MeshStandardMaterial({ color: 0x9bb6c8, metalness: .72, roughness: .32 });
const champagne = new THREE.MeshStandardMaterial({ color: 0xd4bd8b, metalness: .7, roughness: .33 });
const shadowSilver = new THREE.MeshStandardMaterial({ color: 0x526d88, metalness: .48, roughness: .46 });
const moonIvory = new THREE.MeshStandardMaterial({ color: 0xd8ddce, metalness: .3, roughness: .4 });
const enamel = new THREE.MeshStandardMaterial({ color: 0x233b57, metalness: .26, roughness: .48 });
const midnight = new THREE.MeshStandardMaterial({ color: 0x111f33, metalness: .12, roughness: .65 });

function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function extrude(shape, depth, bevel = .012) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2, steps: 1,
    bevelEnabled: true, bevelSegments: 3,
    bevelSize: bevel, bevelThickness: bevel, curveSegments: 24,
  });
  geometry.translate(0, 0, -(depth - bevel * 2) / 2);
  return geometry;
}

function polygon(points) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return shape;
}

function rectangle(width, height) {
  return polygon([[-width / 2, -height / 2], [width / 2, -height / 2], [width / 2, height / 2], [-width / 2, height / 2]]);
}

function ring(parent, radius = .045, tube = .012, material = champagne) {
  const item = mesh(new THREE.TorusGeometry(radius, tube, 10, 32), material, parent, 0, -(radius + tube));
  parent.userData.attachment = new THREE.Vector3(0, 0, 0);
  return item;
}

function pin(parent, x, y, z = .074, radius = .013) {
  const item = mesh(new THREE.CylinderGeometry(radius, radius, .014, 12), champagne, parent, x, y, z);
  item.rotation.x = Math.PI / 2;
  // Engraved screw head is a recessed dark slit, rather than a painted dot.
  mesh(new THREE.BoxGeometry(radius * 1.35, .003, .002), shadowSilver, parent, x, y, z + Math.sign(z) * .008);
}

export function makeCrown() {
  const group = new THREE.Group();
  group.name = 'Moon crown / solid silver and champagne';
  ring(group, .054, .014, champagne);
  const crest = polygon([
    [-.39, -.32], [-.37, -.18], [-.25, -.26], [-.20, -.14],
    [-.09, -.23], [0, -.125], [.09, -.23], [.20, -.14],
    [.25, -.26], [.37, -.18], [.39, -.32], [.30, -.40], [-.30, -.40],
  ]);
  mesh(extrude(crest, .105, .01), silver, group);
  const cuffProfile = [
    [.255, -.02], [.29, -.018], [.32, .012], [.315, .042],
    [.29, .062], [.255, .062], [.255, -.02],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(cuffProfile, 48), enamel, group, 0, -.425);
  for (const y of [-.41, -.365]) {
    const band = mesh(new THREE.TorusGeometry(.309, .012, 8, 48), champagne, group, 0, y);
    band.rotation.x = Math.PI / 2;
  }
  const jewel = mesh(new THREE.OctahedronGeometry(.036), moonIvory, group, 0, -.244, .09);
  jewel.scale.set(.82, 1.15, .6);
  pin(group, -.21, -.298, .066, .012);
  pin(group, .21, -.298, .066, .012);
  // A genuine lower eye lets the structure continue from the crown.
  mesh(new THREE.TorusGeometry(.028, .009, 8, 24), champagne, group, 0, -.449);
  group.userData.bottomAnchor = new THREE.Vector3(0, -.486, 0);
  group.userData.bottomAnchor.ringTube=.009;
  group.userData.lowerAttachment = group.userData.bottomAnchor;
  return group;
}

export function makeCharm(kind) {
  const group = new THREE.Group();
  group.name = `${kind} / solid mobile charm`;
  const hanger=ring(group);
  group.userData.hanger=hanger;
  if (kind === 'moon') {
    const shape = new THREE.Shape();
    shape.absarc(0, -.30, .25, 1.10, 5.18, false);
    shape.bezierCurveTo(-.18, -.425, -.19, -.17, Math.cos(1.10) * .25, -.30 + Math.sin(1.10) * .25);
    shape.closePath();
    mesh(extrude(shape, .075, .009), moonIvory, group);
    // Hammered lunar pits are small rounded cavities on the surface.
    for (const [x, y, radius] of [[-.195, -.28, .017], [-.13, -.44, .013], [-.12, -.145, .011]]) {
      const crater = mesh(new THREE.TorusGeometry(radius, .003, 6, 14), shadowSilver, group, x, y, .039);
      crater.scale.z = .55;
    }
    mesh(new THREE.SphereGeometry(.012, 10, 8), champagne, group, .096, -.076, 0);
  } else if (kind === 'star') {
    const points = Array.from({ length: 10 }, (_, i) => {
      const angle = Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? .115 : .255;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius - .38];
    });
    mesh(extrude(polygon(points), .085, .012), champagne, group);
    mesh(new THREE.CylinderGeometry(.009, .009, .037, 10), champagne, group, 0, -.121);
    const center = mesh(new THREE.OctahedronGeometry(.07), moonIvory, group, 0, -.38, .05);
    center.scale.set(.78, .78, .33);
    // The inset repeats the star's shape, giving its front a cast-metal relief.
    const inset = mesh(extrude(polygon(points.map(([x, y]) => [x * .71, (y + .38) * .71 - .38])), .012, .003), silver, group, 0, 0, .046);
    inset.position.z = .046;
  } else if (kind === 'bell') {
    mesh(new THREE.CylinderGeometry(.015, .015, .027, 12), champagne, group, 0, -.12);
    const profile = [
      [.019, -.118], [.059, -.132], [.085, -.175], [.101, -.245],
      [.132, -.309], [.155, -.331], [.156, -.356], [.142, -.366],
      [.130, -.350], [.112, -.316], [.083, -.249], [.065, -.183],
      [.042, -.155], [.015, -.146], [.019, -.118],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    mesh(new THREE.LatheGeometry(profile, 48), champagne, group);
    mesh(new THREE.CylinderGeometry(.006, .006, .202, 12), shadowSilver, group, 0, -.249);
    mesh(new THREE.SphereGeometry(.03, 16, 12), silver, group, 0, -.365);
    const lip = mesh(new THREE.TorusGeometry(.146, .007, 8, 40), silver, group, 0, -.346);
    lip.rotation.x = Math.PI / 2;
  } else {
    throw new Error(`Unknown mobile charm: ${kind}`);
  }
  const bodyWidthScale = kind === 'moon' ? 1.2 : 1;
  group.children.slice(1).forEach(item => {
    item.position.x *= bodyWidthScale;
    item.scale.x *= bodyWidthScale;
  });
  return group;
}

export function makeFrame(texture,linkBelow=false) {
  const group = new THREE.Group();
  group.name = 'Artwork / silver floating frame';
  ring(group, .08, .022, champagne);
  if(linkBelow){
    mesh(new THREE.SphereGeometry(.022,12,8),champagne,group,0,-1.964);
    mesh(new THREE.TorusGeometry(.045,.012,10,32),champagne,group,0,-2.029);
    group.userData.bottomAnchor=new THREE.Vector3(0,-2.086,0);
    group.userData.bottomAnchor.ringTube=.012;
  }
  mesh(new THREE.CylinderGeometry(.018, .018, .055, 12), silver, group, 0, -.225);
  const centerY = -1.10;
  const width = 1.42, height = 1.7, rail = .075;
  const backing = mesh(extrude(rectangle(width - .03, height - .03), .056, .007), midnight, group, 0, centerY, -.022);
  backing.name = 'solid midnight backing';
  for (const x of [-1, 1]) {
    mesh(extrude(rectangle(rail, height - rail), .145, .014), silver, group, x * (width - rail) / 2, centerY);
  }
  for (const y of [-1, 1]) {
    mesh(extrude(rectangle(width - rail, rail), .145, .014), silver, group, 0, centerY + y * (height - rail) / 2);
  }
  // A slim inner wooden-blue liner sits under the raised metal rails.
  for (const x of [-1, 1]) mesh(new THREE.BoxGeometry(.023, height - rail * 2, .026), enamel, group, x * .62, centerY, .024);
  for (const y of [-1, 1]) mesh(new THREE.BoxGeometry(width - rail * 2, .023, .026), enamel, group, 0, centerY + y * .759, .024);
  const corner = polygon([[0, 0], [.17, 0], [.17, -.034], [.035, -.034], [.035, -.17], [0, -.17]]);
  for (const face of [-1,1]) {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const cornerMesh = mesh(extrude(corner, .023, .004), champagne, group, sx * -.699, centerY + sy * .839, face * .077);
        cornerMesh.scale.set(sx, sy, 1);
        pin(group, sx * .667, centerY + sy * .807, face * .096);
      }
    }
  }
  const image = texture.image;
  const imageWidth = image?.naturalWidth || image?.width || 1;
  const imageHeight = image?.naturalHeight || image?.height || 1;
  const maxWidth = 1.235, maxHeight = 1.495;
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const imageMesh = mesh(
    new THREE.PlaneGeometry(imageWidth * scale, imageHeight * scale),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide, toneMapped: false }),
    group, 0, centerY, .041,
  );
  imageMesh.name = 'artwork image / uncropped contain';
  imageMesh.castShadow = false;
  const backImage=mesh(imageMesh.geometry,imageMesh.material,group,0,centerY,-.063);
  backImage.rotation.y=Math.PI;
  backImage.name='artwork image back / uncropped contain';
  backImage.castShadow=false;
  group.userData.imageMesh = imageMesh;
  group.userData.imageMeshes = [imageMesh,backImage];
  group.userData.imageDimensions = new THREE.Vector2(imageWidth * scale, imageHeight * scale);
  group.userData.attachment = new THREE.Vector3(0, 0, 0);
  group.userData.attachment.ringTube=.022;
  return group;
}
