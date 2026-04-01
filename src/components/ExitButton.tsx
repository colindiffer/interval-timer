import React, { useRef, useCallback } from 'react'
import {
  View, Text, Pressable, Animated, StyleSheet,
} from 'react-native'
import { FontSize, FontWeight, Radius } from '../theme'

const HOLD_DURATION = 500  // ms

interface Props {
  onExit: () => void
}

export default function ExitButton({ onExit }: Props) {
  const fillAnim = useRef(new Animated.Value(0)).current
  const animRef  = useRef<Animated.CompositeAnimation | null>(null)
  const firedRef = useRef(false)

  const startFill = useCallback(() => {
    firedRef.current = false
    fillAnim.setValue(0)
    animRef.current = Animated.timing(fillAnim, {
      toValue:         1,
      duration:        HOLD_DURATION,
      useNativeDriver: false,
    })
    animRef.current.start(({ finished }) => {
      if (finished && !firedRef.current) {
        firedRef.current = true
        onExit()
      }
    })
  }, [fillAnim, onExit])

  const cancelFill = useCallback(() => {
    animRef.current?.stop()
    Animated.timing(fillAnim, {
      toValue:         0,
      duration:        200,
      useNativeDriver: false,
    }).start()
  }, [fillAnim])

  const fillWidth = fillAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Pressable
      onPressIn={startFill}
      onPressOut={cancelFill}
      style={styles.wrapper}
    >
      <View style={styles.btn}>
        {/* Fill layer */}
        <Animated.View style={[styles.fill, { width: fillWidth }]} />
        {/* Label */}
        <Text style={styles.label}>Hold to exit</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  btn: {
    height:          44,
    minWidth:        140,
    borderRadius:    Radius.pill,
    borderWidth:     1.5,
    borderColor:     'rgba(239,68,68,0.6)',
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
  },
  fill: {
    position:        'absolute',
    left:            0,
    top:             0,
    bottom:          0,
    backgroundColor: 'rgba(239,68,68,0.35)',
  },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    color:      'rgba(239,68,68,0.9)',
    letterSpacing: 0.5,
  },
})
