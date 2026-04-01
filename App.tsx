import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from './src/theme/ThemeContext'
import AppNavigator from './src/navigation/AppNavigator'
import { initializeMobileAds } from './src/lib/ads'

export default function App() {
  useEffect(() => {
    initializeMobileAds()
  }, [])

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </ThemeProvider>
  )
}
