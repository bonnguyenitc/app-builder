use tauri::command;
use std::process::Command;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CheckStatus {
    Success,
    Warning,
    Error,
    Loading, // For frontend state
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DoctorCheck {
    pub id: String,
    pub name: String,
    pub status: CheckStatus,
    pub message: String,
    pub fix_command: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DoctorResult {
    pub checks: Vec<DoctorCheck>,
}

fn check_node() -> DoctorCheck {
    let output = Command::new("node").arg("-v").output();
    match output {
        Ok(out) if out.status.success() => {
             let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
             DoctorCheck {
                 id: "node".to_string(),
                 name: "Node.js".to_string(),
                 status: CheckStatus::Success,
                 message: format!("Installed ({})", version),
                 fix_command: None,
             }
        },
        _ => DoctorCheck {
            id: "node".to_string(),
            name: "Node.js".to_string(),
            status: CheckStatus::Error,
            message: "Node.js not found".to_string(),
            fix_command: Some("brew install node".to_string()), // Simplified assumption for macOS
        }
    }
}

fn check_ruby() -> DoctorCheck {
    let output = Command::new("ruby").arg("-v").output();
    match output {
        Ok(out) if out.status.success() => {
             let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
             // Just taking the first part of version string usually
             let version_short = version.split_whitespace().nth(1).unwrap_or(&version).to_string();
             DoctorCheck {
                 id: "ruby".to_string(),
                 name: "Ruby".to_string(),
                 status: CheckStatus::Success,
                 message: format!("Installed ({})", version_short),
                 fix_command: None,
             }
        },
        _ => DoctorCheck {
            id: "ruby".to_string(),
            name: "Ruby".to_string(),
            status: CheckStatus::Error,
            message: "Ruby not found".to_string(),
            fix_command: Some("brew install ruby".to_string()),
        }
    }
}

fn check_java() -> DoctorCheck {
    // Check JAVA_HOME first or `java -version`
    // java -version writes to stderr sometimes
    let output = Command::new("java").arg("-version").output();
    match output {
        Ok(out) if out.status.success() => {
             // Usually prints to stderr
             let stderr = String::from_utf8_lossy(&out.stderr);
             let stdout = String::from_utf8_lossy(&out.stdout);
             let version_line = if !stderr.is_empty() { stderr } else { stdout };
             let version = version_line.lines().next().unwrap_or("Unknown").to_string();

             DoctorCheck {
                 id: "java".to_string(),
                 name: "Java JDK".to_string(),
                 status: CheckStatus::Success,
                 message: format!("Installed ({})", version.replace("\"", "")),
                 fix_command: None,
             }
        },
        _ => DoctorCheck {
            id: "java".to_string(),
            name: "Java JDK".to_string(),
            status: CheckStatus::Error,
            message: "Java not found. Required for Android builds.".to_string(),
            fix_command: Some("brew install openjdk@17".to_string()),
        }
    }
}

fn check_cocoapods() -> DoctorCheck {
    let output = Command::new("pod").arg("--version").output();
    match output {
        Ok(out) if out.status.success() => {
             let version = String::from_utf8_lossy(&out.stdout).trim().to_string();
             DoctorCheck {
                 id: "cocoapods".to_string(),
                 name: "CocoaPods".to_string(),
                 status: CheckStatus::Success,
                 message: format!("Installed ({})", version),
                 fix_command: None,
             }
        },
        _ => DoctorCheck {
             id: "cocoapods".to_string(),
             name: "CocoaPods".to_string(),
             status: CheckStatus::Error,
             message: "CocoaPods not found. Required for iOS builds.".to_string(),
             fix_command: Some("sudo gem install cocoapods".to_string()),
        }
    }
}

fn check_xcode() -> DoctorCheck {
     let output = Command::new("xcode-select").arg("-p").output();
     match output {
        Ok(out) if out.status.success() => {
             let path = String::from_utf8_lossy(&out.stdout).trim().to_string();
             DoctorCheck {
                 id: "xcode".to_string(),
                 name: "Xcode".to_string(),
                 status: CheckStatus::Success,
                 message: format!("Installed at {}", path),
                 fix_command: None,
             }
        },
        _ => DoctorCheck {
             id: "xcode".to_string(),
             name: "Xcode".to_string(),
             status: CheckStatus::Error,
             message: "Xcode Command Line Tools not found.".to_string(),
             fix_command: Some("xcode-select --install".to_string()),
        }
    }
}

fn check_android_home() -> DoctorCheck {
    match std::env::var("ANDROID_HOME") {
        Ok(path) => DoctorCheck {
            id: "android_home".to_string(),
            name: "ANDROID_HOME".to_string(),
            status: CheckStatus::Success,
            message: format!("Set to {}", path),
            fix_command: None,
        },
        Err(_) => DoctorCheck {
            id: "android_home".to_string(),
            name: "ANDROID_HOME".to_string(),
            status: CheckStatus::Warning,
            message: "Environment variable not detected. (Might be set in .zshrc/.bashrc but not visible to GUI app)".to_string(),
            fix_command: None, // Hard to auto-fix env vars persistently across shells from a GUI app
        }
    }
}

#[command]
pub async fn run_doctor_checks() -> Result<DoctorResult, String> {
    let mut checks = Vec::new();

    // We can run these in parallel ideally, but sequential is fast enough for 5-6 CLI calls
    checks.push(check_node());
    checks.push(check_ruby());
    checks.push(check_java());
    checks.push(check_xcode());
    checks.push(check_cocoapods());
    checks.push(check_android_home());

    Ok(DoctorResult { checks })
}

#[command]
pub async fn run_fix_command(command_str: String) -> Result<String, String> {
    // Security warning: Running arbitrary shell commands is dangerous.
    // In a real app, we should valid against a whitelist or use specific fix functions.
    // For this prototype, we'll allow it but basic splitting.

    let parts: Vec<&str> = command_str.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let cmd = parts[0];
    let args = &parts[1..];

    let output = Command::new(cmd)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Command failed: {}", err))
    }
}
