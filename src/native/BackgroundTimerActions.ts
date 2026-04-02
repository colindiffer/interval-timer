import { NativeModules, Platform } from 'react-native'

type NativeBackgroundTimerActionsModule = {
  readAndClearCommand: () => Promise<string | null>
}

const nativeModule: NativeBackgroundTimerActionsModule | undefined =
  NativeModules.BackgroundTimerActions

export type NativeBackgroundTimerCommand = 'pause' | 'resume' | 'skip'

export async function readAndClearNativeBackgroundCommand(): Promise<NativeBackgroundTimerCommand | null> {
  if (Platform.OS !== 'android' || !nativeModule?.readAndClearCommand) {
    return null
  }

  const command = await nativeModule.readAndClearCommand()
  if (command === 'pause' || command === 'resume' || command === 'skip') {
    return command
  }

  return null
}
