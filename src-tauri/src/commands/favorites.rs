use tauri::State;

use crate::db::repo;
use crate::db::DbState;
use crate::domain::FavoriteRecord;
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
pub fn list_favorites(state: State<'_, DbState>) -> Result<Vec<FavoriteRecord>, AppError> {
    let conn = lock_db(&state)?;
    repo::list_favorites(&conn)
}

#[tauri::command]
pub fn add_favorite(
    state: State<'_, DbState>,
    path: String,
    name: String,
) -> Result<Vec<FavoriteRecord>, AppError> {
    let conn = lock_db(&state)?;
    repo::add_favorite(&conn, &path, &name)
}

#[tauri::command]
pub fn remove_favorite(
    state: State<'_, DbState>,
    path: String,
) -> Result<Vec<FavoriteRecord>, AppError> {
    let conn = lock_db(&state)?;
    repo::remove_favorite(&conn, &path)
}
