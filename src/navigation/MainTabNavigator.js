import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/main/HomeScreen'
import HistoryScreen from '../screens/main/HistoryScreen'
import ProfileScreen from '../screens/main/ProfileScreen'
import { colors, fonts } from '../theme'

const Tab = createBottomTabNavigator()

const ICONS = { Home: 'home', History: 'trophy', Profile: 'person' }

function TabIcon({ route, color, focused }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`} size={22} color={color} />
      <View style={[styles.underline, { opacity: focused ? 1 : 0, backgroundColor: colors.gold }]} />
    </View>
  )
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarIcon: ({ color, focused }) => <TabIcon route={route} color={color} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  underline: { marginTop: 4, width: 18, height: 2, borderRadius: 1 },
})
