import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, StatusBar,
} from 'react-native'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

const G = '#43A047'
const RED = '#EF4444'
const AMBER = '#F59E0B'

const HOLIDAYS_2026: { date: string; name: string; type: 'national' | 'cuti' }[] = [
  { date: '2026-01-01', name: 'Tahun Baru Masehi', type: 'national' },
  { date: '2026-01-27', name: 'Isra Mikraj Nabi Muhammad SAW', type: 'national' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek', type: 'national' },
  { date: '2026-03-22', name: 'Hari Raya Nyepi', type: 'national' },
  { date: '2026-03-20', name: 'Cuti Bersama Nyepi', type: 'cuti' },
  { date: '2026-03-31', name: 'Wafat Yesus Kristus', type: 'national' },
  { date: '2026-04-02', name: 'Idul Fitri 1447 H (Hari 1)', type: 'national' },
  { date: '2026-04-03', name: 'Idul Fitri 1447 H (Hari 2)', type: 'national' },
  { date: '2026-04-06', name: 'Cuti Bersama Idul Fitri', type: 'cuti' },
  { date: '2026-04-07', name: 'Cuti Bersama Idul Fitri', type: 'cuti' },
  { date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', type: 'national' },
  { date: '2026-05-25', name: 'Hari Raya Waisak', type: 'national' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  { date: '2026-06-09', name: 'Idul Adha 1447 H', type: 'national' },
  { date: '2026-06-29', name: 'Tahun Baru Islam 1448 H', type: 'national' },
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI', type: 'national' },
  { date: '2026-09-07', name: 'Maulid Nabi Muhammad SAW', type: 'national' },
  { date: '2026-12-25', name: 'Hari Raya Natal', type: 'national' },
  { date: '2026-12-26', name: 'Cuti Bersama Natal', type: 'cuti' },
]

const MONTHS_LONG = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

const DOW = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

function getHolidaysForMonth(year: number, month: number) {
  return HOLIDAYS_2026.filter((h) => {
    const d = dayjs(h.date)
    return d.year() === year && d.month() === month
  })
}

function CalendarGrid({ year, month }: { year: number; month: number }) {
  const firstDay = dayjs(`${year}-${String(month + 1).padStart(2, '0')}-01`)
  const daysInMonth = firstDay.daysInMonth()
  const startDow = firstDay.day()
  const today = dayjs()

  const holidayMap = new Map<number, 'national' | 'cuti'>()
  HOLIDAYS_2026.forEach((h) => {
    const d = dayjs(h.date)
    if (d.year() === year && d.month() === month) {
      holidayMap.set(d.date(), h.type)
    }
  })

  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d: number) => today.year() === year && today.month() === month && today.date() === d
  const isWeekend = (idx: number) => idx % 7 === 0 || idx % 7 === 6

  return (
    <View style={g.grid}>
      {DOW.map((d, i) => (
        <View key={d} style={g.dowCell}>
          <Text style={[g.dow, (i === 0 || i === 6) && g.dowWeekend]}>{d}</Text>
        </View>
      ))}
      {cells.map((day, idx) => {
        if (day === null) return <View key={`e${idx}`} style={g.cell} />
        const today_ = isToday(day)
        const hType = holidayMap.get(day)
        const weekend = isWeekend(idx)
        return (
          <View key={idx} style={g.cell}>
            <View style={[
              g.dayBox,
              today_ && g.dayBoxToday,
              hType === 'national' && !today_ && g.dayBoxHoliday,
              hType === 'cuti' && !today_ && g.dayBoxCuti,
            ]}>
              <Text style={[
                g.dayNum,
                today_ && g.dayNumToday,
                hType && !today_ && (hType === 'national' ? g.dayNumHoliday : g.dayNumCuti),
                weekend && !today_ && !hType && g.dayNumWeekend,
              ]}>
                {day}
              </Text>
              {hType && !today_ && <View style={[g.holidayDot, { backgroundColor: hType === 'national' ? RED : AMBER }]} />}
              {today_ && <View style={g.todayDot} />}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const g = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingTop: 8 },
  dowCell: { width: '14.28%', alignItems: 'center', marginBottom: 10 },
  dow: { fontSize: 11, fontWeight: '700', color: '#9CC09C', letterSpacing: 0.5 },
  dowWeekend: { color: '#BDBDBD' },
  cell: { width: '14.28%', alignItems: 'center', marginBottom: 4 },
  dayBox: {
    width: 38, height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxToday: { backgroundColor: G },
  dayBoxHoliday: { backgroundColor: '#FFEBEE' },
  dayBoxCuti: { backgroundColor: '#FFF8E1' },
  dayNum: { fontSize: 14, fontWeight: '500', color: '#1A2B1A' },
  dayNumToday: { color: '#FFFFFF', fontWeight: '900' },
  dayNumHoliday: { color: '#C62828', fontWeight: '700' },
  dayNumCuti: { color: '#E65100', fontWeight: '700' },
  dayNumWeekend: { color: '#BDBDBD' },
  holidayDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 3 },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', position: 'absolute', bottom: 3 },
})

export default function CalendarScreen() {
  const now = dayjs()
  const [viewMonth, setViewMonth] = useState(now.month())
  const [viewYear, setViewYear] = useState(now.year())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const holidays = getHolidaysForMonth(viewYear, viewMonth)
  const isCurrentMonth = viewMonth === now.month() && viewYear === now.year()

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={G} />

      {/* Green hero header */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>KALENDER</Text>
        <View style={s.heroNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn} activeOpacity={0.7}>
            <Text style={s.navArrow}>‹</Text>
          </TouchableOpacity>
          <View style={s.heroCenter}>
            <Text style={s.heroMonth}>{MONTHS_LONG[viewMonth]}</Text>
            <Text style={s.heroYear}>{viewYear}</Text>
          </View>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn} activeOpacity={0.7}>
            <Text style={s.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Month stats */}
        <View style={s.heroStats}>
          <View style={s.heroStatChip}>
            <Text style={s.heroStatNum}>{holidays.filter(h => h.type === 'national').length}</Text>
            <Text style={s.heroStatLabel}>Libur Nasional</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStatChip}>
            <Text style={s.heroStatNum}>{holidays.filter(h => h.type === 'cuti').length}</Text>
            <Text style={s.heroStatLabel}>Cuti Bersama</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStatChip}>
            <Text style={s.heroStatNum}>{holidays.length}</Text>
            <Text style={s.heroStatLabel}>Total Libur</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar grid card */}
        <View style={s.calCard}>
          <CalendarGrid year={viewYear} month={viewMonth} />
        </View>

        {/* Legend */}
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.legendSwatch, { backgroundColor: G }]} />
            <Text style={s.legendText}>Hari ini</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendSwatch, { backgroundColor: '#FFEBEE' }]}>
              <View style={[s.legendDot, { backgroundColor: RED }]} />
            </View>
            <Text style={s.legendText}>Libur nasional</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendSwatch, { backgroundColor: '#FFF8E1' }]}>
              <View style={[s.legendDot, { backgroundColor: AMBER }]} />
            </View>
            <Text style={s.legendText}>Cuti bersama</Text>
          </View>
        </View>

        {/* Holiday list */}
        {holidays.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>HARI LIBUR BULAN INI</Text>
            {holidays.map((h, i) => {
              const isNational = h.type === 'national'
              const color = isNational ? RED : AMBER
              const bg = isNational ? '#FFEBEE' : '#FFF8E1'
              return (
                <View key={i} style={s.holidayCard}>
                  <View style={[s.holidayIconWrap, { backgroundColor: bg }]}>
                    <View style={[s.holidayIconBar, { backgroundColor: color }]} />
                  </View>
                  <View style={s.holidayInfo}>
                    <Text style={s.holidayName}>{h.name}</Text>
                    <Text style={s.holidayDate}>{dayjs(h.date).format('dddd, D MMMM YYYY')}</Text>
                  </View>
                  <View style={[s.holidayBadge, { backgroundColor: bg }]}>
                    <Text style={[s.holidayBadgeText, { color }]}>
                      {isNational ? 'Nasional' : 'Cuti'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={s.noHoliday}>
            <Text style={s.noHolidayTitle}>Tidak ada hari libur</Text>
            <Text style={s.noHolidaySub}>Bulan ini tidak ada libur nasional{'\n'}maupun cuti bersama</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G },

  hero: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 24,
  },
  heroLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 3,
    color: 'rgba(255,255,255,0.70)', marginBottom: 20,
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { fontSize: 24, color: '#FFFFFF', fontWeight: '300', lineHeight: 28 },
  heroCenter: { alignItems: 'center' },
  heroMonth: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  heroYear: { fontSize: 13, color: 'rgba(255,255,255,0.70)', letterSpacing: 1, marginTop: 2 },

  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  heroStatChip: { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', lineHeight: 28 },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.70)', letterSpacing: 0.5, marginTop: 4, textAlign: 'center' },
  heroStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },

  body: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  bodyContent: { paddingBottom: 48 },

  calCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2F0E2',
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  legend: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: {
    width: 20, height: 20, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  legendDot: { width: 5, height: 5, borderRadius: 2.5 },
  legendText: { fontSize: 12, color: '#4A7A4A' },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
    color: '#9CC09C', marginBottom: 12,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2F0E2',
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  holidayIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  holidayIconBar: { width: 4, height: 28, borderRadius: 2 },
  holidayIcon: { fontSize: 22 },
  holidayInfo: { flex: 1 },
  holidayName: { fontSize: 14, fontWeight: '700', color: '#1A2B1A', marginBottom: 3 },
  holidayDate: { fontSize: 12, color: '#4A7A4A', letterSpacing: 0.2 },
  holidayBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  holidayBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  noHoliday: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  noHolidayIcon: { display: 'none' },
  noHolidayTitle: { fontSize: 17, fontWeight: '800', color: '#1A2B1A', marginBottom: 8 },
  noHolidaySub: { fontSize: 13, color: '#9CC09C', textAlign: 'center', lineHeight: 20 },
})
