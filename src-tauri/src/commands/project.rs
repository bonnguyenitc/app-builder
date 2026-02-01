use crate::models::project::{Project, IosPlatform, AndroidPlatform};
use crate::DbState;
use tauri::{command, State};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
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
                "versionCode": android_version_code
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
    };

    // Try to extract project name from path
    if let Some(path) = Path::new(&project_path).file_name() {
        info.name = Some(path.to_string_lossy().to_string());
    }

    // Read iOS Info.plist
    let ios_dir = Path::new(&project_path).join("ios");
    if ios_dir.exists() {
        if let Ok(entries) = fs::read_dir(&ios_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name();
                let file_name_str = file_name.to_string_lossy();
                if file_name_str.ends_with(".xcodeproj") {
                    let project_name = file_name_str.trim_end_matches(".xcodeproj");
                    let plist_path = ios_dir.join(project_name).join("Info.plist");

                    if plist_path.exists() {
                        if let Ok(value) = Value::from_file(&plist_path) {
                            if let Some(dict) = value.as_dictionary() {
                                // Get bundle identifier
                                if let Some(Value::String(bundle_id)) = dict.get("CFBundleIdentifier") {
                                    info.ios_bundle_id = Some(bundle_id.clone());
                                }
                                // Get version
                                if let Some(Value::String(version)) = dict.get("CFBundleShortVersionString") {
                                    info.ios_version = Some(version.clone());
                                }
                                // Get build number
                                if let Some(Value::String(build_number)) = dict.get("CFBundleVersion") {
                                    info.ios_build_number = Some(build_number.clone());
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
    }

    // Read Android build.gradle
    let gradle_path = Path::new(&project_path).join("android/app/build.gradle");
    if gradle_path.exists() {
        if let Ok(content) = fs::read_to_string(&gradle_path) {
            // Extract applicationId
            if let Ok(app_id_regex) = Regex::new(r#"applicationId\s*=?\s*["']([^"']+)["']"#) {
                if let Some(captures) = app_id_regex.captures(&content) {
                    if let Some(app_id) = captures.get(1) {
                        info.android_package = Some(app_id.as_str().to_string());
                    }
                }
            }

            // Extract versionName
            if let Ok(version_name_regex) = Regex::new(r#"versionName\s*=?\s*["']([^"']+)["']"#) {
                if let Some(captures) = version_name_regex.captures(&content) {
                    if let Some(version) = captures.get(1) {
                        info.android_version = Some(version.as_str().to_string());
                    }
                }
            }

            // Extract versionCode
            if let Ok(version_code_regex) = Regex::new(r"versionCode\s*=?\s*(\d+)") {
                if let Some(captures) = version_code_regex.captures(&content) {
                    if let Some(code) = captures.get(1) {
                        if let Ok(code_num) = code.as_str().parse::<u32>() {
                            info.android_version_code = Some(code_num);
                        }
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
        .prepare("SELECT id, name, path, bundle_id_ios, bundle_id_android, version_ios, version_android, build_number_ios, build_number_android, ios_scheme, ios_configuration, ios_team_id, ios_export_method, ios_api_key, ios_api_issuer, ios_credential_id, android_credential_id, slack_notifications FROM projects")
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
            slack_notifications
        )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
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
