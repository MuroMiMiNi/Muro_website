import * as THREE from './vendor/three.module.js';
import {plush} from './plush-material.js';

// Ribbon with felt ornaments: a flat, gently twisting satin ribbon threaded with still felt stars and pompoms.
const ornamentGap=.3,ornamentMargin=.14;
const starShape=new THREE.Shape();
for(let i=0;i<10;i++){const r=i%2?.036:.078,a=Math.PI/2+i*Math.PI/5;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
// A generous bevel puffs the star up like a stuffed felt shape.
const starGeometry=new THREE.ExtrudeGeometry(starShape,{depth:.016,bevelEnabled:true,bevelThickness:.018,bevelSize:.016,bevelSegments:4,curveSegments:2}).center();
const ballGeometry=new THREE.SphereGeometry(.054,20,16);
const feltMaterial=plush('#ffffff');
const starColors=['#f3dfb4','#efcf8d','#f5e6c6'].map(color=>new THREE.Color(color));
const ballColors=['#e9763f','#ea8ca1','#79c2a5','#80a9e0','#eeb444'].map(color=>new THREE.Color(color));
const ornamentMatrix=new THREE.Matrix4(),ornamentPoint=new THREE.Vector3(),ornamentTurn=new THREE.Quaternion(),ornamentScale=new THREE.Vector3(1,1,1),upAxis=new THREE.Vector3(0,1,0);
let ornamentSeed=0;
export function ornamentCount(length){return Math.max(0,Math.floor((length-2*ornamentMargin)/ornamentGap)+1)}
export function stringOrnaments(parent,count){
  if(!count)return {place(){}};
  // Stars and pompoms alternate along the ribbon; each string starts at a different colour.
  const seed=ornamentSeed++,kinds=Array.from({length:count},(_,i)=>(i+seed)%2);
  const stars=new THREE.InstancedMesh(starGeometry,feltMaterial,Math.max(1,kinds.filter(kind=>!kind).length));
  const balls=new THREE.InstancedMesh(ballGeometry,feltMaterial,Math.max(1,kinds.filter(Boolean).length));
  stars.name=balls.name='Ribbon felt ornaments';
  for(const group of [stars,balls]){group.frustumCulled=false;group.count=0;parent.add(group)}
  // pointAt(t, target) writes a point along the ribbon; margin is the fraction kept clear at each end.
  function place(pointAt,margin=0){
    stars.count=balls.count=0;
    kinds.forEach((kind,i)=>{
      const t=count>1?margin+(1-2*margin)*i/(count-1):.5;
      const target=kind?balls:stars,slot=target.count++;
      ornamentTurn.setFromAxisAngle(upAxis,((i+seed)%3-1)*.35);
      target.setMatrixAt(slot,ornamentMatrix.compose(pointAt(t,ornamentPoint),ornamentTurn,ornamentScale));
      const palette=kind?ballColors:starColors;target.setColorAt(slot,palette[(i+seed*2)%palette.length]);
    });
    for(const group of [stars,balls]){group.instanceMatrix.needsUpdate=true;if(group.instanceColor)group.instanceColor.needsUpdate=true}
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
  const state={bend:rest,speed:0};let sampled=false;
  const ribbonWidth=short?.017:.022,ribbonDepth=.0035,twist=length*2.2,twistPhase=bendDirection*.6;
  const clearEnds=length?Math.min(ornamentMargin/length,.45):0;
  const ornaments=stringOrnaments(parent,ornamentCount(length));
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
    // The ribbon only needs reshaping when its bend has actually moved.
    if(shapedBend!==null&&Math.abs(state.bend-shapedBend)<1e-5)return;
    shapedBend=state.bend;
    ornaments.place((t,target)=>curve.getPoint(t,target),clearEnds);
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
