import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import { PhaseType, SoundThemeId } from '../types'

const PHASE_VOICE_TEXT: Record<PhaseType, string> = {
  work:     'Run',
  rest:     'Rest',
  warmup:   'Warm up',
  cooldown: 'Cool down',
}

const SOURCES: Record<SoundThemeId, number> = {
  beep:    require('../../assets/sounds/beep.mp3'),
  bell:    require('../../assets/sounds/bell.mp3'),
  gong:    require('../../assets/sounds/gong.mp3'),
  whistle: require('../../assets/sounds/whistle.mp3'),
}

class CuePlayer {
  private sounds = new Map<SoundThemeId, Audio.Sound>()
  private audioModeReady = false

  private async ensureAudioMode(): Promise<void> {
    if (this.audioModeReady) return
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    })
    this.audioModeReady = true
  }

  private async load(theme: SoundThemeId): Promise<Audio.Sound> {
    const existing = this.sounds.get(theme)
    if (existing) return existing

    await this.ensureAudioMode()
    const { sound } = await Audio.Sound.createAsync(SOURCES[theme], {
      shouldPlay: false,
      progressUpdateIntervalMillis: 0,
    })
    this.sounds.set(theme, sound)
    return sound
  }

  async play(theme: SoundThemeId): Promise<void> {
    try {
      const sound = await this.load(theme)
      await sound.replayAsync()
    } catch {
      // Ignore audio failures and keep the timer moving.
    }
  }

  async speak(cue: PhaseType | 'complete' | string): Promise<void> {
    try {
      const text = cue === 'complete'
        ? 'Done'
        : PHASE_VOICE_TEXT[cue as PhaseType] ?? cue
      Speech.stop()
      Speech.speak(text, { rate: 0.9 })
    } catch {
      // Ignore speech failures.
    }
  }

  async unloadAll(): Promise<void> {
    await Promise.all(
      Array.from(this.sounds.values()).map(async sound => {
        try {
          await sound.unloadAsync()
        } catch {
          // Ignore cleanup failures.
        }
      }),
    )
    this.sounds.clear()
  }
}

export const cuePlayer = new CuePlayer()
