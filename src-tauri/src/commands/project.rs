use crate::models::project::{Project, IosPlatform, AndroidPlatform};
use crate::DbState;
use tauri::{command, Emitter, State};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use plist::Value;
use regex::Regex;

#[derive(Serialize)]
pub struct AppJsonInfo {
    pub name: Option<String>,
    pub ios_bundle_id: Option<String>,
    pub android_package: Option<String>,
    pub ios_version: Option<String>,
    pub android_version: Option<String>,
    pub ios_build_number: Option<String>,
    pub android_version_code: Option<u32>,
    pub android_build_command: Option<String>,
}

// ... existing structs ...

#[derive(Deserialize)]
struct IosConfig {
    #[serde(rename = "bundleIdentifier")]
    bundle_identifier: Option<String>,
    version: Option<String>,
    #[serde(rename = "buildNumber")]
    build_number: Option<String>,
}

#[derive(Deserialize)]
struct AndroidConfig {
    package: Option<String>,
    version: Option<String>,
    #[serde(rename = "versionCode")]
    version_code: Option<u32>,
    #[serde(rename = "buildCommand")]
    build_command: Option<String>,
}

#[derive(Deserialize)]
struct AppJson {
    name: Option<String>,
    ios: Option<IosConfig>,
    android: Option<AndroidConfig>,
}

