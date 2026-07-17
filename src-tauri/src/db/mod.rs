pub mod indexer;
pub mod migrate;
pub mod path;
pub mod repo;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::error::AppError;

pub struct DbState(pub Arc<Mutex<Connection>>);

pub fn db_path(app: &AppHandle) -> Result<PathBuf, AppError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::new(err.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("explorer.db"))
}

pub fn open_db(app: &AppHandle) -> Result<(Connection, PathBuf), AppError> {
    let path = db_path(app)?;
    let conn = Connection::open(&path)?;
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 5000;
        ",
    )?;
    migrate::migrate(&conn)?;
    Ok((conn, path))
}
