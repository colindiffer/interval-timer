import type { Purchase } from 'expo-iap'

export const REMOVE_ADS_PRODUCT_ID = 'ad_free'
export const REMOVE_ADS_PRODUCT_IDS = [REMOVE_ADS_PRODUCT_ID]

export function isRemoveAdsPurchase(purchase: Purchase): boolean {
  return purchase.productId === REMOVE_ADS_PRODUCT_ID || purchase.ids?.includes(REMOVE_ADS_PRODUCT_ID) === true
}

export function hasRemoveAdsEntitlement(purchases: Purchase[]): boolean {
  return purchases.some(purchase => isRemoveAdsPurchase(purchase) && purchase.purchaseState === 'purchased')
}
