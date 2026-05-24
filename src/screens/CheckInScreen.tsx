import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, PanResponder, Easing,
  Platform, StatusBar, Dimensions, ScrollView,
} from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { checkIn } from '../modules/attendance'
import { extractError } from '../lib/api'
import FeedbackModal from '../components/FeedbackModal'

const { height: SCREEN_H } = Dimensions.get('window')
const CARD_H = SCREEN_H
// 46% peek — card visible but doesn't cover GPS step card
const PEEK = Math.round(SCREEN_H * 0.46)
const HIDDEN = CARD_H - PEEK

const G = '#43A047'

function AnimatedCheck({ active }: { active: boolean }) {
  const scale   = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const ring    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (active) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale,   { toValue: 1.2, friction: 5, tension: 120, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
      ]).start()
      Animated.timing(ring, { toValue: 1, duration: 500, useNativeDriver: false }).start()
    } else {
      scale.setValue(0)
      opacity.setValue(0)
      ring.setValue(0)
    }
  }, [active])

  const ringSize = ring.interpolate({ inputRange: [0, 1], outputRange: [22, 36] })
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.2, 0] })

  return (
    <View style={ck.wrap}>
      {/* Ripple ring */}
      <Animated.View style={[ck.ring, { width: ringSize, height: ringSize, borderRadius: 20, opacity: ringOpacity }]} />
      {/* Check circle */}
      <Animated.View style={[ck.circle, { transform: [{ scale }], opacity }]}>
        <Text style={ck.mark}>✓</Text>
      </Animated.View>
    </View>
  )
}

const ck = StyleSheet.create({
  wrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    backgroundColor: 'transparent',
  },
  circle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  mark: { fontSize: 11, color: '#2E7D32', fontWeight: '900', lineHeight: 13 },
})

function SwipeIndicator({ isDragging }: { isDragging: boolean }) {
  const bounceY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isDragging) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, { toValue: -10, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [isDragging])

  if (isDragging) {
    return (
      <View style={styles.swipeIndWrap}>
        <Text style={styles.releaseText}>LEPASKAN</Text>
        <Text style={styles.releaseSubText}>untuk konfirmasi absen</Text>
      </View>
    )
  }

  return (
    <Animated.View style={[styles.swipeIndWrap, { transform: [{ translateY: bounceY }] }]}>
      <Text style={styles.chevronStack}>{'∧\n∧'}</Text>
      <Text style={styles.swipeText}>GESER KE ATAS</Text>
      <Text style={styles.swipeSubText}>untuk absen masuk</Text>
    </Animated.View>
  )
}

interface Props {
  onSuccess: () => void
  onBack: () => void
}

