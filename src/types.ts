import type { LineKey, TextKey } from '@/i18n';

export type Lang = 'pt-BR' | 'en';

export type DifficultyKey = 'easy' | 'medium' | 'hard';

export interface Difficulty {
  start: number;
  step: number;
  min: number;
  jitter: number;
  wobble: number;
  wobbleMax: number;
}

export type Phase = 'menu' | 'settings' | 'waitIdle' | 'aim' | 'charging' | 'flight' | 'result' | 'over';

export type Outcome = 1 | 2 | 3;

export type ResultKey = 'short' | 'made' | 'long';

export interface ResultInfo {
  key: ResultKey;
  state: string;
  arrival: number;
  lines: LineKey;
  label: TextKey;
}

export interface PendingShot {
  outcome: Outcome;
  perfect: boolean;
}

export interface GameState {
  phase: Phase;
  ready: boolean;
  run: number;
  wobblePhase: number;
  diff: DifficultyKey;
  wantStart: boolean;
  hole: number;
  score: number;
  streak: number;
  hits: number;
  perfects: number;
  results: ResultKey[];
  best: number;
  atIdle: boolean;
  pace: number;
  chargeStart: number;
  pending: PendingShot | null;
}
