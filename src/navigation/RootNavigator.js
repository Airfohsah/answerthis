import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MainTabNavigator from './MainTabNavigator'
import SetupScreen from '../screens/main/SetupScreen'
import GameScreen from '../screens/main/GameScreen'
import ResultsScreen from '../screens/main/ResultsScreen'
import HistoryDetailScreen from '../screens/main/HistoryDetailScreen'
import AdminLoginScreen from '../screens/main/admin/AdminLoginScreen'
import AdminHomeScreen from '../screens/main/admin/AdminHomeScreen'
import AdminQuestionsScreen from '../screens/main/admin/AdminQuestionsScreen'
import AdminQuestionEditScreen from '../screens/main/admin/AdminQuestionEditScreen'
import AdminCategoriesScreen from '../screens/main/admin/AdminCategoriesScreen'
import AdminCategoryEditScreen from '../screens/main/admin/AdminCategoryEditScreen'
import AdminBulkImportScreen from '../screens/main/admin/AdminBulkImportScreen'
import AdminBulkDeleteScreen from '../screens/main/admin/AdminBulkDeleteScreen'
import AdminNotifyScreen from '../screens/main/admin/AdminNotifyScreen'
import { colors } from '../theme'

const Stack = createNativeStackNavigator()

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg2, border: colors.border, primary: colors.gold, text: colors.text },
}

const headerOptions = {
  headerStyle: { backgroundColor: colors.bg2 },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text },
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Setup" component={SetupScreen} options={{ headerShown: true, title: '', ...headerOptions }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ headerShown: true, title: 'Results', headerBackVisible: false, ...headerOptions }} />
        <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} options={{ headerShown: true, title: 'Game Detail', ...headerOptions }} />

        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ headerShown: true, title: 'Admin Login', ...headerOptions }} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: true, title: 'Admin', ...headerOptions }} />
        <Stack.Screen name="AdminQuestions" component={AdminQuestionsScreen} options={{ headerShown: true, title: 'Questions', ...headerOptions }} />
        <Stack.Screen name="AdminQuestionEdit" component={AdminQuestionEditScreen} options={{ headerShown: true, title: 'Question', ...headerOptions }} />
        <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} options={{ headerShown: true, title: 'Categories', ...headerOptions }} />
        <Stack.Screen name="AdminCategoryEdit" component={AdminCategoryEditScreen} options={{ headerShown: true, title: 'Category', ...headerOptions }} />
        <Stack.Screen name="AdminBulkImport" component={AdminBulkImportScreen} options={{ headerShown: true, title: 'Bulk Import', ...headerOptions }} />
        <Stack.Screen name="AdminBulkDelete" component={AdminBulkDeleteScreen} options={{ headerShown: true, title: 'Bulk Delete', ...headerOptions }} />
        <Stack.Screen name="AdminNotify" component={AdminNotifyScreen} options={{ headerShown: true, title: 'Send Notification', ...headerOptions }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
