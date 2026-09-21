import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadData } from '../lib/questionsRepo'
import { getStagedDataIfAny } from '../lib/adminRepo'

const DataContext = createContext({ categories: [], questions: [], loading: true, refresh: () => {} })

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  // If the admin has an in-progress (possibly unpushed) edit session loaded,
  // reflect that instead of re-fetching -- a network refresh would otherwise
  // overwrite unpushed local edits with the still-old remote copy.
  const refresh = useCallback(async () => {
    setLoading(true)
    const data = getStagedDataIfAny() || (await loadData())
    setCategories(data.categories || [])
    setQuestions(data.questions || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <DataContext.Provider value={{ categories, questions, loading, refresh }}>
      {children}
    </DataContext.Provider>
  )
}

export function useGameData() {
  return useContext(DataContext)
}
