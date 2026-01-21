import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Vui lòng cung cấp số phiên bản mới. Ví dụ: npm run set-version 1.0.0');
  process.exit(1);
}

// Helper to update JSON files
const updateJsonFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const oldVersion = json.version;
    json.version = newVersion;
    // Use 2 spaces indentation to match existing files
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
    console.log(`✅ Updated ${path.relative(rootDir, filePath)}: ${oldVersion} -> ${newVersion}`);
  } catch (error) {
    console.error(`❌ Failed to update ${path.relative(rootDir, filePath)}:`, error.message);
  }
};

// Helper to update TOML files (simple regex approach)
const updateTomlFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match version = "x.y.z" inside [package] section usually at the top
    // We assume the first version = "..." is the package version
    const newContent = content.replace(/^version = ".*"/m, `version = "${newVersion}"`);

    if (content === newContent) {
      console.warn(
        `⚠️ Could not find version pattern in ${path.relative(rootDir, filePath)} or version already matches.`,
      );
    } else {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Updated ${path.relative(rootDir, filePath)} to ${newVersion}`);
    }
  } catch (error) {
    console.error(`❌ Failed to update ${path.relative(rootDir, filePath)}:`, error.message);
  }
};

console.log(`🔄 Updating project version to ${newVersion}...`);

// 1. Update package.json
updateJsonFile(path.join(rootDir, 'package.json'));

// 2. Update tauri.conf.json
updateJsonFile(path.join(rootDir, 'src-tauri', 'tauri.conf.json'));

// 3. Update Cargo.toml
updateTomlFile(path.join(rootDir, 'src-tauri', 'Cargo.toml'));

console.log('🎉 Version update complete!');
