import { useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { colors, fonts, radius } from '../../../theme'
import { useGameData } from '../../../context/DataProvider'
import { bulkDeleteQuestions, fetchAllQuestions } from '../../../lib/adminRepo'

export default function AdminBulkDeleteScreen() {
  const { refresh: refreshGameData } = useGameData()
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' })
    if (result.canceled) return
    const content = await FileSystem.readAsStringAsync(result.assets[0].uri)
    setRaw(content)
  }

  const runPreview = async () => {
    let ids
    try {
      ids = JSON.parse(raw)
      if (!Array.isArray(ids)) throw new Error('Expected a JSON array of ids')
    } catch (e) {
      Alert.alert('Invalid JSON', e.message)
      return
    }
    const existing = await fetchAllQuestions()
    const existingIds = new Set(existing.map((q) => q.id))
    const found = ids.filter((id) => existingIds.has(id))
    const notFound = ids.filter((id) => !existingIds.has(id))
    setPreview({ found, notFound })
  }

  const runDelete = () => {
    if (!preview?.found.length) return
    Alert.alert('Confirm delete', `Delete ${preview.found.length} question(s)? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true)
          try {
            await bulkDeleteQuestions(preview.found)
            refreshGameData()
            Alert.alert('Deleted', `${preview.found.length} question(s) removed.`)
            setPreview(null)
            setRaw('')
          } catch (e) {
            Alert.alert('Delete failed', e.message)
          } finally {
            setBusy(false)
          }
        },
      },
    ])
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Paste a JSON array of question ids</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={raw}
          onChangeText={setRaw}
          multiline
          placeholder='["bib_e1", "phy_m3"]'
          placeholderTextColor={colors.text3}
        />
        <Button icon="folder-open-outline" title="Load JSON file" variant="outline" onPress={pickFile} style={{ marginVertical: 12 }} />
        <Button icon="eye-outline" title="Preview" variant="outline" onPress={runPreview} />

        {preview && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLine}>
              {preview.found.length} found, {preview.notFound.length} not found
            </Text>
          </View>
        )}

        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} />
        ) : (
          preview?.found.length > 0 && <Button icon="trash-outline" title={`Delete ${preview.found.length} Question(s)`} variant="red" onPress={runDelete} style={{ marginTop: 16, marginBottom: 40 }} />
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  previewBox: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginTop: 12 },
  previewLine: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13 },
})
