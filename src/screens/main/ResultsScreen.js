import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { colors, fonts, radius } from '../../theme'
import { MODES } from '../../lib/gameConstants'

const MEDAL_COLORS = ['#f5c518', '#c0c0c0', '#cd7f32']

export default function ResultsScreen({ route, navigation }) {
  const { playersData, mode } = route.params
  const ranked = [...playersData].sort((a, b) => b.correct - a.correct)
  const topPct = ranked[0]?.total ? Math.round((ranked[0].correct / ranked[0].total) * 100) : 0
  const { icon, color, title } = trophyFor(topPct)
  const isMultiplayer = mode === MODES.MULTIPLAYER
  const singlePlayer = !isMultiplayer ? playersData[0] : null

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.trophyBlock}>
          <View style={[styles.trophyGlow, { backgroundColor: color + '20' }]}>
            <View style={[styles.trophyCircle, { borderColor: color + '60' }]}>
              <Ionicons name={icon} size={44} color={color} />
            </View>
          </View>
          <Text style={styles.trophyTitle}>{title}</Text>
        </View>

        <View style={styles.table}>
          {ranked.map((p, i) => {
            const pct = p.total ? Math.round((p.correct / p.total) * 100) : 0
            return (
              <View key={p.name + i} style={styles.row}>
                {i < 3 ? (
                  <Ionicons name="medal" size={22} color={MEDAL_COLORS[i]} style={styles.rankIcon} />
                ) : (
                  <Text style={styles.rank}>{i + 1}</Text>
                )}
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.score}>
                  {p.correct}/{p.total} ({pct}%)
                </Text>
              </View>
            )
          })}
        </View>

        {singlePlayer?.answerLog?.length > 0 && (
          <>
            <Text style={styles.reviewTitle}>Question Review</Text>
            {singlePlayer.answerLog.map((a, i) => (
              <View key={i} style={styles.reviewCard}>
                <Text style={styles.reviewQ}>{a.question}</Text>
                <View style={styles.reviewAnswerRow}>
                  <Ionicons
                    name={a.skipped ? 'remove-circle' : a.isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={15}
                    color={a.skipped ? colors.text3 : a.isCorrect ? colors.green : colors.red}
                  />
                  <Text style={[styles.reviewA, { color: a.isCorrect ? colors.green : colors.red }]}>
                    {a.skipped ? 'Skipped' : `Your answer: ${a.selected}`}
                  </Text>
                </View>
                {!a.isCorrect && <Text style={styles.reviewCorrect}>Correct: {a.correctAnswer}</Text>}
              </View>
            ))}
          </>
        )}

        <Button
          title="Play Again"
          onPress={() => navigation.navigate('MainTabs')}
          style={{ marginTop: 24, marginBottom: 12 }}
        />
        <Button title="Back to Home" variant="outline" onPress={() => navigation.navigate('MainTabs')} style={{ marginBottom: 40 }} />
      </ScrollView>
    </Screen>
  )
}

function trophyFor(pct) {
  if (pct >= 90) return { icon: 'trophy', color: '#f5c518', title: 'Outstanding!' }
  if (pct >= 70) return { icon: 'medal', color: colors.gold, title: 'Great job!' }
  if (pct >= 50) return { icon: 'ribbon', color: '#8b5cf6', title: 'Not bad!' }
  return { icon: 'stats-chart', color: colors.text3, title: 'Keep practicing' }
}

const styles = StyleSheet.create({
  trophyBlock: { alignItems: 'center', marginVertical: 24 },
  trophyGlow: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  trophyCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },
  trophyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginTop: 14 },
  table: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  rankIcon: { width: 28 },
  rank: { width: 28, fontFamily: fonts.displaySemibold, color: colors.text2 },
  name: { flex: 1, fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  score: { fontFamily: fonts.displaySemibold, color: colors.gold, fontSize: 13 },
  reviewTitle: { fontFamily: fonts.displaySemibold, fontSize: 15, color: colors.text, marginTop: 28, marginBottom: 12 },
  reviewCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginBottom: 8 },
  reviewQ: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13, marginBottom: 6 },
  reviewAnswerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewA: { fontFamily: fonts.body, fontSize: 12 },
  reviewCorrect: { fontFamily: fonts.body, fontSize: 12, color: colors.text3, marginTop: 2, marginLeft: 21 },
})
