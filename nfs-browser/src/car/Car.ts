import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class Car {
  mesh: THREE.Group;
  body: RAPIER.RigidBody;

  private engineForce = 0;
  private steering = 0;

  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    position = new THREE.Vector3(0, 2, 0)
  ) {
    this.mesh = new THREE.Group();

    // Gövde
    const bodyGeo = new THREE.BoxGeometry(2, 0.6, 4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff0066,
      emissive: 0xff0066,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.5;
    this.mesh.add(bodyMesh);

    // Kabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.5, 1.8),
      new THREE.MeshStandardMaterial({
        color: 0x111122,
        metalness: 1,
        roughness: 0.1
      })
    );
    cabin.position.set(0, 1.0, -0.3);
    this.mesh.add(cabin);

    // Farlar
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 3
    });
    const hlGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const hl1 = new THREE.Mesh(hlGeo, lightMat);
    hl1.position.set(-0.6, 0.5, 2);
    this.mesh.add(hl1);
    const hl2 = new THREE.Mesh(hlGeo, lightMat);
    hl2.position.set(0.6, 0.5, 2);
    this.mesh.add(hl2);

    // Tekerlekler (görsel)
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wps = [
      new THREE.Vector3(-1, 0.4, 1.5),
      new THREE.Vector3(1, 0.4, 1.5),
      new THREE.Vector3(-1, 0.4, -1.5),
      new THREE.Vector3(1, 0.4, -1.5)
    ];
    for (const p of wps) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.copy(p);
      this.mesh.add(w);
    }

    scene.add(this.mesh);

    // --- Fizik: basit dynamic body (vehicle API YOK) ---
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(3)
      .setCanSleep(false);

    this.body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 0.5, 2)
      .setMass(200)
      .setFriction(0.8)
      .setRestitution(0);

    world.createCollider(colliderDesc, this.body);
  }

  setInput(throttle: number, steer: number, _brake: number) {
    this.engineForce = throttle;
    this.steering = steer;
  }

  update(_dt: number) {
    const rot = this.body.rotation();
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    // İleri ve sağ vektörler
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    const vel = this.body.linvel();
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

    // Gaz
    if (Math.abs(this.engineForce) > 0.01) {
      const force = forward.multiplyScalar(this.engineForce * 800);
      this.body.applyImpulse({ x: force.x, y: 0, z: force.z }, true);
    }

    // Direksiyon (sadece hız varken)
    if (Math.abs(this.steering) > 0.01 && speed > 0.5) {
      const torque = this.steering * Math.min(speed, 8) * 40;
      this.body.applyTorqueImpulse({ x: 0, y: torque, z: 0 }, true);
    }

    // Sürtünme
    const drag = 0.98;
    this.body.setLinvel({ x: vel.x * drag, y: vel.y, z: vel.z * drag }, true);

    // Görsel güncelle
    const t = this.body.translation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.copy(quat);
  }

  getSpeed(): number {
    const v = this.body.linvel();
    return Math.sqrt(v.x * v.x + v.z * v.z) * 3.6;
  }
}
