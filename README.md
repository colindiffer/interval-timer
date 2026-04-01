# Interval Timer

A phone-first interval timer focused on fast setup, clear mid-workout controls, and simple saved workouts.

> "What phase am I on, how long is left, and what comes next?"

## Current product shape
- Phone only
- Local-first runtime
- Simple but well designed
- Firebase native foundation added, but cloud features are not live yet
- No monetisation logic for now
- Placeholder ad surfaces only
- No video ads

## Current stack
- Expo 54
- React Native 0.81.5
- TypeScript
- React Navigation
- AsyncStorage
- React Native Firebase (`app`, `analytics`, `auth`, `firestore`)
- `expo-av`
- `expo-build-properties`
- `expo-haptics`
- `react-native-svg`

## Current navigation
- `Library`
- `Create`
- `History`
- `Settings`

`Workout Builder` opens as a modal.
`Active Workout` is a full-screen modal with no back swipe.

## Current feature set
- Big circular countdown timer with progress around the edge
- Tap circle to start or resume
- Separate pause button
- Hold-to-exit button
- Skip to next step
- Favourite toggle on timer and workout cards
- Quick-start `New workout` card on key tabs
- Presets open into the workout editor, not straight into the timer
- Saved workouts live in Library
- Advanced workout editing with custom set-by-set variations
- Quick advanced templates: descending rests, pyramid, negative split
- Skip last rest toggle
- Light, dark, and system display mode
- Per-phase colour selection in settings
- Multiple selectable sound themes

## Current data and backend state
- AsyncStorage is still the live source of truth for workouts, history, favourites, settings, and last workout
- Firebase packages are installed and wrapped in `src/lib/firebase.ts`
- Native Firebase files are present for iOS and Android
- Expo config is set up with `@react-native-firebase/app`
- No sign-in flow is built yet
- No Firestore reads or writes are active yet
- No analytics events are wired yet

## Current settings
- Theme: light, dark, system
- Audio mode: sound, voice, none
- Final count
- Sound theme selection
- Phase colour selection

## Ads
- Inline ad placeholders in `Create`
- Inline ad placeholders in `Library`
- Inline ad placeholders in `History`
- Banner placeholder in `Settings`
- No ads on active workout
- No video ads

## Current constraints
- Timer engine is solid, but background-survival native work is not built yet
- Audio uses local cue files; real spoken voice behaviour is not built yet
- Firebase is installed but not yet driving product logic
- Native Firebase modules will need a dev build / native run once those code paths are used at runtime
- Watch support is not in scope yet
- Monetisation is intentionally deferred

## Docs
- [Plan](./PLAN.md)
- [Wireframes](./WIREFRAMES.md)
- [Architecture](./ARCHITECTURE.md)

## Run
```powershell
npx expo start
```

## Type check
```powershell
npx tsc --noEmit
```
