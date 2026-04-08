import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FontSize, FontWeight, Radius } from '../theme'
import { t, useI18n } from '../i18n'

interface Props {
  onExit: () => void
}

export default function ExitButton({ onExit }: Props) {
  useI18n()
  return (
    <Pressable onPress={onExit} style={styles.wrapper}>
      {({ pressed }) => (
        <View style={[styles.btn, pressed && styles.btnPressed]}>
          <Text style={[styles.label, pressed && styles.labelPressed]}>{t('workout.exit')}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  btn: {
    height:          44,
    minWidth:        140,
    borderRadius:    Radius.pill,
    borderWidth:     1.5,
    borderColor:     'rgba(239,68,68,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
    color:      'rgba(239,68,68,0.9)',
    letterSpacing: 0.5,
  },
  btnPressed: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor:     'rgb(239,68,68)',
  },
  labelPressed: {
    color: 'rgb(239,68,68)',
  },
})
