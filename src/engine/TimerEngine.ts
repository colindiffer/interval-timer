import { PhaseType, TimerState, Workout } from '../types'

interface PhaseStep {
  type: PhaseType
  duration: number // seconds
  rep: number      // which rep this belongs to (1-based), 0 for warmup/cooldown
}

type TickListener = (state: TimerState) => void
type PhaseChangeListener = (phase: PhaseType, next: PhaseType | null, nextDuration: number) => void
type CompleteListener = () => void

class TimerEngine {
  private state: TimerState = this.makeIdleState()
  private sequence: PhaseStep[] = []
  private currentStepIndex = 0
  private intervalId: ReturnType<typeof setInterval> | null = null
  private tickStartedAt = 0
  private expectedTick = 0

  private tickListeners: Set<TickListener> = new Set()
  private phaseChangeListeners: Set<PhaseChangeListener> = new Set()
  private completeListeners: Set<CompleteListener> = new Set()

  private makeIdleState(): TimerState {
    return {
      status: 'idle',
      currentPhase: 'work',
      countdown: 0,
      phaseDuration: 0,
      currentRep: 0,
      totalReps: 0,
      elapsedTotal: 0,
      nextPhase: null,
      nextPhaseDuration: 0,
      workoutId: '',
      workoutName: '',
    }
  }

  private buildSequence(workout: Workout): PhaseStep[] {
    const steps: PhaseStep[] = []
    const intervals = workout.intervals?.length ? workout.intervals : null
    const skipLastRest = workout.skipLastRest !== false

    if (workout.warmupDuration > 0) {
      steps.push({ type: 'warmup', duration: workout.warmupDuration, rep: 0 })
    }

    if (intervals) {
      intervals.forEach((interval, index) => {
        const rep = index + 1
        steps.push({ type: 'work', duration: interval.workDuration, rep })
        const shouldAddRest = index < intervals.length - 1 || !skipLastRest
        if (shouldAddRest && interval.restDuration > 0) {
          steps.push({ type: 'rest', duration: interval.restDuration, rep })
        }
      })
    } else {
      for (let i = 1; i <= workout.reps; i++) {
        steps.push({ type: 'work', duration: workout.workDuration, rep: i })
        const shouldAddRest = i < workout.reps || !skipLastRest
        if (shouldAddRest && workout.restDuration > 0) {
          steps.push({ type: 'rest', duration: workout.restDuration, rep: i })
        }
      }
    }

    if (workout.cooldownDuration > 0) {
      steps.push({ type: 'cooldown', duration: workout.cooldownDuration, rep: 0 })
    }

    return steps
  }

  private stateFromStep(stepIndex: number): TimerState {
    const step = this.sequence[stepIndex]
    const nextStep = this.sequence[stepIndex + 1] ?? null
    const workReps = this.sequence.filter(s => s.type === 'work')
    const completedWorkReps = this.sequence
      .slice(0, stepIndex)
      .filter(s => s.type === 'work').length

    return {
      ...this.state,
      currentPhase: step.type,
      countdown: step.duration,
      phaseDuration: step.duration,
      currentRep: step.type === 'work' ? completedWorkReps + 1 : completedWorkReps,
      totalReps: workReps.length,
      nextPhase: nextStep?.type ?? null,
      nextPhaseDuration: nextStep?.duration ?? 0,
    }
  }

  private completeWorkout(elapsedTotal: number): void {
    this.clearInterval()
    this.state = {
      ...this.state,
      status: 'complete',
      countdown: 0,
      elapsedTotal,
      nextPhase: null,
      nextPhaseDuration: 0,
    }
    this.emitTick()
    this.emitComplete()
  }

  private moveToStep(stepIndex: number): void {
    this.currentStepIndex = stepIndex
    const nextState = this.stateFromStep(stepIndex)
    this.state = {
      ...this.state,
      currentPhase: nextState.currentPhase,
      countdown: nextState.countdown,
      phaseDuration: nextState.phaseDuration,
      currentRep: nextState.currentRep,
      totalReps: nextState.totalReps,
      nextPhase: nextState.nextPhase,
      nextPhaseDuration: nextState.nextPhaseDuration,
    }

    this.emitPhaseChange(nextState.currentPhase, nextState.nextPhase, nextState.nextPhaseDuration)
    this.emitTick()
  }

  // Load a workout into idle state — does not start the timer.
  // The screen should call this on mount, then wait for the user to tap.
  load(workout: Workout): void {
    this.stop()
    this.sequence = this.buildSequence(workout)
    this.currentStepIndex = 0

    if (this.sequence.length === 0) return

    this.state = {
      ...this.stateFromStep(0),
      status: 'idle',
      elapsedTotal: 0,
      workoutId: workout.id,
      workoutName: workout.name,
    }

    this.emitTick()
  }

