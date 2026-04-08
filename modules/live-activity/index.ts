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

export interface LiveActivitySupportStatus {
  isAvailable: boolean
  reason: 'available' | 'activities_disabled' | 'ios_version_too_old' | 'native_module_missing'
  osVersion?: string
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

export async function getLiveActivitySupportStatus(): Promise<LiveActivitySupportStatus> {
  if (!LiveActivityNative) {
    return {
      isAvailable: false,
      reason: 'native_module_missing',
    }
  }

  return LiveActivityNative.getSupportStatus()
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
