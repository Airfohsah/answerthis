import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import Screen from '../../components/Screen'
import { Badge } from '../../components/Icon'
import TintedCard from '../../components/TintedCard'
import { colors, fonts } from '../../theme'
import { CATEGORY_STYLE, MIX_STYLE, MODE_STYLE } from '../../theme/catalog'
import { useGameData } from '../../context/DataProvider'
import { loadHistory, calcStreak, computeHomeStats } from '../../lib/history'
import { MODES, MIX_ALL_CATEGORIES } from '../../lib/gameConstants'

const MODE_CARDS = [MODES.QUESTION, MODES.COUNTDOWN, MODES.SURVIVAL, MODES.MULTIPLAYER].map((mode) => ({
  mode,
  ...MODE_STYLE[mode],
}))

function HeroGraphic() {
  return (
    <View style={styles.heroGraphic}>
      <View style={styles.heroGlow} />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <View key={deg} style={[styles.ray, { transform: [{ rotate: `${deg}deg` }, { translateY: -58 }] }]} />
      ))}
      <View style={styles.heroBulb}>
        <MaterialCommunityIcons name="brain" size={54} color={colors.gold} />
      </View>
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { categories, loading } = useGameData()
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ totalGames: 0, avgScore: null })

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((history) => {
        setStreak(calcStreak(history))
        setStats(computeHomeStats(history))
      })
    }, [])
  )

  const goSetup = (mode, presetCategory) => {
    navigation.navigate('Setup', { mode, presetCategory })
  }

  const quickStats = [
    { key: 'streak', label: 'Streak', value: `${streak}`, icon: 'flame', color: colors.gold, highlight: true },
    { key: 'games', label: 'Games', value: `${stats.totalGames}`, icon: 'game-controller', color: '#6366f1' },
    { key: 'avg', label: 'Avg', value: stats.avgScore != null ? `${stats.avgScore}%` : '—', icon: 'stats-chart', color: '#22c55e' },
  ]

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>🧠</Text>
          <Text style={styles.headerText}>
            Trivia <Text style={{ color: colors.gold }}>Naija</Text>
          </Text>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Answer</Text>
            <View>
              <Text style={[styles.heroTitle, { color: colors.gold }]}>This</Text>
              <View style={styles.heroUnderline} />
            </View>
          </View>
          <HeroGraphic />
        </View>
        <Text style={styles.heroSubtitle}>Test your knowledge. Challenge your mind. Win rewards.</Text>

        <Text style={styles.sectionTitle}>Quick Play</Text>
        <Text style={styles.sectionSubtitle}>Jump into a game mode</Text>
        <View style={styles.quickRow}>
          {quickStats.map((s) => (
            <TintedCard key={s.key} color={s.highlight ? colors.gold : s.color} style={styles.quickCard}>
              <View style={styles.quickCardTop}>
                <Text style={styles.quickLabel}>{s.label.toUpperCase()}</Text>
                <Badge set="ion" icon={s.icon} color={s.color} size={30} iconSize={15} />
              </View>
              <Text style={styles.quickValue}>{s.value}</Text>
            </TintedCard>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="game-controller" size={18} color={colors.gold} />
            <Text style={styles.sectionHeaderTitle}>Game Modes</Text>
          </View>
        </View>
        <View style={styles.modeList}>
          {MODE_CARDS.map((m) => (
            <TintedCard key={m.mode} color={m.color} style={styles.modeRow} onPress={() => goSetup(m.mode)}>
              <Badge set={m.set} icon={m.icon} color={m.color} />
              <View style={styles.modeTextCol}>
                <Text style={styles.modeLabel}>{m.label}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TintedCard>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="grid" size={18} color={colors.gold} />
            <Text style={styles.sectionHeaderTitle}>Categories</Text>
          </View>
        </View>
        <View style={styles.catGrid}>
          <TintedCard color={MIX_STYLE.color} style={styles.catCard} onPress={() => goSetup(MODES.QUESTION, MIX_ALL_CATEGORIES)}>
            <Badge set={MIX_STYLE.set} icon={MIX_STYLE.icon} color={MIX_STYLE.color} size={36} iconSize={18} />
            <Text style={styles.catName}>Mix Everything</Text>
          </TintedCard>
          {!loading &&
            categories.map((c) => {
              const style = CATEGORY_STYLE[c.id] || MIX_STYLE
              return (
                <TintedCard key={c.id} color={style.color} style={styles.catCard} onPress={() => goSetup(MODES.QUESTION, c.id)}>
                  <Badge set={style.set} icon={style.icon} color={style.color} size={36} iconSize={18} />
                  <Text style={styles.catName}>{c.name}</Text>
                </TintedCard>
              )
            })}
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  headerEmoji: { fontSize: 20, marginRight: 8 },
  headerText: { fontFamily: fonts.displaySemibold, fontSize: 16, color: colors.text },

  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTextCol: { flexShrink: 1 },
  heroTitle: { fontFamily: fonts.marker, fontSize: 44, color: colors.text, lineHeight: 48 },
  heroUnderline: { width: 90, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginTop: 2, transform: [{ rotate: '-2deg' }] },
  heroSubtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.text2, marginTop: 12, lineHeight: 20, maxWidth: '75%' },

  heroGraphic: { width: 120, height: 130, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  heroGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(245,166,35,0.12)' },
  heroBulb: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.bg3,
    borderWidth: 1.5,
    borderColor: 'rgba(245,166,35,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: { position: 'absolute', width: 2, height: 14, borderRadius: 1, backgroundColor: 'rgba(245,166,35,0.5)' },

  sectionTitle: { fontFamily: fonts.displaySemibold, fontSize: 18, color: colors.text, marginTop: 28 },
  sectionSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.text3, marginTop: 2, marginBottom: 12 },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickCard: { flex: 1, padding: 12 },
  quickCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quickLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.text3, letterSpacing: 1 },
  quickValue: { fontFamily: fonts.displaySemibold, fontSize: 22, color: colors.text, marginTop: 10 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderTitle: { fontFamily: fonts.displaySemibold, fontSize: 17, color: colors.text },

  modeList: { gap: 10 },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  modeTextCol: { flex: 1 },
  modeLabel: { fontFamily: fonts.displaySemibold, fontSize: 15, color: colors.text, marginBottom: 2 },
  modeDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.text3 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  catCard: { width: '31%', padding: 12, alignItems: 'center', gap: 8 },
  catName: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.text2, textAlign: 'center' },
})
