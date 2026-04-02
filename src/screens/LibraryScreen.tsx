import React, { useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Modal, Pressable, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { CompositeScreenProps } from '@react-navigation/native'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

import { RootStackParamList, TabParamList } from '../navigation/types'
import { Workout } from '../types'
import {
  getWorkouts, getUserWorkouts, getFavourites, toggleFavourite,
  deleteWorkout, getHistory,
} from '../data/storage'
import { deleteWorkoutFromCloud } from '../data/syncService'
import WorkoutCard from '../components/WorkoutCard'
import InlineAdCard from '../components/InlineAdCard'
import { Spacing, FontSize, FontWeight, useColors } from '../theme'
import { useAuth } from '../context/AuthContext'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>

export default function LibraryScreen({ navigation }: Props) {
  const C = useColors()
  const styles = createStyles(C)
  const { user } = useAuth()
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([])
  const [favouriteIds, setFavouriteIds] = useState<string[]>([])
  const [lastRunLabels, setLastRunLabels] = useState<Record<string, string>>({})
  const [favouriteWorkouts, setFavouriteWorkouts] = useState<Workout[]>([])
  const [menuWorkout, setMenuWorkout] = useState<Workout | null>(null)

  const loadData = useCallback(async () => {
    const [all, user, favs, history] = await Promise.all([
      getWorkouts(),
      getUserWorkouts(),
      getFavourites(),
      getHistory(),
    ])

    setUserWorkouts(user)
    setFavouriteIds(favs)

    const byId = new Map(all.map(workout => [workout.id, workout]))
    setFavouriteWorkouts(
      favs
        .map(id => byId.get(id))
        .filter((workout): workout is Workout => Boolean(workout)),
    )

    const labels: Record<string, string> = {}
    for (const entry of history) {
      if (!labels[entry.workoutId]) {
        labels[entry.workoutId] = relativeTime(entry.timestamp)
      }
    }
    setLastRunLabels(labels)
  }, [])

  useFocusEffect(useCallback(() => { loadData() }, [loadData]))

  const startWorkout = (id: string) =>
    navigation.navigate('ActiveWorkout', { workoutId: id })

  const handleFavourite = async (id: string) => {
    await toggleFavourite(id)
    await loadData()
  }

  const showMoreOptions = (workout: Workout) => setMenuWorkout(workout)

  const handleMoreAction = async (workout: Workout, action: string) => {
    setMenuWorkout(null)

    switch (action) {
      case 'Add to favourites':
      case 'Remove from favourites':
        await handleFavourite(workout.id)
        break

      case 'Duplicate':
        navigation.navigate('WorkoutBuilder', {
          duplicateFromId: workout.id,
          duplicateName: `${workout.name} (copy)`,
        })
        break

      case 'Edit':
        navigation.navigate('WorkoutBuilder', { workoutId: workout.id })
        break

      case 'Delete':
        Alert.alert(
          `Delete "${workout.name}"?`,
          'This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await deleteWorkout(workout.id)
                if (user) deleteWorkoutFromCloud(user.uid, workout.id).catch(console.error)
                await loadData()
              },
            },
          ],
        )
        break
    }
  }

  const nonFavouriteWorkouts = userWorkouts.filter(w => !favouriteIds.includes(w.id))

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
<Text style={styles.title}>Library</Text>
        </View>

        <TouchableOpacity
          style={styles.createCard}
          onPress={() => navigation.navigate('WorkoutBuilder', {})}
          activeOpacity={0.7}
        >
          <View style={styles.createIcon}>
            <Text style={styles.createPlus}>+</Text>
          </View>
          <View style={styles.createInfo}>
            <Text style={styles.createEyebrow}>QUICK START</Text>
            <Text style={styles.createLabel}>New workout</Text>
            <Text style={styles.createSub}>Build a custom session and save it to your library.</Text>
          </View>
        </TouchableOpacity>

        {favouriteWorkouts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVOURITES</Text>
            {favouriteWorkouts.map((workout, index) => (
              <React.Fragment key={workout.id}>
                <WorkoutCard
                  workout={workout}
                  isFavourite={true}
                  lastRunLabel={lastRunLabels[workout.id]}
                  onPress={() => startWorkout(workout.id)}
                  onFavouritePress={() => handleFavourite(workout.id)}
                  onMorePress={() => showMoreOptions(workout)}
                />
                {(index + 1) % 3 === 0 ? <InlineAdCard /> : null}
              </React.Fragment>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY WORKOUTS</Text>
          {nonFavouriteWorkouts.length === 0 && userWorkouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No saved workouts yet.</Text>
              <Text style={styles.emptyText}>Create one from the Create tab and it will appear here.</Text>
            </View>
          ) : (
            nonFavouriteWorkouts.map((workout, index) => (
              <React.Fragment key={workout.id}>
                <WorkoutCard
                  workout={workout}
                  isFavourite={favouriteIds.includes(workout.id)}
                  lastRunLabel={lastRunLabels[workout.id]}
                  onPress={() => startWorkout(workout.id)}
                  onFavouritePress={() => handleFavourite(workout.id)}
                  onMorePress={() => showMoreOptions(workout)}
                />
                {(index + 1) % 3 === 0 ? <InlineAdCard /> : null}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={menuWorkout !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuWorkout(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuWorkout(null)}>
          <Pressable style={styles.menuSheet} onPress={() => {}}>
            {menuWorkout ? (
              <>
                <Text style={styles.menuTitle} numberOfLines={1}>{menuWorkout.name}</Text>
                <Text style={styles.menuSubtitle}>Choose an action</Text>

                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={() => handleMoreAction(
                    menuWorkout,
                    favouriteIds.includes(menuWorkout.id) ? 'Remove from favourites' : 'Add to favourites',
                  )}
                >
                  <Text style={styles.menuRowText}>
                    {favouriteIds.includes(menuWorkout.id) ? 'Remove from favourites' : 'Add to favourites'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={() => handleMoreAction(menuWorkout, 'Duplicate')}
                >
                  <Text style={styles.menuRowText}>Duplicate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={() => handleMoreAction(menuWorkout, 'Edit')}
                >
                  <Text style={styles.menuRowText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuRow, styles.menuRowDanger]}
                  activeOpacity={0.7}
                  onPress={() => handleMoreAction(menuWorkout, 'Delete')}
                >
                  <Text style={styles.menuRowDangerText}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'Last week'
  return `${Math.floor(days / 7)} weeks ago`
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex:            1,
      backgroundColor: C.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingBottom:     Spacing.xxl,
    },
    header: {
      paddingTop:    Spacing.lg,
      paddingBottom: Spacing.md,
      gap:           6,
    },
    brand: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           8,
      marginBottom:  2,
    },
    brandName: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         C.textTertiary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    title: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.bold,
      color:      C.textPrimary,
    },
    createCard: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   C.accent,
      borderRadius:      18,
      paddingVertical:   Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginBottom:      Spacing.xl,
      gap:               Spacing.md,
      shadowColor:       '#000000',
      shadowOpacity:     0.12,
      shadowRadius:      16,
      shadowOffset:      { width: 0, height: 10 },
      elevation:         4,
    },
    createIcon: {
      width:           56,
      height:          56,
      borderRadius:    28,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems:      'center',
      justifyContent:  'center',
    },
    createPlus: {
      fontSize:   30,
      fontWeight: FontWeight.bold,
      color:      C.accentText,
      lineHeight: 32,
    },
    createInfo: {
      flex: 1,
      gap:  4,
    },
    createEyebrow: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         `${C.accentText}B3`,
      letterSpacing: 1.4,
    },
    createLabel: {
      fontSize:   FontSize.xl,
      fontWeight: FontWeight.bold,
      color:      C.accentText,
    },
    createSub: {
      fontSize:   FontSize.sm,
      color:      `${C.accentText}CC`,
      lineHeight: 18,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         C.textSecondary,
      letterSpacing: 1.5,
      marginBottom:  Spacing.sm,
    },
    emptyCard: {
      backgroundColor: C.bgCard,
      borderRadius:    12,
      padding:         Spacing.lg,
      gap:             Spacing.xs,
    },
    emptyTitle: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    emptyText: {
      fontSize:   FontSize.sm,
      color:      C.textSecondary,
      lineHeight: 20,
    },
    menuBackdrop: {
      flex:            1,
      backgroundColor: 'rgba(0,0,0,0.18)',
      justifyContent:  'flex-end',
      padding:         Spacing.md,
    },
    menuSheet: {
      backgroundColor: C.bgCard,
      borderRadius:    18,
      paddingTop:      Spacing.md,
      paddingBottom:   Spacing.sm,
      overflow:        'hidden',
      borderWidth:     1,
      borderColor:     C.border,
    },
    menuTitle: {
      fontSize:          FontSize.md,
      fontWeight:        FontWeight.semibold,
      color:             C.textPrimary,
      paddingHorizontal: Spacing.md,
    },
    menuSubtitle: {
      fontSize:          FontSize.sm,
      color:             C.textSecondary,
      paddingHorizontal: Spacing.md,
      paddingTop:        2,
      paddingBottom:     Spacing.sm,
    },
    menuRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical:   14,
    },
    menuRowDanger: {
      borderTopWidth: 1,
      borderTopColor: C.border,
      marginTop:      Spacing.xs,
    },
    menuRowText: {
      fontSize:   FontSize.md,
      color:      C.textPrimary,
      fontWeight: FontWeight.medium,
    },
    menuRowDangerText: {
      fontSize:   FontSize.md,
      color:      C.danger,
      fontWeight: FontWeight.medium,
    },
  })
}
