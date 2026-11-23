import { HOLES } from '@/config';
import { queryButtons, ui } from '@/dom';
import { t } from '@/i18n';
import { game } from '@/state';

export function renderMenu(): void {
  ui.menuBest.hidden = game.best <= 0;
  ui.menuBest.textContent = t('menuBest', { n: game.best });
}

export function renderDifficulty(): void {
  queryButtons(ui.settings, '[data-diff]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.diff === game.diff));
  });
}

function verdictFor(hits: number): string {
  if (hits === HOLES) return t('verdictAll');
  if (hits >= 8) return t('verdictPro');
  if (hits >= 5) return t('verdictGood');
  if (hits >= 2) return t('verdictLearning');
  return t('verdictRetry');
}

export function renderSummary(record: boolean): void {
  const verdict = verdictFor(game.hits);
  ui.final.textContent = String(game.score);
  ui.verdict.textContent = record && game.score > 0 ? t('newRecord', { verdict }) : verdict;
  ui.hits.textContent = `${game.hits}/${HOLES}`;
  ui.perfects.textContent = String(game.perfects);
  ui.best.textContent = String(game.best);
}
