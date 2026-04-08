import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, G } from 'react-native-svg'
import { useAuth } from '../context/AuthContext'
import { FontSize, FontWeight, Spacing, Radius, useColors } from '../theme'
import Logo from '../components/Logo'

// ─── Google icon (brand colours) ─────────────────────────────────────────────

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" fill="none">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l.1-.1 6.2 5.2C37 38.2 44 33 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </Svg>
  )
}

// ─── Apple icon ───────────────────────────────────────────────────────────────

function AppleIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={20} viewBox="0 0 814 1000" fill={color}>
      <Path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 391.3 8 224 8 121.6c0-43.9 5.8-87.3 28.5-125.8 34.1-58.6 95.2-95.9 162.3-95.9 70.9 0 111.3 40.8 164.7 40.8 52 0 100.5-41.5 175.2-41.5 27.1 0 121.1 2.6 188.3 78.7zm-30.3-159.4c14.4-17.6 25.7-40.2 25.7-62.8 0-3.2-.3-6.4-.6-9.7-24.3 2.6-54.8 17-72.5 36.5-14.4 16.3-27.7 38.8-27.7 62.8 0 3.6.3 7.1.6 10.3 1.3.3 2.6.6 3.9.6 22.7 0 51.2-14.4 70.6-37.7z"/>
    </Svg>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const C = useColors()
  const styles = createStyles(C)
  const {
    signInGoogle,
    signInApple,
    continueAsGuest,
    appleAvailable,
    getGoogleErrorMessage,
    isGoogleCancel,
    getAppleErrorMessage,
    isAppleCancel,
  } = useAuth()

  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingApple,  setLoadingApple]  = useState(false)

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    try {
      await signInGoogle()
    } catch (e: any) {
      if (!isGoogleCancel(e)) {
        Alert.alert('Sign in failed', getGoogleErrorMessage(e))
      }
    } finally {
      setLoadingGoogle(false)
    }
  }

  const handleApple = async () => {
    setLoadingApple(true)
    try {
      await signInApple()
    } catch (e: any) {
      if (!isAppleCancel(e)) {
        Alert.alert('Sign in failed', getAppleErrorMessage(e))
      }
    } finally {
      setLoadingApple(false)
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.brandArea}>
        <Logo size={72} />
        <Text style={styles.appName}>Flash Interval Timer Workout</Text>
        <Text style={styles.tagline}>Track every rep. Every second.</Text>
      </View>

      <View style={styles.buttons}>
        {/* Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogle}
          activeOpacity={0.85}
          disabled={loadingGoogle || loadingApple}
        >
          {loadingGoogle
            ? <ActivityIndicator color="#1a1a1a" />
            : (
              <>
                <GoogleIcon />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )
          }
        </TouchableOpacity>

        {/* Apple (iOS only) */}
        {appleAvailable ? (
          <TouchableOpacity
            style={styles.appleBtn}
            onPress={handleApple}
            activeOpacity={0.85}
            disabled={loadingGoogle || loadingApple}
          >
            {loadingApple
              ? <ActivityIndicator color="#ffffff" />
              : (
                <>
                  <AppleIcon color="#ffffff" />
                  <Text style={styles.appleBtnText}>Continue with Apple</Text>
                </>
              )
            }
          </TouchableOpacity>
        ) : null}

        {/* Guest */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={continueAsGuest}
          activeOpacity={0.7}
          disabled={loadingGoogle || loadingApple}
        >
          <Text style={styles.guestBtnText}>Continue without account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.legal}>
        By continuing you agree to our Terms of Service and Privacy Policy.
      </Text>
    </SafeAreaView>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex:            1,
      backgroundColor: C.bg,
      paddingHorizontal: Spacing.xl,
      justifyContent:  'space-between',
    },
    brandArea: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      gap:            Spacing.sm,
      paddingTop:     Spacing.xxl,
    },
    appName: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.heavy,
      color:      C.textPrimary,
      marginTop:  Spacing.sm,
      textAlign:  'center',
    },
    tagline: {
      fontSize: FontSize.md,
      color:    C.textSecondary,
    },
    buttons: {
      gap:           Spacing.md,
      paddingBottom: Spacing.xl,
    },
    googleBtn: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'center',
      gap:               Spacing.sm,
      height:            52,
      borderRadius:      Radius.pill,
      backgroundColor:   '#ffffff',
      shadowColor:       '#000',
      shadowOpacity:     0.12,
      shadowRadius:      8,
      shadowOffset:      { width: 0, height: 2 },
      elevation:         3,
    },
    googleBtnText: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      '#1a1a1a',
    },
    appleBtn: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             Spacing.sm,
      height:          52,
      borderRadius:    Radius.pill,
      backgroundColor: '#000000',
    },
    appleBtnText: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      '#ffffff',
    },
    guestBtn: {
      alignItems:    'center',
      paddingVertical: Spacing.md,
    },
    guestBtnText: {
      fontSize: FontSize.md,
      color:    C.textSecondary,
    },
    legal: {
      fontSize:  FontSize.xs,
      color:     C.textTertiary,
      textAlign: 'center',
      paddingBottom: Spacing.md,
    },
  })
}
