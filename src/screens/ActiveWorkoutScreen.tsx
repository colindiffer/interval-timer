import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, AppState, AppStateStatus,
} from 'react-native'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import Svg, { Path, Circle } from 'react-native-svg'

import { RootStackParamList } from '../navigation/types'
import { AppSettings, TimerState, Workout } from '../types'
import { timerEngine } from '../engine/TimerEngine'
import {
  getWorkouts, getFavourites, toggleFavourite,
  addHistoryEntry, setLastWorkoutId, generateId, getSettings, DEFAULT_SETTINGS,
} from '../data/storage'
import { Spacing, Radius, FontSize, FontWeight, useColors, useTheme } from '../theme'
import CircularTimer from '../components/CircularTimer'
import ExitButton from '../components/ExitButton'
import { cuePlayer } from '../audio/cuePlayer'
import {
  startBackgroundTimer, stopBackgroundTimer, readBackgroundState,
  isBackgroundTimerRunning, pauseBackgroundTimer, resumeBackgroundTimer,
  skipBackgroundStep, BgPhaseStep, BgTimerState, ensureNotificationPermission,
} from '../engine/BackgroundTimerService'
import {
  isLiveActivitySupported, startLiveActivity, updateLiveActivity, endLiveActivity,
} from '../../modules/live-activity'

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWorkout'>

const NEXT_LABELS: Record<string, string> = {
  work:     'Next: RUN',
  rest:     'Next: REST',
  warmup:   'Next: WARM UP',
  cooldown: 'Next: COOL DOWN',
}

