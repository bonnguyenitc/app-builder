use tauri::command;
use std::path::{Path, PathBuf};
use std::fs;
use serde::{Serialize, Deserialize};
use regex::Regex;
use plist::Value;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Permission {
    pub key: String,
    pub name: String,
    pub enabled: bool,
    pub description: Option<String>,
    pub explanation: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PermissionsResult {
    pub android_path: Option<String>,
    pub ios_path: Option<String>,
    pub android: Vec<Permission>,
    pub ios: Vec<Permission>,
}

// Common Android Permissions
const ANDROID_PERMISSIONS: &[(&str, &str, &str)] = &[
    ("android.permission.CAMERA", "Camera", "Required to be able to access the camera device."),
    ("android.permission.INTERNET", "Internet", "Allows applications to open network sockets. Standard for most apps."),
    ("android.permission.ACCESS_FINE_LOCATION", "Fine Location", "Allows an app to access precise location (GPS)."),
    ("android.permission.ACCESS_COARSE_LOCATION", "Coarse Location", "Allows an app to access approximate location (Network-based)."),
    ("android.permission.READ_EXTERNAL_STORAGE", "Read External Storage", "Read files from storage. Note: On Android 13+ (API 33), use granular READ_MEDIA_* permissions instead."),
    ("android.permission.WRITE_EXTERNAL_STORAGE", "Write External Storage", "Write files to storage. Note: Deprecated in API 29 (Android 10), irrelevant for API 33+."),
    ("android.permission.RECORD_AUDIO", "Microphone", "Allows an application to record audio."),
    ("android.permission.BLUETOOTH", "Bluetooth (Legacy)", "Legacy: Connect to paired Bluetooth devices. For Android 12+ (API 31), use BLUETOOTH_CONNECT."),
    ("android.permission.BLUETOOTH_ADMIN", "Bluetooth Admin (Legacy)", "Legacy: Discover/pair Bluetooth devices. For Android 12+ (API 31), use BLUETOOTH_SCAN/ADVERTISE."),
    ("android.permission.BLUETOOTH_SCAN", "Bluetooth Scan", "New in Android 12 (API 31). Required to look for Bluetooth devices."),
    ("android.permission.BLUETOOTH_CONNECT", "Bluetooth Connect", "New in Android 12 (API 31). Required to connect to paired Bluetooth devices."),
    ("android.permission.BLUETOOTH_ADVERTISE", "Bluetooth Advertise", "New in Android 12 (API 31). Required to advertise to nearby Bluetooth devices."),
    ("android.permission.ACCESS_WIFI_STATE", "Access Wifi State", "Allows applications to access information about Wi-Fi networks."),
    ("android.permission.READ_PHONE_STATE", "Read Phone State", "Allows read only access to phone state. Special runtime permission."),
    ("android.permission.VIBRATE", "Vibrate", "Allows access to the vibrator."),
    ("android.permission.WAKE_LOCK", "Wake Lock", "Allows using PowerManager WakeLocks to keep processor from sleeping or screen from dimming."),
    ("android.permission.RECEIVE_BOOT_COMPLETED", "Receive Boot Completed", "Allows an application to receive the ACTION_BOOT_COMPLETED that is broadcast after the system finishes booting."),
    ("android.permission.POST_NOTIFICATIONS", "Post Notifications", "New in Android 13 (API 33). Required to post notifications."),
    ("android.permission.READ_MEDIA_IMAGES", "Read Media Images", "New in Android 13 (API 33). Granular access to image files."),
    ("android.permission.READ_MEDIA_VIDEO", "Read Media Video", "New in Android 13 (API 33). Granular access to video files."),
    ("android.permission.READ_MEDIA_AUDIO", "Read Media Audio", "New in Android 13 (API 33). Granular access to audio files."),
    ("android.permission.NFC", "NFC", "Allows applications to perform I/O operations over NFC."),
    ("android.permission.USE_BIOMETRIC", "Biometric", "Allows access to the BiometricPrompt API (Fingerprint/Face)."),
    ("android.permission.USE_FINGERPRINT", "Fingerprint (Legacy)", "Legacy: Deprecated in API 28. Use USE_BIOMETRIC instead."),
    ("android.permission.ACTIVITY_RECOGNITION", "Activity Recognition", "Allows an application to recognize physical activity (Walking, Driving, etc.)."),
    ("android.permission.FOREGROUND_SERVICE", "Foreground Service", "Allows a regular application to use Service.startForeground."),
    ("android.permission.FOREGROUND_SERVICE_LOCATION", "Foreground Service (Location)", "Android 14+ (API 34). Required for foreground services that access location."),
    ("android.permission.SCHEDULE_EXACT_ALARM", "Schedule Exact Alarm", "Allows applications to use exact alarm APIs."),
    ("android.permission.SYSTEM_ALERT_WINDOW", "System Alert Window", "Allows an app to create windows using type TYPE_APPLICATION_OVERLAY, shown on top of all other apps."),
    ("android.permission.REQUEST_INSTALL_PACKAGES", "Request Install Packages", "Allows an application to request installing packages."),
];

// Common iOS Permissions
const IOS_PERMISSIONS: &[(&str, &str, &str)] = &[
    ("NSCameraUsageDescription", "Camera", "Key for accessing the camera. iOS requires a usage description string."),
    ("NSPhotoLibraryUsageDescription", "Photo Library", "Key for accessing the user's photo library. iOS requires a usage description string."),
    ("NSPhotoLibraryAddUsageDescription", "Photo Library Add", "Key for adding photos to the user's photo library. iOS requires a usage description string."),
    ("NSLocationWhenInUseUsageDescription", "Location When In Use", "Key for accessing location information while the app is in use. iOS requires a usage description string."),
    ("NSLocationAlwaysUsageDescription", "Location Always", "Key for accessing location information at all times. iOS requires a usage description string."),
    ("NSLocationAlwaysAndWhenInUseUsageDescription", "Location Always & When In Use", "Key for accessing location information at all times (backwards compatibility). iOS requires a usage description string."),
    ("NSMicrophoneUsageDescription", "Microphone", "Key for accessing the microphone. iOS requires a usage description string."),
    ("NSBluetoothAlwaysUsageDescription", "Bluetooth Always", "Key for using Bluetooth. iOS requires a usage description string."),
    ("NSBluetoothPeripheralUsageDescription", "Bluetooth Peripheral", "Key for using Bluetooth peripherals. iOS requires a usage description string."),
    ("NSContactsUsageDescription", "Contacts", "Key for accessing the user's contacts. iOS requires a usage description string."),
    ("NSFaceIDUsageDescription", "FaceID", "Key for accessing Face ID. iOS requires a usage description string."),
    ("NSCalendarsUsageDescription", "Calendars", "Key for accessing the user's calendar. iOS requires a usage description string."),
    ("NSRemindersUsageDescription", "Reminders", "Key for accessing the user's reminders. iOS requires a usage description string."),
    ("NSSpeechRecognitionUsageDescription", "Speech Recognition", "Key for utilizing speech recognition. iOS requires a usage description string."),
    ("NSMotionUsageDescription", "Motion Usage", "Key for accessing motion data. iOS requires a usage description string."),
    ("NSAppleMusicUsageDescription", "Apple Music", "Key for accessing the user's media library. iOS requires a usage description string."),
    ("NSUserTrackingUsageDescription", "User Tracking (ATT)", "Key for requesting permission to track the user (App Tracking Transparency). iOS requires a usage description string."),
    ("NFCReaderUsageDescription", "NFC Reader", "Key for accessing the NFC reader. iOS requires a usage description string."),
    ("NSHealthShareUsageDescription", "Health Share", "Key for reading data from HealthKit. iOS requires a usage description string."),
    ("NSHealthUpdateUsageDescription", "Health Update", "Key for writing data to HealthKit. iOS requires a usage description string."),
    ("NSHomeKitUsageDescription", "HomeKit", "Key for accessing HomeKit data. iOS requires a usage description string."),
    ("NSLocalNetworkUsageDescription", "Local Network", "Key for accessing the local network. iOS requires a usage description string."),
    ("NSSiriUsageDescription", "Siri", "Key for sending requests to Siri. iOS requires a usage description string."),
];


fn get_android_manifest_path(project_path: &Path) -> Option<PathBuf> {
    let possible_paths = vec![
        project_path.join("android/app/src/main/AndroidManifest.xml"),
        project_path.join("android/src/main/AndroidManifest.xml"),
    ];

    for p in possible_paths {
        if p.exists() {
            return Some(p);
        }
    }
    None
}

fn get_ios_plist_path(project_path: &Path) -> Option<PathBuf> {
   let ios_dir = project_path.join("ios");
   if !ios_dir.exists() { return None; }

   // Heuristic: Check for Info.plist in direct subdirs
   if let Ok(entries) = fs::read_dir(ios_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let plist = path.join("Info.plist");
                if plist.exists() {
                    return Some(plist);
                }
            }
        }
   }
   None
}

