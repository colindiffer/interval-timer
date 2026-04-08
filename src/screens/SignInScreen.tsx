import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppleButton } from '@invertase/react-native-apple-authentication'
import { useAuth } from '../context/AuthContext'
import { FontSize, FontWeight, Spacing, Radius, useColors } from '../theme'
import Logo from '../components/Logo'
import { GoogleIcon } from '../components/AuthIcons'

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
          <View style={[styles.appleBtnWrap, (loadingGoogle || loadingApple) && { opacity: 0.6 }]}>
            {loadingApple ? (
              <View style={styles.appleBtnLoading}>
                <ActivityIndicator color={C.textPrimary} />
              </View>
            ) : (
              <AppleButton
                buttonStyle={AppleButton.Style.WHITE_OUTLINE}
                buttonType={AppleButton.Type.CONTINUE}
                cornerRadius={Radius.pill}
                style={styles.appleNativeBtn}
                onPress={handleApple}
              />
            )}
          </View>
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
    appleBtnWrap: {
      height: 52,
      borderRadius: Radius.pill,
      overflow: 'hidden',
    },
    appleNativeBtn: {
      width: '100%',
      height: '100%',
    },
    appleBtnLoading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
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
