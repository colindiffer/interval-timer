import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

interface Props {
  progress: number  // 0 to 1 (1 = full, counts down to 0)
  color:    string
}

export default function PhaseProgressBar({ progress, color }: Props) {
  const anim = useRef(new Animated.Value(progress)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         progress,
      duration:        400,
      useNativeDriver: false,
    }).start()
  }, [progress])

  const width = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height:          4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    2,
    overflow:        'hidden',
  },
  fill: {
    height:       4,
    borderRadius: 2,
  },
})
