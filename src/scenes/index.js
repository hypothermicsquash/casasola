// Every scene is its own chunk: playing scene 1 never downloads scene 2's code or textures.
export const SCENES = {
  scene1: { load: () => import('./scene1/index.js') },
  // scene2: { load: () => import('./scene2/index.js') },
};
export const FIRST = 'scene1';
