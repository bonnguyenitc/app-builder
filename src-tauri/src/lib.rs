pub mod commands;
pub mod models;


use tauri::Manager;

use commands::project::*;
use commands::build::*;
use commands::history::*;
use commands::credentials::*;
use commands::icon_generator::*;
use commands::permissions::*;
use commands::doctor::*;
use commands::emulator::*;
use commands::notification::*;
use commands::keystore::*;
use models::database::init_db;
use std::sync::{Mutex, Arc};
use std::collections::HashMap;
use std::process::Child;
use rusqlite::Connection;

pub struct DbState(pub Mutex<Connection>);

// Store active build processes for cancellation
pub struct BuildProcessState(pub Arc<Mutex<HashMap<String, Arc<Mutex<Option<Child>>>>>>);

// Store active recording processes
pub struct RecordingProcess {
    pub child: Child,
    pub platform: String,
    pub device_temp_path: Option<String>, // For Android: path on device
    pub destination_path: String,         // Final path on Mac
}
pub struct RecordingState(pub Arc<Mutex<HashMap<String, RecordingProcess>>>);

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
            app.manage(RecordingState(Arc::new(Mutex::new(HashMap::new()))));
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
            delete_credential_by_id,
            generate_app_icons,
            open_folder,
            get_project_permissions,
            update_permission,
            run_doctor_checks,
            run_fix_command,
            list_emulators,
            launch_emulator,
            run_app_on_emulator,
            open_url_on_emulator,
            adb_uninstall_app,
            adb_clear_app_data,
            adb_force_stop_app,
            adb_open_logcat,
            adb_take_screenshot,
            adb_restart_app,
            list_installed_apps,
            simctl_uninstall_app,
            simctl_terminate_app,
            simctl_restart_app,
            simctl_take_screenshot,
            simctl_erase_device,
            start_recording,
            stop_recording,
            is_device_recording,
            test_notification,
            generate_keystore,
            show_in_folder
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, _event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                if let Some(window) = app_handle.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
        });
}
