import React, { useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import { AppSettings, PhaseColorKey, SoundThemeId } from '../types'
import { DEFAULT_SETTINGS, getSettings, saveSettings } from '../data/storage'
import {
  DEFAULT_PHASE_COLORS,
  FontSize,
  FontWeight,
  PHASE_COLOR_OPTIONS,
  Radius,
  Spacing,
  useColors,
  useTheme,
} from '../theme'
import { cuePlayer } from '../audio/cuePlayer'
import AdBanner from '../components/AdBanner'

const APP_VERSION = '1.0.0'
const FINAL_COUNT_OPTIONS = [0, 3, 5]
const SOUND_THEMES: Array<{ id: SoundThemeId; label: string; note: string }> = [
  { id: 'beep',    label: 'Beep',    note: 'Short electronic beep.' },
  { id: 'bell',    label: 'Bell',    note: 'Clear achievement bell.' },
  { id: 'gong',    label: 'Gong',    note: 'Deep resonant gong.' },
  { id: 'whistle', label: 'Whistle', note: 'Sharp sports whistle.' },
]
const PHASE_ROWS: Array<{ key: PhaseColorKey; label: string; value: string }> = [
  { key: 'warmup', label: 'Prepare', value: 'Warmup' },
  { key: 'work', label: 'Work', value: 'Run' },
  { key: 'rest', label: 'Rest', value: 'Recover' },
  { key: 'cooldown', label: 'Cooldown', value: 'Easy out' },
  { key: 'complete', label: 'Finish', value: 'Complete' },
]

export default function SettingsScreen() {
  const C = useColors()
  const styles = createStyles(C)
  const { darkModeSetting, setDarkMode } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  useFocusEffect(useCallback(() => {
    getSettings().then(setSettings)
  }, []))

  const update = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
    if (partial.darkMode !== undefined) {
      setDarkMode(partial.darkMode)
    }
    await saveSettings(partial)
  }

  const audioMode = settings.voiceCues ? 'Voice' : settings.soundCues ? 'Sound' : 'None'

  const setAudioMode = (mode: string) => {
    if (mode === 'Sound') update({ soundCues: true,  voiceCues: false, countdownBeeps: true  })
    if (mode === 'Voice') update({ soundCues: false, voiceCues: true,  countdownBeeps: true  })
    if (mode === 'None')  update({ soundCues: false, voiceCues: false, countdownBeeps: false })
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Keep the familiar controls. Add the extra ones around them.</Text>
        </View>

        <SectionHeader title="Theme" subtitle="Choose the phone appearance first." />
        <View style={styles.panel}>
          <PillSelector
            options={['Light', 'Dark', 'System']}
            selected={darkModeSetting === false ? 'Light' : darkModeSetting === true ? 'Dark' : 'System'}
            onSelect={option => {
              if (option === 'Light') update({ darkMode: false })
              if (option === 'Dark') update({ darkMode: true })
              if (option === 'System') update({ darkMode: 'system' })
            }}
          />
          <Divider />
          <InfoRow
            label="Current mode"
            value={darkModeSetting === false ? 'Light' : darkModeSetting === true ? 'Dark' : 'System'}
          />
        </View>

        <SectionHeader title="Sound" subtitle="Sound and voice are mutually exclusive." />
        <View style={styles.panel}>
          <PillSelector
            options={['Sound', 'Voice', 'None']}
            selected={audioMode}
            onSelect={setAudioMode}
          />
          {audioMode === 'Sound' ? (
            <>
              <Divider />
              <SoundThemeSelector
                selected={settings.soundTheme}
                onSelect={async theme => {
                  await update({ soundTheme: theme })
                  cuePlayer.play(theme)
                }}
              />
            </>
          ) : null}
          {audioMode !== 'None' ? (
            <>
              <Divider />
              <StepperRow
                label="Final count"
                value={settings.finalCountdown}
                valueLabel={settings.finalCountdown === 0 ? 'Off' : `${settings.finalCountdown}`}
                onDecrease={() => {
                  const index = FINAL_COUNT_OPTIONS.indexOf(settings.finalCountdown)
                  const next = FINAL_COUNT_OPTIONS[Math.max(0, index - 1)]
                  update({ finalCountdown: next })
                }}
                onIncrease={() => {
                  const index = FINAL_COUNT_OPTIONS.indexOf(settings.finalCountdown)
                  const next = FINAL_COUNT_OPTIONS[Math.min(FINAL_COUNT_OPTIONS.length - 1, index + 1)]
                  update({ finalCountdown: next })
                }}
              />
            </>
          ) : null}
        </View>

        <SectionHeader title="Colors" subtitle="The timer’s visual language at a glance." />
        <View style={styles.panel}>
          {PHASE_ROWS.map((row, index) => (
            <React.Fragment key={row.key}>
              <ColorPickerRow
                label={row.label}
                value={row.value}
                selected={settings.phaseColors?.[row.key] ?? DEFAULT_PHASE_COLORS[row.key]}
                onSelect={color => update({
                  phaseColors: {
                    ...settings.phaseColors,
                    [row.key]: color,
                  },
                })}
              />
              {index < PHASE_ROWS.length - 1 ? <Divider /> : null}
            </React.Fragment>
          ))}
        </View>

        <SectionHeader title="Miscellaneous" subtitle="Everything else that belongs in settings." />
        <View style={styles.panel}>
          <LinkRow label="Banner ads" note="Placeholder only" />
          <Divider />
          <LinkRow label="Rate the app" />
          <Divider />
          <LinkRow label="Send feedback" />
          <Divider />
          <LinkRow label="Privacy policy" />
          <Divider />
          <InfoRow label="Version" value={APP_VERSION} />
        </View>
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function LinkRow({ label, note }: { label: string; note?: string }) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.linkRight}>
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

function SwitchRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string
  description?: string
  value: boolean
  onToggle: (value: boolean) => void
}) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.bgCardAlt, true: C.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={C.bgCardAlt}
      />
    </View>
  )
}

