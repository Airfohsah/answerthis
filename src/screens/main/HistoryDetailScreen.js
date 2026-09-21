import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../components/Screen'
import { colors, fonts, radius } from '../../theme'

export default function HistoryDetailScreen({ route }) {
  const { record } = route.params

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{new Date(record.playedAt).toLocaleString()}</Text>

        {record.players.map((p, i) => {
          const pct = p.total ? Math.round((p.correct / p.total) * 100) : 0
          return (
            <View key={i} style={styles.playerRow}>
              <Text style={styles.playerName}>{p.name}</Text>
              <Text style={styles.playerScore}>
                {p.correct}/{p.total} ({pct}%)
              </Text>
            </View>
          )
        })}

        {record.answerLog?.length > 0 && (
          <>
            <Text style={styles.reviewTitle}>Questions</Text>
            {record.answerLog.map((a, i) => (
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
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displaySemibold, fontSize: 16, color: colors.text, marginBottom: 16 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginBottom: 8 },
  playerName: { fontFamily: fonts.bodyMedium, color: colors.text },
  playerScore: { fontFamily: fonts.displaySemibold, color: colors.gold },
  reviewTitle: { fontFamily: fonts.displaySemibold, fontSize: 15, color: colors.text, marginTop: 20, marginBottom: 12 },
  reviewCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginBottom: 8 },
  reviewQ: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13, marginBottom: 6 },
  reviewAnswerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewA: { fontFamily: fonts.body, fontSize: 12 },
  reviewCorrect: { fontFamily: fonts.body, fontSize: 12, color: colors.text3, marginTop: 2, marginLeft: 21 },
})
