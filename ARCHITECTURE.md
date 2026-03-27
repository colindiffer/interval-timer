# Architecture

## Core principle

The timer engine must be completely decoupled from the UI.
If the timer lives inside a React component, it will break when:
- Screen turns off
- App is backgrounded
- User switches to Spotify
- OS decides to reclaim memory

This is why most interval timer apps are broken.

---

## Layer structure

```
┌─────────────────────────────────────┐
│           React Native UI            │  ← reads state, sends commands
├─────────────────────────────────────┤
│          Timer Engine Module         │  ← pure logic, no UI dependency
│                                      │
│  - current phase (work/rest/warmup)  │
│  - countdown                         │
│  - current rep                       │
│  - total reps                        │
│  - workout state (running/paused)    │
├─────────────────────────────────────┤
│      Platform Execution Layer        │
│                                      │
│  Android: Foreground Service         │  ← keeps timer alive, shows notif
│  iOS: Background Task + AVSession    │  ← silent audio trick to stay alive
├─────────────────────────────────────┤
│         Audio Engine                 │  ← ducks music, routes to headphones
├─────────────────────────────────────┤
│     Watch Bridge (v2 — not v1)      │  ← sends state to Wear OS / watchOS
└─────────────────────────────────────┘
```

---

## Timer Engine

Single source of truth. Plain TypeScript module — no React, no hooks.

```typescript
// TimerEngine.ts
interface WorkoutPhase {
  type: 'warmup' | 'work' | 'rest' | 'cooldown'
  duration: number  // seconds
}

interface TimerState {
  phase: WorkoutPhase
  countdown: number       // seconds remaining in current phase
  currentRep: number
  totalReps: number
  status: 'idle' | 'running' | 'paused' | 'complete'
  elapsedTotal: number
}

// Engine exposes:
// start(workout) → void
// pause() → void
// resume() → void
// stop() → void
// onTick(callback: (state: TimerState) => void) → void
// onPhaseChange(callback: (phase, nextPhase) => void) → void
```

UI subscribes to state via callbacks. Engine doesn't know the UI exists.

---

## Android: Foreground Service

**Why:** Android OS kills background processes. Without a foreground service, the timer stops the moment the screen turns off.

**Implementation:**
- Native Kotlin `TimerService extends Service`
- Runs as foreground with persistent notification
- Notification shows: phase / countdown / rep count
- Timer engine runs inside the service — not in JS thread
- JS bridge for start/pause/stop commands and state updates

**Notification format:**
```
[App Icon] Interval Timer
RUN — 0:42 remaining
Rep 3 of 10
```

**Native module:** `TimerModule.kt` — same pattern as BlockerModule in SiteBlocker

---

## iOS: Staying Alive

iOS is more restrictive. Options:

1. **Silent audio track** — play a silent audio file continuously. AVAudioSession keeps the app alive. Widely used by timer apps. Slightly hacky but works.
2. **Background Task** — `BGTaskScheduler` — limited, not reliable for long workouts
3. **Live Activities** (iOS 16+) — shows on lock screen and Dynamic Island. Best UX but requires entitlement.

**v1 approach:** Silent audio track + AVAudioSession
**v2 addition:** Live Activities for lock screen display

---

## Audio Engine

### Requirements
- Play cues through headphones if connected, speaker otherwise
- Duck (reduce volume of) background music during cues — do NOT pause it
- Cues must fire even when phone is silent (use AVAudioSession.playback category)
- Cues: "Starting in 3... 2... 1", "Run", "Rest", "Last rep", "Done"

### Android
- `AudioManager` for routing detection
- `AudioFocusRequest` with `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK` — this ducks music without pausing
- Pre-loaded audio files (.mp3) — no TTS in v1 (sounds robotic)

### iOS
- `AVAudioSession` category: `.playback` with `.mixWithOthers` + `.duckOthers` options
- Pre-loaded audio files

### Audio cue files needed
```
countdown-3.mp3   "3"
countdown-2.mp3   "2"
countdown-1.mp3   "1"
phase-work.mp3    "Go"
phase-rest.mp3    "Rest"
phase-last.mp3    "Last one"
complete.mp3      "Done"
```
Short, clear, unambiguous. Male or female voice — decide before recording.

---

## Local Storage

`@react-native-async-storage/async-storage` v2.2.0

```
workouts[]          — saved workout definitions
history[]           — { workoutId, timestamp, completed }
favourites[]        — ordered list of up to 3 workout IDs
settings            — { sound, vibration, voice, darkMode, unlocked }
lastWorkoutId       — ID of most recently started workout
```

---

## Watch Bridge (v2 — plan now, build later)

Keep timer state serialisable from day one:

```typescript
// This shape gets sent to the watch
interface WatchState {
  phase: 'work' | 'rest' | 'warmup' | 'cooldown'
  countdown: number
  currentRep: number
  totalReps: number
  status: 'running' | 'paused' | 'complete'
}
```

**Android → Wear OS:** `Wearable.getDataClient()` via Kotlin native module
**iOS → watchOS:** `WCSession` via Swift native module

Both communicate the WatchState above. Watch UI is built natively (Compose / SwiftUI).

---

## Spike order (build this before any UI)

```
1. Timer engine — accurate tick, phase transitions, rep counting
2. Android foreground service — timer survives screen off
3. iOS silent audio — timer survives screen off
4. Audio cues — duck music, correct routing, fire on phase change
5. App lifecycle — state survives backgrounding and return
```

Only after all 5 pass testing: build the UI.
