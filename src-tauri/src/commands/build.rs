use tauri::{command, Window, Emitter, State};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::sync::Arc;
use std::fs::File;
use crate::models::project::Project;
use crate::BuildProcessState;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildOptions {
    #[serde(rename = "uploadToAppStore")]
    pub upload_to_app_store: Option<bool>,
}

#[command]
pub async fn build_project(
    window: Window,
    project: Project,
    platform: String,
    options: Option<BuildOptions>,
    process_state: State<'_, BuildProcessState>,
) -> Result<(), String> {
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

            // Create logs directory
            let logs_dir = ios_dir.join("build/logs");
            std::fs::create_dir_all(&logs_dir)
                .map_err(|e| format!("Failed to create logs directory: {}", e))?;

            // Create log file with timestamp
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let log_file_path = logs_dir.join(format!("{}.log", timestamp));
            let mut log_file = File::create(&log_file_path)
                .map_err(|e| format!("Failed to create log file: {}", e))?;

            // Uses scheme and configuration from project settings or falls back to defaults
            let scheme = project.ios.config.as_ref().map(|c| c.scheme.as_str()).unwrap_or(&project.name);
            let configuration = project.ios.config.as_ref().map(|c| c.configuration.as_str()).unwrap_or("Release");

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
            let archive_msg = format!("📦 Starting iOS archive for scheme: {}", scheme);
            window.emit("build-log", &archive_msg).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", archive_msg).map_err(|e| e.to_string())?;

            let mut archive_args = vec![
                "-scheme", scheme,
                "-sdk", "iphoneos",
                "-configuration", configuration,
                "archive",
                "-archivePath", archive_path_str,
            ];

            // Add workspace or project flag
            let build_file_path = if let Some(ref ws_path) = workspace_path {
                let msg = format!("🔍 Found workspace: {}", ws_path.file_name().unwrap().to_string_lossy());
                window.emit("build-log", &msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;
                ws_path.to_str().ok_or("Invalid workspace path")?.to_string()
            } else if let Some(ref proj_path) = project_path {
                let msg = format!("🔍 Found project: {}", proj_path.file_name().unwrap().to_string_lossy());
                window.emit("build-log", &msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;
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

            // Take stdout ownership to read logs
            let archive_stdout = archive_child.stdout.take().unwrap();
            let archive_reader = BufReader::new(archive_stdout);

            // Store process for cancellation logic.
            // We use Arc and Mutex to share ownership.
            let process_id = project.id.clone();
            {
                let mut processes = process_state.0.lock().unwrap();
                processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(archive_child))));
            }

            // Write all logs to file, logging blocks here until logs are done (or pipe closed)
            for line in archive_reader.lines() {
                if let Ok(line_content) = line {
                    writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;
                }
            }

            // Retrieve child process to wait for exit status
            let archive_status = {
                 let mut processes = process_state.0.lock().unwrap();
                 if let Some(mutex) = processes.remove(&process_id) {
                     let mut guard = mutex.lock().unwrap();
                     if let Some(mut child) = guard.take() {
                         child.wait().map_err(|e| e.to_string())?
                     } else {
                         // Process was already taken (should not happen in normal flow)
                         return Err("Archive process handle lost".into());
                     }
                 } else {
                     // If process is not in map, it was removed by cancel_build_process
                     return Err("Build cancelled".into());
                 }
            };

            if !archive_status.success() {
                let error_msg = "❌ Archive failed - check log file for details";
                window.emit("build-log", error_msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", error_msg).map_err(|e| e.to_string())?;
                window.emit("build-status", "failed").map_err(|e| e.to_string())?;
                window.emit("build-log-file", log_file_path.to_str().unwrap()).map_err(|e| e.to_string())?;
                return Err("Archive failed".into());
            }

            let success_msg = "✅ Archive completed successfully";
            window.emit("build-log", success_msg).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", success_msg).map_err(|e| e.to_string())?;

            // Step 2: Export
            let export_msg = "📤 Starting export...";
            window.emit("build-log", export_msg).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", export_msg).map_err(|e| e.to_string())?;

            // Create or find export options plist
            let export_plist_path = ios_dir.join("ExportOptions.plist");

            // If team_id is provided, generate ExportOptions.plist automatically
            if let Some(team_id) = project.ios.config.as_ref().and_then(|c| c.team_id.as_ref()) {
                let msg = format!("🔧 Generating ExportOptions.plist with Team ID: {}", team_id);
                window.emit("build-log", &msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;

                // Use export_method from config, or default to "development"
                let export_method = project.ios.config.as_ref()
                    .and_then(|c| c.export_method.as_ref())
                    .map(|s| s.as_str())
                    .unwrap_or("development");

                let method_msg = format!("📦 Export method: {}", export_method);
                window.emit("build-log", &method_msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", method_msg).map_err(|e| e.to_string())?;

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
                let msg = "🔍 Looking for existing ExportOptions.plist...";
                window.emit("build-log", msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;

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

             // Store process again for cancellation
            {
                let mut processes = process_state.0.lock().unwrap();
                processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(export_child))));
            }

            // Write all logs to file, don't stream to UI
            for line in export_reader.lines() {
                if let Ok(line_content) = line {
                    writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;
                }
            }

            let export_status = {
                 let mut processes = process_state.0.lock().unwrap();
                 if let Some(mutex) = processes.remove(&process_id) {
                     let mut guard = mutex.lock().unwrap();
                     if let Some(mut child) = guard.take() {
                         child.wait().map_err(|e| e.to_string())?
                     } else {
                         return Err("Export process handle lost".into());
                     }
                 } else {
                     return Err("Build cancelled".into());
                 }
            };

            if !export_status.success() {
                let error_msg = "❌ Export failed - check log file for details";
                window.emit("build-log", error_msg).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", error_msg).map_err(|e| e.to_string())?;
                window.emit("build-status", "failed").map_err(|e| e.to_string())?;
                window.emit("build-log-file", log_file_path.to_str().unwrap()).map_err(|e| e.to_string())?;
                return Err("Export failed".into());
            }

            let final_msg = "✅ Export completed successfully";
            window.emit("build-log", final_msg).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", final_msg).map_err(|e| e.to_string())?;

            // Step 3: Upload to App Store (Optional)
            if let Some(true) = options.and_then(|o| o.upload_to_app_store) {
                 if let (Some(api_key), Some(api_issuer)) = (
                    project.ios.config.as_ref().and_then(|c| c.api_key.as_ref()),
                    project.ios.config.as_ref().and_then(|c| c.api_issuer.as_ref())
                 ) {
                    let upload_msg = "🚀 Starting upload to App Store...";
                    window.emit("build-log", upload_msg).map_err(|e| e.to_string())?;
                    writeln!(log_file, "{}", upload_msg).map_err(|e| e.to_string())?;

                    // Find IPA file
                    let mut ipa_path = None;
                    if let Ok(entries) = std::fs::read_dir(&build_dir) {
                        for entry in entries.flatten() {
                            let path = entry.path();
                             if path.extension().and_then(|s| s.to_str()) == Some("ipa") {
                                ipa_path = Some(path);
                                break;
                            }
                        }
                    }

                    if let Some(ipa_file) = ipa_path {
                         let ipa_path_str = ipa_file.to_str().unwrap();
                         let file_msg = format!("Found IPA: {}", ipa_path_str);
                         window.emit("build-log", &file_msg).map_err(|e| e.to_string())?;
                         writeln!(log_file, "{}", file_msg).map_err(|e| e.to_string())?;

                         let upload_args = vec![
                            "--upload-app",
                            "--type", "ios",
                            "--file", ipa_path_str,
                            "--apiKey", api_key,
                            "--apiIssuer", api_issuer,
                         ];

                         let mut upload_child = Command::new("xcrun")
                            .arg("altool")
                            .args(&upload_args)
                            .stdout(Stdio::piped())
                            .stderr(Stdio::piped())
                            .spawn()
                            .map_err(|e| format!("Failed to start upload: {}", e))?;

                        let upload_stdout = upload_child.stdout.take().unwrap();
                        let upload_stderr = upload_child.stderr.take().unwrap(); // altool writes to stderr often

                         // We can read both or just one. Usually altool outputs progress.
                         // For simplicity, let's just wait and read output.
                         // But we want to stream logs?
                         // Implementing full streaming for both might be complex in this single function structure without helpers.
                         // Let's rely on standard wait for now, maybe stream stdout.

                        let upload_reader = BufReader::new(upload_stdout);
                        let upload_err_reader = BufReader::new(upload_stderr);

                        // TODO: Better concurrent reading. For now, sequential read might block if buffer fills?
                        // Given we are in async function but doing blocking IO here...
                        // We launched archive/export with similar pattern but they are processed sequentially here.

                        // Just read stdout line by line
                        for line in upload_reader.lines() {
                            if let Ok(line_content) = line {
                                window.emit("build-log", &line_content).map_err(|e| e.to_string())?;
                                writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;
                            }
                        }
                        // Then stderr
                         for line in upload_err_reader.lines() {
                            if let Ok(line_content) = line {
                                window.emit("build-log", &line_content).map_err(|e| e.to_string())?;
                                writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;
                            }
                        }

                         let upload_status = upload_child.wait().map_err(|e| e.to_string())?;

                         if !upload_status.success() {
                             let err = "❌ Upload failed";
                             window.emit("build-log", err).map_err(|e| e.to_string())?;
                             writeln!(log_file, "{}", err).map_err(|e| e.to_string())?;
                             // Don't fail the whole build status, just log error?
                             // Or mark as failed? Probably fail.
                             window.emit("build-status", "failed").map_err(|e| e.to_string())?;
                             return Err("Upload failed".into());
                         } else {
                             let succ = "✅ Upload completed successfully";
                             window.emit("build-log", succ).map_err(|e| e.to_string())?;
                             writeln!(log_file, "{}", succ).map_err(|e| e.to_string())?;
                         }

                    } else {
                        let err = "❌ IPA file not found for upload";
                        window.emit("build-log", err).map_err(|e| e.to_string())?;
                        writeln!(log_file, "{}", err).map_err(|e| e.to_string())?;
                    }
                 } else {
                     let msg = "⚠️ Upload requested but API Key or Issuer missing in project settings.";
                     window.emit("build-log", msg).map_err(|e| e.to_string())?;
                     writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;
                 }
            }

            // Emit log file path for frontend to save
            window.emit("build-log-file", log_file_path.to_str().unwrap()).map_err(|e| e.to_string())?;
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

    // Store process for cancellation
    let process_id = project.id.clone();
    {
        let mut processes = process_state.0.lock().unwrap();
        processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(child))));
    }

    // Get process back for monitoring
    let process_arc = {
        let processes = process_state.0.lock().unwrap();
        processes.get(&process_id).cloned()
    };

    if let Some(process_mutex) = process_arc {
        let mut child = process_mutex.lock().unwrap().take().unwrap();

        let stdout = child.stdout.take().unwrap();
        let reader = BufReader::new(stdout);

        // Stream logs to frontend
        for line in reader.lines() {
            if let Ok(line_content) = line {
                window.emit("build-log", line_content).map_err(|e| e.to_string())?;
            }
        }

        let status = child.wait().map_err(|e| e.to_string())?;

        // Cleanup process from state
        {
            let mut processes = process_state.0.lock().unwrap();
            processes.remove(&process_id);
        }

        if status.success() {
            // For Android builds, rename the AAB file
            if platform == "android" {
                let bundle_dir = work_dir.join("app/build/outputs/bundle/release");
                let original_aab = bundle_dir.join("app-release.aab");

                if original_aab.exists() {
                    // Create timestamp
                    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();

                    // Create new filename: appname_version_timestamp.aab
                    let new_filename = format!(
                        "{}_{}_{}_{}.aab",
                        project.name.replace(" ", "_"),
                        project.android.version,
                        project.android.version_code,
                        timestamp
                    );

                    let new_aab_path = bundle_dir.join(&new_filename);

                    // Rename the file
                    std::fs::rename(&original_aab, &new_aab_path)
                        .map_err(|e| format!("Failed to rename AAB file: {}", e))?;

                    let rename_msg = format!("✅ AAB renamed to: {}", new_filename);
                    window.emit("build-log", &rename_msg).map_err(|e| e.to_string())?;
                }
            }

            window.emit("build-status", "success").map_err(|e| e.to_string())?;
            Ok(())
        } else {
            window.emit("build-status", "failed").map_err(|e| e.to_string())?;
            Err("Build failed".into())
        }
    } else {
        Err("Failed to store process".into())
    }
}