  // Start from idle, or resume from paused.
  start(): void {
    if (this.state.status === 'running') return
    if (this.state.status === 'complete') return
    if (this.sequence.length === 0) return

    if (this.state.status === 'idle') {
      this.emitPhaseChange(this.state.currentPhase, this.state.nextPhase, this.state.nextPhaseDuration)
    }

    this.state = { ...this.state, status: 'running' }
    this.emitTick()
    this.startInterval()
  }

  pause(): void {
    if (this.state.status !== 'running') return
    this.clearInterval()
    this.state = { ...this.state, status: 'paused' }
    this.emitTick()
  }

  resume(): void {
    if (this.state.status !== 'paused') return
    this.state = { ...this.state, status: 'running' }
    this.emitTick()
    this.startInterval()
  }

  // Toggle between idle/paused and running — called when user taps the circle.
  togglePlayPause(): void {
    if (this.state.status === 'idle' || this.state.status === 'paused') {
      this.start()
    } else if (this.state.status === 'running') {
      this.pause()
    }
  }

  skipToNextStep(): void {
    if (this.state.status === 'complete') return
    if (this.sequence.length === 0) return

    const nextStepIndex = this.currentStepIndex + 1
    if (nextStepIndex < this.sequence.length) {
      this.moveToStep(nextStepIndex)
      return
    }

    this.completeWorkout(this.state.elapsedTotal)
  }

  stop(): void {
    this.clearInterval()
    this.state = this.makeIdleState()
    this.sequence = []
    this.currentStepIndex = 0
  }

  /**
   * Sync the engine to a position returned by the background timer service.
   * Called when the app returns to the foreground mid-workout.
   */
  jumpToPosition(
    stepIndex: number,
    countdown: number,
    status: TimerState['status'] = 'running',
    elapsedTotal: number = this.state.elapsedTotal
  ): void {
    if (this.sequence.length === 0) return
    const clampedStep = Math.min(stepIndex, this.sequence.length - 1)

    this.clearInterval()
    this.currentStepIndex = clampedStep

    const base = this.stateFromStep(clampedStep)
    this.state = {
      ...this.state,
      ...base,
      countdown,
      status,
      elapsedTotal,
    }

    if (status === 'complete') {
      this.state = {
        ...this.state,
        countdown: 0,
        nextPhase: null,
        nextPhaseDuration: 0,
      }
    }

    this.emitTick()
    if (status === 'running') {
      this.startInterval()
    } else if (status === 'complete') {
      this.emitComplete()
    }
  }

  getState(): TimerState {
    return { ...this.state }
  }

  onTick(listener: TickListener): () => void {
    this.tickListeners.add(listener)
    return () => this.tickListeners.delete(listener)
  }

  onPhaseChange(listener: PhaseChangeListener): () => void {
    this.phaseChangeListeners.add(listener)
    return () => this.phaseChangeListeners.delete(listener)
  }

  onComplete(listener: CompleteListener): () => void {
    this.completeListeners.add(listener)
    return () => this.completeListeners.delete(listener)
  }

  private startInterval(): void {
    this.tickStartedAt = Date.now()
    this.expectedTick = this.tickStartedAt + 1000

    this.intervalId = setInterval(() => {
      this.tick()
    }, 1000)
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    if (this.state.status !== 'running') return

    const newCountdown = this.state.countdown - 1
    const newElapsed = this.state.elapsedTotal + 1

    if (newCountdown > 0) {
      this.state = { ...this.state, countdown: newCountdown, elapsedTotal: newElapsed }
      this.emitTick()
      return
    }

    // Phase ended — move to next
    const nextStepIndex = this.currentStepIndex + 1

    if (nextStepIndex >= this.sequence.length) {
      this.completeWorkout(newElapsed)
      return
    }

    this.state = { ...this.state, elapsedTotal: newElapsed }
    this.moveToStep(nextStepIndex)
  }

  private emitTick(): void {
    const snapshot = { ...this.state }
    this.tickListeners.forEach(l => l(snapshot))
  }

  private emitPhaseChange(phase: PhaseType, next: PhaseType | null, nextDuration: number): void {
    this.phaseChangeListeners.forEach(l => l(phase, next, nextDuration))
  }

  private emitComplete(): void {
    this.completeListeners.forEach(l => l())
  }
}

// Singleton — one timer engine for the whole app
export const timerEngine = new TimerEngine()
