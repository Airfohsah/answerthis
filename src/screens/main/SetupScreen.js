import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { Badge, Icon } from '../../components/Icon'
import { colors, fonts, radius } from '../../theme'
import { CATEGORY_STYLE, MIX_STYLE, MODE_STYLE } from '../../theme/catalog'
import { useGameData } from '../../context/DataProvider'
import {
  MODES,
  DIFFICULTIES,
  MIX_ALL_CATEGORIES,
  QUESTION_COUNT_MIN,
  QUESTION_COUNT_MAX,
  QUESTION_COUNT_STEP,
  QUESTION_COUNT_DEFAULT,
  DEFAULT_TIMES,
  CUSTOM_TIME_MIN,
  CUSTOM_TIME_MAX,
  MULTIPLAYER_MIN_PLAYERS,
  MULTIPLAYER_MAX_PLAYERS,
} from '../../lib/gameConstants'

export default function SetupScreen({ route, navigation }) {
  const { mode, presetCategory } = route.params
  const { categories } = useGameData()

  const [selectedCats, setSelectedCats] = useState(presetCategory ? [presetCategory] : [MIX_ALL_CATEGORIES])
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(QUESTION_COUNT_DEFAULT)
  const [timeMode, setTimeMode] = useState('default')
  const [customSeconds, setCustomSeconds] = useState(String(DEFAULT_TIMES.medium))
  const [players, setPlayers] = useState(['', ''])

  const isMix = selectedCats[0] === MIX_ALL_CATEGORIES

  const toggleCategory = (id) => {
    setSelectedCats((prev) => {
      if (id === MIX_ALL_CATEGORIES) return [MIX_ALL_CATEGORIES]
      const withoutMix = prev.filter((c) => c !== MIX_ALL_CATEGORIES)
      if (withoutMix.includes(id)) {
        const next = withoutMix.filter((c) => c !== id)
        return next.length ? next : [MIX_ALL_CATEGORIES]
      }
      return [...withoutMix, id]
    })
  }

  const timeLimitSeconds = useMemo(() => {
    if (timeMode === 'custom') {
      const n = parseInt(customSeconds, 10) || DEFAULT_TIMES[difficulty]
      return Math.min(CUSTOM_TIME_MAX, Math.max(CUSTOM_TIME_MIN, n))
    }
    return DEFAULT_TIMES[difficulty]
  }, [timeMode, customSeconds, difficulty])

  const updatePlayer = (idx, name) => {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? name : p)))
  }
  const addPlayer = () => setPlayers((prev) => (prev.length < MULTIPLAYER_MAX_PLAYERS ? [...prev, ''] : prev))
  const removePlayer = (idx) =>
    setPlayers((prev) => (prev.length > MULTIPLAYER_MIN_PLAYERS ? prev.filter((_, i) => i !== idx) : prev))

  const start = () => {
    const finalPlayers =
      mode === MODES.MULTIPLAYER
        ? players.map((p, i) => (p.trim() ? p.trim() : `Player ${i + 1}`))
        : ['You']
    navigation.navigate('Game', {
      mode,
      categoryIds: selectedCats,
      difficulty,
      questionCount,
      timeLimitSeconds,
      players: finalPlayers,
    })
  }

  const modeStyle = MODE_STYLE[mode] || MIX_STYLE

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Badge set={modeStyle.set} icon={modeStyle.icon} color={modeStyle.color} size={40} iconSize={20} />
          <Text style={styles.title}>{modeLabel(mode)}</Text>
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          <Chip label="Mix Everything" style={MIX_STYLE} active={isMix} onPress={() => toggleCategory(MIX_ALL_CATEGORIES)} />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              style={CATEGORY_STYLE[c.id] || MIX_STYLE}
              active={!isMix && selectedCats.includes(c.id)}
              onPress={() => toggleCategory(c.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              label={d[0].toUpperCase() + d.slice(1)}
              dotColor={DIFFICULTY_COLORS[d]}
              active={difficulty === d}
              onPress={() => setDifficulty(d)}
            />
          ))}
        </View>
        {difficulty === 'hard' && mode === MODES.QUESTION && (
          <Text style={styles.notice}>Hard mode: 30 seconds per question</Text>
        )}

        {(mode === MODES.QUESTION || mode === MODES.MULTIPLAYER) && (
          <>
            <Text style={styles.label}>Questions: {questionCount}</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuestionCount((c) => Math.max(QUESTION_COUNT_MIN, c - QUESTION_COUNT_STEP))}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Text style={styles.stepperVal}>{questionCount}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuestionCount((c) => Math.min(QUESTION_COUNT_MAX, c + QUESTION_COUNT_STEP))}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </>
        )}

        {mode === MODES.COUNTDOWN && (
          <>
            <Text style={styles.label}>Time Limit</Text>
            <View style={styles.chipRow}>
              <Chip label={`Default (${DEFAULT_TIMES[difficulty]}s)`} active={timeMode === 'default'} onPress={() => setTimeMode('default')} />
              <Chip label="Custom" active={timeMode === 'custom'} onPress={() => setTimeMode('custom')} />
            </View>
            {timeMode === 'custom' && (
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={customSeconds}
                onChangeText={setCustomSeconds}
                placeholder={`${CUSTOM_TIME_MIN}-${CUSTOM_TIME_MAX} seconds`}
                placeholderTextColor={colors.text3}
              />
            )}
          </>
        )}

        {mode === MODES.MULTIPLAYER && (
          <>
            <Text style={styles.label}>Players</Text>
            {players.map((p, i) => (
              <View key={i} style={styles.playerRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={p}
                  onChangeText={(t) => updatePlayer(i, t)}
                  placeholder={`Player ${i + 1}`}
                  placeholderTextColor={colors.text3}
                />
                {players.length > MULTIPLAYER_MIN_PLAYERS && (
                  <Pressable onPress={() => removePlayer(i)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={20} color={colors.red} />
                  </Pressable>
                )}
              </View>
            ))}
            {players.length < MULTIPLAYER_MAX_PLAYERS && (
              <Pressable onPress={addPlayer} style={styles.addPlayerBtn}>
                <Ionicons name="add-circle" size={16} color={colors.gold} />
                <Text style={{ color: colors.gold, fontFamily: fonts.bodyMedium }}>Add player</Text>
              </Pressable>
            )}
          </>
        )}

        <Button title="Start Game" onPress={start} style={{ marginTop: 24, marginBottom: 40 }} />
      </ScrollView>
    </Screen>
  )
}

function modeLabel(mode) {
  return { question: 'Question Mode', countdown: 'Countdown', survival: 'Survival', multiplayer: 'Multiplayer' }[mode] || mode
}

const DIFFICULTY_COLORS = { easy: colors.green, medium: colors.gold, hard: colors.red }

function Chip({ label, active, onPress, style, dotColor }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      {style && <Icon set={style.set} name={style.icon} size={13} color={active ? style.color : colors.text3} />}
      {dotColor && <View style={[styles.chipDot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: 'rgba(245,166,35,0.15)', borderColor: colors.gold },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.gold, fontFamily: fonts.bodyMedium },
  notice: { fontFamily: fonts.body, fontSize: 12, color: colors.gold, marginTop: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepperText: { color: colors.gold, fontSize: 20, fontFamily: fonts.displaySemibold },
  stepperVal: { fontFamily: fonts.displaySemibold, fontSize: 18, color: colors.text, minWidth: 30, textAlign: 'center' },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body, marginBottom: 10 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeBtn: { padding: 8 },
  addPlayerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
})
