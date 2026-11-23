import { Rive, Layout, Fit, Alignment, EventType, RuntimeLoader } from '@rive-app/canvas';
import riveWasm from '@rive-app/canvas/rive.wasm?url';
import { t, setLang, applyTranslations } from './i18n.js';

RuntimeLoader.setWasmUrl(riveWasm);
Rive.suppressDeprecationWarnings = [
  'animations-param',
  'animation-names',
  'names-array',
  'state-change-events',
  'scrub',
  'state-machine-inputs',
];

const SM = 'State Machine 1';
const HOLES = 10;
const FLAG_END = 1.0;
const SHORT_UNTIL = 0.265;
const MADE_UNTIL = 0.615;
const PERFECT_CENTER = (SHORT_UNTIL + MADE_UNTIL) / 2;
const PERFECT_RANGE = 0.025;
const HIDE_AT = 2750;
const FADE_MS = 300;
const TOAST_MS = 1700;
const BEST_KEY = 'tacada.best';
const DIFF_KEY = 'tacada.diff';
const DIFFICULTIES = {
  easy: { start: 1.1, step: 0.06, min: 0.55, jitter: 0.15, wobble: 0.025, wobbleMax: 0.2 },
  medium: { start: 0.8, step: 0.05, min: 0.38, jitter: 0.2, wobble: 0.045, wobbleMax: 0.4 },
  hard: { start: 0.6, step: 0.04, min: 0.3, jitter: 0.25, wobble: 0.06, wobbleMax: 0.55 },
};
const PLAY_PHASES = ['waitIdle', 'aim', 'charging', 'flight', 'result'];

const RESULTS = {
  1: { key: 'short', state: 'ShortMiss', arrival: 1850, lines: 'linesShort', label: 'resultShort' },
  2: { key: 'made', state: 'Madeit', arrival: 2150, lines: 'linesMade', label: 'resultMade' },
  3: { key: 'long', state: 'LongMiss', arrival: 1150, lines: 'linesLong', label: 'resultLong' },
};
const RESULT_BY_STATE = Object.fromEntries(Object.entries(RESULTS).map(([n, r]) => [r.state, Number(n)]));
const RESULT_BY_KEY = Object.fromEntries(Object.values(RESULTS).map((r) => [r.key, r]));

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const sceneCanvas = $('scene');
const meterCanvas = $('meter');
const ui = {
  hud: $('hud'),
  hole: $('hole'),
  score: $('score'),
  track: $('track'),
  streak: $('streak'),
  toast: $('toast'),
  hint: $('hint'),
  menu: $('menu'),
  menuBest: $('menuBest'),
  settings: $('settings'),
  openSettings: $('openSettings'),
  closeSettings: $('closeSettings'),
  toMenu: $('toMenu'),
  quit: $('quit'),
  over: $('over'),
  start: $('start'),
  again: $('again'),
  final: $('final'),
  verdict: $('verdict'),
  hits: $('hits'),
  perfects: $('perfects'),
  best: $('best'),
};

const game = {
  phase: 'menu',
  ready: false,
  run: 0,
  wobblePhase: 0,
  diff: DIFFICULTIES[localStorage.getItem(DIFF_KEY)] ? localStorage.getItem(DIFF_KEY) : 'medium',
  wantStart: false,
  hole: 0,
  score: 0,
  streak: 0,
  hits: 0,
  perfects: 0,
  results: [],
  best: Number(localStorage.getItem(BEST_KEY)) || 0,
  atIdle: false,
  pace: 1,
  chargeStart: 0,
  flagT: 0,
  pending: null,
};

let scene;
let meter;
let raf = 0;
let toastTimer = 0;

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function travelTime(hole) {
  const d = DIFFICULTIES[game.diff];
  return Math.max(d.min, d.start - (hole - 1) * d.step);
}

function flagTimeAt(elapsed, hole) {
  const period = travelTime(hole) * game.pace;
  const d = DIFFICULTIES[game.diff];
  const wobble = Math.min(d.wobbleMax, (hole - 1) * d.wobble);
  const omega = (2 * Math.PI) / (period * 1.7);
  const drift = (wobble * (Math.cos(game.wobblePhase) - Math.cos(omega * elapsed + game.wobblePhase))) / omega;
  const phase = ((elapsed + drift) / period) * Math.PI;
  return ((1 - Math.cos(phase)) / 2) * FLAG_END;
}

function outcomeFor(t) {
  if (t < SHORT_UNTIL) return 1;
  if (t < MADE_UNTIL) return 2;
  return 3;
}

function setIdle(on) {
  game.atIdle = on;
  stage.classList.toggle('is-idle', on);
}

function setPhase(phase) {
  game.phase = phase;
  stage.dataset.phase = phase;
}

