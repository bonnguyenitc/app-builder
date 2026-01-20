use keyring::Entry;
use tauri::command;

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
