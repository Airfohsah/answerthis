import { useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import Screen from '../../../components/Screen'
import Button from '../../../components/Button'
import { Badge } from '../../../components/Icon'
import { colors, fonts, radius } from '../../../theme'
import { setupAdmin, verifyPin, resetAdmin } from '../../../lib/adminAuth'
import { useAdminStatus } from '../../../context/AdminStatusProvider'

export default function AdminLoginScreen({ navigation }) {
  const { isSetUp, loading: statusLoading, refresh, unlock } = useAdminStatus()

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refresh()
  }, [refresh])

  const submitPin = async () => {
    setError('')
    setLoading(true)
    const ok = await verifyPin(pin)
    setLoading(false)
    if (!ok) {
      setError('Incorrect PIN')
      return
    }
    unlock()
    navigation.replace('AdminHome')
  }

  const submitSetup = async () => {
    setError('')
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }
    if (!githubToken.trim()) {
      setError('GitHub token is required')
      return
    }
    setLoading(true)
    try {
      await setupAdmin(pin, githubToken.trim())
      unlock()
      navigation.replace('AdminHome')
    } catch (e) {
      setError(e.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const forgotPin = async () => {
    setError('')
    await resetAdmin()
    await refresh()
    setPin('')
    setConfirmPin('')
    setGithubToken('')
  }

  if (statusLoading) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </Screen>
    )
  }

  if (!isSetUp) {
    return (
      <Screen>
        <View style={styles.titleRow}>
          <Badge set="ion" icon="key" color={colors.gold} size={40} iconSize={20} />
          <Text style={styles.title}>Set Up Admin Access</Text>
        </View>
        <Text style={styles.hint}>Create a PIN and enter your GitHub token once. Both are stored only on this device.</Text>

        <Text style={styles.label}>New PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          placeholder="••••••"
          placeholderTextColor={colors.text3}
        />
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={setConfirmPin}
          secureTextEntry
          keyboardType="number-pad"
          placeholder="••••••"
          placeholderTextColor={colors.text3}
        />
        <Text style={styles.label}>GitHub Token</Text>
        <TextInput
          style={styles.input}
          value={githubToken}
          onChangeText={setGithubToken}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="ghp_..."
          placeholderTextColor={colors.text3}
          onSubmitEditing={submitSetup}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} /> : <Button icon="checkmark" title="Set Up Admin" onPress={submitSetup} style={{ marginTop: 16 }} />}
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Badge set="ion" icon="lock-closed" color={colors.gold} size={40} iconSize={20} />
        <Text style={styles.title}>Admin Login</Text>
      </View>
      <Text style={styles.label}>PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
        placeholder="••••••"
        placeholderTextColor={colors.text3}
        onSubmitEditing={submitPin}
        autoFocus
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} /> : <Button icon="lock-open" title="Unlock" onPress={submitPin} style={{ marginTop: 16 }} />}
      <Button icon="refresh" title="Forgot PIN? Reset admin access" variant="outline" onPress={forgotPin} style={{ marginTop: 24 }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.text3, marginBottom: 14, marginTop: 10 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontFamily: fonts.body },
  error: { color: colors.red, fontFamily: fonts.body, fontSize: 13, marginTop: 10 },
})
