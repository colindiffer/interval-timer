import React from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { PhaseColorKey, TimerState } from '../types'
import { DEFAULT_PHASE_COLORS, FontSize, FontWeight, useColors } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Circle fills the screen with a small margin
const SIZE         = SCREEN_WIDTH - 40
const STROKE       = 14
const RADIUS       = (SIZE / 2) - STROKE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PHASE_LABELS: Record<string, string> = {
  work:     'RUN',
  rest:     'REST',
  warmup:   'WARM UP',
  cooldown: 'COOL DOWN',
}

function formatCountdown(seconds: number): string {
  const s = Math.ceil(seconds)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
}

interface Props {
  state: TimerState
  onPress: () => void
  phaseColors?: Record<PhaseColorKey, string>
}

export default function CircularTimer({ state, onPress, phaseColors = DEFAULT_PHASE_COLORS }: Props) {
  const C = useColors()
  const styles = createStyles(C)
  const isIdle   = state.status === 'idle'
  const isPaused = state.status === 'paused'

  const progress = state.phaseDuration > 0
    ? Math.max(0, Math.min(1, state.countdown / state.phaseDuration))
    : 1

  // Arc depletes clockwise from 12 o'clock
  const dashOffset   = CIRCUMFERENCE * (1 - progress)
  const phaseColor   = phaseColors[state.currentPhase] ?? C.accent
  const cx = SIZE / 2
  const cy = SIZE / 2

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={[styles.container, { width: SIZE, height: SIZE }]}>

        {/* SVG ring */}
        <Svg
          width={SIZE}
          height={SIZE}
          style={StyleSheet.absoluteFill}
        >
          {/* Background track */}
          <Circle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={C.border}
            strokeWidth={STROKE}
          />
          {/* Progress arc — rotated to start at 12 o'clock */}
          <Circle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={phaseColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            rotation={-90}
            origin={`${cx}, ${cy}`}
          />
        </Svg>

        {/* Centre content */}
        <View style={styles.centre}>
          {(isIdle || isPaused) ? (
            <Text style={[styles.statusHint, { color: phaseColor + 'AA' }]}>
              {isIdle ? 'TAP TO START' : 'TAP TO RESUME'}
            </Text>
          ) : null}

          <Text style={[styles.phaseLabel, { color: phaseColor }]}>
            {PHASE_LABELS[state.currentPhase] ?? state.currentPhase.toUpperCase()}
          </Text>

          <Text style={styles.countdown}>
            {formatCountdown(state.countdown)}
          </Text>

          {state.totalReps > 1 ? (
            <Text style={styles.repLabel}>
              {state.currentRep} / {state.totalReps}
            </Text>
          ) : null}
        </View>

      </View>
    </Pressable>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrapper: {
      alignSelf: 'center',
    },
    container: {
      alignItems:     'center',
      justifyContent: 'center',
    },
    centre: {
      alignItems: 'center',
      gap:        6,
    },
    statusHint: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      letterSpacing: 2.5,
      marginBottom:  4,
    },
    phaseLabel: {
      fontSize:      FontSize.xl,
      fontWeight:    FontWeight.heavy,
      letterSpacing: 4,
    },
    countdown: {
      fontSize:     72,
      fontWeight:   FontWeight.heavy,
      color:        C.textPrimary,
      fontVariant:  ['tabular-nums'],
      lineHeight:   80,
    },
    repLabel: {
      fontSize:   FontSize.lg,
      fontWeight: FontWeight.medium,
      color:      C.textSecondary,
      marginTop:  4,
    },
  })
}
