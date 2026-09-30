import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class Car {
  mesh: THREE.Group;
  body: RAPIER.RigidBody;
  wheelMeshes: THREE.Mesh[] = [];
  private frontWheels: THREE.Mesh[] = [];

  private engineForce = 0;
  private steering = 0;
  private brakeForce = 0;

  // Hız sabitleri
  private readonly MAX_SPEED = 80;       // m/s (~288 km/h)
  private readonly ENGINE_POWER = 60000; // Newton (yüksek!)
  private readonly BRAKE_POWER = 40000;
  private readonly TURN_SPEED = 3.5;

  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    position = new THREE.Vector3(0, 2, 0)
  ) {
    this.mesh = new THREE.Group();

    // Gövde
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.6, 4),
      new THREE.MeshStandardMaterial({
        color: 0xff0066,
        emissive: 0xff0066,
        emissiveIntensity: 0.4,
        metalness: 0.9,
        roughness: 0.2
      })
    );
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
      emissiveIntensity: 5
    });
    const hlGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const hl1 = new THREE.Mesh(hlGeo, lightMat);
    hl1.position.set(-0.6, 0.5, 2.05);
    this.mesh.add(hl1);
    const hl2 = new THREE.Mesh(hlGeo, lightMat);
    hl2.position.set(0.6, 0.5, 2.05);
    this.mesh.add(hl2);

    // Spot ışıklar
    const spot1 = new THREE.SpotLight(0x00ffff, 5, 30, Math.PI / 6, 0.5);
    spot1.position.set(-0.6, 0.5, 2);
    spot1.target.position.set(-0.6, 0, 15);
    this.mesh.add(spot1);
    this.mesh.add(spot1.target);

    const spot2 = new THREE.SpotLight(0x00ffff, 5, 30, Math.PI / 6, 0.5);
    spot2.position.set(0.6, 0.5, 2);
    spot2.target.position.set(0.6, 0, 15);
    this.mesh.add(spot2);
    this.mesh.add(spot2.target);

    // Tekerlekler
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.5,
      roughness: 0.8
    });
    const wps = [
      new THREE.Vector3(-1, 0.4, 1.5),
      new THREE.Vector3(1, 0.4, 1.5),
      new THREE.Vector3(-1, 0.4, -1.5),
      new THREE.Vector3(1, 0.4, -1.5)
    ];
    for (let i = 0; i < wps.length; i++) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.copy(wps[i]);
      this.mesh.add(w);
      this.wheelMeshes.push(w);
      if (i < 2) this.frontWheels.push(w);
    }

    scene.add(this.mesh);

    // --- FİZİK ---
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.01)      // Neredeyse sıfır sürtünme
      .setAngularDamping(8)         // Dönmeyi sönümle (takla atmasın)
      .setCanSleep(false);

    this.body = world.createRigidBody(bodyDesc);

    // Ağırlığı düşür (200 → 100), kolay hızlanır
    const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 0.5, 2)
      .setMass(100)
      .setFriction(0.3)
      .setRestitution(0);

    world.createCollider(colliderDesc, this.body);
  }

  setInput(throttle: number, steer: number, brake: number) {
    this.engineForce = throttle;
    this.steering = steer;
    this.brakeForce = brake;
  }

  update(dt: number) {
    const rot = this.body.rotation();
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    const vel = this.body.linvel();

    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

    // İleri yön
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    forward.y = 0;
    forward.normalize();

    // --- GAZ (applyImpulse ile gerçek kuvvet) ---
    if (Math.abs(this.engineForce) > 0.01) {
      if (speed < this.MAX_SPEED || this.engineForce < 0) {
        // F = m * a  → impulse = F * dt
        const impulse = this.engineForce * this.ENGINE_POWER * dt;
        this.body.applyImpulse(
          {
            x: forward.x * impulse,
            y: 0,
            z: forward.z * impulse
          },
          true
        );
      }
    }

    // --- FREN ---
    if (this.brakeForce > 0.01 && speed > 0.1) {
      const brakeImpulse = this.BRAKE_POWER * dt;
      const ratio = Math.max(0, 1 - brakeImpulse / (speed * 100 + 1));
      this.body.setLinvel(
        { x: vel.x * ratio, y: vel.y, z: vel.z * ratio },
        true
      );
    }

    // --- DOĞAL YAVAŞLAMA (motor kapalıyken) ---
    if (Math.abs(this.engineForce) < 0.01 && speed > 0.1) {
      const drag = 0.5 * dt;
      const ratio = Math.max(0, 1 - drag);
      this.body.setLinvel(
        { x: vel.x * ratio, y: vel.y, z: vel.z * ratio },
        true
      );
    }

    // --- DİREKSİYON ---
    if (Math.abs(this.steering) > 0.01 && speed > 0.3) {
      const speedFactor = Math.min(1, 8 / speed);
      const turnAmount = this.steering * this.TURN_SPEED * speedFactor * dt;
      const turnQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        turnAmount
      );
      quat.multiply(turnQuat);
      this.body.setRotation(
        { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
        true
      );
    }

    // --- GÖRSEL GÜNCELLE ---
    const t = this.body.translation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.copy(quat);

    const wheelAngle = -this.steering * 0.5;
    for (const fw of this.frontWheels) {
      fw.rotation.y = wheelAngle;
    }

    const wheelSpin = speed * dt * 2;
    for (const w of this.wheelMeshes) {
      w.rotation.x += wheelSpin;
    }
  }

  getSpeed(): number {
    const v = this.body.linvel();
    return Math.sqrt(v.x * v.x + v.z * v.z) * 3.6;
  }
}
