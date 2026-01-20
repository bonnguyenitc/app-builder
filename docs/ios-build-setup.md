# iOS Build Setup Guide

## Overview

The iOS build process now uses the standard Xcode archive and export workflow, similar to production builds. This ensures your builds are properly signed and ready for distribution.

## Build Process

The iOS build consists of two steps:

1. **Archive**: Creates an `.xcarchive` from your project
2. **Export**: Exports the archive to an `.ipa` file using export options

### Commands Used

```bash
# Step 1: Archive
xcodebuild -workspace <project>.xcworkspace \
  -scheme "<scheme>" \
  -sdk iphoneos \
  -configuration Release \
  archive \
  -archivePath ./build/<project>.xcarchive

# Step 2: Export
xcodebuild -exportArchive \
  -archivePath ./build/<project>.xcarchive \
  -exportOptionsPlist <ExportOptions>.plist \
  -exportPath ./build
```

## Required Setup

### 1. Export Options Plist

You need to create an `ExportOptions.plist` file in your iOS project directory. The builder will look for these files in order:

- `<Configuration>ExportOptions.plist` (e.g., `ReleaseExportOptions.plist`)
- `ExportOptions.plist`
- `DevelopmentExportOptions.plist`

### 2. Sample ExportOptions.plist

Create a file named `ExportOptions.plist` in your `ios/` directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Method: app-store, ad-hoc, enterprise, development -->
    <key>method</key>
    <string>development</string>

    <!-- Your Team ID from Apple Developer Account -->
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>

    <!-- Upload symbols for crash reporting -->
    <key>uploadSymbols</key>
    <true/>

    <!-- Compile bitcode (optional, deprecated in Xcode 14+) -->
    <key>compileBitcode</key>
    <false/>

    <!-- Signing style: automatic or manual -->
    <key>signingStyle</key>
    <string>automatic</string>

    <!-- Provisioning profiles (for manual signing) -->
    <!--
    <key>provisioningProfiles</key>
    <dict>
        <key>com.yourcompany.yourapp</key>
        <string>Your Provisioning Profile Name</string>
    </dict>
    -->
</dict>
</plist>
```

### 3. Export Methods

Choose the appropriate method based on your distribution target:

- **`development`**: For testing on registered devices
- **`ad-hoc`**: For distribution outside the App Store to registered devices
- **`app-store`**: For App Store submission
- **`enterprise`**: For enterprise distribution (requires enterprise account)

### 4. Project Configuration

In the app builder, you can configure:

- **Scheme**: The Xcode scheme to build (defaults to project name)
- **Configuration**: Build configuration (defaults to "Release")

These can be set when adding or editing a project.

## Build Output

After a successful build, you'll find:

- **Archive**: `ios/build/<project>.xcarchive`
- **IPA**: `ios/build/<project>.ipa`
- **Export logs**: `ios/build/ExportOptions.plist` (copy of used options)

## Troubleshooting

### "Export options plist not found"

Create an `ExportOptions.plist` file in your `ios/` directory using the template above.

### "Code signing error"

1. Make sure you have valid signing certificates installed
2. Check your Team ID in `ExportOptions.plist`
3. Verify your provisioning profiles are up to date
4. Consider using `automatic` signing style

### "Scheme not found"

1. Check that the scheme name matches your project
2. Ensure the scheme is marked as "Shared" in Xcode
3. Update the scheme in project settings if needed

### "Workspace not found"

The builder automatically detects:

- `.xcworkspace` files (for CocoaPods/SPM projects)
- `.xcodeproj` files (for standalone projects)

Make sure at least one exists in your `ios/` directory.

## Advanced Configuration

### Multiple Export Options

You can create different export options for different configurations:

- `DevelopmentExportOptions.plist` - for Development builds
- `ReleaseExportOptions.plist` - for Release builds
- `AdHocExportOptions.plist` - for Ad-Hoc distribution

The builder will automatically use the one matching your configuration.

### Custom Archive Path

The archive is always created at `ios/build/<project>.xcarchive`. This keeps builds organized and makes them easy to find.

## Example Workflow

1. **Setup**: Create `ExportOptions.plist` with your Team ID
2. **Configure**: Set scheme and configuration in project settings
3. **Build**: Click "Build iOS" button
4. **Monitor**: Watch build logs in real-time
5. **Access**: Click "Open Folder" to view the `.ipa` file

## Notes

- The build process requires Xcode Command Line Tools
- Builds are performed on the device running the app builder
- Make sure you have sufficient disk space for archives
- Archives can be large (100MB - 1GB+)
