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
  private currentSpeed = 0;

  // === DENGELİ NFS AYARLARI ===
  // Kütle: 400kg (hafif spor araba hissi)
  // Motor: 25000 N
  // İvme: 25000/400 = 62.5 m/s² (0-100 km/h ~1.5 saniye)
  private readonly MAX_SPEED = 55;       // m/s = ~200 km/h
  private readonly REVERSE_SPEED = 12;   // m/s = ~43 km/h
  private readonly ENGINE_POWER = 25000;
  private readonly BRAKE_POWER = 60000;
  private readonly TURN_SPEED = 3.5;
  private readonly DRAG = 0.3;

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

    // === FİZİK GÖVDESİ ===
    // KRİTİK: linearDamping ÇOK DÜŞÜK olmalı, yoksa araba gitmez
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.1)        // ← Çok düşük (önceki 1.5 çok yüksekti)
      .setAngularDamping(8)          // Dönmeyi sönümle (takla atmasın)
      .setCanSleep(false);

    this.body = world.createRigidBody(bodyDesc);

    // Kütle: 400kg — hafif ve çevik
    const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 0.5, 2)
      .setMass(400)                  // ← 800 değil, 400
      .setFriction(0.2)              // Düşük sürtünme
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
    this.currentSpeed = speed;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    forward.y = 0;
    forward.normalize();

    // === GAZ (kuvvet uygulaması) ===
    if (Math.abs(this.engineForce) > 0.01) {
      const limit = this.engineForce > 0 ? this.MAX_SPEED : this.REVERSE_SPEED;

      if (speed < limit) {
        // dt çarpanı: her frame kuvvet * zaman = impulse
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

    // === FREN ===
    if (this.brakeForce > 0.01 && speed > 0.1) {
      const brakeFactor = Math.min(1, this.BRAKE_POWER * dt / (speed * 500 + 1));
      const ratio = 1 - brakeFactor;
      this.body.setLinvel(
        { x: vel.x * ratio, y: vel.y, z: vel.z * ratio },
        true
      );
    }

    // === DOĞAL YAVAŞLAMA (gaz bırakınca) ===
    if (Math.abs(this.engineForce) < 0.01 && speed > 0.1) {
      const dragFactor = this.DRAG * dt;
      const ratio = Math.max(0, 1 - dragFactor);
      this.body.setLinvel(
        { x: vel.x * ratio, y: vel.y, z: vel.z * ratio },
        true
      );
    }

    // === DİREKSİYON ===
    if (Math.abs(this.steering) > 0.01 && speed > 0.5) {
      const speedFactor = Math.min(1, 6 / speed);
      const direction = this.engineForce < 0 ? -1 : 1;
      const turnAmount = this.steering * this.TURN_SPEED * speedFactor * dt * direction;
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

    // === GÖRSEL ===
    const t = this.body.translation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.copy(quat);

    const wheelAngle = -this.steering * 0.5;
    for (const fw of this.frontWheels) {
      fw.rotation.y = wheelAngle;
    }

    const wheelSpin = speed * dt * 3;
    for (const w of this.wheelMeshes) {
      w.rotation.x += wheelSpin;
    }
  }

  getSpeed(): number {
    return this.currentSpeed * 3.6;
  }
}
