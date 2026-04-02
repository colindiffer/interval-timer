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

  return (
    <View style={variant === 'inline' ? styles.inlineWrap : styles.footerWrap}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.BANNER}
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
      height:          60,
      borderRadius:    Radius.md,
      alignItems:      'center',
      justifyContent:  'center',
      marginBottom:    12,
      overflow:        'hidden',
      backgroundColor: C.bgCard,
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
      height:          60,
      backgroundColor: C.adBg,
      borderRadius:    Radius.md,
      alignItems:      'center',
      justifyContent:  'center',
      marginBottom:    12,
    },
    label: {
      fontSize:      FontSize.xs,
      color:         C.adText,
      letterSpacing: 1.5,
      fontWeight:    '500',
    },
  })
}
