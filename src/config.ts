import type { Difficulty, DifficultyKey, Outcome, Phase, ResultInfo, ResultKey } from '@/types';

export const RIVE_URL = '/golf.riv';
export const STATE_MACHINE = 'State Machine 1';
export const METER_ARTBOARD = 'Button';
export const FLAG_ANIMATION = 'FlagPosition';
export const OUTCOME_INPUT = 'Number 1';
export const SWING_TRIGGER = 'Click';
export const IDLE_STATE = 'Idle';

export const HOLES = 10;
export const FLAG_END = 1.0;
export const SHORT_UNTIL = 0.265;
export const MADE_UNTIL = 0.615;
export const PERFECT_CENTER = (SHORT_UNTIL + MADE_UNTIL) / 2;
export const PERFECT_RANGE = 0.025;

export const HIDE_AT = 2750;
export const FADE_MS = 300;
export const TOAST_MS = 1700;
export const NEXT_HOLE_DELAY = 1300;

export const POINTS = {
  hit: 100,
  streak: 25,
  perfect: 50,
} as const;

export const DIFFICULTIES: Record<DifficultyKey, Difficulty> = {
  easy: { start: 1.1, step: 0.06, min: 0.55, jitter: 0.15, wobble: 0.025, wobbleMax: 0.2 },
  medium: { start: 0.8, step: 0.05, min: 0.38, jitter: 0.2, wobble: 0.045, wobbleMax: 0.4 },
  hard: { start: 0.6, step: 0.04, min: 0.3, jitter: 0.25, wobble: 0.06, wobbleMax: 0.55 },
};

export const DEFAULT_DIFFICULTY: DifficultyKey = 'medium';

export const PLAY_PHASES: readonly Phase[] = ['waitIdle', 'aim', 'charging', 'flight', 'result'];
export const MENU_PHASES: readonly Phase[] = ['menu', 'settings', 'over'];

export const RESULTS: Record<Outcome, ResultInfo> = {
  1: { key: 'short', state: 'ShortMiss', arrival: 1850, lines: 'linesShort', label: 'resultShort' },
  2: { key: 'made', state: 'Madeit', arrival: 2150, lines: 'linesMade', label: 'resultMade' },
  3: { key: 'long', state: 'LongMiss', arrival: 1150, lines: 'linesLong', label: 'resultLong' },
};

const OUTCOMES: Outcome[] = [1, 2, 3];

export const OUTCOME_BY_STATE = new Map<string, Outcome>(OUTCOMES.map((n) => [RESULTS[n].state, n]));

export const RESULT_BY_KEY = Object.fromEntries(OUTCOMES.map((n) => [RESULTS[n].key, RESULTS[n]])) as Record<
  ResultKey,
  ResultInfo
>;

export function isDifficulty(value: string | null | undefined): value is DifficultyKey {
  return value != null && value in DIFFICULTIES;
}
