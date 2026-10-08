import * as THREE from './vendor/three.module.js';

// A damped pendulum driven by its moving support, with a free torsional axis.
export function ringPendulum(group,parent,length,{damping=1.7,torsionDamping=1.25,stiffness=2.4,yawOffset=0,maxYaw=Infinity,maxSwing=.62}={}) {
  const state={x:0,z:0,yaw:0,vx:0,vz:0,vy:0};
  const previous=new THREE.Vector3(),velocity=new THREE.Vector3(),acceleration=new THREE.Vector3();
  const position=new THREE.Vector3(),nextVelocity=new THREE.Vector3(),parentQ=new THREE.Quaternion();
  const orientation=new THREE.Quaternion(),twist=new THREE.Quaternion();
  const euler=new THREE.Euler(),up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3();
  let sampled=false,previousYaw=0;
  const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
  function update(dt,settle=false){
    parent.updateWorldMatrix(true,false);group.getWorldPosition(position);parent.getWorldQuaternion(parentQ);
    forward.set(0,0,1).applyQuaternion(parentQ);
    const supportYaw=Math.atan2(forward.x,forward.z);
    if(!sampled||dt===0||settle){
      previous.copy(position);velocity.set(0,0,0);acceleration.set(0,0,0);previousYaw=supportYaw;
      if(!sampled||settle)Object.assign(state,{x:0,z:0,yaw:THREE.MathUtils.clamp(supportYaw+yawOffset,-maxYaw,maxYaw),vx:0,vz:0,vy:0});
      sampled=true;
    }else{
      nextVelocity.copy(position).sub(previous).divideScalar(dt);
      const raw=nextVelocity.clone().sub(velocity).divideScalar(dt).clampLength(0,45);
      acceleration.lerp(raw,1-Math.exp(-18*dt));
      const supportSpeed=THREE.MathUtils.clamp(wrap(supportYaw-previousYaw)/dt,-12,12);
      const steps=Math.ceil(dt/(1/120)),step=dt/steps;
      for(let i=0;i<steps;i++){
        const gravity=THREE.MathUtils.clamp(9.81+acceleration.y,2,24);
        state.vx+=(-gravity/length*Math.sin(state.x)+acceleration.z/length*Math.cos(state.x)-damping*state.vx)*step;
        state.vz+=(-gravity/length*Math.sin(state.z)-acceleration.x/length*Math.cos(state.z)-damping*state.vz)*step;
        state.vy+=(stiffness*wrap(supportYaw+yawOffset-state.yaw)+.65*supportSpeed-torsionDamping*state.vy)*step;
        state.x+=state.vx*step;state.z+=state.vz*step;state.yaw+=state.vy*step;
        for(const [angle,speed] of [['x','vx'],['z','vz']])if(Math.abs(state[angle])>maxSwing){state[angle]=Math.sign(state[angle])*maxSwing;state[speed]*=-.2}
        if(Math.abs(state.yaw)>maxYaw){state.yaw=Math.sign(state.yaw)*maxYaw;state.vy*=.2}
      }
      previous.copy(position);velocity.copy(nextVelocity);previousYaw=supportYaw;
    }
    orientation.setFromEuler(euler.set(state.x,0,state.z));
    twist.setFromAxisAngle(up,state.yaw);orientation.multiply(twist);
    group.quaternion.copy(parentQ).invert().multiply(orientation);
    group.updateMatrixWorld(true);
  }
  return {state,update};
}
