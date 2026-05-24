import { api, extractError } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'
import { Employee } from '../../types'

interface LoginResult {
  token: string
  employee: Employee
}

export async function login(email: string, password: string): Promise<void> {
  const { data } = await api.post<LoginResult>('/auth/login', { email, password })
  await useAppStore.getState().setAuth(data.employee, data.token)
}

export async function logout(): Promise<void> {
  await useAppStore.getState().clearAuth()
}

export { extractError }
