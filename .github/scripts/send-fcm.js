const { GoogleAuth } = require('google-auth-library')

async function main() {
  const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT_JSON
  const topic = process.env.NOTIFY_TOPIC
  const title = process.env.NOTIFY_TITLE
  const body = process.env.NOTIFY_BODY

  if (!serviceAccountJson) throw new Error('FCM_SERVICE_ACCOUNT_JSON secret is not set')
  if (!topic || !title || !body) throw new Error('NOTIFY_TOPIC, NOTIFY_TITLE and NOTIFY_BODY must all be set')

  const credentials = JSON.parse(serviceAccountJson)
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${credentials.project_id}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        topic,
        notification: { title, body },
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`FCM send failed (${res.status}): ${text}`)
  }

  console.log(`Notification sent to topic "${topic}"`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
