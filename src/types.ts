export type PhaseType = 'warmup' | 'work' | 'rest' | 'cooldown'
export type PhaseColorKey = PhaseType | 'complete'
export type SoundThemeId = 'beep' | 'bell' | 'gong' | 'whistle'
export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'pt-BR' | 'ja'
export type LocalePreference = SupportedLocale | 'system'

export interface WorkoutInterval {
  workDuration: number
  restDuration: number
}

export interface Workout {
  id: string
  name: string
  warmupDuration: number   // seconds, 0 = disabled
  workDuration: number     // seconds
  restDuration: number     // seconds
  reps: number
  skipLastRest?: boolean
  cooldownDuration: number // seconds, 0 = disabled
  intervals?: WorkoutInterval[]
  variationLabel?: string
  workColor?: string
  restColor?: string
  soundTheme?: SoundThemeId
  voiceCues?: boolean
  isPreset: boolean
  createdAt: number        // unix ms timestamp
}

export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'complete'
  currentPhase: PhaseType
  countdown: number        // seconds remaining in current phase
  phaseDuration: number    // total seconds for current phase
  currentRep: number
  totalReps: number
  elapsedTotal: number     // seconds
  nextPhase: PhaseType | null
  nextPhaseDuration: number
  workoutId: string
  workoutName: string
}

export interface HistoryEntry {
  id: string
  workoutId: string
  workoutName: string
  timestamp: number        // unix ms
  completed: boolean
  durationSeconds: number
}

export interface AppSettings {
  soundCues: boolean
  voiceCues: boolean
  countdownBeeps: boolean
  finalCountdown: number
  darkMode: boolean | 'system'
  locale: LocalePreference
  soundTheme: SoundThemeId
  phaseColors: Record<PhaseColorKey, string>
}
