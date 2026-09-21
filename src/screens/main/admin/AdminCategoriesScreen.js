import { useState, useCallback } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { Badge } from '../../../components/Icon'
import TintedCard from '../../../components/TintedCard'
import { colors, fonts } from '../../../theme'
import { CATEGORY_STYLE, MIX_STYLE } from '../../../theme/catalog'
import { fetchAllCategories, countQuestionsInCategory } from '../../../lib/adminRepo'
import { useGameData } from '../../../context/DataProvider'

export default function AdminCategoriesScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [counts, setCounts] = useState({})
  const { refresh: refreshGameData } = useGameData()

  const load = useCallback(async () => {
    setLoading(true)
    const cats = await fetchAllCategories()
    setCategories(cats)
    const entries = await Promise.all(cats.map(async (c) => [c.id, await countQuestionsInCategory(c.id)]))
    setCounts(Object.fromEntries(entries))
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const handleDelete = (c) => {
    const count = counts[c.id] || 0
    if (count === 0) {
      Alert.alert('Delete category?', `${c.name} has no questions.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => navigation.navigate('AdminCategoryEdit', { category: c, deleteRequested: true }) },
      ])
      return
    }
    // Has questions -- must reassign, not silently orphan them like the old admin.html did.
    navigation.navigate('AdminCategoryEdit', { category: c, deleteRequested: true, questionCount: count })
  }

  if (loading) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </Screen>
    )
  }

  return (
    <Screen>
      <Button icon="add" title="Add Category" onPress={() => navigation.navigate('AdminCategoryEdit', {})} style={{ marginBottom: 12 }} />
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const style = CATEGORY_STYLE[item.id] || MIX_STYLE
          return (
            <TintedCard color={style.color} style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => navigation.navigate('AdminCategoryEdit', { category: item })}>
                <Badge set={style.set} icon={style.icon} color={style.color} size={38} iconSize={18} />
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.count}>{counts[item.id] || 0} questions</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </Pressable>
            </TintedCard>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 8 },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  name: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 14 },
  count: { fontFamily: fonts.body, color: colors.text3, fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 8 },
})
