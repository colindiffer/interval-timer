import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from './src/theme/ThemeContext'
import { AuthProvider } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'
import { initializeMobileAds } from './src/lib/ads'
import { I18nProvider } from './src/i18n'

export default function App() {
  useEffect(() => {
    initializeMobileAds()
  }, [])

  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
