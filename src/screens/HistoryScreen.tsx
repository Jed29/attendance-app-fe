import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { getHistory } from '../modules/attendance'
import { AttendanceRecord } from '../types'
import { extractError } from '../lib/api'

dayjs.locale('id')

interface Props {
  onBack: () => void
}

export default function HistoryScreen({ onBack }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then(setRecords)
      .catch((err) => Alert.alert('Error', extractError(err)))
      .finally(() => setLoading(false))
  }, [])

  const statusColor = (status: string) =>
    status === 'present' ? '#22c55e' : status === 'late' ? '#f59e0b' : '#ef4444'

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Kembali</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Riwayat Absensi</Text>

      {loading
        ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={records}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.date}>{dayjs(item.check_in_at).format('dddd, D MMM YYYY')}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
                    <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                      {item.status === 'present' ? 'Hadir' : item.status === 'late' ? 'Terlambat' : item.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.times}>
                  <Text style={styles.time}>🟢 Masuk: {dayjs(item.check_in_at).format('HH:mm')}</Text>
                  <Text style={styles.time}>
                    {item.check_out_at
                      ? `🔴 Keluar: ${dayjs(item.check_out_at).format('HH:mm')}`
                      : '🔴 Belum keluar'}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Belum ada riwayat absensi</Text>
            }
          />
        )
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#3b82f6', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  date: { color: '#e2e8f0', fontWeight: '600', fontSize: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  times: { gap: 4 },
  time: { color: '#94a3b8', fontSize: 13 },
  empty: { textAlign: 'center', color: '#475569', marginTop: 60, fontSize: 15 },
})
