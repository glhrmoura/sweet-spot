function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

export const stage = byId('stage');
export const sceneCanvas = byId<HTMLCanvasElement>('scene');
export const meterCanvas = byId<HTMLCanvasElement>('meter');

export const ui = {
  hud: byId('hud'),
  hole: byId('hole'),
  score: byId('score'),
  track: byId<HTMLOListElement>('track'),
  streak: byId('streak'),
  toast: byId('toast'),
  hint: byId('hint'),
  menu: byId('menu'),
  menuBest: byId('menuBest'),
  settings: byId('settings'),
  openSettings: byId<HTMLButtonElement>('openSettings'),
  closeSettings: byId<HTMLButtonElement>('closeSettings'),
  toMenu: byId<HTMLButtonElement>('toMenu'),
  quit: byId<HTMLButtonElement>('quit'),
  over: byId('over'),
  start: byId<HTMLButtonElement>('start'),
  again: byId<HTMLButtonElement>('again'),
  final: byId('final'),
  verdict: byId('verdict'),
  hits: byId('hits'),
  perfects: byId('perfects'),
  best: byId('best'),
};

export function queryButtons(root: ParentNode, selector: string): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>(selector));
}
