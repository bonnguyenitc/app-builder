use tauri::command;
use std::process::Command;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Emulator {
    pub id: String,
    pub name: String,
    pub platform: String, // "android" or "ios"
    pub state: String, // "Booted" or "Shutdown"
    pub version: String,
}

#[command]
pub async fn list_emulators() -> Result<Vec<Emulator>, String> {
    let mut emulators = Vec::new();

    // --- Android ---
    // Try to run emulator command directly first, then fallback to sourcing zshrc
    let output = Command::new("emulator")
        .arg("-list-avds")
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg("source ~/.zshrc; emulator -list-avds")
                .output()
        });

    let avds: Vec<String> = match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout)
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect(),
        Err(_) => Vec::new(),
    };

    // 2. Get Running Devices to map status
    let mut running_avds_serials = HashMap::new(); // AVD Name -> Serial

    let adb_output = Command::new("adb")
        .arg("devices")
        .output()
        .or_else(|_| {
             Command::new("sh")
                .arg("-c")
                .arg("source ~/.zshrc; adb devices")
                .output()
        });

    if let Ok(output) = adb_output {
        let output_str = String::from_utf8_lossy(&output.stdout);
        for line in output_str.lines().skip(1) {
            if let Some(serial) = line.split_whitespace().next() {
                // adb -s <serial> emu avd name
                let name_cmd = Command::new("adb")
                    .args(&["-s", serial, "emu", "avd", "name"])
                    .output()
                    .or_else(|_| {
                        Command::new("sh")
                            .arg("-c")
                            .arg(format!("source ~/.zshrc; adb -s {} emu avd name", serial))
                            .output()
                    });

                if let Ok(name_out) = name_cmd {
                     let name_raw = String::from_utf8_lossy(&name_out.stdout);
                     for n in name_raw.lines() {
                         let trimmed = n.trim();
                         if !trimmed.is_empty() && trimmed != "OK" {
                             running_avds_serials.insert(trimmed.to_string(), serial.to_string());
                             break;
                         }
                     }
                }
            }
        }
    }

    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    for avd in avds {
        let mut version = "Unknown".to_string();
        // Try to read ~/.android/avd/{avd}.ini first
        let ini_path = PathBuf::from(&home).join(".android/avd").join(format!("{}.ini", avd));

        // Helper closure to parse target=... from content
        let parse_version = |content: String| -> Option<String> {
             for line in content.lines() {
                 if line.trim().starts_with("target=") {
                    return Some(line.trim().trim_start_matches("target=").replace("android-", "Android "));
                 }
             }
             None
        };

        if ini_path.exists() {
             if let Ok(content) = fs::read_to_string(&ini_path) {
                 if let Some(v) = parse_version(content) {
                     version = v;
                 }
             }
        }

        let serial = running_avds_serials.get(&avd);
        let is_booted = serial.is_some();

        emulators.push(Emulator {
            id: serial.cloned().unwrap_or(avd.clone()),
            name: avd.clone(),
            platform: "android".to_string(),
            state: if is_booted { "Booted".to_string() } else { "Shutdown".to_string() },
            version
        });
    }

    // --- iOS ---
    let xcrun_output = Command::new("xcrun")
        .args(&["simctl", "list", "devices", "available", "--json"])
        .output();

    if let Ok(output) = xcrun_output {
        let output_str = String::from_utf8_lossy(&output.stdout);
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&output_str) {
             if let Some(devices_map) = json["devices"].as_object() {
                 for (runtime, devices) in devices_map {
                     // Parsing runtime string "com.apple.CoreSimulator.SimRuntime.iOS-17-0"
                     let mut version = "Unknown".to_string();
                     if let Some(last_part) = runtime.split('.').last() {
                         version = last_part.replace("-", ".");
                         if version.starts_with("iOS.") {
                             version = version.replace("iOS.", "iOS ");
                         } else if version.starts_with("iOS") {
                             version = version.replace("iOS", "iOS ");
                         }
                     }

                     if let Some(device_list) = devices.as_array() {
                         for device in device_list {
                             let name = device["name"].as_str().unwrap_or("Unknown").to_string();
                             let udid = device["udid"].as_str().unwrap_or("").to_string();
                             let state = device["state"].as_str().unwrap_or("Shutdown").to_string();

                             emulators.push(Emulator {
                                 id: udid,
                                 name,
                                 platform: "ios".to_string(),
                                 state,
                                 version: version.clone(),
                             });
                         }
                     }
                 }
             }
        }
    }

    Ok(emulators)
}

