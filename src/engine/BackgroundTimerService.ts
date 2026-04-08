/**
 * BackgroundTimerService
 *
 * Runs a foreground service (Android) that keeps the timer ticking when the
 * app is backgrounded.  The background task writes its state to AsyncStorage
 * every second so the React UI can sync when the app returns to the foreground.
 *
 * Communication:
 *   AsyncStorage key  @timer_bg_state   — background task writes each tick
 *   AsyncStorage key  @timer_bg_command — React writes commands from the app UI
 *   Native receiver writes notification action commands into SharedPreferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import BackgroundService from 'react-native-background-actions'
import { PermissionsAndroid, Platform } from 'react-native'
import { cuePlayer } from '../audio/cuePlayer'
import { PhaseType, SoundThemeId } from '../types'
import { readAndClearNativeBackgroundCommand } from '../native/BackgroundTimerActions'
import { endLiveActivity, updateLiveActivity } from '../../modules/live-activity'
import { t } from '../i18n'

// ─── Shared keys ────────────────────────────────────────────────────────────

export const BG_STATE_KEY   = '@timer_bg_state'
export const BG_COMMAND_KEY = '@timer_bg_command'
export const LIVE_ACTIVITY_ID_KEY = '@timer_live_activity_id'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BgPhaseStep {
  type:     PhaseType
  duration: number
  rep:      number
}

export interface BgTimerState {
  stepIndex:   number
  countdown:   number
  status:      'running' | 'paused' | 'complete'
  currentPhase: PhaseType
  phaseDuration: number
  nextPhase: PhaseType | null
  nextPhaseDuration: number
  updatedAt:   number
  totalReps:   number
  currentRep:  number
  workoutName: string
  elapsedTotal: number
}

interface TaskData {
  sequence:    BgPhaseStep[]
  stepIndex:   number
  countdown:   number
  status:      'running' | 'paused'
  totalReps:   number
  currentRep:  number
  workoutName: string
  elapsedTotal: number
  audio: BgAudioConfig
  phaseColors: Partial<Record<PhaseType, string>>
}

interface BgTimerCommand {
  type: 'stop' | 'pause' | 'resume' | 'skip'
}

interface BgAudioConfig {
  soundCues: boolean
  voiceCues: boolean
  countdownBeeps: boolean
  finalCountdown: number
  soundTheme: SoundThemeId
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

function phaseLabel(phase: PhaseType): string {
  switch (phase) {
    case 'work':     return t('common.work').toUpperCase()
    case 'rest':     return t('common.rest').toUpperCase()
    case 'warmup':   return t('common.warmup').toUpperCase()
    case 'cooldown': return t('common.cooldown').toUpperCase()
  }
}

function liveActivityPhaseName(phase: PhaseType): string {
  switch (phase) {
    case 'work':     return t('common.work')
    case 'rest':     return t('common.rest')
    case 'warmup':   return t('common.warmup')
    case 'cooldown': return t('common.cooldown')
  }
}

function liveActivityPhaseIndex(step: BgTimerState): number {
  return step.currentRep > 0 ? step.currentRep - 1 : 0
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function describeStep(phase: PhaseType, countdown: number, status: 'running' | 'paused'): string {
  const prefix = status === 'paused' ? t('common.paused') : phaseLabel(phase)
  return `${prefix}  ·  ${formatCountdown(countdown)}`
}

async function readStorageCommand(): Promise<BgTimerCommand | null> {
  const raw = await AsyncStorage.getItem(BG_COMMAND_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as BgTimerCommand
    if (parsed?.type) return parsed
  } catch {
    if (raw === 'stop') return { type: 'stop' }
  }

  return null
}

async function readNativeCommand(): Promise<BgTimerCommand | null> {
  const command = await readAndClearNativeBackgroundCommand()
  if (!command) return null
  return { type: command }
}

async function readCommand(): Promise<BgTimerCommand | null> {
  const [storageCommand, nativeCommand] = await Promise.all([
    readStorageCommand(),
    readNativeCommand(),
  ])

  return nativeCommand ?? storageCommand
}

async function writeCommand(command: BgTimerCommand): Promise<void> {
  await AsyncStorage.setItem(BG_COMMAND_KEY, JSON.stringify(command))
}

export async function persistLiveActivityId(activityId: string | null): Promise<void> {
  if (activityId) {
    await AsyncStorage.setItem(LIVE_ACTIVITY_ID_KEY, activityId)
    return
  }

  await AsyncStorage.removeItem(LIVE_ACTIVITY_ID_KEY)
}

async function readLiveActivityId(): Promise<string | null> {
  return AsyncStorage.getItem(LIVE_ACTIVITY_ID_KEY)
}

// ─── Background task ─────────────────────────────────────────────────────────

const bgTimerTask = async (taskDataArguments: any): Promise<void> => {
  const {
    sequence, stepIndex: initStep, countdown: initCountdown,
    status: initStatus, totalReps, workoutName, elapsedTotal: initElapsedTotal,
    audio, phaseColors,
  } = taskDataArguments as TaskData

  let stepIndex = initStep
  let countdown = initCountdown
  let status = initStatus
  let elapsedTotal = initElapsedTotal
  let liveActivityId = await readLiveActivityId()

  const makeState = (nextStatus: BgTimerState['status']): BgTimerState => {
    const safeIndex = Math.min(stepIndex, sequence.length - 1)
    const step = sequence[safeIndex]
    const nextStep = sequence[safeIndex + 1] ?? null

    return {
      stepIndex,
      countdown,
      status: nextStatus,
      currentPhase: step.type,
      phaseDuration: step.duration,
      nextPhase: nextStep?.type ?? null,
      nextPhaseDuration: nextStep?.duration ?? 0,
      updatedAt: Date.now(),
      totalReps,
      currentRep: step.rep,
      workoutName,
      elapsedTotal,
    }
  }

  const syncLiveActivity = async (state: BgTimerState): Promise<void> => {
    if (Platform.OS !== 'ios' || !liveActivityId) return

    const phaseColor = phaseColors?.[state.currentPhase] ?? '#3B82F6'

    try {
      await updateLiveActivity(liveActivityId, {
        phaseName: liveActivityPhaseName(state.currentPhase),
        phaseColorHex: phaseColor,
        endTime: (Date.now() + Math.max(state.countdown, 1) * 1000) / 1000,
        phaseIndex: liveActivityPhaseIndex(state),
        totalPhases: state.totalReps || 1,
        isPaused: state.status === 'paused',
        pausedSecondsRemaining: state.status === 'paused' ? state.countdown : 0,
      })
    } catch {
      liveActivityId = null
      await persistLiveActivityId(null)
    }
  }

  const persist = async (): Promise<void> => {
    const state = makeState(status)
    await AsyncStorage.setItem(BG_STATE_KEY, JSON.stringify(state))
    await syncLiveActivity(state)
    await BackgroundService.updateNotification({
      taskTitle: workoutName,
      taskDesc: describeStep(state.currentPhase, state.countdown, status),
      progressBar: {
        max:           state.phaseDuration,
        value:         state.phaseDuration - state.countdown,
        indeterminate: false,
      },
    })
  }

  const playCountdownCue = async (): Promise<void> => {
    if (audio.finalCountdown <= 0 || countdown <= 0 || countdown > audio.finalCountdown) {
      return
    }

    if (audio.soundCues && audio.countdownBeeps) {
      await cuePlayer.play(audio.soundTheme)
    }

    if (audio.voiceCues) {
      await cuePlayer.speak(String(countdown))
    }
  }

  const playPhaseCue = async (phase: PhaseType): Promise<void> => {
    if (audio.soundCues) {
      await cuePlayer.play(audio.soundTheme)
    }

    if (audio.voiceCues) {
      await cuePlayer.speak(phase)
    }
  }

  const playCompleteCue = async (): Promise<void> => {
    if (audio.voiceCues) {
      await cuePlayer.speak('complete')
    }
  }

  const complete = async (): Promise<'complete'> => {
    const lastStep = sequence[sequence.length - 1]
    const completeState: BgTimerState = {
      stepIndex,
      countdown: 0,
      status: 'complete',
      currentPhase: lastStep.type,
      phaseDuration: lastStep.duration,
      nextPhase: null,
      nextPhaseDuration: 0,
      updatedAt: Date.now(),
      totalReps,
      currentRep: lastStep.rep,
      workoutName,
      elapsedTotal,
    }

    await AsyncStorage.setItem(BG_STATE_KEY, JSON.stringify(completeState))
    await BackgroundService.updateNotification({
      taskTitle: workoutName,
      taskDesc: 'Workout complete!',
    })
    if (Platform.OS === 'ios' && liveActivityId) {
      try {
        await endLiveActivity(liveActivityId)
      } catch {
        // Ignore dismissal failures.
      }
      liveActivityId = null
      await persistLiveActivityId(null)
    }
    await playCompleteCue()

    return 'complete'
  }

  const moveToNextStep = async (): Promise<'continue' | 'complete'> => {
    stepIndex++
    if (stepIndex >= sequence.length) {
      return complete()
    }

    countdown = sequence[stepIndex].duration
    await playPhaseCue(sequence[stepIndex].type)
    await persist()
    return 'continue'
  }

  const applyCommand = async (command: BgTimerCommand | null): Promise<'continue' | 'stop' | 'complete'> => {
    if (!command) return 'continue'

    await AsyncStorage.removeItem(BG_COMMAND_KEY)

    switch (command.type) {
      case 'stop':
        return 'stop'
      case 'pause':
        status = 'paused'
        await persist()
        return 'continue'
      case 'resume':
        status = 'running'
        await persist()
        return 'continue'
      case 'skip':
        return moveToNextStep()
    }
  }

  await new Promise<void>(async resolve => {
    await persist()

    while (BackgroundService.isRunning()) {
      const beforeSleep = await applyCommand(await readCommand())
      if (beforeSleep === 'stop' || beforeSleep === 'complete') {
        resolve()
        return
      }

      await sleep(status === 'running' ? 1000 : 250)

      if (!BackgroundService.isRunning()) break

      const afterSleep = await applyCommand(await readCommand())
      if (afterSleep === 'stop' || afterSleep === 'complete') {
        resolve()
        return
      }

      if (status !== 'running') {
        continue
      }

      countdown--
      elapsedTotal++

      if (countdown <= 0) {
        if ((await moveToNextStep()) === 'complete') {
          resolve()
          return
        }
        continue
      }

      await playCountdownCue()
      await persist()
    }

    resolve()
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function startBackgroundTimer(data: TaskData): Promise<void> {
  if (BackgroundService.isRunning()) {
    await stopBackgroundTimer()
  }

  await Promise.all([
    AsyncStorage.removeItem(BG_COMMAND_KEY),
    AsyncStorage.removeItem(BG_STATE_KEY),
  ])

  const step = data.sequence[data.stepIndex]

  await BackgroundService.start(bgTimerTask, {
    taskName:  'Flash Interval Timer Workout',
    taskTitle: data.workoutName,
    taskDesc:  `${phaseLabel(step.type)}  ·  ${formatCountdown(data.countdown)}`,
    taskIcon:  { name: 'ic_launcher', type: 'mipmap' },
    color:     '#3B82F6',
    parameters: data,
    progressBar: {
      max:           step.duration,
      value:         step.duration - data.countdown,
      indeterminate: false,
    },
  })
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true
  if (Platform.Version < 33) return true

  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true
  if (Platform.Version < 33) return true

  const granted = await hasNotificationPermission()
  if (granted) return true

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Allow timer notifications',
      message: 'Flash Interval Timer Workout needs notification access to keep workouts running in the background.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    }
  )

  return result === PermissionsAndroid.RESULTS.GRANTED
}

export async function stopBackgroundTimer(): Promise<void> {
  await writeCommand({ type: 'stop' })
  try {
    await BackgroundService.stop()
  } catch {
    // Already stopped
  }
  await Promise.all([
    AsyncStorage.removeItem(BG_STATE_KEY),
    AsyncStorage.removeItem(BG_COMMAND_KEY),
  ])
}

export async function readBackgroundState(): Promise<BgTimerState | null> {
  const raw = await AsyncStorage.getItem(BG_STATE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BgTimerState
  } catch {
    return null
  }
}

export function isBackgroundTimerRunning(): boolean {
  return BackgroundService.isRunning()
}

export async function pauseBackgroundTimer(): Promise<void> {
  if (!BackgroundService.isRunning()) return
  await writeCommand({ type: 'pause' })
}

export async function resumeBackgroundTimer(): Promise<void> {
  if (!BackgroundService.isRunning()) return
  await writeCommand({ type: 'resume' })
}

export async function skipBackgroundStep(): Promise<void> {
  if (!BackgroundService.isRunning()) return
  await writeCommand({ type: 'skip' })
}
