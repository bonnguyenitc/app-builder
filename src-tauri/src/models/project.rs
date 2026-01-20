use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BundleId {
    pub ios: String,
    pub android: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VersionInfo {
    pub ios: String,
    pub android: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BuildNumberInfo {
    pub ios: u32,
    pub android: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IosConfig {
    pub scheme: String,
    pub configuration: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub bundle_id: BundleId,
    pub version: VersionInfo,
    pub build_number: BuildNumberInfo,
    pub ios_config: Option<IosConfig>,
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
    pub logs: String,
}
