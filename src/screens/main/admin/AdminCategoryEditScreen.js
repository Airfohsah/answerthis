import { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { Icon } from '../../../components/Icon'
import { colors, fonts, radius } from '../../../theme'
import { CATEGORY_STYLE, MIX_STYLE } from '../../../theme/catalog'
import { useGameData } from '../../../context/DataProvider'
import { upsertCategory, deleteCategory } from '../../../lib/adminRepo'

export default function AdminCategoryEditScreen({ route, navigation }) {
  const existing = route.params?.category
  const deleteRequested = route.params?.deleteRequested
  const questionCount = route.params?.questionCount || 0
  const { categories, refresh: refreshGameData } = useGameData()

  const [id, setId] = useState(existing?.id || '')
  const [name, setName] = useState(existing?.name || '')
  const [icon, setIcon] = useState(existing?.icon || '')
  const [reassignTo, setReassignTo] = useState(null)
  const [busy, setBusy] = useState(false)

  const otherCategories = categories.filter((c) => c.id !== existing?.id)

  const save = async () => {
    const cleanId = id.trim().toLowerCase().replace(/\s+/g, '')
    if (!cleanId || !name.trim() || !icon.trim()) {
      Alert.alert('Cannot save', 'Id, name, and icon are all required')
      return
    }
    setBusy(true)
    try {
      await upsertCategory({ id: existing?.id || cleanId, name, icon })
      refreshGameData()
      navigation.goBack()
    } catch (e) {
      Alert.alert('Save failed', e.message)
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (questionCount > 0 && !reassignTo) {
      Alert.alert('Pick a category first', `${questionCount} question(s) still belong to this category. Choose where to move them before deleting.`)
      return
    }
    setBusy(true)
    try {
      await deleteCategory(existing.id, reassignTo)
      refreshGameData()
      navigation.goBack()
    } catch (e) {
      Alert.alert('Delete failed', e.message)
    } finally {
      setBusy(false)
    }
  }

  if (deleteRequested) {
    return (
      <Screen>
        <Text style={styles.title}>Delete "{existing.name}"</Text>
        {questionCount > 0 ? (
          <>
            <Text style={styles.warning}>
              {questionCount} question(s) are still assigned to this category. Pick a category to move them to before deleting — they won't be
              silently orphaned.
            </Text>
            <View style={styles.chipRow}>
              {otherCategories.map((c) => {
                const style = CATEGORY_STYLE[c.id] || MIX_STYLE
                const active = reassignTo === c.id
                return (
                  <Pressable key={c.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setReassignTo(c.id)}>
                    <Icon set={style.set} name={style.icon} size={13} color={active ? style.color : colors.text3} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                  </Pressable>
                )
              })}
            </View>
          </>
        ) : (
          <Text style={styles.warning}>This category has no questions. Safe to delete.</Text>
        )}
        {busy ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} />
        ) : (
          <Button icon="trash-outline" title="Confirm Delete" variant="red" onPress={confirmDelete} style={{ marginTop: 20 }} />
        )}
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Id (slug)</Text>
        <TextInput style={styles.input} value={id} onChangeText={setId} editable={!existing} autoCapitalize="none" placeholder="e.g. history" placeholderTextColor={colors.text3} />
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor={colors.text3} />
        <Text style={styles.label}>Icon (emoji)</Text>
        <TextInput style={styles.input} value={icon} onChangeText={setIcon} maxLength={4} placeholder="🎯" placeholderTextColor={colors.text3} />

        {busy ? <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} /> : <Button icon="checkmark" title="Save" onPress={save} style={{ marginTop: 20 }} />}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displaySemibold, fontSize: 17, color: colors.text, marginBottom: 12 },
  warning: { fontFamily: fonts.body, fontSize: 13, color: colors.text2, lineHeight: 20, marginBottom: 16 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: 'rgba(245,166,35,0.15)', borderColor: colors.gold },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.gold, fontFamily: fonts.bodyMedium },
})
