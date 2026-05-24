import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import CalendarScreen from '../screens/CalendarScreen'
import LeaveScreen from '../screens/LeaveScreen'
import AccountScreen from '../screens/AccountScreen'

export type TabKey = 'home' | 'calendar' | 'leave' | 'account'

type TabDef = {
  key: TabKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconActive: keyof typeof Ionicons.glyphMap
}

const TABS: TabDef[] = [
  { key: 'home',     label: 'Beranda',  icon: 'home-outline',            iconActive: 'home' },
  { key: 'calendar', label: 'Kalender', icon: 'calendar-outline',        iconActive: 'calendar' },
  { key: 'leave',    label: 'Cuti',     icon: 'document-text-outline',   iconActive: 'document-text' },
  { key: 'account',  label: 'Akun',     icon: 'person-outline',          iconActive: 'person' },
]

interface Props {
  onNavigateCheckin: () => void
  onNavigateHistory: () => void
  onLogout: () => void
}

function TabBar({ active, onPress }: { active: TabKey; onPress: (k: TabKey) => void }) {
  return (
    <View style={ts.bar}>
      <View style={ts.inner}>
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={ts.tab}
              onPress={() => onPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[ts.iconWrap, isActive && ts.iconWrapActive]}>
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={isActive ? 22 : 20}
                  color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.50)'}
                />
              </View>
              <Text style={[ts.label, isActive && ts.labelActive]}>{tab.label}</Text>
              {isActive && <View style={ts.dot} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const ts = StyleSheet.create({
  bar: {
    backgroundColor: '#43A047',
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
  labelActive: { color: '#FFFFFF', fontWeight: '700' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
})

export default function MainTabs({ onNavigateCheckin, onNavigateHistory, onLogout }: Props) {
  const [active, setActive] = useState<TabKey>('home')

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1 }}>
        {active === 'home' && (
          <HomeScreen
            onNavigate={(s) => {
              if (s === 'checkin') onNavigateCheckin()
              else if (s === 'history') onNavigateHistory()
              else if (s === 'leave') setActive('leave')
            }}
            onLogout={onLogout}
          />
        )}
        {active === 'calendar' && <CalendarScreen />}
        {active === 'leave' && <LeaveScreen onBack={() => setActive('home')} />}
        {active === 'account' && <AccountScreen onLogout={onLogout} />}
      </View>
      <TabBar active={active} onPress={setActive} />
    </View>
  )
}
