// Mirrors the exact rules audited from the original index.html so gameplay
// behavior doesn't drift during the native port.
export const MODES = {
  QUESTION: 'question',
  COUNTDOWN: 'countdown',
  SURVIVAL: 'survival',
  MULTIPLAYER: 'multiplayer',
}

export const DIFFICULTIES = ['easy', 'medium', 'hard']

// Countdown mode: default whole-session time budget by difficulty, used
// unless the player picks a custom time limit in Setup.
export const DEFAULT_TIMES = { easy: 60, medium: 90, hard: 120 }

// Question mode, Hard difficulty only: per-question ring timer. Easy/medium
// Question-mode games have no timer at all.
export const HARD_QUESTION_TIME_LIMIT = 30

// Survival mode always starts at 60s regardless of chosen difficulty --
// difficulty only changes which question pool is drawn from.
export const SURVIVAL_START_TIME = 60
export const SURVIVAL_PENALTIES = { correct: 5, wrong: -10, skip: -5 }

// Countdown mode, Hard difficulty only: penalties stack on top of the
// ticking ring timer. Easy/medium Countdown games have no penalties.
export const COUNTDOWN_HARD_PENALTIES = { wrong: -10, skip: -5 }

export const QUESTION_COUNT_MIN = 5
export const QUESTION_COUNT_MAX = 50
export const QUESTION_COUNT_STEP = 5
export const QUESTION_COUNT_DEFAULT = 10

export const CUSTOM_TIME_MIN = 15
export const CUSTOM_TIME_MAX = 600

export const MULTIPLAYER_MIN_PLAYERS = 2
export const MULTIPLAYER_MAX_PLAYERS = 10
export const MULTIPLAYER_TRANSITION_SECONDS = 3

export const MIX_ALL_CATEGORIES = '__mix__'
