import * as THREE from 'three';

export function createBuildings(scene: THREE.Scene) {
  const colors = [0x112244, 0x221144, 0x441122, 0x223344];
  const neonColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff0066];

  for (let i = 0; i < 40; i++) {
    const width = 4 + Math.random() * 6;
    const depth = 4 + Math.random() * 6;
    const height = 10 + Math.random() * 40;

    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      metalness: 0.7,
      roughness: 0.4
    });

    const building = new THREE.Mesh(geo, mat);

    // Yol dışına yerleştir
    let x, z;
    do {
      x = (Math.random() - 0.5) * 300;
      z = (Math.random() - 0.5) * 300;
    } while (Math.abs(x) < 15 || Math.abs(z) < 15);

    building.position.set(x, height / 2, z);
    scene.add(building);

    // Neon kenar (bazılarına)
    if (Math.random() > 0.5) {
      const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      const neonMat = new THREE.MeshBasicMaterial({ color: neonColor });

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.1, 0.2, depth + 0.1),
        neonMat
      );
      strip.position.set(x, height - 2, z);
      scene.add(strip);
    }
  }
}
