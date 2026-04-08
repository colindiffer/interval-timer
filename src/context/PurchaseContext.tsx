import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ErrorCode,
  fetchProducts as fetchStoreProducts,
  finishTransaction,
  getAvailablePurchases as queryAvailablePurchases,
  Product,
  Purchase,
  requestPurchase,
  restorePurchases as restoreStorePurchases,
  useIAP,
} from 'expo-iap'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { t } from '../i18n'
import { initializeMobileAds } from '../lib/ads'
import {
  hasRemoveAdsEntitlement,
  isRemoveAdsPurchase,
  REMOVE_ADS_PRODUCT_ID,
  REMOVE_ADS_PRODUCT_IDS,
} from '../lib/purchases'

const ENTITLEMENTS_KEY = 'purchase_entitlements_v1'

type StatusTone = 'neutral' | 'success' | 'error'

interface PurchaseContextValue {
  adFree: boolean
  loading: boolean
  storeConnected: boolean
  removeAdsProduct: Product | null
  purchaseBusy: boolean
  restoreBusy: boolean
  statusMessage: string
  statusTone: StatusTone
  buyRemoveAds: () => Promise<void>
  restorePurchases: () => Promise<void>
}

interface StoredEntitlements {
  adFree: boolean
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null)

function isOneTimeProduct(product: { type?: string } | null | undefined): product is Product {
  return product?.type === 'in-app'
}