#[command]
pub async fn launch_emulator(id: String, platform: String) -> Result<(), String> {
    match platform.as_str() {
        "android" => {
            // Try direct spawn first
            if Command::new("emulator").arg("-avd").arg(&id).spawn().is_err() {
                 // Fallback to shell
                 Command::new("sh")
                    .arg("-c")
                    .arg(format!("source ~/.zshrc; emulator -avd {}", id))
                    .spawn()
                    .map_err(|e| format!("Failed to start emulator: {}", e))?;
            }
        },
        "ios" => {
            // xcrun simctl boot <udid>
            // Ignore error if already booted
            let _ = Command::new("xcrun")
                .args(&["simctl", "boot", &id])
                .output();

            // Open Simulator.app
             Command::new("open")
                .args(&["-a", "Simulator"])
                .output()
                .map_err(|e| format!("Failed to open Simulator app: {}", e))?;
        },
        _ => return Err("Unknown platform".to_string()),
    }
    Ok(())
}

/// Check if the project is an Expo project by looking for Expo-specific files and dependencies
fn is_expo_project(project_path: &std::path::Path) -> bool {
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
pub async fn run_app_on_emulator(project_path: String, platform: String, device_id: String, device_name: String) -> Result<(), String> {
    let path = std::path::Path::new(&project_path);
    if !path.exists() {
        return Err("Project path does not exist".to_string());
    }

    // Detect if this is an Expo project
    let is_expo = is_expo_project(path);

    // Log for debugging
    let project_type = if is_expo { "Expo" } else { "React Native" };
    println!("[Emulator] Project type detected: {}", project_type);
    println!("[Emulator] Project path: {}", project_path);
    println!("[Emulator] Platform: {}, Device ID: {}, Device Name: {}", platform, device_id, device_name);

    #[cfg(target_os = "macos")]
    {
        let run_command = match platform.as_str() {
            "android" => {
                if is_expo {
                    // Expo Android works better with the AVD Name / Model Name
                    format!("npx expo run:android --device '{}'", device_name)
                } else {
                    // React Native works fine with Serial
                    format!("npx react-native run-android --deviceId '{}'", device_id)
                }
            },
            "ios" => {
                if is_expo {
                    format!("npx expo run:ios --device '{}'", device_id)
                } else {
                    format!("npx react-native run-ios --udid '{}'", device_id)
                }
            },
            _ => return Err("Unsupported platform".to_string()),
        };

        println!("[Emulator] Running command: {}", run_command);

        // Build full script with echo for debugging in terminal
        let script = format!(
            "cd '{}' && echo '🚀 [App Builder] Detected project type: {}' && echo '📦 Running: {}' && echo '' && {}",
            project_path,
            project_type,
            run_command,
            run_command
        );

        // Escape for AppleScript
        let escaped_script = script.replace("\\", "\\\\").replace("\"", "\\\"");

        // Use AppleScript to open Terminal, run the script, AND activate Terminal (bring to front)
        let apple_script = format!(
            r#"
            tell application "Terminal"
                do script "{}"
                activate
            end tell
            "#,
            escaped_script
        );

        Command::new("osascript")
            .arg("-e")
            .arg(apple_script)
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        return Err("Only macOS is supported currently".to_string());
    }

    Ok(())
}

#[command]
pub async fn open_url_on_emulator(url: String, platform: String, device_id: String) -> Result<(), String> {
    println!("open_url_on_emulator called with: url={}, platform={}, device_id={}", url, platform, device_id);
    match platform.as_str() {
        "ios" => {
            // xcrun simctl openurl <device_id> <url>
            let device_target = if device_id.is_empty() { "booted".to_string() } else { device_id };
            let output = Command::new("xcrun")
                .args(&["simctl", "openurl", &device_target, &url])
                .output()
                .map_err(|e| format!("Failed to execute xcrun: {}", e))?;

            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).to_string());
            }
        },
        "android" => {
             // adb -s <device_id> shell am start -a android.intent.action.VIEW -d <url>
             let output = Command::new("adb")
                .args(&["-s", &device_id, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", &url])
                .output()
                .or_else(|_| {
                     Command::new("sh")
                        .arg("-c")
                        .arg(format!("source ~/.zshrc; adb -s {} shell am start -a android.intent.action.VIEW -d \"{}\"", device_id, url))
                        .output()
                })
                .map_err(|e| format!("Failed to execute adb: {}", e))?;

             if !output.status.success() {
                 return Err(String::from_utf8_lossy(&output.stderr).to_string());
             }
        },
        _ => return Err("Unsupported platform".to_string()),
    }
    Ok(())
}

