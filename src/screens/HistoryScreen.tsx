import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, Alert, TouchableOpacity,
  Platform, StatusBar, Animated,
} from 'react-native'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { getHistory } from '../modules/attendance'
import { AttendanceRecord } from '../types'
import { extractError } from '../lib/api'

dayjs.locale('id')

const C = {
  bg: '#FFFFFF',
  surface: '#F4FAF4',
  border: '#E2F0E2',
  primary: '#43A047',
  amber: '#F59E0B',
  red: '#EF4444',
  text1: '#1A2B1A',
  text2: '#4A7A4A',
  text3: '#9CC09C',
}

interface Props {
  onBack: () => void
}

function RecordRow({ item, index }: { item: AttendanceRecord; index: number }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(16)).current

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const statusColor =
    item.status === 'present' ? C.primary
    : item.status === 'late' ? C.amber
    : C.red

  const statusLabel =
    item.status === 'present' ? 'HADIR'
    : item.status === 'late' ? 'TERLAMBAT'
    : item.status.toUpperCase()

  const duration = item.check_out_at
    ? dayjs(item.check_out_at).diff(dayjs(item.check_in_at), 'hour', true).toFixed(1) + ' jam'
    : null

  return (
    <Animated.View
      style={[
        styles.row,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowDay}>
            {dayjs(item.check_in_at).format('ddd').toUpperCase()}
          </Text>
          <Text style={styles.rowDate}>
            {dayjs(item.check_in_at).format('D')}
          </Text>
          <Text style={styles.rowMonth}>
            {dayjs(item.check_in_at).format('MMM').toUpperCase()}
          </Text>
        </View>
        <View style={styles.rowDivider} />
        <View style={styles.rowMain}>
          <View style={styles.rowTimes}>
            <View>
              <Text style={styles.timeLabel}>MASUK</Text>
              <Text style={styles.timeValue}>
                {dayjs(item.check_in_at).format('HH:mm')}
              </Text>
            </View>
            <View>
              <Text style={styles.timeLabel}>KELUAR</Text>
              <Text style={[styles.timeValue, !item.check_out_at && { color: C.text3 }]}>
                {item.check_out_at
                  ? dayjs(item.check_out_at).format('HH:mm')
                  : '--:--'}
              </Text>
            </View>
            {duration && (
              <View>
                <Text style={styles.timeLabel}>DURASI</Text>
                <Text style={styles.timeValue}>{duration}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.statusBadge, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </Animated.View>
  )
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>‹ KEMBALI</Text>
        </TouchableOpacity>
        <Text style={styles.title}>RIWAYAT ABSENSI</Text>
        <Text style={styles.sub}>{dayjs().format('MMMM YYYY')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => (
            <RecordRow item={item} index={index} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyNum}>0</Text>
              <Text style={styles.emptyLabel}>CATATAN ABSENSI</Text>
              <Text style={styles.emptySub}>Belum ada riwayat bulan ini</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { marginBottom: 20, alignSelf: 'flex-start' },
  backText: { fontSize: 11, letterSpacing: 2, color: C.text2, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: C.text1, letterSpacing: 3, marginBottom: 4 },
  sub: { fontSize: 12, color: C.text2, letterSpacing: 1, textTransform: 'uppercase' },
  list: { padding: 24, paddingTop: 16 },
  separator: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  row: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginVertical: 4,
  },
  statusStrip: { width: 3 },
  rowContent: { flex: 1, flexDirection: 'row', padding: 16 },
  rowLeft: { width: 44, alignItems: 'center', justifyContent: 'center' },
  rowDay: {
    fontSize: 9,
    letterSpacing: 1,
    color: C.text3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 2,
  },
  rowDate: {
    fontSize: 28,
    fontWeight: '200',
    color: C.text1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 30,
  },
  rowMonth: {
    fontSize: 9,
    letterSpacing: 1,
    color: C.text3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2,
  },
  rowDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 16 },
  rowMain: { flex: 1, justifyContent: 'space-between' },
  rowTimes: { flexDirection: 'row', gap: 20 },
  timeLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: C.text3,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyNum: {
    fontSize: 72,
    fontWeight: '100',
    color: C.text3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 80,
  },
  emptyLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.text3,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: C.text3,
    marginTop: 6,
  },
})
