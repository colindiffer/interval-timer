# Interval Timer - Current Plan

## Product definition

Phone-first interval timer for running and interval work.

The app should answer three things at a glance:
- what phase am I on
- how long is left
- what happens next

## Locked decisions
- Phone only
- Local-first storage today
- Keep the app simple
- Limit presets to 20
- Ignore monetisation until the product is solid
- Keep placeholder ad surfaces only
- Never use video ads
- Firebase can be added underneath the app, but should not complicate the core timer UX

## What is already built

### Core timer
- Timer engine in TypeScript
- Warmup, work, rest, cooldown phases
- Pause, resume, stop
- Skip to next step
- Ready state on open, no auto-start
- History logging

### Navigation
- `Library`
- `Create`
- `History`
- `Settings`
- `Active Workout` as full-screen modal
- `Workout Builder` as modal

### Workout management
- Create workout
- Edit workout
- Duplicate workout into editor
- Save workout to library
- Favourite workouts
- Up to 20 presets
- Advanced custom intervals
- Advanced templates
- Skip last rest toggle

### Active workout UX
- Large circular timer
- Tap circle to start or resume
- Small deliberate pause button
- Hold-to-exit button
- No swipe back
- Next phase preview
- Favourite toggle

### Settings
- Theme mode
- Audio mode selector
- Final countdown
- Sound theme choice
- Per-phase colour choice

### Firebase foundation
- `@react-native-firebase/app`
- `@react-native-firebase/analytics`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- Native config files in place for iOS and Android
- Shared Firebase wrapper module in `src/lib/firebase.ts`
- Expo plugin config working with `@react-native-firebase/app`

### Storage and persistence
- AsyncStorage remains the active source of truth
- Workouts, history, favourites, settings, and last workout all persist locally
- No cloud sync path is active yet

## Current backlog

### High priority
- Decide whether Firebase is for auth only, sync only, or both
- Decide the source-of-truth migration plan before wiring Firestore into existing local flows
- Build the first real Firebase-backed flow or remove unused backend surface until needed
- Make `voice cues` real or remove the toggle
- Add explicit dev-build notes to the project flow once Firebase runtime usage begins
- Review all 20 presets and tighten the timings where needed
- Improve settings polish so old controls remain obvious

### Medium priority
- Define analytics event naming before instrumenting screens
- Add sign-in / account model only if cross-device sync is truly needed
- Let users preview a full phase colour theme, not just per-phase colour dots
- Improve history grouping and detail
- Add a better last-workout shortcut on create or library
- Tune the active timer layout further for light mode

### Later
- Native background execution
- Foreground service / iOS background handling
- Cloud sync between devices
- Watch support
- Real monetisation

## Working rules
- Active workout screen must stay distraction-free
- Never show ads during a workout
- Never force a multi-step start flow for common actions
- Presets should be editable before use
- Favourites should always surface somewhere visible
- Backend work must not make the timer dependent on network availability
