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
  await initPhysics();
  const world = createWorld();

  const scene = createScene();
  setupLighting(scene);

  createMap(scene, world);

  const car = new Car(scene, world, new THREE.Vector3(0, 2, 0));
  const chaseCam = new ChaseCamera();
  const controls = new Controls();
  const hud = new HUD();

  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  document.querySelector('#loading')?.remove();

  // Canvas'a tıklanınca odaklan
  canvas.addEventListener('click', () => canvas.focus());

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    car.setInput(controls.throttle, controls.steer, controls.brake);
    world.step();
    car.update(dt);
    chaseCam.update(car.mesh);
    hud.update(car.getSpeed());

    // Debug: aktif tuşlar
    if (controls.activeKeys.length > 0) {
      console.log('Basılı tuşlar:', controls.activeKeys.join(', '));
    }

    renderer.render(scene, chaseCam.camera);
  }

  animate();

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
