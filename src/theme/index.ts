export * from './colors'
export * from './ThemeContext'

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
}

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  pill:999,
}

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   22,
  xxl:  28,
  hero: 80,
  mega: 96,
}

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
  heavy:   '800' as const,
}
