import React, { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Modal,
} from 'react-native'

type ModalType = 'success' | 'error' | 'confirm' | 'info'

interface Props {
  visible: boolean
  type: ModalType
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}

const ACCENT: Record<ModalType, string> = {
  success: '#4CAF50',
  error: '#EF4444',
  confirm: '#F59E0B',
  info: '#7B8FAF',
}

function SuccessIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 32, height: 22, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: 28,
        height: 16,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
        borderColor: color,
        borderRadius: 1,
        transform: [{ rotate: '-45deg' }, { translateY: -3 }],
      }} />
    </View>
  )
}

function ErrorIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        position: 'absolute',
        width: 28,
        height: 3,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
      }} />
      <View style={{
        position: 'absolute',
        width: 28,
        height: 3,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ rotate: '-45deg' }],
      }} />
    </View>
  )
}

function ConfirmIcon({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 5 }}>
      <View style={{ width: 4, height: 16, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: 4, height: 4, backgroundColor: color, borderRadius: 2 }} />
    </View>
  )
}

export default function FeedbackModal({
  visible,
  type,
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
}: Props) {
  const slideY = useRef(new Animated.Value(340)).current
  const backdropOp = useRef(new Animated.Value(0)).current
  const iconScale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start()
      })
    } else {
      iconScale.setValue(0)
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 340, duration: 240, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  const color = ACCENT[type]

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[s.backdrop, { opacity: backdropOp }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onCancel ?? onConfirm} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={s.handle} />

        <Animated.View style={[s.iconRing, { borderColor: color + '40', transform: [{ scale: iconScale }] }]}>
          <View style={[s.iconCircle, { backgroundColor: color + '20' }]}>
            {type === 'success' && <SuccessIcon color={color} />}
            {type === 'error' && <ErrorIcon color={color} />}
            {(type === 'confirm' || type === 'info') && <ConfirmIcon color={color} />}
          </View>
        </Animated.View>

        <Text style={s.title}>{title}</Text>
        {message ? <Text style={s.message}>{message}</Text> : null}

        <View style={s.divider} />

        <View style={s.btns}>
          {cancelText && onCancel && (
            <TouchableOpacity style={s.btnCancel} onPress={onCancel} activeOpacity={0.75}>
              <Text style={s.btnCancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.btnConfirm, { backgroundColor: color }]}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text style={s.btnConfirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 44,
    paddingTop: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', marginBottom: 28,
  },
  iconRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 2, alignItems: 'center',
    justifyContent: 'center', marginBottom: 24,
  },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '700', color: '#122012',
    textAlign: 'center', marginBottom: 8, letterSpacing: 0.2,
  },
  message: {
    fontSize: 14, color: '#547054',
    textAlign: 'center', lineHeight: 22,
  },
  divider: {
    height: 1, backgroundColor: '#E8F0E8',
    alignSelf: 'stretch', marginTop: 28, marginBottom: 20,
  },
  btns: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  btnCancel: {
    flex: 1, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  btnCancelText: {
    fontSize: 14, fontWeight: '600', color: '#547054', letterSpacing: 1,
  },
  btnConfirm: {
    flex: 1, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  btnConfirmText: {
    fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5,
  },
})
