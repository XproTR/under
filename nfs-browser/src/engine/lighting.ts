import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0x334466, 0.6);
  scene.add(ambient);

  const moon = new THREE.DirectionalLight(0x8899ff, 0.8);
  moon.position.set(50, 100, 50);
  scene.add(moon);

  const hemi = new THREE.HemisphereLight(0x2233aa, 0x000000, 0.4);
  scene.add(hemi);
}
