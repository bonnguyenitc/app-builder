use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::command;
use image::{DynamicImage, ImageFormat};

#[derive(Debug, Serialize, Deserialize)]
pub struct IconSize {
    pub size: u32,
    pub scale: u32,
    pub idiom: String,
    pub filename: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IconGenerationResult {
    pub success: bool,
    pub generated_files: Vec<String>,
    pub output_path: String,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct IconGenerationOptions {
    pub source_image_path: String,
    pub output_path: String,
    pub platforms: Vec<String>, // ["ios", "android"]
    pub android_icon_name: Option<String>, // Default: ic_launcher
}

// iOS icon sizes based on Apple's requirements
fn get_ios_icon_sizes() -> Vec<IconSize> {
    vec![
        // iPhone Notification
        IconSize { size: 20, scale: 2, idiom: "iphone".to_string(), filename: "Icon-20@2x.png".to_string() },
        IconSize { size: 20, scale: 3, idiom: "iphone".to_string(), filename: "Icon-20@3x.png".to_string() },

        // iPhone Settings
        IconSize { size: 29, scale: 2, idiom: "iphone".to_string(), filename: "Icon-29@2x.png".to_string() },
        IconSize { size: 29, scale: 3, idiom: "iphone".to_string(), filename: "Icon-29@3x.png".to_string() },

        // iPhone Spotlight
        IconSize { size: 40, scale: 2, idiom: "iphone".to_string(), filename: "Icon-40@2x.png".to_string() },
        IconSize { size: 40, scale: 3, idiom: "iphone".to_string(), filename: "Icon-40@3x.png".to_string() },

        // iPhone App
        IconSize { size: 60, scale: 2, idiom: "iphone".to_string(), filename: "Icon-60@2x.png".to_string() },
        IconSize { size: 60, scale: 3, idiom: "iphone".to_string(), filename: "Icon-60@3x.png".to_string() },

        // iPad Notification
        IconSize { size: 20, scale: 1, idiom: "ipad".to_string(), filename: "Icon-20.png".to_string() },
        IconSize { size: 20, scale: 2, idiom: "ipad".to_string(), filename: "Icon-20@2x-ipad.png".to_string() },

        // iPad Settings
        IconSize { size: 29, scale: 1, idiom: "ipad".to_string(), filename: "Icon-29.png".to_string() },
        IconSize { size: 29, scale: 2, idiom: "ipad".to_string(), filename: "Icon-29@2x-ipad.png".to_string() },

        // iPad Spotlight
        IconSize { size: 40, scale: 1, idiom: "ipad".to_string(), filename: "Icon-40.png".to_string() },
        IconSize { size: 40, scale: 2, idiom: "ipad".to_string(), filename: "Icon-40@2x-ipad.png".to_string() },

        // iPad App
        IconSize { size: 76, scale: 1, idiom: "ipad".to_string(), filename: "Icon-76.png".to_string() },
        IconSize { size: 76, scale: 2, idiom: "ipad".to_string(), filename: "Icon-76@2x.png".to_string() },

        // iPad Pro App
        IconSize { size: 83, scale: 2, idiom: "ipad".to_string(), filename: "Icon-83.5@2x.png".to_string() },

        // App Store
        IconSize { size: 1024, scale: 1, idiom: "ios-marketing".to_string(), filename: "Icon-1024.png".to_string() },
    ]
}

// Android icon sizes (mipmap) - Regular launcher icons
fn get_android_launcher_sizes() -> Vec<(String, u32)> {
    vec![
        ("mipmap-mdpi".to_string(), 48),
        ("mipmap-hdpi".to_string(), 72),
        ("mipmap-xhdpi".to_string(), 96),
        ("mipmap-xxhdpi".to_string(), 144),
        ("mipmap-xxxhdpi".to_string(), 192),
    ]
}

// Android adaptive icon foreground sizes (108dp base)
fn get_android_adaptive_sizes() -> Vec<(String, u32)> {
    vec![
        ("mipmap-mdpi".to_string(), 108),
        ("mipmap-hdpi".to_string(), 162),
        ("mipmap-xhdpi".to_string(), 216),
        ("mipmap-xxhdpi".to_string(), 324),
        ("mipmap-xxxhdpi".to_string(), 432),
    ]
}

fn resize_image(img: &DynamicImage, target_size: u32) -> DynamicImage {
    img.resize_exact(
        target_size,
        target_size,
        image::imageops::FilterType::Lanczos3,
    )
}

fn resize_image_round(img: &DynamicImage, target_size: u32) -> DynamicImage {
    // First resize the image
    let resized = img.resize_exact(
        target_size,
        target_size,
        image::imageops::FilterType::Lanczos3,
    );

    // Convert to RGBA for transparency support
    let mut rgba = resized.to_rgba8();
    let size = target_size as i32;
    let center = size as f32 / 2.0;
    let radius = center;

    // Apply circular mask
    for y in 0..target_size {
        for x in 0..target_size {
            let dx = x as f32 - center;
            let dy = y as f32 - center;
            let distance = (dx * dx + dy * dy).sqrt();

            if distance > radius {
                // Outside circle - make transparent
                rgba.put_pixel(x, y, image::Rgba([0, 0, 0, 0]));
            } else if distance > radius - 1.0 {
                // Edge of circle - apply anti-aliasing
                let alpha = (radius - distance).clamp(0.0, 1.0);
                let pixel = rgba.get_pixel(x, y);
                rgba.put_pixel(x, y, image::Rgba([
                    pixel[0],
                    pixel[1],
                    pixel[2],
                    (pixel[3] as f32 * alpha) as u8,
                ]));
            }
        }
    }

    DynamicImage::ImageRgba8(rgba)
}

fn generate_ios_contents_json(sizes: &[IconSize]) -> String {
    let mut images = Vec::new();

    for size in sizes {
        let _actual_size = size.size * size.scale;
        images.push(format!(
            r#"    {{
      "size": "{}x{}",
      "idiom": "{}",
      "filename": "{}",
      "scale": "{}x"
    }}"#,
            size.size, size.size, size.idiom, size.filename, size.scale
        ));
    }

