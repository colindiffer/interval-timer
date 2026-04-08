import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontSize, FontWeight, Radius, Spacing, useColors } from '../theme'
import Logo from './Logo'

const LOADING_DURATION_MS = 3000

export default function StartupScreen() {
  const C = useColors()
  const styles = createStyles(C)
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: LOADING_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [progress])

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.logoShell}>
          <Logo size={108} />
        </View>
        <Text style={styles.title}>Flash Interval Timer</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width }]} />
        </View>
      </View>
    </SafeAreaView>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.lg,
    },
    logoShell: {
      width: 148,
      height: 148,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.bgCard,
      borderWidth: 1,
      borderColor: C.border,
    },
    logo: {
      width: 108,
      height: 108,
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.heavy,
      color: C.textPrimary,
      textAlign: 'center',
    },
    track: {
      width: '78%',
      maxWidth: 280,
      height: 10,
      borderRadius: Radius.pill,
      overflow: 'hidden',
      backgroundColor: C.bgCardAlt,
      borderWidth: 1,
      borderColor: C.border,
    },
    fill: {
      height: '100%',
      borderRadius: Radius.pill,
      backgroundColor: C.accent,
    },
  })
}
