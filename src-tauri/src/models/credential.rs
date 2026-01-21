use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IosCredential {
    pub team_id: String,
    pub api_key_id: String,
    pub api_issuer_id: String,
    // The actual API key content will be stored in Keychain
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AndroidCredential {
    pub service_account_email: Option<String>,
    // The actual JSON key will be stored in Keychain
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Credential {
    pub id: String,
    pub name: String,
    pub platform: String, // "ios" or "android"
    pub ios: Option<IosCredential>,
    pub android: Option<AndroidCredential>,
    pub created_at: u64,
    pub updated_at: u64,
}
