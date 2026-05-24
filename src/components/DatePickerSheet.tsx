import React, { useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Modal, Animated,
  TouchableOpacity, FlatList, ListRenderItemInfo,
} from 'react-native'

const ITEM_H = 52
const VISIBLE = 5
const PICKER_H = ITEM_H * VISIBLE
const PAD = ITEM_H * 2

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = range(CURRENT_YEAR, CURRENT_YEAR + 3)

interface DrumColumnProps {
  data: string[]
  selectedIndex: number
  onSelect: (i: number) => void
  width: number
}

function DrumColumn({ data, selectedIndex, onSelect, width }: DrumColumnProps) {
  const ref = useRef<FlatList>(null)
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_H)).current

  const onMomentumEnd = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y
    const idx = Math.max(0, Math.min(Math.round(y / ITEM_H), data.length - 1))
    onSelect(idx)
  }, [data.length, onSelect])

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_H,
    offset: ITEM_H * index,
    index,
  })

  const renderItem = ({ item, index }: ListRenderItemInfo<string>) => {
    const distance = Math.abs(index - selectedIndex)
    const opacity = distance === 0 ? 1 : distance === 1 ? 0.45 : 0.18
    const fontSize = distance === 0 ? 20 : distance === 1 ? 16 : 13
    const fontWeight: any = distance === 0 ? '700' : '400'
    return (
      <View style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center', width }}>
        <Text style={{ color: '#F0F6FF', fontSize, fontWeight, opacity }}>
          {item}
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      ref={ref}
      data={data}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      onMomentumScrollEnd={onMomentumEnd}
      onScrollEndDrag={onMomentumEnd}
      initialScrollIndex={selectedIndex}
      style={{ height: PICKER_H, width }}
      contentContainerStyle={{ paddingVertical: PAD }}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
    />
  )
}

interface Props {
  visible: boolean
  value?: string
  onConfirm: (date: string) => void
  onCancel: () => void
}

export default function DatePickerSheet({ visible, value, onConfirm, onCancel }: Props) {
  const slideY = useRef(new Animated.Value(400)).current
  const backdropOp = useRef(new Animated.Value(0)).current

  const parseValue = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number)
      return { year: YEARS.indexOf(y) !== -1 ? YEARS.indexOf(y) : 0, month: m - 1, day: d - 1 }
    }
    const now = new Date()
    return { year: 0, month: now.getMonth(), day: now.getDate() - 1 }
  }

  const init = parseValue()
  const [yearIdx, setYearIdx] = useState(init.year)
  const [monthIdx, setMonthIdx] = useState(init.month)
  const [dayIdx, setDayIdx] = useState(init.day)

  const days = range(1, daysInMonth(monthIdx + 1, YEARS[yearIdx]))
  const dayStrings = days.map((d) => String(d).padStart(2, '0'))
  const monthStrings = MONTHS
  const yearStrings = YEARS.map(String)

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 400, duration: 250, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  const handleConfirm = () => {
    const y = YEARS[yearIdx]
    const m = String(monthIdx + 1).padStart(2, '0')
    const d = String(Math.min(dayIdx + 1, daysInMonth(monthIdx + 1, y))).padStart(2, '0')
    onConfirm(`${y}-${m}-${d}`)
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[s.backdrop, { opacity: backdropOp }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onCancel} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Text style={s.cancel}>Batal</Text>
          </TouchableOpacity>
          <Text style={s.title}>Pilih Tanggal</Text>
          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7}>
            <Text style={s.confirm}>Pilih</Text>
          </TouchableOpacity>
        </View>

        <View style={s.pickerWrap}>
          <View style={s.selectorTop} pointerEvents="none" />
          <View style={s.selectorBottom} pointerEvents="none" />

          <View style={s.columns}>
            <DrumColumn
              data={dayStrings}
              selectedIndex={Math.min(dayIdx, dayStrings.length - 1)}
              onSelect={setDayIdx}
              width={64}
            />
            <DrumColumn
              data={monthStrings}
              selectedIndex={monthIdx}
              onSelect={setMonthIdx}
              width={140}
            />
            <DrumColumn
              data={yearStrings}
              selectedIndex={yearIdx}
              onSelect={setYearIdx}
              width={72}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#13181F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1C2A3F',
    borderBottomWidth: 0,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2A3F',
  },
  title: { fontSize: 15, fontWeight: '600', color: '#F0F6FF' },
  cancel: { fontSize: 15, color: '#7B8FAF' },
  confirm: { fontSize: 15, fontWeight: '700', color: '#00C896' },
  pickerWrap: {
    position: 'relative',
    height: PICKER_H,
    overflow: 'hidden',
  },
  selectorTop: {
    position: 'absolute',
    top: PAD,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: '#1C2A3F',
    zIndex: 10,
  },
  selectorBottom: {
    position: 'absolute',
    top: PAD + ITEM_H,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: '#1C2A3F',
    zIndex: 10,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
})
