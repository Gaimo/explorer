use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::time::SystemTime;

use tauri::State;

use crate::db::path::normalize_path;
use crate::db::repo;
use crate::db::DbState;
use crate::domain::FileEntry;
use crate::error::AppError;

const MAX_RESULTS: usize = 500;

/// Fast, cache-only search. Never walks the disk — results come from
/// `file_index` (name) and tagged files. The background indexer fills the cache.
#[tauri::command]
pub async fn search_files(
    state: State<'_, DbState>,
    query: String,
) -> Result<Vec<FileEntry>, AppError> {
    let trimmed = query.trim().to_string();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let db = Arc::clone(&state.0);
    tauri::async_runtime::spawn_blocking(move || search_in_cache(&db, &trimmed))
        .await
        .map_err(|err| AppError::new(format!("Search task failed: {err}")))?
}

fn search_in_cache(
    db: &std::sync::Mutex<rusqlite::Connection>,
    query: &str,
) -> Result<Vec<FileEntry>, AppError> {
    let conn = db
        .lock()
        .map_err(|_| AppError::new("Database lock poisoned"))?;

    let mut found: HashMap<String, FileEntry> = HashMap::new();

    for entry in repo::search_file_index(&conn, query, MAX_RESULTS)? {
        let key = normalize_path(&entry.path);
        if !key.is_empty() {
            found.insert(key, entry);
        }
    }

    if found.len() < MAX_RESULTS {
        for path in repo::list_paths_matching_tag_query(&conn, query)? {
            if found.len() >= MAX_RESULTS {
                break;
            }
            let key = normalize_path(&path);
            if key.is_empty() || found.contains_key(&key) {
                continue;
            }
            if let Some(entry) = repo::get_file_index_entry(&conn, &key)?
                .or_else(|| entry_from_path(Path::new(&path)))
            {
                found.insert(key, entry);
            }
        }
    }

    Ok(sorted_results(found))
}

fn entry_from_path(path: &Path) -> Option<FileEntry> {
    let metadata = path.metadata().ok()?;
    let name = path.file_name()?.to_string_lossy().into_owned();
    let is_dir = metadata.is_dir();
    let extension = if is_dir {
        None
    } else {
        path.extension()
            .map(|ext| ext.to_string_lossy().to_lowercase())
    };
    let size = if is_dir {
        None
    } else {
        Some(metadata.len())
    };
    let modified = metadata.modified().ok().and_then(system_time_to_secs);

    Some(FileEntry {
        name,
        path: path.to_string_lossy().into_owned(),
        is_dir,
        size,
        modified,
        extension,
    })
}

fn sorted_results(found: HashMap<String, FileEntry>) -> Vec<FileEntry> {
    let mut entries: Vec<FileEntry> = found.into_values().collect();
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    entries
}

fn system_time_to_secs(time: SystemTime) -> Option<u64> {
    time.duration_since(SystemTime::UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_secs())
}
