import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { NativeModules, Platform } from 'react-native'
import { getSettings, saveSettings } from './data/storage'
import { LocalePreference, SupportedLocale } from './types'

type Params = Record<string, string | number>
type TranslationValue = string | ((params: Params) => string)
type TranslationTable = Record<string, TranslationValue>

const translations: Record<SupportedLocale, TranslationTable> = {
  en: {
    'nav.library': 'Library',
    'nav.create': 'Create',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'common.cancel': 'Cancel',
    'common.done': 'Done',
    'common.save': 'Save',
    'common.off': 'Off',
    'common.or': 'or',
    'common.default': 'Default',
    'common.paused': 'Paused',
    'common.quickStart': 'QUICK START',
    'common.newWorkout': 'New workout',
    'common.buildCustomSession': 'Build a custom session and save it to your library.',
    'common.presets': 'PRESETS',
    'common.favourites': 'FAVOURITES',
    'common.myWorkouts': 'MY WORKOUTS',
    'common.work': 'Work',
    'common.rest': 'Rest',
    'common.warmup': 'Warm Up',
    'common.cooldown': 'Cooldown',
    'common.today': 'Today',
    'common.yesterday': 'Yesterday',
    'common.lastWeek': 'Last week',
    'common.weeksAgo': ({ count }) => `${count} weeks ago`,
    'common.daysAgo': ({ count }) => `${count} days ago`,
    'common.minutesShort': ({ count }) => `${count} min`,
    'common.secondsShort': ({ count }) => `${count}s`,
    'common.steady': 'steady',
    'common.customSets': ({ count }) => `${count} custom sets`,
    'library.noSavedWorkouts': 'No saved workouts yet.',
    'library.createOneFromTab': 'Create one from the Create tab and it will appear here.',
    'library.chooseAction': 'Choose an action',
    'library.addToFavourites': 'Add to favourites',
    'library.removeFromFavourites': 'Remove from favourites',
    'library.duplicate': 'Duplicate',
    'library.edit': 'Edit',
    'library.delete': 'Delete',
    'library.deleteConfirmTitle': ({ name }) => `Delete ${name}?`,
    'library.deleteConfirmBody': 'This workout will be removed from your library.',
    'library.copySuffix': 'copy',
    'history.thisWeek': 'THIS WEEK',
    'history.lastWeek': 'LAST WEEK',
    'history.weekOf': ({ date }) => `${date} week`,
    'history.workouts': 'Workouts',
    'history.minutes': 'Minutes',
    'history.dayStreak': 'Day streak',
    'history.noWorkoutsYet': 'No workouts yet.',
    'history.recentSessions': 'Your recent sessions will appear here.',
    'history.completed': 'Completed',
    'history.stoppedEarly': 'Stopped early',
    'workout.pause': 'Pause',
    'workout.resume': 'Resume',
    'workout.lastPhase': 'Last phase',
    'workout.skipAhead': 'Skip ahead',
    'workout.startAgain': 'Start again',
    'workout.backToLibrary': 'Back to library',
    'workout.repsComplete': ({ count }) => `${count} reps complete`,
    'workout.nextWork': 'Next: RUN',
    'workout.nextRest': 'Next: REST',
    'workout.nextWarmup': 'Next: WARM UP',
    'workout.nextCooldown': 'Next: COOL DOWN',
    'workout.exit': 'Exit workout',
    'builder.off': 'Off',
    'builder.minutes': 'Minutes',
    'builder.seconds': 'Seconds',
    'builder.turnOff': 'Turn off',
    'builder.workInterval': 'Work interval',
    'builder.restInterval': 'Rest interval',
    'builder.warmup': 'Warmup',
    'builder.cooldown': 'Cooldown',
    'builder.editWorkout': 'Edit Workout',
    'builder.newWorkout': 'New Workout',
    'builder.name': 'NAME',
    'builder.workoutName': 'Workout name',
    'builder.workIntervalLabel': 'WORK INTERVAL',
    'builder.restIntervalLabel': 'REST INTERVAL',
    'builder.repeats': 'REPEATS',
    'builder.advancedRepsHelp': 'Advanced mode controls reps from the custom set list below.',
    'builder.warmupOptional': 'WARMUP (optional)',
    'builder.cooldownOptional': 'COOLDOWN (optional)',
    'builder.restOptions': 'REST OPTIONS',
    'builder.skipLastRest': 'Skip last rest',
    'builder.skipLastRestHelp': 'Finish on the final work set instead of resting once more.',
    'builder.advancedSettings': 'ADVANCED SETTINGS',
    'builder.advancedSettingsTitle': 'Advanced settings',
    'builder.advancedSettingsHelp': 'Per-set timings, custom colours and sound.',
    'builder.remove': 'Remove',
    'builder.addSet': 'Add set',
    'builder.setLabel': ({ count }) => `Set ${count}`,
    'builder.setWorkLabel': ({ count }) => `Set ${count} work`,
    'builder.setRestLabel': ({ count }) => `Set ${count} rest`,
    'builder.workColor': 'Work colour',
    'builder.restColor': 'Rest colour',
    'builder.soundOverride': 'Sound override',
    'builder.voiceCues': 'Voice cues',
    'builder.voiceCuesHelp': 'Count down and announce phases for this workout.',
    'builder.preview': 'PREVIEW',
    'builder.warmupPreview': ({ value }) => `Warmup: ${value}`,
    'builder.customSetsPreview': ({ count }) => `Custom sets: ${count}`,
    'builder.firstSetPreview': ({ work, rest }) => `First set: ${work} work / ${rest} rest`,
    'builder.workRestPreview': ({ work, rest }) => `${work} work / ${rest} rest`,
    'builder.repsPreview': ({ count }) => `x ${count} ${count === 1 ? 'rep' : 'reps'}`,
    'builder.cooldownPreview': ({ value }) => `Cooldown: ${value}`,
    'builder.totalPreview': ({ total }) => `Total: ~${total} min`,
    'builder.startNow': 'Start now',
    'settings.title': 'Settings',
    'settings.subtitle': 'Keep the familiar controls. Add the extra ones around them.',
    'settings.signedIn': 'Signed in',
    'settings.signOut': 'Sign out',
    'settings.syncToCloud': 'Sync to cloud',
    'settings.restoreFromCloud': 'Restore from cloud',
    'settings.uploading': 'Uploading...',
    'settings.cloudUpdated': 'Cloud updated',
    'settings.failedRetry': 'Failed - try again',
    'settings.overwriteCloud': 'Overwrite cloud with your local workouts',
    'settings.sync': 'Sync',
    'settings.retry': 'Retry',
    'settings.restoring': 'Restoring...',
    'settings.workoutsRestored': 'Workouts restored',
    'settings.replaceLocalWorkouts': 'Replace local workouts with cloud copy',
    'settings.restore': 'Restore',
    'settings.restoreConfirmTitle': 'Restore from cloud?',
    'settings.restoreConfirmBody': 'This will replace all your local workouts with the ones saved in your account.',
    'settings.saveYourWorkouts': 'Save your workouts',
    'settings.syncAcrossDevices': 'Sync across devices, free forever',
    'settings.logIn': 'Log in',
    'settings.createAccount': 'Create account',
    'settings.email': 'Email',
    'settings.password': 'Password',
    'settings.enterEmailAndPassword': 'Please enter your email and password.',
    'settings.incorrectEmailOrPassword': 'Incorrect email or password.',
    'settings.accountAlreadyExists': 'An account with this email already exists.',
    'settings.passwordTooShort': 'Password must be at least 6 characters.',
    'settings.invalidEmail': 'Please enter a valid email address.',
    'settings.somethingWentWrong': 'Something went wrong. Please try again.',
    'settings.enterEmailToReset': 'Enter your email above to reset your password.',
    'settings.emailSent': 'Email sent',
    'settings.resetPasswordSent': ({ email }) => `Check ${email} for a password reset link.`,
    'settings.resetEmailFailed': 'Could not send reset email. Check the address and try again.',
    'settings.forgotPassword': 'Forgot password?',
    'settings.continueWithGoogle': 'Continue with Google',
    'settings.continueWithApple': 'Continue with Apple',
    'settings.theme': 'Theme',
    'settings.themeSubtitle': 'Choose the phone appearance first.',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.system': 'System',
    'settings.currentMode': 'Current mode',
    'settings.language': 'Language',
    'settings.languageSubtitle': 'Choose your app language instead of assuming the phone language.',
    'settings.currentLanguage': 'Current language',
    'settings.sound': 'Sound',
    'settings.soundSubtitle': 'Sound and voice are mutually exclusive.',
    'settings.soundMode.sound': 'Sound',
    'settings.soundMode.voice': 'Voice',
    'settings.soundMode.none': 'None',
    'settings.soundTheme.beep': 'Beep',
    'settings.soundTheme.bell': 'Bell',
    'settings.soundTheme.gong': 'Gong',
    'settings.soundTheme.whistle': 'Whistle',
    'settings.soundThemeNote.beep': 'Short electronic beep.',
    'settings.soundThemeNote.bell': 'Clear achievement bell.',
    'settings.soundThemeNote.gong': 'Deep resonant gong.',
    'settings.soundThemeNote.whistle': 'Sharp sports whistle.',
    'settings.try': 'Try',
    'settings.finalCount': 'Final count',
    'settings.colors': 'Colors',
    'settings.colorsSubtitle': 'The timer visual language at a glance.',
    'settings.phase.warmupLabel': 'Prepare',
    'settings.phase.warmupValue': 'Warmup',
    'settings.phase.workLabel': 'Work',
    'settings.phase.workValue': 'Run',
    'settings.phase.restLabel': 'Rest',
    'settings.phase.restValue': 'Recover',
    'settings.phase.cooldownLabel': 'Cooldown',
    'settings.phase.cooldownValue': 'Easy out',
    'settings.phase.completeLabel': 'Finish',
    'settings.phase.completeValue': 'Complete',
    'settings.misc': 'Miscellaneous',
    'settings.miscSubtitle': 'Everything else that belongs in settings.',
    'settings.bannerAds': 'Banner ads',
    'settings.placeholderOnly': 'Placeholder only',
    'settings.rateApp': 'Rate the app',
    'settings.sendFeedback': 'Send feedback',
    'settings.privacyPolicy': 'Privacy policy',
    'settings.version': 'Version',
  },
  es: {
    'nav.library': 'Biblioteca',
    'nav.create': 'Crear',
    'nav.history': 'Historial',
    'nav.settings': 'Ajustes',
    'common.cancel': 'Cancelar',
    'common.done': 'Listo',
    'common.save': 'Guardar',
    'common.off': 'Desactivado',
    'common.or': 'o',
    'common.default': 'Predeterminado',
    'common.paused': 'Pausado',
    'common.quickStart': 'INICIO RAPIDO',
    'common.newWorkout': 'Nuevo entrenamiento',
    'common.buildCustomSession': 'Crea una sesion personalizada y guardala en tu biblioteca.',
    'common.presets': 'PREAJUSTES',
    'common.favourites': 'FAVORITOS',
    'common.myWorkouts': 'MIS ENTRENAMIENTOS',
    'common.work': 'Trabajo',
    'common.rest': 'Descanso',
    'common.warmup': 'Calentamiento',
    'common.cooldown': 'Vuelta a la calma',
    'workout.pause': 'Pausar',
    'workout.resume': 'Reanudar',
    'workout.lastPhase': 'Ultima fase',
    'workout.skipAhead': 'Saltar adelante',
    'workout.startAgain': 'Empezar de nuevo',
    'workout.backToLibrary': 'Volver a la biblioteca',
    'workout.nextWork': 'Siguiente: TRABAJO',
    'workout.nextRest': 'Siguiente: DESCANSO',
    'workout.nextWarmup': 'Siguiente: CALENTAMIENTO',
    'workout.nextCooldown': 'Siguiente: VUELTA A LA CALMA',
    'workout.exit': 'Salir del entrenamiento',
    'settings.signOut': 'Cerrar sesion',
    'settings.syncToCloud': 'Sincronizar con la nube',
    'settings.restoreFromCloud': 'Restaurar desde la nube',
    'settings.logIn': 'Iniciar sesion',
    'settings.createAccount': 'Crear cuenta',
    'builder.editWorkout': 'Editar entrenamiento',
    'builder.newWorkout': 'Nuevo entrenamiento',
    'settings.title': 'Ajustes',
  },
  fr: {
    'nav.library': 'Bibliotheque',
    'nav.create': 'Creer',
    'nav.history': 'Historique',
    'nav.settings': 'Reglages',
    'common.cancel': 'Annuler',
    'common.done': 'Termine',
    'common.save': 'Enregistrer',
    'common.off': 'Desactive',
    'common.or': 'ou',
    'common.default': 'Par defaut',
    'common.paused': 'En pause',
    'common.quickStart': 'DEMARRAGE RAPIDE',
    'common.newWorkout': 'Nouvel entrainement',
    'common.buildCustomSession': 'Creez une session personnalisee et enregistrez-la dans votre bibliotheque.',
    'common.presets': 'PRESETS',
    'common.favourites': 'FAVORIS',
    'common.myWorkouts': 'MES ENTRAINEMENTS',
    'common.work': 'Travail',
    'common.rest': 'Repos',
    'common.warmup': 'Echauffement',
    'common.cooldown': 'Retour au calme',
    'workout.pause': 'Pause',
    'workout.resume': 'Reprendre',
    'workout.lastPhase': 'Derniere phase',
    'workout.skipAhead': 'Passer',
    'workout.startAgain': 'Recommencer',
    'workout.backToLibrary': 'Retour a la bibliotheque',
    'builder.editWorkout': "Modifier l'entrainement",
    'builder.newWorkout': 'Nouvel entrainement',
    'settings.signOut': 'Se deconnecter',
    'settings.logIn': 'Se connecter',
    'settings.createAccount': 'Creer un compte',
    'settings.title': 'Reglages',
  },
  de: {
    'nav.library': 'Bibliothek',
    'nav.create': 'Erstellen',
    'nav.history': 'Verlauf',
    'nav.settings': 'Einstellungen',
    'common.cancel': 'Abbrechen',
    'common.done': 'Fertig',
    'common.save': 'Speichern',
    'common.off': 'Aus',
    'common.or': 'oder',
    'common.default': 'Standard',
    'common.paused': 'Pausiert',
    'common.quickStart': 'SCHNELLSTART',
    'common.newWorkout': 'Neues Workout',
    'common.buildCustomSession': 'Erstelle eine benutzerdefinierte Session und speichere sie in deiner Bibliothek.',
    'common.presets': 'VORLAGEN',
    'common.favourites': 'FAVORITEN',
    'common.myWorkouts': 'MEINE WORKOUTS',
    'common.work': 'Arbeit',
    'common.rest': 'Pause',
    'common.warmup': 'Aufwaermen',
    'common.cooldown': 'Abkuehlen',
    'workout.pause': 'Pause',
    'workout.resume': 'Fortsetzen',
    'workout.lastPhase': 'Letzte Phase',
    'workout.skipAhead': 'Ueberspringen',
    'workout.startAgain': 'Erneut starten',
    'workout.backToLibrary': 'Zurueck zur Bibliothek',
    'builder.editWorkout': 'Workout bearbeiten',
    'builder.newWorkout': 'Neues Workout',
    'settings.signOut': 'Abmelden',
    'settings.logIn': 'Anmelden',
    'settings.createAccount': 'Konto erstellen',
    'settings.title': 'Einstellungen',
  },
  'pt-BR': {
    'nav.library': 'Biblioteca',
    'nav.create': 'Criar',
    'nav.history': 'Historico',
    'nav.settings': 'Ajustes',
    'common.cancel': 'Cancelar',
    'common.done': 'Concluir',
    'common.save': 'Salvar',
    'common.off': 'Desligado',
    'common.or': 'ou',
    'common.default': 'Padrao',
    'common.paused': 'Pausado',
    'common.quickStart': 'INICIO RAPIDO',
    'common.newWorkout': 'Novo treino',
    'common.buildCustomSession': 'Monte uma sessao personalizada e salve na sua biblioteca.',
    'common.presets': 'PRESETS',
    'common.favourites': 'FAVORITOS',
    'common.myWorkouts': 'MEUS TREINOS',
    'common.work': 'Trabalho',
    'common.rest': 'Descanso',
    'common.warmup': 'Aquecimento',
    'common.cooldown': 'Desaquecimento',
    'workout.pause': 'Pausar',
    'workout.resume': 'Retomar',
    'workout.lastPhase': 'Ultima fase',
    'workout.skipAhead': 'Avancar',
    'workout.startAgain': 'Comecar de novo',
    'workout.backToLibrary': 'Voltar para a biblioteca',
    'builder.editWorkout': 'Editar treino',
    'builder.newWorkout': 'Novo treino',
    'settings.signOut': 'Sair',
    'settings.logIn': 'Entrar',
    'settings.createAccount': 'Criar conta',
    'settings.title': 'Ajustes',
  },
  ja: {
    'nav.library': 'ライブラリ',
    'nav.create': '作成',
    'nav.history': '履歴',
    'nav.settings': '設定',
    'common.cancel': 'キャンセル',
    'common.done': '完了',
    'common.save': '保存',
    'common.off': 'オフ',
    'common.or': 'または',
    'common.default': 'デフォルト',
    'common.paused': '一時停止中',
    'common.quickStart': 'クイックスタート',
    'common.newWorkout': '新しいワークアウト',
    'common.buildCustomSession': 'カスタムセッションを作成してライブラリに保存します。',
    'common.presets': 'プリセット',
    'common.favourites': 'お気に入り',
    'common.myWorkouts': 'マイワークアウト',
    'common.work': '運動',
    'common.rest': '休憩',
    'common.warmup': 'ウォームアップ',
    'common.cooldown': 'クールダウン',
    'workout.pause': '一時停止',
    'workout.resume': '再開',
    'workout.lastPhase': '最後のフェーズ',
    'workout.skipAhead': '次へ進む',
    'workout.startAgain': 'もう一度始める',
    'workout.backToLibrary': 'ライブラリに戻る',
    'builder.editWorkout': 'ワークアウトを編集',
    'builder.newWorkout': '新しいワークアウト',
    'settings.signOut': 'サインアウト',
    'settings.logIn': 'ログイン',
    'settings.createAccount': 'アカウント作成',
    'settings.title': '設定',
  },
}

