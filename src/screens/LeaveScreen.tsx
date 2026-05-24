import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, FlatList,
} from 'react-native'
import dayjs from 'dayjs'
import { requestLeave, getMyLeaves } from '../modules/leave'
import { LeaveRequest } from '../types'
import { extractError } from '../lib/api'

interface Props {
  onBack: () => void
}

type LeaveType = 'sick' | 'annual' | 'other'

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'sick', label: '🤒 Sakit' },
  { value: 'annual', label: '🌴 Cuti Tahunan' },
  { value: 'other', label: '📝 Lainnya' },
]

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
}

export default function LeaveScreen({ onBack }: Props) {
  const [tab, setTab] = useState<'request' | 'history'>('request')
  const [leaveType, setLeaveType] = useState<LeaveType>('annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<LeaveRequest[]>([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab])

  const loadHistory = async () => {
    setHistLoading(true)
    try {
      setHistory(await getMyLeaves())
    } catch (err) {
      Alert.alert('Error', extractError(err))
    } finally {
      setHistLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Tanggal mulai dan selesai wajib diisi (format: YYYY-MM-DD)')
      return
    }
    setSubmitting(true)
    try {
      await requestLeave(leaveType, startDate, endDate, reason)
      Alert.alert('Berhasil ✅', 'Pengajuan cuti/izin terkirim, menunggu persetujuan')
      setStartDate('')
      setEndDate('')
      setReason('')
    } catch (err) {
      Alert.alert('Gagal', extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Kembali</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Cuti & Izin</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'request' && styles.tabActive]} onPress={() => setTab('request')}>
          <Text style={[styles.tabText, tab === 'request' && styles.tabTextActive]}>Ajukan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      {tab === 'request'
        ? (
          <ScrollView>
            <Text style={styles.label}>Jenis</Text>
            <View style={styles.typeRow}>
              {LEAVE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeBtn, leaveType === t.value && styles.typeBtnActive]}
                  onPress={() => setLeaveType(t.value)}
                >
                  <Text style={[styles.typeBtnText, leaveType === t.value && styles.typeBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tanggal Mulai (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate}
              placeholder="2026-05-26" placeholderTextColor="#475569" />

            <Text style={styles.label}>Tanggal Selesai (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={endDate} onChangeText={setEndDate}
              placeholder="2026-05-27" placeholderTextColor="#475569" />

            <Text style={styles.label}>Alasan</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={reason} onChangeText={setReason}
              placeholder="Keterangan..." placeholderTextColor="#475569"
              multiline textAlignVertical="top" />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabled]}
              onPress={handleSubmit} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Kirim Pengajuan</Text>}
            </TouchableOpacity>
          </ScrollView>
        )
        : histLoading
          ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
          : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.leaveType}>
                      {LEAVE_TYPES.find(t => t.value === item.leave_type)?.label ?? item.leave_type}
                    </Text>
                    <Text style={[styles.status, { color: STATUS_COLOR[item.status] }]}>
                      {item.status === 'pending' ? 'Menunggu'
                        : item.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </Text>
                  </View>
                  <Text style={styles.dateRange}>
                    {dayjs(item.start_date).format('D MMM')} – {dayjs(item.end_date).format('D MMM YYYY')}
                  </Text>
                  {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Belum ada riwayat</Text>}
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
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 10, marginBottom: 24, padding: 4 },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { color: '#94a3b8', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#334155' },
  typeBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  typeBtnText: { color: '#94a3b8', fontSize: 13 },
  typeBtnTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  disabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  leaveType: { color: '#e2e8f0', fontWeight: '600' },
  status: { fontWeight: '600', fontSize: 13 },
  dateRange: { color: '#94a3b8', fontSize: 13 },
  reason: { color: '#64748b', fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', color: '#475569', marginTop: 60, fontSize: 15 },
})
