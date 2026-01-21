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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub ios: IosPlatform,
    pub android: AndroidPlatform,
    // credentials will be handled separately via Keychain
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
}
