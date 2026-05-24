import axios, { AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

export const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function extractError(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.error ?? err.message
  }
  return 'Terjadi kesalahan'
}