interface I18nContextValue {
  locale: SupportedLocale
  localeSetting: LocalePreference
  setLocale: (value: LocalePreference) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  localeSetting: 'system',
  setLocale: () => {},
})

let localeOverride: LocalePreference = 'system'

function detectRawLocale(): string {
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings
    return settings?.AppleLocale ?? settings?.AppleLanguages?.[0] ?? 'en'
  }
  return NativeModules.I18nManager?.localeIdentifier ?? 'en'
}

function normalizeLocale(locale: string): SupportedLocale {
  const normalized = locale.replace('_', '-').toLowerCase()
  if (normalized.startsWith('pt-br')) return 'pt-BR'
  if (normalized.startsWith('es')) return 'es'
  if (normalized.startsWith('fr')) return 'fr'
  if (normalized.startsWith('de')) return 'de'
  if (normalized.startsWith('ja')) return 'ja'
  return 'en'
}

function resolveLocale(localeSetting: LocalePreference): SupportedLocale {
  return localeSetting === 'system' ? normalizeLocale(detectRawLocale()) : localeSetting
}

export function getLocale(): SupportedLocale {
  return resolveLocale(localeOverride)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [localeSetting, setLocaleSetting] = useState<LocalePreference>('system')

  useEffect(() => {
    getSettings().then(settings => {
      const nextLocale = settings.locale ?? 'system'
      localeOverride = nextLocale
      setLocaleSetting(nextLocale)
    })
  }, [])

  const setLocale = useCallback((value: LocalePreference) => {
    localeOverride = value
    setLocaleSetting(value)
    saveSettings({ locale: value })
  }, [])

  return React.createElement(
    I18nContext.Provider,
    {
      value: {
        locale: resolveLocale(localeSetting),
        localeSetting,
        setLocale,
      },
    },
    children,
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function t(key: string, params: Params = {}): string {
  const locale = getLocale()
  const value = translations[locale][key] ?? translations.en[key]
  if (!value) return key
  return typeof value === 'function' ? value(params) : value
}

export function formatRelativeDate(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / 86400000)
  if (typeof Intl.RelativeTimeFormat === 'function') {
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' })
    if (diffDays < 7) return rtf.format(-diffDays, 'day')
    return rtf.format(-Math.floor(diffDays / 7), 'week')
  }
  if (diffDays === 0) return t('common.today')
  if (diffDays === 1) return t('common.yesterday')
  if (diffDays < 7) return t('common.daysAgo', { count: diffDays })
  if (diffDays < 14) return t('common.lastWeek')
  return t('common.weeksAgo', { count: Math.floor(diffDays / 7) })
}

export function formatLocalizedDate(timestamp: number, options: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp).toLocaleDateString(getLocale(), options)
}
