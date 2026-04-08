import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from './src/theme/ThemeContext'
import { AuthProvider } from './src/context/AuthContext'
import { PurchaseProvider } from './src/context/PurchaseContext'
import AppNavigator from './src/navigation/AppNavigator'
import { I18nProvider } from './src/i18n'

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <PurchaseProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </PurchaseProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