function getPurchaseMessage(error: { code?: ErrorCode | string; message?: string }): { text: string; tone: StatusTone } {
  switch (error.code) {
    case ErrorCode.UserCancelled:
      return { text: '', tone: 'neutral' }
    case ErrorCode.AlreadyOwned:
      return { text: t('settings.purchaseAlreadyOwned'), tone: 'success' }
    case ErrorCode.ItemUnavailable:
    case ErrorCode.SkuNotFound:
      return { text: t('settings.purchaseUnavailable'), tone: 'error' }
    case ErrorCode.BillingUnavailable:
    case ErrorCode.IapNotAvailable:
      return { text: t('settings.storeUnavailable'), tone: 'error' }
    case ErrorCode.NetworkError:
    case ErrorCode.ServiceDisconnected:
    case ErrorCode.ServiceError:
      return { text: t('settings.purchaseConnectionIssue'), tone: 'error' }
    case ErrorCode.Pending:
      return { text: t('settings.purchasePending'), tone: 'neutral' }
    default:
      return {
        text: error.message ? `${t('settings.purchaseFailedGeneric')} ${error.message}` : t('settings.purchaseFailedGeneric'),
        tone: 'error',
      }
  }
}

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [adFree, setAdFree] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [syncingStore, setSyncingStore] = useState(false)
  const [purchaseBusy, setPurchaseBusy] = useState(false)
  const [restoreBusy, setRestoreBusy] = useState(false)
  const [removeAdsProduct, setRemoveAdsProduct] = useState<Product | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral')

  const { connected } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      if (!isRemoveAdsPurchase(purchase)) return

      try {
        if (purchase.purchaseState === 'pending') {
          setStatusMessage(t('settings.purchasePending'))
          setStatusTone('neutral')
          return
        }

        await saveEntitlements({ adFree: true })
        setAdFree(true)
        await finishTransaction({ purchase, isConsumable: false })

        const purchases = await queryAvailablePurchases({ onlyIncludeActiveItemsIOS: true })
        const owned = hasRemoveAdsEntitlement(purchases ?? [])
        await saveEntitlements({ adFree: owned })
        setAdFree(owned)
        setStatusMessage(owned ? t('settings.purchaseSuccess') : t('settings.removeAdsOwned'))
        setStatusTone('success')
      } catch (error: any) {
        const purchaseError = getPurchaseMessage({
          code: error?.code,
          message: error?.message,
        })
        setStatusMessage(purchaseError.text)
        setStatusTone(purchaseError.tone)
      } finally {
        setPurchaseBusy(false)
      }
    },
    onPurchaseError: error => {
      const purchaseError = getPurchaseMessage(error)
      setStatusMessage(purchaseError.text)
      setStatusTone(purchaseError.tone)
      setPurchaseBusy(false)

      if (error.code === ErrorCode.AlreadyOwned) {
        void refreshEntitlements()
      }
    },
    onError: (error: Error) => {
      const purchaseError = getPurchaseMessage({ message: error.message })
      setStatusMessage(purchaseError.text)
      setStatusTone(purchaseError.tone)
      setPurchaseBusy(false)
      setRestoreBusy(false)
    },
  })

  const saveEntitlements = useCallback(async (next: StoredEntitlements) => {
    await AsyncStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(next))
  }, [])

  const refreshEntitlements = useCallback(async () => {
    if (Platform.OS === 'web' || !connected) return

    setSyncingStore(true)
    try {
      const [products, purchases] = await Promise.all([
        fetchStoreProducts({ skus: REMOVE_ADS_PRODUCT_IDS, type: 'in-app' }),
        queryAvailablePurchases({ onlyIncludeActiveItemsIOS: true }),
      ])

      const product = (products ?? []).filter(isOneTimeProduct).find(item => item.id === REMOVE_ADS_PRODUCT_ID) ?? null
      const owned = hasRemoveAdsEntitlement(purchases ?? [])

      setRemoveAdsProduct(product)
      setAdFree(owned)
      await saveEntitlements({ adFree: owned })

      if (statusTone !== 'success') {
        setStatusMessage('')
        setStatusTone('neutral')
      }
    } catch (error: any) {
      const purchaseError = getPurchaseMessage({
        code: error?.code,
        message: error?.message,
      })
      setStatusMessage(purchaseError.text)
      setStatusTone(purchaseError.tone)
    } finally {
      setSyncingStore(false)
    }
  }, [connected, saveEntitlements, statusTone])

  useEffect(() => {
    AsyncStorage.getItem(ENTITLEMENTS_KEY)
      .then(raw => {
        if (!raw) return
        const parsed = JSON.parse(raw) as StoredEntitlements
        setAdFree(Boolean(parsed.adFree))
      })
      .finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web' || adFree) return
    initializeMobileAds().catch(() => undefined)
  }, [hydrated, adFree])

  useEffect(() => {
    if (!hydrated || !connected) return
    void refreshEntitlements()
  }, [connected, hydrated, refreshEntitlements])

  const buyRemoveAds = useCallback(async () => {
    if (Platform.OS === 'web') return
    if (adFree) {
      setStatusMessage(t('settings.removeAdsOwned'))
      setStatusTone('success')
      return
    }

    setPurchaseBusy(true)
    setStatusMessage('')
    setStatusTone('neutral')

    try {
      await requestPurchase({
        request: {
          apple: { sku: REMOVE_ADS_PRODUCT_ID },
          google: { skus: [REMOVE_ADS_PRODUCT_ID] },
        },
        type: 'in-app',
      })
    } catch (error: any) {
      const purchaseError = getPurchaseMessage({
        code: error?.code,
        message: error?.message,
      })
      setStatusMessage(purchaseError.text)
      setStatusTone(purchaseError.tone)
      setPurchaseBusy(false)
    }
  }, [adFree])

  const restorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') return

    setRestoreBusy(true)
    setStatusMessage('')
    setStatusTone('neutral')

    try {
      await restoreStorePurchases()
      const purchases = await queryAvailablePurchases({ onlyIncludeActiveItemsIOS: true })
      const owned = hasRemoveAdsEntitlement(purchases ?? [])

      setAdFree(owned)
      await saveEntitlements({ adFree: owned })
      setStatusMessage(owned ? t('settings.purchasesRestored') : t('settings.noPurchasesToRestore'))
      setStatusTone(owned ? 'success' : 'neutral')
    } catch (error: any) {
      const purchaseError = getPurchaseMessage({
        code: error?.code,
        message: error?.message,
      })
      setStatusMessage(purchaseError.text)
      setStatusTone(purchaseError.tone)
    } finally {
      setRestoreBusy(false)
    }
  }, [saveEntitlements])

  const value = useMemo<PurchaseContextValue>(() => ({
    adFree,
    loading: !hydrated || syncingStore,
    storeConnected: connected,
    removeAdsProduct,
    purchaseBusy,
    restoreBusy,
    statusMessage,
    statusTone,
    buyRemoveAds,
    restorePurchases,
  }), [
    adFree,
    hydrated,
    syncingStore,
    connected,
    removeAdsProduct,
    purchaseBusy,
    restoreBusy,
    statusMessage,
    statusTone,
    buyRemoveAds,
    restorePurchases,
  ])

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  )
}

export function usePurchases(): PurchaseContextValue {
  const ctx = useContext(PurchaseContext)
  if (!ctx) throw new Error('usePurchases must be used inside PurchaseProvider')
  return ctx
}
