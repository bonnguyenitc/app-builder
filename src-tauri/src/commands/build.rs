use tauri::{command, Window, Emitter};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use crate::models::project::Project;

#[command]
pub async fn build_project(window: Window, project: Project, platform: String) -> Result<(), String> {
    println!("Building project {} for platform {}", project.name, platform);

    let (program, args, work_dir) = match platform.as_str() {
        "android" => {
            let android_dir = std::path::Path::new(&project.path).join("android");
            if !android_dir.exists() {
                return Err(format!("Android directory not found at {:?}", android_dir));
            }
            ("./gradlew", vec!["bundleRelease"], android_dir)
        },
        "ios" => {
            let ios_dir = std::path::Path::new(&project.path).join("ios");
            if !ios_dir.exists() {
                return Err(format!("iOS directory not found at {:?}", ios_dir));
            }

            // Uses scheme and configuration from project settings or falls back to defaults
            let scheme = project.ios_config.as_ref().map(|c| c.scheme.as_str()).unwrap_or(&project.name);
            let configuration = project.ios_config.as_ref().map(|c| c.configuration.as_str()).unwrap_or("Release");

            // Find workspace or project file in ios directory
            let mut workspace_path = None;
            let mut project_path = None;

            if let Ok(entries) = std::fs::read_dir(&ios_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if let Some(ext) = path.extension() {
                        if ext == "xcworkspace" {
                            workspace_path = Some(path);
                            break; // Prefer workspace over project
                        } else if ext == "xcodeproj" && project_path.is_none() {
                            project_path = Some(path);
                        }
                    }
                }
            }

            // Build archive path
            let build_dir = ios_dir.join("build");
            let archive_path = build_dir.join(format!("{}.xcarchive", &project.name));
            let archive_path_str = archive_path.to_str().ok_or("Invalid archive path")?;

            // Step 1: Archive
            window.emit("build-log", format!("📦 Starting iOS archive for scheme: {}", scheme))
                .map_err(|e| e.to_string())?;

            let mut archive_args = vec![
                "-scheme", scheme,
                "-sdk", "iphoneos",
                "-configuration", configuration,
                "archive",
                "-archivePath", archive_path_str,
            ];

            // Add workspace or project flag
            let build_file_path = if let Some(ref ws_path) = workspace_path {
                window.emit("build-log", format!("🔍 Found workspace: {}", ws_path.file_name().unwrap().to_string_lossy()))
                    .map_err(|e| e.to_string())?;
                ws_path.to_str().ok_or("Invalid workspace path")?.to_string()
            } else if let Some(ref proj_path) = project_path {
                window.emit("build-log", format!("🔍 Found project: {}", proj_path.file_name().unwrap().to_string_lossy()))
                    .map_err(|e| e.to_string())?;
                proj_path.to_str().ok_or("Invalid project path")?.to_string()
            } else {
                return Err(format!("No .xcworkspace or .xcodeproj file found in {:?}", ios_dir));
            };

            let build_type = if workspace_path.is_some() { "-workspace" } else { "-project" };
            archive_args.insert(0, &build_file_path);
            archive_args.insert(0, build_type);

            let mut archive_child = Command::new("xcodebuild")
                .args(&archive_args)
                .current_dir(&ios_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| format!("Failed to start archive command: {}", e))?;

            let archive_stdout = archive_child.stdout.take().unwrap();
            let archive_reader = BufReader::new(archive_stdout);

            for line in archive_reader.lines() {
                if let Ok(line_content) = line {
                    window.emit("build-log", line_content).map_err(|e| e.to_string())?;
                }
            }

            let archive_status = archive_child.wait().map_err(|e| e.to_string())?;
            if !archive_status.success() {
                window.emit("build-status", "failed").map_err(|e| e.to_string())?;
                return Err("Archive failed".into());
            }

            window.emit("build-log", "✅ Archive completed successfully").map_err(|e| e.to_string())?;

            // Step 2: Export
            window.emit("build-log", "📤 Starting export...").map_err(|e| e.to_string())?;

            // Create or find export options plist
            let export_plist_path = ios_dir.join("ExportOptions.plist");

            // If team_id is provided, generate ExportOptions.plist automatically
            if let Some(team_id) = project.ios_config.as_ref().and_then(|c| c.team_id.as_ref()) {
                window.emit("build-log", format!("🔧 Generating ExportOptions.plist with Team ID: {}", team_id))
                    .map_err(|e| e.to_string())?;

                // Use export_method from config, or default to "development"
                let export_method = project.ios_config.as_ref()
                    .and_then(|c| c.export_method.as_ref())
                    .map(|s| s.as_str())
                    .unwrap_or("development");

                window.emit("build-log", format!("📦 Export method: {}", export_method))
                    .map_err(|e| e.to_string())?;

                let plist_content = format!(
                    r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>{}</string>
    <key>teamID</key>
    <string>{}</string>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
</dict>
</plist>"#,
                    export_method, team_id
                );

                std::fs::write(&export_plist_path, plist_content)
                    .map_err(|e| format!("Failed to write ExportOptions.plist: {}", e))?;
            } else {
                // Look for existing export options plist
                window.emit("build-log", "🔍 Looking for existing ExportOptions.plist...")
                    .map_err(|e| e.to_string())?;

                let export_plist_names: Vec<String> = vec![
                    format!("{}ExportOptions.plist", configuration),
                    "ExportOptions.plist".to_string(),
                    "DevelopmentExportOptions.plist".to_string(),
                    "ReleaseExportOptions.plist".to_string(),
                ];

                let found_plist = export_plist_names.iter()
                    .map(|name| ios_dir.join(name))
                    .find(|path| path.exists());

                if found_plist.is_none() {
                    return Err("Export options plist not found and no Team ID configured. Please either:\n1. Add Team ID in project settings, or\n2. Create an ExportOptions.plist file in the ios directory.".into());
                }
            }

            let export_path = build_dir.to_str().ok_or("Invalid export path")?;

            let export_args = vec![
                "-exportArchive",
                "-archivePath", archive_path_str,
                "-exportOptionsPlist", export_plist_path.to_str().ok_or("Invalid plist path")?,
                "-exportPath", export_path,
            ];

            let mut export_child = Command::new("xcodebuild")
                .args(&export_args)
                .current_dir(&ios_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| format!("Failed to start export command: {}", e))?;

            let export_stdout = export_child.stdout.take().unwrap();
            let export_reader = BufReader::new(export_stdout);

            for line in export_reader.lines() {
                if let Ok(line_content) = line {
                    window.emit("build-log", line_content).map_err(|e| e.to_string())?;
                }
            }

            let export_status = export_child.wait().map_err(|e| e.to_string())?;
            if !export_status.success() {
                window.emit("build-status", "failed").map_err(|e| e.to_string())?;
                return Err("Export failed".into());
            }

            window.emit("build-log", "✅ Export completed successfully").map_err(|e| e.to_string())?;
            window.emit("build-status", "success").map_err(|e| e.to_string())?;

            return Ok(());
        },
        _ => return Err(format!("Unsupported platform: {}", platform)),
    };

    let mut child = Command::new(program)
        .args(&args)
        .current_dir(&work_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start build command: {}", e))?;

    let stdout = child.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    // Stream logs to frontend
    for line in reader.lines() {
        if let Ok(line_content) = line {
            window.emit("build-log", line_content).map_err(|e| e.to_string())?;
        }
    }

    let status = child.wait().map_err(|e| e.to_string())?;
    if status.success() {
        window.emit("build-status", "success").map_err(|e| e.to_string())?;
        Ok(())
    } else {
        window.emit("build-status", "failed").map_err(|e| e.to_string())?;
        Err("Build failed".into())
    }
}

#[command]
pub async fn open_build_folder(project: Project, platform: String) -> Result<(), String> {
    let folder_path = match platform.as_str() {
        "android" => {
             // Standard path for React Native / generic Android Gradle builds
             std::path::Path::new(&project.path)
                .join("android/app/build/outputs/apk/release")
        },
        "ios" => {
            // iOS builds are now archived and exported to ios/build/
            std::path::Path::new(&project.path).join("ios/build")
        },
        _ => return Err(format!("Unsupported platform: {}", platform)),
    };

    if !folder_path.exists() {
         return Err(format!("Build folder not found at {:?}", folder_path));
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    // Linux support can be added if needed usually xdg-open

    Ok(())
}
