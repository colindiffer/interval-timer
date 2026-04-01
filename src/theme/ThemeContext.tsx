import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useColorScheme } from 'react-native'
import { getSettings, saveSettings } from '../data/storage'
import { AppSettings } from '../types'
import { DarkColors, LightColors } from './colors'

type ThemeMode = 'light' | 'dark'

interface ThemeContextValue {
  theme:        ThemeMode
  darkModeSetting: AppSettings['darkMode']
  setDarkMode:  (value: AppSettings['darkMode']) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:           'dark',
  darkModeSetting: 'system',
  setDarkMode:     () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme  = useColorScheme()  // 'light' | 'dark' | null
  const [darkModeSetting, setDarkModeState] = useState<AppSettings['darkMode']>('system')

  useEffect(() => {
    getSettings().then(s => setDarkModeState(s.darkMode))
  }, [])

  const setDarkMode = useCallback((value: AppSettings['darkMode']) => {
    setDarkModeState(value)
    saveSettings({ darkMode: value })
  }, [])

  let theme: ThemeMode
  if (darkModeSetting === 'system') {
    theme = systemScheme === 'light' ? 'light' : 'dark'
  } else {
    theme = darkModeSetting ? 'dark' : 'light'
  }

  return (
    <ThemeContext.Provider value={{ theme, darkModeSetting, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useColors() {
  const { theme } = useTheme()
  return theme === 'light' ? LightColors : DarkColors
}