function setNumber(n) {
  const input = scene.stateMachineInputs(SM)?.find((i) => i.name === 'Number 1');
  if (input) input.value = n;
}

function fireSwing() {
  scene.viewModelInstance?.trigger('Click')?.trigger();
}

function setFlag(t) {
  game.flagT = t;
  meter.scrub('FlagPosition', t);
}

function showMeter(on) {
  meterCanvas.classList.toggle('is-on', on);
}

function toast(text, tone) {
  clearTimeout(toastTimer);
  ui.toast.textContent = text;
  ui.toast.dataset.tone = tone || '';
  ui.toast.classList.remove('is-on');
  void ui.toast.offsetWidth;
  ui.toast.classList.add('is-on');
  toastTimer = setTimeout(() => ui.toast.classList.remove('is-on'), TOAST_MS);
}

function renderHud() {
  ui.hole.textContent = String(Math.min(game.hole, HOLES));
  ui.score.textContent = String(game.score);
  ui.track.replaceChildren(
    ...Array.from({ length: HOLES }, (_, i) => {
      const li = document.createElement('li');
      const r = game.results[i];
      li.className = r ? `pip pip--${r}` : i === game.hole - 1 ? 'pip pip--now' : 'pip';
      li.setAttribute('aria-label', r ? t('pipResult', { n: i + 1, result: t(RESULT_BY_KEY[r].label) }) : t('pipLabel', { n: i + 1 }));
      return li;
    }),
  );
  if (game.streak >= 2) {
    ui.streak.hidden = false;
    ui.streak.textContent = t('streak', { n: game.streak });
  } else {
    ui.streak.hidden = true;
  }
}

function enterAim() {
  const { jitter } = DIFFICULTIES[game.diff];
  game.pace = 1 - jitter + Math.random() * jitter * 2;
  setPhase('aim');
  setFlag(0);
  showMeter(true);
  ui.hint.hidden = game.hole > 2;
}

function onIdle() {
  setIdle(true);
  sceneCanvas.classList.remove('is-hidden');
  if (game.phase === 'waitIdle') enterAim();
}

