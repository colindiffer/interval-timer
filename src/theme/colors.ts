import { PhaseColorKey } from '../types'

export const DEFAULT_PHASE_COLORS: Record<PhaseColorKey, string> = {
  work:     '#0D47A1',  // deep blue
  rest:     '#00E676',  // neon green
  warmup:   '#FF6D00',  // bright orange
  cooldown: '#1565C0',  // pace blue
  complete: '#263238',  // dark charcoal
}

export const PhaseColors = DEFAULT_PHASE_COLORS

export const PHASE_COLOR_OPTIONS = [
  '#0D47A1', // deep blue
  '#1565C0', // pace blue
  '#00E676', // neon green
  '#FF6D00', // orange
  '#FF8F00', // amber orange
  '#EF4444', // red
  '#8B5CF6', // violet
  '#263238', // charcoal
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
  bg:           '#10181F',
  bgCard:       '#16232B',
  bgCardAlt:    '#22313A',
  bgInput:      '#22313A',
  textPrimary:  '#F6FAFC',
  textSecondary:'#9BB0BD',
  textTertiary: '#657885',
  accent:       '#FF6D00',
  accentMuted:  '#D95E05',
  accentText:   '#FFFFFF',
  border:       '#2C3D47',
  separator:    '#24343D',
  danger:       '#E45A3C',
  adBg:         '#16232B',
  adText:       '#657885',
}

export const LightColors = {
  bg:           '#EEF4F8',
  bgCard:       '#FBFDFF',
  bgCardAlt:    '#DEE8EF',
  bgInput:      '#E7EFF5',
  textPrimary:  '#172229',
  textSecondary:'#5E7281',
  textTertiary: '#8B9BA7',
  accent:       '#FF6D00',
  accentMuted:  '#D95E05',
  accentText:   '#FFFFFF',
  border:       '#CCDAE4',
  separator:    '#D8E3EB',
  danger:       '#D84A32',
  adBg:         '#E0E9F0',
  adText:       '#7B8C97',
}

// Default export is dark — components that use useTheme() will pick the right one at runtime
export const Colors = DarkColors
