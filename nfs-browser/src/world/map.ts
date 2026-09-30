import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { createRoads } from './roads';
import { createBuildings } from './buildings';

export function createMap(scene: THREE.Scene, world: RAPIER.World) {
  // Zemin
  const groundGeo = new THREE.PlaneGeometry(500, 500);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a15,
    roughness: 1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Zemin fizik collider
  const groundBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(250, 0.1, 250).setTranslation(0, -0.1, 0),
    groundBody
  );

  // Yollar ve binalar
  createRoads(scene);
  createBuildings(scene);
}
