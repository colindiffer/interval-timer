# Interval Timer

A zero-friction interval timer that works reliably in the background and starts workouts instantly.

> "What am I running right now, and how long until the next change?"

## What it is
- A focused interval timer for runners and fitness training
- Simple enough to use mid-run
- Structured enough to be genuinely useful

## What it is not
- A GPS tracker
- A training plan app
- A coaching platform

## Stack
- React Native 0.84 (Android + iOS)
- Local storage only — no backend
- Wear OS companion (v2)
- Apple Watch companion (v2)

## Monetisation
- Free: full timer, 5 saved workouts, banner ads (never during active workout)
- £2.99 one-time unlock: unlimited workouts, no ads

## Docs
- [Plan](./PLAN.md) — phased build plan
- [Wireframes](./WIREFRAMES.md) — all screens
- [Architecture](./ARCHITECTURE.md) — timer engine, foreground service, audio

## Dev workflow
```
npx react-native start --reset-cache
adb reverse tcp:8081 tcp:8081
```
