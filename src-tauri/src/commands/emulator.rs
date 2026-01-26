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
    let mut running_avds = HashMap::new();

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
            if let Some(device_id) = line.split_whitespace().next() {
                // adb -s <device_id> emu avd name
                let name_cmd = Command::new("adb")
                    .args(&["-s", device_id, "emu", "avd", "name"])
                    .output()
                    .or_else(|_| {
                        Command::new("sh")
                            .arg("-c")
                            .arg(format!("source ~/.zshrc; adb -s {} emu avd name", device_id))
                            .output()
                    });

                if let Ok(name_out) = name_cmd {
                     let name_raw = String::from_utf8_lossy(&name_out.stdout);
                     for n in name_raw.lines() {
                         let trimmed = n.trim();
                         if !trimmed.is_empty() && trimmed != "OK" {
                             running_avds.insert(trimmed.to_string(), true);
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
                 // If not found in .ini, check the .avd/config.ini if available.
                 // Actually usually .ini just points to the path.
                 // But in our previous check, .ini *did* have the target.
                 // Let's assume it's there or we fall back.
             }
        }

        // If still unknown, and we want to be thorough, we could follow the 'path=' in .ini to find config.ini
        // But let's keep it simple for now.

        emulators.push(Emulator {
            id: avd.clone(),
            name: avd.clone(),
            platform: "android".to_string(),
            state: if running_avds.contains_key(&avd) { "Booted".to_string() } else { "Shutdown".to_string() },
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
pub async fn run_app_on_emulator(project_path: String, platform: String, device_id: String) -> Result<(), String> {
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
    println!("[Emulator] Platform: {}, Device ID: {}", platform, device_id);

    #[cfg(target_os = "macos")]
    {
        let run_command = match platform.as_str() {
            "android" => {
                if is_expo {
                    format!("npx expo run:android")
                } else {
                    format!("npx react-native run-android")
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
