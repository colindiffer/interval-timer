import { PhaseColorKey } from '../types'

export const DEFAULT_PHASE_COLORS: Record<PhaseColorKey, string> = {
  work:     '#3B82F6',  // blue
  rest:     '#1D4ED8',  // deeper blue
  warmup:   '#F59E0B',  // amber
  cooldown: '#6366F1',  // indigo
  complete: '#1C1C1E',  // near-black
}

export const PhaseColors = DEFAULT_PHASE_COLORS

export const PHASE_COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#14B8A6', // teal
  '#10B981', // green
  '#F59E0B', // amber
  '#F97316', // orange
  '#EF4444', // red
  '#8B5CF6', // violet
  '#475569', // slate
] as const

export const PhaseTextColors: Record<string, string> = {
  work:     '#FFFFFF',
  rest:     '#FFFFFF',
  warmup:   '#FFFFFF',
  cooldown: '#FFFFFF',
  complete: '#FFFFFF',
  idle:     '#FFFFFF',
}

export const DarkColors = {
  bg:           '#0F0F0F',
  bgCard:       '#1C1C1E',
  bgCardAlt:    '#2C2C2E',
  bgInput:      '#2C2C2E',
  textPrimary:  '#FFFFFF',
  textSecondary:'#8E8E93',
  textTertiary: '#48484A',
  accent:       '#60A5FA',
  accentMuted:  '#3B82F6',
  accentText:   '#FFFFFF',
  border:       '#2C2C2E',
  separator:    '#1C1C1E',
  danger:       '#EF4444',
  adBg:         '#1C1C1E',
  adText:       '#48484A',
}

export const LightColors = {
  bg:           '#ECF1F6',
  bgCard:       '#F8FBFE',
  bgCardAlt:    '#DCE5EF',
  bgInput:      '#E7EDF4',
  textPrimary:  '#16202A',
  textSecondary:'#5E6C7B',
  textTertiary: '#8C99A8',
  accent:       '#1F4E78',
  accentMuted:  '#163A5B',
  accentText:   '#FFFFFF',
  border:       '#C9D5E2',
  separator:    '#D8E0EA',
  danger:       '#DC2626',
  adBg:         '#DCE5EF',
  adText:       '#7A8897',
}

// Default export is dark — components that use useTheme() will pick the right one at runtime
export const Colors = DarkColors
