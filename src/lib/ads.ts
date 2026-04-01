import { Platform } from 'react-native'

type MobileAdsModule = typeof import('react-native-google-mobile-ads')

let cachedModule: MobileAdsModule | null | undefined
let initializePromise: Promise<unknown> | null = null

export function getMobileAdsModule(): MobileAdsModule | null {
  if (Platform.OS === 'web') {
    return null
  }

  if (cachedModule !== undefined) {
    return cachedModule
  }

  try {
    cachedModule = require('react-native-google-mobile-ads') as MobileAdsModule
  } catch {
    cachedModule = null
  }

  return cachedModule
}

export function initializeMobileAds(): Promise<unknown> {
  if (initializePromise) {
    return initializePromise
  }

  const adsModule = getMobileAdsModule()
  if (!adsModule) {
    initializePromise = Promise.resolve()
    return initializePromise
  }

  initializePromise = adsModule
    .default()
    .initialize()
    .catch(() => undefined)

  return initializePromise
}