/** Mirrors TimerEngine.buildSequence — produces a plain serialisable sequence. */
function buildBgSequence(workout: Workout): BgPhaseStep[] {
  const steps: BgPhaseStep[] = []
  const intervals     = workout.intervals?.length ? workout.intervals : null
  const skipLastRest  = workout.skipLastRest !== false

  if (workout.warmupDuration > 0) {
    steps.push({ type: 'warmup', duration: workout.warmupDuration, rep: 0 })
  }

  if (intervals) {
    intervals.forEach((interval, index) => {
      const rep = index + 1
      steps.push({ type: 'work', duration: interval.workDuration, rep })
      if ((index < intervals.length - 1 || !skipLastRest) && interval.restDuration > 0) {
        steps.push({ type: 'rest', duration: interval.restDuration, rep })
      }
    })
  } else {
    for (let i = 1; i <= workout.reps; i++) {
      steps.push({ type: 'work', duration: workout.workDuration, rep: i })
      if ((i < workout.reps || !skipLastRest) && workout.restDuration > 0) {
        steps.push({ type: 'rest', duration: workout.restDuration, rep: i })
      }
    }
  }

  if (workout.cooldownDuration > 0) {
    steps.push({ type: 'cooldown', duration: workout.cooldownDuration, rep: 0 })
  }

  return steps
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

function formatTotal(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function mergeBgState(previous: TimerState | null, bgState: BgTimerState): TimerState | null {
  if (!previous) return null

  return {
    ...previous,
    status: bgState.status,
    currentPhase: bgState.currentPhase,
    countdown: bgState.countdown,
    phaseDuration: bgState.phaseDuration,
    currentRep: bgState.currentRep,
    totalReps: bgState.totalReps,
    elapsedTotal: bgState.elapsedTotal,
    nextPhase: bgState.nextPhase,
    nextPhaseDuration: bgState.nextPhaseDuration,
    workoutName: bgState.workoutName,
  }
}

const PHASE_LABELS: Record<string, string> = {
  work:     'Work',
  rest:     'Rest',
  warmup:   'Warm Up',
  cooldown: 'Cool Down',
}

export default function ActiveWorkoutScreen({ route, navigation }: Props) {
  const C = useColors()
  const { theme } = useTheme()
  const styles = createStyles(C)
  const { workoutId } = route.params

  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [isFavourite, setIsFavourite] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isBackgroundControlled, setIsBackgroundControlled] = useState(false)
  const startTimeRef = useRef<number>(0)
  const hasStartedRef = useRef(false)
  const allowCloseRef = useRef(false)
  const prevCountdownRef = useRef<number | null>(null)
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS)
  const workoutRef = useRef<Workout | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)
  const liveActivityIdRef = useRef<string | null>(null)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    void ensureNotificationPermission()
  }, [])

  useEffect(() => {
    if (!isBackgroundControlled) return

    let disposed = false

    const syncFromBackground = async () => {
      const bgState = await readBackgroundState()
      if (!bgState || disposed) return
      setTimerState(previous => mergeBgState(previous, bgState) ?? previous)
    }

    void syncFromBackground()
    const intervalId = setInterval(() => {
      void syncFromBackground()
    }, 250)

    return () => {
      disposed = true
      clearInterval(intervalId)
    }
  }, [isBackgroundControlled])

  // ── Background / foreground handling ────────────────────────────────────────
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current
      appStateRef.current = nextState

      const engineState = timerEngine.getState()

      // Background the session into the foreground service so the workout
      // continues from the notification shade instead of PiP.
      if (
        prevState === 'active'
        && nextState !== 'active'
        && workoutRef.current
        && engineState.status === 'running'
      ) {
        try {
          const notificationsAllowed = await ensureNotificationPermission()
          if (!notificationsAllowed) {
            console.warn('Background timer skipped because notification permission was denied.')
            return
          }

          const workout = workoutRef.current
          const currentSettings = settingsRef.current
          const seq = buildBgSequence(workout)
          const currentStep = Math.max(
            0,
            seq.findIndex(
              s => s.type === engineState.currentPhase && s.rep === engineState.currentRep
            )
          )

          await startBackgroundTimer({
            sequence:    seq,
            stepIndex:   currentStep,
            countdown:   engineState.countdown,
            status:      'running',
            totalReps:   engineState.totalReps,
            currentRep:  engineState.currentRep,
            workoutName: engineState.workoutName,
            elapsedTotal: engineState.elapsedTotal,
            audio: {
              soundCues: currentSettings.soundCues,
              voiceCues: workout.voiceCues !== undefined ? workout.voiceCues : currentSettings.voiceCues,
              countdownBeeps: currentSettings.countdownBeeps,
              finalCountdown: currentSettings.finalCountdown,
              soundTheme: workout.soundTheme ?? currentSettings.soundTheme,
            },
          })

          setIsBackgroundControlled(true)
          timerEngine.pause()
        } catch (error) {
          console.error('Failed to start background timer service', error)
        }
      }

      if (prevState !== 'active' && nextState === 'active') {
        if (isBackgroundTimerRunning() || isBackgroundControlled) {
          const bgState = await readBackgroundState()
          if (bgState) {
            timerEngine.jumpToPosition(
              bgState.stepIndex,
              bgState.countdown,
              bgState.status,
              bgState.elapsedTotal
            )
          }
          await stopBackgroundTimer()
          setIsBackgroundControlled(false)
        }
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => sub.remove()
  }, [isBackgroundControlled])

  // Load workout and subscribe to engine on mount
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (allowCloseRef.current) return
      event.preventDefault()
    })

    return unsubscribe
  }, [navigation])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const [workouts, favs, appSettings] = await Promise.all([
        getWorkouts(),
        getFavourites(),
        getSettings(),
      ])
      if (cancelled) return

      const found = workouts.find(w => w.id === workoutId)
      if (!found) return

      setSettings(appSettings)
      setWorkout(found)
      workoutRef.current = found
      setIsFavourite(favs.includes(workoutId))
      await setLastWorkoutId(workoutId)

      // Load but do NOT start — user taps the circle to start
      timerEngine.load(found)
    }

    init()

    const unsubTick = timerEngine.onTick(state => {
      const currentSettings = settingsRef.current
      const previousCountdown = prevCountdownRef.current

      const isCountdownTick = (
        state.status === 'running'
        && currentSettings.finalCountdown > 0
        && previousCountdown !== null
        && state.countdown < previousCountdown
        && state.countdown > 0
        && state.countdown <= currentSettings.finalCountdown
      )

      const w = workoutRef.current
      const effectiveTheme = w?.soundTheme ?? currentSettings.soundTheme
      const effectiveVoice = w?.voiceCues !== undefined ? w.voiceCues : currentSettings.voiceCues

      if (isCountdownTick && currentSettings.soundCues && currentSettings.countdownBeeps) {
        cuePlayer.play(effectiveTheme)
      }

      if (isCountdownTick && effectiveVoice) {
        cuePlayer.speak(String(state.countdown))
      }

      prevCountdownRef.current = state.countdown

      if (!hasStartedRef.current && state.status === 'running') {
        hasStartedRef.current = true
        startTimeRef.current = Date.now()

        // Start Live Activity on first run tick
        if (isLiveActivitySupported() && !liveActivityIdRef.current && workoutRef.current) {
          const phaseColor = currentSettings.phaseColors[state.currentPhase as keyof typeof currentSettings.phaseColors]
            ?? currentSettings.phaseColors.work
          startLiveActivity({
            workoutName: state.workoutName,
            initialState: {
              phaseName: PHASE_LABELS[state.currentPhase] ?? state.currentPhase,
              phaseColorHex: phaseColor,
              endTime: (Date.now() + state.countdown * 1000) / 1000,
              phaseIndex: state.currentRep > 0 ? state.currentRep - 1 : 0,
              totalPhases: state.totalReps || 1,
              isPaused: false,
              pausedSecondsRemaining: 0,
            },
          }).then(id => {
            liveActivityIdRef.current = id
          }).catch(() => {})
        }
      }
      setTimerState({ ...state })
    })

    const unsubPhase = timerEngine.onPhaseChange((phase) => {
      const currentSettings = settingsRef.current
      const w = workoutRef.current
      const effectiveTheme = w?.soundTheme ?? currentSettings.soundTheme
      const effectiveVoice = w?.voiceCues !== undefined ? w.voiceCues : currentSettings.voiceCues
      if (currentSettings.soundCues) {
        cuePlayer.play(effectiveTheme)
      }
      if (effectiveVoice) {
        cuePlayer.speak(phase)
      }

      // Update Live Activity for new phase
      const engineState = timerEngine.getState()
      if (liveActivityIdRef.current && engineState.status === 'running') {
        const phaseColor = currentSettings.phaseColors[phase as keyof typeof currentSettings.phaseColors]
          ?? currentSettings.phaseColors.work
        updateLiveActivity(liveActivityIdRef.current, {
          phaseName: PHASE_LABELS[phase] ?? phase,
          phaseColorHex: phaseColor,
          endTime: (Date.now() + engineState.countdown * 1000) / 1000,
          phaseIndex: engineState.currentRep > 0 ? engineState.currentRep - 1 : 0,
          totalPhases: engineState.totalReps || 1,
          isPaused: false,
          pausedSecondsRemaining: 0,
        }).catch(() => {})
      }
    })

    const unsubComplete = timerEngine.onComplete(() => {
      const currentSettings = settingsRef.current
      const w = workoutRef.current
      const effectiveVoice = w?.voiceCues !== undefined ? w.voiceCues : currentSettings.voiceCues
      if (effectiveVoice) {
        cuePlayer.speak('complete')
      }
      if (liveActivityIdRef.current) {
        endLiveActivity(liveActivityIdRef.current).catch(() => {})
        liveActivityIdRef.current = null
      }
    })

    return () => {
      cancelled = true
      unsubTick()
      unsubPhase()
      unsubComplete()
    }
  }, [workoutId])

  // Save history and clean up background service on unmount
  useEffect(() => {
    return () => {
      void deactivateKeepAwake()
      stopBackgroundTimer()

      if (liveActivityIdRef.current) {
        endLiveActivity(liveActivityIdRef.current).catch(() => {})
        liveActivityIdRef.current = null
      }

      const state = timerEngine.getState()
      if (!hasStartedRef.current || state.status === 'idle') return

      const elapsed = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : Math.round(state.elapsedTotal)

      addHistoryEntry({
        id:              generateId(),
        workoutId,
        workoutName:     state.workoutName,
        timestamp:       Date.now(),
        completed:       state.status === 'complete',
        durationSeconds: elapsed,
      })
      timerEngine.stop()
    }
  }, [])

  // Keep screen on while running, allow sleep when paused/complete/idle
  useEffect(() => {
    if (timerState?.status === 'running') {
      void activateKeepAwakeAsync()
    } else {
      void deactivateKeepAwake()
    }
  }, [timerState?.status])

  // Circle only starts or resumes — never pauses. Prevents accidental mid-workout pauses.
  const handleCircleTap = useCallback(() => {
    const { status } = timerEngine.getState()
    if (status === 'idle' || status === 'paused') {
      timerEngine.start()
    }
  }, [])

  const handlePauseResume = useCallback(async () => {
    if (isBackgroundControlled) {
      const bgState = await readBackgroundState()
      if (!bgState) return

      if (bgState.status === 'running') {
        await pauseBackgroundTimer()
      } else if (bgState.status === 'paused') {
        await resumeBackgroundTimer()
      }
      return
    }

    const state = timerEngine.getState()
    if (state.status === 'running') {
      timerEngine.pause()
      // Update Live Activity to show paused state
      if (liveActivityIdRef.current) {
        const currentSettings = settingsRef.current
        const phaseColor = currentSettings.phaseColors[state.currentPhase as keyof typeof currentSettings.phaseColors]
          ?? currentSettings.phaseColors.work
        updateLiveActivity(liveActivityIdRef.current, {
          phaseName: PHASE_LABELS[state.currentPhase] ?? state.currentPhase,
          phaseColorHex: phaseColor,
          endTime: (Date.now() + state.countdown * 1000) / 1000,
          phaseIndex: state.currentRep > 0 ? state.currentRep - 1 : 0,
          totalPhases: state.totalReps || 1,
          isPaused: true,
          pausedSecondsRemaining: state.countdown,
        }).catch(() => {})
      }
      return
    }

    if (state.status === 'idle' || state.status === 'paused') {
      timerEngine.start()
      // Update Live Activity back to running
      if (liveActivityIdRef.current) {
        const currentSettings = settingsRef.current
        const phaseColor = currentSettings.phaseColors[state.currentPhase as keyof typeof currentSettings.phaseColors]
          ?? currentSettings.phaseColors.work
        updateLiveActivity(liveActivityIdRef.current, {
          phaseName: PHASE_LABELS[state.currentPhase] ?? state.currentPhase,
          phaseColorHex: phaseColor,
          endTime: (Date.now() + state.countdown * 1000) / 1000,
          phaseIndex: state.currentRep > 0 ? state.currentRep - 1 : 0,
          totalPhases: state.totalReps || 1,
          isPaused: false,
          pausedSecondsRemaining: 0,
        }).catch(() => {})
      }
    }
  }, [isBackgroundControlled])

  const handleSkip = useCallback(async () => {
    if (isBackgroundControlled) {
      await skipBackgroundStep()
      return
    }

    timerEngine.skipToNextStep()
  }, [isBackgroundControlled])

  const handleExit = useCallback(() => {
    allowCloseRef.current = true
    navigation.goBack()
  }, [navigation])

  const handleToggleFavourite = useCallback(async () => {
    const updated = await toggleFavourite(workoutId)
    setIsFavourite(updated.includes(workoutId))
  }, [workoutId])

  const handleStartAgain = useCallback(async () => {
    const workouts = await getWorkouts()
    const workout = workouts.find(w => w.id === workoutId)
    if (!workout) return
    hasStartedRef.current = false
    startTimeRef.current = 0
    timerEngine.load(workout)
  }, [workoutId])

  if (!timerState) {
    return <View style={[styles.root, { backgroundColor: C.bg }]} />
  }

  const isDone  = timerState.status === 'complete'
  const canSkip = timerState.status !== 'idle' && timerState.status !== 'complete' && timerState.nextPhase !== null

  // Completion screen
  if (isDone) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.doneContainer}>
          <View style={styles.doneCheck}>
            <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
              <Circle cx="36" cy="36" r="34" stroke={settings.phaseColors.complete} strokeWidth="3" />
              <Path
                d="M22 36 L32 46 L50 28"
                stroke={settings.phaseColors.complete}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.doneName}>{timerState.workoutName}</Text>
          {timerState.totalReps > 1 ? (
            <Text style={styles.doneStats}>
              {timerState.totalReps} reps complete
            </Text>
          ) : null}
          <Text style={styles.doneTime}>
            {formatTotal(timerState.elapsedTotal)}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={handleStartAgain}>
            <Text style={styles.doneBtnText}>Start again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneSecondaryBtn}
            onPress={() => {
              allowCloseRef.current = true
              navigation.goBack()
            }}
          >
            <Text style={styles.doneSecondaryText}>Back to library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* Top bar */}
        <View style={styles.topBar}>
          {/* Star / favourite */}
          <TouchableOpacity
            onPress={handleToggleFavourite}
            style={styles.topBtn}
            hitSlop={12}
          >
            <Svg width={22} height={22} viewBox="0 0 20 20" fill="none">
              <Path
                d="M10 2.8L12.15 7.16L16.95 7.86L13.48 11.25L14.3 16.02L10 13.76L5.7 16.02L6.52 11.25L3.05 7.86L7.85 7.16L10 2.8Z"
                fill={isFavourite ? '#FBBF24' : 'none'}
                stroke={isFavourite ? '#FBBF24' : C.textTertiary}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.workoutName} numberOfLines={1}>
            {timerState.workoutName}
          </Text>

          {/* Pause/resume stays small so the central timer remains primary. */}
          {timerState.status !== 'idle' && timerState.status !== 'complete' ? (
            <TouchableOpacity
              onPress={() => void handlePauseResume()}
              style={styles.pauseBtn}
              hitSlop={8}
            >
              <Text style={styles.pauseBtnText}>
                {timerState.status === 'paused' ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.topBtnPlaceholder} />
          )}
        </View>

        {/* Circular timer — tap to start/pause */}
        <View style={styles.timerArea}>
          <CircularTimer
            state={timerState}
            onPress={handleCircleTap}
            phaseColors={{
              ...settings.phaseColors,
              ...(workout?.workColor ? { work: workout.workColor } : {}),
              ...(workout?.restColor ? { rest: workout.restColor } : {}),
            }}
          />
        </View>

        {/* Next phase info */}
        <View style={styles.nextArea}>
          {timerState.nextPhase ? (
            <>
              <Text style={styles.nextLabel}>
                {NEXT_LABELS[timerState.nextPhase]}
              </Text>
              <Text style={styles.nextDuration}>
                {formatDuration(timerState.nextPhaseDuration)}
              </Text>
            </>
          ) : (
            <Text style={styles.nextLabel}>Last phase</Text>
          )}
          {canSkip ? (
            <TouchableOpacity style={styles.skipBtn} onPress={() => void handleSkip()} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Skip ahead</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Exit */}
        <View style={styles.exitArea}>
          <ExitButton onExit={handleExit} />
        </View>

      </SafeAreaView>
    </View>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    safe: {
      flex: 1,
      backgroundColor: C.bg,
    },
    topBar: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop:        Spacing.sm,
      paddingBottom:     Spacing.md,
    },
    workoutName: {
      flex:         1,
      fontSize:     FontSize.sm,
      fontWeight:   FontWeight.medium,
      color:        C.textSecondary,
      textAlign:    'center',
      marginHorizontal: Spacing.sm,
    },
    topBtn: {
      width:           40,
      height:          40,
      alignItems:      'center',
      justifyContent:  'center',
    },
    topBtnPlaceholder: {
      width: 40,
    },
    pauseBtn: {
      paddingVertical:   6,
      paddingHorizontal: Spacing.sm,
      borderRadius:      20,
      borderWidth:       1,
      borderColor:       'rgba(239,68,68,0.6)',
    },
    pauseBtnText: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         'rgba(239,68,68,0.9)',
      letterSpacing: 0.5,
    },
    timerArea: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
    },
    nextArea: {
      alignItems:    'center',
      paddingBottom: Spacing.lg,
      gap:           2,
    },
    nextLabel: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.medium,
      color:      C.textSecondary,
    },
    nextDuration: {
      fontSize: FontSize.sm,
      color:    C.textTertiary,
    },
    skipBtn: {
      marginTop:         Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical:   Spacing.sm,
      borderRadius:      Radius.pill,
      borderWidth:       1,
      borderColor:       C.border,
      backgroundColor:   C.bgCard,
    },
    skipBtnText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.semibold,
      color:      C.accent,
    },
    exitArea: {
      paddingBottom: Spacing.xl,
      alignItems:    'center',
    },
    doneContainer: {
      flex:            1,
      alignItems:      'center',
      justifyContent:  'center',
      gap:             Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    doneCheck: {
      marginBottom: Spacing.md,
    },
    doneName: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.bold,
      color:      C.textPrimary,
      textAlign:  'center',
    },
    doneStats: {
      fontSize: FontSize.lg,
      color:    C.textSecondary,
    },
    doneTime: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.heavy,
      color:      C.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    doneBtn: {
      marginTop:         Spacing.xl,
      backgroundColor:   C.accent,
      borderRadius:      100,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.xxl,
    },
    doneBtnText: {
      fontSize:   FontSize.lg,
      fontWeight: FontWeight.semibold,
      color:      C.accentText,
    },
    doneSecondaryBtn: {
      paddingVertical: Spacing.sm,
    },
    doneSecondaryText: {
      fontSize: FontSize.md,
      color:    C.textSecondary,
    },
  })
}
