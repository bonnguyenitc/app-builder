use tauri::command;
use std::path::Path;
use std::fs::File;
use std::io::Read;
use serde::{Serialize, Deserialize};
use zip::ZipArchive;
use goblin::elf::Elf;
use goblin::elf::program_header::PT_LOAD;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SizeBreakdown {
    pub name: String,
    pub size: u64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LargeFile {
    pub path: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSizeReport {
    pub total_size: u64,
    pub breakdown: Vec<SizeBreakdown>,
    pub file_type: String,
    pub supports_16k_page_size: Option<bool>,
    pub large_files: Vec<LargeFile>,
}

#[command]
pub async fn analyze_app_size(artifact_path: String) -> Result<AppSizeReport, String> {
    let path = Path::new(&artifact_path);
    if !path.exists() {
        return Err(format!("File not found: {}", artifact_path));
    }

    let file = File::open(path).map_err(|e| e.to_string())?;
    let total_size = file.metadata().map_err(|e| e.to_string())?.len();

    let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

    let mut breakdown: Vec<SizeBreakdown> = Vec::new();
    let large_files: Vec<LargeFile>;
    let mut supports_16k_page_size = if extension == "apk" || extension == "aab" { Some(true) } else { None };

    match extension {
        "apk" | "aab" | "ipa" => {
            let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

            let mut code_size = 0;
            let mut resource_size = 0;
            let mut asset_size = 0;
            let mut native_lib_size = 0;
            let mut other_size = 0;

            let mut all_files: Vec<(String, u64)> = Vec::new();

            for i in 0..archive.len() {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let size = file.size();
                let name = file.name().to_string(); // Clone name to avoid borrow issues

                all_files.push((name.clone(), size));

                if extension == "apk" || extension == "aab" {
                    if name.ends_with(".dex") {
                        code_size += size;
                    } else if name.starts_with("res/") || name == "resources.arsc" {
                        resource_size += size;
                    } else if name.starts_with("assets/") {
                        asset_size += size;
                    } else if name.starts_with("lib/") || name.contains("/lib/") { // Check for /lib/ for AABs often in base/lib/
                        native_lib_size += size;

                        // Check 16KB support if we still think it supports it
                        if supports_16k_page_size == Some(true) && name.ends_with(".so") {
                            // Only check ARM64 libraries as 16KB page size is primarily strict on ARM64
                            // Typically lib/arm64-v8a/
                            if name.contains("arm64-v8a") || name.contains("x86_64") {
                                let mut buffer = Vec::new();
                                if file.read_to_end(&mut buffer).is_ok() {
                                    if let Ok(elf) = Elf::parse(&buffer) {
                                        let is_16k_compatible = elf.program_headers.iter()
                                            .filter(|ph| ph.p_type == PT_LOAD)
                                            .all(|ph| ph.p_align >= 0x4000);

                                        if !is_16k_compatible {
                                            supports_16k_page_size = Some(false);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        other_size += size;
                    }
                } else if extension == "ipa" {
                    // Logic for iOS (IPA contains a Payload folder with .app bundle)
                    if name.contains(".app/Frameworks/") || name.ends_with(".dylib") {
                        native_lib_size += size;
                    } else if name.contains(".app/Assets.car") || name.ends_with(".nib") || name.ends_with(".plist") {
                        resource_size += size;
                    } else if name.contains(".app/") && (name.ends_with(".jsbundle") || name.contains("bundle")) {
                        code_size += size;
                    } else if name.contains(".app/") {
                        // Check if it's the main executable
                        let parts: Vec<&str> = name.split('/').collect();
                        if parts.len() > 2 && parts[1].ends_with(".app") && parts[2] == parts[1].trim_end_matches(".app") {
                             code_size += size;
                        } else {
                             other_size += size;
                        }
                    } else {
                        other_size += size;
                    }
                }
            }

            // Process largest files
            all_files.sort_by(|a, b| b.1.cmp(&a.1));
            large_files = all_files.into_iter().take(20).map(|(path, size)| LargeFile { path, size }).collect();

            if code_size > 0 {
                breakdown.push(SizeBreakdown {
                    name: "Code (DEX/JS)".to_string(),
                    size: code_size,
                    percentage: (code_size as f64 / total_size as f64) * 100.0,
                });
            }
            if resource_size > 0 {
                breakdown.push(SizeBreakdown {
                    name: "Resources".to_string(),
                    size: resource_size,
                    percentage: (resource_size as f64 / total_size as f64) * 100.0,
                });
            }
            if asset_size > 0 {
                breakdown.push(SizeBreakdown {
                    name: "Assets".to_string(),
                    size: asset_size,
                    percentage: (asset_size as f64 / total_size as f64) * 100.0,
                });
            }
            if native_lib_size > 0 {
                breakdown.push(SizeBreakdown {
                    name: "Native Libraries".to_string(),
                    size: native_lib_size,
                    percentage: (native_lib_size as f64 / total_size as f64) * 100.0,
                });
            }
            if other_size > 0 {
                breakdown.push(SizeBreakdown {
                    name: "Others".to_string(),
                    size: other_size,
                    percentage: (other_size as f64 / total_size as f64) * 100.0,
                });
            }
        },
        _ => return Err(format!("Unsupported file extension: {}", extension)),
    }

    Ok(AppSizeReport {
        total_size,
        breakdown,
        file_type: extension.to_uppercase(),
        supports_16k_page_size,
        large_files,
    })
}
