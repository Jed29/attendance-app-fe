import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { useAppStore } from '../store/useAppStore'
import { getTodayStatus, checkOut } from '../modules/attendance'
import { TodayStatus } from '../types'
import { extractError } from '../lib/api'

dayjs.locale('id')

interface Props {
  onNavigate: (screen: 'checkin' | 'history' | 'leave') => void
  onLogout: () => void
}

export default function HomeScreen({ onNavigate, onLogout }: Props) {
  const user = useAppStore((s) => s.user)
  const [status, setStatus] = useState<TodayStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const s = await getTodayStatus()
      setStatus(s)
    } catch (err) {
      Alert.alert('Error', extractError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCheckOut = async () => {
    Alert.alert('Absen Keluar', 'Yakin mau absen keluar sekarang?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Keluar',
        onPress: async () => {
          try {
            await checkOut()
            await load()
          } catch (err) {
            Alert.alert('Gagal', extractError(err))
          }
        },
      },
    ])
  }

  const statusLabel = () => {
    if (!status || status.status === 'absent') return { text: 'Belum Absen', color: '#ef4444' }
    if (status.status === 'checked_in') return { text: 'Sudah Masuk', color: '#22c55e' }
    return { text: 'Sudah Keluar', color: '#94a3b8' }
  }

  const label = statusLabel()

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {user?.name} 👋</Text>
          <Text style={styles.date}>{dayjs().format('dddd, D MMMM YYYY')}</Text>
        </View>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logout}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        {loading
          ? <ActivityIndicator color="#3b82f6" />
          : (
            <>
              <Text style={styles.statusLabel}>Status Hari Ini</Text>
              <Text style={[styles.statusValue, { color: label.color }]}>{label.text}</Text>
              {status?.record && (
                <Text style={styles.statusTime}>
                  Masuk: {dayjs(status.record.check_in_at).format('HH:mm')}
                  {status.record.check_out_at
                    ? `  •  Keluar: ${dayjs(status.record.check_out_at).format('HH:mm')}`
                    : ''}
                </Text>
              )}
            </>
          )
        }
      </View>

      <View style={styles.actions}>
        {status?.status === 'absent' && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => onNavigate('checkin')}>
            <Text style={styles.btnText}>📍 Absen Masuk</Text>
          </TouchableOpacity>
        )}
        {status?.status === 'checked_in' && (
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleCheckOut}>
            <Text style={styles.btnText}>🏁 Absen Keluar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => onNavigate('history')}>
          <Text style={[styles.btnText, { color: '#94a3b8' }]}>📋 Riwayat Absensi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => onNavigate('leave')}>
          <Text style={[styles.btnText, { color: '#94a3b8' }]}>🌴 Ajukan Cuti / Izin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingTop: 60 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  logout: { color: '#ef4444', fontSize: 14 },
  statusCard: { margin: 24, backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  statusLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  statusValue: { fontSize: 26, fontWeight: 'bold' },
  statusTime: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  actions: { paddingHorizontal: 24, gap: 12 },
  btn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnSecondary: { backgroundColor: '#10b981' },
  btnOutline: { borderWidth: 1, borderColor: '#334155' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
