import { requireNativeModule } from 'expo-modules-core'

export interface LiveActivityState {
  phaseName: string
  phaseColorHex: string   // "#RRGGBB"
  endTime: number          // Unix timestamp in seconds (Date.now() / 1000 + seconds)
  phaseIndex: number
  totalPhases: number
  isPaused: boolean
  pausedSecondsRemaining: number
}

export interface StartActivityOptions {
  workoutName: string
  initialState: LiveActivityState
}

const LiveActivityNative = (() => {
  try {
    return requireNativeModule('LiveActivity')
  } catch {
    return null
  }
})()

export function isLiveActivitySupported(): boolean {
  return LiveActivityNative?.isSupported() ?? false
}

export async function startLiveActivity(options: StartActivityOptions): Promise<string | null> {
  return LiveActivityNative?.startActivity(options) ?? null
}

export async function updateLiveActivity(activityId: string, state: LiveActivityState): Promise<void> {
  await LiveActivityNative?.updateActivity(activityId, state)
}

export async function endLiveActivity(activityId: string): Promise<void> {
  await LiveActivityNative?.endActivity(activityId)
}
