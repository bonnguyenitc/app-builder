pub mod commands;
pub mod models;


use tauri::Manager;

use commands::project::*;
use commands::build::*;
use commands::history::*;
use commands::credentials::*;
use models::database::init_db;
use std::sync::{Mutex, Arc};
use std::collections::HashMap;
use std::process::Child;
use rusqlite::Connection;

pub struct DbState(pub Mutex<Connection>);

// Store active build processes for cancellation
pub struct BuildProcessState(pub Arc<Mutex<HashMap<String, Arc<Mutex<Option<Child>>>>>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .setup(|app| {
            let conn = init_db(app.handle()).expect("Failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));
            app.manage(BuildProcessState(Arc::new(Mutex::new(HashMap::new()))));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_projects,
            save_project,
            delete_project,

            read_native_project_info,
            build_project,
            cancel_build_process,
            open_build_folder,
            open_log_file,
            save_build_history,
            list_build_history,
            save_credential,
            get_credential,
            delete_credential,
            create_credential,
            get_credentials,
            get_credential_secret,
            update_credential,
            delete_credential_by_id
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Reopen { .. } = event {
                if let Some(window) = app_handle.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
        });
}
