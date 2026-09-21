import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { Badge } from '../../../components/Icon'
import TintedCard from '../../../components/TintedCard'
import { colors, fonts, radius } from '../../../theme'
import { CATEGORY_STYLE, MIX_STYLE } from '../../../theme/catalog'
import { fetchAllQuestions, fetchAllCategories, pushChanges, hasStagedChanges } from '../../../lib/adminRepo'
import { resetAdmin } from '../../../lib/adminAuth'
import { useAdminStatus } from '../../../context/AdminStatusProvider'
import { useGameData } from '../../../context/DataProvider'

export default function AdminHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [pushing, setPushing] = useState(false)
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const { lock, refresh: refreshAdminStatus } = useAdminStatus()
  const { refresh: refreshGameData } = useGameData()

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      setLoading(true)
      Promise.all([fetchAllQuestions(), fetchAllCategories()])
        .then(([qs, cats]) => {
          if (cancelled) return
          setQuestions(qs)
          setCategories(cats)
        })
        .finally(() => !cancelled && setLoading(false))
      return () => {
        cancelled = true
      }
    }, [])
  )

  const lockAdmin = () => {
    lock()
    navigation.replace('MainTabs')
  }

  const resetAdminAccess = () => {
    Alert.alert('Reset admin access?', 'This clears the PIN and GitHub token from this device. You\'ll need to set up admin access again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await resetAdmin()
          await refreshAdminStatus()
          navigation.replace('MainTabs')
        },
      },
    ])
  }

  const push = async () => {
    setPushing(true)
    try {
      await pushChanges()
      await refreshGameData()
      Alert.alert('Pushed', 'Changes committed to GitHub.')
    } catch (e) {
      Alert.alert('Push failed', e.message || 'Could not push changes')
    } finally {
      setPushing(false)
    }
  }

  const byCategory = categories.map((c) => {
    const inCat = questions.filter((q) => q.category === c.id)
    return {
      ...c,
      easy: inCat.filter((q) => q.difficulty === 'easy').length,
      medium: inCat.filter((q) => q.difficulty === 'medium').length,
      hard: inCat.filter((q) => q.difficulty === 'hard').length,
      total: inCat.length,
    }
  })

  if (loading) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatBox label="Total Questions" value={questions.length} icon="help-circle" color={colors.gold} />
          <StatBox label="Categories" value={categories.length} icon="grid" color="#6366f1" />
        </View>
        <View style={styles.statsRow}>
          <StatBox label="Easy" value={questions.filter((q) => q.difficulty === 'easy').length} icon="ellipse" color={colors.green} />
          <StatBox label="Medium" value={questions.filter((q) => q.difficulty === 'medium').length} icon="ellipse" color={colors.gold} />
          <StatBox label="Hard" value={questions.filter((q) => q.difficulty === 'hard').length} icon="ellipse" color={colors.red} />
        </View>

        <Button icon="help-circle-outline" title="Questions" onPress={() => navigation.navigate('AdminQuestions')} style={{ marginTop: 20 }} />
        <Button icon="grid-outline" title="Categories" variant="outline" onPress={() => navigation.navigate('AdminCategories')} style={{ marginTop: 10 }} />
        <Button icon="cloud-upload-outline" title="Bulk Import" variant="outline" onPress={() => navigation.navigate('AdminBulkImport')} style={{ marginTop: 10 }} />
        <Button icon="trash-outline" title="Bulk Delete" variant="outline" onPress={() => navigation.navigate('AdminBulkDelete')} style={{ marginTop: 10 }} />

        <Text style={styles.sectionTitle}>Per Category</Text>
        <View style={styles.table}>
          {byCategory.map((c) => {
            const style = CATEGORY_STYLE[c.id] || MIX_STYLE
            return (
              <View key={c.id} style={styles.tableRow}>
                <View style={styles.catNameRow}>
                  <Badge set={style.set} icon={style.icon} color={style.color} size={26} iconSize={13} />
                  <Text style={styles.catName}>{c.name}</Text>
                </View>
                <Text style={styles.catCounts}>
                  {c.easy}E / {c.medium}M / {c.hard}H · {c.total}
                </Text>
              </View>
            )
          })}
        </View>

        {hasStagedChanges() && (
          pushing ? (
            <ActivityIndicator color={colors.green} style={{ marginTop: 24 }} />
          ) : (
            <Button icon="cloud-upload" title="Push Changes to GitHub" variant="green" onPress={push} style={{ marginTop: 24 }} />
          )
        )}

        <Button icon="lock-closed-outline" title="Lock Admin" variant="outline" onPress={lockAdmin} style={{ marginTop: 10 }} />
        <Button icon="warning-outline" title="Reset Admin Access" variant="red" onPress={resetAdminAccess} style={{ marginTop: 10, marginBottom: 40 }} />
      </ScrollView>
    </Screen>
  )
}

function StatBox({ label, value, icon, color }) {
  return (
    <TintedCard color={color} style={styles.statBox}>
      <Badge set="ion" icon={icon} color={color} size={26} iconSize={13} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TintedCard>
  )
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statBox: { flex: 1, padding: 14, alignItems: 'center', gap: 6 },
  statVal: { fontFamily: fonts.displaySemibold, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.text3, marginTop: 2, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: fonts.displaySemibold, fontSize: 15, color: colors.text, marginTop: 24, marginBottom: 12 },
  table: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  catNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catName: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13 },
  catCounts: { fontFamily: fonts.body, color: colors.text3, fontSize: 12 },
})
