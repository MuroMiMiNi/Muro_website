import * as THREE from './vendor/three.module.js';

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
    const frames=curve.computeFrenetFrames(24,false),positions=geometry.attributes.position,normals=geometry.attributes.normal;
    for(let segment=0;segment<=24;segment++){
      const center=curve.getPoint(segment/24);
      for(let radial=0;radial<=6;radial++){
        const angle=radial/6*Math.PI*2;
        const normal=frames.normals[segment].clone().multiplyScalar(-Math.cos(angle)).addScaledVector(frames.binormals[segment],Math.sin(angle));
        const index=segment*7+radial;
        normals.setXYZ(index,normal.x,normal.y,normal.z);
        positions.setXYZ(index,center.x+normal.x*(short?.009:.011),center.y+normal.y*(short?.009:.011),center.z+normal.z*(short?.009:.011));
      }
    }
    positions.needsUpdate=true;normals.needsUpdate=true;
  }
  return {mesh,start:curve.v0,end:curve.v2,curve,state,update};
}
