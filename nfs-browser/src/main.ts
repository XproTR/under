import './style.css';
import * as THREE from 'three';

// Sahne
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 20, 150);

// Kamera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Işık
const ambient = new THREE.AmbientLight(0x404060, 1);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Neon ışık (NFSU2 hissi)
const neon = new THREE.PointLight(0xff00ff, 2, 30);
neon.position.set(0, 3, 0);
scene.add(neon);

// Zemin (grid — yolları andırıyor)
const grid = new THREE.GridHelper(200, 100, 0x00ffff, 0x003366);
scene.add(grid);

// Test küpü (araba yerine)
const cubeGeo = new THREE.BoxGeometry(1, 1, 2);
const cubeMat = new THREE.MeshStandardMaterial({
  color: 0xff0066,
  emissive: 0xff0066,
  emissiveIntensity: 0.5,
  metalness: 0.8,
  roughness: 0.2
});
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.y = 0.5;
scene.add(cube);

// Loading gizle
document.querySelector('#loading')!.remove();

// Animasyon
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Küpü döndür (test)
  cube.rotation.y = t * 0.5;
  cube.position.x = Math.sin(t) * 5;

  // Neon ışık gezinsin
  neon.position.x = Math.cos(t * 2) * 8;
  neon.position.z = Math.sin(t * 2) * 8;

  renderer.render(scene, camera);
}

animate();

// Pencere boyutu değişince
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
