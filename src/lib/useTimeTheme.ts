import { useMemo } from 'react'

export interface TimeTheme {
  bg: string
  surface: string
  card: string
  border: string
  primary: string
  primaryDim: string
  amber: string
  red: string
  text1: string
  text2: string
  text3: string
  isDark: boolean
  period: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night'
}

function getPeriod(): TimeTheme['period'] {
  const h = new Date().getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 13) return 'morning'
  if (h >= 13 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'evening'
  return 'night'
}

const BASE: Omit<TimeTheme, 'period'> = {
  bg: '#FFFFFF',
  surface: '#F4FAF4',
  card: '#FFFFFF',
  border: '#E2F0E2',
  primary: '#43A047',
  primaryDim: 'rgba(67,160,71,0.10)',
  amber: '#F59E0B',
  red: '#EF4444',
  text1: '#1A2B1A',
  text2: '#4A7A4A',
  text3: '#9CC09C',
  isDark: false,
}

export function useTimeTheme(): TimeTheme {
  return useMemo(() => {
    const period = getPeriod()
    return { ...BASE, period }
  }, [])
}
