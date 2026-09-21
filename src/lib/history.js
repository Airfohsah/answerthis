import AsyncStorage from '@react-native-async-storage/async-storage'

const HISTORY_KEY = 'answerthis_history'
const MAX_HISTORY = 500

// A game record: { id, mode, category, difficulty, players: [{name, correct, total, answerLog?}], playedAt }

export async function loadHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function saveGame(record) {
  const history = await loadHistory()
  history.unshift({ ...record, playedAt: record.playedAt || new Date().toISOString() })
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

function toLocalDateString(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Consecutive calendar days (device-local) with at least one game, walking
// backward from today; breaks on the first gap.
export function calcStreak(history) {
  if (!history.length) return 0
  const playedDates = new Set(history.map((g) => toLocalDateString(g.playedAt)))
  let streak = 0
  const cursor = new Date()
  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
    if (!playedDates.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeProfileStats(history) {
  if (!history.length) {
    return { gamesPlayed: 0, accuracy: 0, correctAnswers: 0, bestScore: 0 }
  }
  let correctAnswers = 0
  let totalAnswers = 0
  let bestScore = 0
  for (const game of history) {
    for (const p of game.players || []) {
      correctAnswers += p.correct || 0
      totalAnswers += p.total || 0
      const pct = p.total ? Math.round((p.correct / p.total) * 100) : 0
      if (pct > bestScore) bestScore = pct
    }
  }
  return {
    gamesPlayed: history.length,
    accuracy: totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
    correctAnswers,
    bestScore,
  }
}

export function computeHomeStats(history) {
  if (!history.length) return { totalGames: 0, avgScore: null }
  let sum = 0
  let count = 0
  for (const game of history) {
    for (const p of game.players || []) {
      if (p.total) {
        sum += Math.round((p.correct / p.total) * 100)
        count++
      }
    }
  }
  return { totalGames: history.length, avgScore: count ? Math.round(sum / count) : null }
}
