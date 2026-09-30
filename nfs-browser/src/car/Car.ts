import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class Car {
  mesh: THREE.Group;
  body: RAPIER.RigidBody;
  controller: RAPIER.DynamicRayCastVehicleController | null = null;
  wheelMeshes: THREE.Mesh[] = [];

  private engineForce = 0;
  private steering = 0;
  private brakeForce = 0;

  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    position = new THREE.Vector3(0, 2, 0)
  ) {
    // --- Görsel araba ---
    this.mesh = new THREE.Group();

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
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      metalness: 1,
      roughness: 0.1
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.0, -0.3);
    this.mesh.add(cabin);

    // Farlar
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 3
    });
    const headlightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const hl1 = new THREE.Mesh(headlightGeo, lightMat);
    hl1.position.set(-0.6, 0.5, 2);
    this.mesh.add(hl1);
    const hl2 = new THREE.Mesh(headlightGeo, lightMat);
    hl2.position.set(0.6, 0.5, 2);
    this.mesh.add(hl2);

    // Tekerlekler (görsel)
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5 });
    const wheelPositions = [
      new THREE.Vector3(-1, 0.4, 1.5),
      new THREE.Vector3(1, 0.4, 1.5),
      new THREE.Vector3(-1, 0.4, -1.5),
      new THREE.Vector3(1, 0.4, -1.5)
    ];
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.copy(pos);
      this.mesh.add(wheel);
      this.wheelMeshes.push(wheel);
    }

    scene.add(this.mesh);

    // --- Fizik ---
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.3)
      .setAngularDamping(0.5);
    this.body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 0.4, 2)
      .setMass(150)
      .setFriction(0.5)
      .setRestitution(0.1);
    world.createCollider(colliderDesc, this.body);

    // Vehicle controller (yeni API)
    try {
      this.controller = world.createVehicleController(this.body);
      
      // Tekerlekleri ekle
      const wheelPositionsLocal = [
        { x: -1, y: 0, z: 1.5, front: true },
        { x: 1, y: 0, z: 1.5, front: true },
        { x: -1, y: 0, z: -1.5, front: false },
        { x: 1, y: 0, z: -1.5, front: false }
      ];

      for (const wp of wheelPositionsLocal) {
        this.controller.addWheel(
          { x: wp.x, y: wp.y, z: wp.z },      // chassis connection point
          { x: 0, y: -1, z: 0 },               // suspension direction
          { x: -1, y: 0, z: 0 },               // axle direction
          0.3,                                  // suspension rest length
          0.4                                   // wheel radius
        );
      }

      // Süspansiyon ayarları
      for (let i = 0; i < 4; i++) {
        this.controller.wheelSuspensionStiffness(i, 24);
        this.controller.wheelMaxSuspensionTravel(i, 0.3);
        this.controller.wheelFrictionSlip(i, 2);
        this.controller.wheelSuspensionCompression(i, 0.85);
        this.controller.wheelSuspensionRelaxation(i, 0.95);
        this.controller.wheelMaxSuspensionForce(i, 6000);
      }
    } catch (e) {
      console.warn('Vehicle controller oluşturulamadı:', e);
      this.controller = null;
    }
  }

  setInput(throttle: number, steer: number, brake: number) {
    this.engineForce = throttle * 1500;
    this.steering = steer * 0.5;
    this.brakeForce = brake * 300;
  }

  update(_dt: number) {
    if (this.controller) {
      // Motor gücü (arka tekerlekler)
      this.controller.setWheelEngineForce(0, this.engineForce);
      this.controller.setWheelEngineForce(1, this.engineForce);
      this.controller.setWheelEngineForce(2, this.engineForce);
      this.controller.setWheelEngineForce(3, this.engineForce);

      // Direksiyon (ön tekerlekler)
      this.controller.setWheelSteering(0, this.steering);
      this.controller.setWheelSteering(1, this.steering);

      // Fren
      this.controller.setWheelBrake(0, this.brakeForce);
      this.controller.setWheelBrake(1, this.brakeForce);
      this.controller.setWheelBrake(2, this.brakeForce);
      this.controller.setWheelBrake(3, this.brakeForce);

      this.controller.updateVehicle(1 / 60);
    }

    // Mesh pozisyonunu fiziğe bağla
    const t = this.body.translation();
    const r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }

  getSpeed(): number {
    const v = this.body.linvel();
    return Math.sqrt(v.x * v.x + v.z * v.z) * 3.6;
  }
}
