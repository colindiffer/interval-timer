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
import { HistoryEntry } from '../types'
import { getHistory } from '../data/storage'
import InlineAdCard from '../components/InlineAdCard'
import { Spacing, FontSize, FontWeight, useColors } from '../theme'

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'History'>,
  NativeStackScreenProps<RootStackParamList>
>

interface GroupedHistory {
  label: string
  entries: HistoryEntry[]
}

function groupByWeek(entries: HistoryEntry[]): GroupedHistory[] {
  const startOfToday    = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const startOfThisWeek = new Date(startOfToday); startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfLastWeek = new Date(startOfThisWeek); startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

  const groups: Record<string, HistoryEntry[]> = {}

  for (const entry of entries) {
    const d = new Date(entry.timestamp)
    let label: string
    if (d >= startOfThisWeek) {
      label = 'THIS WEEK'
    } else if (d >= startOfLastWeek) {
      label = 'LAST WEEK'
    } else {
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      label = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' week'
    }
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }

  return Object.entries(groups).map(([label, entries]) => ({ label, entries }))
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const diffDays = Math.floor((Date.now() - ts) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m} min`
}

export default function HistoryScreen({ navigation }: Props) {
  const C = useColors()
  const styles = createStyles(C)
  const [groups, setGroups] = useState<GroupedHistory[]>([])
  const [empty, setEmpty]   = useState(false)

  useFocusEffect(useCallback(() => {
    getHistory().then(h => {
      setEmpty(h.length === 0)
      setGroups(groupByWeek(h))
    })
  }, []))

  const QuickStart = (
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
  )

  if (empty) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>History</Text>
          </View>
          {QuickStart}
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts yet.</Text>
            <Text style={styles.emptySubtext}>Your recent sessions will appear here.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>

        {QuickStart}

        {groups.map(group => (
          <View key={group.label} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.label}</Text>
            {group.entries.map((entry, index) => (
              <React.Fragment key={entry.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => navigation.navigate('ActiveWorkout', { workoutId: entry.workoutId })}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowInfo}>
                    {entry.completed ? (
                      <Text style={styles.completedLabel}>Completed</Text>
                    ) : null}
                    <Text style={styles.rowName} numberOfLines={1}>{entry.workoutName}</Text>
                    <Text style={styles.rowMeta}>
                      {formatDate(entry.timestamp)} · {formatDuration(entry.durationSeconds)}
                      {!entry.completed ? ' · Stopped early' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
                {(index + 1) % 5 === 0 ? <InlineAdCard /> : null}
              </React.Fragment>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex:            1,
      backgroundColor: C.bg,
    },
    scroll: { flex: 1 },
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
    row: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: C.bgCard,
      borderRadius:    12,
      padding:         Spacing.md,
      marginBottom:    Spacing.sm,
      gap:             Spacing.md,
    },
    completedLabel: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         C.accent,
      letterSpacing: 1.2,
    },
    rowInfo: {
      flex: 1,
      gap:  2,
    },
    rowName: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.medium,
      color:      C.textPrimary,
    },
    rowMeta: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
    },
    emptyState: {
      paddingTop:        Spacing.xxl,
      alignItems:        'center',
      gap:               Spacing.xs,
      paddingHorizontal: Spacing.xl,
    },
    emptyText: {
      fontSize:  FontSize.lg,
      color:     C.textPrimary,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize:   FontSize.md,
      color:      C.textSecondary,
      textAlign:  'center',
      lineHeight: 22,
    },
  })
}
