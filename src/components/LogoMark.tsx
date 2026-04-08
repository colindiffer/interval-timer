import React from 'react'
import Svg, { Rect, Circle, Path } from 'react-native-svg'

interface Props {
  size?: number
  showBackground?: boolean
}

export default function LogoMark({ size = 64, showBackground = true }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {showBackground ? (
        <Rect width="100" height="100" rx="22" fill="#263238" />
      ) : null}

      {/* Ring track */}
      <Circle cx="50" cy="50" r="35" stroke="#0D47A1" strokeWidth="6" fill="none" />

      {/* Timer arc: 300° clockwise from top, ends at ~10 o'clock */}
      <Path
        d="M 50 15 A 35 35 0 1 1 19.7 32.5"
        stroke="#FF6D00"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Arc end dot */}
      <Circle cx="19.7" cy="32.5" r="4.5" fill="#00E676" />

      {/* Lightning bolt */}
      <Path d="M 55 28 L 44 52 L 51 52 L 45 72 L 56 48 L 49 48 Z" fill="white" />
    </Svg>
  )
}
