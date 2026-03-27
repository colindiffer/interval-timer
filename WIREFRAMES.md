# Interval Timer — Wireframes (V1)

## Navigation

```
Bottom Tab Bar
├── Home
├── Library
├── History (minimal)
└── Settings
```

Active Workout is a full-screen modal — no tab bar visible during workout.

---

## Screen 1: Home

```
┌─────────────────────────────────┐
│  Good morning, Colin         ⚙  │  ← settings shortcut
│                                 │
│  FAVOURITES                     │
│  ┌─────────────────────────┐    │
│  │ ▶  Track Intervals      │    │  ← tap to start immediately
│  │    3 min / 90s × 6      │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ ▶  HIIT                 │    │
│  │    1 min / 1 min × 10   │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ ▶  Tempo Run            │    │
│  │    20 min steady        │    │
│  └─────────────────────────┘    │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  LAST WORKOUT                   │
│  ┌─────────────────────────┐    │
│  │ ▶  Track Intervals      │    │
│  │    Yesterday · Complete │    │
│  └─────────────────────────┘    │
│                                 │
│  + Create new workout           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │          AD BANNER          │ │  ← banner only, never during workout
│ └─────────────────────────────┘ │
│  [Home]  [Library] [History] [⚙]│
└─────────────────────────────────┘
```

**Rules:**
- Favourites are ordered by user — drag to reorder
- Tapping a favourite or last workout → goes straight to Active Workout (no confirmation)
- Up to 3 favourites
- "+ Create new workout" → opens Workout Builder
- No ad during workout — ever

---

## Screen 2: Active Workout (the product)

**Phase: WORK**
```
┌─────────────────────────────────┐
│  ✕                           ⏸ │  ← stop / pause — small, top corners
│                                 │
│                                 │
│            RUN                  │  ← large, centred, phase label
│                                 │
│          2:47                   │  ← countdown — dominant element
│                                 │
│        ━━━━━━━━━━━━━━           │  ← phase progress bar
│                                 │
│         Rep 3 / 10              │  ← current rep
│                                 │
│        Next: REST               │  ← next phase preview
│        1 min 0 sec              │
│                                 │
└─────────────────────────────────┘
```
Background: bold green

**Phase: REST**
```
┌─────────────────────────────────┐
│  ✕                           ⏸ │
│                                 │
│                                 │
│            REST                 │
│                                 │
│          0:52                   │
│                                 │
│        ━━━━━━━━░░░░░░░          │
│                                 │
│         Rep 3 / 10              │
│                                 │
│        Next: RUN                │
│        3 min 0 sec              │
│                                 │
└─────────────────────────────────┘
```
Background: deep blue

**Phase: WARMUP**
Background: amber

**Phase: COOLDOWN**
Background: purple

