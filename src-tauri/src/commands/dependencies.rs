use tauri::{command, Window, Emitter};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct DependencyInfo {
    pub name: String,
    pub version: String,
    pub is_dev: bool,
}

#[derive(Serialize, Deserialize)]
pub struct ProjectDependencies {
    pub dependencies: Vec<DependencyInfo>,
    pub dev_dependencies: Vec<DependencyInfo>,
    pub package_manager: String,
}

fn detect_package_manager(project_path: &Path) -> String {
    if project_path.join("yarn.lock").exists() {
        "yarn".to_string()
    } else if project_path.join("pnpm-lock.yaml").exists() {
        "pnpm".to_string()
    } else if project_path.join("bun.lockb").exists() || project_path.join("bun.lock").exists() {
        "bun".to_string()
    } else {
        "npm".to_string()
    }
}

#[command]
pub async fn get_dependencies(project_path: String) -> Result<ProjectDependencies, String> {
    let path = Path::new(&project_path);
    let package_json_path = path.join("package.json");

    if !package_json_path.exists() {
        return Err("package.json not found".to_string());
    }

    let content = fs::read_to_string(package_json_path).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    let mut dependencies = Vec::new();
    let mut dev_dependencies = Vec::new();

    if let Some(deps) = json.get("dependencies").and_then(|d| d.as_object()) {
        for (name, version) in deps {
            dependencies.push(DependencyInfo {
                name: name.clone(),
                version: version.as_str().unwrap_or("").to_string(),
                is_dev: false,
            });
        }
    }

    if let Some(deps) = json.get("devDependencies").and_then(|d| d.as_object()) {
        for (name, version) in deps {
            dev_dependencies.push(DependencyInfo {
                name: name.clone(),
                version: version.as_str().unwrap_or("").to_string(),
                is_dev: true,
            });
        }
    }

    // Sort by name
    dependencies.sort_by(|a, b| a.name.cmp(&b.name));
    dev_dependencies.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(ProjectDependencies {
        dependencies,
        dev_dependencies,
        package_manager: detect_package_manager(path),
    })
}

async fn run_package_command(
    window: Window,
    project_path: String,
    args: Vec<String>,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let package_manager = detect_package_manager(path);

    let mut cmd = if cfg!(target_os = "macos") {
        let cmd_str = format!("{} {}", package_manager, args.join(" "));
        let shell_cmd = format!(
            r#"
            export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
            # Try to source common profile files
            [ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile" >/dev/null 2>&1
            [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" >/dev/null 2>&1
            cd '{}' && {}
            "#,
            project_path, cmd_str
        );
        let mut c = Command::new("/bin/sh");
        c.args(&["-c", &shell_cmd]);
        c
    } else {
        let mut c = Command::new(&package_manager);
        c.args(&args);
        c.current_dir(path);
        c
    };

    cmd.stdout(Stdio::piped())
       .stderr(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| format!("Failed to start command: {}", e))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let window_clone_stdout = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = window_clone_stdout.emit("dep-manager-log", l);
            }
        }
    });

    let window_clone_stderr = window.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = window_clone_stderr.emit("dep-manager-log", format!("⚠️ {}", l));
            }
        }
    });

    let status = child.wait().map_err(|e| e.to_string())?;

    // We don't join the handles here because they might block if sub-processes are still alive
    // Instead, we just check the status and emit. The threads will eventually die when the pipes close.
    // Or we can just let them run in the background.

    if status.success() {
        let _ = window.emit("dep-manager-status", "success");
        Ok(())
    } else {
        let _ = window.emit("dep-manager-status", "failed");
        Err(format!("Command failed with status: {}", status))
    }
}

#[command]
pub async fn install_dependencies(window: Window, project_path: String) -> Result<(), String> {
    run_package_command(window, project_path, vec!["install".to_string()]).await
}

#[command]
pub async fn add_dependency(
    window: Window,
    project_path: String,
    dependency: String,
    is_dev: bool,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let package_manager = detect_package_manager(path);

    let mut args = Vec::new();
    match package_manager.as_str() {
        "yarn" | "bun" => {
            args.push("add".to_string());
            if is_dev {
                args.push("-D".to_string());
            }
        }
        "pnpm" => {
            args.push("add".to_string());
            if is_dev {
                args.push("-D".to_string());
            }
        }
        _ => { // npm
            args.push("install".to_string());
            if is_dev {
                args.push("--save-dev".to_string());
            } else {
                args.push("--save".to_string());
            }
        }
    }
    args.push(dependency);

    run_package_command(window, project_path, args).await
}

#[command]
pub async fn remove_dependency(
    window: Window,
    project_path: String,
    dependency: String,
) -> Result<(), String> {
    let path = Path::new(&project_path);
    let package_manager = detect_package_manager(path);

    let mut args = Vec::new();
    match package_manager.as_str() {
        "yarn" | "pnpm" | "bun" => {
            args.push("remove".to_string());
        }
        _ => { // npm
            args.push("uninstall".to_string());
        }
    }
    args.push(dependency);

    run_package_command(window, project_path, args).await
}