fn update_ios_info_plist(project_path: &str, version: &str, build_number: &str) -> Result<(), String> {
    let ios_dir = Path::new(project_path).join("ios");
    if !ios_dir.exists() {
        return Ok(());
    }

    // Find .xcodeproj to get the project name
    let entries = fs::read_dir(&ios_dir).map_err(|e| e.to_string())?;
    let mut project_name = None;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();
        if file_name_str.ends_with(".xcodeproj") {
            project_name = Some(file_name_str.trim_end_matches(".xcodeproj").to_string());
            break;
        }
    }

    if let Some(name) = project_name {
        let plist_path = ios_dir.join(&name).join("Info.plist");
        if plist_path.exists() {
            let mut value = Value::from_file(&plist_path).map_err(|e| e.to_string())?;

            if let Some(dict) = value.as_dictionary_mut() {
                dict.insert(
                    "CFBundleShortVersionString".to_string(),
                    Value::String(version.to_string()),
                );
                dict.insert(
                    "CFBundleVersion".to_string(),
                    Value::String(build_number.to_string()),
                );
            }

            value.to_file_xml(&plist_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

fn update_android_gradle(project_path: &str, version_name: &str, version_code: &str) -> Result<(), String> {
    let gradle_path = Path::new(project_path).join("android/app/build.gradle");
    if !gradle_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&gradle_path).map_err(|e| e.to_string())?;

    // Update version code
    let version_code_regex = Regex::new(r"versionCode\s*=?\s*(\d+)").map_err(|e| e.to_string())?;
    let content = version_code_regex.replace(&content, format!("versionCode {}", version_code));

    // Update version name
    let version_name_regex = Regex::new(r#"versionName\s*=?\s*["']([^"']+)["']"#).map_err(|e| e.to_string())?;
    let content = version_name_regex.replace(&content, format!("versionName \"{}\"", version_name));

    fs::write(&gradle_path, content.to_string()).map_err(|e| e.to_string())?;

    Ok(())
}

fn update_build_json(
    project_path: &str,
    project_name: &str,
    ios_bundle_id: &str,
    ios_version: &str,
    ios_build_number: u32,
    android_package: &str,
    android_version: &str,
    android_version_code: u32,
    android_build_command: Option<&str>,
) -> Result<(), String> {
    // Use .app-builder/build.json instead of build.json
    let app_builder_dir = Path::new(project_path).join(".app-builder");
    let build_json_path = app_builder_dir.join("build.json");

    // Create .app-builder directory if it doesn't exist
    if !app_builder_dir.exists() {
        fs::create_dir_all(&app_builder_dir)
            .map_err(|e| format!("Failed to create .app-builder directory: {}", e))?;
    }

    // Create template build.json if it doesn't exist
    if !build_json_path.exists() {
        let template = serde_json::json!({
            "android": {
                "package": android_package,
                "version": android_version,
                "versionCode": android_version_code,
                "buildCommand": android_build_command
            },
            "ios": {
                "bundleIdentifier": ios_bundle_id,
                "version": ios_version,
                "buildNumber": ios_build_number.to_string()
            },
            "name": project_name,
        });

        let template_content = serde_json::to_string_pretty(&template)
            .map_err(|e| format!("Failed to serialize template build.json: {}", e))?;

        fs::write(&build_json_path, template_content)
            .map_err(|e| format!("Failed to create template build.json: {}", e))?;
    }

    let content = fs::read_to_string(&build_json_path)
        .map_err(|e| format!("Failed to read build.json: {}", e))?;

    let mut json_value: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse build.json: {}", e))?;

    // Update name
    json_value["name"] = serde_json::Value::String(project_name.to_string());

    // Update iOS
    if let Some(ios) = json_value.get_mut("ios") {
        if let Some(obj) = ios.as_object_mut() {
            obj.insert(
                "bundleIdentifier".to_string(),
                serde_json::Value::String(ios_bundle_id.to_string()),
            );
            obj.insert(
                "version".to_string(),
                serde_json::Value::String(ios_version.to_string()),
            );
            obj.insert(
                "buildNumber".to_string(),
                serde_json::Value::String(ios_build_number.to_string()),
            );
        }
    }

    // Update Android
    if let Some(android) = json_value.get_mut("android") {
        if let Some(obj) = android.as_object_mut() {
            obj.insert(
                "package".to_string(),
                serde_json::Value::String(android_package.to_string()),
            );
            obj.insert(
                "version".to_string(),
                serde_json::Value::String(android_version.to_string()),
            );
            obj.insert(
                "versionCode".to_string(),
                serde_json::json!(android_version_code),
            );
            obj.insert(
                "buildCommand".to_string(),
                serde_json::json!(android_build_command),
            );
        }
    }



    // Ensure iosConfig, androidConfig, and credentials are not saved
    if let Some(obj) = json_value.as_object_mut() {
        obj.remove("iosConfig");
        obj.remove("androidConfig");
        obj.remove("credentials");
    }

    let new_content = serde_json::to_string_pretty(&json_value)
        .map_err(|e| format!("Failed to serialize build.json: {}", e))?;

    fs::write(&build_json_path, new_content)
        .map_err(|e| format!("Failed to write build.json: {}", e))?;

    Ok(())
}



pub fn is_expo_project(project_path: &std::path::Path) -> bool {
    // Check for app.json or app.config.js (Expo config files)
    let app_json_path = project_path.join("app.json");
    let app_config_js_path = project_path.join("app.config.js");
    let app_config_ts_path = project_path.join("app.config.ts");

    // If app.json exists, check if it has "expo" key
    if app_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&app_json_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if json.get("expo").is_some() {
                    return true;
                }
            }
        }
    }

    // If app.config.js or app.config.ts exists, it's likely an Expo project
    if app_config_js_path.exists() || app_config_ts_path.exists() {
        return true;
    }

    // Check package.json for "expo" dependency
    let package_json_path = project_path.join("package.json");
    if package_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&package_json_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                // Check in dependencies
                if let Some(deps) = json.get("dependencies") {
                    if deps.get("expo").is_some() {
                        return true;
                    }
                }
                // Check in devDependencies
                if let Some(dev_deps) = json.get("devDependencies") {
                    if dev_deps.get("expo").is_some() {
                        return true;
                    }
                }
            }
        }
    }

    false
}