**Phase: COMPLETE**
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│           DONE ✓                │
│                                 │
│     Track Intervals             │
│     10 reps complete            │
│     Total time: 45:00           │
│                                 │
│    [ Start again ]              │
│                                 │
│    [ Back to home ]             │
│                                 │
└─────────────────────────────────┘
```
Background: dark, calm

**Rules:**
- Full screen — no tab bar, no distractions
- Colour coding is the primary phase indicator (visible at a glance)
- Text is secondary confirmation
- ✕ asks "Stop workout?" with confirmation
- ⏸ pauses immediately, shows resume button
- No ads. Ever. On this screen.
- Audio cue on every phase change
- Haptic on every phase change
- Countdown beeps at 3, 2, 1 before phase change

---

## Screen 3: Workout Builder

```
┌─────────────────────────────────┐
│  ← New Workout              Save│
│                                 │
│  Name                           │
│  ┌─────────────────────────┐    │
│  │ Track Intervals         │    │
│  └─────────────────────────┘    │
│                                 │
│  WORK INTERVAL                  │
│  ┌─────────────────────────┐    │
│  │  3 min    00 sec        │    │  ← number picker
│  └─────────────────────────┘    │
│                                 │
│  REST INTERVAL                  │
│  ┌─────────────────────────┐    │
│  │  1 min    30 sec        │    │
│  └─────────────────────────┘    │
│                                 │
│  REPEATS                        │
│  ┌────────┐                     │
│  │   6    │  ← –  ●●●●●●  + →  │
│  └────────┘                     │
│                                 │
│  WARMUP (optional)              │
│  ┌─────────────────────────┐    │
│  │  Off                  > │    │  ← tap to set duration
│  └─────────────────────────┘    │
│                                 │
│  COOLDOWN (optional)            │
│  ┌─────────────────────────┐    │
│  │  Off                  > │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │       PREVIEW           │    │
│  │  Warmup: —              │    │
│  │  3:00 work / 1:30 rest  │    │
│  │  × 6 reps               │    │
│  │  Total: ~27 min         │    │
│  └─────────────────────────┘    │
│                                 │
│     [ Start now ]               │  ← save + start immediately
│                                 │
│  [Home]  [Library] [History] [⚙]│
└─────────────────────────────────┘
```

**Rules:**
- Name defaults to "Workout 1", "Workout 2" etc — user can rename
- Preview updates live as user adjusts values
- "Start now" saves and starts immediately — no extra step
- Warmup/cooldown off by default
- Time picker: scroll wheels for minutes and seconds

---

## Screen 4: Workout Library

```
┌─────────────────────────────────┐
│  My Workouts              + New │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ★ Track Intervals       │    │  ← ★ = in favourites
│  │   3 min / 90s × 6       │    │
│  │   Last run: yesterday   ▶ ⋯ │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ★ HIIT                  │    │
│  │   1 min / 1 min × 10    │    │
│  │   Last run: 3 days ago  ▶ ⋯ │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │   Tempo Run             │    │
│  │   20 min steady         │    │
│  │   Last run: last week   ▶ ⋯ │    │
│  └─────────────────────────┘    │
│                                 │
│  TEMPLATES                      │
│  ┌─────────────────────────┐    │
│  │   1 min on / 1 min off  │    │
│  │   × 10 · Beginner       ▶ ⋯ │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │   Pyramid Intervals     │    │
│  │   1/2/3/2/1 min hard    ▶ ⋯ │    │
│  └─────────────────────────┘    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │          AD BANNER          │ │
│ └─────────────────────────────┘ │
│  [Home]  [Library] [History] [⚙]│
└─────────────────────────────────┘
```

**Rules:**
- ▶ starts the workout immediately
- ⋯ opens action sheet: Edit / Duplicate / Add to favourites / Delete
- ★ shown if in favourites (tap to toggle)
- User workouts above templates
- 5 max user workouts in free tier — "+ New" shows upgrade prompt if limit reached
- Templates are always available, cannot be deleted, can be duplicated to edit

---

## Screen 5: History

```
┌─────────────────────────────────┐
│  History                        │
│                                 │
│  THIS WEEK                      │
│  ┌─────────────────────────┐    │
│  │ ✓ Track Intervals       │    │
│  │   Today · 27 min        │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ ✓ HIIT                  │    │
│  │   Yesterday · 22 min    │    │
│  └─────────────────────────┘    │
│                                 │
│  LAST WEEK                      │
│  ┌─────────────────────────┐    │
│  │ ✓ Track Intervals       │    │
│  │   Mon · 27 min          │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ ✗ Tempo Run             │    │  ← ✗ = stopped early
│  │   Sat · Stopped at 12m  │    │
│  └─────────────────────────┘    │
│                                 │
│  [Home]  [Library] [History] [⚙]│
└─────────────────────────────────┘
```

**Rules:**
- No stats, no charts, no streaks — just the log
- ✓ = completed, ✗ = stopped early
- Grouped by week
- Tapping a row → "Run this workout again?" shortcut
- Last 30 entries stored, then rolling deletion
- No ad on history screen — it's too small

---

## Screen 6: Settings

```
┌─────────────────────────────────┐
│  Settings                       │
│                                 │
│  AUDIO                          │
│  ┌─────────────────────────┐    │
│  │ Sound cues      [◉ ON]  │    │
│  ├─────────────────────────┤    │
│  │ Voice cues      [◉ ON]  │    │
│  ├─────────────────────────┤    │
│  │ Countdown beeps [◉ ON]  │    │
│  └─────────────────────────┘    │
│                                 │
│  FEEDBACK                       │
│  ┌─────────────────────────┐    │
│  │ Vibration       [◉ ON]  │    │
│  └─────────────────────────┘    │
│                                 │
│  DISPLAY                        │
│  ┌─────────────────────────┐    │
│  │ Dark mode       [◉ ON]  │    │
│  └─────────────────────────┘    │
│                                 │
│  APP                            │
│  ┌─────────────────────────┐    │
│  │ Remove ads — £2.99    > │    │  ← IAP, one-time
│  ├─────────────────────────┤    │
│  │ Restore purchase      > │    │
│  ├─────────────────────────┤    │
│  │ Rate the app          > │    │
│  ├─────────────────────────┤    │
│  │ Send feedback         > │    │
│  ├─────────────────────────┤    │
│  │ Privacy policy        > │    │
│  ├─────────────────────────┤    │
│  │ Version 1.0.0           │    │
│  └─────────────────────────┘    │
│                                 │
│  [Home]  [Library] [History] [⚙]│
└─────────────────────────────────┘
```

---

## Ad placement summary

| Screen | Ad |
|---|---|
| Home | Banner — bottom, above tab bar |
| Active Workout | None — ever |
| Workout Builder | None |
| Library | Banner — bottom, above tab bar |
| History | None |
| Settings | None |

---

## Foreground notification (Android — active workout)

```
┌─────────────────────────────────────┐
│ 🏃 Interval Timer                   │
│ RUN — 2:47 remaining · Rep 3 of 10  │
│ ▐▐ Pause                            │
└─────────────────────────────────────┘
```

Tapping notification → returns to Active Workout screen.

---

## Apple Watch (v2 — plan only)

```
┌───────────────┐
│     RUN       │  ← large, colour-coded
│    2:47       │  ← countdown
│   Rep 3/10   │
│               │
│  Next: REST   │
└───────────────┘
```

Crown/button: pause/resume
Haptic: on every phase change
