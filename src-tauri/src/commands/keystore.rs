use tauri::command;
use std::process::Command;
use std::path::Path;
use std::fs;

#[command]
pub fn generate_keystore(path: String, password: String, alias: String, validity: Option<u32>, keysize: Option<u32>, alg: Option<String>, dname: String) -> Result<String, String> {
    let output_path = Path::new(&path);
    if let Some(parent) = output_path.parent() {
        if !parent.exists() {
             fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    if output_path.exists() {
        return Err("File already exists at the specified path".to_string());
    }

    let validity_days = validity.unwrap_or(10000).to_string();
    let key_size = keysize.unwrap_or(2048).to_string();
    let algorithm = alg.unwrap_or("RSA".to_string());

    // keytool -genkey -v -keystore <path> -alias <alias> -keyalg <alg> -keysize <size> -validity <days> -storepass <pass> -keypass <pass> -dname <dname>
    // Note: In production apps, passing password via CLI args can be insecure (visible in process list).
    // However, for a local tool this is acceptable, or we could pipe it.

    let output = Command::new("keytool")
        .arg("-genkey")
        .arg("-v")
        .arg("-keystore")
        .arg(&path)
        .arg("-alias")
        .arg(&alias)
        .arg("-keyalg")
        .arg(&algorithm)
        .arg("-keysize")
        .arg(&key_size)
        .arg("-validity")
        .arg(&validity_days)
        .arg("-storepass")
        .arg(&password)
        .arg("-keypass")
        .arg(&password)
        .arg("-dname")
        .arg(&dname)
        .output()
        .map_err(|e| format!("Failed to execute keytool: {}", e))?;

    if output.status.success() {
        Ok("Keystore generated successfully".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Keytool validation failed: {}", stderr))
    }
}

#[command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);
    if !path_obj.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open in Finder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,{}", path))
            .spawn()
            .map_err(|e| format!("Failed to open in Explorer: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // simplistic fallback for linux (xdg-open usually opens file or dir, doesn't always select)
        // Opening parent dir is often safer for "show in folder" behavior if no specialized tool
        if let Some(parent) = path_obj.parent() {
             Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Failed to open folder: {}", e))?;
        } else {
             Command::new("xdg-open")
                .arg(&path)
                .spawn()
                .map_err(|e| format!("Failed to open path: {}", e))?;
        }
    }

    Ok(())
}
