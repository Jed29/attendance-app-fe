import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, FlatList,
  Platform, StatusBar, Animated,
} from 'react-native'
import dayjs from 'dayjs'
import { requestLeave, getMyLeaves } from '../modules/leave'
import { LeaveRequest } from '../types'
import { extractError } from '../lib/api'
import DatePickerSheet from '../components/DatePickerSheet'
import FeedbackModal from '../components/FeedbackModal'

const G = '#43A047'
const C = {
  bg: '#FFFFFF',
  surface: '#F4FAF4',
  border: '#E2F0E2',
  primary: G,
  primaryDim: 'rgba(67,160,71,0.10)',
  amber: '#F59E0B',
  red: '#EF4444',
  text1: '#1A2B1A',
  text2: '#4A7A4A',
  text3: '#9CC09C',
}

type LeaveType = 'sick' | 'annual' | 'other'

const LEAVE_TYPES: { value: LeaveType; label: string; desc: string }[] = [
  { value: 'sick',   label: 'Sakit',         desc: 'Surat dokter diperlukan' },
  { value: 'annual', label: 'Cuti Tahunan',  desc: 'Jatah cuti reguler' },
  { value: 'other',  label: 'Lainnya',       desc: 'Keperluan lain' },
]

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: C.amber,   bg: '#FFF8E1', label: 'Menunggu' },
  approved: { color: G,         bg: '#E8F5E9', label: 'Disetujui' },
  rejected: { color: C.red,     bg: '#FFEBEE', label: 'Ditolak' },
}

interface Props {
  onBack: () => void
}