#[command]
pub async fn read_native_project_info(project_path: String) -> Result<AppJsonInfo, String> {
    // Explicitly reject Flutter projects
    if Path::new(&project_path).join("pubspec.yaml").exists() {
        return Err("Flutter projects are not supported. Please select a React Native project.".to_string());
    }

    // First, try to read from .app-builder/build.json if it exists
    let app_builder_dir = Path::new(&project_path).join(".app-builder");
    let build_json_path = app_builder_dir.join("build.json");

    if build_json_path.exists() {
        // If .app-builder/build.json exists, read from it
        if let Ok(content) = fs::read_to_string(&build_json_path) {
            if let Ok(app_json) = serde_json::from_str::<AppJson>(&content) {
                let info = AppJsonInfo {
                    name: app_json.name,
                    ios_bundle_id: app_json.ios.as_ref().and_then(|ios| ios.bundle_identifier.clone()),
                    ios_version: app_json.ios.as_ref().and_then(|ios| ios.version.clone()),
                    android_package: app_json.android.as_ref().and_then(|android| android.package.clone()),
                    android_version: app_json.android.as_ref().and_then(|android| android.version.clone()),
                    ios_build_number: app_json.ios.as_ref().and_then(|ios| ios.build_number.clone()),
                    android_version_code: app_json.android.as_ref().and_then(|android| android.version_code),
                    android_build_command: app_json.android.as_ref().and_then(|android| android.build_command.clone()),
                };
                return Ok(info);
            }
        }
    }

    // If .app-builder/build.json doesn't exist or failed to read, read from native files
    let mut info = AppJsonInfo {
        name: None,
        ios_bundle_id: None,
        ios_version: None,
        android_package: None,
        android_version: None,
        ios_build_number: None,
        android_version_code: None,
        android_build_command: None,
    };

    // Try to extract project name from path
    if let Some(path) = Path::new(&project_path).file_name() {
        info.name = Some(path.to_string_lossy().to_string());
    }

    // Read iOS info from .xcodeproj/project.pbxproj (more reliable than Info.plist)
    let ios_dir = Path::new(&project_path).join("ios");
    if ios_dir.exists() {
        if let Ok(entries) = fs::read_dir(&ios_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy();
                if file_name_str.ends_with(".xcodeproj") {
                    let pbxproj_path = ios_dir
                        .join(file_name_str.as_ref())
                        .join("project.pbxproj");

                    if pbxproj_path.exists() {
                        if let Ok(content) = fs::read_to_string(&pbxproj_path) {
                            // Extract PRODUCT_BUNDLE_IDENTIFIER — the real bundle ID
                            // Matches: PRODUCT_BUNDLE_IDENTIFIER = com.example.app;
                            if info.ios_bundle_id.is_none() {
                                if let Ok(re) = Regex::new(r"PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([A-Za-z0-9._\-]+)\s*;") {
                                    if let Some(cap) = re.captures(&content) {
                                        if let Some(bundle_id) = cap.get(1) {
                                            let bid = bundle_id.as_str().to_string();
                                            // Skip placeholder values
                                            if !bid.contains("$(") && !bid.is_empty() {
                                                info.ios_bundle_id = Some(bid);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Fallback: read Info.plist for version/build info
                    let project_name = file_name_str.trim_end_matches(".xcodeproj");
                    let plist_path = ios_dir.join(project_name).join("Info.plist");
                    if plist_path.exists() {
                        if let Ok(value) = Value::from_file(&plist_path) {
                            if let Some(dict) = value.as_dictionary() {
                                // Only use bundle ID from plist if it's a real value (not a variable)
                                if info.ios_bundle_id.is_none() {
                                    if let Some(Value::String(bundle_id)) = dict.get("CFBundleIdentifier") {
                                        if !bundle_id.contains("$(") {
                                            info.ios_bundle_id = Some(bundle_id.clone());
                                        }
                                    }
                                }
                                if let Some(Value::String(version)) = dict.get("CFBundleShortVersionString") {
                                    if !version.contains("$(") {
                                        info.ios_version = Some(version.clone());
                                    }
                                }
                                if let Some(Value::String(build_number)) = dict.get("CFBundleVersion") {
                                    if !build_number.contains("$(") {
                                        info.ios_build_number = Some(build_number.clone());
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
    }

    // Read Android build.gradle or build.gradle.kts
    let gradle_path = Path::new(&project_path).join("android/app/build.gradle");
    let gradle_kts_path = Path::new(&project_path).join("android/app/build.gradle.kts");
    let gradle_content = if gradle_path.exists() {
        fs::read_to_string(&gradle_path).ok()
    } else if gradle_kts_path.exists() {
        fs::read_to_string(&gradle_kts_path).ok()
    } else {
        None
    };

    if let Some(content) = gradle_content {
        // applicationId "com.example.app" or applicationId = "com.example.app" (kts)
        if let Ok(re) = Regex::new(r#"applicationId\s*=?\s*["']([^"']+)["']"#) {
            if let Some(cap) = re.captures(&content) {
                if let Some(m) = cap.get(1) {
                    info.android_package = Some(m.as_str().to_string());
                }
            }
        }
        // versionName "1.0" or versionName = "1.0" (kts)
        if let Ok(re) = Regex::new(r#"versionName\s*=?\s*["']([^"']+)["']"#) {
            if let Some(cap) = re.captures(&content) {
                if let Some(m) = cap.get(1) {
                    info.android_version = Some(m.as_str().to_string());
                }
            }
        }
        // versionCode 10 or versionCode = 10 (kts)
        if let Ok(re) = Regex::new(r"versionCode\s*=?\s*(\d+)") {
            if let Some(cap) = re.captures(&content) {
                if let Some(m) = cap.get(1) {
                    if let Ok(code) = m.as_str().parse::<u32>() {
                        info.android_version_code = Some(code);
                    }
                }
            }
        }
    }

    Ok(info)
}

#[command]
pub async fn list_projects(state: State<'_, DbState>) -> Result<Vec<Project>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, path, bundle_id_ios, bundle_id_android, version_ios, version_android, build_number_ios, build_number_android, ios_scheme, ios_configuration, ios_team_id, ios_export_method, ios_api_key, ios_api_issuer, ios_credential_id, android_credential_id, slack_notifications, android_build_command, android_firebase_app_id, android_distribution_groups FROM projects")
        .map_err(|e| e.to_string())?;

    let project_iter = stmt
        .query_map([], |row| {
            let ios_scheme: Option<String> = row.get(9)?;
            let ios_configuration: Option<String> = row.get(10)?;
            let ios_team_id: Option<String> = row.get(11)?;
            let ios_export_method: Option<String> = row.get(12)?;
            let ios_api_key: Option<String> = row.get(13)?;
            let ios_api_issuer: Option<String> = row.get(14)?;
            let slack_notifications_json: Option<String> = row.get(17)?;
            let android_firebase_app_id: Option<String> = row.get(19)?;
            let android_distribution_groups: Option<String> = row.get(20)?;

            let notifications = slack_notifications_json.and_then(|s| {
                serde_json::from_str(&s).ok()
            });

            let ios_config = if let (Some(scheme), Some(configuration)) = (ios_scheme.clone(), ios_configuration.clone()) {
                Some(crate::models::project::IosConfig {
                    scheme,
                    configuration,
                    team_id: ios_team_id,
                    export_method: ios_export_method,
                    api_key: ios_api_key,
                    api_issuer: ios_api_issuer,
                })
            } else {
                None
            };

            let android_config = if android_firebase_app_id.is_some() || android_distribution_groups.is_some() {
                Some(crate::models::project::AndroidConfig {
                    firebase_app_id: android_firebase_app_id,
                    distribution_groups: android_distribution_groups,
                })
            } else {
                None
            };

            let p = Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                ios: IosPlatform {
                    bundle_id: row.get(3)?,
                    version: row.get(5)?,
                    build_number: row.get(7)?,
                    config: ios_config,
                },
                android: AndroidPlatform {
                    bundle_id: row.get(4)?,
                    version: row.get(6)?,
                    version_code: row.get(8)?,
                    build_command: row.get(18)?,
                    config: android_config,
                },
                credentials: crate::models::project::ProjectCredentials {
                    ios_id: row.get(15)?,
                    android_id: row.get(16)?,
                },
                notifications,
            };
            println!("Loaded project: {} with credentials: {:?}", p.name, p.credentials);
            Ok(p)
        })
        .map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for project in project_iter {
        projects.push(project.map_err(|e| e.to_string())?);
    }

    Ok(projects)
}

#[command]
pub async fn save_project(state: State<'_, DbState>, project: Project) -> Result<(), String> {
    // Explicitly reject Flutter projects
    if Path::new(&project.path).join("pubspec.yaml").exists() {
        return Err("Flutter projects are not supported. Please select a React Native project.".to_string());
    }

    println!("Saving project: {} (ID: {})", project.name, project.id);
    println!("Project credentials: {:?}", project.credentials);

    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO projects (
            id, name, path,
            bundle_id_ios, bundle_id_android,
            version_ios, version_android,
            build_number_ios, build_number_android,
            ios_scheme, ios_configuration, ios_team_id, ios_export_method,
            ios_api_key, ios_api_issuer, ios_credential_id, android_credential_id,
            slack_notifications, android_build_command,
            android_firebase_app_id, android_distribution_groups
        )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
        params![
            project.id,
            project.name,
            project.path,
            project.ios.bundle_id,
            project.android.bundle_id,
            project.ios.version,
            project.android.version,
            project.ios.build_number,
            project.android.version_code,
            project.ios.config.as_ref().map(|c| &c.scheme),
            project.ios.config.as_ref().map(|c| &c.configuration),
            project.ios.config.as_ref().and_then(|c| c.team_id.as_ref()),
            project.ios.config.as_ref().and_then(|c| c.export_method.as_ref()),
            project.ios.config.as_ref().and_then(|c| c.api_key.as_ref()),
            project.ios.config.as_ref().and_then(|c| c.api_issuer.as_ref()),
            project.credentials.ios_id,
            project.credentials.android_id,
            serde_json::to_string(&project.notifications).unwrap_or_default(),
            project.android.build_command.as_ref(),
            project.android.config.as_ref().and_then(|c| c.firebase_app_id.as_ref()),
            project.android.config.as_ref().and_then(|c| c.distribution_groups.as_ref()),
        ],
    )
    .map_err(|e| e.to_string())?;

    // Update Info.plist
    update_ios_info_plist(
        &project.path,
        &project.ios.version,
        &project.ios.build_number.to_string()
    )?;

    // Update Android build.gradle
    update_android_gradle(
        &project.path,
        &project.android.version,
        &project.android.version_code.to_string()
    )?;

    // Update build.json
    update_build_json(
        &project.path,
        &project.name,
        &project.ios.bundle_id,
        &project.ios.version,
        project.ios.build_number,
        &project.android.bundle_id,
        &project.android.version,
        project.android.version_code,
        project.android.build_command.as_deref(),
    )?;

    Ok(())
}

#[command]
pub async fn delete_project(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    // Delete build history first
    conn.execute("DELETE FROM build_history WHERE project_id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    // Delete project
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn open_xcode(project_path: String) -> Result<(), String> {
    let ios_dir = Path::new(&project_path).join("ios");
    if !ios_dir.exists() {
        return Err("iOS directory not found".to_string());
    }

    // Try to find .xcworkspace first, then .xcodeproj
    let entries = fs::read_dir(&ios_dir).map_err(|e| e.to_string())?;
    let mut target_path = None;

    for entry in entries.flatten() {
        let path = entry.path();
        if let Some(ext) = path.extension() {
            if ext == "xcworkspace" {
                target_path = Some(path);
                break;
            } else if ext == "xcodeproj" && target_path.is_none() {
                target_path = Some(path);
            }
        }
    }

    if let Some(path) = target_path {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open Xcode: {}", e))?;
        Ok(())
    } else {
        Err("No Xcode project or workspace found".to_string())
    }
}

#[command]
pub async fn open_android_studio(project_path: String) -> Result<(), String> {
    let android_dir = Path::new(&project_path).join("android");
    if !android_dir.exists() {
        return Err("Android directory not found".to_string());
    }

    // On macOS, we can use 'open -a "Android Studio" <path>'
    Command::new("open")
        .arg("-a")
        .arg("Android Studio")
        .arg(android_dir)
        .spawn()
        .map_err(|e| format!("Failed to open Android Studio: {}", e))?;

    Ok(())
}

fn is_iterm_available() -> bool {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-Ra", "iTerm"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "macos"))]
    {
        false
    }
}

#[command]
pub async fn start_metro(project_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&project_path);
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }

    let is_expo = is_expo_project(path);
    let start_cmd = if is_expo {
        "npx expo start"
    } else {
        "npx react-native start"
    };

    #[cfg(target_os = "macos")]
    {
        let apple_script = if is_iterm_available() {
            format!(
                r#"
                tell application "iTerm"
                    if exists window 1 then
                        tell current window
                            create tab with default profile
                            tell current session
                                write text "cd '{}' && {}"
                            end tell
                        end tell
                    else
                        create window with default profile
                        tell current session of current window
                            write text "cd '{}' && {}"
                        end tell
                    end if
                    activate
                end tell
                "#,
                project_path, start_cmd, project_path, start_cmd
            )
        } else {
            format!(
                r#"
                tell application "Terminal"
                    do script "cd '{}' && {}"
                    activate
                end tell
                "#,
                project_path, start_cmd
            )
        };

        Command::new("osascript")
            .arg("-e")
            .arg(apple_script)
            .spawn()
            .map_err(|e| format!("Failed to start Metro: {}", e))?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Only macOS is supported for this command".to_string())
    }
}

#[command]
pub async fn open_in_vscode(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-a")
            .arg("Visual Studio Code")
            .arg(project_path)
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}", e))?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Only macOS is supported for this command".to_string())
    }
}
#[command]
pub async fn open_terminal(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let terminal_app = if is_iterm_available() { "iTerm" } else { "Terminal" };
        Command::new("open")
            .arg("-a")
            .arg(terminal_app)
            .arg(project_path)
            .spawn()
            .map_err(|e| format!("Failed to open {}: {}", terminal_app, e))?;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Only macOS is supported for this command".to_string())
    }
}

#[derive(Clone, Serialize)]
struct CreateProjectProgress {
    stage: String,
    message: String,
    is_complete: bool,
    is_error: bool,
}

fn emit_progress(window: &tauri::Window, stage: &str, message: &str, is_complete: bool, is_error: bool) {
    let progress = CreateProjectProgress {
        stage: stage.to_string(),
        message: message.to_string(),
        is_complete,
        is_error,
    };
    let _ = window.emit("create-project-progress", progress);
}

#[command]
pub async fn create_react_native_project(
    window: tauri::Window,
    project_name: String,
    target_path: String,
    package_name: Option<String>,
    app_title: Option<String>,
    version: Option<String>,
    template: Option<String>,
    package_manager: String, // "npm", "yarn", "bun"
    skip_install: bool,
    install_pods: Option<bool>,
    skip_git_init: bool,
) -> Result<String, String> {
    use std::io::{BufRead, BufReader};
    use std::process::Stdio;

    // Validate inputs
    if project_name.is_empty() {
        return Err("Project name cannot be empty".to_string());
    }

    let target_dir = Path::new(&target_path);
    if !target_dir.exists() {
        return Err(format!("Target directory does not exist: {}", target_path));
    }

    let project_dir = target_dir.join(&project_name);
    if project_dir.exists() {
        return Err(format!("Project directory already exists: {}", project_dir.display()));
    }

    emit_progress(&window, "INIT", "Starting React Native CLI project creation...", false, false);

    // Build the command
    let mut args: Vec<String> = vec![
        "-y".to_string(),
        "@react-native-community/cli@latest".to_string(),
        "init".to_string(),
        project_name.clone(),
    ];

    if let Some(pkg) = &package_name {
        if !pkg.is_empty() {
            args.push("--package-name".to_string());
            args.push(pkg.clone());
        }
    }

    if let Some(title) = &app_title {
        if !title.is_empty() {
            args.push("--title".to_string());
            args.push(title.clone());
        }
    }

    if let Some(v) = &version {
        if !v.is_empty() {
            args.push("--version".to_string());
            args.push(v.clone());
        }
    }

    if let Some(t) = &template {
        if !t.is_empty() {
            args.push("--template".to_string());
            args.push(t.clone());
        }
    }

    // Package manager
    args.push("--pm".to_string());
    args.push(package_manager);

    if skip_install {
        args.push("--skip-install".to_string());
    }

    if let Some(pods) = install_pods {
        args.push("--install-pods".to_string());
        args.push(pods.to_string());
    }

    if skip_git_init {
        args.push("--skip-git-init".to_string());
    }

    emit_progress(&window, "EXEC", &format!("Running: npx {}", args.join(" ")), false, false);

    let mut child = Command::new("npx")
        .args(&args)
        .current_dir(&target_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start npx command: {}", e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let window_clone = window.clone();

    if let Some(stdout) = stdout {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            emit_progress(&window_clone, "OUTPUT", &line, false, false);
        }
    }

    if let Some(stderr) = stderr {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            emit_progress(&window_clone, "OUTPUT", &line, false, false);
        }
    }

    let status = child.wait().map_err(|e| format!("Failed to wait for process: {}", e))?;

    if status.success() {
        emit_progress(&window, "COMPLETE", "React Native project created successfully!", true, false);
        Ok(project_dir.to_string_lossy().to_string())
    } else {
        emit_progress(&window, "ERROR", "Failed to create React Native project", true, true);
        Err("Failed to create React Native project".to_string())
    }
}

#[command]
pub async fn create_expo_project(
    window: tauri::Window,
    project_name: String,
    target_path: String,
    package_name: Option<String>,
    app_title: Option<String>,
    template: String,
    version: Option<String>,
    package_manager: String,
    no_git: bool,
    no_install: bool,
) -> Result<String, String> {
    use std::io::{BufRead, BufReader};
    use std::process::Stdio;

    // Validate inputs
    if project_name.is_empty() {
        return Err("Project name cannot be empty".to_string());
    }

    let target_dir = Path::new(&target_path);
    if !target_dir.exists() {
        return Err(format!("Target directory does not exist: {}", target_path));
    }

    let project_dir = target_dir.join(&project_name);
    if project_dir.exists() {
        return Err(format!("Project directory already exists: {}", project_dir.display()));
    }

    emit_progress(&window, "INIT", "Starting Expo project creation...", false, false);

    // In 2026, many CLIs including create-expo-app use the package manager that invoked them.
    let (cmd, mut args) = match package_manager.as_str() {
        "yarn" => ("yarn", vec!["create".to_string(), "expo-app".to_string()]),
        "pnpm" => ("pnpm", vec!["create".to_string(), "expo-app".to_string()]),
        "bun" => ("bun", vec!["create".to_string(), "expo-app".to_string()]),
        _ => ("npx", vec!["-y".to_string(), "create-expo-app@latest".to_string()]),
    };

    args.push(project_name.clone());
    args.push("--yes".to_string());

    let final_template = if let Some(v) = &version {
        if !v.is_empty() { format!("{}@{}", template, v) } else { template }
    } else {
        template
    };
    args.push("--template".to_string());
    args.push(final_template);

    if no_install {
        args.push("--no-install".to_string());
    }

    emit_progress(&window, "EXEC", &format!("Running: {} {}", cmd, args.join(" ")), false, false);

    let mut child = Command::new(cmd)
        .args(&args)
        .current_dir(&target_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start {} command: {}", cmd, e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let window_clone = window.clone();

    if let Some(stdout) = stdout {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            emit_progress(&window_clone, "OUTPUT", &line, false, false);
        }
    }

    if let Some(stderr) = stderr {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            emit_progress(&window_clone, "OUTPUT", &line, false, false);
        }
    }

    let status = child.wait().map_err(|e| format!("Failed to wait for process: {}", e))?;

    if status.success() {
        // Handle no_git manually as create-expo-app doesn't have a reliable flag
        if no_git {
            let git_dir = project_dir.join(".git");
            if git_dir.exists() {
                let _ = fs::remove_dir_all(git_dir);
            }
        }

        // Handle package_name and app_title update in app.json
        if package_name.is_some() || app_title.is_some() {
            let app_json_path = project_dir.join("app.json");
            if app_json_path.exists() {
                if let Ok(content) = fs::read_to_string(&app_json_path) {
                if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(expo) = json.get_mut("expo") {
                            if let Some(title) = &app_title {
                                if !title.is_empty() {
                                    expo["name"] = serde_json::Value::String(title.clone());
                                }
                            }
                            if let Some(pkg) = &package_name {
                                if !pkg.is_empty() {
                                    if let Some(android) = expo.get_mut("android").and_then(|a| a.as_object_mut()) {
                                        android.insert("package".to_string(), serde_json::Value::String(pkg.clone()));
                                    } else {
                                        expo["android"] = serde_json::json!({ "package": pkg });
                                    }
                                    if let Some(ios) = expo.get_mut("ios").and_then(|i| i.as_object_mut()) {
                                        ios.insert("bundleIdentifier".to_string(), serde_json::Value::String(pkg.clone()));
                                    } else {
                                        expo["ios"] = serde_json::json!({ "bundleIdentifier": pkg });
                                    }
                                }
                            }
                            if let Ok(updated_content) = serde_json::to_string_pretty(&json) {
                                let _ = fs::write(&app_json_path, updated_content);
                            }
                        }
                    }
                }
            }
        }

        // Handle package.json version update and re-install if needed
        if let Some(v) = &version {
            if !v.is_empty() {
                let pkg_json_path = project_dir.join("package.json");
                if pkg_json_path.exists() {
                    if let Ok(content) = fs::read_to_string(&pkg_json_path) {
                        if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
                            let mut changed = false;
                            if let Some(deps) = json.get_mut("dependencies").and_then(|d| d.as_object_mut()) {
                                deps.insert("expo".to_string(), serde_json::Value::String(v.clone()));
                                changed = true;
                            }

                            if changed {
                                if let Ok(updated_content) = serde_json::to_string_pretty(&json) {
                                    let _ = fs::write(&pkg_json_path, updated_content);

                                    // If we were supposed to install, we should run it again to sync the specific version
                                    if !no_install {
                                        emit_progress(&window, "SYNC", &format!("Syncing expo version {}...", v), false, false);
                                        let sync_args = vec!["install".to_string()];
                                        // Simple heuristic: just run install, the PM will pick up the change
                                        let _ = Command::new(cmd)
                                            .args(&sync_args)
                                            .current_dir(&project_dir)
                                            .status();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        emit_progress(&window, "COMPLETE", "Expo project created successfully!", true, false);
        Ok(project_dir.to_string_lossy().to_string())
    } else {
        emit_progress(&window, "ERROR", "Failed to create Expo project", true, true);
        Err("Failed to create Expo project".to_string())
    }
}
#[command]
pub async fn get_package_versions(package: String) -> Result<Vec<String>, String> {
    // Use NPM registry HTTP API directly instead of `npm view`
    // This works in release builds where npm may not be in PATH
    let url = format!("https://registry.npmjs.org/{}", package);

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch package info: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Registry returned status {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse registry response: {}", e))?;

    // Use `time` object (chronologically ordered) for reliable newest-first ordering
    // Fallback to `versions` object keys if `time` is missing
    let versions: Vec<String> = if let Some(time_obj) = json.get("time").and_then(|t| t.as_object()) {
        time_obj.keys()
            .filter(|k| *k != "created" && *k != "modified")
            .cloned()
            .collect()
    } else {
        json.get("versions")
            .and_then(|v| v.as_object())
            .map(|obj| obj.keys().cloned().collect())
            .unwrap_or_default()
    };

    // Filter for stable versions (skip alpha/beta/rc/nightly and placeholder 1000.0.0)
    let filtered: Vec<String> = versions
        .into_iter()
        .filter(|v| !v.contains('-') && v != "1000.0.0")
        .rev() // Newest first (reverse chronological)
        .collect();

    Ok(filtered)
}