function startCharge() {
  if (game.phase !== 'aim') return;
  setPhase('charging');
  game.chargeStart = performance.now();
  game.wobblePhase = Math.random() * Math.PI * 2;
  ui.hint.hidden = true;
  stage.classList.add('is-charging');
  const tick = (now) => {
    if (game.phase !== 'charging') return;
    setFlag(flagTimeAt((now - game.chargeStart) / 1000, game.hole));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function release() {
  if (game.phase !== 'charging') return;
  cancelAnimationFrame(raf);
  stage.classList.remove('is-charging');
  const t = flagTimeAt((performance.now() - game.chargeStart) / 1000, game.hole);
  setFlag(t);
  const n = outcomeFor(t);
  game.pending = { n, perfect: n === 2 && Math.abs(t - PERFECT_CENTER) <= PERFECT_RANGE };
  setPhase('flight');
  setIdle(false);
  setNumber(n);
  fireSwing();
}

function onResult(n) {
  if (game.phase !== 'flight' || !game.pending) return;
  setPhase('result');
  showMeter(false);
  const { perfect } = game.pending;
  game.pending = null;
  const r = RESULTS[n];
  const run = game.run;
  const later = (fn, ms) => setTimeout(() => run === game.run && fn(), ms);
  later(() => score(n, r, perfect), r.arrival);
  later(() => sceneCanvas.classList.add('is-hidden'), HIDE_AT);
  later(nextHole, Math.max(HIDE_AT + FADE_MS, r.arrival + 1300));
}

function score(n, r, perfect) {
  game.results[game.hole - 1] = r.key;
  if (n === 2) {
    const gained = 100 + game.streak * 25 + (perfect ? 50 : 0);
    game.score += gained;
    game.streak += 1;
    game.hits += 1;
    if (perfect) game.perfects += 1;
    toast(`${perfect ? t('perfect') : pick(t(r.lines))} +${gained}`, perfect ? 'perfect' : 'made');
  } else {
    game.streak = 0;
    toast(pick(t(r.lines)), r.key);
  }
  renderHud();
}

function nextHole() {
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

function resetScene() {
  setIdle(false);
  scene.reset({ stateMachine: SM, autoplay: true, autoBind: true });
}

function verdictFor(hits) {
  if (hits === HOLES) return t('verdictAll');
  if (hits >= 8) return t('verdictPro');
  if (hits >= 5) return t('verdictGood');
  if (hits >= 2) return t('verdictLearning');
  return t('verdictRetry');
}

function finish() {
  setPhase('over');
  ui.hud.hidden = true;
  ui.streak.hidden = true;
  const record = game.score > game.best;
  if (record) {
    game.best = game.score;
    localStorage.setItem(BEST_KEY, String(game.best));
  }
  ui.final.textContent = String(game.score);
  ui.verdict.textContent = record && game.score > 0 ? t('newRecord', { verdict: verdictFor(game.hits) }) : verdictFor(game.hits);
  ui.hits.textContent = `${game.hits}/${HOLES}`;
  ui.perfects.textContent = String(game.perfects);
  ui.best.textContent = String(game.best);
  ui.over.hidden = false;
  ui.again.focus();
}

function newGame() {
  if (!game.ready) {
    game.wantStart = true;
    return;
  }
  game.wantStart = false;
  game.run += 1;
  Object.assign(game, { hole: 1, score: 0, streak: 0, hits: 0, perfects: 0, results: [], pending: null });
  ui.menu.hidden = true;
  ui.over.hidden = true;
  ui.hud.hidden = false;
  renderHud();
  if (game.atIdle) enterAim();
  else setPhase('waitIdle');
}

function renderMenu() {
  ui.menuBest.hidden = game.best <= 0;
  ui.menuBest.textContent = t('menuBest', { n: game.best });
}

function showMenu() {
  const fromPlay = PLAY_PHASES.includes(game.phase);
  game.run += 1;
  game.pending = null;
  cancelAnimationFrame(raf);
  clearTimeout(toastTimer);
  stage.classList.remove('is-charging');
  showMeter(false);
  ui.hint.hidden = true;
  ui.streak.hidden = true;
  ui.toast.classList.remove('is-on');
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

function showSettings() {
  setPhase('settings');
  ui.menu.hidden = true;
  ui.settings.hidden = false;
  ui.settings.scrollTop = 0;
  ui.closeSettings.focus({ preventScroll: true });
}

function renderDiff() {
  ui.settings.querySelectorAll('[data-diff]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.diff === game.diff));
  });
}

function chooseDiff(diff) {
  game.diff = diff;
  localStorage.setItem(DIFF_KEY, diff);
  renderDiff();
}

function chooseLang(lang) {
  setLang(lang);
  renderMenu();
}

function resize() {
  scene?.resizeDrawingSurfaceToCanvas();
  meter?.resizeDrawingSurfaceToCanvas();
}

function load(buffer) {
  let ready = 0;
  const done = () => {
    ready += 1;
    if (ready < 2) return;
    resize();
    game.ready = true;
    sceneCanvas.classList.add('is-ready');
    ui.best.textContent = String(game.best);
    if (game.wantStart) newGame();
  };

  const layout = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

  scene = new Rive({
    buffer: buffer.slice(0),
    canvas: sceneCanvas,
    stateMachine: SM,
    autoplay: true,
    autoBind: true,
    shouldDisableRiveListeners: true,
    layout,
    onLoad: done,
  });

  scene.on(EventType.StateChange, (e) => {
    const states = [].concat(e.data ?? []);
    if (states.includes('Idle')) onIdle();
    else if (states.length) setIdle(false);
    const result = states.map((s) => RESULT_BY_STATE[s]).find(Boolean);
    if (result) onResult(result);
  });

  meter = new Rive({
    buffer: buffer.slice(0),
    canvas: meterCanvas,
    artboard: 'Button',
    animations: ['FlagPosition'],
    autoplay: false,
    shouldDisableRiveListeners: true,
    layout: new Layout({ fit: Fit.Fill, alignment: Alignment.TopLeft }),
    onLoad: () => {
      meter.scrub('FlagPosition', 0);
      done();
    },
  });
}

stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.panel, .page, button')) return;
  e.preventDefault();
  stage.setPointerCapture?.(e.pointerId);
  startCharge();
});
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);
window.addEventListener('blur', release);

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat) return;
  if (game.phase === 'menu' || game.phase === 'settings' || game.phase === 'over') return;
  e.preventDefault();
  startCharge();
});
window.addEventListener('keyup', (e) => {
  if (e.code !== 'Space') return;
  e.preventDefault();
  release();
});

ui.start.addEventListener('click', newGame);
ui.again.addEventListener('click', newGame);
ui.toMenu.addEventListener('click', showMenu);
ui.quit.addEventListener('click', showMenu);
ui.openSettings.addEventListener('click', showSettings);
ui.closeSettings.addEventListener('click', showMenu);
ui.settings.querySelectorAll('[data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => chooseLang(btn.dataset.lang));
});

ui.settings.querySelectorAll('[data-diff]').forEach((btn) => {
  btn.addEventListener('click', () => chooseDiff(btn.dataset.diff));
});

applyTranslations();
renderDiff();
renderMenu();

window.addEventListener('resize', resize);

fetch('/golf.riv')
  .then((res) => res.arrayBuffer())
  .then(load);

