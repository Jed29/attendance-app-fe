import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
  Animated, StatusBar, Platform,
} from 'react-native'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { useAppStore } from '../store/useAppStore'
import { getTodayStatus, checkOut } from '../modules/attendance'
import { TodayStatus } from '../types'
import { extractError } from '../lib/api'
import FeedbackModal from '../components/FeedbackModal'

dayjs.locale('id')

const G = '#43A047'

interface Props {
  onNavigate: (screen: 'checkin' | 'history' | 'leave') => void
  onLogout: () => void
}

export default function HomeScreen({ onNavigate, onLogout }: Props) {
  const user = useAppStore((s) => s.user)
  const [status, setStatus] = useState<TodayStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState<{
    visible: boolean; type: 'success'|'error'|'confirm'; title: string; message?: string; action?: () => void
  }>({ visible: false, type: 'confirm', title: '' })
  const fadeAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const load = async () => {
    try {
      const s = await getTodayStatus()
      setStatus(s)
    } catch (err) {
      setModal({ visible: true, type: 'error', title: 'Gagal Memuat', message: extractError(err) })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
      ]).start()
    })
  }, [])

  useEffect(() => {
    if (status?.status === 'checked_in') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }
  }, [status])

  const handleCheckOut = () => {
    setModal({
      visible: true, type: 'confirm',
      title: 'Absen Keluar',
      message: 'Konfirmasi absen keluar untuk hari ini?',
      action: async () => {
        setModal((m) => ({ ...m, visible: false }))
        try {
          await checkOut()
          await load()
          setModal({ visible: true, type: 'success', title: 'Absen Keluar Berhasil', message: 'Sampai jumpa besok!' })
        } catch (err) {
          setModal({ visible: true, type: 'error', title: 'Gagal', message: extractError(err) })
        }
      },
    })
  }

  const isAbsent = !status || status.status === 'absent'
  const isCheckedIn = status?.status === 'checked_in'
  const isDone = status?.status === 'checked_out'

  const statusDotColor = isAbsent ? '#EF4444' : isCheckedIn ? G : '#9CC09C'
  const statusLabel = isAbsent
    ? 'Belum absen hari ini'
    : isCheckedIn
    ? `Masuk pukul ${dayjs(status.record?.check_in_at).format('HH:mm')}`
    : `Selesai pukul ${dayjs(status.record?.check_out_at).format('HH:mm')}`

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 10) return 'Selamat pagi'
    if (h < 15) return 'Selamat siang'
    if (h < 18) return 'Selamat sore'
    return 'Selamat malam'
  })()

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={G} />
      <ScrollView
        style={s.root}
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#FFFFFF" />
        }
      >
        {/* ── GREEN HERO ── */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greeting}</Text>
              <Text style={s.heroName}>{user?.name}</Text>
              <Text style={s.heroRole}>{user?.role === 'admin' ? 'Administrator' : 'Karyawan'}</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={s.logoutBtn} activeOpacity={0.75}>
              <Text style={s.logoutText}>KELUAR</Text>
            </TouchableOpacity>
          </View>

          {/* Date card (white, inside green hero) */}
          <View style={s.dateCard}>
            <View style={s.dateCardTop}>
              <View>
                <Text style={s.dayOfWeek}>{dayjs().format('dddd').toUpperCase()}</Text>
                <Text style={s.dateNumber}>{dayjs().format('DD')}</Text>
                <Text style={s.monthYear}>{dayjs().format('MMMM YYYY').toUpperCase()}</Text>
              </View>
              <View style={s.dateRight}>
                {loading ? (
                  <ActivityIndicator color={G} size="small" />
                ) : (
                  <>
                    <View style={[s.statusBadge, {
                      backgroundColor: isAbsent ? '#FFEBEE' : isCheckedIn ? '#E8F5E9' : '#F5F5F5'
                    }]}>
                      <View style={[s.statusDotSmall, { backgroundColor: statusDotColor }]} />
                      <Text style={[s.statusBadgeText, { color: statusDotColor }]}>
                        {isAbsent ? 'BELUM ABSEN' : isCheckedIn ? 'HADIR' : 'SELESAI'}
                      </Text>
                    </View>
                    {(isCheckedIn || isDone) && (
                      <Text style={s.checkinTime}>
                        {dayjs(status.record?.check_in_at).format('HH:mm')}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>

            {!loading && (
              <View style={s.statusBarRow}>
                <View style={s.statusDotWrap}>
                  {isCheckedIn && (
                    <Animated.View
                      style={[s.statusPulse, {
                        backgroundColor: statusDotColor + '40',
                        transform: [{ scale: pulseAnim }],
                      }]}
                    />
                  )}
                  <View style={[s.statusDot, { backgroundColor: statusDotColor }]} />
                </View>
                <Text style={s.statusLabel}>{statusLabel}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── WHITE BODY ── */}
        <Animated.View style={[s.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Primary action */}
          {isAbsent && (
            <TouchableOpacity style={s.actionPrimary} onPress={() => onNavigate('checkin')} activeOpacity={0.88}>
              <View style={s.actionInner}>
                <View>
                  <Text style={s.actionLabel}>ABSEN MASUK</Text>
                  <Text style={s.actionSub}>GPS + foto selfie diperlukan</Text>
                </View>
                <View style={s.actionArrow}>
                  <Text style={s.actionArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {isCheckedIn && (
            <TouchableOpacity style={s.actionAmber} onPress={handleCheckOut} activeOpacity={0.88}>
              <View style={s.actionInner}>
                <View>
                  <Text style={s.actionLabel}>ABSEN KELUAR</Text>
                  <Text style={s.actionSub}>Konfirmasi akhir hari kerja</Text>
                </View>
                <View style={[s.actionArrow, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={s.actionArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {isDone && (
            <View style={s.doneCard}>
              <Text style={s.doneTitle}>Absensi Selesai</Text>
              <Text style={s.doneSub}>Sampai jumpa besok! Istirahat yang cukup ya.</Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      <FeedbackModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.type === 'confirm' ? 'YA, KELUAR' : 'OK'}
        cancelText={modal.type === 'confirm' ? 'BATAL' : undefined}
        onConfirm={() => modal.action ? modal.action() : setModal((m) => ({ ...m, visible: false }))}
        onCancel={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G },
  contentContainer: { flexGrow: 1, backgroundColor: '#FFFFFF' },

  // ── HERO ──
  hero: {
    backgroundColor: G,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 32,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.80)', marginBottom: 4 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  heroRole: { fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, textTransform: 'uppercase' },
  logoutBtn: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 8, marginTop: 4,
  },
  logoutText: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.90)', fontWeight: '700' },

  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dateCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayOfWeek: { fontSize: 10, letterSpacing: 3, color: '#9CC09C', textTransform: 'uppercase', marginBottom: 2 },
  dateNumber: {
    fontSize: 72, fontWeight: '200', color: '#1A2B1A', lineHeight: 72,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  monthYear: { fontSize: 12, letterSpacing: 2, color: '#4A7A4A', textTransform: 'uppercase', marginTop: 4 },
  dateRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  checkinTime: {
    fontSize: 28, fontWeight: '200', color: G,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
  },
  statusBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2F0E2' },
  statusDotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusPulse: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  statusLabel: { fontSize: 13, color: '#4A7A4A', flex: 1 },

  // ── BODY ──
  body: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  actionPrimary: {
    backgroundColor: G,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: G,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  actionAmber: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  actionInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 20, paddingHorizontal: 22,
  },
  actionLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2, marginBottom: 4 },
  actionSub: { fontSize: 12, color: 'rgba(255,255,255,0.70)' },
  actionArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionArrowText: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },

  doneCard: {
    backgroundColor: '#F4FAF4',
    borderRadius: 16, borderWidth: 1, borderColor: '#E2F0E2',
    padding: 28, alignItems: 'center', marginBottom: 14,
  },
  doneIcon: { fontSize: 40, marginBottom: 8 },
  doneTitle: { fontSize: 18, fontWeight: '800', color: G, marginBottom: 6 },
  doneSub: { fontSize: 13, color: '#4A7A4A', textAlign: 'center', lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statChip: {
    flex: 1, backgroundColor: '#F4FAF4',
    borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderColor: G,
    borderWidth: 1, borderTopColor: '#E2F0E2', borderRightColor: '#E2F0E2', borderBottomColor: '#E2F0E2',
  },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#9CC09C', letterSpacing: 1.5, marginBottom: 6 },
  statVal: {
    fontSize: 18, fontWeight: '600', color: '#1A2B1A',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
})
