import React, { useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { CompositeScreenProps } from '@react-navigation/native'
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

import { RootStackParamList, TabParamList } from '../navigation/types'
import { Workout } from '../types'
import { getWorkouts, getFavourites, toggleFavourite, getHistory } from '../data/storage'
import WorkoutCard from '../components/WorkoutCard'
import AdBanner from '../components/AdBanner'
import { Spacing, FontSize, FontWeight, useColors } from '../theme'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>

export default function HomeScreen({ navigation }: Props) {
  const C = useColors()
  const styles = createStyles(C)
  const [presets, setPresets] = useState<Workout[]>([])
  const [favouriteIds, setFavouriteIds] = useState<string[]>([])
  const [lastRunLabels, setLastRunLabels] = useState<Record<string, string>>({})

  const loadData = useCallback(async () => {
    const [all, favs, history] = await Promise.all([
      getWorkouts(),
      getFavourites(),
      getHistory(),
    ])
    setPresets(all.filter(workout => workout.isPreset))
    setFavouriteIds(favs)

    const labels: Record<string, string> = {}
    for (const entry of history) {
      if (!labels[entry.workoutId]) {
        labels[entry.workoutId] = relativeTime(entry.timestamp)
      }
    }
    setLastRunLabels(labels)
  }, [])

  useFocusEffect(useCallback(() => { loadData() }, [loadData]))

  const handleFavourite = async (id: string) => {
    await toggleFavourite(id)
    await loadData()
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRESETS</Text>
          {presets.map(workout => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              isFavourite={favouriteIds.includes(workout.id)}
              lastRunLabel={lastRunLabels[workout.id]}
              onPress={() => navigation.navigate('WorkoutBuilder', { duplicateFromId: workout.id })}
              onFavouritePress={() => handleFavourite(workout.id)}
            />
          ))}
        </View>
      </ScrollView>

      <AdBanner />
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
    },
    title: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.bold,
      color:      C.textPrimary,
    },
    createCard: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: C.accent,
      borderRadius:    18,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginBottom:    Spacing.xl,
      gap:             Spacing.md,
      shadowColor:     '#000000',
      shadowOpacity:   0.12,
      shadowRadius:    16,
      shadowOffset:    { width: 0, height: 10 },
      elevation:       4,
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
  })
}
