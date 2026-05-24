import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAppStore } from './src/store/useAppStore'
import LoginScreen from './src/screens/LoginScreen'
import CheckInScreen from './src/screens/CheckInScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import MainTabs from './src/navigation/MainTabs'

type Screen = 'login' | 'main' | 'checkin' | 'history'

export default function App() {
  const { user, loadAuth, clearAuth } = useAppStore()
  const [screen, setScreen] = useState<Screen>('login')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    loadAuth().then(() => setBooting(false))
  }, [])

  useEffect(() => {
    if (!booting) setScreen(user ? 'main' : 'login')
  }, [user, booting])

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#4CAF50" size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {screen === 'login' && (
        <LoginScreen onLoginSuccess={() => setScreen('main')} />
      )}
      {screen === 'main' && (
        <MainTabs
          onNavigateCheckin={() => setScreen('checkin')}
          onNavigateHistory={() => setScreen('history')}
          onLogout={async () => { await clearAuth(); setScreen('login') }}
        />
      )}
      {screen === 'checkin' && (
        <CheckInScreen
          onSuccess={() => setScreen('main')}
          onBack={() => setScreen('main')}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen onBack={() => setScreen('main')} />
      )}
    </>
  )
}
