import { getGithubToken } from './adminAuth'

const OWNER = 'Airfohsah'
const REPO = 'answerthis'

// Admin devices can't hold the Firebase service-account key needed to send
// FCM messages directly (baking it into the app bundle would let anyone
// extract it and spam every install). Instead, the admin's existing GitHub
// token triggers a `repository_dispatch` event, and a GitHub Action (which
// does hold the key, as a repo secret) does the actual send.
export async function sendAnnouncement(title, body) {
  const token = await getGithubToken()
  if (!token) throw new Error('No GitHub token stored — admin must be set up first')

  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'send-announcement',
      client_payload: { title, body },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to trigger announcement (${res.status}): ${text}`)
  }
}
