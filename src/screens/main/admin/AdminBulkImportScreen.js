import { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { colors, fonts, radius } from '../../../theme'
import { useGameData } from '../../../context/DataProvider'
import { validateQuestion, bulkInsertQuestions } from '../../../lib/adminRepo'

const TEMPLATE = JSON.stringify(
  [
    { question: 'Which planet is known as the Red Planet?', category: 'physics', difficulty: 'easy', type: 'multiple', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 'Mars' },
    { question: 'What is the capital of Nigeria?', category: 'lifestyle', difficulty: 'easy', type: 'text', answer: 'Abuja' },
  ],
  null,
  2
)

export default function AdminBulkImportScreen() {
  const { categories, refresh: refreshGameData } = useGameData()
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  const categoryIds = categories.map((c) => c.id)

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' })
    if (result.canceled) return
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri)
    setRaw(content)
  }

  const runPreview = () => {
    let items
    try {
      items = JSON.parse(raw)
      if (!Array.isArray(items)) throw new Error('Expected a JSON array')
    } catch (e) {
      Alert.alert('Invalid JSON', e.message)
      return
    }
    const valid = []
    const invalid = []
    for (const item of items) {
      const draft = { ...item, type: item.type || 'multiple' }
      const error = validateQuestion(draft, categoryIds)
      if (error) invalid.push({ item: draft, error })
      else valid.push({ ...draft, id: draft.id || `q${Date.now()}_${valid.length}` })
    }
    setPreview({ valid, invalid })
  }

  const runImport = async () => {
    if (!preview?.valid.length) return
    setBusy(true)
    try {
      await bulkInsertQuestions(preview.valid)
      refreshGameData()
      Alert.alert('Imported', `${preview.valid.length} question(s) added.`)
      setPreview(null)
      setRaw('')
    } catch (e) {
      Alert.alert('Import failed', e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Expected shape</Text>
        <View style={styles.templateBox}>
          <Text style={styles.templateText}>{TEMPLATE}</Text>
        </View>

        <Button icon="folder-open-outline" title="Load JSON file" variant="outline" onPress={pickFile} style={{ marginVertical: 12 }} />

        <Text style={styles.label}>Or paste JSON</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={raw}
          onChangeText={setRaw}
          multiline
          placeholder="Paste a JSON array of questions"
          placeholderTextColor={colors.text3}
        />

        <Button icon="eye-outline" title="Preview" variant="outline" onPress={runPreview} style={{ marginTop: 12 }} />

        {preview && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLine}>{preview.valid.length} valid, {preview.invalid.length} invalid</Text>
            {preview.invalid.slice(0, 5).map((p, i) => (
              <Text key={i} style={styles.invalidLine}>
                • {p.error}: {(p.item.question || '').slice(0, 40)}
              </Text>
            ))}
          </View>
        )}

        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} />
        ) : (
          preview?.valid.length > 0 && <Button icon="cloud-upload-outline" title={`Import ${preview.valid.length} Question(s)`} onPress={runImport} style={{ marginTop: 16, marginBottom: 40 }} />
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  templateBox: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 10 },
  templateText: { fontFamily: 'monospace', fontSize: 10, color: colors.text3 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
  previewBox: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginTop: 12 },
  previewLine: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13, marginBottom: 6 },
  invalidLine: { fontFamily: fonts.body, color: colors.red, fontSize: 11, marginBottom: 2 },
})
