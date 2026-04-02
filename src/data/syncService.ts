import firestore from '@react-native-firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Workout } from '../types'
import { getUserWorkouts, saveWorkout } from './storage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const workoutsCol = (userId: string) =>
  firestore().collection('users').doc(userId).collection('workouts')

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter(item => item !== undefined)
      .map(item => stripUndefinedDeep(item)) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)])
    ) as T
  }

  return value
}

function serializeWorkoutForCloud(workout: Workout): Workout {
  return stripUndefinedDeep(workout)
}

export async function fetchCloudWorkouts(userId: string): Promise<Workout[]> {
  const snap = await workoutsCol(userId).get()
  return snap.docs.map(d => d.data() as Workout)
}

// ─── Single-workout operations (called on every save / delete) ────────────────

/** Upsert one workout to Firestore. Call fire-and-forget after local save. */
export async function saveWorkoutToCloud(userId: string, workout: Workout): Promise<void> {
  await workoutsCol(userId).doc(workout.id).set(serializeWorkoutForCloud(workout))
}

/** Remove one workout from Firestore. Call fire-and-forget after local delete. */
export async function deleteWorkoutFromCloud(userId: string, workoutId: string): Promise<void> {
  await workoutsCol(userId).doc(workoutId).delete()
}

// ─── Manual sync: local → cloud (overwrites cloud) ───────────────────────────

/**
 * Uploads every local user workout to Firestore, completely replacing the
 * cloud copy. Use when the user explicitly taps "Sync".
 */
export async function pushToCloud(userId: string): Promise<void> {
  const localWorkouts = await getUserWorkouts()

  // Delete all existing cloud docs first so removed workouts don't linger
  const existing = await workoutsCol(userId).get()
  const deletes = existing.docs.map(d => d.ref.delete())
  await Promise.all(deletes)

  // Upload current local set
  await Promise.all(
    localWorkouts.map(w => workoutsCol(userId).doc(w.id).set(serializeWorkoutForCloud(w)))
  )
}

// ─── Manual restore: cloud → local (overwrites local) ────────────────────────

/**
 * Downloads all cloud workouts and replaces the local workout store entirely.
 * Use when the user explicitly taps "Restore".
 */
export async function pullFromCloud(userId: string): Promise<void> {
  const cloudWorkouts = await fetchCloudWorkouts(userId)

  // Wipe local user workouts
  await AsyncStorage.setItem('workouts_v1', JSON.stringify([]))

  // Write all cloud workouts locally
  await Promise.all(cloudWorkouts.map(w => saveWorkout(w)))
}

// ─── Auto-merge on sign-in ────────────────────────────────────────────────────

/**
 * Bidirectional merge on sign-in:
 *   1. Upload every local workout → cloud
 *   2. Download cloud workouts absent locally
 */
export async function syncOnSignIn(userId: string): Promise<void> {
  const [localWorkouts, cloudWorkouts] = await Promise.all([
    getUserWorkouts(),
    fetchCloudWorkouts(userId),
  ])

  const localIds = new Set(localWorkouts.map(w => w.id))

  await Promise.all(localWorkouts.map(w => saveWorkoutToCloud(userId, w)))

  const toDownload = cloudWorkouts.filter(w => !localIds.has(w.id))
  await Promise.all(toDownload.map(w => saveWorkout(w)))
}
