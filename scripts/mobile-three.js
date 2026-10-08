import * as THREE from './vendor/three.module.js';
import {makeCrown,makeCharm,makeFrame} from './mobile-parts.js';
import {ringPendulum} from './ring-pendulum.js';
import {buildCanopy} from './mobile-canopy.js';
import {flexCord} from './flex-cord.js';

export async function mountMobile(host, artworks, onSelect, title = artwork => artwork.title) {
  host.classList.add('mobile-three');
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.domElement.className='mobile-canvas';
  renderer.domElement.setAttribute('aria-label','立體夜空床鈴，可拖曳旋轉');
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  const environment=new THREE.Scene();
  environment.background=new THREE.Color('#71839c');
  for(const [x,y,z,w,h,color] of [[-5,5,4,5,7,'#e4f2ff'],[5,0,4,3,6,'#e9cdaa'],[0,4,-6,8,4,'#6484af']]){
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);environment.add(panel);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(environment,.08).texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#cfe6ff','#182544',2.3));
  for(const [x,y,z,color,intensity] of [[-5,7,8,'#e4f1ff',4],[6,2,3,'#ffe1b2',2],[0,3,-7,'#709ee3',3]]){
    const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
  }
  const silver=new THREE.MeshStandardMaterial({color:'#a2bad0',metalness:.85,roughness:.27});
  const gold=new THREE.MeshStandardMaterial({color:'#bfa570',metalness:.83,roughness:.3});
  const wireMaterial=new THREE.MeshStandardMaterial({color:'#bcc9d2',metalness:.2,roughness:.7});
  const mesh=(parent,geometry,material,point)=>{const m=new THREE.Mesh(geometry,material);if(point)m.position.copy(point);parent.add(m);return m};
  const v=(x,y,z=0)=>new THREE.Vector3(x,y,z);
  const root=new THREE.Group();root.position.y=3.3;scene.add(root);
  const compact=host.clientWidth<560,spread=compact?.68:1;
  const pt=(x,y,z=0)=>v(x*spread,y,z);
  const crown=makeCrown();root.add(crown);
  const joints=[],leaves=[],pendulums=[],picturePendulums=[],cords=[];
  // Every moving suspension pivots at its actual upper contact point.
  function suspension(parent,upper,lower,object,objectAnchor=v(0,0,0),directRing=false){
    const group=new THREE.Group();group.position.copy(upper);parent.add(group);
    const delta=lower.clone().sub(upper),length=delta.length();
    if(directRing){
      const anchor=objectAnchor.clone().sub(v(0,2*(upper.ringTube+objectAnchor.ringTube),0));
      group.add(object);object.position.copy(anchor).negate();
      group.userData.directRing=true;
      joints.push({parent,upper:upper.clone(),group,length,object,objectAnchor:anchor});
      return group;
    }
    const radius=.055,tube=.011,outside=radius+tube;
    const upperInsertion=2*((upper.ringTube??.010)+tube),lowerInsertion=2*((objectAnchor.ringTube??.010)+tube);
    const topLoop=mesh(group,new THREE.TorusGeometry(radius,tube,10,32),gold,v(0,upperInsertion-outside,0));
    const bottomLoop=mesh(group,new THREE.TorusGeometry(radius,tube,10,32),gold,delta.clone().add(v(0,outside-lowerInsertion,0)));
    topLoop.rotation.y=bottomLoop.rotation.y=Math.PI/2;
    topLoop.name=bottomLoop.name='Free interlocking suspension ring';
    const cord=flexCord(group,v(0,upperInsertion-2*outside,0),delta.clone().add(v(0,2*outside-lowerInsertion,0)),wireMaterial,Boolean(object.userData.imageMesh)&&length<.9,cords.length%2?-1:1);cords.push(cord);
    const sleeves=[cord.start,cord.end].map(end=>mesh(group,new THREE.CylinderGeometry(.017,.017,.045,12),gold,end.clone()));
    cord.updateSleeves=()=>sleeves.forEach((sleeve,i)=>sleeve.quaternion.setFromUnitVectors(v(0,1,0),cord.curve.getTangent(i)));
    cord.updateSleeves();
    group.add(object);object.position.copy(delta).sub(objectAnchor);
    joints.push({parent,upper:upper.clone(),group,cord,topLoop,bottomLoop,outside,delta,length,object,objectAnchor:objectAnchor.clone()});
    return group;
  }
  const eyes=new WeakMap();
  function eye(parent,point,direction){
    if(!eyes.has(parent))eyes.set(parent,new Map());
    const key=`${point.x},${point.y},${point.z},${direction}`;
    if(eyes.get(parent).has(key))return Object.assign(eyes.get(parent).get(key).clone(),{ringTube:.025});
    // A welded collar surrounds the rod; the eye touches it at its outer rim.
    mesh(parent,new THREE.SphereGeometry(.065,16,12),gold,point);
    const eyeCenter=point.clone().add(v(0,direction*.135,0));
    mesh(parent,new THREE.TorusGeometry(.105,.025,10,32),gold,eyeCenter);
    const contact=point.clone().add(v(0,direction*.265,0));
    eyes.get(parent).set(key,contact);return Object.assign(contact.clone(),{ringTube:.025});
  }
  function bar(parent,a,b,c){
    const curve=new THREE.QuadraticBezierCurve3(a,b,c);
    mesh(parent,new THREE.TubeGeometry(curve,60,.047,12,false),silver);
    for(const t of [0,1]){
      const cap=mesh(parent,new THREE.CylinderGeometry(.065,.065,.13,16),gold,curve.getPoint(t));
      cap.quaternion.setFromUnitVectors(v(0,1,0),curve.getTangent(t));
    }
    return curve;
  }
  const canopy=buildCanopy({THREE,parent:root,pt,bar,suspension,crownAnchor:crown.userData.bottomAnchor,artworkCount:artworks.length});
  const textures=await Promise.all(artworks.map(a=>new THREE.TextureLoader().loadAsync(a.src)));
  const pickObjects=[],buttons=[];
  function addArtwork(parent,mount,target,index,linkBelow){
      const texture=textures[index];texture.colorSpace=THREE.SRGBColorSpace;
      texture.magFilter=THREE.NearestFilter;
      const frame=makeFrame(texture,linkBelow);
      const hanging=suspension(parent,mount,target,frame,frame.userData.attachment);
      hanging.userData.maxSwing=target.distanceTo(mount)<.9?.035:.065;
      const pendulum=ringPendulum(frame,hanging,1.1+(index%3)*.08,{damping:2+(index%4)*.2,torsionDamping:1+(index%5)*.13,stiffness:2.1+(index%7)*.17,yawOffset:[-.12,.08,-.04,.14,-.08][index%5],maxYaw:.85,maxSwing:.075});
      picturePendulums.push({index,node:frame,...pendulum});
      frame.traverse(o=>{if(o.isMesh){o.userData.index=index;pickObjects.push(o)}});
      const button=document.createElement('button');button.type='button';button.className='work-button';
      button.dataset.artwork=artworks[index].id;
      button.setAttribute('aria-label',title(artworks[index]));
      button.setAttribute('aria-haspopup','dialog');
      button.textContent=title(artworks[index]);host.append(button);
      button.artworkBounds=()=>projectedBounds(visibleImage(frame));
      button.addEventListener('click',()=>onSelect(artworks[index],button));
      buttons[index]=button;leaves.push({frame,button});
      return frame;
  }
  for(const chain of canopy.chains){
    let parent=chain.parent,mount=chain.point,target=chain.firstTarget;
    chain.indices.forEach((index,row)=>{
      const frame=addArtwork(parent,mount,target,index,row<chain.indices.length-1);
      parent=frame;mount=frame.userData.bottomAnchor;target=v(0,-chain.rowGap,0);
    });
  }
  function addRingCharm(parent,upper,kind,insertionOffset=.074){
    const hinge=new THREE.Group();hinge.position.copy(upper);parent.add(hinge);
    const charm=makeCharm(kind);
    // The smaller ring passes through the larger ring in a perpendicular plane.
    charm.userData.hanger.rotation.y=Math.PI/2;
    charm.position.y=insertionOffset;hinge.add(charm);
    joints.push({parent,upper:upper.clone(),group:hinge,object:charm,objectAnchor:v(0,-insertionOffset,0)});
    const pendulum=ringPendulum(hinge,parent,kind==='moon'?.3:kind==='star'?.36:.24);
    pendulums.push({kind,node:hinge,...pendulum});
  }
  for(const kind of ['moon','star']){
    const mount=canopy[`${kind}Mount`];addRingCharm(mount.parent,mount.point,kind,mount.insertionOffset);
  }
  const tailHook=new THREE.Group();
  bar(tailHook,v(-.12,0,0),v(0,.05,0),v(.12,0,0));
  const tailTop=eye(tailHook,v(0,0,0),1);
  suspension(canopy.tailMount.parent,canopy.tailMount.point,canopy.tailTarget,tailHook,tailTop);
  addRingCharm(tailHook,eye(tailHook,v(0,0,0),-1),'bell');
  const hangingPendulums=joints.filter(j=>j.cord||j.group.userData.directRing).map((j,index)=>{
    const pendulum=ringPendulum(j.group,j.parent,j.group.userData.pendulumLength??j.length,{damping:2.2+(index%3)*.2,torsionDamping:1.7+(index%4)*.15,stiffness:3.1,maxYaw:.65,maxSwing:j.group.userData.maxSwing??.025});
    return {name:j.object.name,node:j.group,...pendulum};
  });
  const orderedPhysics=[...hangingPendulums,...pendulums,...picturePendulums];
  for(const p of orderedPhysics){let node=p.node,depth=0;while(node?.parent){depth++;node=node.parent}p.depth=depth}
  orderedPhysics.sort((a,b)=>a.depth-b.depth);
  const portrait=document.querySelector('.portrait');
  const portraitRing=mesh(scene,new THREE.TorusGeometry(.054,.014,10,32),gold);
  portraitRing.name='Portrait bottom suspension ring';
  const tether=mesh(scene,new THREE.CylinderGeometry(.014,.014,1,10),wireMaterial);
  tether.name='Portrait to crown suspension';
  function portraitAnchor(){
    const style=getComputedStyle(portrait),origin=style.transformOrigin.split(' ').map(parseFloat);
    const matrix=style.transform==='none'?new DOMMatrix():new DOMMatrix(style.transform);
    const point=matrix.transformPoint(new DOMPoint(portrait.offsetWidth/2-origin[0],portrait.offsetHeight+3-origin[1]));
    const parent=portrait.offsetParent.getBoundingClientRect();
    const x=parent.x+portrait.offsetLeft+origin[0]+point.x,y=parent.y+portrait.offsetTop+origin[1]+point.y;
    return {x,y};
  }
  function connectPortrait(){
    const {x,y}=portraitAnchor(),rect=renderer.domElement.getBoundingClientRect();
    const lower=crown.getWorldPosition(v(0,0,0));
    const upper=v((x-rect.x)/rect.width*2-1,1-(y-rect.y)/rect.height*2,lower.clone().project(camera).z).unproject(camera);
    const ringDown=v(0,-1,0).applyQuaternion(camera.quaternion);
    portraitRing.position.copy(upper).addScaledVector(ringDown,.068);
    portraitRing.quaternion.copy(camera.quaternion);
    upper.addScaledVector(ringDown,.136);
    tether.position.copy(upper).add(lower).multiplyScalar(.5);
    tether.scale.y=upper.distanceTo(lower);
    tether.quaternion.setFromUnitVectors(v(0,1,0),upper.sub(lower).normalize());
    tether.updateMatrixWorld(true);
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let yaw=-.22,pitch=.08,drag=null,held=false,closeup=false,distance=18;
  let turnPhase=Math.asin(yaw/.55);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function visibleImage(frame){
    const front=frame.userData.imageMesh;
    const normal=v(0,0,1).transformDirection(front.matrixWorld);
    return normal.dot(camera.position.clone().sub(front.getWorldPosition(v(0,0,0))))>=0?front:frame.userData.imageMeshes[1];
  }
  function projectedBounds(object){
    const box=object.geometry.boundingBox??(object.geometry.computeBoundingBox(),object.geometry.boundingBox);
    const corners=[[box.min.x,box.min.y],[box.max.x,box.min.y],[box.min.x,box.max.y],[box.max.x,box.max.y]].map(([x,y])=>object.localToWorld(v(x,y,box.max.z)).project(camera));
    const rect=renderer.domElement.getBoundingClientRect();
    const xs=corners.map(p=>(p.x+1)*rect.width/2),ys=corners.map(p=>(1-p.y)*rect.height/2);
    return {x:rect.x+Math.min(...xs),y:rect.y+Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  }
  function resize(){
    const width=host.clientWidth,fitHeight=canopy.fitHeight,fitWidth=canopy.fitWidth;
    const height=Math.max(compact?650:900,Math.round(width*fitHeight/fitWidth+80));
    host.style.height=`${height}px`;
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
    distance=Math.max(fitHeight,fitWidth/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))+1.5;
    updateCamera();
    host.style.marginTop='0px';
    const rect=renderer.domElement.getBoundingClientRect(),crownPoint=crown.getWorldPosition(v(0,0,0)).project(camera);
    const crownY=rect.y+(1-crownPoint.y)*rect.height/2;
    host.style.marginTop=`${-(crownY-portraitAnchor().y)*3/5}px`;
  }
  function updateCamera(){
    const target=closeup?v(-4.15*spread,1.55,0):v(0,canopy.viewCenterY,0);
    camera.position.copy(target).add(v(0,.4,closeup?5.1:distance));camera.lookAt(target);camera.updateMatrixWorld();
  }
  function pick(event){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.x)/rect.width*2-1,-(event.clientY-rect.y)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickObjects,false)[0]?.object.userData.index;
  }
  renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch,moved:false};held=true;renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved||=Math.hypot(dx,dy)>5;yaw=THREE.MathUtils.clamp(drag.yaw+dx*.008,-.65,.65);pitch=THREE.MathUtils.clamp(drag.pitch+dy*.004,-.35,.35)}
    else renderer.domElement.style.cursor=pick(e)!==undefined?'pointer':'grab';
  });
  function release(){drag=null;held=false;turnPhase=Math.asin(THREE.MathUtils.clamp(yaw/.55,-1,1))}
  renderer.domElement.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const index=pick(e);if(index!==undefined)onSelect(artworks[index],buttons[index])}release()});
  renderer.domElement.addEventListener('pointercancel',release);
  let previousTime=null;
  function render(time){
    const dt=previousTime!==null&&time>previousTime?Math.min((time-previousTime)/1000,.05):0;
    previousTime=time;
    const motion=reduced.matches||held||closeup||document.activeElement?.matches('.work-button:focus-visible')||document.querySelector('dialog[open]')?0:1;
    if(motion){turnPhase+=dt*.18;yaw+=(.55*Math.sin(turnPhase)-yaw)*(1-Math.exp(-2*dt))}
    root.rotation.set(pitch, yaw,Math.sin(time*.00035)*.012*motion);
    scene.updateMatrixWorld(true);
    if(!document.querySelector('dialog[open]')){
      for(const p of orderedPhysics)p.update(dt,reduced.matches);
      for(const cord of cords){cord.update(dt,reduced.matches);cord.updateSleeves()}
    }
    connectPortrait();
    renderer.render(scene,camera);
    for(const {frame,button} of leaves){const bounds=projectedBounds(visibleImage(frame));const rect=host.getBoundingClientRect();button.style.left=`${bounds.x-rect.x+bounds.w/2}px`;button.style.top=`${bounds.y-rect.y+bounds.h+13}px`;button.style.maxWidth=`${bounds.w*1.2}px`;button.hidden=closeup}
  }
  host.mobile3D={renderer,scene,camera,root,pendulums,picturePendulums,hangingPendulums,cords,chainCounts:canopy.chainCounts,chainFirstYs:canopy.chainFirstYs,branchStemLengths:canopy.branchStemLengths,refreshLabels(){buttons.forEach((button,index)=>{button.textContent=title(artworks[index]);button.setAttribute('aria-label',title(artworks[index]))})},setView(y,p=0){yaw=y;pitch=p;held=true;render(0)},closeup(value){closeup=value;updateCamera();render(0)},audit(){scene.updateMatrixWorld(true);return joints.map(j=>{
    const expected=j.parent.localToWorld(j.upper.clone());
    const endpoint=j.group.getWorldPosition(v(0,0,0));
    const bottom=j.cord?j.group.localToWorld(j.delta.clone()):endpoint;
    const actualBottom=j.object.localToWorld(j.objectAnchor.clone());
    const topCordError=j.cord?j.cord.mesh.localToWorld(j.cord.start.clone()).distanceTo(j.topLoop.localToWorld(v(0,-j.outside,0))):0;
    const bottomCordError=j.cord?j.cord.mesh.localToWorld(j.cord.end.clone()).distanceTo(j.bottomLoop.localToWorld(v(0,j.outside,0))):0;
    return {topError:Math.max(expected.distanceTo(endpoint),topCordError),bottomError:Math.max(actualBottom.distanceTo(bottom),bottomCordError)};
  })},meshCount:0,revision:THREE.REVISION};
  scene.traverse(o=>{if(o.isMesh)host.mobile3D.meshCount++});
  new ResizeObserver(resize).observe(host);resize();
  let visible=true;
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)previousTime=null},{rootMargin:'100px'}).observe(host);
  renderer.setAnimationLoop(time=>{if(!document.hidden&&visible)render(time)});
  host.dataset.ready='true';
  return host.mobile3D;
}
