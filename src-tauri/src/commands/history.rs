use crate::models::project::BuildHistory;
use crate::DbState;
use serde::Serialize;
use tauri::{command, State};
use rusqlite::params;

#[derive(Serialize)]
pub struct PaginatedBuildHistory {
    pub items: Vec<BuildHistory>,
    pub total: i64,
}

#[command]
pub async fn save_build_history(state: State<'_, DbState>, history: BuildHistory) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO build_history (id, project_id, platform, version, build_number, status, timestamp, logs, release_note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            history.id,
            history.project_id,
            history.platform,
            history.version,
            history.build_number,
            history.status,
            history.timestamp,
            history.logs,
            history.release_note,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn list_build_history(state: State<'_, DbState>, page: u32, page_size: u32) -> Result<PaginatedBuildHistory, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let offset = (page.saturating_sub(1)) * page_size;

    let total: i64 = conn.query_row(
        "SELECT COUNT(*)
         FROM build_history h
         INNER JOIN projects p ON h.project_id = p.id",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT h.id, h.project_id, h.platform, h.version, h.build_number, h.status, h.timestamp, h.logs, h.release_note
                  FROM build_history h
                  INNER JOIN projects p ON h.project_id = p.id
                  ORDER BY h.timestamp DESC
                  LIMIT ?1 OFFSET ?2")
        .map_err(|e| e.to_string())?;

    let history_iter = stmt
        .query_map(params![page_size, offset], |row| {
            Ok(BuildHistory {
                id: row.get(0)?,
                project_id: row.get(1)?,
                platform: row.get(2)?,
                version: row.get(3)?,
                build_number: row.get(4)?,
                status: row.get(5)?,
                timestamp: row.get(6)?,
                logs: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                release_note: row.get::<_, Option<String>>(8)?.unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for history in history_iter {
        items.push(history.map_err(|e| e.to_string())?);
    }

    Ok(PaginatedBuildHistory { items, total })
}
