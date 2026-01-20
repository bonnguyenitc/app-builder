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

            ("xcodebuild", vec!["-scheme", scheme, "-configuration", configuration, "build"], ios_dir)
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
            // Standard Xcode build output is often in DerivedData, but if we ran xcodebuild in the project dir
            // without specifying an output, it might be tricky.
            // However, React Native often puts it in ios/build or similar if configured.
            // unique_scheme_build configuration often puts products in `ios/build/Build/Products/Release-iphoneos`
            // Let's try to open the project ios folder if specific build folder is hard to guess,
            // OR best effort to `ios/` so user can see.
             std::path::Path::new(&project.path).join("ios")
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
