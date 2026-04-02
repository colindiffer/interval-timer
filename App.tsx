import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from './src/theme/ThemeContext'
import { AuthProvider } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'
import { initializeMobileAds } from './src/lib/ads'

export default function App() {
  useEffect(() => {
    initializeMobileAds()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  )
}
