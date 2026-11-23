import { DEFAULT_DIFFICULTY, isDifficulty } from '@/config';
import { storage } from '@/storage';
import type { DifficultyKey, GameState } from '@/types';

function savedDifficulty(): DifficultyKey {
  const saved = storage.get('difficulty');
  return isDifficulty(saved) ? saved : DEFAULT_DIFFICULTY;
}

export const game: GameState = {
  phase: 'menu',
  ready: false,
  run: 0,
  wobblePhase: 0,
  diff: savedDifficulty(),
  wantStart: false,
  hole: 0,
  score: 0,
  streak: 0,
  hits: 0,
  perfects: 0,
  results: [],
  best: Number(storage.get('best')) || 0,
  atIdle: false,
  pace: 1,
  chargeStart: 0,
  pending: null,
};

export function resetRound(): void {
  Object.assign(game, { hole: 1, score: 0, streak: 0, hits: 0, perfects: 0, results: [], pending: null });
}
