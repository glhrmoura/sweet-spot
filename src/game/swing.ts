import { DIFFICULTIES, FLAG_END, MADE_UNTIL, PERFECT_CENTER, PERFECT_RANGE, SHORT_UNTIL } from '@/config';
import type { GameState, Outcome } from '@/types';

type SwingState = Pick<GameState, 'diff' | 'pace' | 'wobblePhase' | 'hole'>;

export function travelTime({ diff, hole }: SwingState): number {
  const difficulty = DIFFICULTIES[diff];
  return Math.max(difficulty.min, difficulty.start - (hole - 1) * difficulty.step);
}

export function flagTimeAt(elapsed: number, state: SwingState): number {
  const difficulty = DIFFICULTIES[state.diff];
  const period = travelTime(state) * state.pace;
  const wobble = Math.min(difficulty.wobbleMax, (state.hole - 1) * difficulty.wobble);
  const omega = (2 * Math.PI) / (period * 1.7);
  const drift = (wobble * (Math.cos(state.wobblePhase) - Math.cos(omega * elapsed + state.wobblePhase))) / omega;
  const phase = ((elapsed + drift) / period) * Math.PI;
  return ((1 - Math.cos(phase)) / 2) * FLAG_END;
}

export function outcomeFor(flag: number): Outcome {
  if (flag < SHORT_UNTIL) return 1;
  if (flag < MADE_UNTIL) return 2;
  return 3;
}

export function isPerfect(flag: number, outcome: Outcome): boolean {
  return outcome === 2 && Math.abs(flag - PERFECT_CENTER) <= PERFECT_RANGE;
}

export function randomPace(jitter: number): number {
  return 1 - jitter + Math.random() * jitter * 2;
}
