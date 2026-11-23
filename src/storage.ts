const KEYS = {
  best: 'tacada.best',
  difficulty: 'tacada.diff',
  lang: 'tacada.lang',
} as const;

type StorageKey = keyof typeof KEYS;

export const storage = {
  get(key: StorageKey): string | null {
    return localStorage.getItem(KEYS[key]);
  },
  set(key: StorageKey, value: string | number): void {
    localStorage.setItem(KEYS[key], String(value));
  },
};
