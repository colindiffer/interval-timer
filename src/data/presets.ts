import { Workout } from '../types'

const preset = (
  id: string,
  name: string,
  workDuration: number,
  restDuration: number,
  reps: number,
  warmupDuration = 0,
  cooldownDuration = 0,
): Workout => ({
  id,
  name,
  warmupDuration,
  workDuration,
  restDuration,
  reps,
  cooldownDuration,
  isPreset: true,
  createdAt: 0,
})

export const PRESETS: Workout[] = [
  // ── Beginner ──────────────────────────────────────────────
  preset('p1',  'Beginner Intervals',    60, 60,  10),             // 1 min on / 1 min off × 10
  preset('p2',  'Couch to 5K',           60, 120,  8),             // 1 min run / 2 min walk × 8
  preset('p3',  'Easy Cardio',          120, 120,  6),             // 2 min on / 2 min off × 6
  preset('p4',  'Slow Burn',            180, 90,   5),             // 3 min on / 90s off × 5

  // ── HIIT ──────────────────────────────────────────────────
  preset('p5',  'Tabata',               20,  10,   8),             // classic 20/10 × 8
  preset('p6',  '30/30',               30,  30,  16),             // 30s on / 30s off × 16
  preset('p7',  '40/20',               40,  20,  12),             // 40s on / 20s off × 12
  preset('p8',  'Standard HIIT',       120, 60,   8),             // 2 min on / 1 min off × 8
  preset('p9',  '90/60',               90,  60,   8),             // 90s on / 60s off × 8

  // ── Running ───────────────────────────────────────────────
  preset('p10', 'Track Intervals',     180, 90,   6),             // 3 min on / 90s off × 6 (1km equiv)
  preset('p11', '400m Reps',            90, 90,   8),             // 90s on / 90s off × 8
  preset('p12', '800m Reps',           180, 180,  6),             // 3 min on / 3 min off × 6
  preset('p13', '5K Build',            240, 90,   5),             // 4 min on / 90s off × 5
  preset('p14', 'Speed Work',           30, 120,  8),             // 30s hard / 2 min easy × 8
  preset('p15', 'Sprint Blasts',        15, 45,  12),             // 15s all-out / 45s walk × 12
  preset('p16', 'Fartlek',              45, 60,  10),             // 45s hard / 60s easy × 10

  // ── Endurance ─────────────────────────────────────────────
  preset('p17', 'Long Intervals',      300, 120,  5),             // 5 min on / 2 min off × 5
  preset('p18', 'Threshold',           360, 120,  4),             // 6 min on / 2 min off × 4
  preset('p19', 'Tempo 20',           1200, 0,    1),             // 20 min steady
  preset('p20', 'Tempo 30',           1800, 0,    1),             // 30 min steady
]
