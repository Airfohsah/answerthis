import { useState, useCallback } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../components/Screen'
import { Badge } from '../../components/Icon'
import { colors, fonts, radius } from '../../theme'
import { MODE_STYLE, MIX_STYLE } from '../../theme/catalog'
import { loadHistory } from '../../lib/history'

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([])

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory)
    }, [])
  )

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Ionicons name="trophy" size={20} color={colors.gold} />
        <Text style={styles.title}>History</Text>
      </View>
      {history.length === 0 ? (
        <Text style={styles.empty}>No games played yet.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const p = item.players?.[0]
            const pct = p?.total ? Math.round((p.correct / p.total) * 100) : 0
            const style = MODE_STYLE[item.mode] || MIX_STYLE
            return (
              <Pressable style={styles.row} onPress={() => navigation.navigate('HistoryDetail', { record: item })}>
                <Badge set={style.set} icon={style.icon} color={style.color} size={38} iconSize={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mode}>{modeLabel(item.mode)}</Text>
                  <Text style={styles.date}>{new Date(item.playedAt).toLocaleString()}</Text>
                </View>
                <Text style={[styles.pct, { color: pct >= 70 ? colors.green : pct >= 40 ? colors.gold : colors.red }]}>{pct}%</Text>
              </Pressable>
            )
          }}
        />
      )}
    </Screen>
  )
}

function modeLabel(mode) {
  return { question: 'Question Mode', countdown: 'Countdown', survival: 'Survival', multiplayer: 'Multiplayer' }[mode] || mode
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  empty: { color: colors.text3, fontFamily: fonts.body, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginBottom: 8 },
  mode: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  date: { fontFamily: fonts.body, color: colors.text3, fontSize: 11, marginTop: 2 },
  pct: { fontFamily: fonts.displaySemibold, fontSize: 15 },
})
