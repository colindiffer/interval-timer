import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppSettings, HistoryEntry, Workout } from '../types'
import { getPresetWorkouts } from './presets'
import { DEFAULT_PHASE_COLORS } from '../theme'

const KEYS = {
  workouts:    'workouts_v1',
  history:     'history_v1',
  favourites:  'favourites_v1',
  settings:    'settings_v1',
  lastWorkout: 'last_workout_v1',
}

const MAX_HISTORY = 30
const MAX_FAVOURITES = 3
const LEGACY_DEFAULT_PHASE_COLORS = {
  work: '#3B82F6',
  rest: '#1D4ED8',
  warmup: '#F59E0B',
  cooldown: '#6366F1',
  complete: '#1C1C1E',
} as const

// ── Workouts ──────────────────────────────────────────────────────────────────

export async function getWorkouts(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(KEYS.workouts)
  const saved: Workout[] = raw ? JSON.parse(raw) : []
  return [...getPresetWorkouts(), ...saved]
}

export async function getUserWorkouts(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(KEYS.workouts)
  return raw ? JSON.parse(raw) : []
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const workouts = await getUserWorkouts()
  const idx = workouts.findIndex(w => w.id === workout.id)
  if (idx >= 0) {
    workouts[idx] = workout
  } else {
    workouts.push(workout)
  }
  await AsyncStorage.setItem(KEYS.workouts, JSON.stringify(workouts))
}

export async function deleteWorkout(id: string): Promise<void> {
  const workouts = await getUserWorkouts()
  const filtered = workouts.filter(w => w.id !== id)
  await AsyncStorage.setItem(KEYS.workouts, JSON.stringify(filtered))

  // Remove from favourites too
  const favs = await getFavourites()
  if (favs.includes(id)) {
    await setFavourites(favs.filter(f => f !== id))
  }
}

export function generateId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ── Favourites ────────────────────────────────────────────────────────────────

export async function getFavourites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.favourites)
  return raw ? JSON.parse(raw) : []
}

export async function setFavourites(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.favourites, JSON.stringify(ids.slice(0, MAX_FAVOURITES)))
}

export async function toggleFavourite(id: string): Promise<string[]> {
  const favs = await getFavourites()
  const exists = favs.includes(id)
  let updated: string[]
  if (exists) {
    updated = favs.filter(f => f !== id)
  } else {
    updated = [...favs, id].slice(0, MAX_FAVOURITES)
  }
  await setFavourites(updated)
  return updated
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.history)
  return raw ? JSON.parse(raw) : []
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await getHistory()
  const updated = [entry, ...history].slice(0, MAX_HISTORY)
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(updated))
}

// ── Last Workout ──────────────────────────────────────────────────────────────

export async function getLastWorkoutId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.lastWorkout)
}

export async function setLastWorkoutId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.lastWorkout, id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  soundCues:      true,
  voiceCues:      true,
  countdownBeeps: true,
  finalCountdown: 3,
  darkMode:       'system',
  locale:         'system',
  soundTheme:     'beep',
  phaseColors:    DEFAULT_PHASE_COLORS,
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings)
  if (!raw) return DEFAULT_SETTINGS

  const parsed = JSON.parse(raw)
  const validLocales: AppSettings['locale'][] = ['system', 'en', 'es', 'fr', 'de', 'pt-BR', 'ja']
  const validThemes: AppSettings['soundTheme'][] = ['beep', 'bell', 'gong', 'whistle']
  const legacySoundThemeMap: Record<string, AppSettings['soundTheme']> = {
    confirmation:   'beep',
    messagePop:     'beep',
    interfaceStart: 'whistle',
    positive:       'bell',
    pulse:          'beep',
  }

  const rawTheme = parsed.soundTheme
  const soundTheme: AppSettings['soundTheme'] = validThemes.includes(rawTheme)
    ? rawTheme
    : legacySoundThemeMap[rawTheme] ?? DEFAULT_SETTINGS.soundTheme
  const locale: AppSettings['locale'] = validLocales.includes(parsed.locale)
    ? parsed.locale
    : DEFAULT_SETTINGS.locale
  const usesLegacyPhaseDefaults = Object.entries(LEGACY_DEFAULT_PHASE_COLORS).every(
    ([key, value]) => parsed.phaseColors?.[key] === value,
  )
  const phaseColors = parsed.phaseColors && !usesLegacyPhaseDefaults
    ? {
        ...DEFAULT_SETTINGS.phaseColors,
        ...parsed.phaseColors,
      }
    : DEFAULT_SETTINGS.phaseColors

  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    locale,
    soundTheme,
    phaseColors,
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings()
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify({ ...current, ...settings }))
}
