use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use tauri::State;

use crate::db::repo;
use crate::db::DbState;
use crate::domain::{DriveEntry, FileEntry};
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
pub fn get_home_dir() -> Result<String, AppError> {
    dirs::home_dir()
        .map(|path| path.to_string_lossy().into_owned())
        .ok_or_else(|| AppError::new("Could not resolve the home directory"))
}

#[tauri::command]
pub fn list_drives() -> Result<Vec<DriveEntry>, AppError> {
    Ok(detect_drives())
}

#[cfg(windows)]
fn detect_drives() -> Vec<DriveEntry> {
    let mut drives = Vec::new();

    for letter in b'A'..=b'Z' {
        let root = format!("{}:\\", letter as char);
        let path = Path::new(&root);
        if path.exists() {
            drives.push(DriveEntry {
                name: format!("{}:", letter as char),
                path: root,
            });
        }
    }

    drives
}

#[cfg(not(windows))]
fn detect_drives() -> Vec<DriveEntry> {
    vec![DriveEntry {
        name: "/".into(),
        path: "/".into(),
    }]
}

#[tauri::command]
pub fn list_directory(
    state: State<'_, DbState>,
    path: String,
) -> Result<Vec<FileEntry>, AppError> {
    let dir = PathBuf::from(&path);

    if !dir.exists() {
        return Err(AppError::new(format!("Path does not exist: {path}")));
    }

    if !dir.is_dir() {
        return Err(AppError::new(format!("Path is not a directory: {path}")));
    }

    let mut entries = Vec::new();

    for entry in fs::read_dir(&dir)? {
        let entry = entry?;
        let entry_path = entry.path();
        let metadata = match entry.metadata() {
            Ok(meta) => meta,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().into_owned();

        let is_dir = metadata.is_dir();
        let extension = if is_dir {
            None
        } else {
            entry_path
                .extension()
                .map(|ext| ext.to_string_lossy().to_lowercase())
        };

        let size = if is_dir { None } else { Some(metadata.len()) };

        let modified = metadata.modified().ok().and_then(system_time_to_secs);

        entries.push(FileEntry {
            name,
            path: path_to_string(&entry_path),
            is_dir,
            size,
            modified,
            extension,
        });
    }

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    // Warm the search cache with whatever the user just browsed.
    let batch: Vec<(String, String, bool, Option<u64>, Option<u64>)> = entries
        .iter()
        .map(|e| {
            (
                e.path.clone(),
                e.name.clone(),
                e.is_dir,
                e.size,
                e.modified,
            )
        })
        .collect();
    if let Ok(conn) = lock_db(&state) {
        let _ = repo::upsert_file_index_batch(&conn, &batch);
    }

    Ok(entries)
}

#[tauri::command]
pub fn rename_path(
    state: State<'_, DbState>,
    path: String,
    new_name: String,
) -> Result<String, AppError> {
    let source = PathBuf::from(&path);
    if !source.exists() {
        return Err(AppError::new(format!("Path does not exist: {path}")));
    }

    let new_name = new_name.trim();
    if new_name.is_empty() {
        return Err(AppError::new("New name cannot be empty"));
    }
    if new_name.contains('/') || new_name.contains('\\') {
        return Err(AppError::new("Name cannot contain path separators"));
    }

    let parent = source
        .parent()
        .ok_or_else(|| AppError::new("Cannot rename drive root"))?;
    let destination = parent.join(new_name);

    if destination.exists() {
        return Err(AppError::new(format!(
            "A file or folder named \"{new_name}\" already exists"
        )));
    }

    fs::rename(&source, &destination)?;
    let next = path_to_string(&destination);
    let conn = lock_db(&state)?;
    repo::rename_path_metadata(&conn, &path, &next)?;
    Ok(next)
}

#[tauri::command]
pub fn delete_path(state: State<'_, DbState>, path: String) -> Result<(), AppError> {
    let target = PathBuf::from(&path);
    if !target.exists() {
        return Err(AppError::new(format!("Path does not exist: {path}")));
    }

    if target.is_dir() {
        fs::remove_dir_all(&target)?;
    } else {
        fs::remove_file(&target)?;
    }

    let conn = lock_db(&state)?;
    repo::delete_path_metadata(&conn, &path)?;
    Ok(())
}

#[tauri::command]
pub fn create_directory(
    state: State<'_, DbState>,
    parent: String,
    name: String,
) -> Result<String, AppError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::new("Folder name cannot be empty"));
    }
    if name.contains('/') || name.contains('\\') {
        return Err(AppError::new("Name cannot contain path separators"));
    }

    let parent_path = PathBuf::from(&parent);
    if !parent_path.is_dir() {
        return Err(AppError::new(format!("Parent is not a directory: {parent}")));
    }

    let destination = unique_path_in_dir(&parent_path, name);
    fs::create_dir(&destination)?;
    let next = path_to_string(&destination);
    if let Some(folder_name) = destination.file_name().and_then(|n| n.to_str()) {
        if let Ok(conn) = lock_db(&state) {
            let _ = repo::upsert_file_index(&conn, &next, folder_name, true, None, None);
        }
    }
    Ok(next)
}

