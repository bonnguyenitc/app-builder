export interface IconSize {
  size: number;
  scale: number;
  idiom: string;
  filename: string;
}

export interface IconGenerationResult {
  success: boolean;
  generated_files: string[];
  output_path: string;
  message?: string;
}

export interface IconGenerationOptions {
  source_image_path: string;
  output_path: string;
  platforms: ('ios' | 'android')[];
  android_icon_name?: string; // Default: ic_launcher
}
