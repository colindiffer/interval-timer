import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Modal, FlatList, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

import { RootStackParamList } from '../navigation/types'
import { Workout, WorkoutInterval, SoundThemeId } from '../types'
import { getWorkouts, saveWorkout, generateId } from '../data/storage'
import { saveWorkoutToCloud } from '../data/syncService'
import { Spacing, Radius, FontSize, FontWeight, useColors, PHASE_COLOR_OPTIONS } from '../theme'
import { cuePlayer } from '../audio/cuePlayer'
import { useAuth } from '../context/AuthContext'
import { t, useI18n } from '../i18n'

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutBuilder'>

function formatTime(seconds: number): string {
  if (seconds === 0) return t('builder.off')
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

function shouldSkipLastRest(form: Partial<Workout>): boolean {
  return form.skipLastRest !== false
}

function getIntervals(form: Partial<Workout>, advancedEnabled: boolean): WorkoutInterval[] {
  if (advancedEnabled && form.intervals?.length) {
    const intervals = form.intervals
    if (shouldSkipLastRest(form)) {
      return intervals.map((interval, index) => ({
        ...interval,
        restDuration: index === intervals.length - 1 ? 0 : interval.restDuration,
      }))
    }
    return intervals
  }

  const reps = form.reps ?? 1
  return Array.from({ length: reps }, (_, index) => ({
    workDuration: form.workDuration ?? 0,
    restDuration: index < reps - 1 || !shouldSkipLastRest(form) ? (form.restDuration ?? 0) : 0,
  }))
}

function totalMinutes(form: Partial<Workout>, advancedEnabled: boolean): number {
  const warmup = form.warmupDuration ?? 0
  const cooldown = form.cooldownDuration ?? 0
  const intervalTotal = getIntervals(form, advancedEnabled)
    .reduce((sum, interval) => sum + interval.workDuration + interval.restDuration, 0)

  return Math.round((warmup + intervalTotal + cooldown) / 60)
}

function roundToFive(seconds: number): number {
  return Math.max(5, Math.round(seconds / 5) * 5)
}


interface TimePickerProps {
  visible: boolean
  label: string
  value: number
  allowOff?: boolean
  onClose: () => void
  onConfirm: (seconds: number) => void
}

const MINUTE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30]
const SECOND_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function TimePicker({ visible, label, value, allowOff, onClose, onConfirm }: TimePickerProps) {
  const C = useColors()
  const pickerStyles = createPickerStyles(C)
  const [minutes, setMinutes] = useState(Math.floor(value / 60))
  const [seconds, setSeconds] = useState(value % 60)

  useEffect(() => {
    setMinutes(Math.floor(value / 60))
    setSeconds(value % 60)
  }, [value, visible])

  const total = minutes * 60 + seconds

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.topBar}>
            <TouchableOpacity onPress={onClose}>
              <Text style={pickerStyles.cancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.title}>{label}</Text>
            <TouchableOpacity onPress={() => onConfirm(total)}>
              <Text style={pickerStyles.confirm}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.columns}>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>{t('builder.minutes')}</Text>
              <FlatList
                data={MINUTE_OPTIONS}
                keyExtractor={String}
                style={pickerStyles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[pickerStyles.option, item === minutes && pickerStyles.selected]}
                    onPress={() => setMinutes(item)}
                  >
                    <Text style={[pickerStyles.optionText, item === minutes && pickerStyles.selectedText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={pickerStyles.col}>
              <Text style={pickerStyles.colLabel}>{t('builder.seconds')}</Text>
              <FlatList
                data={SECOND_OPTIONS}
                keyExtractor={String}
                style={pickerStyles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[pickerStyles.option, item === seconds && pickerStyles.selected]}
                    onPress={() => setSeconds(item)}
                  >
                    <Text style={[pickerStyles.optionText, item === seconds && pickerStyles.selectedText]}>
                      {item.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          {allowOff ? (
            <TouchableOpacity style={pickerStyles.offBtn} onPress={() => onConfirm(0)}>
              <Text style={pickerStyles.offBtnText}>{t('builder.turnOff')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const DEFAULT: Partial<Workout> = {
  name: '',
  warmupDuration: 0,
  workDuration: 120,
  restDuration: 60,
  reps: 8,
  skipLastRest: true,
  cooldownDuration: 0,
}

type PickerField =
  | 'workDuration'
  | 'restDuration'
  | 'warmupDuration'
  | 'cooldownDuration'
  | { type: 'intervalWork'; index: number }
  | { type: 'intervalRest'; index: number }
  | null

export default function WorkoutBuilderScreen({ route, navigation }: Props) {
  useI18n()
  const C = useColors()
  const styles = createStyles(C)
  const { user } = useAuth()
  const { workoutId, duplicateFromId, duplicateName } = route.params ?? {}
  const isEditingExisting = Boolean(workoutId)

  const [form, setForm] = useState<Partial<Workout>>(DEFAULT)
  const [nameError, setNameError] = useState(false)
  const [advancedEnabled, setAdvancedEnabled] = useState(false)
  const [picker, setPicker] = useState<{ field: PickerField }>({ field: null })

  useEffect(() => {
    const load = async () => {
      const all = await getWorkouts()

      if (workoutId) {
        const workout = all.find(item => item.id === workoutId)
        if (workout) {
          setForm({ ...workout })
          setAdvancedEnabled(Boolean(workout.intervals?.length))
        }
        return
      }

      if (duplicateFromId) {
        const workout = all.find(item => item.id === duplicateFromId)
        if (workout) {
          setForm({
            ...workout,
            id: undefined,
            isPreset: false,
            createdAt: Date.now(),
            name: duplicateName ?? workout.name,
          })
          setAdvancedEnabled(Boolean(workout.intervals?.length))
        }
        return
      }

      const userCount = all.filter(item => !item.isPreset).length
      setForm({ ...DEFAULT, name: t('builder.defaultWorkoutName', { count: userCount + 1 }) })
      setAdvancedEnabled(false)
    }

    load()
  }, [workoutId, duplicateFromId, duplicateName])

  const set = (partial: Partial<Workout>) => setForm(current => ({ ...current, ...partial }))

  const updateInterval = (index: number, partial: Partial<WorkoutInterval>) => {
    const current = getIntervals(form, true)
    const next = current.map((interval, currentIndex) => (
      currentIndex === index ? { ...interval, ...partial } : interval
    ))
    set({ intervals: next, reps: next.length, variationLabel: undefined })
  }

  const addInterval = () => {
    const current = getIntervals(form, advancedEnabled)
    const last = current[current.length - 1] ?? { workDuration: form.workDuration ?? 60, restDuration: form.restDuration ?? 60 }
    const next = [...current, { ...last }]
    if (next.length > 1) {
      next[next.length - 2] = { ...next[next.length - 2], restDuration: next[next.length - 2].restDuration || (form.restDuration ?? 60) }
    }
    set({ intervals: next, reps: next.length, variationLabel: undefined })
  }

  const removeInterval = (index: number) => {
    const current = getIntervals(form, true)
    const next = current.filter((_, currentIndex) => currentIndex !== index)
    if (next.length === 0) return
    set({ intervals: next, reps: next.length, variationLabel: undefined })
  }

  const toggleAdvanced = (value: boolean) => {
    setAdvancedEnabled(value)
    if (value) {
      set({
        intervals: getIntervals(form, false),
        reps: getIntervals(form, false).length,
        variationLabel: undefined,
      })
      return
    }

    const intervals = getIntervals(form, true)
    set({
      intervals: undefined,
      reps: intervals.length,
      workDuration: intervals[0]?.workDuration ?? form.workDuration ?? 60,
      restDuration: intervals[0]?.restDuration ?? form.restDuration ?? 60,
      variationLabel: undefined,
    })
  }

  const handleSave = useCallback(async (andStart = false) => {
    if (!form.name?.trim()) {
      setNameError(true)
      return
    }

    const intervals = getIntervals(form, advancedEnabled)
    const workout: Workout = {
      id: isEditingExisting ? workoutId! : generateId(),
      name: form.name.trim(),
      warmupDuration: form.warmupDuration ?? 0,
      workDuration: intervals[0]?.workDuration ?? form.workDuration ?? 60,
      restDuration: intervals[0]?.restDuration ?? form.restDuration ?? 60,
      reps: intervals.length,
      skipLastRest: shouldSkipLastRest(form),
      cooldownDuration: form.cooldownDuration ?? 0,
      intervals: advancedEnabled ? intervals : undefined,
      variationLabel: advancedEnabled ? form.variationLabel : undefined,
      workColor: form.workColor,
      restColor: form.restColor,
      soundTheme: form.soundTheme,
      voiceCues: form.voiceCues,
      isPreset: false,
      createdAt: isEditingExisting ? (form.createdAt ?? Date.now()) : Date.now(),
    }

    await saveWorkout(workout)
    if (user) saveWorkoutToCloud(user.uid, workout).catch(console.error)

    if (andStart) {
      navigation.replace('ActiveWorkout', { workoutId: workout.id })
    } else {
      navigation.navigate('Tabs', { screen: 'Library' })
    }
  }, [advancedEnabled, form, isEditingExisting, navigation, workoutId])

  const openPicker = (field: PickerField) => setPicker({ field })
  const closePicker = () => setPicker({ field: null })

  const confirmPicker = (seconds: number) => {
    const field = picker.field
    if (!field) return

    if (typeof field === 'string') {
      set({ [field]: seconds })
    } else if (field.type === 'intervalWork') {
      updateInterval(field.index, { workDuration: seconds })
    } else if (field.type === 'intervalRest') {
      updateInterval(field.index, { restDuration: seconds })
    }

    closePicker()
  }

  const pickerValue = (() => {
    const field = picker.field
    if (!field) return 0
    if (typeof field === 'string') {
      return (form[field as keyof Workout] as number) ?? 0
    }

    const intervals = getIntervals(form, true)
    const interval = intervals[field.index]
    if (!interval) return 0
    return field.type === 'intervalWork' ? interval.workDuration : interval.restDuration
  })()

  const pickerLabel = (() => {
    const field = picker.field
    if (!field) return ''
    if (field === 'workDuration') return t('builder.workInterval')
    if (field === 'restDuration') return t('builder.restInterval')
    if (field === 'warmupDuration') return t('builder.warmup')
    if (field === 'cooldownDuration') return t('builder.cooldown')
    return field.type === 'intervalWork'
      ? t('builder.setWorkLabel', { count: field.index + 1 })
      : t('builder.setRestLabel', { count: field.index + 1 })
  })()

  const allowPickerOff = (() => {
    const field = picker.field
    if (!field) return false

    return field === 'warmupDuration'
      || field === 'cooldownDuration'
      || field === 'restDuration'
      || (typeof field === 'object' && field.type === 'intervalRest')
  })()

  const total = totalMinutes(form, advancedEnabled)
  const previewIntervals = getIntervals(form, advancedEnabled)

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.navCancel}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isEditingExisting || duplicateFromId ? t('builder.editWorkout') : t('builder.newWorkout')}</Text>
          <TouchableOpacity onPress={() => handleSave(false)}>
            <Text style={styles.navSave}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t('builder.name')}</Text>
        <TextInput
          style={[styles.nameInput, nameError && styles.nameInputError]}
          value={form.name}
          onChangeText={value => { set({ name: value }); setNameError(false) }}
          placeholder={t('builder.workoutName')}
          placeholderTextColor={C.textTertiary}
          maxLength={40}
          returnKeyType="done"
          selectTextOnFocus
        />

        <Text style={styles.label}>{t('builder.workIntervalLabel')}</Text>
        <TouchableOpacity style={styles.timeRow} onPress={() => openPicker('workDuration')}>
          <Text style={styles.timeValue}>{formatTime(form.workDuration ?? 0)}</Text>
          <Text style={styles.timeChevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('builder.restIntervalLabel')}</Text>
        <TouchableOpacity style={styles.timeRow} onPress={() => openPicker('restDuration')}>
          <Text style={styles.timeValue}>{formatTime(form.restDuration ?? 0)}</Text>
          <Text style={styles.timeChevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('builder.repeats')}</Text>
        <View style={styles.repRow}>
          <TouchableOpacity
            style={styles.repBtn}
            onPress={() => set({ reps: Math.max(1, (form.reps ?? 1) - 1) })}
            disabled={advancedEnabled}
          >
            <Text style={[styles.repBtnText, advancedEnabled && styles.repBtnDisabled]}>−</Text>
          </TouchableOpacity>
          <Text style={styles.repValue}>{advancedEnabled ? previewIntervals.length : (form.reps ?? 1)}</Text>
          <TouchableOpacity
            style={styles.repBtn}
            onPress={() => set({ reps: Math.min(99, (form.reps ?? 1) + 1) })}
            disabled={advancedEnabled}
          >
            <Text style={[styles.repBtnText, advancedEnabled && styles.repBtnDisabled]}>+</Text>
          </TouchableOpacity>
        </View>
        {advancedEnabled ? (
          <Text style={styles.helperText}>{t('builder.advancedRepsHelp')}</Text>
        ) : null}

        <Text style={styles.label}>{t('builder.warmupOptional')}</Text>
        <TouchableOpacity style={styles.timeRow} onPress={() => openPicker('warmupDuration')}>
          <Text style={styles.timeValue}>{formatTime(form.warmupDuration ?? 0)}</Text>
          <Text style={styles.timeChevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('builder.cooldownOptional')}</Text>
        <TouchableOpacity style={styles.timeRow} onPress={() => openPicker('cooldownDuration')}>
          <Text style={styles.timeValue}>{formatTime(form.cooldownDuration ?? 0)}</Text>
          <Text style={styles.timeChevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('builder.restOptions')}</Text>
        <View style={styles.advancedCard}>
          <View style={styles.advancedHeader}>
            <View style={styles.advancedText}>
              <Text style={styles.advancedTitle}>{t('builder.skipLastRest')}</Text>
              <Text style={styles.advancedSubtext}>{t('builder.skipLastRestHelp')}</Text>
            </View>
            <Switch
              value={shouldSkipLastRest(form)}
              onValueChange={value => set({ skipLastRest: value })}
              trackColor={{ false: C.bgCardAlt, true: C.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={C.bgCardAlt}
            />
          </View>
        </View>

        <Text style={styles.label}>{t('builder.advancedSettings')}</Text>
        <View style={styles.advancedCard}>
          <View style={styles.advancedHeader}>
            <View style={styles.advancedText}>
              <Text style={styles.advancedTitle}>{t('builder.advancedSettingsTitle')}</Text>
              <Text style={styles.advancedSubtext}>{t('builder.advancedSettingsHelp')}</Text>
            </View>
            <Switch
              value={advancedEnabled}
              onValueChange={toggleAdvanced}
              trackColor={{ false: C.bgCardAlt, true: C.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={C.bgCardAlt}
            />
          </View>

          {advancedEnabled ? (
            <View style={styles.advancedList}>
              {previewIntervals.map((interval, index) => (
                <View key={index} style={styles.intervalCard}>
                  <View style={styles.intervalTopRow}>
                    <Text style={styles.intervalTitle}>{t('builder.setLabel', { count: index + 1 })}</Text>
                    {previewIntervals.length > 1 ? (
                      <TouchableOpacity onPress={() => removeInterval(index)} activeOpacity={0.7}>
                        <Text style={styles.removeText}>{t('builder.remove')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.intervalRow}
                    onPress={() => openPicker({ type: 'intervalWork', index })}
                  >
                    <Text style={styles.intervalLabel}>{t('common.work')}</Text>
                    <Text style={styles.intervalValue}>{formatTime(interval.workDuration)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.intervalRow}
                    onPress={() => openPicker({ type: 'intervalRest', index })}
                  >
                    <Text style={styles.intervalLabel}>{t('common.rest')}</Text>
                    <Text style={styles.intervalValue}>{formatTime(interval.restDuration)}</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addSetBtn} onPress={addInterval}>
                <Text style={styles.addSetText}>{t('builder.addSet')}</Text>
              </TouchableOpacity>

              <View style={styles.colorSection}>
                <Text style={styles.colorSectionLabel}>{t('builder.workColor')}</Text>
                <View style={styles.colorSwatches}>
                  {PHASE_COLOR_OPTIONS.map(color => {
                    const active = (form.workColor ?? null) === color
                    return (
                      <TouchableOpacity
                        key={`work-${color}`}
                        style={[styles.colorSwatch, { backgroundColor: color }, active && styles.colorSwatchActive]}
                        onPress={() => set({ workColor: active ? undefined : color })}
                        activeOpacity={0.8}
                      >
                        {active ? <View style={styles.colorSwatchInner} /> : null}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.colorSection}>
                <Text style={styles.colorSectionLabel}>{t('builder.restColor')}</Text>
                <View style={styles.colorSwatches}>
                  {PHASE_COLOR_OPTIONS.map(color => {
                    const active = (form.restColor ?? null) === color
                    return (
                      <TouchableOpacity
                        key={`rest-${color}`}
                        style={[styles.colorSwatch, { backgroundColor: color }, active && styles.colorSwatchActive]}
                        onPress={() => set({ restColor: active ? undefined : color })}
                        activeOpacity={0.8}
                      >
                        {active ? <View style={styles.colorSwatchInner} /> : null}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.soundSection}>
                <Text style={styles.colorSectionLabel}>{t('builder.soundOverride')}</Text>
                <View style={styles.soundPills}>
                  {([null, 'beep', 'bell', 'gong', 'whistle'] as const).map(theme => {
                    const active = (form.soundTheme ?? null) === theme
                    const label = theme === null ? t('common.default') : t(`settings.soundTheme.${theme}`)
                    return (
                      <TouchableOpacity
                        key={label}
                        style={[styles.soundPill, active && styles.soundPillActive]}
                        onPress={() => {
                          set({ soundTheme: theme ?? undefined })
                          if (theme) cuePlayer.play(theme)
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.soundPillText, active && styles.soundPillTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.voiceRow}>
                <View style={styles.advancedText}>
                  <Text style={styles.colorSectionLabel}>{t('builder.voiceCues')}</Text>
                  <Text style={styles.advancedSubtext}>{t('builder.voiceCuesHelp')}</Text>
                </View>
                <Switch
                  value={form.voiceCues ?? false}
                  onValueChange={value => set({ voiceCues: value })}
                  trackColor={{ false: C.bgCardAlt, true: C.accent }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={C.bgCardAlt}
                />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewTitle}>{t('builder.preview')}</Text>
          <Text style={styles.previewLine}>
            {t('builder.warmupPreview', { value: form.warmupDuration ? formatTime(form.warmupDuration) : '—' })}
          </Text>
          {advancedEnabled ? (
            <>
              <Text style={styles.previewLine}>{t('builder.customSetsPreview', { count: previewIntervals.length })}</Text>
              <Text style={styles.previewLine}>
                {t('builder.firstSetPreview', {
                  work: formatTime(previewIntervals[0]?.workDuration ?? 0),
                  rest: formatTime(previewIntervals[0]?.restDuration ?? 0),
                })}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.previewLine}>
                {t('builder.workRestPreview', {
                  work: formatTime(form.workDuration ?? 0),
                  rest: formatTime(form.restDuration ?? 0),
                })}
              </Text>
              <Text style={styles.previewLine}>
                {t('builder.repsPreview', { count: form.reps ?? 1 })}
              </Text>
            </>
          )}
          {form.cooldownDuration ? (
            <Text style={styles.previewLine}>{t('builder.cooldownPreview', { value: formatTime(form.cooldownDuration) })}</Text>
          ) : null}
          <Text style={[styles.previewLine, styles.previewTotal]}>{t('builder.totalPreview', { total })}</Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={() => handleSave(true)}>
          <Text style={styles.startBtnText}>{t('builder.startNow')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimePicker
        visible={picker.field !== null}
        label={pickerLabel}
        value={pickerValue}
        allowOff={allowPickerOff}
        onClose={closePicker}
        onConfirm={confirmPicker}
      />
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
    navBar: {
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'space-between',
      paddingVertical: Spacing.md,
      marginBottom:    Spacing.lg,
    },
    navCancel: {
      fontSize: FontSize.md,
      color:    C.textSecondary,
    },
    navTitle: {
      fontSize:   FontSize.lg,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    navSave: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.accent,
    },
    label: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         C.textSecondary,
      letterSpacing: 1.5,
      marginBottom:  Spacing.sm,
      marginTop:     Spacing.lg,
    },
    nameInput: {
      backgroundColor:   C.bgCard,
      borderRadius:      Radius.md,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.md,
      fontSize:          FontSize.md,
      color:             C.textPrimary,
      borderWidth:       1,
      borderColor:       'transparent',
    },
    nameInputError: {
      borderColor: C.danger,
    },
    timeRow: {
      backgroundColor:   C.bgCard,
      borderRadius:      Radius.md,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.md,
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
    },
    timeValue: {
      fontSize:   FontSize.md,
      color:      C.textPrimary,
      fontWeight: FontWeight.medium,
    },
    timeChevron: {
      fontSize: FontSize.xl,
      color:    C.textTertiary,
    },
    repRow: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             Spacing.xl,
      justifyContent:  'center',
      backgroundColor: C.bgCard,
      borderRadius:    Radius.md,
      paddingVertical: Spacing.md,
    },
    repBtn: {
      width:           44,
      height:          44,
      borderRadius:    22,
      backgroundColor: C.bgCardAlt,
      alignItems:      'center',
      justifyContent:  'center',
    },
    repBtnText: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.regular,
      color:      C.textPrimary,
      lineHeight: 28,
    },
    repBtnDisabled: {
      color: C.textTertiary,
    },
    repValue: {
      fontSize:   FontSize.xxl,
      fontWeight: FontWeight.bold,
      color:      C.textPrimary,
      minWidth:   40,
      textAlign:  'center',
    },
    helperText: {
      fontSize:   FontSize.sm,
      color:      C.textSecondary,
      marginTop:  Spacing.sm,
      lineHeight: 20,
    },
    advancedCard: {
      backgroundColor: C.bgCard,
      borderRadius:    Radius.md,
      padding:         Spacing.md,
      gap:             Spacing.md,
    },
    advancedHeader: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            Spacing.md,
    },
    advancedText: {
      flex: 1,
      gap:  2,
    },
    advancedTitle: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    advancedSubtext: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
      lineHeight: 20,
    },
    advancedList: {
      gap: Spacing.sm,
    },
    intervalCard: {
      backgroundColor: C.bgCardAlt,
      borderRadius:    Radius.md,
      padding:         Spacing.md,
      gap:             Spacing.sm,
    },
    intervalTopRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    intervalTitle: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    removeText: {
      fontSize: FontSize.sm,
      color:    C.danger,
    },
    intervalRow: {
      backgroundColor: C.bgCard,
      borderRadius:    Radius.sm,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md,
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'space-between',
    },
    intervalLabel: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
    },
    intervalValue: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.medium,
      color:      C.textPrimary,
    },
    addSetBtn: {
      alignItems:      'center',
      justifyContent:  'center',
      borderRadius:    Radius.md,
      borderWidth:     1,
      borderColor:     C.border,
      paddingVertical: Spacing.md,
      backgroundColor: C.bg,
    },
    addSetText: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.accent,
    },
    colorSection: {
      gap: Spacing.xs,
    },
    colorSectionLabel: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.medium,
      color:      C.textSecondary,
    },
    colorSwatches: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           Spacing.sm,
    },
    colorSwatch: {
      width:        32,
      height:       32,
      borderRadius: 16,
      alignItems:   'center',
      justifyContent: 'center',
    },
    colorSwatchActive: {
      borderWidth: 2,
      borderColor: C.textPrimary,
    },
    colorSwatchInner: {
      width:        10,
      height:       10,
      borderRadius: 5,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    soundSection: {
      gap: Spacing.xs,
    },
    soundPills: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           Spacing.sm,
    },
    soundPill: {
      paddingHorizontal: Spacing.md,
      paddingVertical:   Spacing.sm,
      borderRadius:      Radius.pill,
      borderWidth:       1,
      borderColor:       C.border,
      backgroundColor:   C.bg,
    },
    soundPillActive: {
      backgroundColor: C.accent,
      borderColor:     C.accent,
    },
    soundPillText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.medium,
      color:      C.textSecondary,
    },
    soundPillTextActive: {
      color: C.accentText,
    },
    voiceRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            Spacing.md,
    },
    preview: {
      backgroundColor: C.bgCard,
      borderRadius:    Radius.md,
      padding:         Spacing.md,
      marginTop:       Spacing.xxl,
      gap:             Spacing.xs,
    },
    previewTitle: {
      fontSize:      FontSize.xs,
      fontWeight:    FontWeight.semibold,
      color:         C.textSecondary,
      letterSpacing: 1.5,
      marginBottom:  Spacing.xs,
    },
    previewLine: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
    },
    previewTotal: {
      color:      C.textPrimary,
      fontWeight: FontWeight.medium,
      marginTop:  Spacing.xs,
    },
    startBtn: {
      backgroundColor: C.accent,
      borderRadius:    Radius.lg,
      paddingVertical: Spacing.md + 2,
      alignItems:      'center',
      marginTop:       Spacing.xl,
    },
    startBtnText: {
      fontSize:   FontSize.lg,
      fontWeight: FontWeight.semibold,
      color:      C.accentText,
    },
  })
}

function createPickerStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    overlay: {
      flex:            1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent:  'flex-end',
    },
    sheet: {
      backgroundColor:     C.bgCard,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingBottom:       Spacing.xxl,
    },
    topBar: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      padding:           Spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: C.border,
    },
    cancel: {
      fontSize: FontSize.md,
      color:    C.textSecondary,
    },
    title: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    confirm: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.accent,
    },
    columns: {
      flexDirection:     'row',
      paddingHorizontal: Spacing.xl,
      paddingTop:        Spacing.md,
      gap:               Spacing.lg,
    },
    col: {
      flex: 1,
      alignItems: 'center',
    },
    colLabel: {
      fontSize:      FontSize.xs,
      color:         C.textSecondary,
      letterSpacing: 1,
      marginBottom:  Spacing.sm,
    },
    list: {
      maxHeight: 200,
      width:     '100%',
    },
    option: {
      paddingVertical: 10,
      alignItems:      'center',
      borderRadius:    8,
      marginBottom:    2,
    },
    selected: {
      backgroundColor: `${C.accent}22`,
    },
    optionText: {
      fontSize:   FontSize.lg,
      color:      C.textSecondary,
      fontWeight: FontWeight.regular,
    },
    selectedText: {
      color:      C.accent,
      fontWeight: FontWeight.semibold,
    },
    offBtn: {
      margin:          Spacing.lg,
      paddingVertical: Spacing.md,
      alignItems:      'center',
      borderRadius:    Radius.md,
      backgroundColor: C.bgCardAlt,
    },
    offBtnText: {
      fontSize:   FontSize.md,
      color:      C.danger,
      fontWeight: FontWeight.medium,
    },
  })
}
