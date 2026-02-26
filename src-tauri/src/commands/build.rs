use tauri::{command, Window, Emitter, State};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader, Write};
use std::sync::Arc;
use std::fs::File;
#[cfg(unix)]
use std::os::unix::process::CommandExt;
use crate::models::project::Project;
use crate::BuildProcessState;
use crate::commands::notification::send_all_notifications;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildOptions {
    #[serde(rename = "uploadToAppStore")]
    pub upload_to_app_store: Option<bool>,
    pub release_note: Option<String>,
    #[serde(rename = "androidFormat")]
    pub android_format: Option<String>,
    #[serde(rename = "sendToAppDistribution")]
    pub send_to_app_distribution: Option<bool>,
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

    match platform.as_str() {
        "android" => {
            let android_dir = std::path::Path::new(&project.path).join("android");

            // Create logs directory for Android
            let logs_dir = android_dir.join("build/logs");
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

            // Emit start message
            let start_msg = format!("🚀 Starting Android build for project: {}", project.name);
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": start_msg })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", start_msg).map_err(|e| e.to_string())?;

            if !android_dir.exists() {
                let err_msg = format!("❌ Android directory not found at: {:?}", android_dir);
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": err_msg })).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", err_msg).map_err(|e| e.to_string())?;
                window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap() })).map_err(|e| e.to_string())?;
                window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                return Err(err_msg);
            }

            // Check if gradlew exists
            let gradlew_path = android_dir.join("gradlew");
            if !gradlew_path.exists() {
                let err_msg = format!("❌ gradlew not found at: {:?}", gradlew_path);
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": err_msg })).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", err_msg).map_err(|e| e.to_string())?;
                window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap() })).map_err(|e| e.to_string())?;
                window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                return Err(err_msg);
            }

            let path_msg = format!("📁 Android directory: {:?}", android_dir);
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": path_msg })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", path_msg).map_err(|e| e.to_string())?;

            // Use /bin/sh -l -c to run in a login shell
            // Add common paths for Node.js (Homebrew, NVM, etc.) and source shell profiles
            let android_dir_str = android_dir.to_str().unwrap_or("");

            // Build comprehensive shell command that sources profiles and adds common paths
            let shell_command = format!(
                r#"
                # 1. Add standard paths explicitly (Homebrew, Local, System)
                export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

                # 2. Source shell profiles (This handles most version managers like fnm, asdf, volta if configured in shell)
                # We suppress output to avoid polluting logs
                [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" >/dev/null 2>&1 || true
                [ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc" >/dev/null 2>&1 || true
                [ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile" >/dev/null 2>&1 || true

                # 3. Explicitly look for NVM if likely not loaded yet
                if [ -d "$HOME/.nvm" ]; then
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
                fi

                # 4. Fallback: Try to find common version managers if node is still missing
                if ! command -v node >/dev/null 2>&1; then
                    # Check for Volta
                    if [ -d "$HOME/.volta" ]; then
                        export VOLTA_HOME="$HOME/.volta"
                        export PATH="$VOLTA_HOME/bin:$PATH"
                    fi
                    # Check for FNM (Fast Node Manager)
                    if [ -d "$HOME/Library/Application Support/fnm" ]; then
                        export PATH="$HOME/Library/Application Support/fnm:$PATH"
                        eval "`fnm env --use-on-cd 2>/dev/null`" || true
                    fi
                fi

                # Log environment for debugging
                echo "🔍 Node path: $(which node 2>/dev/null || echo 'not found')"
                echo "🔍 Node version: $(node -v 2>/dev/null || echo 'unknown')"
                echo "🔍 Java path: $(which java 2>/dev/null || echo 'not found')"

                cd '{}' && {} 2>&1
                "#,
                android_dir_str,
                {
                    let format = options.as_ref().and_then(|o| o.android_format.as_deref()).unwrap_or("aab");
                    let base_cmd = project.android.build_command.as_deref().unwrap_or(
                        if format == "apk" { "./gradlew assembleRelease" } else { "./gradlew bundleRelease" }
                    );

                    if format == "apk" {
                        base_cmd.replace("bundle", "assemble")
                    } else {
                        base_cmd.replace("assemble", "bundle")
                    }
                }
            );

            let cmd_info = format!("🔧 Running Android build with enhanced environment...");
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": cmd_info })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", cmd_info).map_err(|e| e.to_string())?;

            let mut child = Command::new("/bin/sh")
                .args(&["-c", &shell_command])
                .current_dir(&android_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .process_group(0) // own process group so killpg kills gradle + all children
                .spawn()
                .map_err(|e| {
                    let err_msg = format!("❌ Failed to start build command: {}", e);
                    let _ = window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": err_msg }));
                    let _ = writeln!(log_file, "{}", err_msg);
                    let _ = window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() }));
                    let _ = window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id }));
                    err_msg
                })?;

            // Take stdout/stderr BEFORE storing so cancel_build_process can still kill the child
            let child_stdout = child.stdout.take();
            let child_stderr = child.stderr.take();

            // Store process for cancellation (child stays as Some so kill() works)
            let process_id = project.id.clone();
            {
                let mut processes = process_state.0.lock().unwrap();
                processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(child))));
            }

            {
                // Read stdout and write to log file
                if let Some(stdout) = child_stdout {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(line_content) = line {
                            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": line_content })).map_err(|e| e.to_string())?;
                            writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;
                        }
                    }
                }

                // Read stderr and write to log file
                if let Some(stderr) = child_stderr {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(line_content) = line {
                            let stderr_line = format!("⚠️ {}", line_content);
                            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": stderr_line })).map_err(|e| e.to_string())?;
                            writeln!(log_file, "{}", stderr_line).map_err(|e| e.to_string())?;
                        }
                    }
                }

                // Wait for completion — detect if build was cancelled
                let status_opt = {
                    let mut processes = process_state.0.lock().unwrap();
                    if let Some(mutex) = processes.remove(&process_id) {
                        let mut guard = mutex.lock().unwrap();
                        match guard.take() {
                            Some(mut c) => Some(c.wait().map_err(|e| e.to_string())?),
                            None => None, // killed by cancel_build_process
                        }
                    } else {
                        None // already removed by cancel
                    }
                };

                let status = match status_opt {
                    Some(s) => s,
                    None => {
                        window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;
                        window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                        return Ok(());
                    }
                };

                // Emit log file path so frontend can save it
                window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap() })).map_err(|e| e.to_string())?;

                if status.success() {
                    let format = options.as_ref().and_then(|o| o.android_format.as_deref()).unwrap_or("aab");
                    let extension = if format == "apk" { "apk" } else { "aab" };

                    // Direct path to the built artifact
                    let artifact_file = if format == "apk" {
                        android_dir.join("app/build/outputs/apk/release/app-release.apk")
                    } else {
                        android_dir.join("app/build/outputs/bundle/release/app-release.aab")
                    };

                    let mut artifact_path: Option<std::path::PathBuf> = None;

                    if artifact_file.exists() {
                        let ts = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
                        let new_filename = format!(
                            "{}_{}_{}_{}.{}",
                            project.name.replace(" ", "_"),
                            project.android.version,
                            project.android.version_code,
                            ts,
                            extension
                        );
                        let dest_path = artifact_file.parent().unwrap().join(&new_filename);
                        std::fs::rename(&artifact_file, &dest_path)
                            .map_err(|e| format!("Failed to rename {} file: {}", extension.to_uppercase(), e))?;

                        let rename_msg = format!("✅ {} renamed to: {}", extension.to_uppercase(), new_filename);
                        window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": rename_msg })).map_err(|e| e.to_string())?;
                        writeln!(log_file, "{}", rename_msg).map_err(|e| e.to_string())?;

                        // Emit artifact path
                        window.emit("build-artifact-path", serde_json::json!({ "projectId": project.id, "payload": dest_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;

                        artifact_path = Some(dest_path);
                    } else {
                        // Warn that file was not found
                        let warn_msg = format!("⚠️ No {} file found at: {:?}", extension.to_uppercase(), artifact_file);
                        window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": warn_msg })).map_err(|e| e.to_string())?;
                        writeln!(log_file, "{}", warn_msg).map_err(|e| e.to_string())?;
                    }


                    let success_msg = "✅ Android build completed successfully";
                    window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": success_msg })).map_err(|e| e.to_string())?;
                    writeln!(log_file, "{}", success_msg).map_err(|e| e.to_string())?;

                    // Upload to Firebase App Distribution if enabled
                    if let Some(true) = options.as_ref().and_then(|o| o.send_to_app_distribution) {
                        if let (Some(artifact), Some(config)) = (&artifact_path, &project.android.config) {
                            if let Some(firebase_app_id) = &config.firebase_app_id {
                                let upload_msg = "📤 Uploading to Firebase App Distribution...";
                                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": upload_msg })).map_err(|e| e.to_string())?;
                                writeln!(log_file, "{}", upload_msg).map_err(|e| e.to_string())?;

                                let artifact_str = artifact.to_str().unwrap_or_default();
                                let groups = config.distribution_groups.as_deref().unwrap_or("");
                                let release_notes = options.as_ref()
                                    .and_then(|o| o.release_note.as_deref())
                                    .unwrap_or("");

                                // Build firebase command
                                let firebase_cmd = format!(
                                    r#"
                                    [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" >/dev/null 2>&1 || true
                                    [ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc" >/dev/null 2>&1 || true
                                    export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
                                    firebase appdistribution:distribute '{}' --app '{}' {} {} 2>&1
                                    "#,
                                    artifact_str.replace("'", "'\\''"),
                                    firebase_app_id.replace("'", "'\\''"),
                                    if !groups.is_empty() { format!("--groups '{}'", groups.replace("'", "'\\''")) } else { String::new() },
                                    if !release_notes.is_empty() { format!("--release-notes '{}'", release_notes.replace("'", "'\\''")) } else { String::new() }
                                );
                                let firebase_output = Command::new("/bin/sh")
                                    .args(&["-c", &firebase_cmd])
                                    .output();

                                match firebase_output {
                                    Ok(output) => {
                                        let stdout = String::from_utf8_lossy(&output.stdout);
                                        let stderr = String::from_utf8_lossy(&output.stderr);

                                        // Log firebase output
                                        for line in stdout.lines() {
                                            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": line })).map_err(|e| e.to_string())?;
                                            writeln!(log_file, "{}", line).map_err(|e| e.to_string())?;
                                        }

                                        if output.status.success() {
                                            let upload_success = "✅ Successfully uploaded to Firebase App Distribution!";
                                            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": upload_success })).map_err(|e| e.to_string())?;
                                            writeln!(log_file, "{}", upload_success).map_err(|e| e.to_string())?;
                                        } else {
                                            let upload_fail = format!("❌ Firebase upload failed: {}", stderr);
                                            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": upload_fail })).map_err(|e| e.to_string())?;
                                            writeln!(log_file, "{}", upload_fail).map_err(|e| e.to_string())?;
                                        }
                                    }
                                    Err(e) => {
                                        let err_msg = format!("❌ Failed to run firebase command: {}", e);
                                        window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": err_msg })).map_err(|e| e.to_string())?;
                                        writeln!(log_file, "{}", err_msg).map_err(|e| e.to_string())?;
                                    }
                                }
                            } else {
                                let warn = "⚠️ App Distribution enabled but Firebase App ID not configured";
                                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": warn })).map_err(|e| e.to_string())?;
                                writeln!(log_file, "{}", warn).map_err(|e| e.to_string())?;
                            }
                        } else {
                            let warn = "⚠️ App Distribution enabled but artifact path or config not available";
                            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": warn })).map_err(|e| e.to_string())?;
                            writeln!(log_file, "{}", warn).map_err(|e| e.to_string())?;
                        }
                    }

                    window.emit("build-status", serde_json::json!({ "status": "success", "projectId": project.id })).map_err(|e| e.to_string())?;
                    return Ok(());
                } else {
                    let exit_code = status.code().map(|c| c.to_string()).unwrap_or("unknown".to_string());
                    let error_msg = format!("❌ Build failed with exit code: {}", exit_code);
                    window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": error_msg })).map_err(|e| e.to_string())?;
                    writeln!(log_file, "{}", error_msg).map_err(|e| e.to_string())?;
                    window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;
                    window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                    return Err(error_msg);
                }
            }
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
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": archive_msg })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", archive_msg).map_err(|e| e.to_string())?;

            // Find workspace or project flag
            let build_file_path = if let Some(ref ws_path) = workspace_path {
                let msg = format!("🔍 Found workspace: {}", ws_path.file_name().unwrap().to_string_lossy());
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": msg })).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;
                ws_path.to_str().ok_or("Invalid workspace path")?.to_string()
            } else if let Some(ref proj_path) = project_path {
                let msg = format!("🔍 Found project: {}", proj_path.file_name().unwrap().to_string_lossy());
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": msg })).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;
                proj_path.to_str().ok_or("Invalid project path")?.to_string()
            } else {
                return Err(format!("No .xcworkspace or .xcodeproj file found in {:?}", ios_dir));
            };

            let build_type = if workspace_path.is_some() { "-workspace" } else { "-project" };

            let archive_cmd = format!(
                "xcodebuild {} '{}' -scheme '{}' -sdk iphoneos -configuration '{}' archive -archivePath '{}' 2>&1",
                build_type,
                build_file_path.replace("'", "'\\''"),
                scheme.replace("'", "'\\''"),
                configuration.replace("'", "'\\''"),
                archive_path_str.replace("'", "'\\''")
            );

            let mut archive_child = Command::new("/bin/sh")
                .args(&["-c", &archive_cmd])
                .current_dir(&ios_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .process_group(0) // own process group so killpg kills xcodebuild + clang/swiftc
                .spawn()
                .map_err(|e| format!("Failed to start archive command: {}", e))?;

            // Take stdout ownership to read logs (now includes stderr due to 2>&1)
            let archive_stdout = archive_child.stdout.take().unwrap();
            let archive_reader = BufReader::new(archive_stdout);

            // Store process for cancellation logic.
            // We use Arc and Mutex to share ownership.
            let process_id = project.id.clone();
            {
                let mut processes = process_state.0.lock().unwrap();
                processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(archive_child))));
            }

            // Collect some recent logs to show in case of failure
            let mut recent_logs = std::collections::VecDeque::with_capacity(20);

            // Write all logs to file, but only stream errors/warnings to UI to avoid lag
            for line in archive_reader.lines() {
                if let Ok(line_content) = line {
                    writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;

                    let lower_line = line_content.to_lowercase();
                    if lower_line.contains("error:") || lower_line.contains("warning:") {
                        window.emit("build-log", &line_content).map_err(|e| e.to_string())?;
                    }

                    if recent_logs.len() >= 20 {
                        recent_logs.pop_front();
                    }
                    recent_logs.push_back(line_content);
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
                     window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;
                     window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                     return Ok(());
                 }
            };

            if !archive_status.success() {
                let error_header = "❌ Archive failed. Recent logs:";
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": error_header })).map_err(|e| e.to_string())?;

                for log in recent_logs {
                    window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": format!("  {}", log) })).map_err(|e| e.to_string())?;
                }

                let final_err = "Check log file for full details.";
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": final_err })).map_err(|e| e.to_string())?;
                window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap() })).map_err(|e| e.to_string())?;
                return Err("Archive failed".into());
            }

            let success_msg = "✅ Archive completed successfully";
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": success_msg })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", success_msg).map_err(|e| e.to_string())?;

            // Step 2: Export
            let export_msg = "📤 Starting export...";
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": export_msg })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", export_msg).map_err(|e| e.to_string())?;

            // Create or find export options plist
            let export_plist_path = ios_dir.join("ExportOptions.plist");

            // If team_id is provided, generate ExportOptions.plist automatically
            if let Some(team_id) = project.ios.config.as_ref().and_then(|c| c.team_id.as_ref()) {
                let msg = format!("🔧 Generating ExportOptions.plist with Team ID: {}", team_id);
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": msg })).map_err(|e| e.to_string())?;
                writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;

                // Use export_method from config, or default to "development"
                let export_method = project.ios.config.as_ref()
                    .and_then(|c| c.export_method.as_ref())
                    .map(|s| s.as_str())
                    .unwrap_or("development");

                let method_msg = format!("📦 Export method: {}", export_method);
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": method_msg })).map_err(|e| e.to_string())?;
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
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": msg })).map_err(|e| e.to_string())?;
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

            let export_cmd = format!(
                "xcodebuild -exportArchive -archivePath '{}' -exportOptionsPlist '{}' -exportPath '{}' 2>&1",
                archive_path_str.replace("'", "'\\''"),
                export_plist_path.to_str().ok_or("Invalid plist path")?.replace("'", "'\\''"),
                export_path.replace("'", "'\\''")
            );

            let mut export_child = Command::new("/bin/sh")
                .args(&["-c", &export_cmd])
                .current_dir(&ios_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .process_group(0)
                .spawn()
                .map_err(|e| format!("Failed to start export command: {}", e))?;

            let export_stdout = export_child.stdout.take().unwrap();
            let export_reader = BufReader::new(export_stdout);

             // Store process again for cancellation
            {
                let mut processes = process_state.0.lock().unwrap();
                processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(export_child))));
            }

            let mut recent_export_logs = std::collections::VecDeque::with_capacity(20);

            // Write all logs to file, but only stream errors/warnings to UI
            for line in export_reader.lines() {
                if let Ok(line_content) = line {
                    writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;

                    let lower_line = line_content.to_lowercase();
                    if lower_line.contains("error:") || lower_line.contains("warning:") {
                        window.emit("build-log", &line_content).map_err(|e| e.to_string())?;
                    }

                    if recent_export_logs.len() >= 20 {
                        recent_export_logs.pop_front();
                    }
                    recent_export_logs.push_back(line_content);
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
                     window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;
                     window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                     return Ok(());
                 }
            };

            if !export_status.success() {
                let error_header = "❌ Export failed. Recent logs:";
                window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": error_header })).map_err(|e| e.to_string())?;

                for log in recent_export_logs {
                    window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": format!("  {}", log) })).map_err(|e| e.to_string())?;
                }

                window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap() })).map_err(|e| e.to_string())?;
                return Err("Export failed".into());
            }

            let final_msg = "✅ Export completed successfully";
            window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": final_msg })).map_err(|e| e.to_string())?;
            writeln!(log_file, "{}", final_msg).map_err(|e| e.to_string())?;

            // Step 3: Upload to App Store (Optional)
            if let Some(true) = options.and_then(|o| o.upload_to_app_store) {
                 if let (Some(api_key), Some(api_issuer)) = (
                    project.ios.config.as_ref().and_then(|c| c.api_key.as_ref()),
                    project.ios.config.as_ref().and_then(|c| c.api_issuer.as_ref())
                 ) {
                    let upload_msg = "🚀 Starting upload to App Store...";
                    window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": upload_msg })).map_err(|e| e.to_string())?;
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
                         window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": file_msg })).map_err(|e| e.to_string())?;
                         writeln!(log_file, "{}", file_msg).map_err(|e| e.to_string())?;

                         let upload_cmd = format!(
                            "xcrun altool --upload-app --type ios --file '{}' --apiKey '{}' --apiIssuer '{}' 2>&1",
                            ipa_path_str.replace("'", "'\\''"),
                            api_key.replace("'", "'\\''"),
                            api_issuer.replace("'", "'\\''")
                         );

                         let mut upload_child = Command::new("/bin/sh")
                            .args(&["-c", &upload_cmd])
                            .stdout(Stdio::piped())
                            .stderr(Stdio::piped())
                            .spawn()
                            .map_err(|e| format!("Failed to start upload: {}", e))?;

                        let upload_stdout = upload_child.stdout.take().unwrap();
                        let upload_reader = BufReader::new(upload_stdout);
                        let mut recent_upload_logs = std::collections::VecDeque::with_capacity(20);

                        // Store process for cancellation
                        let process_id = project.id.clone();
                        {
                            let mut processes = process_state.0.lock().unwrap();
                            processes.insert(process_id.clone(), Arc::new(std::sync::Mutex::new(Some(upload_child))));
                        }

                        for line in upload_reader.lines() {
                            if let Ok(line_content) = line {
                                writeln!(log_file, "{}", line_content).map_err(|e| e.to_string())?;

                                let lower_line = line_content.to_lowercase();
                                if lower_line.contains("error:") || lower_line.contains("warning:") {
                                    window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": line_content })).map_err(|e| e.to_string())?;
                                }

                                if recent_upload_logs.len() >= 20 {
                                    recent_upload_logs.pop_front();
                                }
                                recent_upload_logs.push_back(line_content);
                            }
                        }

                         let upload_status = {
                             let mut processes = process_state.0.lock().unwrap();
                             if let Some(mutex) = processes.remove(&process_id) {
                                 let mut guard = mutex.lock().unwrap();
                                 if let Some(mut child) = guard.take() {
                                     child.wait().map_err(|e| e.to_string())?
                                 } else {
                                     return Err("Upload process handle lost".into());
                                 }
                             } else {
                                 window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;
                                 window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
                                 return Ok(());
                             }
                         };

                         if !upload_status.success() {
                             let err_header = "❌ App Store upload failed. Recent logs:";
                             window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": err_header })).map_err(|e| e.to_string())?;

                             for log in recent_upload_logs {
                                 window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": format!("  {}", log) })).map_err(|e| e.to_string())?;
                             }

                             let footer = "Please check the log file for full details and Apple's specific error code.";
                             window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": footer })).map_err(|e| e.to_string())?;
                             window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;

                             // Send Slack notification on failure
                             let slack_msg = format!("❌ *{}* (iOS) App Store upload failed!\nVersion: {}\nBuild: {}",
                                 project.name, project.ios.version, project.ios.build_number);
                             let _ = send_all_notifications(&project, &slack_msg).await;

                             return Err("Upload failed".into());
                         } else {
                             let succ = "✅ App Store upload completed successfully! Your app is now being processed on App Store Connect.";
                             window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": succ })).map_err(|e| e.to_string())?;
                             writeln!(log_file, "{}", succ).map_err(|e| e.to_string())?;

                             // Send Slack notification
                             let slack_msg = format!("🚀 *{}* (iOS) uploaded to App Store successfully!\nVersion: {}\nBuild: {}",
                                 project.name, project.ios.version, project.ios.build_number);
                             let _ = send_all_notifications(&project, &slack_msg).await;
                         }

                     } else {
                        let err = "❌ IPA file not found for upload";
                        window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": err })).map_err(|e| e.to_string())?;
                        writeln!(log_file, "{}", err).map_err(|e| e.to_string())?;
                    }
                 } else {
                     let msg = "⚠️ Upload requested but API Key or Issuer missing in project settings.";
                     window.emit("build-log", serde_json::json!({ "projectId": project.id, "payload": msg })).map_err(|e| e.to_string())?;
                     writeln!(log_file, "{}", msg).map_err(|e| e.to_string())?;
                 }
            }

            // Emit log file path for frontend to save
            window.emit("build-log-file", serde_json::json!({ "projectId": project.id, "payload": log_file_path.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;

            // Find IPA file for artifact path
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
            if let Some(ipa) = ipa_path {
                window.emit("build-artifact-path", serde_json::json!({ "projectId": project.id, "payload": ipa.to_str().unwrap_or_default() })).map_err(|e| e.to_string())?;
            }

            window.emit("build-status", serde_json::json!({ "status": "success", "projectId": project.id })).map_err(|e| e.to_string())?;

            return Ok(());
        },
        _ => {
            window.emit("build-status", serde_json::json!({ "status": "failed", "projectId": project.id })).map_err(|e| e.to_string())?;
            return Err(format!("Unsupported platform: {}", platform));
        }
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
            #[cfg(unix)]
            {
                let pid = child.id() as libc::pid_t;

                // 1. Kill the entire process group created by process_group(0).
                //    Covers: xcodebuild, clang, swiftc, ld, gradle, aapt, javac, etc.
                let pgid = unsafe { libc::getpgid(pid) };
                if pgid > 0 {
                    unsafe { libc::killpg(pgid, libc::SIGKILL) };
                    println!("Killed process group pgid={} for project: {}", pgid, project_id);
                } else {
                    let _ = child.kill();
                }

                // 2. Fallback via pkill: catches any child that created its own sub-group
                let _ = std::process::Command::new("pkill")
                    .args(&["-KILL", "-P", &pid.to_string()])
                    .output();

                // Reap zombie to free OS resources
                let _ = child.wait();
                Ok(())
            }
            #[cfg(not(unix))]
            {
                match child.kill() {
                    Ok(_) => { let _ = child.wait(); Ok(()) }
                    Err(e) => Err(format!("Failed to kill process: {}", e)),
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
pub async fn open_build_folder(project: Project, platform: String, format: Option<String>) -> Result<(), String> {
    let folder_path = match platform.as_str() {
        "android" => {
             // Standard path for React Native / generic Android Gradle builds
             let sub_path = if format.as_deref() == Some("apk") {
                 "android/app/build/outputs/apk/release"
             } else {
                 "android/app/build/outputs/bundle/release"
             };
             std::path::Path::new(&project.path).join(sub_path)
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
