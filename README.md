# App Builder

<p align="center">
  <img src="app-icon.png" alt="App Builder Icon" width="128" height="128" style="border-radius: 20px" />
</p>

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust)

A cross-platform desktop application that automates the build and release process for mobile apps in **React Native** and **Flutter** projects. Supports building iOS (.ipa) and Android (.aab/.apk) with direct upload capabilities to App Store Connect and Google Play Store.

---

## ✨ Key Features

### 📱 Project Management

- Add and manage multiple React Native/Flutter projects
- Automatically read project info from `app.json`, `Info.plist`, `build.gradle`
- Support iOS-specific configurations (scheme, configuration, export method)
- Track version and build number for each platform

### 🔨 iOS Build

- Build IPA using `xcodebuild`
- Support export methods: Development, Ad-hoc, App Store, Enterprise
- Configure Team ID and signing certificates
- Direct upload to **App Store Connect** via `xcrun altool`

### 🤖 Android Build

- Build AAB/APK using Gradle
- Support Service Account configuration for uploading
- ⏳ _Upload to Google Play Store (in development)_

### 📋 Build Queue Management

- Real-time build status monitoring
- Cancel running builds
- View detailed logs for each build process

### 📜 Release History

- Store history of all builds
- Release notes for each build
- Open output folder for completed builds
- View log files from previous builds

### 🔐 Credential Management

- Securely store iOS App Store Connect API Keys
- Manage Google Play Service Accounts
- Encrypt and secure credentials using Keyring

---

## 🗺️ Roadmap

### ✅ Completed

- [x] React Native/Flutter project management
- [x] Auto-read info from native files (Info.plist, build.gradle)
- [x] iOS build with xcodebuild
- [x] Upload IPA to App Store Connect
- [x] Android AAB/APK build with Gradle
- [x] Build queue management and cancellation
- [x] Build history with release notes
- [x] Secure credential management
- [x] View build log files

### 🚧 In Development

- [ ] **Upload AAB to Google Play Store** - Gradle Play Publisher integration
- [ ] Improved credential management UI

### 📋 Future Plans

- [ ] Windows/Linux build support (Android only)
- [ ] CI/CD pipeline integration
- [ ] Multiple build configurations support
- [ ] Build completion notifications
- [ ] Firebase App Distribution integration
- [ ] TestFlight upload and management
- [ ] Provisioning profile management
- [ ] Automatic code signing support
- [ ] Auto-increment build numbers
- [ ] Build reports and statistics

---

## 🛠️ System Requirements

### Required

- **macOS** (required for iOS builds, also recommended for Android)
- **Node.js** >= 18.x
- **Rust** >= 1.70
- **Xcode** >= 15.0 (for iOS builds)
- **Android Studio** with SDK >= 33 (for Android builds)

### For iOS Builds

- Xcode Command Line Tools
- Apple Developer Account
- App Store Connect API Key (for uploading)

### For Android Builds

