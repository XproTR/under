import * as THREE from 'three';

export class ChaseCamera {
  camera: THREE.PerspectiveCamera;
  private offset = new THREE.Vector3(0, 6, -12);
  private lookOffset = new THREE.Vector3(0, 1, 5);
  private smoothing = 0.08;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 6, -12);
  }

  update(target: THREE.Object3D) {
    const targetPos = target.position.clone();
    const targetQuat = target.quaternion.clone();

    const desired = this.offset.clone().applyQuaternion(targetQuat).add(targetPos);
    this.camera.position.lerp(desired, this.smoothing);

    const lookAt = this.lookOffset.clone().applyQuaternion(targetQuat).add(targetPos);
    this.camera.lookAt(lookAt);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
