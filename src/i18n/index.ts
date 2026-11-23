import { storage } from '@/storage';
import type { Lang } from '@/types';
import { en } from '@/i18n/locales/en';
import { ptBR, type Messages } from '@/i18n/locales/pt-br';

type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

export type TextKey = KeysOfType<Messages, string>;
export type LineKey = KeysOfType<Messages, string[]>;
type Vars = Record<string, string | number>;

const messages: Record<Lang, Messages> = {
  'pt-BR': ptBR,
  en,
};

const FALLBACK: Lang = 'en';

export function isLang(value: string | null | undefined): value is Lang {
  return value != null && value in messages;
}

function detect(): Lang {
  const saved = storage.get('lang');
  if (isLang(saved)) return saved;
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'en') return 'en';
  }
  return FALLBACK;
}

let current = detect();

export function getLang(): Lang {
  return current;
}

export function t(key: TextKey, vars: Vars = {}): string {
  return messages[current][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
}

export function lines(key: LineKey): string[] {
  return messages[current][key];
}

function translate(root: ParentNode, attribute: string, apply: (element: HTMLElement, text: string) => void): void {
  root.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach((element) => {
    const key = element.getAttribute(attribute) as TextKey;
    apply(element, t(key));
  });
}

export function applyTranslations(root: ParentNode = document): void {
  document.documentElement.lang = current;
  document.title = t('docTitle');
  translate(root, 'data-i18n', (element, text) => {
    element.textContent = text;
  });
  translate(root, 'data-i18n-label', (element, text) => {
    element.setAttribute('aria-label', text);
  });
  root.querySelectorAll<HTMLElement>('[data-lang]').forEach((element) => {
    element.setAttribute('aria-pressed', String(element.dataset.lang === current));
  });
}

export function setLang(lang: Lang): void {
  current = lang;
  storage.set('lang', lang);
  applyTranslations();
}