#[command]
pub async fn cancel_build_process(
    project_id: String,
    process_state: State<'_, BuildProcessState>,
) -> Result<(), String> {
    let process_arc = {
        let mut processes = process_state.0.lock().unwrap();
        processes.remove(&project_id)
    };

    if let Some(process_mutex) = process_arc {
        let mut child_opt = process_mutex.lock().unwrap();
        if let Some(mut child) = child_opt.take() {
            match child.kill() {
                Ok(_) => {
                    println!("Successfully killed build process for project: {}", project_id);
                    Ok(())
                }
                Err(e) => {
                    eprintln!("Failed to kill process: {}", e);
                    Err(format!("Failed to kill process: {}", e))
                }
            }
        } else {
            Err("Process already terminated".into())
        }
    } else {
        Err(format!("No active build found for project: {}", project_id))
    }
}

#[command]
pub async fn open_build_folder(project: Project, platform: String) -> Result<(), String> {
    let folder_path = match platform.as_str() {
        "android" => {
             // Standard path for React Native / generic Android Gradle builds
             std::path::Path::new(&project.path)
                .join("android/app/build/outputs/bundle/release")
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

#[command]
pub async fn open_log_file(log_file_path: String) -> Result<(), String> {
    let path = std::path::Path::new(&log_file_path);

    if !path.exists() {
        return Err(format!("Log file not found at {:?}", path));
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("notepad")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open log file: {}", e))?;
    }

    Ok(())
}
