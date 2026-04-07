import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins'

const withLiveActivities: ConfigPlugin = (config) => {
  // Add NSSupportsLiveActivities to Info.plist
  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSSupportsLiveActivities'] = true
    mod.modResults['NSSupportsLiveActivitiesFrequentUpdates'] = true
    return mod
  })

  return config
}

export default withLiveActivities