/// Uninstall an app from the Android emulator
#[command]
pub async fn adb_uninstall_app(device_id: String, package_name: String) -> Result<String, String> {
    println!("[ADB] Uninstalling {} from device {}", package_name, device_id);

    let output = Command::new("adb")
        .args(&["-s", &device_id, "uninstall", &package_name])
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg(format!("source ~/.zshrc; adb -s {} uninstall {}", device_id, package_name))
                .output()
        })
        .map_err(|e| format!("Failed to execute adb: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() || stdout.contains("Success") {
        Ok(format!("Successfully uninstalled {}", package_name))
    } else {
        Err(format!("Failed to uninstall: {} {}", stdout, stderr))
    }
}

/// Clear app data on Android emulator
#[command]
pub async fn adb_clear_app_data(device_id: String, package_name: String) -> Result<String, String> {
    println!("[ADB] Clearing data for {} on device {}", package_name, device_id);

    let output = Command::new("adb")
        .args(&["-s", &device_id, "shell", "pm", "clear", &package_name])
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg(format!("source ~/.zshrc; adb -s {} shell pm clear {}", device_id, package_name))
                .output()
        })
        .map_err(|e| format!("Failed to execute adb: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() || stdout.contains("Success") {
        Ok(format!("Successfully cleared data for {}", package_name))
    } else {
        Err(format!("Failed to clear data: {} {}", stdout, stderr))
    }
}

/// Force stop an app on Android emulator
#[command]
pub async fn adb_force_stop_app(device_id: String, package_name: String) -> Result<String, String> {
    println!("[ADB] Force stopping {} on device {}", package_name, device_id);

    let output = Command::new("adb")
        .args(&["-s", &device_id, "shell", "am", "force-stop", &package_name])
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg(format!("source ~/.zshrc; adb -s {} shell am force-stop {}", device_id, package_name))
                .output()
        })
        .map_err(|e| format!("Failed to execute adb: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully stopped {}", package_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Open logcat in a new terminal window
#[command]
pub async fn adb_open_logcat(device_id: String, package_name: Option<String>) -> Result<(), String> {
    println!("[ADB] Opening logcat for device {}", device_id);

    #[cfg(target_os = "macos")]
    {
        let logcat_cmd = if let Some(pkg) = package_name {
            format!("adb -s {} logcat --pid=$(adb -s {} shell pidof -s {})", device_id, device_id, pkg)
        } else {
            format!("adb -s {} logcat", device_id)
        };

        let apple_script = format!(
            r#"
            tell application "Terminal"
                do script "echo '📱 Logcat for {}' && {}"
                activate
            end tell
            "#,
            device_id,
            logcat_cmd
        );

        Command::new("osascript")
            .arg("-e")
            .arg(apple_script)
            .spawn()
            .map_err(|e| format!("Failed to open logcat: {}", e))?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        return Err("Only macOS is supported currently".to_string());
    }

    Ok(())
}

/// Take a screenshot from the Android emulator
#[command]
pub async fn adb_take_screenshot(device_id: String, save_path: String) -> Result<String, String> {
    println!("[ADB] Taking screenshot from device {} to {}", device_id, save_path);

    // Take screenshot on device
    let temp_path = "/sdcard/screenshot.png";
    let capture = Command::new("adb")
        .args(&["-s", &device_id, "shell", "screencap", "-p", temp_path])
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg(format!("source ~/.zshrc; adb -s {} shell screencap -p {}", device_id, temp_path))
                .output()
        })
        .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

    if !capture.status.success() {
        return Err(String::from_utf8_lossy(&capture.stderr).to_string());
    }

    // Pull the file
    let pull = Command::new("adb")
        .args(&["-s", &device_id, "pull", temp_path, &save_path])
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg(format!("source ~/.zshrc; adb -s {} pull {} {}", device_id, temp_path, save_path))
                .output()
        })
        .map_err(|e| format!("Failed to pull screenshot: {}", e))?;

    if pull.status.success() {
        // Clean up temp file on device
        let _ = Command::new("adb")
            .args(&["-s", &device_id, "shell", "rm", temp_path])
            .output();

        Ok(save_path)
    } else {
        Err(String::from_utf8_lossy(&pull.stderr).to_string())
    }
}