- JDK 17+
- Android SDK and Build Tools
- Google Play Service Account (for uploading)

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/app-builder.git
cd app-builder
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Rust dependencies are installed automatically during build
```

### 3. Run Application (Development Mode)

```bash
npm run tauri dev
```

### 4. Build Application (Production)

```bash
npm run tauri build
```

---

## 📖 User Guide

### 1. Add a New Project

1. Open the application and go to the **Projects** page
2. Click the **Add Project** button
3. Select the root folder of your React Native/Flutter project
4. The application will automatically read project info:
   - **React Native**: Reads from `app.json`, `ios/<project>/Info.plist`, `android/app/build.gradle`
   - **Flutter**: Reads from `pubspec.yaml`, `ios/Runner/Info.plist`, `android/app/build.gradle`
5. Adjust the information if needed and save

### 2. Configure Credentials

#### iOS - App Store Connect API Key

**Step 1: Create API Key on App Store Connect**

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Go to **Users and Access** (top left corner)
3. Select the **Integrations** tab → **Team Keys**
4. Click the **Generate API Key** button (or the **+** icon)
5. Enter a name for the key (e.g., "App Builder Key")
6. Select **Admin** or **App Manager** role (upload permission required)
7. Click **Generate**
8. **Important**: Download the `.p8` file immediately - you can only download it once!
9. Note down the following information:
   - **Key ID**: Displayed in the keys list (e.g., `ABC123XYZ`)
   - **Issuer ID**: Displayed at the top of the Keys page (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

> 💡 **Tip**: Store the `.p8` file in a safe place. If lost, you'll need to create a new key.

**Storing the `.p8` File**

After downloading, rename the file to `AuthKey_<KEY_ID>.p8` (e.g., `AuthKey_ABC123XYZ.p8`) and save it to **one of the following paths** so `xcrun altool` can automatically find it:

| #   | Path                               | Description                 |
| --- | ---------------------------------- | --------------------------- |
| 1   | `./private_keys/`                  | Current project directory   |
| 2   | `~/private_keys/`                  | Home directory              |
| 3   | `~/.private_keys/`                 | Hidden folder (common)      |
| 4   | `~/.appstoreconnect/private_keys/` | App Store Connect directory |

```bash
# Example: Create directory and copy file
mkdir -p ~/.private_keys
cp ~/Downloads/AuthKey_ABC123XYZ.p8 ~/.private_keys/
```

**Step 2: Get Team ID**

1. Go to [Apple Developer Account](https://developer.apple.com/account)
2. Scroll down to **Membership details**
3. **Team ID** is a 10-character string (e.g., `A1B2C3D4E5`)

**Step 3: Add Credential to App Builder**

1. Open the application, go to **Settings** > **Credentials**
2. Click **Add Credential** > select **iOS**
3. Enter the information:
   - **Name**: Identifier name (e.g., "My App ASC Key")
   - **Team ID**: Team ID from Step 2 (10 characters)
   - **API Key ID**: Key ID from Step 1
   - **API Issuer ID**: Issuer ID from Step 1
   - **API Key Content**: Open the `.p8` file with a text editor, copy all content and paste here

#### Android - Google Play Service Account

**Step 1: Create Service Account on Google Cloud Console**

1. Log in to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **IAM & Admin** → **Service Accounts** (left menu)
4. Click **+ CREATE SERVICE ACCOUNT**
5. Enter the information:
   - **Service account name**: e.g., `play-store-upload`
   - **Service account ID**: Auto-generated from name
6. Click **CREATE AND CONTINUE**
7. At **Grant this service account access** step → skip, click **CONTINUE**
8. At **Grant users access** step → skip, click **DONE**

**Step 2: Create JSON Key for Service Account**

1. In the Service Accounts list, click on the service account you just created
2. Go to the **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** → Click **CREATE**
5. The JSON file will download automatically - **keep this file safe!**

**Step 3: Link Service Account to Google Play Console**

1. Log in to [Google Play Console](https://play.google.com/console/)
2. Go to **Settings** (gear icon) → **API access**
3. If not already done, click **Link** to link with Google Cloud Project
4. In the **Service accounts** section, find the service account you created
5. Click **Grant access** next to the service account
6. In the **App permissions** tab:
   - Select the app to grant upload permission
   - Or select **All apps** to use for all applications
7. In the **Account permissions** tab, ensure you have the following permissions:
   - ✅ **Release to production, exclude devices, and use Play App Signing**
   - ✅ **Release apps to testing tracks**
   - ✅ **Manage testing tracks and edit tester lists**
8. Click **Invite user** → **Send invite**

> ⚠️ **Note**: Permissions may take up to 24 hours to take effect.

**Step 4: Add Credential to App Builder**

1. Open the application, go to **Settings** > **Credentials**
2. Click **Add Credential** > select **Android**
3. Enter the information:
   - **Name**: Identifier name (e.g., "My Play Store Account")
   - **Service Account JSON**: Open the JSON file from Step 2, copy all content and paste here

### 3. Build iOS

1. On the **Projects** page, find the project to build
2. Click the **Build iOS** button (Apple icon)
3. Fill in the information:
   - **Release Note**: Release notes (required)
   - **Upload to App Store**: Enable to upload after successful build
4. Click **Build** to start

#### iOS Build Configuration (in Edit Project)

- **Scheme**: Xcode project scheme (usually the app name)
- **Configuration**: `Release` or `Debug`
- **Export Method**:
  - `development`: For testing on devices
  - `ad-hoc`: Internal distribution
  - `app-store`: Submit to App Store
  - `enterprise`: For enterprise distribution

### 4. Build Android

1. On the **Projects** page, find the project to build
2. Click the **Build Android** button (Android icon)
3. Fill in the information:
   - **Release Note**: Release notes (required)
   - **Upload to Play Store**: Enable to upload after successful build
4. Click **Build** to start

### 5. Monitor Build Queue

1. Go to the **Build Queue** page to view running builds
2. Each build displays:
   - Project name and platform
   - Status and progress
   - **Cancel** button to abort if needed

### 6. View Build History

1. Go to the **History** page to view all builds
2. For each build, you can:
   - View status (Success/Failed)
   - Read release notes
   - **Open Folder**: Open the folder containing output files (.ipa/.aab)
   - **View Log**: View detailed build process logs

---

## 📁 Project Structure

```
app-builder/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Page components
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript types
│   └── styles/             # CSS styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri commands
│   │   │   ├── build.rs    # Build logic iOS/Android
│   │   │   ├── project.rs  # Project management
│   │   │   ├── credentials.rs # Credential management
│   │   │   └── history.rs  # Build history
│   │   └── models/         # Data models
│   └── tauri.conf.json     # Tauri configuration
└── package.json
```

---

## 🔧 Configuration

### Output File Locations

- **iOS**: `<project_path>/ios/build/`
- **Android**: `<project_path>/android/app/build/outputs/bundle/release/`

### Build Logs

Logs are saved in the system's temporary directory:

- Format: `<project_name>_<platform>_build_<timestamp>.log`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Credits

- Built with [Tauri](https://tauri.app/)
- UI powered by [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- Icons by [Lucide](https://lucide.dev/)
- State management by [Zustand](https://github.com/pmndrs/zustand)
