import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { FontSize, Radius, useColors } from '../theme'
import { getMobileAdsModule } from '../lib/ads'

type Variant = 'footer' | 'inline'

export default function TestBannerAd({ variant }: { variant: Variant }) {
  const C = useColors()
  const styles = createStyles(C)
  const [failed, setFailed] = useState(false)
  const adsModule = getMobileAdsModule()

  if (!adsModule || failed) {
    return (
      <View style={variant === 'footer' ? styles.footerFallback : styles.inlineFallback}>
        <Text style={styles.label}>Test Ad</Text>
      </View>
    )
  }

  const { BannerAd, BannerAdSize, TestIds } = adsModule
  const isInline = variant === 'inline'

  return (
    <View style={isInline ? styles.inlineWrap : styles.footerWrap}>
      <BannerAd
        unitId={isInline ? TestIds.ADAPTIVE_BANNER : TestIds.BANNER}
        size={isInline ? BannerAdSize.INLINE_ADAPTIVE_BANNER : BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  )
}

function createStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    footerWrap: {
      minHeight:       50,
      alignItems:      'center',
      justifyContent:  'center',
      borderTopWidth:  0.5,
      borderTopColor:  C.border,
      backgroundColor: C.bg,
    },
    inlineWrap: {
      minHeight:       90,
      borderRadius:    Radius.md,
      alignItems:      'center',
      justifyContent:  'center',
      marginBottom:    12,
      overflow:        'hidden',
      backgroundColor: C.bgCard,
      borderWidth:     1,
      borderColor:     C.border,
    },
    footerFallback: {
      height:          50,
      backgroundColor: C.adBg,
      alignItems:      'center',
      justifyContent:  'center',
      borderTopWidth:  0.5,
      borderTopColor:  C.border,
    },
    inlineFallback: {
      height:          90,
      backgroundColor: C.adBg,
      borderRadius:    Radius.md,
      alignItems:      'center',
      justifyContent:  'center',
      marginBottom:    12,
      borderWidth:     1,
      borderColor:     C.border,
    },
    label: {
      fontSize:      FontSize.xs,
      color:         C.adText,
      letterSpacing: 1.5,
      fontWeight:    '500',
    },
  })
}
