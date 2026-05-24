import { api } from '../../lib/api'
import { AttendanceRecord, TodayStatus } from '../../types'

export async function checkIn(lat: number, lng: number, photoUri?: string): Promise<AttendanceRecord> {
  const form = new FormData()
  form.append('lat', String(lat))
  form.append('lng', String(lng))

  if (photoUri) {
    const filename = photoUri.split('/').pop() ?? 'photo.jpg'
    const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
    form.append('photo', { uri: photoUri, name: filename, type } as any)
  }

  const { data } = await api.post<AttendanceRecord>('/attendance/check-in', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function checkOut(): Promise<AttendanceRecord> {
  const { data } = await api.post<AttendanceRecord>('/attendance/check-out')
  return data
}

export async function getTodayStatus(): Promise<TodayStatus> {
  const { data } = await api.get<TodayStatus>('/attendance/today')
  return data
}

export async function getHistory(from?: string, to?: string): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const { data } = await api.get<{ data: AttendanceRecord[] }>(`/attendance/history?${params}`)
  return data.data ?? []
}
