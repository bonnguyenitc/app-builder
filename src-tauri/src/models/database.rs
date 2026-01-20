use rusqlite::{Connection, Result};
use tauri::AppHandle;
use tauri::Manager;

pub fn init_db(app_handle: &AppHandle) -> Result<Connection> {
    let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    }
    let db_path = app_dir.join("app.db");
    let conn = Connection::open(db_path)?;

    // Create projects table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            bundle_id_ios TEXT,
            bundle_id_android TEXT,
            version_ios TEXT,
            version_android TEXT,
            build_number_ios INTEGER,
            build_number_android INTEGER,
            ios_scheme TEXT,
            ios_configuration TEXT
        )",
        [],
    )?;

    // Attempt migrations for existing users
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN ios_scheme TEXT", []);
    let _ = conn.execute("ALTER TABLE projects ADD COLUMN ios_configuration TEXT", []);

    // Create build_history table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS build_history (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            version TEXT NOT NULL,
            build_number INTEGER NOT NULL,
            status TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            logs TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )",
        [],
    )?;

    Ok(conn)
}
