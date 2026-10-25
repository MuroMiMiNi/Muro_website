import * as THREE from './vendor/three.module.js';

// Soft felt / plush-toy surface: no metal, very rough, with a fabric sheen that brightens at grazing angles.
// The sheen defaults to a lighter tint of the base colour so the fuzz never washes the colour out.
export function plush(color, sheenColor = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .35)) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: .95, sheen: .7, sheenRoughness: .6, sheenColor, envMapIntensity: .35 });
}
