import { Platform, PermissionsAndroid } from 'react-native'
import messaging from '@react-native-firebase/messaging'

// Prefixed with the app name -- this Firebase project (verified-844f4) is
// shared with two other apps, and one FCM service-account key can send to
// any topic across all of them, so a generic name risks a collision.
const TOPICS = ['answerthis_new_questions', 'answerthis_announcements']

async function requestPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
  }
}

// Subscribes this device to the app's broadcast topics so it receives the
// "new questions" push (fired by a GitHub Action on every questions.json
// update) and admin announcements, without the app needing to register
// this device's token anywhere itself -- Firebase tracks topic subscribers.
export async function initNotifications() {
  try {
    await requestPermission()
    await Promise.all(TOPICS.map((t) => messaging().subscribeToTopic(t)))
  } catch (e) {
    console.warn('Notification setup failed:', e.message)
  }
}