/// Restart (force-stop then launch) an app on Android emulator
#[command]
pub async fn adb_restart_app(device_id: String, package_name: String) -> Result<String, String> {
    println!("[ADB] Restarting {} on device {}", package_name, device_id);

    // Force stop first
    let _ = Command::new("adb")
        .args(&["-s", &device_id, "shell", "am", "force-stop", &package_name])
        .output();

    // Launch the app using monkey (launches main activity)
    let output = Command::new("adb")
        .args(&["-s", &device_id, "shell", "monkey", "-p", &package_name, "-c", "android.intent.category.LAUNCHER", "1"])
        .output()
        .or_else(|_| {
            Command::new("sh")
                .arg("-c")
                .arg(format!(
                    "source ~/.zshrc; adb -s {} shell monkey -p {} -c android.intent.category.LAUNCHER 1",
                    device_id, package_name
                ))
                .output()
        })
        .map_err(|e| format!("Failed to restart app: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully restarted {}", package_name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// List installed packages on emulator (both Android and iOS)
#[command]
pub async fn list_installed_apps(device_id: String, platform: String) -> Result<Vec<String>, String> {
    println!("[Emulator] Listing installed apps on {} ({})", device_id, platform);

    match platform.as_str() {
        "android" => {
            let output = Command::new("adb")
                .args(&["-s", &device_id, "shell", "pm", "list", "packages", "-3"])
                .output()
                .or_else(|_| {
                    Command::new("sh")
                        .arg("-c")
                        .arg(format!("source ~/.zshrc; adb -s {} shell pm list packages -3", device_id))
                        .output()
                })
                .map_err(|e| format!("Failed to list packages: {}", e))?;

            if output.status.success() {
                let packages: Vec<String> = String::from_utf8_lossy(&output.stdout)
                    .lines()
                    .filter_map(|line| {
                        line.strip_prefix("package:").map(|s| s.trim().to_string())
                    })
                    .collect();
                Ok(packages)
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        },
        "ios" => {
            let output = Command::new("xcrun")
                .args(&["simctl", "listapps", &device_id])
                .output()
                .map_err(|e| format!("Failed to list apps: {}", e))?;

            if output.status.success() {
                // Parse plist output to get bundle IDs
                let stdout = String::from_utf8_lossy(&output.stdout);
                let apps: Vec<String> = stdout
                    .lines()
                    .filter(|line| line.contains("CFBundleIdentifier"))
                    .filter_map(|line| {
                        line.split('=').nth(1).map(|s| {
                            s.trim().trim_matches(|c| c == ';' || c == '"' || c == ' ').to_string()
                        })
                    })
                    .filter(|s| !s.starts_with("com.apple."))
                    .collect();
                Ok(apps)
            } else {
                Err(String::from_utf8_lossy(&output.stderr).to_string())
            }
        },
        _ => Err("Unsupported platform".to_string()),
    }
}

/// Uninstall an app from the iOS simulator
#[command]
pub async fn simctl_uninstall_app(device_id: String, bundle_id: String) -> Result<String, String> {
    println!("[simctl] Uninstalling {} from device {}", bundle_id, device_id);

    let output = Command::new("xcrun")
        .args(&["simctl", "uninstall", &device_id, &bundle_id])
        .output()
        .map_err(|e| format!("Failed to execute simctl: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully uninstalled {}", bundle_id))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Terminate (force stop) an app on the iOS simulator
#[command]
pub async fn simctl_terminate_app(device_id: String, bundle_id: String) -> Result<String, String> {
    println!("[simctl] Terminating {} on device {}", bundle_id, device_id);

    let output = Command::new("xcrun")
        .args(&["simctl", "terminate", &device_id, &bundle_id])
        .output()
        .map_err(|e| format!("Failed to execute simctl: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully terminated {}", bundle_id))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Restart an app on the iOS simulator
#[command]
pub async fn simctl_restart_app(device_id: String, bundle_id: String) -> Result<String, String> {
    println!("[simctl] Restarting {} on device {}", bundle_id, device_id);

    // Terminate first
    let _ = Command::new("xcrun")
        .args(&["simctl", "terminate", &device_id, &bundle_id])
        .output();

    // Launch
    let output = Command::new("xcrun")
        .args(&["simctl", "launch", &device_id, &bundle_id])
        .output()
        .map_err(|e| format!("Failed to execute simctl: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully restarted {}", bundle_id))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Take a screenshot of the iOS simulator
#[command]
pub async fn simctl_take_screenshot(device_id: String, save_path: String) -> Result<String, String> {
    println!("[simctl] Taking screenshot of device {} to {}", device_id, save_path);

    let output = Command::new("xcrun")
        .args(&["simctl", "io", &device_id, "screenshot", &save_path])
        .output()
        .map_err(|e| format!("Failed to execute simctl: {}", e))?;

    if output.status.success() {
        Ok(save_path)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Erase (wipe) the iOS simulator contents and settings
#[command]
pub async fn simctl_erase_device(device_id: String) -> Result<String, String> {
    println!("[simctl] Erasing device {}", device_id);

    let output = Command::new("xcrun")
        .args(&["simctl", "erase", &device_id])
        .output()
        .map_err(|e| format!("Failed to execute simctl: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully erased device content and settings"))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}


/// Start screen recording on emulator
#[command]
pub async fn start_recording(
    device_id: String,
    platform: String,
    save_path: String,
    state: tauri::State<'_, crate::RecordingState>,
) -> Result<(), String> {
    println!("[Recording] Starting recording for {} on {}", device_id, platform);

    let child = match platform.as_str() {
        "android" => {
            let temp_device_path = "/sdcard/recording_temp.mp4";
            Command::new("adb")
                .args(&["-s", &device_id, "shell", "screenrecord", temp_device_path])
                .spawn()
                .map(|c| (c, Some(temp_device_path.to_string())))
                .map_err(|e| format!("Failed to start adb recording: {}", e))?
        }
        "ios" => {
            Command::new("xcrun")
                .args(&["simctl", "io", &device_id, "recordVideo", &save_path])
                .spawn()
                .map(|c| (c, None))
                .map_err(|e| format!("Failed to start simctl recording: {}", e))?
        }
        _ => return Err("Unsupported platform".to_string()),
    };

    let mut map = state.0.lock().map_err(|_| "Failed to lock recording state")?;
    map.insert(
        device_id,
        crate::RecordingProcess {
            child: child.0,
            platform,
            device_temp_path: child.1,
            destination_path: save_path,
        },
    );

    Ok(())
}

/// Stop screen recording on emulator
#[command]
pub async fn stop_recording(
    device_id: String,
    state: tauri::State<'_, crate::RecordingState>,
) -> Result<String, String> {
    println!("[Recording] Stopping recording for {}", device_id);

    let mut process = {
        let mut map = state.0.lock().map_err(|_| "Failed to lock recording state")?;
        map.remove(&device_id).ok_or("No active recording found for this device")?
    };

    // 1. Send SIGINT (2) to stop the recording process gracefully
    let pid = process.child.id();

    if process.platform == "android" {
        // Send signal directly to the screenrecord process ON the device
        // We use killall -INT which is more common across Android versions
        let _ = Command::new("adb")
            .args(&["-s", &device_id, "shell", "killall", "-INT", "screenrecord"])
            .output();

        // Give the device 1 second to finish the file write
        std::thread::sleep(std::time::Duration::from_secs(1));
    }

    // Also stop the local adb/simctl process
    let _ = Command::new("kill")
        .args(&["-2", &pid.to_string()])
        .output();

    // 2. Wait for the local process to exit
    let _ = process.child.wait();

    // 3. CRITICAL: Wait for the OS/Device to finalize the file.
    std::thread::sleep(std::time::Duration::from_secs(2));

    if process.platform == "android" {
        if let Some(temp_path) = process.device_temp_path {
            println!("[Recording] Pulling video from Android: {} -> {}", temp_path, process.destination_path);

            // Check if file exists on device before pulling
            let check_file = Command::new("adb")
                .args(&["-s", &device_id, "shell", "ls", &temp_path])
                .output();

            if let Ok(out) = check_file {
                if out.status.success() {
                    // Pull the file
                    let pull = Command::new("adb")
                        .args(&["-s", &device_id, "pull", &temp_path, &process.destination_path])
                        .output();

                    match pull {
                        Ok(p) if p.status.success() => {
                            println!("[Recording] Successfully pulled Android recording");
                        }
                        Ok(p) => return Err(format!("ADB Pull failed: {}", String::from_utf8_lossy(&p.stderr))),
                        Err(e) => return Err(format!("Failed to execute ADB pull: {}", e)),
                    }

                    // Cleanup device
                    let _ = Command::new("adb")
                        .args(&["-s", &device_id, "shell", "rm", &temp_path])
                        .output();
                } else {
                    return Err("Recording file not found on Android device. Maybe it was too short?".to_string());
                }
            }
        }
    }

    Ok(process.destination_path)
}

/// Check if a device is currently recording
#[command]
pub async fn is_device_recording(
    device_id: String,
    state: tauri::State<'_, crate::RecordingState>,
) -> Result<bool, String> {
    let map = state.0.lock().map_err(|_| "Failed to lock recording state")?;
    Ok(map.contains_key(&device_id))
}
