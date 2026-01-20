use crate::models::project::{Project, BundleId, VersionInfo, BuildNumberInfo};
use crate::DbState;
use tauri::{command, State};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use plist::Value;

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

#[command]
pub async fn read_app_json(project_path: String) -> Result<AppJsonInfo, String> {
    let build_json_path = Path::new(&project_path).join("build.json");

    let content = fs::read_to_string(&build_json_path)
        .map_err(|e| format!("Failed to read build.json: {}", e))?;

    let app_json: AppJson = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse app.json: {}", e))?;

    let info = AppJsonInfo {
        name: app_json.name,
        ios_bundle_id: app_json.ios.as_ref().and_then(|ios| ios.bundle_identifier.clone()),
        ios_version: app_json.ios.as_ref().and_then(|ios| ios.version.clone()),
        android_package: app_json.android.as_ref().and_then(|android| android.package.clone()),
        android_version: app_json.android.as_ref().and_then(|android| android.version.clone()),
        ios_build_number: app_json.ios.as_ref().and_then(|ios| ios.build_number.clone()),
        android_version_code: app_json.android.as_ref().and_then(|android| android.version_code),
    };

    Ok(info)
}

#[command]
pub async fn list_projects(state: State<'_, DbState>) -> Result<Vec<Project>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, path, bundle_id_ios, bundle_id_android, version_ios, version_android, build_number_ios, build_number_android, ios_scheme, ios_configuration, ios_team_id, ios_export_method FROM projects")
        .map_err(|e| e.to_string())?;

    let project_iter = stmt
        .query_map([], |row| {
            let ios_scheme: Option<String> = row.get(9)?;
            let ios_configuration: Option<String> = row.get(10)?;
            let ios_team_id: Option<String> = row.get(11)?;
            let ios_export_method: Option<String> = row.get(12)?;

            let ios_config = if let (Some(scheme), Some(configuration)) = (ios_scheme.clone(), ios_configuration.clone()) {
                Some(crate::models::project::IosConfig {
                    scheme,
                    configuration,
                    team_id: ios_team_id,
                    export_method: ios_export_method,
                })
            } else {
                None
            };

            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                bundle_id: BundleId {
                    ios: row.get(3)?,
                    android: row.get(4)?,
                },
                version: VersionInfo {
                    ios: row.get(5)?,
                    android: row.get(6)?,
                },
                build_number: BuildNumberInfo {
                    ios: row.get(7)?,
                    android: row.get(8)?,
                },
                ios_config,
            })
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
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO projects (
            id, name, path,
            bundle_id_ios, bundle_id_android,
            version_ios, version_android,
            build_number_ios, build_number_android,
            ios_scheme, ios_configuration, ios_team_id, ios_export_method
        )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            project.id,
            project.name,
            project.path,
            project.bundle_id.ios,
            project.bundle_id.android,
            project.version.ios,
            project.version.android,
            project.build_number.ios,
            project.build_number.android,
            project.ios_config.as_ref().map(|c| &c.scheme),
            project.ios_config.as_ref().map(|c| &c.configuration),
            project.ios_config.as_ref().and_then(|c| c.team_id.as_ref()),
            project.ios_config.as_ref().and_then(|c| c.export_method.as_ref()),
        ],
    )
    .map_err(|e| e.to_string())?;

    // Update Info.plist
    update_ios_info_plist(
        &project.path,
        &project.version.ios,
        &project.build_number.ios.to_string()
    )?;

    Ok(())
}

#[command]
pub async fn delete_project(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
