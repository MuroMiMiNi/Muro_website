import * as THREE from './vendor/three.module.js';

// Ribbon with string lights: a flat, gently twisting satin ribbon carrying small warm bulbs that glow in turn.
const lightGap=.13,lightMargin=.08;
const bulbGeometry=new THREE.SphereGeometry(.014,10,8),haloGeometry=new THREE.SphereGeometry(.036,12,10);
const bulbMaterial=new THREE.MeshBasicMaterial({color:'#ffffff'});
const haloMaterial=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false});
const warm=new THREE.Color('#ffe6a8'),dim=new THREE.Color('#5d5040'),lightColor=new THREE.Color(),lightMatrix=new THREE.Matrix4(),lightPoint=new THREE.Vector3();
let lightSeed=0;
export function lightCount(length){return Math.max(0,Math.floor((length-2*lightMargin)/lightGap)+1)}
export function stringLights(parent,count){
  if(!count)return {place(){}};
  const bulbs=new THREE.InstancedMesh(bulbGeometry,bulbMaterial,count),halos=new THREE.InstancedMesh(haloGeometry,haloMaterial,count);
  bulbs.name=halos.name='Ribbon string lights';
  for(const lights of [bulbs,halos]){lights.frustumCulled=false;lights.renderOrder=1;parent.add(lights)}
  const phase=(lightSeed++)*2.3;
  // pointAt(t, target) writes a point along the ribbon; margin is the fraction kept clear at each end.
  function place(pointAt,time,twinkle,margin=0){
    for(let i=0;i<count;i++){
      const t=count>1?margin+(1-2*margin)*i/(count-1):.5;
      lightMatrix.makeTranslation(pointAt(t,lightPoint));
      bulbs.setMatrixAt(i,lightMatrix);halos.setMatrixAt(i,lightMatrix);
      const glow=twinkle?.5+.5*Math.sin(time*1.3-i*.85+phase):.7;
      lightColor.lerpColors(dim,warm,.25+.75*glow);bulbs.setColorAt(i,lightColor);
      halos.setColorAt(i,lightColor.multiplyScalar(glow));
    }
    for(const lights of [bulbs,halos]){lights.instanceMatrix.needsUpdate=true;lights.instanceColor.needsUpdate=true}
  }
  return {place};
}

export function flexCord(parent,start,end,material,short=false,bendDirection=1){
  const length=start.distanceTo(end),limit=short?.075:.24;
  const rest=Math.min(length*(short?.04:.08),short?.035:.14)*bendDirection;
  const motionBow=Math.min(length*(short?.06:.12),limit);
  const direction=end.clone().sub(start).normalize();
  const across=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,0,1)).normalize();
  const middle=start.clone().add(end).multiplyScalar(.5);
  const control=middle.clone().addScaledVector(across,rest);
  const curve=new THREE.QuadraticBezierCurve3(start.clone(),control,end.clone());
  const geometry=new THREE.TubeGeometry(curve,24,short?.009:.011,6,false);
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Flexible suspension cord';mesh.frustumCulled=false;parent.add(mesh);
  const previous=new THREE.Vector3(),velocity=new THREE.Vector3(),nextVelocity=new THREE.Vector3();
  const position=new THREE.Vector3(),acceleration=new THREE.Vector3(),rotation=new THREE.Quaternion();
  const state={bend:rest,speed:0};let sampled=false,time=0;
  const ribbonWidth=short?.017:.022,ribbonDepth=.0035,twist=length*2.2,twistPhase=bendDirection*.6;
  const clearEnds=length?Math.min(lightMargin/length,.45):0;
  const lights=stringLights(parent,lightCount(length));
  const normal=new THREE.Vector3(),binormal=new THREE.Vector3(),offset=new THREE.Vector3(),shade=new THREE.Vector3();
  const center=new THREE.Vector3(),tangent=new THREE.Vector3(),sideways=new THREE.Vector3(),facing=new THREE.Vector3(),depthAxis=new THREE.Vector3(0,0,1);
  let shapedBend=null;
  function update(dt,settle=false){
    parent.updateWorldMatrix(true,false);parent.localToWorld(position.copy(middle));
    if(!sampled||dt===0||settle){previous.copy(position);velocity.set(0,0,0);sampled=true;if(settle){state.bend=rest;state.speed=0}}
    else{
      nextVelocity.copy(position).sub(previous).divideScalar(dt);
      acceleration.copy(nextVelocity).sub(velocity).divideScalar(dt).clampLength(0,30);
      parent.getWorldQuaternion(rotation).invert();acceleration.applyQuaternion(rotation);
      const steps=Math.ceil(dt/(1/120)),step=dt/steps;
      for(let i=0;i<steps;i++){
        const deflection=motionBow*THREE.MathUtils.clamp(acceleration.dot(across)/12,-1,1);
        state.speed+=(18*(rest-deflection-state.bend)-4.2*state.speed)*step;
        state.bend=THREE.MathUtils.clamp(state.bend+state.speed*step,-limit,limit);
      }
      previous.copy(position);velocity.copy(nextVelocity);
    }
    control.copy(middle).addScaledVector(across,state.bend);
    time+=dt;lights.place((t,target)=>curve.getPoint(t,target),time,!settle,clearEnds);
    // The ribbon only needs reshaping when its bend has actually moved.
    if(shapedBend!==null&&Math.abs(state.bend-shapedBend)<1e-5)return;
    shapedBend=state.bend;
    const positions=geometry.attributes.position,normals=geometry.attributes.normal;
    for(let segment=0;segment<=24;segment++){
      curve.getPoint(segment/24,center);curve.getTangent(segment/24,tangent);
      // The cord bends within its own plane, so a fixed depth axis gives a stable frame without per-frame allocations.
      sideways.crossVectors(tangent,depthAxis).normalize();facing.crossVectors(sideways,tangent);
      // Flatten the tube into a thin ellipse and turn it slowly along its length so it reads as a ribbon.
      const turn=twistPhase+twist*segment/24,c=Math.cos(turn),s=Math.sin(turn);
      normal.copy(facing).multiplyScalar(c).addScaledVector(sideways,s);
      binormal.copy(sideways).multiplyScalar(c).addScaledVector(facing,-s);
      for(let radial=0;radial<=6;radial++){
        const angle=radial/6*Math.PI*2,x=-Math.cos(angle),y=Math.sin(angle);
        offset.copy(normal).multiplyScalar(x*ribbonDepth).addScaledVector(binormal,y*ribbonWidth);
        shade.copy(normal).multiplyScalar(x/ribbonDepth).addScaledVector(binormal,y/ribbonWidth).normalize();
        const index=segment*7+radial;
        normals.setXYZ(index,shade.x,shade.y,shade.z);
        positions.setXYZ(index,center.x+offset.x,center.y+offset.y,center.z+offset.z);
      }
    }
    positions.needsUpdate=true;normals.needsUpdate=true;
  }
  return {mesh,start:curve.v0,end:curve.v2,curve,state,update};
}
