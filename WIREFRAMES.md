# Interval Timer - Current Screen Notes

These are not final visual specs. They are current product notes for the app as built.

## Navigation

```text
Bottom tabs
- Library
- Create
- History
- Settings
```

`Active Workout` opens full screen above the tabs.

## Create

Purpose:
- quick creation flow
- preset browsing
- obvious entry into workout builder

Current content:
- large `New workout` card at the top
- presets list below
- inline ad placeholders inside the preset list

Rules:
- tapping a preset opens the workout editor
- presets do not start immediately
- saving from preset creates a normal user workout

## Library

Purpose:
- saved workouts
- favourites
- workout actions

Current content:
- favourites section
- my workouts section
- compact `...` menu per workout
- inline ad placeholders between workout cards

Menu actions:
- edit
- duplicate
- favourite / unfavourite
- delete

Rules:
- menu must dismiss by tapping outside
- duplicate opens the editor
- favourites must appear in their own visible section

## Active Workout

Purpose:
- the core product

Current behaviour:
- screen opens ready, not running
- large circular countdown
- ring progress around edge
- tap circle to start or resume
- pause is a separate top control
- skip button moves to next step
- hold exit button required to leave
- no swipe back

Visible information:
- workout name
- favourite toggle
- current phase
- countdown
- rep progress
- next phase and duration

Rules:
- no ads
- no accidental dismissal
- colours must remain readable in light and dark mode

## Workout Builder

Purpose:
- create and edit workouts without friction

Current sections:
- workout name
- work duration
- rest duration
- reps
- warmup
- cooldown
- skip last rest
- preview
- advanced section

Advanced section:
- custom variations
- per-set work and rest values
- add/remove sets
- quick templates:
  - descending rests
  - pyramid
  - negative split

Rules:
- seconds move in 5-second steps
- advanced stays in the same editor, not a separate screen

## History

Purpose:
- simple log only

Current behaviour:
- show recent completed and incomplete sessions
- completed shows `Completed`
- incomplete shows `Stopped early`
- quick-start `New workout` card at the top
- inline ad placeholders appear inside longer lists

Rules:
- no red cross icon
- no charts or stats for now

## Settings

Purpose:
- keep familiar direct controls
- add new controls without hiding old ones

Current sections:
- Theme
- Sound
- Colors
- Miscellaneous

Current controls:
- light / dark / system
- sound / voice / none mode
- final count
- sound theme selector with try button
- per-phase colour selector
- miscellaneous links and version row
- banner ad placeholder pinned below content

Rules:
- old settings remain obvious
- colour controls must change the real timer
- sound choices must use real files, not synthetic placeholders

## Backend surface

Current user-facing backend state:
- there are no auth or account screens yet
- there is no cloud-sync UI yet
- Firebase currently changes setup, not screen flow

## Ad placement

Allowed:
- Create inline placeholders
- Library inline placeholders
- History inline placeholders
- Settings banner placeholder

Not allowed:
- Active workout
- video ads
