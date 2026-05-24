import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar, Animated, Image,
} from 'react-native'
import { login, extractError } from '../modules/auth'

const G = '#43A047'
const G_DARK = '#2E7D32'

interface Props {
  onLoginSuccess: () => void
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)

  const cardAnim  = useRef(new Animated.Value(0)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(32)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      shakeCard()
      Alert.alert('', 'Email dan password wajib diisi')
      return
    }
    setLoading(true)
    try {
      await login(email.toLowerCase().trim(), password)
      onLoginSuccess()
    } catch (err) {
      shakeCard()
      Alert.alert('Login Gagal', extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const shakeCard = () => {
    Animated.sequence([
      Animated.timing(cardAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={G} />

      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo section */}
        <View style={styles.brandArea}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Pertalife Attendance</Text>
          <Text style={styles.brandTagline}>Sistem Absensi Digital</Text>
        </View>

        {/* Login card */}
        <Animated.View style={[styles.card, { transform: [{ translateX: cardAnim }] }]}>
          <Text style={styles.cardTitle}>Masuk ke Akun</Text>
          <Text style={styles.cardSub}>Gunakan email dan kata sandi kamu</Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, focused === 'email' && styles.fieldLabelActive]}>EMAIL</Text>
            <TextInput
              style={[styles.input, focused === 'email' && styles.inputActive]}
              placeholder="nama@perusahaan.com"
              placeholderTextColor="#B0C8B0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, focused === 'password' && styles.fieldLabelActive]}>KATA SANDI</Text>
            <TextInput
              style={[styles.input, focused === 'password' && styles.inputActive]}
              placeholder="Masukkan kata sandi"
              placeholderTextColor="#B0C8B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnLoading]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Text style={styles.btnText}>MASUK</Text>
            }
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>Hubungi admin jika tidak bisa masuk</Text>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: G,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Decorative blobs
  bgCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: G_DARK,
    top: -80,
    right: -80,
    opacity: 0.55,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.10)',
    bottom: -60,
    left: -60,
  },

  inner: { width: '100%' },

  brandArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 140,
    height: 64,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.70)',
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2B1A',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: '#4A7A4A',
    marginBottom: 28,
  },

  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#9CC09C',
    fontWeight: '700',
    marginBottom: 8,
  },
  fieldLabelActive: { color: G },
  input: {
    backgroundColor: '#F4FAF4',
    borderWidth: 1.5,
    borderColor: '#E2F0E2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1A2B1A',
    fontSize: 15,
  },
  inputActive: {
    borderColor: G,
    backgroundColor: '#FFFFFF',
  },

  btn: {
    backgroundColor: G,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: G,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 8,
  },
  btnLoading: { opacity: 0.7 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
  },

  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
    marginTop: 28,
    letterSpacing: 0.5,
  },
})
