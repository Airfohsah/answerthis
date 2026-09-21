import { getUnseenPool, shuffle } from './gamePool'
import { MODES } from './gameConstants'

const SURVIVAL_INITIAL_POOL = 200

// Builds the per-player question queues for a game session. Multiplayer:
// every player draws from the same base set (so games are size-comparable)
// but each gets an independent shuffle order.
export async function buildGame({ mode, categoryIds, difficulty, questionCount, players, allQuestions }) {
  const { pool } = await getUnseenPool(allQuestions, categoryIds, difficulty)
  const shuffled = shuffle(pool)

  let baseSet
  if (mode === MODES.SURVIVAL) {
    baseSet = shuffled.slice(0, SURVIVAL_INITIAL_POOL)
  } else if (mode === MODES.COUNTDOWN) {
    baseSet = shuffled
  } else {
    baseSet = shuffled.slice(0, questionCount)
  }

  const refillSource = shuffled

  return players.map((name) => ({
    name,
    queue: mode === MODES.MULTIPLAYER || mode === MODES.QUESTION ? shuffle(baseSet) : shuffle(baseSet),
    refillSource,
    correct: 0,
    total: 0,
    answerLog: [],
  }))
}

export function refillQueue(player) {
  const more = shuffle(player.refillSource)
  player.queue = [...player.queue, ...more]
}
