import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class Car {
  mesh: THREE.Group;
  body: RAPIER.RigidBody;
  vehicleController: RAPIER.DynamicRayCastVehicleController;
  wheelMeshes: THREE.Mesh[] = [];
  private frontWheels: THREE.Mesh[] = [];

  // NFSU2 His Ayarı: Hafif ve agresif bir araç (Civic tarzı)
  private readonly ENGINE_FORCE = 3000; // Motor gücü
  private readonly STEERING_ANGLE = 0.45; // Direksiyon açısı (rad)
  private readonly MAX_STEER_SPEED = 0.1; // Direksiyon hızı
  
  private engineForce = 0;
  private steerInput = 0;
  private brakeInput = 0;

  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    position = new THREE.Vector3(0, 2, 0)
  ) {
    this.mesh = new THREE.Group();

    // --- GÖRSEL MODEL (Aynı kalabilir) ---
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.6, 4),
      new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.2 })
    );
    bodyMesh.position.y = 0.5;
    this.mesh.add(bodyMesh);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.5, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 1, roughness: 0.1 })
    );
    cabin.position.set(0, 1.0, -0.3);
    this.mesh.add(cabin);

    // Farlar
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 5 });
    const hlGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
    const hl1 = new THREE.Mesh(hlGeo, lightMat); hl1.position.set(-0.6, 0.5, 2.05); this.mesh.add(hl1);
    const hl2 = new THREE.Mesh(hlGeo, lightMat); hl2.position.set(0.6, 0.5, 2.05); this.mesh.add(hl2);

    // Spot ışıklar
    const spot1 = new THREE.SpotLight(0x00ffff, 5, 30, Math.PI / 6, 0.5);
    spot1.position.set(-0.6, 0.5, 2); spot1.target.position.set(-0.6, 0, 15); this.mesh.add(spot1); this.mesh.add(spot1.target);
    const spot2 = new THREE.SpotLight(0x00ffff, 5, 30, Math.PI / 6, 0.5);
    spot2.position.set(0.6, 0.5, 2); spot2.target.position.set(0.6, 0, 15); this.mesh.add(spot2); this.mesh.add(spot2.target);

    // Tekerlekler (Görsel)
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.8 });
    const wps = [
      new THREE.Vector3(-1, 0.4, 1.5), new THREE.Vector3(1, 0.4, 1.5),
      new THREE.Vector3(-1, 0.4, -1.5), new THREE.Vector3(1, 0.4, -1.5)
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

    // --- FİZİK GÖVDESİ (CHASSIS) ---
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.1)
      .setAngularDamping(3) // Ağırlık transferini hissettirmek için
      .setCanSleep(false);

    this.body = world.createRigidBody(bodyDesc);

    // Gövde kütlesi ve çarpışma şekli
    const colliderDesc = RAPIER.ColliderDesc.cuboid(1, 0.5, 2)
      .setMass(400) // Hafif araç
      .setFriction(0.8);
    world.createCollider(colliderDesc, this.body);

    // --- ARAÇ KONTROLCÜSÜ (VEHICLE CONTROLLER) ---
    // Bu kısım süspansiyon ve lastik fiziğini sağlar.
    this.vehicleController = world.createVehicleController(this.body);

    // Tekerlekleri Ekle: (Pozisyon, Süspansiyon Yönü, Aks Yönü, Dinlenme Uzunluğu, Yarıçap)
    const wheelPositions = [
      { x: -1, y: 0, z: 1.5 },  // Ön Sol
      { x: 1, y: 0, z: 1.5 },   // Ön Sağ
      { x: -1, y: 0, z: -1.5 }, // Arka Sol
      { x: 1, y: 0, z: -1.5 }   // Arka Sağ
    ];

    for (const pos of wheelPositions) {
      this.vehicleController.addWheel(
        { x: pos.x, y: pos.y, z: pos.z }, // Şasi bağlantı noktası
        { x: 0, y: -1, z: 0 },            // Süspansiyon yönü (aşağı)
        { x: -1, y: 0, z: 0 },            // Aks yönü
        0.3,                               // Süspansiyon dinlenme uzunluğu
        0.4                                // Tekerlek yarıçapı
      );
    }

    // Süspansiyon ve Lastik Ayarları (NFSU2 His)
    for (let i = 0; i < 4; i++) {
      // Süspansiyon sertliği (Hafif araçlar için daha sert)
      this.vehicleController.setWheelSuspensionStiffness(i, 24);
      this.vehicleController.setWheelMaxSuspensionTravel(i, 0.3);
      this.vehicleController.setWheelSuspensionCompression(i, 0.85);
      this.vehicleController.setWheelSuspensionRelaxation(i, 0.95);
      
      // Lastik Sürtünmesi: Yüksek değer = daha fazla yol tutuşu, daha az kayma
      // Drift yapmak istiyorsan bu değeri düşür (örn: 1.5)
      this.vehicleController.setWheelFrictionSlip(i, 2.5); 
    }
  }

  setInput(throttle: number, steer: number, brake: number) {
    // throttle: W (1), S (-1)
    // steer: A (1), D (-1) -- Rapier'de pozitif değer sola dönüş olabilir, test et
    this.engineForce = throttle;
    this.steerInput = steer;
    this.brakeInput = brake;
  }

  update(dt: number) {
    // --- GİRDİLERİ UYGULA ---
    
    // Motor Gücü (Arka tekerleklere uygula - RWD hissi için 2 ve 3. indexler)
    this.vehicleController.setWheelEngineForce(2, this.engineForce * this.ENGINE_FORCE);
    this.vehicleController.setWheelEngineForce(3, this.engineForce * this.ENGINE_FORCE);
    
    // Fren
    const brakeForce = this.brakeInput * 500; // Fren gücü
    this.vehicleController.setWheelBrake(0, brakeForce);
    this.vehicleController.setWheelBrake(1, brakeForce);
    this.vehicleController.setWheelBrake(2, brakeForce);
    this.vehicleController.setWheelBrake(3, brakeForce);

    // Direksiyon (Ön tekerlekler)
    const steerAngle = this.steerInput * this.STEERING_ANGLE;
    this.vehicleController.setWheelSteering(0, steerAngle);
    this.vehicleController.setWheelSteering(1, steerAngle);

    // --- FİZİK GÜNCELLEMESİ ---
    // Önemli: dt değerini kullanarak aracı güncelle
    this.vehicleController.updateVehicle(dt);

    // --- GÖRSEL GÜNCELLEME ---
    const t = this.body.translation();
    const r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);

    // Direksiyon görseli (basit)
    const wheelAngle = -this.steerInput * 0.5;
    for (const fw of this.frontWheels) {
      fw.rotation.y = wheelAngle;
    }

    // Tekerlek dönüşü (hız hissi)
    const speed = this.body.linvel();
    const speedMag = Math.sqrt(speed.x * speed.x + speed.z * speed.z);
    const wheelSpin = speedMag * dt * 3;
    for (const w of this.wheelMeshes) {
      w.rotation.x += wheelSpin;
    }
  }

  getSpeed(): number {
    const v = this.body.linvel();
    return Math.sqrt(v.x * v.x + v.z * v.z) * 3.6;
  }
}
