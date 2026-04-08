import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import auth from '@react-native-firebase/auth'
import type { FirebaseAuthTypes } from '@react-native-firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  signInWithGoogle,
  getGoogleSignInErrorMessage,
  isGoogleSignInCancelled,
  signInWithApple,
  getAppleSignInErrorMessage,
  isAppleSignInCancelled,
  signInWithEmail,
  createAccountWithEmail,
  sendPasswordReset,
  signOut as authSignOut,
  isAppleAuthAvailable,
} from '../auth/authService'
import { syncOnSignIn } from '../data/syncService'

const GUEST_KEY = '@auth_guest'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:           FirebaseAuthTypes.User | null
  isGuest:        boolean
  loading:        boolean
  appleAvailable: boolean
  signInGoogle:        () => Promise<void>
  signInApple:         () => Promise<void>
  signInEmail:         (email: string, password: string) => Promise<void>
  createAccountEmail:  (email: string, password: string) => Promise<void>
  resetPassword:       (email: string) => Promise<void>
  continueAsGuest:     () => Promise<void>
  signOut:             () => Promise<void>
  getGoogleErrorMessage: (error: unknown) => string
  isGoogleCancel: (error: unknown) => boolean
  getAppleErrorMessage: (error: unknown) => string
  isAppleCancel: (error: unknown) => boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<FirebaseAuthTypes.User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  const appleAvailable = isAppleAuthAvailable()

  useEffect(() => {
    // Restore guest flag
    AsyncStorage.getItem(GUEST_KEY).then(val => {
      if (val === 'true') setIsGuest(true)
    })

    // Firebase persists its own session — this fires immediately with
    // the cached user (or null) so we can gate the navigator.
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle()
    await AsyncStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    const uid = auth().currentUser?.uid
    if (uid) syncOnSignIn(uid).catch(console.error)
  }, [])

  const signInApple = useCallback(async () => {
    await signInWithApple()
    await AsyncStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    const uid = auth().currentUser?.uid
    if (uid) syncOnSignIn(uid).catch(console.error)
  }, [])

  const signInEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password)
    await AsyncStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    const uid = auth().currentUser?.uid
    if (uid) syncOnSignIn(uid).catch(console.error)
  }, [])

  const createAccountEmail = useCallback(async (email: string, password: string) => {
    await createAccountWithEmail(email, password)
    await AsyncStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    const uid = auth().currentUser?.uid
    if (uid) syncOnSignIn(uid).catch(console.error)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordReset(email)
  }, [])

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, 'true')
    setIsGuest(true)
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    await AsyncStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, isGuest, loading, appleAvailable,
      signInGoogle, signInApple, signInEmail, createAccountEmail, resetPassword,
      continueAsGuest, signOut,
      getGoogleErrorMessage: getGoogleSignInErrorMessage,
      isGoogleCancel: isGoogleSignInCancelled,
      getAppleErrorMessage: getAppleSignInErrorMessage,
      isAppleCancel: isAppleSignInCancelled,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
