import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { hasAdminSetup } from '../lib/adminAuth'

const defaultStatus = {
  isSetUp: false, // whether a PIN + GitHub token exist on this device at all
  isUnlocked: false, // whether the current app session has passed the PIN check
  loading: true,
}

const AdminStatusContext = createContext({ ...defaultStatus, refresh: () => {}, unlock: () => {}, lock: () => {} })

export function AdminStatusProvider({ children }) {
  const [status, setStatus] = useState(defaultStatus)

  const refresh = useCallback(async () => {
    const isSetUp = await hasAdminSetup()
    setStatus((prev) => ({ isSetUp, isUnlocked: isSetUp ? prev.isUnlocked : false, loading: false }))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Called after a successful PIN check (or first-run setup) for this session.
  const unlock = useCallback(() => {
    setStatus((prev) => ({ ...prev, isSetUp: true, isUnlocked: true }))
  }, [])

  // Clears the unlocked session state only -- the PIN + token stay on-device.
  const lock = useCallback(() => {
    setStatus((prev) => ({ ...prev, isUnlocked: false }))
  }, [])

  return (
    <AdminStatusContext.Provider value={{ ...status, refresh, unlock, lock }}>
      {children}
    </AdminStatusContext.Provider>
  )
}

export function useAdminStatus() {
  return useContext(AdminStatusContext)
}