function StepperRow({
  label,
  value,
  valueLabel,
  onDecrease,
  onIncrease,
}: {
  label: string
  value: number
  valueLabel: string
  onDecrease: () => void
  onIncrease: () => void
}) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepperBtn} onPress={onDecrease} disabled={value === FINAL_COUNT_OPTIONS[0]}>
          <Text style={[styles.stepperBtnText, value === FINAL_COUNT_OPTIONS[0] && styles.stepperDisabled]}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepperValueWrap}>
          <Text style={styles.stepperValue}>{valueLabel}</Text>
        </View>
        <TouchableOpacity style={styles.stepperBtn} onPress={onIncrease} disabled={value === FINAL_COUNT_OPTIONS[FINAL_COUNT_OPTIONS.length - 1]}>
          <Text style={[styles.stepperBtnText, value === FINAL_COUNT_OPTIONS[FINAL_COUNT_OPTIONS.length - 1] && styles.stepperDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function ColorPickerRow({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string
  value: string
  selected: string
  onSelect: (color: string) => void
}) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.colorRow}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{value}</Text>
      </View>
      <View style={styles.colorOptions}>
        {PHASE_COLOR_OPTIONS.map(color => {
          const active = color === selected
          return (
            <TouchableOpacity
              key={`${label}-${color}`}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                active && styles.colorOptionActive,
              ]}
              onPress={() => onSelect(color)}
              activeOpacity={0.8}
            >
              {active ? <View style={styles.colorOptionInner} /> : null}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function SoundThemeSelector({
  selected,
  onSelect,
}: {
  selected: SoundThemeId
  onSelect: (theme: SoundThemeId) => void | Promise<void>
}) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.soundThemeList}>
      {SOUND_THEMES.map(theme => {
        const active = theme.id === selected
        return (
          <TouchableOpacity
            key={theme.id}
            style={styles.soundThemeRow}
            onPress={() => onSelect(theme.id)}
            activeOpacity={0.7}
          >
            <View style={styles.soundThemeLeft}>
              <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                {active ? <View style={styles.radioInner} /> : null}
              </View>
              <View style={styles.soundThemeText}>
                <Text style={styles.rowLabel}>{theme.label}</Text>
                <Text style={styles.rowDescription}>{theme.note}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.tryBtn}
              onPress={() => cuePlayer.play(theme.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.tryBtnText}>Try</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function PillSelector({
  options,
  selected,
  onSelect,
}: {
  options: string[]
  selected: string
  onSelect: (option: string) => void
}) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <View style={styles.pillWrap}>
      {options.map(option => {
        const active = option === selected
        return (
          <TouchableOpacity
            key={option}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{option}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function Divider() {
  const C = useColors()
  const styles = createStyles(C)
  return <View style={styles.divider} />
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    header: {
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.lg,
      gap: 8,
    },
    title: {
      fontSize: 34,
      fontWeight: FontWeight.heavy,
      color: C.textPrimary,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: C.textSecondary,
      lineHeight: 22,
      maxWidth: '90%',
    },
    sectionHeader: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      gap: 2,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: C.textPrimary,
    },
    sectionSubtitle: {
      fontSize: FontSize.sm,
      color: C.textSecondary,
      lineHeight: 20,
    },
    panel: {
      backgroundColor: C.bgCard,
      borderRadius: 22,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: C.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
      color: C.textPrimary,
    },
    rowDescription: {
      fontSize: FontSize.sm,
      color: C.textSecondary,
      lineHeight: 20,
    },
    rowValue: {
      fontSize: 18,
      fontWeight: FontWeight.medium,
      color: C.accent,
    },
    colorRow: {
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    colorOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingTop: 2,
    },
    colorOption: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorOptionActive: {
      borderColor: C.textPrimary,
    },
    colorOptionInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    rowNote: {
      fontSize: FontSize.sm,
      color: C.textTertiary,
      marginRight: Spacing.xs,
    },
    linkRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chevron: {
      fontSize: FontSize.xl,
      color: C.textTertiary,
    },
    soundThemeList: {
      paddingVertical: Spacing.xs,
      gap: Spacing.xs,
    },
    soundThemeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    soundThemeLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    soundThemeText: {
      flex: 1,
      gap: 2,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.bg,
    },
    radioOuterActive: {
      borderColor: C.accent,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.accent,
    },
    tryBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 7,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    tryBtnText: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: C.accent,
    },
    divider: {
      height: 1,
      backgroundColor: C.separator,
      marginLeft: 0,
    },
    pillWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.sm,
    },
    pill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    pillActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    pillText: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      color: C.textSecondary,
    },
    pillTextActive: {
      color: C.accentText,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    stepperBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.bg,
      borderWidth: 1,
      borderColor: C.border,
    },
    stepperBtnText: {
      fontSize: 22,
      fontWeight: FontWeight.bold,
      color: C.textPrimary,
      lineHeight: 24,
    },
    stepperDisabled: {
      color: C.textTertiary,
    },
    stepperValueWrap: {
      minWidth: 48,
      alignItems: 'center',
    },
    stepperValue: {
      fontSize: 24,
      fontWeight: FontWeight.heavy,
      color: C.textPrimary,
      fontVariant: ['tabular-nums'],
    },
  })
}
