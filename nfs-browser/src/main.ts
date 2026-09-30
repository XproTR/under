import './style.css';
import * as THREE from 'three';
import { createScene } from './engine/scene';
import { ChaseCamera } from './engine/camera';
import { setupLighting } from './engine/lighting';
import { initPhysics, createWorld } from './engine/physics';
import { Car } from './car/Car';
import { Controls } from './car/controls';
import { createMap } from './world/map';
import { HUD } from './ui/hud';

async function main() {
  // Fizik motorunu başlat
  const RAPIER = await initPhysics();
  const world = createWorld();

  // Sahne
  const scene = createScene();
  setupLighting(scene);

  // Harita (zemin + yollar + binalar + fizik)
  createMap(scene, world);

  // Araba
  const car = new Car(scene, world, new THREE.Vector3(0, 2, 0));

  // Kamera
  const chaseCam = new ChaseCamera();

  // Kontroller
  const controls = new Controls();

  // HUD
  const hud = new HUD();

  // Renderer
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Loading gizle
  document.querySelector('#loading')?.remove();

  // Animasyon döngüsü
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    // Kontrolleri arabaya ilet
    car.setInput(controls.throttle, controls.steer, controls.brake);

    // Fizik adımı
    world.step();

    // Araba görselini güncelle
    car.update(dt);

    // Kamera takip
    chaseCam.update(car.mesh);

    // HUD
    hud.update(car.getSpeed());

    renderer.render(scene, chaseCam.camera);
  }

  animate();

  // Pencere boyutu
  window.addEventListener('resize', () => {
    chaseCam.resize();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

main().catch((err) => {
  console.error('Oyun başlatılamadı:', err);
  const loading = document.querySelector('#loading');
  if (loading) loading.textContent = 'Hata: ' + err.message;
});
