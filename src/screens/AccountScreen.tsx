import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, StatusBar,
} from 'react-native'
import { useAppStore } from '../store/useAppStore'
import FeedbackModal from '../components/FeedbackModal'

const G = '#43A047'

interface Props {
  onLogout: () => void
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  )
}

export default function AccountScreen({ onLogout }: Props) {
  const user = useAppStore((u) => u.user)
  const [logoutModal, setLogoutModal] = useState(false)

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={G} />

      {/* Green hero header */}
      <View style={s.hero}>
        <Text style={s.heroTitle}>AKUN</Text>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.userName}>{user?.name}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>
              {user?.role === 'admin' ? 'ADMINISTRATOR' : 'KARYAWAN'}
            </Text>
          </View>
        </View>
      </View>

      {/* White body */}
      <View style={s.body}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>INFORMASI AKUN</Text>
          <View style={s.infoCard}>
            <InfoRow label="Nama Lengkap" value={user?.name ?? '-'} />
            <View style={s.divider} />
            <InfoRow label="Email" value={user?.email ?? '-'} />
            <View style={s.divider} />
            <InfoRow label="Hak Akses" value={user?.role === 'admin' ? 'Administrator' : 'Karyawan'} />
            <View style={s.divider} />
            <InfoRow label="ID Karyawan" value={user?.id?.slice(0, 8).toUpperCase() ?? '-'} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>LAINNYA</Text>
          <View style={s.infoCard}>
            <TouchableOpacity style={s.menuRow} activeOpacity={0.7}>
              <Text style={s.menuLabel}>Ganti Password</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.menuRow} activeOpacity={0.7}>
              <Text style={s.menuLabel}>Bantuan & Dukungan</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.menuRow} activeOpacity={0.7}>
              <Text style={s.menuLabel}>Tentang Aplikasi</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.logoutWrap}>
          <TouchableOpacity style={s.logoutBtn} onPress={() => setLogoutModal(true)} activeOpacity={0.85}>
            <Text style={s.logoutText}>KELUAR</Text>
          </TouchableOpacity>
          <Text style={s.version}>Pertalife Attendance v1.0.0</Text>
        </View>
      </View>

      <FeedbackModal
        visible={logoutModal}
        type="confirm"
        title="Keluar dari Akun?"
        message="Kamu perlu login kembali setelah keluar."
        confirmText="YA, KELUAR"
        cancelText="BATAL"
        onConfirm={() => { setLogoutModal(false); onLogout() }}
        onCancel={() => setLogoutModal(false)}
      />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: G },
  content: { flexGrow: 1 },
  hero: {
    backgroundColor: G,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    alignSelf: 'flex-start',
    fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.75)',
    letterSpacing: 3, marginBottom: 24,
  },
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.50)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5,
  },
  roleText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },

  body: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -20,
    paddingTop: 28,
    paddingBottom: 40,
    flex: 1,
  },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: '#9CC09C',
    letterSpacing: 2.5, marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#F4FAF4',
    borderRadius: 16, borderWidth: 1, borderColor: '#E2F0E2',
    overflow: 'hidden',
    shadowColor: '#43A047',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15,
  },
  infoLabel: { fontSize: 13, color: '#4A7A4A' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1A2B1A', maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#E2F0E2', marginHorizontal: 18 },
  menuRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16,
  },
  menuLabel: { fontSize: 14, color: '#1A2B1A', fontWeight: '500' },
  menuArrow: { fontSize: 22, color: '#9CC09C' },
  logoutWrap: { paddingHorizontal: 20, marginTop: 8 },
  logoutBtn: {
    backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFCDD2',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#EF4444', letterSpacing: 2 },
  version: { textAlign: 'center', fontSize: 12, color: '#9CC09C' },
})
