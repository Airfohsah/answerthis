import { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { Icon } from '../../../components/Icon'
import { colors, fonts, radius } from '../../../theme'
import { CATEGORY_STYLE, MIX_STYLE } from '../../../theme/catalog'
import { useGameData } from '../../../context/DataProvider'
import { validateQuestion, upsertQuestion } from '../../../lib/adminRepo'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function AdminQuestionEditScreen({ route, navigation }) {
  const existing = route.params?.question
  const { categories, refresh: refreshGameData } = useGameData()

  const [category, setCategory] = useState(existing?.category || categories[0]?.id || '')
  const [difficulty, setDifficulty] = useState(existing?.difficulty || 'medium')
  const [type, setType] = useState(existing?.type || 'multiple')
  const [question, setQuestion] = useState(existing?.question || '')
  const [options, setOptions] = useState(existing?.options?.length ? [...existing.options] : ['', '', '', ''])
  const [answer, setAnswer] = useState(existing?.answer || '')
  const [saving, setSaving] = useState(false)

  const updateOption = (i, v) => setOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)))
  const addOption = () => options.length < 6 && setOptions((prev) => [...prev, ''])

  const save = async () => {
    const draft = {
      id: existing?.id || `q${Date.now()}`,
      question,
      category,
      difficulty,
      type,
      options,
      answer,
    }
    const error = validateQuestion(draft, categories.map((c) => c.id))
    if (error) {
      Alert.alert('Cannot save', error)
      return
    }
    setSaving(true)
    try {
      await upsertQuestion(draft)
      refreshGameData()
      navigation.goBack()
    } catch (e) {
      Alert.alert('Save failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Question</Text>
        <TextInput style={[styles.input, styles.multiline]} value={question} onChangeText={setQuestion} multiline placeholder="Question text" placeholderTextColor={colors.text3} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {categories.map((c) => {
            const style = CATEGORY_STYLE[c.id] || MIX_STYLE
            return <Chip key={c.id} label={c.name} style={style} active={category === c.id} onPress={() => setCategory(c.id)} />
          })}
        </View>

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map((d) => (
            <Chip key={d} label={d} active={difficulty === d} onPress={() => setDifficulty(d)} />
          ))}
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          <Chip label="Multiple Choice" active={type === 'multiple'} onPress={() => setType('multiple')} />
          <Chip label="Text Answer" active={type === 'text'} onPress={() => setType('text')} />
        </View>

        {type === 'multiple' ? (
          <>
            <Text style={styles.label}>Options (tap to mark correct)</Text>
            {options.map((opt, i) => (
              <View key={i} style={styles.optionRow}>
                <Pressable onPress={() => setAnswer(opt)} style={[styles.correctDot, answer === opt && opt && styles.correctDotActive]}>
                  {answer === opt && opt && <Ionicons name="checkmark" size={13} color="#000" />}
                </Pressable>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={opt}
                  onChangeText={(v) => updateOption(i, v)}
                  placeholder={`Option ${i + 1}`}
                  placeholderTextColor={colors.text3}
                />
              </View>
            ))}
            {options.length < 6 && (
              <Pressable onPress={addOption} style={styles.addOptionBtn}>
                <Ionicons name="add-circle" size={16} color={colors.gold} />
                <Text style={{ color: colors.gold, fontFamily: fonts.bodyMedium }}>Add option</Text>
              </Pressable>
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>Correct Answer</Text>
            <TextInput style={styles.input} value={answer} onChangeText={setAnswer} placeholder="Answer" placeholderTextColor={colors.text3} />
          </>
        )}

        {saving ? <ActivityIndicator color={colors.gold} style={{ marginTop: 20 }} /> : <Button icon="checkmark" title="Save" onPress={save} style={{ marginTop: 24, marginBottom: 40 }} />}
      </ScrollView>
    </Screen>
  )
}

function Chip({ label, active, onPress, style }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      {style && <Icon set={style.set} name={style.icon} size={13} color={active ? style.color : colors.text3} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body, marginBottom: 8 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: 'rgba(245,166,35,0.15)', borderColor: colors.gold },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.text2, textTransform: 'capitalize' },
  chipTextActive: { color: colors.gold, fontFamily: fonts.bodyMedium },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  correctDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  correctDotActive: { backgroundColor: colors.green, borderColor: colors.green },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
})
