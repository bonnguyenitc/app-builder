use keyring::Entry;
use tauri::{command, AppHandle, State};
use crate::models::credential::{Credential, IosCredential, AndroidCredential};
use crate::DbState;

// Legacy commands for backward compatibility
#[command]
pub async fn save_credential(service: String, account: String, password: String) -> Result<(), String> {
    let entry = Entry::new(&service, &account).map_err(|e| e.to_string())?;
    entry.set_password(&password).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn get_credential(service: String, account: String) -> Result<String, String> {
    let entry = Entry::new(&service, &account).map_err(|e| e.to_string())?;
    let password = entry.get_password().map_err(|e| e.to_string())?;
    Ok(password)
}

#[command]
pub async fn delete_credential(service: String, account: String) -> Result<(), String> {
    let entry = Entry::new(&service, &account).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(())
}

// New credential management commands
#[command]
pub async fn create_credential(
    _app_handle: AppHandle,
    db: State<'_, DbState>,
    credential: Credential,
    api_key_content: Option<String>, // For iOS: the actual .p8 key content
    service_account_json: Option<String>, // For Android: the JSON key
) -> Result<Credential, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Save sensitive data to Keychain
    if credential.platform == "ios" {
        if let Some(content) = api_key_content {
            let entry = Entry::new("app-builder-credentials", &format!("ios-api-key-{}", credential.id))
                .map_err(|e| e.to_string())?;
            entry.set_password(&content).map_err(|e| e.to_string())?;
        }
    } else if credential.platform == "android" {
        if let Some(json) = service_account_json {
            let entry = Entry::new("app-builder-credentials", &format!("android-service-account-{}", credential.id))
                .map_err(|e| e.to_string())?;
            entry.set_password(&json).map_err(|e| e.to_string())?;
        }
    }

    // Save metadata to database
    let ios_team_id = credential.ios.as_ref().map(|i| i.team_id.clone());
    let ios_api_key_id = credential.ios.as_ref().map(|i| i.api_key_id.clone());
    let ios_api_issuer_id = credential.ios.as_ref().map(|i| i.api_issuer_id.clone());
    let android_email = credential.android.as_ref().and_then(|a| a.service_account_email.clone());

    conn.execute(
        "INSERT INTO credentials (id, name, platform, ios_team_id, ios_api_key_id, ios_api_issuer_id, android_service_account_email, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            credential.id,
            credential.name,
            credential.platform,
            ios_team_id,
            ios_api_key_id,
            ios_api_issuer_id,
            android_email,
            credential.created_at,
            credential.updated_at,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(credential)
}

#[command]
pub async fn get_credentials(
    _app_handle: AppHandle,
    db: State<'_, DbState>,
) -> Result<Vec<Credential>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, name, platform, ios_team_id, ios_api_key_id, ios_api_issuer_id, android_service_account_email, created_at, updated_at
         FROM credentials ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let credentials = stmt.query_map([], |row| {
        let platform: String = row.get(2)?;
        let ios = if platform == "ios" {
            Some(IosCredential {
                team_id: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                api_key_id: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                api_issuer_id: row.get::<_, Option<String>>(5)?.unwrap_or_default(),
            })
        } else {
            None
        };

        let android = if platform == "android" {
            Some(AndroidCredential {
                service_account_email: row.get(6)?,
            })
        } else {
            None
        };

        Ok(Credential {
            id: row.get(0)?,
            name: row.get(1)?,
            platform,
            ios,
            android,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(credentials)
}

#[command]
pub async fn get_credential_secret(
    credential_id: String,
    platform: String,
) -> Result<String, String> {
    let account = if platform == "ios" {
        format!("ios-api-key-{}", credential_id)
    } else {
        format!("android-service-account-{}", credential_id)
    };

    let entry = Entry::new("app-builder-credentials", &account)
        .map_err(|e| e.to_string())?;
    let secret = entry.get_password().map_err(|e| e.to_string())?;
    Ok(secret)
}

#[command]
pub async fn update_credential(
    _app_handle: AppHandle,
    db: State<'_, DbState>,
    credential: Credential,
    api_key_content: Option<String>,
    service_account_json: Option<String>,
) -> Result<Credential, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Update sensitive data in Keychain if provided
    if credential.platform == "ios" {
        if let Some(content) = api_key_content {
            let entry = Entry::new("app-builder-credentials", &format!("ios-api-key-{}", credential.id))
                .map_err(|e| e.to_string())?;
            entry.set_password(&content).map_err(|e| e.to_string())?;
        }
    } else if credential.platform == "android" {
        if let Some(json) = service_account_json {
            let entry = Entry::new("app-builder-credentials", &format!("android-service-account-{}", credential.id))
                .map_err(|e| e.to_string())?;
            entry.set_password(&json).map_err(|e| e.to_string())?;
        }
    }

    // Update metadata in database
    let ios_team_id = credential.ios.as_ref().map(|i| i.team_id.clone());
    let ios_api_key_id = credential.ios.as_ref().map(|i| i.api_key_id.clone());
    let ios_api_issuer_id = credential.ios.as_ref().map(|i| i.api_issuer_id.clone());
    let android_email = credential.android.as_ref().and_then(|a| a.service_account_email.clone());

    conn.execute(
        "UPDATE credentials SET name = ?1, platform = ?2, ios_team_id = ?3, ios_api_key_id = ?4,
         ios_api_issuer_id = ?5, android_service_account_email = ?6, updated_at = ?7 WHERE id = ?8",
        rusqlite::params![
            credential.name,
            credential.platform,
            ios_team_id,
            ios_api_key_id,
            ios_api_issuer_id,
            android_email,
            credential.updated_at,
            credential.id,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(credential)
}

#[command]
pub async fn delete_credential_by_id(
    _app_handle: AppHandle,
    db: State<'_, DbState>,
    credential_id: String,
    platform: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Delete from Keychain
    let account = if platform == "ios" {
        format!("ios-api-key-{}", credential_id)
    } else {
        format!("android-service-account-{}", credential_id)
    };

    let entry = Entry::new("app-builder-credentials", &account)
        .map_err(|e| e.to_string())?;
    let _ = entry.delete_credential(); // Ignore error if doesn't exist

    // Delete from database
    conn.execute(
        "DELETE FROM credentials WHERE id = ?1",
        rusqlite::params![credential_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

