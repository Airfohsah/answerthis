import { getGithubToken } from './adminAuth'

const OWNER = 'Airfohsah'
const REPO = 'answerthis'
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`

function toBase64(str) {
  // btoa only handles Latin1; questions data can contain non-ASCII text
  // (accents, emoji in options, etc.), so encode via UTF-8 bytes first.
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

function fromBase64(b64) {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function authHeaders() {
  const token = await getGithubToken()
  if (!token) throw new Error('No GitHub token stored — admin must be set up first')
  return { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
}

// Returns { data, sha } — sha is required by the contents API to update an
// existing file (GitHub rejects a PUT without the current sha as a conflict).
export async function getFile(path) {
  const res = await fetch(`${API_BASE}/${path}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(`Failed to read ${path} from GitHub (${res.status})`)
  const json = await res.json()

  // The Contents API only inlines `content` for files under ~1MB -- above
  // that it comes back as an empty string (questions.json crossed this
  // threshold once the canonical dataset was merged in). Fall back to the
  // Git Data (blobs) API via `git_url`, which supports files up to 100MB.
  let base64 = json.content
  if (!base64) {
    const blobRes = await fetch(json.git_url, { headers: await authHeaders() })
    if (!blobRes.ok) throw new Error(`Failed to read ${path} blob from GitHub (${blobRes.status})`)
    base64 = (await blobRes.json()).content
  }

  return { data: JSON.parse(fromBase64(base64)), sha: json.sha }
}

export async function putFile(path, dataObj, sha, message) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: toBase64(JSON.stringify(dataObj, null, 2)),
      sha,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Failed to push ${path} to GitHub (${res.status}): ${body}`)
  }
  const json = await res.json()
  return { sha: json.content.sha }
}
