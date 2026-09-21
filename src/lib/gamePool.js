import AsyncStorage from '@react-native-async-storage/async-storage'
import { MIX_ALL_CATEGORIES } from './gameConstants'

// Fisher-Yates. The web version seeded this from crypto.getRandomValues with
// a hand-rolled LCG fallback -- for a trivia shuffle that's not worth the
// extra native-crypto dependency, Math.random is unbiased enough here.
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function seenKey(categoryIds, difficulty) {
  const sorted = [...categoryIds].sort().join(',')
  return `answerthis_seen_${sorted}+${difficulty}`
}

export async function getSeenIds(categoryIds, difficulty) {
  const raw = await AsyncStorage.getItem(seenKey(categoryIds, difficulty))
  return raw ? JSON.parse(raw) : []
}

export async function markAsSeen(categoryIds, difficulty, ids) {
  const existing = await getSeenIds(categoryIds, difficulty)
  const merged = Array.from(new Set([...existing, ...ids]))
  await AsyncStorage.setItem(seenKey(categoryIds, difficulty), JSON.stringify(merged))
}

export async function resetSeen(categoryIds, difficulty) {
  await AsyncStorage.removeItem(seenKey(categoryIds, difficulty))
}

// categoryIds: array of category id strings, or [] / MIX_ALL_CATEGORIES for all.
export async function getUnseenPool(allQuestions, categoryIds, difficulty) {
  const isMix = !categoryIds?.length || categoryIds[0] === MIX_ALL_CATEGORIES
  const catList = isMix ? null : categoryIds

  const byCatAndDiff = allQuestions.filter(
    (q) => (!catList || catList.includes(q.category)) && q.difficulty === difficulty
  )
  const byCatOnly = allQuestions.filter((q) => !catList || catList.includes(q.category))
  const byDiffOnly = allQuestions.filter((q) => q.difficulty === difficulty)

  // Progressive fallback so a narrow category+difficulty combo never dead-ends
  // an empty pool: category+difficulty -> category only -> difficulty only -> all.
  let pool = byCatAndDiff.length ? byCatAndDiff : byCatOnly.length ? byCatOnly : byDiffOnly.length ? byDiffOnly : allQuestions

  const seenIds = new Set(await getSeenIds(catList || ['all'], difficulty))
  let unseen = pool.filter((q) => !seenIds.has(q.id))

  if (!unseen.length) {
    // Exhausted this pool -- reset and start the cycle over rather than
    // dead-ending the player.
    await resetSeen(catList || ['all'], difficulty)
    unseen = pool
  }

  return { pool: unseen, seenScopeCategoryIds: catList || ['all'] }
}
