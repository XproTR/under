import RAPIER from '@dimforge/rapier3d-compat';

let initialized = false;

export async function initPhysics(): Promise<typeof RAPIER> {
  if (!initialized) {
    await RAPIER.init();
    initialized = true;
  }
  return RAPIER;
}

export function createWorld(): RAPIER.World {
  return new RAPIER.World({ x: 0, y: -9.81, z: 0 });
}
