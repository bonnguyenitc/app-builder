use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IosConfig {
    pub scheme: String,
    pub configuration: String,
    pub team_id: Option<String>,
    pub export_method: Option<String>,
    pub api_key: Option<String>,
    pub api_issuer: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IosPlatform {
    pub bundle_id: String,
    pub version: String,
    pub build_number: u32,
    pub config: Option<IosConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AndroidPlatform {
    pub bundle_id: String,
    pub version: String,
    pub version_code: u32,
    pub build_command: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectCredentials {
    pub ios_id: Option<String>,
    pub android_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SlackConfig {
    pub webhook_url: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DiscordConfig {
    pub webhook_url: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TelegramConfig {
    pub bot_token: String,
    pub chat_id: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NotificationConfig {
    pub slack: Option<SlackConfig>,
    pub discord: Option<DiscordConfig>,
    pub telegram: Option<TelegramConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub ios: IosPlatform,
    pub android: AndroidPlatform,
    pub credentials: ProjectCredentials,
    #[serde(default)]
    pub notifications: Option<NotificationConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuildHistory {
    pub id: String,
    pub project_id: String,
    pub platform: String,
    pub version: String,
    pub build_number: u32,
    pub status: String,
    pub timestamp: u64,
    #[serde(default)]
    pub logs: String,
    #[serde(default)]
    pub release_note: String,
    pub format: Option<String>,
    pub artifact_path: Option<String>,
    pub log_file_path: Option<String>,
}
