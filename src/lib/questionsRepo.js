import AsyncStorage from '@react-native-async-storage/async-storage'
import bundledData from '../data/questions.json'

const CACHE_KEY = 'answerthis_data_cache'
const CONTENT_URL = 'https://airfohsah.github.io/answerthis/questions.json'

// Loads categories+questions with a three-tier fallback: the public static
// JSON on GitHub Pages, then the last successful fetch cached on-device, then
// the dataset bundled into the app itself -- so the game is always playable,
// even offline on first launch before anything has ever synced.
export async function loadData() {
  try {
    const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`)
    if (!res.ok) throw new Error(`Content fetch failed (${res.status})`)
    const data = await res.json()
    if (data?.categories?.length && data?.questions?.length) {
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {})
      return data
    }
  } catch (e) {
    // fall through to cache/bundle
  }

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached)
  } catch (e) {
    // fall through to bundle
  }

  return bundledData
}
