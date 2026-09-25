import { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { colors, fonts, radius } from '../../../theme'
import { sendAnnouncement } from '../../../lib/notify'

export default function AdminNotifyScreen() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing text', 'Enter both a title and a message.')
      return
    }
    setSending(true)
    try {
      await sendAnnouncement(title.trim(), body.trim())
      Alert.alert('Sent', 'Announcement triggered. It should reach devices within a minute or two.')
      setTitle('')
      setBody('')
    } catch (e) {
      Alert.alert('Send failed', e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. New questions are live!"
          placeholderTextColor={colors.text3}
          maxLength={80}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="What do you want to tell players?"
          placeholderTextColor={colors.text3}
          maxLength={200}
        />

        {sending ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
        ) : (
          <Button icon="megaphone-outline" title="Send Announcement" onPress={send} style={{ marginTop: 20, marginBottom: 40 }} />
        )}

        <Text style={styles.hint}>Goes out to every device with the app installed, via push notification.</Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.text3, marginTop: 8, textAlign: 'center' },
})
