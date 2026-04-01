# Architecture

## Current architecture

The app is currently an Expo / React Native app with a local timer engine, local storage as the active source of truth, and Firebase native setup installed but not yet used in live product flows.

```text
UI screens and components
  -> subscribe to timer state
  -> send commands to timer engine

Timer engine
  -> builds workout phase sequence
  -> manages idle / running / paused / complete
  -> exposes tick, phase change, and complete callbacks

Local storage
  -> workouts
  -> history
  -> favourites
  -> settings
  -> last workout

Firebase layer
  -> app bootstrap configured
  -> auth / firestore / analytics modules available
  -> not yet part of active screen flows

Audio + haptics
  -> local cue playback
  -> optional haptics on transitions
```

## Timer engine

Current engine goals:
- no React dependency
- deterministic phase sequence
- simple command surface
- safe to load without auto-start

Current supported workout structure:
- warmup
- repeated work / rest
- optional cooldown
- optional custom per-set intervals
- optional skip last rest

Current commands:
- `load(workout)`
- `start()`
- `pause()`
- `resume()`
- `stop()`
- `skipToNextStep()`
- `getState()`
- `onTick(...)`
- `onPhaseChange(...)`
- `onComplete(...)`

## Storage model

AsyncStorage keys currently cover:
- workouts
- history
- favourites
- settings
- last workout

Settings currently include:
- audio mode state
- final countdown
- vibration
- dark mode setting
- sound theme
- per-phase colours

Current storage rule:
- AsyncStorage is authoritative today
- Firebase is not yet a second source of truth
- Any sync work should preserve offline-first behaviour and avoid double-write drift

## UI structure

Main tabs:
- Library
- Create
- History
- Settings

Modal flow:
- Active Workout
- Workout Builder

Ad surfaces currently in use:
- Inline ad cards in Create
- Inline ad cards in Library
- Inline ad cards in History
- Banner ad in Settings
- No ad surface in Active Workout

## Audio

Current audio is local file playback through `expo-av`.

Current sound-theme support:
- confirmation
- bell
- message pop
- interface start
- positive

Current limitations:
- no spoken voice implementation yet
- no separate dedicated sound set for countdown vs transition
- no background-audio reliability work yet

## Firebase

Current Firebase setup:
- `@react-native-firebase/app`, `analytics`, `auth`, and `firestore` are installed
- `GoogleService-Info.plist` and `google-services.json` are present
- Expo config uses the `@react-native-firebase/app` plugin
- `src/lib/firebase.ts` exports the Firebase modules for future use

Current Firebase limitations:
- no auth screens
- no Firestore persistence or sync path
- no analytics event layer
- no user-facing backend error handling yet
- runtime use of these modules will require a dev build / native build path, not a plain Expo Go-only assumption

## Theme system

The app uses a theme context for:
- light mode
- dark mode
- system mode

There is also a separate saved phase-colour model used by the timer UI.

## What is not built yet

These were part of the earlier plan but are not current implementation:
- Android foreground service
- iOS background execution strategy
- lock screen / notification timer state
- watch bridge
- purchase flow

## Near-term architecture direction

Keep the current separation:
- UI stays dumb
- timer engine owns timing logic
- local storage owns current persistence
- Firebase stays additive until a real sync or auth requirement is defined
- settings own display and cue preferences

If background execution is added later, the timer engine contract should stay the same and only the execution layer should change.
