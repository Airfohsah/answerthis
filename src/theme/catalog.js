import { MODES } from '../lib/gameConstants'

// Presentational catalog shared by every screen that needs to show a
// category or game mode with a themed color + vector icon -- the bundled
// category/question data only carries a plain emoji, so this is the single
// place that maps ids to the new visual language (colored badge + icon).
export const CATEGORY_STYLE = {
  bible: { icon: 'bible', color: '#8b5cf6', set: 'fa5' },
  lifestyle: { icon: 'leaf', color: '#22c55e', set: 'ion' },
  physics: { icon: 'atom', color: '#3b82f6', set: 'mci' },
  maths: { icon: 'ruler-square', color: '#14b8a6', set: 'mci' },
  english: { icon: 'book', color: '#6366f1', set: 'ion' },
  government: { icon: 'bank', color: '#e11d48', set: 'mci' },
  history: { icon: 'script-text-outline', color: '#f59e0b', set: 'mci' },
  technology: { icon: 'laptop-outline', color: '#06b6d4', set: 'ion' },
  riddles: { icon: 'extension-puzzle', color: '#a78bfa', set: 'ion' },
  brainteasers: { icon: 'brain', color: '#ec4899', set: 'mci' },
  guesstheword: { icon: 'alphabetical-variant', color: '#38bdf8', set: 'mci' },
}
export const MIX_STYLE = { icon: 'dice-multiple', color: '#f97316', set: 'mci' }

export function categoryStyle(id) {
  return CATEGORY_STYLE[id] || MIX_STYLE
}

export const MODE_STYLE = {
  [MODES.QUESTION]: { label: 'Question Mode', desc: 'Answer a set number of questions', icon: 'comment-question', color: '#f59e0b', set: 'mci' },
  [MODES.COUNTDOWN]: { label: 'Countdown', desc: 'Answer as many as you can before time runs out', icon: 'timer-outline', color: '#8b5cf6', set: 'ion' },
  [MODES.SURVIVAL]: { label: 'Survival', desc: 'One life, gain/lose time per answer', icon: 'shield-checkmark', color: '#22c55e', set: 'ion' },
  [MODES.MULTIPLAYER]: { label: 'Multiplayer', desc: '2-10 players take turns', icon: 'people', color: '#ec4899', set: 'ion' },
}