#[command]
pub fn get_project_permissions(project_path: String) -> Result<PermissionsResult, String> {
    let root = Path::new(&project_path);

    let android_path = get_android_manifest_path(root);
    let ios_path = get_ios_plist_path(root);

    let mut android_perms = Vec::new();
    let mut ios_perms = Vec::new();

    // Parse Android
    if let Some(path) = &android_path {
        if let Ok(content) = fs::read_to_string(path) {
             let re = Regex::new(r#"<uses-permission\s+android:name="([^"]+)""#).map_err(|e| e.to_string())?;
             let found_perms: Vec<String> = re.captures_iter(&content)
                 .map(|cap| cap[1].to_string())
                 .collect();

             for (key, name, explanation) in ANDROID_PERMISSIONS {
                 let enabled = found_perms.contains(&key.to_string());
                 android_perms.push(Permission {
                     key: key.to_string(),
                     name: name.to_string(),
                     enabled,
                     description: None,
                     explanation: Some(explanation.to_string()),
                 });
             }
        }
    } else {
        // Return default list disabled
        for (key, name, explanation) in ANDROID_PERMISSIONS {
            android_perms.push(Permission {
                key: key.to_string(),
                name: name.to_string(),
                enabled: false,
                description: None,
                explanation: Some(explanation.to_string()),
            });
        }
    }

    // Parse iOS
    if let Some(path) = &ios_path {
        let value = plist::Value::from_file(path).map_err(|e| e.to_string())?;
        if let Some(dict) = value.as_dictionary() {
             for (key, name, explanation) in IOS_PERMISSIONS {
                 let enabled = dict.contains_key(*key);
                 let description = if let Some(desc) = dict.get(*key) {
                     desc.as_string().map(|s| s.to_string())
                 } else {
                     None
                 };

                 ios_perms.push(Permission {
                     key: key.to_string(),
                     name: name.to_string(),
                     enabled,
                     description,
                     explanation: Some(explanation.to_string()),
                 });
             }
        }
    } else {
         for (key, name, explanation) in IOS_PERMISSIONS {
             ios_perms.push(Permission {
                 key: key.to_string(),
                 name: name.to_string(),
                 enabled: false,
                 description: None,
                 explanation: Some(explanation.to_string()),
             });
         }
    }

    Ok(PermissionsResult {
        android_path: android_path.map(|p| p.to_string_lossy().to_string()),
        ios_path: ios_path.map(|p| p.to_string_lossy().to_string()),
        android: android_perms,
        ios: ios_perms
    })
}

#[derive(Deserialize, Debug)]
pub struct UpdatePermissionPayload {
    platform: String, // "android" or "ios"
    key: String,
    enabled: bool,
    description: Option<String>, // for iOS
}

#[command]
pub fn update_permission(project_path: String, payload: UpdatePermissionPayload) -> Result<(), String> {
    let root = Path::new(&project_path);

    if payload.platform == "android" {
        let path = get_android_manifest_path(root).ok_or("AndroidManifest.xml not found")?;
        let mut content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

        // 1. Remove existing
        let regex_str = format!(r#"(?m)^\s*<uses-permission\s+android:name="{}"\s*/>\s*"#, regex::escape(&payload.key));
        let re = Regex::new(&regex_str).map_err(|e| e.to_string())?;
        content = re.replace_all(&content, "").to_string();

        // 2. Insert if enabled
        if payload.enabled {
             let perm_str = format!(r#"<uses-permission android:name="{}" />"#, payload.key);

             // Find insertion point (before <application>)
             let app_re = Regex::new(r"<application").map_err(|e| e.to_string())?;
             if let Some(mat) = app_re.find(&content) {
                 let start = mat.start();
                 let insert_str = format!("    {}\n    ", perm_str);
                 content.insert_str(start, &insert_str);
             } else {
                 return Err("Could not find <application> tag".to_string());
             }
        }

        fs::write(path, content).map_err(|e| e.to_string())?;

    } else if payload.platform == "ios" {
        let path = get_ios_plist_path(root).ok_or("Info.plist not found")?;
        let mut value = plist::Value::from_file(&path).map_err(|e| e.to_string())?;

        if let Some(dict) = value.as_dictionary_mut() {
            if payload.enabled {
                let desc = payload.description.unwrap_or_else(|| "Access needed".to_string());
                dict.insert(payload.key, Value::String(desc));
            } else {
                dict.remove(&payload.key);
            }
        }

        value.to_file_xml(path).map_err(|e| e.to_string())?;
    }

    Ok(())
}
