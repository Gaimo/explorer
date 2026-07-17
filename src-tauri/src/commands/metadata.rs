use tauri::State;

use crate::db::repo;
use crate::db::DbState;
use crate::domain::{FileMetadata, MetadataSummary};
use crate::error::AppError;

fn lock_db<'a>(
    state: &'a State<'_, DbState>,
) -> Result<std::sync::MutexGuard<'a, rusqlite::Connection>, AppError> {
    state
        .0
        .lock()
        .map_err(|_| AppError::new("Database lock poisoned"))
}

#[tauri::command]
pub fn get_file_metadata(
    state: State<'_, DbState>,
    path: String,
) -> Result<FileMetadata, AppError> {
    let conn = lock_db(&state)?;
    repo::get_file_metadata(&conn, &path)
}

#[tauri::command]
pub fn set_file_note(
    state: State<'_, DbState>,
    path: String,
    note: String,
) -> Result<FileMetadata, AppError> {
    let conn = lock_db(&state)?;
    repo::set_file_note(&conn, &path, &note)
}

#[tauri::command]
pub fn add_file_tag(
    state: State<'_, DbState>,
    path: String,
    tag: String,
) -> Result<FileMetadata, AppError> {
    let conn = lock_db(&state)?;
    repo::add_file_tag(&conn, &path, &tag)
}

#[tauri::command]
pub fn remove_file_tag(
    state: State<'_, DbState>,
    path: String,
    tag: String,
) -> Result<FileMetadata, AppError> {
    let conn = lock_db(&state)?;
    repo::remove_file_tag(&conn, &path, &tag)
}

#[tauri::command]
pub fn list_tags(state: State<'_, DbState>) -> Result<Vec<String>, AppError> {
    let conn = lock_db(&state)?;
    repo::list_tags(&conn)
}

#[tauri::command]
pub fn list_paths_by_tag(
    state: State<'_, DbState>,
    tag: String,
) -> Result<Vec<String>, AppError> {
    let conn = lock_db(&state)?;
    repo::list_paths_by_tag(&conn, &tag)
}

#[tauri::command]
pub fn get_metadata_summaries(
    state: State<'_, DbState>,
    paths: Vec<String>,
) -> Result<Vec<MetadataSummary>, AppError> {
    let conn = lock_db(&state)?;
    repo::get_metadata_summaries(&conn, &paths)
}
