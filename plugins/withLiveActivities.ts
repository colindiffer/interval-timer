import { ConfigPlugin, withInfoPlist, withEntitlementsPlist } from '@expo/config-plugins'

const withLiveActivities: ConfigPlugin = (config) => {
  // Add NSSupportsLiveActivities to Info.plist
  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSSupportsLiveActivities'] = true
    return mod
  })

  // Add the live-activities entitlement to the main app
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.live-activities'] = true
    return mod
  })

  return config
}

export default withLiveActivities
