import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { Workout } from '../types'
import { Spacing, Radius, FontSize, FontWeight, useColors } from '../theme'

function formatDuration(seconds: number): string {
  if (seconds === 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

export function workoutSummary(workout: Workout): string {
  if (workout.intervals?.length) {
    if (workout.variationLabel) {
      return `${workout.variationLabel} · ${workout.intervals.length} custom sets`
    }

    const first = workout.intervals[0]
    const last = workout.intervals[workout.intervals.length - 1]
    const samePattern = workout.intervals.every(interval =>
      interval.workDuration === first.workDuration && interval.restDuration === first.restDuration,
    )

    if (samePattern) {
      if (first.restDuration === 0 && workout.intervals.length === 1) {
        return `${formatDuration(first.workDuration)} steady`
      }
      return `${formatDuration(first.workDuration)} / ${formatDuration(first.restDuration)} × ${workout.intervals.length}`
    }

    return `${workout.intervals.length} custom sets · ${formatDuration(first.workDuration)} to ${formatDuration(last.workDuration)}`
  }

  if (workout.restDuration === 0 && workout.reps === 1) {
    return `${formatDuration(workout.workDuration)} steady`
  }
  const work = formatDuration(workout.workDuration)
  const rest = formatDuration(workout.restDuration)
  const reps = workout.reps
  return `${work} / ${rest} × ${reps}`
}

export function workoutTotalMinutes(workout: Workout): number {
  if (workout.intervals?.length) {
    const intervalTotal = workout.intervals.reduce(
      (sum, interval) => sum + interval.workDuration + interval.restDuration,
      0,
    )
    return Math.round((workout.warmupDuration + intervalTotal + workout.cooldownDuration) / 60)
  }

  const warmup   = workout.warmupDuration
  const cooldown = workout.cooldownDuration
  const work     = workout.workDuration * workout.reps
  const restCount = workout.skipLastRest === false ? workout.reps : Math.max(0, workout.reps - 1)
  const rest     = workout.restDuration * restCount
  return Math.round((warmup + work + rest + cooldown) / 60)
}

interface Props {
  workout:       Workout
  isFavourite?:  boolean
  lastRunLabel?: string
  iconVariant?:  'play' | 'plus'
  onPress:       () => void
  onMorePress?:  () => void
  onFavouritePress?: () => void
}

export default function WorkoutCard({
  workout,
  isFavourite,
  lastRunLabel,
  iconVariant = 'play',
  onPress,
  onMorePress,
  onFavouritePress,
}: Props) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View style={styles.playIcon}>
          {iconVariant === 'plus' ? (
            <Text style={[styles.plusIcon, { color: C.accentText }]}>+</Text>
          ) : (
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path d="M4.5 3.5L12 8L4.5 12.5V3.5Z" fill={C.accentText} />
            </Svg>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{workout.name}</Text>
          <Text style={styles.summary}>{workoutSummary(workout)}</Text>
          {lastRunLabel ? (
            <Text style={styles.lastRun}>{lastRunLabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        {onFavouritePress ? (
          <TouchableOpacity onPress={onFavouritePress} style={styles.iconBtn} hitSlop={8}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M10 2.8L12.15 7.16L16.95 7.86L13.48 11.25L14.3 16.02L10 13.76L5.7 16.02L6.52 11.25L3.05 7.86L7.85 7.16L10 2.8Z"
                fill={isFavourite ? '#FBBF24' : 'none'}
                stroke={isFavourite ? '#FBBF24' : C.textTertiary}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : null}
        {onMorePress ? (
          <TouchableOpacity onPress={onMorePress} style={styles.iconBtn} hitSlop={8}>
            <Text style={styles.more}>···</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor:   C.bgCard,
      borderRadius:      Radius.md,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.md,
      marginBottom:      Spacing.sm,
      flexDirection:     'row',
      alignItems:        'center',
    },
    left: {
      flex:          1,
      flexDirection: 'row',
      alignItems:    'center',
      gap:           Spacing.md,
    },
    playIcon: {
      width:           40,
      height:          40,
      borderRadius:    20,
      backgroundColor: C.accent,
      alignItems:      'center',
      justifyContent:  'center',
    },
    plusIcon: {
      fontSize:   22,
      fontWeight: FontWeight.bold,
      lineHeight: 24,
    },
    info: {
      flex: 1,
      gap:  2,
    },
    name: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    summary: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
    },
    lastRun: {
      fontSize:  FontSize.xs,
      color:     C.textTertiary,
      marginTop: 1,
    },
    actions: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           Spacing.sm,
    },
    iconBtn: {
      padding: Spacing.xs,
    },
    more: {
      fontSize:      FontSize.lg,
      color:         C.textSecondary,
      letterSpacing: 1,
    },
  })
}
