const { withInfoPlist, withXcodeProject } = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

const ensureFile = (filePath, contents) => {
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== contents) {
    fs.writeFileSync(filePath, contents)
  }
}

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
    const widgetInfoPlistPath = path.join(widgetDir, `${widgetName}-Info.plist`)
    const widgetEntitlementsPath = path.join(widgetDir, `${widgetName}.entitlements`)

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

    ensureFile(
      widgetInfoPlistPath,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>${widgetName}</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>
`
    )

    ensureFile(
      widgetEntitlementsPath,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.live-activities</key>
  <true/>
</dict>
</plist>
`
    )

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
        config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = widgetBundleId
        config.buildSettings.INFOPLIST_FILE = `${widgetName}/${widgetName}-Info.plist`
        config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${widgetName}/${widgetName}.entitlements`
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
