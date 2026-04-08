import React from 'react'
import { usePurchases } from '../context/PurchaseContext'
import TestBannerAd from './TestBannerAd'

export default function AdBanner() {
  const { adFree, loading } = usePurchases()
  if (adFree || loading) return null
  return <TestBannerAd variant="footer" />
}
