const { withInfoPlist, withXcodeProject } = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

// Add NSSupportsLiveActivities to the main app
const withLiveActivitySettings = (config) => {
  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSSupportsLiveActivities'] = true
    return mod
  })

  return config
}

// Copy widget Swift files into the ios folder and add the extension target
const withWidgetExtension = (config) => {
  return withXcodeProject(config, async (mod) => {
    const xcodeProject = mod.modResults
    const projectRoot = mod.modRequest.projectRoot
    const platformProjectRoot = mod.modRequest.platformProjectRoot // ios/

    const widgetName = 'IntervalTimerWidget'
    const widgetBundleId = 'com.differapps.intervaltimer.IntervalTimerWidget'
    const widgetDir = path.join(platformProjectRoot, widgetName)
    const sourceDir = path.join(projectRoot, 'targets', widgetName)

    // Copy Swift files from targets/ into ios/IntervalTimerWidget/
    if (!fs.existsSync(widgetDir)) {
      fs.mkdirSync(widgetDir, { recursive: true })
    }

    const swiftFiles = fs.readdirSync(sourceDir).filter(f => f.endsWith('.swift'))
    for (const file of swiftFiles) {
      fs.copyFileSync(
        path.join(sourceDir, file),
        path.join(widgetDir, file)
      )
    }

    // Check if target already exists
    const existingTarget = xcodeProject.pbxTargetByName(widgetName)
    if (existingTarget) {
      return mod
    }

    // Add widget extension target
    const target = xcodeProject.addTarget(
      widgetName,
      'app_extension',
      widgetName,
      widgetBundleId
    )

    // Add build phase for Swift files
    xcodeProject.addBuildPhase(
      swiftFiles.map(f => `${widgetName}/${f}`),
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid
    )

    // Add required frameworks
    xcodeProject.addFramework('SwiftUI.framework', { target: target.uuid })
    xcodeProject.addFramework('WidgetKit.framework', { target: target.uuid })
    xcodeProject.addFramework('ActivityKit.framework', { target: target.uuid })

    // Set build settings
    const configurations = xcodeProject.pbxXCBuildConfigurationSection()
    for (const key of Object.keys(configurations)) {
      const config = configurations[key]
      if (
        config &&
        typeof config === 'object' &&
        config.buildSettings &&
        config.buildSettings.PRODUCT_NAME === `"${widgetName}"`
      ) {
        config.buildSettings.SWIFT_VERSION = '5.0'
        config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.2'
        config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"'
        config.buildSettings.SKIP_INSTALL = 'NO'
        config.buildSettings.BUNDLE_LOADER = undefined
      }
    }

    return mod
  })
}

const withLiveActivities = (config) => {
  config = withLiveActivitySettings(config)
  config = withWidgetExtension(config)
  return config
}

module.exports = withLiveActivities
