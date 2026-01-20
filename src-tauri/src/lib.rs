pub mod commands;
pub mod models;
pub mod utils;

use tauri::Manager;

use commands::project::*;
use commands::build::*;
use commands::history::*;
use commands::credentials::*;
use models::database::init_db;
use std::sync::Mutex;
use rusqlite::Connection;

pub struct DbState(pub Mutex<Connection>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let conn = init_db(app.handle()).expect("Failed to initialize database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_projects,
            save_project,
            delete_project,
            read_app_json,
            build_project,
            open_build_folder,
            save_build_history,
            list_build_history,
            save_credential,
            get_credential,
            delete_credential
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
