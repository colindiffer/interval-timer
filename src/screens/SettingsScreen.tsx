import React, { useCallback, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native'
import * as StoreReview from 'expo-store-review'
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
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { pushToCloud, pullFromCloud } from '../data/syncService'

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
  const { user, signInGoogle, signInApple, signInEmail, createAccountEmail, resetPassword, signOut, appleAvailable } = useAuth()
  const [signingIn, setSigningIn]   = useState(false)
  const [authMode, setAuthMode]     = useState<'login' | 'register'>('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [emailError, setEmailError] = useState('')
  const [settings, setSettings]     = useState<AppSettings>(DEFAULT_SETTINGS)
  type BtnState = 'idle' | 'busy' | 'done' | 'error'
  const [syncState,    setSyncState]    = useState<BtnState>('idle')
  const [restoreState, setRestoreState] = useState<BtnState>('idle')
  const syncTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSync = useCallback(async () => {
    if (!user || syncState === 'busy') return
    setSyncState('busy')
    try {
      await pushToCloud(user.uid)
      setSyncState('done')
    } catch {
      setSyncState('error')
    } finally {
      if (syncTimer.current) clearTimeout(syncTimer.current)
      syncTimer.current = setTimeout(() => setSyncState('idle'), 3000)
    }
  }, [user, syncState])

  const handleRestore = useCallback(async () => {
    if (!user || restoreState === 'busy') return
    Alert.alert(
      'Restore from cloud?',
      'This will replace all your local workouts with the ones saved in your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoreState('busy')
            try {
              await pullFromCloud(user.uid)
              setRestoreState('done')
            } catch {
              setRestoreState('error')
            } finally {
              if (restoreTimer.current) clearTimeout(restoreTimer.current)
              restoreTimer.current = setTimeout(() => setRestoreState('idle'), 3000)
            }
          },
        },
      ],
    )
  }, [user, restoreState])

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

        {user ? (
          <View style={styles.accountCard}>
            {/* Name + email */}
            <View style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {user.displayName ?? user.email ?? 'Signed in'}
                </Text>
                {user.email ? (
                  <Text style={styles.accountEmail} numberOfLines={1}>{user.email}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.accountDivider} />

            {/* Sync row */}
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={styles.syncTitle}>Sync to cloud</Text>
                <Text style={styles.syncSub}>
                  {syncState === 'busy'  ? 'Uploading…'
                  : syncState === 'done'  ? 'Cloud updated'
                  : syncState === 'error' ? 'Failed — try again'
                  : 'Overwrite cloud with your local workouts'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.syncBtn, syncState === 'busy' && { opacity: 0.5 }]}
                onPress={handleSync}
                disabled={syncState === 'busy'}
                activeOpacity={0.7}
              >
                {syncState === 'busy' ? (
                  <ActivityIndicator size="small" color={C.accent} />
                ) : (
                  <Text style={[
                    styles.syncBtnText,
                    syncState === 'done'  && { color: '#22C55E' },
                    syncState === 'error' && { color: C.danger },
                  ]}>
                    {syncState === 'done' ? 'Done' : syncState === 'error' ? 'Retry' : 'Sync'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.accountDivider} />

            {/* Restore row */}
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={styles.syncTitle}>Restore from cloud</Text>
                <Text style={styles.syncSub}>
                  {restoreState === 'busy'  ? 'Restoring…'
                  : restoreState === 'done'  ? 'Workouts restored'
                  : restoreState === 'error' ? 'Failed — try again'
                  : 'Replace local workouts with cloud copy'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.syncBtn, restoreState === 'busy' && { opacity: 0.5 }]}
                onPress={handleRestore}
                disabled={restoreState === 'busy'}
                activeOpacity={0.7}
              >
                {restoreState === 'busy' ? (
                  <ActivityIndicator size="small" color={C.accent} />
                ) : (
                  <Text style={[
                    styles.syncBtnText,
                    restoreState === 'done'  && { color: '#22C55E' },
                    restoreState === 'error' && { color: C.danger },
                  ]}>
                    {restoreState === 'done' ? 'Done' : restoreState === 'error' ? 'Retry' : 'Restore'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.signInBlock}>
            {/* Header */}
            <View style={styles.signInLogoRow}>
              <Logo size={36} />
              <View style={styles.signInTextBlock}>
                <Text style={styles.signInHeading}>Save your workouts</Text>
                <Text style={styles.signInSub}>Sync across devices — free forever</Text>
              </View>
            </View>

            {/* Tab toggle */}
            <View style={styles.authTabRow}>
              <TouchableOpacity
                style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
                onPress={() => { setAuthMode('login'); setEmailError('') }}
                activeOpacity={0.7}
              >
                <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Log in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authTab, authMode === 'register' && styles.authTabActive]}
                onPress={() => { setAuthMode('register'); setEmailError('') }}
                activeOpacity={0.7}
              >
                <Text style={[styles.authTabText, authMode === 'register' && styles.authTabTextActive]}>Create account</Text>
              </TouchableOpacity>
            </View>

            {/* Email + password */}
            <TextInput
              style={[styles.authInput, emailError ? styles.authInputError : null]}
              placeholder="Email"
              placeholderTextColor={C.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={t => { setEmail(t); setEmailError('') }}
            />
            <TextInput
              style={styles.authInput}
              placeholder="Password"
              placeholderTextColor={C.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            {emailError ? <Text style={styles.authErrorText}>{emailError}</Text> : null}

            <TouchableOpacity
              style={[styles.emailSubmitBtn, signingIn && { opacity: 0.6 }]}
              disabled={signingIn}
              activeOpacity={0.85}
              onPress={async () => {
                if (!email.trim() || !password) {
                  setEmailError('Please enter your email and password.')
                  return
                }
                setSigningIn(true)
                setEmailError('')
                try {
                  if (authMode === 'login') {
                    await signInEmail(email.trim(), password)
                  } else {
                    await createAccountEmail(email.trim(), password)
                  }
                } catch (e: any) {
                  const code = e?.code ?? ''
                  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                    setEmailError('Incorrect email or password.')
                  } else if (code === 'auth/email-already-in-use') {
                    setEmailError('An account with this email already exists.')
                  } else if (code === 'auth/weak-password') {
                    setEmailError('Password must be at least 6 characters.')
                  } else if (code === 'auth/invalid-email') {
                    setEmailError('Please enter a valid email address.')
                  } else {
                    setEmailError(e?.message ?? 'Something went wrong. Please try again.')
                  }
                } finally {
                  setSigningIn(false)
                }
              }}
            >
              <Text style={styles.emailSubmitText}>
                {authMode === 'login' ? 'Log in' : 'Create account'}
              </Text>
            </TouchableOpacity>

            {authMode === 'login' ? (
              <TouchableOpacity
                onPress={async () => {
                  if (!email.trim()) {
                    setEmailError('Enter your email above to reset your password.')
                    return
                  }
                  try {
                    await resetPassword(email.trim())
                    Alert.alert('Email sent', `Check ${email.trim()} for a password reset link.`)
                  } catch {
                    setEmailError('Could not send reset email. Check the address and try again.')
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            ) : null}

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            {/* Social */}
            <TouchableOpacity
              style={[styles.googleBtn, signingIn && { opacity: 0.6 }]}
              onPress={async () => { setSigningIn(true); try { await signInGoogle() } catch {} finally { setSigningIn(false) } }}
              activeOpacity={0.85}
              disabled={signingIn}
            >
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
            {appleAvailable ? (
              <TouchableOpacity
                style={[styles.appleBtn, signingIn && { opacity: 0.6 }]}
                onPress={async () => { setSigningIn(true); try { await signInApple() } catch {} finally { setSigningIn(false) } }}
                activeOpacity={0.85}
                disabled={signingIn}
              >
                <Text style={styles.appleBtnText}>Continue with Apple</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

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
          <LinkRow
            label="Rate the app"
            onPress={async () => {
              if (await StoreReview.hasAction()) {
                await StoreReview.requestReview()
              } else {
                await Linking.openURL(
                  'https://play.google.com/store/apps/details?id=com.differapps.intervaltimer'
                )
              }
            }}
          />
          <Divider />
          <LinkRow
            label="Send feedback"
            onPress={() => Linking.openURL(
              'mailto:support@differapps.com?subject=Interval%20Timer%20Feedback'
            )}
          />
          <Divider />
          <LinkRow
              label="Privacy policy"
              onPress={() => Linking.openURL(
                'https://colindiffer.github.io/privacy_policy_interval_timer.html'
              )}
            />
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

function LinkRow({ label, note, onPress }: { label: string; note?: string; onPress?: () => void }) {
  const C = useColors()
  const styles = createStyles(C)

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
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
    accountCard: {
      backgroundColor:   C.bgCard,
      borderRadius:      18,
      borderWidth:       1,
      borderColor:       C.border,
      marginBottom:      Spacing.md,
      overflow:          'hidden',
    },
    accountRow: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    accountDivider: {
      height:          1,
      backgroundColor: C.separator,
    },
    syncRow: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.md,
      gap:               Spacing.md,
    },
    syncInfo: {
      flex: 1,
      gap:  2,
    },
    syncTitle: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    syncSub: {
      fontSize:   FontSize.sm,
      color:      C.textSecondary,
      lineHeight: 18,
    },
    syncBtn: {
      minWidth:          72,
      paddingVertical:   Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius:      Radius.pill,
      borderWidth:       1,
      borderColor:       C.border,
      alignItems:        'center',
      justifyContent:    'center',
    },
    syncBtnText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.semibold,
      color:      C.accent,
    },
    accountInfo: {
      flex: 1,
      gap:  2,
    },
    accountName: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.semibold,
      color:      C.textPrimary,
    },
    accountEmail: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
    },
    signOutBtn: {
      paddingVertical:   Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius:      Radius.pill,
      borderWidth:       1,
      borderColor:       C.border,
    },
    signOutText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.medium,
      color:      C.textSecondary,
    },
    signInBlock: {
      backgroundColor:   C.bgCard,
      borderRadius:      18,
      padding:           Spacing.md,
      marginBottom:      Spacing.md,
      gap:               Spacing.sm,
      borderWidth:       1,
      borderColor:       C.border,
    },
    signInLogoRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           Spacing.sm,
      marginBottom:  Spacing.xs,
    },
    signInTextBlock: {
      flex: 1,
      gap:  2,
    },
    signInHeading: {
      fontSize:   FontSize.md,
      fontWeight: FontWeight.bold,
      color:      C.textPrimary,
    },
    signInSub: {
      fontSize: FontSize.sm,
      color:    C.textSecondary,
    },
    googleBtn: {
      height:          46,
      borderRadius:    Radius.pill,
      backgroundColor: '#ffffff',
      alignItems:      'center',
      justifyContent:  'center',
      shadowColor:     '#000',
      shadowOpacity:   0.10,
      shadowRadius:    6,
      shadowOffset:    { width: 0, height: 2 },
      elevation:       2,
    },
    googleBtnText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.semibold,
      color:      '#1a1a1a',
    },
    appleBtn: {
      height:          46,
      borderRadius:    Radius.pill,
      backgroundColor: '#000000',
      alignItems:      'center',
      justifyContent:  'center',
    },
    appleBtnText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.semibold,
      color:      '#ffffff',
    },
    authTabRow: {
      flexDirection:   'row',
      borderRadius:    Radius.pill,
      backgroundColor: C.bg,
      borderWidth:     1,
      borderColor:     C.border,
      overflow:        'hidden',
    },
    authTab: {
      flex:            1,
      paddingVertical: 10,
      alignItems:      'center',
      justifyContent:  'center',
    },
    authTabActive: {
      backgroundColor: C.accent,
    },
    authTabText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.medium,
      color:      C.textSecondary,
    },
    authTabTextActive: {
      color:      C.accentText,
      fontWeight: FontWeight.semibold,
    },
    authInput: {
      height:            46,
      borderRadius:      Radius.md,
      borderWidth:       1,
      borderColor:       C.border,
      backgroundColor:   C.bg,
      paddingHorizontal: Spacing.md,
      fontSize:          FontSize.md,
      color:             C.textPrimary,
    },
    authInputError: {
      borderColor: '#EF4444',
    },
    authErrorText: {
      fontSize:  FontSize.sm,
      color:     '#EF4444',
      marginTop: -2,
    },
    emailSubmitBtn: {
      height:          46,
      borderRadius:    Radius.pill,
      backgroundColor: C.accent,
      alignItems:      'center',
      justifyContent:  'center',
    },
    emailSubmitText: {
      fontSize:   FontSize.sm,
      fontWeight: FontWeight.semibold,
      color:      C.accentText,
    },
    forgotText: {
      fontSize:  FontSize.sm,
      color:     C.accent,
      textAlign: 'center',
      paddingVertical: 2,
    },
    orRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           Spacing.sm,
      marginVertical: 2,
    },
    orLine: {
      flex:            1,
      height:          1,
      backgroundColor: C.separator,
    },
    orText: {
      fontSize: FontSize.sm,
      color:    C.textTertiary,
    },
  })
}
