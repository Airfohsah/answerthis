import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFile, putFile } from './githubContent'

const CACHE_KEY = 'answerthis_data_cache'
const CONTENT_PATH = 'questions.json'

// Admin edits are staged in memory against a single loaded copy of the
// dataset (+ its GitHub sha) and only committed on an explicit push, so a
// session of several quick edits doesn't turn into a commit-per-click.
let staged = null // { data: { categories, questions }, sha }
let dirty = false // true once staged has edits that haven't been pushed yet
let loadingPromise = null // in-flight getFile() call, so concurrent callers share one fetch

async function ensureLoaded() {
  if (staged) return staged
  if (!loadingPromise) {
    loadingPromise = getFile(CONTENT_PATH)
      .then((result) => {
        staged = result
        return staged
      })
      .finally(() => {
        loadingPromise = null
      })
  }
  return loadingPromise
}

async function persistLocally() {
  dirty = true
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(staged.data)).catch(() => {})
}

// Commits the currently staged in-memory dataset to GitHub. Call after one
// or more upsert/delete calls below to actually push the change.
export async function pushChanges(message = 'Update questions from admin app') {
  if (!staged || !dirty) return
  const { sha } = await putFile(CONTENT_PATH, staged.data, staged.sha, message)
  staged.sha = sha
  dirty = false
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(staged.data)).catch(() => {})
}

// Lets DataProvider reflect an admin's in-progress edits without a network
// round-trip that would otherwise overwrite them with the still-unpushed
// remote copy -- returns null once nothing has been loaded into this module yet.
export function getStagedDataIfAny() {
  return staged?.data || null
}

export async function fetchAllQuestions() {
  const { data } = await ensureLoaded()
  return [...data.questions].sort((a, b) => (a.id > b.id ? 1 : -1))
}

export async function fetchAllCategories() {
  const { data } = await ensureLoaded()
  return [...data.categories].sort((a, b) => a.name.localeCompare(b.name))
}

export function validateQuestion(q, categoryIds) {
  if (!q.question?.trim()) return 'Question text is required'
  if (!categoryIds.includes(q.category)) return 'Category is invalid'
  if (!['easy', 'medium', 'hard'].includes(q.difficulty)) return 'Difficulty is invalid'
  if (q.type === 'multiple') {
    const opts = (q.options || []).filter((o) => o.trim())
    if (opts.length < 2) return 'Multiple-choice needs at least 2 options'
    if (!opts.includes(q.answer)) return 'Answer must be one of the options'
  } else if (q.type === 'text') {
    if (!q.answer?.trim()) return 'Answer is required'
  } else {
    return 'Type must be multiple or text'
  }
  return null
}

export async function upsertQuestion(q) {
  const { data } = await ensureLoaded()
  const payload = {
    id: q.id,
    question: q.question.trim(),
    category: q.category,
    difficulty: q.difficulty,
    type: q.type,
    options: q.type === 'multiple' ? q.options.filter((o) => o.trim()) : null,
    answer: q.answer.trim(),
  }
  const idx = data.questions.findIndex((existing) => existing.id === q.id)
  if (idx === -1) data.questions.push(payload)
  else data.questions[idx] = payload
  await persistLocally()
}

export async function deleteQuestion(id) {
  const { data } = await ensureLoaded()
  data.questions = data.questions.filter((q) => q.id !== id)
  await persistLocally()
}

export async function upsertCategory(c) {
  const { data } = await ensureLoaded()
  const payload = { id: c.id, name: c.name.trim(), icon: c.icon.trim() }
  const idx = data.categories.findIndex((existing) => existing.id === c.id)
  if (idx === -1) data.categories.push(payload)
  else data.categories[idx] = payload
  await persistLocally()
}

// Cascade-safe delete: caller must supply reassignTo (another category id) if
// this category still has questions, or pass null once confirmed empty.
export async function deleteCategory(id, reassignTo) {
  const { data } = await ensureLoaded()
  if (reassignTo) {
    data.questions.forEach((q) => {
      if (q.category === id) q.category = reassignTo
    })
  }
  data.categories = data.categories.filter((c) => c.id !== id)
  await persistLocally()
}

export async function countQuestionsInCategory(categoryId) {
  const { data } = await ensureLoaded()
  return data.questions.filter((q) => q.category === categoryId).length
}

export async function bulkInsertQuestions(questions) {
  const { data } = await ensureLoaded()
  data.questions.push(...questions)
  await persistLocally()
}

export async function bulkDeleteQuestions(ids) {
  const { data } = await ensureLoaded()
  const idSet = new Set(ids)
  data.questions = data.questions.filter((q) => !idSet.has(q.id))
  await persistLocally()
}

// Discards any staged, unpushed edits and forces the next call to reload
// fresh from GitHub -- used when the admin backs out of a screen without
// pushing, so a half-finished edit session doesn't linger in memory.
export function discardStagedChanges() {
  staged = null
  dirty = false
}

export function hasStagedChanges() {
  return dirty
}