    format!(
        r#"{{
  "images": [
{}
  ],
  "info": {{
    "version": 1,
    "author": "app-builder"
  }}
}}"#,
        images.join(",\n")
    )
}

#[command]
pub async fn generate_app_icons(options: IconGenerationOptions) -> Result<IconGenerationResult, String> {
    // Validate source image exists
    let source_path = Path::new(&options.source_image_path);
    if !source_path.exists() {
        return Err("Source image does not exist".to_string());
    }

    // Load the source image
    let img = image::open(source_path)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Check if image is square
    if img.width() != img.height() {
        return Err("Image must be square (width = height)".to_string());
    }

    // Recommend minimum size
    if img.width() < 1024 {
        return Ok(IconGenerationResult {
            success: false,
            generated_files: vec![],
            output_path: options.output_path.clone(),
            message: Some("Warning: Image should be at least 1024x1024 for best quality".to_string()),
        });
    }

    let mut generated_files = Vec::new();

    // Generate iOS icons
    if options.platforms.contains(&"ios".to_string()) {
        let ios_output = PathBuf::from(&options.output_path).join("ios").join("AppIcon.appiconset");
        fs::create_dir_all(&ios_output)
            .map_err(|e| format!("Failed to create iOS output directory: {}", e))?;

        let icon_sizes = get_ios_icon_sizes();

        // Generate each icon size
        for icon_size in &icon_sizes {
            let actual_size = icon_size.size * icon_size.scale;
            let resized = resize_image(&img, actual_size);
            let output_file = ios_output.join(&icon_size.filename);

            resized.save_with_format(&output_file, ImageFormat::Png)
                .map_err(|e| format!("Failed to save iOS icon {}: {}", icon_size.filename, e))?;

            generated_files.push(output_file.to_string_lossy().to_string());
        }

        // Generate Contents.json
        let contents_json = generate_ios_contents_json(&icon_sizes);
        let contents_path = ios_output.join("Contents.json");
        fs::write(&contents_path, contents_json)
            .map_err(|e| format!("Failed to write Contents.json: {}", e))?;

        generated_files.push(contents_path.to_string_lossy().to_string());
    }

    // Generate Android icons
    if options.platforms.contains(&"android".to_string()) {
        let android_output = PathBuf::from(&options.output_path).join("android");
        let icon_name = options.android_icon_name.as_deref().unwrap_or("ic_launcher");

        // 1. Generate regular launcher icons (ic_launcher.png)
        let launcher_sizes = get_android_launcher_sizes();
        for (folder, size) in &launcher_sizes {
            let mipmap_dir = android_output.join(folder);
            fs::create_dir_all(&mipmap_dir)
                .map_err(|e| format!("Failed to create Android directory {}: {}", folder, e))?;

            let resized = resize_image(&img, *size);
            let output_file = mipmap_dir.join(format!("{}.png", icon_name));

            resized.save_with_format(&output_file, ImageFormat::Png)
                .map_err(|e| format!("Failed to save Android icon for {}: {}", folder, e))?;

            generated_files.push(output_file.to_string_lossy().to_string());
        }

        // 2. Generate round launcher icons (ic_launcher_round.png) - with circular mask
        for (folder, size) in &launcher_sizes {
            let mipmap_dir = android_output.join(folder);
            let resized = resize_image_round(&img, *size);
            let output_file = mipmap_dir.join(format!("{}_round.png", icon_name));

            resized.save_with_format(&output_file, ImageFormat::Png)
                .map_err(|e| format!("Failed to save Android round icon for {}: {}", folder, e))?;

            generated_files.push(output_file.to_string_lossy().to_string());
        }

        // 3. Generate adaptive icon foreground (ic_launcher_foreground.png)
        // Adaptive icons are 108dp with a 66dp safe zone
        let adaptive_sizes = get_android_adaptive_sizes();
        for (folder, size) in adaptive_sizes {
            let mipmap_dir = android_output.join(&folder);
            fs::create_dir_all(&mipmap_dir)
                .map_err(|e| format!("Failed to create Android directory {}: {}", folder, e))?;

            let resized = resize_image(&img, size);
            let output_file = mipmap_dir.join(format!("{}_foreground.png", icon_name));

            resized.save_with_format(&output_file, ImageFormat::Png)
                .map_err(|e| format!("Failed to save Android foreground icon for {}: {}", folder, e))?;

            generated_files.push(output_file.to_string_lossy().to_string());
        }
    }

    let files_count = generated_files.len();
    Ok(IconGenerationResult {
        success: true,
        generated_files,
        output_path: options.output_path,
        message: Some(format!("Successfully generated {} icon files", files_count)),
    })
}

#[command]
pub async fn open_folder(path: String) -> Result<(), String> {
    let folder_path = Path::new(&path);

    if !folder_path.exists() {
        return Err(format!("Folder not found: {}", path));
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

    Ok(())
}
