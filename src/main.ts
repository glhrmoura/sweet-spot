import { isDifficulty } from '@/config';
import { queryButtons, ui } from '@/dom';
import {
  chooseDifficulty,
  chooseLang,
  handleBusy,
  handleIdle,
  handleReady,
  handleResult,
  newGame,
  showMenu,
  showSettings,
} from '@/game/flow';
import { applyTranslations, isLang } from '@/i18n';
import { bindInput } from '@/input';
import { loadScene, resizeScene } from '@/scene/rive';
import { renderDifficulty, renderMenu } from '@/ui/menu';

function bindControls(): void {
  ui.start.addEventListener('click', newGame);
  ui.again.addEventListener('click', newGame);
  ui.toMenu.addEventListener('click', showMenu);
  ui.quit.addEventListener('click', showMenu);
  ui.openSettings.addEventListener('click', showSettings);
  ui.closeSettings.addEventListener('click', showMenu);

  queryButtons(ui.settings, '[data-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      const { lang } = button.dataset;
      if (isLang(lang)) chooseLang(lang);
    });
  });

  queryButtons(ui.settings, '[data-diff]').forEach((button) => {
    button.addEventListener('click', () => {
      const { diff } = button.dataset;
      if (isDifficulty(diff)) chooseDifficulty(diff);
    });
  });
}

bindInput();
bindControls();
applyTranslations();
renderDifficulty();
renderMenu();

window.addEventListener('resize', resizeScene);

loadScene({
  onReady: handleReady,
  onIdle: handleIdle,
  onBusy: handleBusy,
  onResult: handleResult,
});