#[tauri::command]
pub fn copy_path(source: String, destination_dir: String) -> Result<String, AppError> {
    let from = PathBuf::from(&source);
    if !from.exists() {
        return Err(AppError::new(format!("Path does not exist: {source}")));
    }

    let dest_dir = PathBuf::from(&destination_dir);
    if !dest_dir.is_dir() {
        return Err(AppError::new(format!(
            "Destination is not a directory: {destination_dir}"
        )));
    }

    let file_name = from
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| AppError::new("Invalid source file name"))?;

    let to = unique_path_in_dir(&dest_dir, file_name);
    copy_recursive(&from, &to)?;
    Ok(path_to_string(&to))
}

#[tauri::command]
pub fn move_path(
    state: State<'_, DbState>,
    source: String,
    destination_dir: String,
) -> Result<String, AppError> {
    let from = PathBuf::from(&source);
    if !from.exists() {
        return Err(AppError::new(format!("Path does not exist: {source}")));
    }

    let dest_dir = PathBuf::from(&destination_dir);
    if !dest_dir.is_dir() {
        return Err(AppError::new(format!(
            "Destination is not a directory: {destination_dir}"
        )));
    }

    let file_name = from
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| AppError::new("Invalid source file name"))?;

    let to = unique_path_in_dir(&dest_dir, file_name);

    let next = match fs::rename(&from, &to) {
        Ok(()) => path_to_string(&to),
        Err(_) => {
            copy_recursive(&from, &to)?;
            if from.is_dir() {
                fs::remove_dir_all(&from)?;
            } else {
                fs::remove_file(&from)?;
            }
            path_to_string(&to)
        }
    };

    let conn = lock_db(&state)?;
    repo::rename_path_metadata(&conn, &source, &next)?;
    Ok(next)
}

fn copy_recursive(from: &Path, to: &Path) -> Result<(), AppError> {
    if from.is_dir() {
        fs::create_dir_all(to)?;
        for entry in fs::read_dir(from)? {
            let entry = entry?;
            let dest = to.join(entry.file_name());
            copy_recursive(&entry.path(), &dest)?;
        }
    } else {
        if let Some(parent) = to.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::copy(from, to)?;
    }
    Ok(())
}

fn unique_path_in_dir(dir: &Path, name: &str) -> PathBuf {
    let candidate = dir.join(name);
    if !candidate.exists() {
        return candidate;
    }

    let path = Path::new(name);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(name);
    let extension = path.extension().and_then(|e| e.to_str());

    for index in 1..10_000 {
        let next_name = match extension {
            Some(ext) => format!("{stem} - Copy ({index}).{ext}"),
            None => format!("{stem} - Copy ({index})"),
        };
        let next = dir.join(next_name);
        if !next.exists() {
            return next;
        }
    }

    dir.join(format!("{name}.copy"))
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn system_time_to_secs(time: SystemTime) -> Option<u64> {
    time.duration_since(SystemTime::UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_secs())
}
