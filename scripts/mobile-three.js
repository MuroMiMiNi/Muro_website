import * as THREE from './vendor/three.module.js';
import {makeCrown,makeCharm,makeFrame,setFrameImage} from './mobile-parts.js';
import {ringPendulum} from './ring-pendulum.js';
import {buildCanopy} from './mobile-canopy.js';
import {flexCord,stringOrnaments} from './flex-cord.js';
import {plush} from './plush-material.js';
import {playChime} from './bell-chime.js';

// The mobile hangs a fixed number of frames; pulling the bell shows the next batch of artworks.
export async function mountMobile(host, artworks, onSelect, title = artwork => artwork.title, bellLabel = () => 'Pull the bell for more artworks', slotLimit = 20) {
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
  // Everything except the satin ribbons is soft plush, like a stuffed toy.
  const silver=plush('#93aed0');
  const gold=plush('#ddb978');
  const wireMaterial=new THREE.MeshStandardMaterial({color:'#b3c3e8',metalness:.3,roughness:.42});
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
  const slotCount=Math.min(slotLimit,artworks.length);
  let batchStart=0;
  const shown=index=>artworks[(batchStart+index)%artworks.length];
  const canopy=buildCanopy({THREE,parent:root,pt,bar,suspension,crownAnchor:crown.userData.bottomAnchor,artworkCount:slotCount});
  const textureCache=new Map(),textureLimit=640;
  function loadTexture(artwork){
    if(!textureCache.has(artwork.src))textureCache.set(artwork.src,new THREE.TextureLoader().loadAsync(artwork.src).then(texture=>{
      texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;
      // Frames are at most a few hundred pixels on screen, so large pictures are shrunk by a whole factor
      // (keeping pixel-art edges crisp) to save video memory. The detail view still shows the original file.
      const image=texture.image,longest=Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height),factor=Math.ceil(longest/textureLimit);
      if(factor>1){
        const canvas=document.createElement('canvas');
        canvas.width=Math.round((image.naturalWidth||image.width)/factor);canvas.height=Math.round((image.naturalHeight||image.height)/factor);
        const context=canvas.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(image,0,0,canvas.width,canvas.height);
        texture.image=canvas;texture.needsUpdate=true;
      }
      return texture;
    }));
    return textureCache.get(artwork.src);
  }
  const textures=await Promise.all(Array.from({length:slotCount},(_,index)=>loadTexture(shown(index))));
  const pickObjects=[],buttons=[],frames=[];
  function labelButton(button,index){
    const artwork=shown(index);
    button.dataset.artwork=artwork.id;button.textContent=title(artwork);button.setAttribute('aria-label',title(artwork));
  }
  function addArtwork(parent,mount,target,index,linkBelow){
      const frame=makeFrame(textures[index],linkBelow);frames[index]=frame;
      const hanging=suspension(parent,mount,target,frame,frame.userData.attachment);
      hanging.userData.maxSwing=target.distanceTo(mount)<.9?.035:.065;
      const pendulum=ringPendulum(frame,hanging,1.1+(index%3)*.08,{damping:2+(index%4)*.2,torsionDamping:1+(index%5)*.13,stiffness:2.1+(index%7)*.17,yawOffset:[-.12,.08,-.04,.14,-.08][index%5],maxYaw:.85,maxSwing:.075});
      picturePendulums.push({index,node:frame,...pendulum});
      frame.traverse(o=>{if(o.isMesh){o.userData.index=index;pickObjects.push(o)}});
      const button=document.createElement('button');button.type='button';button.className='work-button';
      labelButton(button,index);
      button.setAttribute('aria-haspopup','dialog');
      host.append(button);
      button.artworkBounds=()=>projectedBounds(visibleImage(frame));
      button.addEventListener('click',()=>onSelect(shown(index),button));
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
  const tail=suspension(canopy.tailMount.parent,canopy.tailMount.point,canopy.tailTarget,tailHook,tailTop);
  const tailLength=canopy.tailMount.point.distanceTo(canopy.tailTarget);
  addRingCharm(tailHook,eye(tailHook,v(0,0,0),-1),'bell');
  const bell=pendulums.find(p=>p.kind==='bell'),bellMeshes=[];
  tailHook.traverse(o=>{if(o.isMesh)bellMeshes.push(o)});
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
  // The tether is a flat ribbon too, threaded with its own felt ornaments.
  const tether=mesh(scene,new THREE.CylinderGeometry(.022,.022,1,10).scale(1,1,.16),wireMaterial);
  tether.name='Portrait to crown suspension';
  const tetherOrnaments=stringOrnaments(scene,6),tetherFrom=v(0,0,0),tetherTo=v(0,0,0);
  function portraitAnchor(){
    const style=getComputedStyle(portrait),origin=style.transformOrigin.split(' ').map(parseFloat);
    const matrix=style.transform==='none'?new DOMMatrix():new DOMMatrix(style.transform);
    const point=matrix.transformPoint(new DOMPoint(portrait.offsetWidth/2-origin[0],portrait.offsetHeight+3-origin[1]));
    const parent=portrait.offsetParent.getBoundingClientRect();
    const x=parent.x+portrait.offsetLeft+origin[0]+point.x,y=parent.y+portrait.offsetTop+origin[1]+point.y;
    return {x,y};
  }
  function connectPortrait({x,y},rect){
    const lower=crown.getWorldPosition(v(0,0,0));
    const upper=v((x-rect.x)/rect.width*2-1,1-(y-rect.y)/rect.height*2,lower.clone().project(camera).z).unproject(camera);
    const ringDown=v(0,-1,0).applyQuaternion(camera.quaternion);
    portraitRing.position.copy(upper).addScaledVector(ringDown,.068);
    portraitRing.quaternion.copy(camera.quaternion);
    upper.addScaledVector(ringDown,.136);
    tether.position.copy(upper).add(lower).multiplyScalar(.5);
    tether.scale.y=upper.distanceTo(lower);
    tetherFrom.copy(upper);tetherTo.copy(lower);
    tetherOrnaments.place((t,target)=>target.lerpVectors(tetherFrom,tetherTo,t),.05);
    tether.quaternion.setFromUnitVectors(v(0,1,0),upper.sub(lower).normalize());
    tether.updateMatrixWorld(true);
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  // The mobile turns a full circle: a slow constant spin, with drag-and-release inertia.
  const autoSpin=.16;
  let yaw=0,spin=autoSpin,pitch=.08,drag=null,held=false,closeup=false,distance=18;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function visibleImage(frame){
    const front=frame.userData.imageMesh;
    const normal=v(0,0,1).transformDirection(front.matrixWorld);
    return normal.dot(camera.position.clone().sub(front.getWorldPosition(v(0,0,0))))>=0?front:frame.userData.imageMeshes[1];
  }
  function projectedBounds(object,rect=renderer.domElement.getBoundingClientRect()){
    const box=object.geometry.boundingBox??(object.geometry.computeBoundingBox(),object.geometry.boundingBox);
    const corners=[[box.min.x,box.min.y],[box.max.x,box.min.y],[box.min.x,box.max.y],[box.max.x,box.max.y]].map(([x,y])=>object.localToWorld(v(x,y,box.max.z)).project(camera));
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
  function aim(event){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.x)/rect.width*2-1,-(event.clientY-rect.y)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
  }
  function pick(event){aim(event);return raycaster.intersectObjects(pickObjects,false)[0]?.object.userData.index}
  function pickBell(event){aim(event);return raycaster.intersectObjects(bellMeshes,false).length>0}
  // Pulling the bell stretches the tail ribbon; a long enough pull (or a tap) rings it and changes the batch.
  const pull={length:0,speed:0,max:.7,trigger:.28};let bellDrag=null,swap=null;
  const worldPerPixel=()=>2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/renderer.domElement.clientHeight;
  function ringBell(){
    playChime();
    if(bell){bell.state.vx+=2.6;bell.state.vz+=(Math.random()-.5)*1.6}
    nextBatch();
  }
  async function nextBatch(){
    if(swap||artworks.length<2)return;
    // Beyond one full mobile, show the next batch; otherwise rotate the works so each pull still changes the view.
    const step=artworks.length>slotCount?slotCount:Math.max(1,Math.round(slotCount/3));
    const next=(batchStart+step)%artworks.length;
    swap={fade:1,direction:-1,textures:null};
    const pending=swap;
    try{
      pending.next=next;
      pending.textures=await Promise.all(Array.from({length:slotCount},(_,index)=>loadTexture(artworks[(next+index)%artworks.length])));
    }catch(error){console.error(error);pending.direction=1}
  }
  function updateSwap(dt){
    if(!swap)return;
    if(swap.direction<0){
      swap.fade=reduced.matches?0:Math.max(0,swap.fade-dt*3.5);
      if(swap.fade===0&&swap.textures){
        batchStart=swap.next;
        frames.forEach((frame,index)=>setFrameImage(frame,swap.textures[index]));
        buttons.forEach(labelButton);
        swap.direction=1;
      }
    }else{
      swap.fade=reduced.matches?1:Math.min(1,swap.fade+dt*2.5);
      if(swap.fade===1)swap=null;
    }
    const opacity=swap?swap.fade:1;
    for(const frame of frames)frame.userData.imageMesh.material.opacity=opacity;
  }
  function updatePull(dt){
    if(!bellDrag){
      pull.speed+=(-70*pull.length-7*pull.speed)*dt;
      pull.length=THREE.MathUtils.clamp(pull.length+pull.speed*dt,-.12,pull.max);
      if(Math.abs(pull.length)<.0005&&Math.abs(pull.speed)<.01)pull.length=pull.speed=0;
    }
    const stretch=1+pull.length/tailLength;
    tail.scale.y=stretch;tailHook.scale.y=1/stretch;
  }
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(pickBell(e)){bellDrag={y:e.clientY,moved:false};held=true;renderer.domElement.setPointerCapture(e.pointerId);return}
    drag={x:e.clientX,y:e.clientY,yaw,pitch,moved:false,lastX:e.clientX,lastTime:e.timeStamp};spin=0;held=true;renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener('pointermove',e=>{
    if(bellDrag){const dy=Math.max(0,e.clientY-bellDrag.y);bellDrag.moved||=dy>5;pull.length=Math.min(dy*worldPerPixel(),pull.max);pull.speed=0}
    else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved||=Math.hypot(dx,dy)>5;yaw=drag.yaw+dx*.008;
      const elapsed=(e.timeStamp-drag.lastTime)/1000;if(elapsed>0){spin=THREE.MathUtils.clamp((e.clientX-drag.lastX)*.008/elapsed,-4,4);drag.lastX=e.clientX;drag.lastTime=e.timeStamp}
      pitch=THREE.MathUtils.clamp(drag.pitch+dy*.004,-.35,.35)}
    else renderer.domElement.style.cursor=pickBell(e)?'ns-resize':pick(e)!==undefined?'pointer':'grab';
  });
  function release(){if(drag&&(!drag.moved||performance.now()-drag.lastTime>120))spin=0;drag=null;bellDrag=null;held=false}
  renderer.domElement.addEventListener('pointerup',e=>{
    if(bellDrag){
      if(!bellDrag.moved){pull.length=Math.max(pull.length,.18);ringBell()}
      else if(pull.length>=pull.trigger)ringBell();
    }
    else if(drag&&!drag.moved){const index=pick(e);if(index!==undefined)onSelect(shown(index),buttons[index])}
    release();
  });
  renderer.domElement.addEventListener('pointercancel',release);
  // Keyboard and screen-reader users get an equivalent button positioned over the bell.
  const bellButton=document.createElement('button');bellButton.type='button';bellButton.className='bell-button';
  bellButton.addEventListener('click',()=>{pull.length=Math.max(pull.length,.22);ringBell()});
  host.append(bellButton);
  const refreshBellLabel=()=>{bellButton.setAttribute('aria-label',bellLabel());bellButton.title=bellLabel()};refreshBellLabel();
  let previousTime=null;
  function render(time){
    const dt=previousTime!==null&&time>previousTime?Math.min((time-previousTime)/1000,.05):0;
    previousTime=time;
    const motion=reduced.matches||held||closeup||document.activeElement?.matches('.work-button:focus-visible')||document.querySelector('dialog[open]')?0:1;
    // A flung mobile eases back to its slow spin.
    if(motion){spin+=(autoSpin-spin)*(1-Math.exp(-.9*dt));yaw=(yaw+spin*dt)%(Math.PI*2)}
    root.rotation.set(pitch, yaw,Math.sin(time*.00035)*.012*motion);
    scene.updateMatrixWorld(true);
    if(!document.querySelector('dialog[open]')){
      for(const p of orderedPhysics)p.update(dt,reduced.matches);
      for(const cord of cords){cord.update(dt,reduced.matches);cord.updateSleeves()}
    }
    updatePull(dt);updateSwap(dt);
    // Read every layout value once, before any label is moved, so the browser lays out at most once per frame.
    const canvasRect=renderer.domElement.getBoundingClientRect(),hostRect=host.getBoundingClientRect(),anchor=portraitAnchor();
    connectPortrait(anchor,canvasRect);
    renderer.render(scene,camera);
    // Names stay hidden while the mobile turns; only a keyboard-focused picture shows its name, placed under its frame.
    const focused=leaves.find(({button})=>button===document.activeElement);
    if(focused){const bounds=projectedBounds(visibleImage(focused.frame),canvasRect);focused.button.style.left=`${bounds.x-hostRect.x+bounds.w/2}px`;focused.button.style.top=`${bounds.y-hostRect.y+bounds.h+13}px`}
    // The bell's keyboard button is invisible until focused, so it is only placed over the bell then.
    if(bellButton===document.activeElement){
      const bellPoint=bell.node.getWorldPosition(v(0,0,0)).project(camera);
      bellButton.style.left=`${canvasRect.x-hostRect.x+(bellPoint.x+1)*canvasRect.width/2}px`;
      bellButton.style.top=`${canvasRect.y-hostRect.y+(1-bellPoint.y)*canvasRect.height/2}px`;
    }
    const bellHidden=closeup||artworks.length<2;if(bellButton.hidden!==bellHidden)bellButton.hidden=bellHidden;
  }
  host.mobile3D={renderer,scene,camera,root,pendulums,picturePendulums,hangingPendulums,cords,chainCounts:canopy.chainCounts,chainFirstYs:canopy.chainFirstYs,branchStemLengths:canopy.branchStemLengths,refreshLabels(){buttons.forEach(labelButton);refreshBellLabel()},nextBatch,setView(y,p=0){yaw=y;pitch=p;held=true;render(0)},closeup(value){closeup=value;updateCamera();render(0)},audit(){scene.updateMatrixWorld(true);return joints.map(j=>{
    const expected=j.parent.localToWorld(j.upper.clone());
    const endpoint=j.group.getWorldPosition(v(0,0,0));
    const bottom=j.cord?j.group.localToWorld(j.delta.clone()):endpoint;
    const actualBottom=j.object.localToWorld(j.objectAnchor.clone());
    const topCordError=j.cord?j.cord.mesh.localToWorld(j.cord.start.clone()).distanceTo(j.topLoop.localToWorld(v(0,-j.outside,0))):0;
    const bottomCordError=j.cord?j.cord.mesh.localToWorld(j.cord.end.clone()).distanceTo(j.bottomLoop.localToWorld(v(0,j.outside,0))):0;
    return {topError:Math.max(expected.distanceTo(endpoint),topCordError),bottomError:Math.max(actualBottom.distanceTo(bottom),bottomCordError)};
  })},meshCount:0,revision:THREE.REVISION};
  scene.traverse(o=>{if(o.isMesh)host.mobile3D.meshCount++});
  // The portrait frame takes its picture's proportions, so re-anchor the tether when its height changes.
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resizeObserver.observe(portrait);resize();
  let visible=true;
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)previousTime=null},{rootMargin:'100px'}).observe(host);
  // While a dialog covers the page, the mobile keeps its last frame instead of redrawing behind it.
  // The artwork entry animation still draws while it fades the scene out through --scene.
  function covered(){
    if(!document.querySelector('dialog[open]'))return false;
    const scene=document.body.style.getPropertyValue('--scene');
    return scene===''||Number(scene)===0;
  }
  renderer.setAnimationLoop(time=>{if(!document.hidden&&visible&&!covered())render(time);else previousTime=null});
  host.dataset.ready='true';
  return host.mobile3D;
}
