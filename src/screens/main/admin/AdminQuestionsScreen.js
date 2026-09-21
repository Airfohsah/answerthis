import { useState, useMemo, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { Badge, Icon } from '../../../components/Icon'
import { colors, fonts, radius } from '../../../theme'
import { CATEGORY_STYLE, MIX_STYLE } from '../../../theme/catalog'
import { fetchAllQuestions, fetchAllCategories, deleteQuestion } from '../../../lib/adminRepo'
import { useGameData } from '../../../context/DataProvider'

const PAGE_SIZE = 20

export default function AdminQuestionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState(null)
  const [diffFilter, setDiffFilter] = useState(null)
  const [page, setPage] = useState(1)
  const { refresh: refreshGameData } = useGameData()

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([fetchAllQuestions(), fetchAllCategories()])
      .then(([qs, cats]) => {
        setQuestions(qs)
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (catFilter && q.category !== catFilter) return false
      if (diffFilter && q.difficulty !== diffFilter) return false
      if (search) {
        const s = search.toLowerCase()
        if (!q.question.toLowerCase().includes(s) && !q.answer.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [questions, search, catFilter, diffFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = (q) => {
    Alert.alert('Delete question?', q.question.slice(0, 60), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteQuestion(q.id)
          load()
          refreshGameData()
        },
      },
    ])
  }

  return (
    <Screen>
      <TextInput
        style={styles.search}
        placeholder="Search questions or answers"
        placeholderTextColor={colors.text3}
        value={search}
        onChangeText={(t) => {
          setSearch(t)
          setPage(1)
        }}
      />
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, !catFilter && styles.filterChipActive]}
          onPress={() => {
            setCatFilter(null)
            setPage(1)
          }}
        >
          <Text style={[styles.filterChipText, !catFilter && styles.filterChipTextActive]}>All Categories</Text>
        </Pressable>
        {categories.map((c) => {
          const style = CATEGORY_STYLE[c.id] || MIX_STYLE
          const active = catFilter === c.id
          return (
            <Pressable
              key={c.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => {
                setCatFilter(active ? null : c.id)
                setPage(1)
              }}
            >
              <Icon set={style.set} name={style.icon} size={12} color={active ? style.color : colors.text3} />
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{c.name}</Text>
            </Pressable>
          )
        })}
      </View>
      <View style={styles.filterRow}>
        {['easy', 'medium', 'hard'].map((d) => (
          <Pressable
            key={d}
            style={[styles.filterChip, diffFilter === d && styles.filterChipActive]}
            onPress={() => {
              setDiffFilter(diffFilter === d ? null : d)
              setPage(1)
            }}
          >
            <Text style={[styles.filterChipText, diffFilter === d && styles.filterChipTextActive]}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <Button icon="add" title="Add Question" onPress={() => navigation.navigate('AdminQuestionEdit', {})} style={{ marginVertical: 12 }} />

      {loading ? (
        <ActivityIndicator color={colors.gold} />
      ) : (
        <>
          <FlatList
            data={pageItems}
            keyExtractor={(q) => q.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const style = CATEGORY_STYLE[item.category] || MIX_STYLE
              return (
                <Pressable style={styles.row} onPress={() => navigation.navigate('AdminQuestionEdit', { question: item })}>
                  <Badge set={style.set} icon={style.icon} color={style.color} size={34} iconSize={16} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qText} numberOfLines={2}>
                      {item.question}
                    </Text>
                    <Text style={styles.qMeta}>
                      {item.category} · {item.difficulty} · {item.type}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                  </Pressable>
                </Pressable>
              )
            }}
          />
          <View style={styles.pagination}>
            <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)} style={styles.pageBtnRow}>
              <Ionicons name="chevron-back" size={14} color={page <= 1 ? colors.text3 : colors.gold} />
              <Text style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}>Prev</Text>
            </Pressable>
            <Text style={styles.pageInfo}>
              {page} / {pageCount} ({filtered.length})
            </Text>
            <Pressable disabled={page >= pageCount} onPress={() => setPage((p) => p + 1)} style={styles.pageBtnRow}>
              <Text style={[styles.pageBtn, page >= pageCount && styles.pageBtnDisabled]}>Next</Text>
              <Ionicons name="chevron-forward" size={14} color={page >= pageCount ? colors.text3 : colors.gold} />
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  search: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  filterChipActive: { borderColor: colors.gold, backgroundColor: 'rgba(245,166,35,0.15)' },
  filterChipText: { fontFamily: fonts.body, fontSize: 11, color: colors.text2, textTransform: 'capitalize' },
  filterChipTextActive: { color: colors.gold, fontFamily: fonts.bodyMedium },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, padding: 12, marginBottom: 8, gap: 10 },
  qText: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 13 },
  qMeta: { fontFamily: fonts.body, color: colors.text3, fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
  deleteBtn: { padding: 8 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  pageBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn: { color: colors.gold, fontFamily: fonts.bodyMedium },
  pageBtnDisabled: { color: colors.text3 },
  pageInfo: { color: colors.text3, fontFamily: fonts.body, fontSize: 12 },
})
