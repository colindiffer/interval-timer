const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins')

const withLiveActivities = (config) => {
  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSSupportsLiveActivities'] = true
    return mod
  })

  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.live-activities'] = true
    return mod
  })

  return config
}

module.exports = withLiveActivities
