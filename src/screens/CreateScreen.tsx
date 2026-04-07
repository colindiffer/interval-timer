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
import InlineAdCard from '../components/InlineAdCard'
import { Spacing, FontSize, FontWeight, useColors } from '../theme'
import { formatRelativeDate, t } from '../i18n'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Create'>,
  NativeStackScreenProps<RootStackParamList>
>

export default function CreateScreen({ navigation }: Props) {
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
          <Text style={styles.title}>{t('nav.create')}</Text>
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
            <Text style={styles.createEyebrow}>{t('common.quickStart')}</Text>
            <Text style={styles.createLabel}>{t('common.newWorkout')}</Text>
            <Text style={styles.createSub}>{t('common.buildCustomSession')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.presets')}</Text>
          {presets.map((workout, index) => (
            <React.Fragment key={workout.id}>
              <WorkoutCard
                workout={workout}
                isFavourite={favouriteIds.includes(workout.id)}
                lastRunLabel={lastRunLabels[workout.id]}
                iconVariant='plus'
                onPress={() => navigation.navigate('WorkoutBuilder', { duplicateFromId: workout.id })}
                onFavouritePress={() => handleFavourite(workout.id)}
              />
              {(index + 1) % 3 === 0 ? <InlineAdCard /> : null}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function relativeTime(timestamp: number): string {
  return formatRelativeDate(timestamp)
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
  })
}
