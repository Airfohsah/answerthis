import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppBackground from './AppBackground'
import { colors } from '../theme'

// KeyboardAvoidingView is required here, not optional -- with Android's
// edge-to-edge layout (default since RN 0.76 / Expo SDK 52+), the OS no
// longer resizes the window when the keyboard opens, so without this,
// TextInputs near the bottom of any screen end up hidden behind the keyboard
// with no way to scroll them into view.
export default function Screen({ children, style }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBackground />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.container, style]}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent', padding: 16 },
})
