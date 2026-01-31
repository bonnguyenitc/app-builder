use tauri::{command, Window, Emitter};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::fs;

#[command]
pub async fn deep_clean_project(
    window: Window,
    project_path: String,
) -> Result<(), String> {
    let project_dir = Path::new(&project_path);
    let emit_channel = "maintenance-log";

    let emit_log = |msg: String| {
        let _ = window.emit(emit_channel, msg);
    };

    emit_log(format!("🧹 Starting Deep Clean for: {}", project_path));

    // 1. Watchman del-all (Run first to clear any file locks/watches)
    emit_log("Running: watchman watch-del-all".to_string());
    let _ = Command::new("watchman").arg("watch-del-all").output();

    // 2. Remove node_modules
    let node_modules = project_dir.join("node_modules");
    if node_modules.exists() {
        emit_log("Running: rm -rf node_modules".to_string());
        if let Err(e) = fs::remove_dir_all(&node_modules) {
             emit_log(format!("⚠️ Failed to remove node_modules: {}", e));
        } else {
             emit_log("✅ node_modules removed".to_string());
        }
    }

    // 3. Remove iOS build folders
    let ios_dir = project_dir.join("ios");
    if ios_dir.exists() {
        let targets = vec!["build", "Pods", "DerivedData"];
        for target in targets {
            let target_path = ios_dir.join(target);
            if target_path.exists() {
                emit_log(format!("Running: rm -rf ios/{}", target));
                let _ = fs::remove_dir_all(&target_path);
            }
        }

        let podfile_lock = ios_dir.join("Podfile.lock");
        if podfile_lock.exists() {
             emit_log("Running: rm ios/Podfile.lock".to_string());
             let _ = fs::remove_file(podfile_lock);
        }
    }

    // 4. Remove Android build folders
    let android_dir = project_dir.join("android");
    if android_dir.exists() {
        let targets = vec!["app/build", ".gradle"];
        for target in targets {
            let target_path = android_dir.join(target);
            if target_path.exists() {
                emit_log(format!("Running: rm -rf android/{}", target));
                let _ = fs::remove_dir_all(&target_path);
            }
        }
    }

    // 5. Install Dependencies (npm/yarn)
    let has_yarn_lock = project_dir.join("yarn.lock").exists();
    let (install_cmd, install_args) = if has_yarn_lock {
        ("yarn", vec!["install"])
    } else {
        ("npm", vec!["install"])
    };

    emit_log(format!("Running: {} install", install_cmd));
    run_command_and_stream(&window, install_cmd, &install_args, project_dir)?;

    // 6. Pod Install (iOS)
    if ios_dir.exists() {
        emit_log("Running: cd ios && pod install".to_string());

        let has_gemfile = ios_dir.join("Gemfile").exists();
        let (pod_cmd, pod_args) = if has_gemfile {
            ("bundle", vec!["exec", "pod", "install"])
        } else {
            ("pod", vec!["install"])
        };

        // Check if command exists first
        if Command::new(pod_cmd).arg("--version").output().is_ok() {
             run_command_and_stream(&window, pod_cmd, &pod_args, &ios_dir)?;
        } else {
            emit_log(format!("⚠️ Command '{}' not found. Skipping pod install.", pod_cmd));
        }
    }

    emit_log("✅ Deep Clean Completed Successfully!".to_string());
    window.emit("maintenance-status", "success").map_err(|e| e.to_string())?;

    Ok(())
}

fn run_command_and_stream(window: &Window, cmd: &str, args: &[&str], dir: &Path) -> Result<(), String> {
    // Basic path setup for Mac
    let shell_cmd = format!(
        "export PATH=\"/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH\"; cd '{}' && {} {} 2>&1",
        dir.to_string_lossy(),
        cmd,
        args.join(" ")
    );

    let mut child = Command::new("/bin/sh")
        .args(&["-c", &shell_cmd])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped()) // duplicate stdout to stderr due to 2>&1 above, but safe to keep
        .spawn()
        .map_err(|e| format!("Failed to start command {}: {}", cmd, e))?;

    let stdout = child.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    for line in reader.lines() {
        if let Ok(line_content) = line {
            let _ = window.emit("maintenance-log", &line_content);
        }
    }

    let status = child.wait().map_err(|e| e.to_string())?;

    if !status.success() {
        return Err(format!("Command {} failed", cmd));
    }

    Ok(())
}
