import { DIFFICULTIES, FADE_MS, HIDE_AT, HOLES, MENU_PHASES, NEXT_HOLE_DELAY, PLAY_PHASES, POINTS, RESULTS } from '@/config';
import { sceneCanvas, stage, ui } from '@/dom';
import { lines, setLang, t } from '@/i18n';
import { restartScene, setFlag, setOutcome, showMeter, swing } from '@/scene/rive';
import { game, resetRound } from '@/state';
import { storage } from '@/storage';
import type { DifficultyKey, Lang, Outcome, Phase, ResultInfo } from '@/types';
import { renderHud } from '@/ui/hud';
import { renderDifficulty, renderMenu, renderSummary } from '@/ui/menu';
import { hideToast, toast } from '@/ui/toast';
import { flagTimeAt, isPerfect, outcomeFor, randomPace } from '@/game/swing';

let frame = 0;

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

function setIdle(idle: boolean): void {
  game.atIdle = idle;
  stage.classList.toggle('is-idle', idle);
}

function setPhase(phase: Phase): void {
  game.phase = phase;
  stage.dataset.phase = phase;
}

function resetScene(): void {
  setIdle(false);
  restartScene();
}

function elapsedSeconds(now: number): number {
  return (now - game.chargeStart) / 1000;
}

function enterAim(): void {
  game.pace = randomPace(DIFFICULTIES[game.diff].jitter);
  setPhase('aim');
  setFlag(0);
  showMeter(true);
  ui.hint.hidden = game.hole > 2;
}

export function acceptsSwing(): boolean {
  return !MENU_PHASES.includes(game.phase);
}

export function startCharge(): void {
  if (game.phase !== 'aim') return;
  setPhase('charging');
  game.chargeStart = performance.now();
  game.wobblePhase = Math.random() * Math.PI * 2;
  ui.hint.hidden = true;
  stage.classList.add('is-charging');
  const tick = (now: number) => {
    if (game.phase !== 'charging') return;
    setFlag(flagTimeAt(elapsedSeconds(now), game));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

export function release(): void {
  if (game.phase !== 'charging') return;
  cancelAnimationFrame(frame);
  stage.classList.remove('is-charging');
  const flag = flagTimeAt(elapsedSeconds(performance.now()), game);
  const outcome = outcomeFor(flag);
  setFlag(flag);
  game.pending = { outcome, perfect: isPerfect(flag, outcome) };
  setPhase('flight');
  setIdle(false);
  setOutcome(outcome);
  swing();
}

export function handleIdle(): void {
  setIdle(true);
  sceneCanvas.classList.remove('is-hidden');
  if (game.phase === 'waitIdle') enterAim();
}

export function handleBusy(): void {
  setIdle(false);
}

export function handleResult(outcome: Outcome): void {
  if (game.phase !== 'flight' || !game.pending) return;
  setPhase('result');
  showMeter(false);
  const { perfect } = game.pending;
  game.pending = null;
  const result = RESULTS[outcome];
  const run = game.run;
  const later = (action: () => void, delay: number) =>
    window.setTimeout(() => {
      if (run === game.run) action();
    }, delay);
  later(() => scoreShot(outcome, result, perfect), result.arrival);
  later(() => sceneCanvas.classList.add('is-hidden'), HIDE_AT);
  later(nextHole, Math.max(HIDE_AT + FADE_MS, result.arrival + NEXT_HOLE_DELAY));
}

function scoreShot(outcome: Outcome, result: ResultInfo, perfect: boolean): void {
  game.results[game.hole - 1] = result.key;
  if (outcome === 2) {
    const gained = POINTS.hit + game.streak * POINTS.streak + (perfect ? POINTS.perfect : 0);
    game.score += gained;
    game.streak += 1;
    game.hits += 1;
    if (perfect) game.perfects += 1;
    toast(`${perfect ? t('perfect') : pick(lines(result.lines))} +${gained}`, perfect ? 'perfect' : 'made');
  } else {
    game.streak = 0;
    toast(pick(lines(result.lines)), result.key);
  }
  renderHud();
}

function nextHole(): void {
  if (game.hole >= HOLES) {
    finish();
    resetScene();
    return;
  }
  game.hole += 1;
  setPhase('waitIdle');
  renderHud();
  resetScene();
}

function finish(): void {
  setPhase('over');
  ui.hud.hidden = true;
  ui.streak.hidden = true;
  const record = game.score > game.best;
  if (record) {
    game.best = game.score;
    storage.set('best', game.best);
  }
  renderSummary(record);
  ui.over.hidden = false;
  ui.again.focus();
}

export function newGame(): void {
  if (!game.ready) {
    game.wantStart = true;
    return;
  }
  game.wantStart = false;
  game.run += 1;
  resetRound();
  ui.menu.hidden = true;
  ui.over.hidden = true;
  ui.hud.hidden = false;
  renderHud();
  if (game.atIdle) enterAim();
  else setPhase('waitIdle');
}

export function handleReady(): void {
  game.ready = true;
  sceneCanvas.classList.add('is-ready');
  ui.best.textContent = String(game.best);
  if (game.wantStart) newGame();
}

export function showMenu(): void {
  const fromPlay = PLAY_PHASES.includes(game.phase);
  game.run += 1;
  game.pending = null;
  cancelAnimationFrame(frame);
  hideToast();
  stage.classList.remove('is-charging');
  showMeter(false);
  ui.hint.hidden = true;
  ui.streak.hidden = true;
  sceneCanvas.classList.remove('is-hidden');
  if (fromPlay) resetScene();
  setPhase('menu');
  ui.over.hidden = true;
  ui.settings.hidden = true;
  ui.hud.hidden = true;
  ui.menu.hidden = false;
  renderMenu();
  ui.start.focus({ preventScroll: true });
}

export function showSettings(): void {
  setPhase('settings');
  ui.menu.hidden = true;
  ui.settings.hidden = false;
  ui.settings.scrollTop = 0;
  ui.closeSettings.focus({ preventScroll: true });
}

export function chooseDifficulty(difficulty: DifficultyKey): void {
  game.diff = difficulty;
  storage.set('difficulty', difficulty);
  renderDifficulty();
}

export function chooseLang(lang: Lang): void {
  setLang(lang);
  renderMenu();
}
