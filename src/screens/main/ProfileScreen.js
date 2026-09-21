import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { Badge } from '../../components/Icon'
import TintedCard from '../../components/TintedCard'
import { colors, fonts } from '../../theme'
import { loadHistory, computeProfileStats } from '../../lib/history'
import { useAdminStatus } from '../../context/AdminStatusProvider'

const STAT_STYLE = [
  { key: 'gamesPlayed', label: 'Games Played', icon: 'game-controller', color: '#6366f1', set: 'ion' },
  { key: 'accuracy', label: 'Accuracy', icon: 'checkmark-done', color: '#22c55e', set: 'ion', suffix: '%' },
  { key: 'correctAnswers', label: 'Correct Answers', icon: 'checkmark-circle', color: colors.gold, set: 'ion' },
  { key: 'bestScore', label: 'Best Score', icon: 'trophy', color: '#f5c518', set: 'ion', suffix: '%' },
]

export default function ProfileScreen({ navigation }) {
  const [stats, setStats] = useState({ gamesPlayed: 0, accuracy: 0, correctAnswers: 0, bestScore: 0 })
  const { isUnlocked } = useAdminStatus()

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((h) => setStats(computeProfileStats(h)))
    }, [])
  )

  const exportData = async () => {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('answerthis_'))
      const entries = await AsyncStorage.multiGet(keys)
      const dump = Object.fromEntries(entries.map(([k, v]) => [k, v ? JSON.parse(v) : null]))
      const path = FileSystem.cacheDirectory + 'answerthis-backup.json'
      await FileSystem.writeAsStringAsync(path, JSON.stringify(dump, null, 2))
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path)
      }
    } catch (e) {
      Alert.alert('Export failed', e.message)
    }
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Badge set="ion" icon="person" color={colors.gold} size={40} iconSize={20} />
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.statsGrid}>
        {STAT_STYLE.map((s) => (
          <StatCard key={s.key} style={s} value={`${stats[s.key]}${s.suffix || ''}`} />
        ))}
      </View>

      <Button title="Export My Data" variant="outline" onPress={exportData} style={{ marginTop: 24 }} />

      {isUnlocked && (
        <Button title="Admin" onPress={() => navigation.navigate('AdminHome')} style={{ marginTop: 12 }} />
      )}
      {!isUnlocked && (
        <Button title="Admin Login" variant="outline" onPress={() => navigation.navigate('AdminLogin')} style={{ marginTop: 12 }} />
      )}
    </Screen>
  )
}

function StatCard({ style, value }) {
  return (
    <TintedCard color={style.color} style={styles.statCard}>
      <Badge set={style.set} icon={style.icon} color={style.color} size={38} iconSize={19} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{style.label}</Text>
    </TintedCard>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', padding: 16, alignItems: 'center', gap: 8 },
  statValue: { fontFamily: fonts.displaySemibold, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
})
