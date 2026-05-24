import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { useAppStore } from './src/store/useAppStore'
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import CheckInScreen from './src/screens/CheckInScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import LeaveScreen from './src/screens/LeaveScreen'

type Screen = 'login' | 'home' | 'checkin' | 'history' | 'leave'

export default function App() {
  const { user, loadAuth, clearAuth } = useAppStore()
  const [screen, setScreen] = useState<Screen>('login')
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    loadAuth().then(() => setBooting(false))
  }, [])

  useEffect(() => {
    if (!booting) {
      setScreen(user ? 'home' : 'login')
    }
  }, [user, booting])

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      {screen === 'login' && (
        <LoginScreen onLoginSuccess={() => setScreen('home')} />
      )}
      {screen === 'home' && (
        <HomeScreen
          onNavigate={(s) => setScreen(s)}
          onLogout={async () => { await clearAuth(); setScreen('login') }}
        />
      )}
      {screen === 'checkin' && (
        <CheckInScreen
          onSuccess={() => setScreen('home')}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'leave' && (
        <LeaveScreen onBack={() => setScreen('home')} />
      )}
    </>
  )
}
