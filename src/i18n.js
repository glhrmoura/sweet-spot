const LANG_KEY = 'tacada.lang';

const messages = {
  'pt-BR': {
    docTitle: 'Sweet Spot · Golfe de um botão só no navegador',
    stageLabel: 'Campo de golfe. Segure para carregar a tacada e solte para bater.',
    hole: 'Buraco',
    points: 'Pontos',
    track: 'Resultado de cada buraco',
    hint: 'Pressione e segure',
    play: 'Jogar',
    settings: 'Configurações',
    language: 'Idioma',
    difficulty: 'Dificuldade',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    back: 'Voltar',
    menu: 'Menu',
    menuBest: 'Recorde {n}',
    gameOver: 'Fim de jogo',
    hits: 'Acertos',
    perfects: 'Perfeitas',
    best: 'Recorde',
    again: 'Jogar de novo',
    streak: '{n} seguidas',
    perfect: 'Perfeita!',
    newRecord: 'Novo recorde! {verdict}',
    pipLabel: 'Buraco {n}',
    pipResult: 'Buraco {n}: {result}',
    resultShort: 'curta',
    resultMade: 'no alvo',
    resultLong: 'longa',
    linesShort: ['Ficou curta', 'Faltou força', 'Quase lá'],
    linesMade: ['No alvo!', 'Bem no alvo!', 'Lindo!'],
    linesLong: ['Passou longe', 'Força demais', 'Lá se vai a bola'],
    verdictAll: 'Dez de dez. Mira perfeita.',
    verdictPro: 'Jogo de profissional.',
    verdictGood: 'Mandou bem, dá pra subir mais.',
    verdictLearning: 'Tá pegando o jeito.',
    verdictRetry: 'O verde é logo ali no meio. Bora de novo?',
  },
  en: {
    docTitle: 'Sweet Spot · One-button golf in your browser',
    stageLabel: 'Golf course. Hold to charge your swing and release to hit.',
    hole: 'Hole',
    points: 'Points',
    track: 'Result of each hole',
    hint: 'Press and hold',
    play: 'Play',
    settings: 'Settings',
    language: 'Language',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    back: 'Back',
    menu: 'Menu',
    menuBest: 'Best {n}',
    gameOver: 'Game over',
    hits: 'Hits',
    perfects: 'Perfects',
    best: 'Best',
    again: 'Play again',
    streak: '{n} in a row',
    perfect: 'Perfect!',
    newRecord: 'New record! {verdict}',
    pipLabel: 'Hole {n}',
    pipResult: 'Hole {n}: {result}',
    resultShort: 'short',
    resultMade: 'on target',
    resultLong: 'long',
    linesShort: ['Came up short', 'Needed more power', 'So close'],
    linesMade: ['On target!', 'Right on!', 'Beautiful!'],
    linesLong: ['Way too long', 'Too much power', 'There goes the ball'],
    verdictAll: 'Ten for ten. Perfect aim.',
    verdictPro: 'Playing like a pro.',
    verdictGood: 'Nice one, there is room to climb.',
    verdictLearning: 'You are getting the hang of it.',
    verdictRetry: 'The green is right in the middle. Again?',
  },
};

export const LANGS = Object.keys(messages);

let current = detect();

function detect() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && messages[saved]) return saved;
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'en') return 'en';
  }
  return 'en';
}

export function getLang() {
  return current;
}

export function t(key, vars = {}) {
  const value = messages[current][key] ?? messages['pt-BR'][key] ?? key;
  if (typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function applyTranslations(root = document) {
  document.documentElement.lang = current;
  document.title = t('docTitle');
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-label]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  });
  root.querySelectorAll('[data-lang]').forEach((el) => {
    el.setAttribute('aria-pressed', String(el.dataset.lang === current));
  });
}

export function setLang(lang) {
  if (!messages[lang]) return;
  current = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations();
}
