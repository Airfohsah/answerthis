import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

const PIN_HASH_KEY = 'answerthis_admin_pin'
const SALT_KEY = 'answerthis_admin_salt'
const TOKEN_KEY = 'answerthis_admin_gh_token'

async function hashPin(pin, salt) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`)
}

export async function hasAdminSetup() {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY)
  return !!hash
}

// Fails fast if the token can't actually read the repo, so a typo'd PAT is
// caught at setup time instead of surfacing later as a broken push.
export async function verifyGithubToken(token) {
  const res = await fetch('https://api.github.com/repos/Airfohsah/answerthis', {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(res.status === 401 ? 'Invalid GitHub token' : `GitHub check failed (${res.status})`)
}

export async function setupAdmin(pin, githubToken) {
  await verifyGithubToken(githubToken)
  const salt = Crypto.randomUUID()
  const hash = await hashPin(pin, salt)
  await SecureStore.setItemAsync(SALT_KEY, salt)
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash)
  await SecureStore.setItemAsync(TOKEN_KEY, githubToken)
}

export async function verifyPin(pin) {
  const salt = await SecureStore.getItemAsync(SALT_KEY)
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY)
  if (!salt || !storedHash) return false
  const hash = await hashPin(pin, salt)
  return hash === storedHash
}

export async function getGithubToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function resetAdmin() {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY)
  await SecureStore.deleteItemAsync(SALT_KEY)
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
