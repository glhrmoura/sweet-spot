import { HOLES, RESULT_BY_KEY } from '@/config';
import { ui } from '@/dom';
import { t } from '@/i18n';
import { game } from '@/state';

function pip(index: number): HTMLLIElement {
  const item = document.createElement('li');
  const result = game.results[index];
  const label = { n: index + 1 };
  if (result) {
    item.className = `pip pip--${result}`;
    item.setAttribute('aria-label', t('pipResult', { ...label, result: t(RESULT_BY_KEY[result].label) }));
  } else {
    item.className = index === game.hole - 1 ? 'pip pip--now' : 'pip';
    item.setAttribute('aria-label', t('pipLabel', label));
  }
  return item;
}

export function renderHud(): void {
  ui.hole.textContent = String(Math.min(game.hole, HOLES));
  ui.score.textContent = String(game.score);
  ui.track.replaceChildren(...Array.from({ length: HOLES }, (_, index) => pip(index)));
  ui.streak.hidden = game.streak < 2;
  if (game.streak >= 2) ui.streak.textContent = t('streak', { n: game.streak });
}
