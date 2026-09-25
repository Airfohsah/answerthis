import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts as useSyneFonts, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne'
import { useFonts as useDMSansFonts, DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans'
import { useFonts as useMarkerFonts, PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker'

import { AdminStatusProvider } from './src/context/AdminStatusProvider'
import { DataProvider } from './src/context/DataProvider'
import RootNavigator from './src/navigation/RootNavigator'
import { colors } from './src/theme'
import { initNotifications } from './src/lib/notifications'

export default function App() {
  const [syneLoaded] = useSyneFonts({ Syne_700Bold, Syne_800ExtraBold })
  const [dmSansLoaded] = useDMSansFonts({ DMSans_400Regular, DMSans_500Medium })
  const [markerLoaded] = useMarkerFonts({ PermanentMarker_400Regular })

  useEffect(() => {
    initNotifications()
  }, [])

  if (!syneLoaded || !dmSansLoaded || !markerLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AdminStatusProvider>
        <DataProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </DataProvider>
      </AdminStatusProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
})
