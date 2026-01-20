use crate::models::project::BuildHistory;
use crate::DbState;
use tauri::{command, State};
use rusqlite::params;

#[command]
pub async fn save_build_history(state: State<'_, DbState>, history: BuildHistory) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO build_history (id, project_id, platform, version, build_number, status, timestamp, logs)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            history.id,
            history.project_id,
            history.platform,
            history.version,
            history.build_number,
            history.status,
            history.timestamp,
            history.logs,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn list_build_history(state: State<'_, DbState>) -> Result<Vec<BuildHistory>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, project_id, platform, version, build_number, status, timestamp, logs FROM build_history ORDER BY timestamp DESC")
        .map_err(|e| e.to_string())?;

    let history_iter = stmt
        .query_map([], |row| {
            Ok(BuildHistory {
                id: row.get(0)?,
                project_id: row.get(1)?,
                platform: row.get(2)?,
                version: row.get(3)?,
                build_number: row.get(4)?,
                status: row.get(5)?,
                timestamp: row.get(6)?,
                logs: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut histories = Vec::new();
    for history in history_iter {
        histories.push(history.map_err(|e| e.to_string())?);
    }

    Ok(histories)
}