export default function CheckInScreen({ onSuccess, onBack }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(true)
  const [modal, setModal] = useState<{
    visible: boolean; type: 'success' | 'error'; title: string; message?: string
  }>({ visible: false, type: 'success', title: '' })

  const cardY = useRef(new Animated.Value(HIDDEN)).current
  const triggeredRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const isReady = !!location && !locLoading

  useEffect(() => { getLocation() }, [])

  const ejectCardUp = (onDone: () => void) => {
    Animated.timing(cardY, {
      toValue: -CARD_H,
      duration: 380,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(onDone)
  }

  const bounceCardBack = () => {
    triggeredRef.current = false
    setLoading(false)
    Animated.sequence([
      Animated.timing(cardY, { toValue: HIDDEN * 0.7, duration: 150, useNativeDriver: true }),
      Animated.spring(cardY, { toValue: HIDDEN, friction: 5, tension: 70, useNativeDriver: true }),
    ]).start()
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !triggeredRef.current,
      onMoveShouldSetPanResponder: (_, gs) => !triggeredRef.current && Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (triggeredRef.current) return
        setIsDragging(true)
        const newY = Math.max(0, Math.min(HIDDEN, HIDDEN + gs.dy))
        cardY.setValue(newY)
      },
      onPanResponderRelease: (_, gs) => {
        setIsDragging(false)
        if (triggeredRef.current) return
        const draggedUp = gs.dy < -(HIDDEN * 0.40) || gs.vy < -0.55

        if (draggedUp) {
          triggeredRef.current = true
          Animated.spring(cardY, {
            toValue: 0, friction: 8, tension: 80, useNativeDriver: true,
          }).start(async () => {
            setLoading(true)
            try {
              await checkIn(location!.lat, location!.lng, photoUri ?? undefined)
              ejectCardUp(() => onSuccess())
            } catch (err) {
              setModal({ visible: true, type: 'error', title: 'Absen Gagal', message: extractError(err) })
              bounceCardBack()
            }
          })
        } else {
          Animated.spring(cardY, {
            toValue: HIDDEN, useNativeDriver: true, friction: 7, tension: 50,
          }).start()
        }
      },
    })
  ).current

  const getLocation = async () => {
    setLocLoading(true)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setModal({ visible: true, type: 'error', title: 'Izin Lokasi', message: 'Aplikasi perlu akses lokasi untuk absen' })
      setLocLoading(false)
      return
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    setLocLoading(false)
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      setModal({ visible: true, type: 'error', title: 'Izin Kamera', message: 'Aplikasi perlu akses kamera' })
      return
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const overlayOpacity = cardY.interpolate({
    inputRange: [0, HIDDEN],
    outputRange: [0.45, 0],
    extrapolate: 'clamp',
  })

  const arrowsOpacity = cardY.interpolate({
    inputRange: [0, HIDDEN * 0.4, HIDDEN],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  })

  const confirmOpacity = cardY.interpolate({
    inputRange: [0, HIDDEN * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const cardRotate = cardY.interpolate({
    inputRange: [0, HIDDEN],
    outputRange: ['0deg', '1.5deg'],
    extrapolate: 'clamp',
  })

  const cardScale = cardY.interpolate({
    inputRange: [0, HIDDEN],
    outputRange: [1, 0.96],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={G} />

      {/* Header — rendered last in JSX so it's always on top */}
      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backText}>‹ KEMBALI</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.screenTitle}>ABSEN MASUK</Text>
          <Text style={styles.screenSub}>Lengkapi langkah, lalu geser kartu</Text>
        </View>
      </View>

      {/* Steps content (in normal flow, below header) */}
      <ScrollView
        style={styles.stepsScroll}
        contentContainerStyle={[styles.stepsContent, { paddingBottom: PEEK + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: GPS */}
        <View style={styles.stepCard}>
          <View style={[styles.stepNumBadge, { borderColor: isReady ? '#A5D6A7' : 'rgba(255,255,255,0.30)' }]}>
            <Text style={styles.stepNumText}>01</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>Koordinat GPS</Text>
            {locLoading ? (
              <Text style={styles.stepSub}>Mendeteksi lokasi...</Text>
            ) : location ? (
              <View>
                <View style={styles.statusRow}>
                  <AnimatedCheck active={isReady} />
                  <Text style={styles.statusOk}>Lokasi terdeteksi</Text>
                </View>
                <Text style={styles.coordText}>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={getLocation}>
                <Text style={[styles.stepSub, { color: '#FFB74D' }]}>Gagal — ketuk untuk coba lagi</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.stepConnector} />

        {/* Step 2: Photo */}
        <View style={styles.stepCard}>
          <View style={[styles.stepNumBadge, { borderColor: photoUri ? '#A5D6A7' : 'rgba(255,255,255,0.30)' }]}>
            <Text style={styles.stepNumText}>02</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>Foto Selfie <Text style={styles.optionalText}>(opsional)</Text></Text>
            {photoUri ? (
              <View>
                <View style={styles.statusRow}>
                  <AnimatedCheck active={!!photoUri} />
                  <Text style={styles.statusOk}>Foto tersedia</Text>
                </View>
                <View style={styles.photoRow}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                  <TouchableOpacity onPress={takePhoto}>
                    <Text style={[styles.stepSub, { color: 'rgba(255,255,255,0.80)' }]}>Ambil ulang</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.85}>
                <Text style={styles.cameraBtnText}>BUKA KAMERA</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Dark overlay when card raised */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayOpacity }]}
      />

      {/* SWIPE CARD */}
      <Animated.View
        style={[
          styles.swipeCard,
          {
            height: CARD_H,
            transform: [
              { translateY: cardY },
              { rotate: cardRotate },
              { scale: cardScale },
            ],
          },
        ]}
        {...(isReady ? pan.panHandlers : {})}
      >
        <View style={styles.cardDragArea}>
          <View style={styles.cardHandle} />
        </View>

        <View style={[styles.cardHeaderStrip, { backgroundColor: isReady ? G : '#9E9E9E' }]}>
          <View>
            <Text style={styles.cardStripSub}>PERTALIFE ATTENDANCE</Text>
            <Text style={styles.cardStripTitle}>{isReady ? 'SIAP ABSEN' : 'TUNGGU GPS...'}</Text>
          </View>
          <View style={[styles.cardStripBadge, { backgroundColor: isReady ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)' }]}>
            <View style={[styles.cardStripDot, { backgroundColor: isReady ? '#A5D6A7' : '#BDBDBD' }]} />
            <Text style={styles.cardStripStatus}>{isReady ? 'AKTIF' : 'PROSES'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {loading ? (
            <View style={styles.loadingArea}>
              <View style={styles.loadingRingOuter}>
                <View style={[styles.loadingRingInner, { borderTopColor: G }]} />
              </View>
              <Text style={styles.loadingText}>Menyimpan absensi...</Text>
            </View>
          ) : (
            <Animated.View style={[styles.confirmArea, { opacity: confirmOpacity }]}>
              <Text style={styles.confirmTitle}>
                {isReady ? 'Geser kartu ke atas' : 'Menunggu GPS aktif'}
              </Text>
              <Text style={styles.confirmSub}>
                {isReady
                  ? 'Lokasi berhasil terdeteksi.\nGeser kartu ini ke atas untuk absen masuk.'
                  : 'Pastikan GPS aktif pada perangkatmu.'}
              </Text>

              {isReady && location && (
                <View style={styles.confirmInfoBox}>
                  <Text style={styles.confirmInfoLabel}>KOORDINAT AKTIF</Text>
                  <Text style={styles.confirmInfoVal}>
                    {location.lat.toFixed(5)}{'\n'}{location.lng.toFixed(5)}
                  </Text>
                  {photoUri && (
                    <Text style={[styles.confirmInfoLabel, { marginTop: 12 }]}>FOTO TERSEDIA</Text>
                  )}
                </View>
              )}
            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.swipeIndicatorWrap, { opacity: arrowsOpacity }]}>
          <SwipeIndicator isDragging={isDragging} />
        </Animated.View>
      </Animated.View>

      <FeedbackModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText="TUTUP"
        onConfirm={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: G },

  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 20,
    zIndex: 100,
  },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.80)', fontWeight: '700' },
  screenTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  screenSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  stepsScroll: { flex: 1 },
  stepsContent: { paddingHorizontal: 24, paddingTop: 8 },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    padding: 18,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignSelf: 'flex-start',
    marginLeft: 30,
  },
  stepNumBadge: {
    width: 36, height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  stepNumText: {
    fontSize: 11, fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  stepSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 },
  optionalText: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '400' },
  coordText: {
    fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusOk: { fontSize: 12, color: '#A5D6A7', fontWeight: '600' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoThumb: { width: 48, height: 48, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  cameraBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  cameraBtnText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700', letterSpacing: 1.5 },

  swipeCard: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  cardDragArea: { paddingTop: 14, paddingBottom: 6, alignItems: 'center' },
  cardHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },

  cardHeaderStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 16,
  },
  cardStripSub: { fontSize: 9, color: 'rgba(255,255,255,0.70)', letterSpacing: 2, marginBottom: 4 },
  cardStripTitle: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  cardStripBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  cardStripDot: { width: 6, height: 6, borderRadius: 3 },
  cardStripStatus: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },

  cardBody: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingBottom: 80,
  },
  confirmArea: { alignItems: 'center', width: '100%' },
  confirmTitle: { fontSize: 22, fontWeight: '900', color: '#1A2B1A', marginBottom: 10, textAlign: 'center' },
  confirmSub: { fontSize: 14, color: '#4A7A4A', textAlign: 'center', lineHeight: 22 },
  confirmInfoBox: {
    marginTop: 24, width: '100%',
    backgroundColor: '#F4FAF4',
    borderRadius: 14, borderWidth: 1, borderColor: '#E2F0E2',
    padding: 18,
  },
  confirmInfoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: '#9CC09C', marginBottom: 6 },
  confirmInfoVal: {
    fontSize: 13, color: '#1A2B1A',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5, lineHeight: 22,
  },

  loadingArea: { alignItems: 'center' },
  loadingRingOuter: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: '#E2F0E2',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingRingInner: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: 'transparent',
  },
  loadingText: { fontSize: 14, color: '#4A7A4A', marginTop: 20, letterSpacing: 0.5 },

  swipeIndicatorWrap: {
    position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center',
  },
  swipeIndWrap: { alignItems: 'center' },
  chevronStack: { fontSize: 20, color: G, fontWeight: '300', lineHeight: 20, textAlign: 'center', marginBottom: 6 },
  swipeText: { fontSize: 11, fontWeight: '800', letterSpacing: 3, color: G },
  swipeSubText: { fontSize: 11, color: '#9CC09C', marginTop: 3 },
  releaseText: { fontSize: 16, fontWeight: '800', letterSpacing: 4, color: G },
  releaseSubText: { fontSize: 11, color: '#9CC09C', marginTop: 4 },
})
