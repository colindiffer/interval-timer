import React from 'react'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

interface Props {
  size?: number
  /** Colour of the lightning bolt */
  boltColor?: string
}

/**
 * App logo mark — timer arc + lightning bolt.
 * Reproduced from assets/logo.svg, without the background rect so it
 * composites cleanly onto any screen background.
 */
export default function Logo({ size = 36, boltColor = '#FFFFFF' }: Props) {
  // Original viewBox is 0 0 100 100
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Side pusher */}
      <Rect x="69" y="9" width="12" height="6" rx="3" fill="#FF6D00" transform="rotate(32 69 9)" />
      {/* Filled face */}
      <Circle cx="50" cy="52" r="32" fill="#FF6D00" />
      {/* Ring track */}
      <Circle cx="50" cy="52" r="37" stroke="#D7E4F7" strokeWidth="8" />
      {/* Timer arc */}
      <Path
        d="M 50 15 A 37 37 0 1 1 20.3 29.9"
        stroke="#FF6D00"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Arc end dot */}
      <Circle cx="20.3" cy="29.9" r="5.2" fill="#00E676" />
      {/* Lightning bolt */}
      <Path d="M 55 29 L 42.5 51 L 50 51 L 43 75 L 58.5 46 L 50.5 46 Z" fill={boltColor} />
    </Svg>
  )
}
