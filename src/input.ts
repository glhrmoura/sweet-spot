import { stage } from '@/dom';
import { acceptsSwing, release, startCharge } from '@/game/flow';

const INTERACTIVE = '.panel, .page, button';

function onPointerDown(event: PointerEvent): void {
  if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
  event.preventDefault();
  stage.setPointerCapture?.(event.pointerId);
  startCharge();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.code !== 'Space' || event.repeat || !acceptsSwing()) return;
  event.preventDefault();
  startCharge();
}

function onKeyUp(event: KeyboardEvent): void {
  if (event.code !== 'Space') return;
  event.preventDefault();
  release();
}

export function bindInput(): void {
  stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}
