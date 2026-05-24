import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { Employee } from '../types'

interface AppState {
  user: Employee | null
  token: string | null
  setAuth: (user: Employee, token: string) => Promise<void>
  clearAuth: () => Promise<void>
  loadAuth: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('auth_token', token)
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user))
    set({ user, token })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('auth_user')
    set({ user: null, token: null })
  },

  loadAuth: async () => {
    const token = await SecureStore.getItemAsync('auth_token')
    const userStr = await SecureStore.getItemAsync('auth_user')
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) })
    }
  },
}))
