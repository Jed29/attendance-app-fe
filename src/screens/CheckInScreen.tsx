import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'
import { checkIn } from '../modules/attendance'
import { extractError } from '../lib/api'

interface Props {
  onSuccess: () => void
  onBack: () => void
}

export default function CheckInScreen({ onSuccess, onBack }: Props) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(true)

  useEffect(() => {
    getLocation()
  }, [])

  const getLocation = async () => {
    setLocLoading(true)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Izin Lokasi', 'Aplikasi perlu akses lokasi untuk absen')
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
      Alert.alert('Izin Kamera', 'Aplikasi perlu akses kamera untuk foto selfie')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert('Lokasi belum tersedia', 'Tunggu sebentar atau coba lagi')
      return
    }
    setLoading(true)
    try {
      await checkIn(location.lat, location.lng, photoUri ?? undefined)
      Alert.alert('Berhasil! ✅', 'Absen masuk tercatat', [{ text: 'OK', onPress: onSuccess }])
    } catch (err) {
      Alert.alert('Absen Gagal', extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Kembali</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Absen Masuk</Text>

      <View style={styles.section}>
        <Text style={styles.label}>📍 Lokasi</Text>
        {locLoading
          ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 8 }} />
          : location
            ? <Text style={styles.value}>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</Text>
            : (
              <TouchableOpacity onPress={getLocation} style={styles.retryBtn}>
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            )
        }
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>📸 Foto Selfie</Text>
        {photoUri
          ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity onPress={takePhoto} style={styles.retryBtn}>
                <Text style={styles.retryText}>Ambil Ulang</Text>
              </TouchableOpacity>
            </View>
          )
          : (
            <TouchableOpacity onPress={takePhoto} style={styles.cameraBtn}>
              <Text style={styles.cameraBtnText}>📷 Buka Kamera</Text>
            </TouchableOpacity>
          )
        }
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (loading || locLoading) && styles.disabled]}
        onPress={handleCheckIn}
        disabled={loading || locLoading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>✅ Absen Sekarang</Text>
        }
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24, paddingTop: 60 },
  back: { marginBottom: 16 },
  backText: { color: '#3b82f6', fontSize: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 32 },
  section: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  value: { color: '#fff', fontSize: 14 },
  photo: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  cameraBtn: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#3b82f6' },
  cameraBtnText: { color: '#3b82f6', fontWeight: '600' },
  retryBtn: { padding: 8, alignItems: 'center' },
  retryText: { color: '#94a3b8', fontSize: 13 },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
