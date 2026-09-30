import * as THREE from 'three';

export function createRoads(scene: THREE.Scene) {
  // Ana yol
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22,
    roughness: 0.8
  });

  // Yatay yol
  const road1 = new THREE.Mesh(new THREE.PlaneGeometry(400, 12), roadMat);
  road1.rotation.x = -Math.PI / 2;
  road1.position.y = 0.01;
  scene.add(road1);

  // Dikey yol
  const road2 = new THREE.Mesh(new THREE.PlaneGeometry(12, 400), roadMat);
  road2.rotation.x = -Math.PI / 2;
  road2.position.y = 0.01;
  scene.add(road2);

  // Yol çizgileri (neon)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

  for (let i = -200; i < 200; i += 8) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i, 0.02, 0);
    scene.add(line);

    const line2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), lineMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(0, 0.02, i);
    scene.add(line2);
  }
}
