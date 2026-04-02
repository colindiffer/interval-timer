import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

interface Props {
  size?: number
  /** Colour of the lightning bolt — use a dark value on light backgrounds */
  boltColor?: string
}

/**
 * App logo mark — timer arc + lightning bolt.
 * Reproduced from assets/logo.svg, without the background rect so it
 * composites cleanly onto any screen background.
 */
export default function Logo({ size = 36, boltColor = '#FACC15' }: Props) {
  // Original viewBox is 0 0 100 100
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Ring track */}
      <Circle cx="50" cy="50" r="35" stroke="#1E3A5F" strokeWidth="6" />
      {/* Timer arc: 300° clockwise from 12 o'clock */}
      <Path
        d="M 50 15 A 35 35 0 1 1 19.7 32.5"
        stroke="#3B82F6"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Arc end dot */}
      <Circle cx="19.7" cy="32.5" r="4.5" fill="#60A5FA" />
      {/* Lightning bolt */}
      <Path d="M 55 28 L 44 52 L 51 52 L 45 72 L 56 48 L 49 48 Z" fill={boltColor} />
    </Svg>
  )
}
