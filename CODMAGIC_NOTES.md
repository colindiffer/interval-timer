# Codemagic iOS Build Notes

This file records recent Codemagic iOS build issues and the workflow changes made to address them, so future debugging has local context inside the repo.

## Current workflow status

The Codemagic workflow lives in `codemagic.yaml`.

Recent fixes already pushed to `main`:

- `3acfdbc` Fix `--export-xcargs` parsing by binding the value directly as `--export-xcargs=-allowProvisioningUpdates`
- `4000bc7` Restore `xcode-project use-profiles` before `build-ipa`
- `65b1e73` Switch to `npm ci --ignore-scripts` and extract focused build diagnostics on failure
- `419f9a2` Preserve `note:`, `warning:`, and full raw xcode logs as artifacts

## Why those changes were made

### 1. `--export-xcargs` parsing failure

Codemagic failed with:

`xcode-project build-ipa: error: argument --export-xcargs: expected one argument`

Cause:

The value started with `-`, so the CLI treated it like a new flag instead of the argument value.

Fix:

Use:

`--export-xcargs=-allowProvisioningUpdates`

### 2. Missing export options plist

Codemagic then failed with:

`xcode-project: error: argument --export-options-plist: Path "/Users/builder/export_options.plist" does not exist`

Cause:

The workflow was missing the signing-prep step that Codemagic expects before export.

Fix:

Restore:

`xcode-project use-profiles`

### 3. Archive failures with truncated logs

Later builds failed with Xcode archive status `65`, but the console output only showed warnings and notes, not the real failing line.

Fixes:

- use `npm ci --ignore-scripts` for deterministic dependency install
- preserve focused diagnostics in `build/ios/diagnostics/xcode-errors.txt`
- copy the full raw log to `build/ios/diagnostics/xcodebuild-full.log`

## Important artifact paths

When Codemagic fails, inspect these first:

- `build/ios/diagnostics/xcode-errors.txt`
- `build/ios/diagnostics/xcodebuild-full.log`
- `/tmp/xcodebuild_logs/*.log`

The filtered file now includes lines matching:

- `note:`
- `warning:`
- `error:`
- `ARCHIVE FAILED`
- `The following build commands failed`
- `Unable to resolve module`
- signing/profile related messages

## Known historical error worth remembering

An earlier diagnostic log in this workspace showed Metro failing during iOS bundling with:

`Unable to resolve module prop-types from @invertase/react-native-apple-authentication/lib/AppleButton.ios.js`

At the moment, `prop-types` is already present in both `package.json` and `package-lock.json`, so if that error appears again it likely means the CI install did not match the committed lockfile or the build was run from an older commit state.

## Next debugging rule

If the next Codemagic build fails:

1. Open `build/ios/diagnostics/xcode-errors.txt`
2. If the root cause is still unclear, open `build/ios/diagnostics/xcodebuild-full.log`
3. Ignore generic `note:` preview messages unless they appear immediately around a real `error:`
4. Treat the first actual compiler, bundler, signing, or provisioning error as the source of truth