export default function LeaveScreen({ onBack }: Props) {
  const [tab, setTab]             = useState<'request' | 'history'>('request')
  const [leaveType, setLeaveType] = useState<LeaveType>('annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [reason, setReason]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory]     = useState<LeaveRequest[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [focused, setFocused]     = useState<string | null>(null)
  const [datePicker, setDatePicker] = useState<{ visible: boolean; target: 'start' | 'end' }>({ visible: false, target: 'start' })
  const [modal, setModal] = useState<{ visible: boolean; type: 'success'|'error'; title: string; message?: string }>({ visible: false, type: 'success', title: '' })
  const tabAnim = React.useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (tab === 'history') loadHistory()
    Animated.spring(tabAnim, {
      toValue: tab === 'history' ? 1 : 0,
      friction: 8,
      tension: 80,
      useNativeDriver: false,
    }).start()
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
      setModal({ visible: true, type: 'error', title: 'Tanggal Belum Dipilih', message: 'Pilih tanggal mulai dan selesai terlebih dahulu' })
      return
    }
    setSubmitting(true)
    try {
      await requestLeave(leaveType, startDate, endDate, reason)
      setModal({ visible: true, type: 'success', title: 'Pengajuan Terkirim!', message: 'Permintaan cuti/izin sedang menunggu persetujuan atasan.' })
      setStartDate('')
      setEndDate('')
      setReason('')
    } catch (err) {
      setModal({ visible: true, type: 'error', title: 'Gagal Mengirim', message: extractError(err) })
    } finally {
      setSubmitting(false)
    }
  }

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['3%', '51%'],
  })

  const daysBetween = startDate && endDate
    ? Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1)
    : null

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={G} />

      {/* Green hero header */}
      <View style={s.hero}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={s.backText}>‹ KEMBALI</Text>
        </TouchableOpacity>
        <View style={s.heroRow}>
          <View>
            <Text style={s.heroTitle}>Izin & Cuti</Text>
            <Text style={s.heroSub}>Ajukan atau lihat riwayat izinmu</Text>
          </View>
        </View>
      </View>

      {/* White body */}
      <View style={s.body}>
        {/* Tab switcher */}
        <View style={s.tabWrap}>
          <Animated.View style={[s.tabIndicator, { left: tabIndicatorLeft }]} />
          <TouchableOpacity style={s.tabBtn} onPress={() => setTab('request')} activeOpacity={0.8}>
            <Text style={[s.tabLabel, tab === 'request' && s.tabLabelActive]}>Ajukan Cuti</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tabBtn} onPress={() => setTab('history')} activeOpacity={0.8}>
            <Text style={[s.tabLabel, tab === 'history' && s.tabLabelActive]}>Riwayat</Text>
          </TouchableOpacity>
        </View>

        {tab === 'request' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.formContent}
          >
            {/* Leave type */}
            <Text style={s.sectionLabel}>Jenis Cuti / Izin</Text>
            <View style={s.typeRow}>
              {LEAVE_TYPES.map((t) => {
                const active = leaveType === t.value
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[s.typeChip, active && s.typeChipActive]}
                    onPress={() => setLeaveType(t.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.typeLabel, active && s.typeLabelActive]}>{t.label}</Text>
                    <Text style={[s.typeDesc, active && s.typeDescActive]}>{t.desc}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Date pickers */}
            <Text style={s.sectionLabel}>Periode Cuti</Text>
            <View style={s.dateRow}>
              <TouchableOpacity
                style={[s.dateField, { flex: 1 }, startDate && s.dateFieldFilled]}
                onPress={() => setDatePicker({ visible: true, target: 'start' })}
                activeOpacity={0.8}
              >
                <Text style={s.dateFieldLabel}>MULAI</Text>
                <Text style={[s.dateFieldVal, !startDate && s.dateFieldPlaceholder]}>
                  {startDate ? dayjs(startDate).format('D MMM YY') : '—'}
                </Text>
              </TouchableOpacity>

              <View style={s.dateSep}>
                <Text style={s.dateSepText}>→</Text>
              </View>

              <TouchableOpacity
                style={[s.dateField, { flex: 1 }, endDate && s.dateFieldFilled]}
                onPress={() => setDatePicker({ visible: true, target: 'end' })}
                activeOpacity={0.8}
              >
                <Text style={s.dateFieldLabel}>SELESAI</Text>
                <Text style={[s.dateFieldVal, !endDate && s.dateFieldPlaceholder]}>
                  {endDate ? dayjs(endDate).format('D MMM YY') : '—'}
                </Text>
              </TouchableOpacity>
            </View>

            {daysBetween && (
              <View style={s.durationBadge}>
                <Text style={s.durationText}>{daysBetween} hari kerja</Text>
              </View>
            )}

            {/* Reason */}
            <Text style={s.sectionLabel}>Alasan</Text>
            <TextInput
              style={[s.textarea, focused === 'reason' && s.textareaFocused]}
              value={reason}
              onChangeText={setReason}
              placeholder="Jelaskan alasan pengajuan cuti atau izin kamu..."
              placeholderTextColor={C.text3}
              multiline
              textAlignVertical="top"
              onFocus={() => setFocused('reason')}
              onBlur={() => setFocused(null)}
            />

            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={s.submitBtnText}>Kirim Pengajuan →</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        ) : histLoading ? (
          <ActivityIndicator color={G} style={{ marginTop: 60 }} size="large" />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.histList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const cfg = STATUS_CONFIG[item.status] ?? { color: C.text2, bg: C.surface, label: item.status }
              const typeInfo = LEAVE_TYPES.find((t) => t.value === item.leave_type)
              const days = dayjs(item.end_date).diff(dayjs(item.start_date), 'day') + 1
              return (
                <View style={s.histCard}>
                  <View style={s.histCardTop}>
                    <View style={s.histMid}>
                      <Text style={s.histType}>{typeInfo?.label ?? item.leave_type}</Text>
                      <Text style={s.histDates}>
                        {dayjs(item.start_date).format('D MMM')} – {dayjs(item.end_date).format('D MMM YYYY')}
                      </Text>
                      {item.reason ? (
                        <Text style={s.histReason} numberOfLines={2}>{item.reason}</Text>
                      ) : null}
                    </View>
                    <View style={[s.histStatusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[s.histStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={[s.histDays, { color: cfg.color }]}>{days}h</Text>
                    </View>
                  </View>
                </View>
              )
            }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyTitle}>Belum ada riwayat</Text>
                <Text style={s.emptySub}>Pengajuan cuti atau izinmu{'\n'}akan muncul di sini</Text>
              </View>
            }
          />
        )}
      </View>

      <DatePickerSheet
        visible={datePicker.visible}
        value={datePicker.target === 'start' ? startDate : endDate}
        onConfirm={(date) => {
          if (datePicker.target === 'start') setStartDate(date)
          else setEndDate(date)
          setDatePicker((d) => ({ ...d, visible: false }))
        }}
        onCancel={() => setDatePicker((d) => ({ ...d, visible: false }))}
      />

      <FeedbackModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText="OK"
        onConfirm={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G },

  hero: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 28,
  },
  backText: { fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.75)', fontWeight: '700', marginBottom: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.70)' },
  heroIcon: { display: 'none' },
  heroIconText: { display: 'none' },

  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 8,
    overflow: 'hidden',
  },

  tabWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
    height: 48,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    width: '47%',
    top: 4, bottom: 4,
    backgroundColor: G,
    borderRadius: 9,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabLabel: { fontSize: 13, fontWeight: '700', color: C.text2 },
  tabLabelActive: { color: '#FFFFFF' },

  formContent: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: C.text3, marginBottom: 10, marginTop: 8 },

  typeRow: { gap: 10, marginBottom: 4 },
  typeChip: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeChipActive: {
    borderColor: G,
    backgroundColor: 'rgba(67,160,71,0.07)',
  },
  typeLabel: { fontSize: 15, fontWeight: '700', color: C.text1, flex: 1 },
  typeLabelActive: { color: G },
  typeDesc: { fontSize: 11, color: C.text3 },
  typeDescActive: { color: G + 'AA' },

  dateRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dateField: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 14,
  },
  dateFieldFilled: { borderColor: G },
  dateFieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: C.text3, marginBottom: 6 },
  dateFieldVal: { fontSize: 16, fontWeight: '700', color: C.text1 },
  dateFieldPlaceholder: { color: C.text3 },
  dateSep: { alignItems: 'center', paddingBottom: 4 },
  dateSepText: { fontSize: 18, color: C.text3, fontWeight: '300' },
  durationBadge: {
    backgroundColor: 'rgba(67,160,71,0.10)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  durationText: { fontSize: 12, color: G, fontWeight: '700' },

  textarea: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text1,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  textareaFocused: { borderColor: G },
  submitBtn: {
    backgroundColor: G,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: G,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  histList: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  histCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  histCardTop: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  histMid: { flex: 1 },
  histType: { fontSize: 15, fontWeight: '700', color: C.text1, marginBottom: 4 },
  histDates: { fontSize: 12, color: C.text2, marginBottom: 4, letterSpacing: 0.3 },
  histReason: { fontSize: 12, color: C.text3, lineHeight: 17 },
  histStatusBadge: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  histStatusText: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  histDays: { fontSize: 13, fontWeight: '900' },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { display: 'none' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text1, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.text3, textAlign: 'center', lineHeight: 20 },
})
