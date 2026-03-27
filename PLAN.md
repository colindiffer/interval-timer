# Interval Timer — Build Plan

## Product definition

> A zero-friction interval timer that works reliably in the background and starts workouts instantly.

**Single question the app answers:**
"What am I running right now, and how long until the next change?"

**Positioning:** Between generic timers (too clunky) and full training apps (too much friction)

**What kills the app:**
- Timer stops when screen turns off
- Audio fails mid-workout
- Too many steps to start
- Setup required every time

---

## Monetisation (locked in)

- **Free:** Full timer functionality, 5 saved workouts, banner ads outside active workout
- **£2.99 one-time unlock:** Unlimited saved workouts, no ads
- No subscription. Ever.
- Free saved workouts are never blocked for editing or reuse — only creation of new ones beyond limit

---

## V1 — Core, Run, Polish

### Phase 0 — Technical spikes (build before any UI)

These must work before a single screen is built.

| Spike | Pass condition |
|---|---|
| Timer engine | Accurate tick. Phase transitions. Rep counting. No drift over 30 min. |
| Android foreground service | Timer runs with screen off for 60 min. No kill. |
| iOS background (silent audio) | Timer runs with screen off for 60 min. No kill. |
| Audio cues | Fires correctly over headphones. Ducks music, does not pause it. |
| App lifecycle | State recovers correctly after backgrounding and return. |

---

### Phase 1 — Core timer

| Task | Notes |
|---|---|
| Project scaffold | RN 0.84, navigation setup |
| Timer engine module | Pure TS, no React dependency |
| Android foreground service | `TimerService.kt`, persistent notification |
| iOS AVAudioSession | Silent audio, background execution |
| Basic active workout screen | Phase, countdown, rep — functional not polished |
| Audio cue system | Pre-recorded files, correct routing |
| Haptic feedback | Phase change vibration |

---

### Phase 2 — Workout management

| Task | Notes |
|---|---|
| Workout builder | Work / rest / repeats / optional warmup + cooldown |
| Save workout | Name + store locally |
| Workout library | List, edit, duplicate, delete |
| Pre-built templates | 6 templates — see below |
| Minimal history | Workout ID + timestamp + completed flag |
| Favourites (up to 3) | Ordered, shown on home screen |
| Quick start — last workout | Secondary action on home screen |

**Pre-built templates:**
```
1. 1 min on / 1 min off × 10     — beginner intervals
2. 2 min on / 1 min off × 8      — standard HIIT
3. 3 min on / 90s off × 6        — 1km rep equivalent
4. 20 min steady                  — tempo run
5. Pyramid: 1/2/3/2/1 min hard   — variety
6. Couch to 5K style: walk/run   — beginner
```

---

### Phase 3 — Polish + Ads

| Task | Notes |
|---|---|
| Active workout screen — final design | Glanceable, large, full colour phase coding |
| Lock screen / notification state | Android: foreground notif. iOS: clean re-entry. |
| AdMob banner — home screen only | Never on active workout screen |
| AdMob banner — library screen | Bottom, above tab bar |
| Settings screen | Sound, vibration, voice cues, dark mode |
| App icon + splash screen | |
| Onboarding | First launch: 2 screens max. Start with a template. |

---

## V2 — Watch + Unlock

| Task | Notes |
|---|---|
| £2.99 IAP unlock | `react-native-iap`, one-time purchase |
| Unlimited workouts | Paywall on creation beyond 5, not on using existing |
| Apple Watch companion | Swift, WCSession, shows phase/countdown/rep |
| Wear OS companion | Kotlin, Wearable Data Layer |
| Live Activities (iOS) | Lock screen + Dynamic Island display |
| Audio packs / voice options | Alternative voice cues (optional) |

---

## V3 — Platform expansion

| Task | Notes |
|---|---|
| Standalone Apple Watch app | Runs without phone |
| Workout sharing | Export/import workout definitions |
| Wearable standalone (Wear OS) | |

---

## Screen inventory

```
Home
Active Workout (the product)
Workout Builder
Workout Library
History (minimal)
Settings
```

---

## Retention model

This is a habit app, not a transactional app.

Users return: multiple times per week, before workouts.

Retention drivers:
- Saved workouts → no rebuild required
- Favourites on home screen → one tap to start
- Minimal history → sense of repetition and progress
- Quick start → zero friction re-entry

The loop:
```
Open → Tap favourite → Start → Follow cues → Finish → Repeat
```

Everything in the app supports this loop or gets cut.
