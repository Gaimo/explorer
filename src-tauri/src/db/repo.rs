use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, OptionalExtension};

use crate::db::path::normalize_path;
use crate::domain::{FavoriteRecord, FileMetadata, MetadataSummary};
use crate::error::AppError;

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub fn ensure_file(conn: &Connection, path: &str) -> Result<i64, AppError> {
    let key = normalize_path(path);
    if key.is_empty() {
        return Err(AppError::new("Path cannot be empty"));
    }

    conn.execute(
        "INSERT INTO files (path, note, updated_at) VALUES (?1, '', ?2)
         ON CONFLICT(path) DO NOTHING",
        params![key, now_secs()],
    )?;

    let id: i64 = conn.query_row(
        "SELECT id FROM files WHERE path = ?1",
        params![key],
        |row| row.get(0),
    )?;
    Ok(id)
}

pub fn get_file_metadata(conn: &Connection, path: &str) -> Result<FileMetadata, AppError> {
    let key = normalize_path(path);
    let row: Option<(i64, String)> = conn
        .query_row(
            "SELECT id, note FROM files WHERE path = ?1",
            params![key],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;

    let (note, tags) = match row {
        Some((file_id, note)) => {
            let mut stmt = conn.prepare(
                "SELECT t.name FROM tags t
                 INNER JOIN file_tags ft ON ft.tag_id = t.id
                 WHERE ft.file_id = ?1
                 ORDER BY t.name COLLATE NOCASE",
            )?;
            let tags = stmt
                .query_map(params![file_id], |row| row.get(0))?
                .collect::<Result<Vec<String>, _>>()?;
            (note, tags)
        }
        None => (String::new(), Vec::new()),
    };

    Ok(FileMetadata {
        path: key,
        note,
        tags,
    })
}

pub fn set_file_note(conn: &Connection, path: &str, note: &str) -> Result<FileMetadata, AppError> {
    let file_id = ensure_file(conn, path)?;
    conn.execute(
        "UPDATE files SET note = ?1, updated_at = ?2 WHERE id = ?3",
        params![note, now_secs(), file_id],
    )?;
    get_file_metadata(conn, path)
}

pub fn add_file_tag(conn: &Connection, path: &str, tag: &str) -> Result<FileMetadata, AppError> {
    let tag_name = tag.trim();
    if tag_name.is_empty() {
        return Err(AppError::new("Tag cannot be empty"));
    }

    let file_id = ensure_file(conn, path)?;
    conn.execute(
        "INSERT INTO tags (name) VALUES (?1) ON CONFLICT(name) DO NOTHING",
        params![tag_name],
    )?;
    let tag_id: i64 = conn.query_row(
        "SELECT id FROM tags WHERE name = ?1 COLLATE NOCASE",
        params![tag_name],
        |row| row.get(0),
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
        params![file_id, tag_id],
    )?;
    get_file_metadata(conn, path)
}

pub fn remove_file_tag(conn: &Connection, path: &str, tag: &str) -> Result<FileMetadata, AppError> {
    let key = normalize_path(path);
    let tag_name = tag.trim();

    let file_id: Option<i64> = conn
        .query_row(
            "SELECT id FROM files WHERE path = ?1",
            params![key],
            |row| row.get(0),
        )
        .optional()?;

    if let Some(file_id) = file_id {
        conn.execute(
            "DELETE FROM file_tags
             WHERE file_id = ?1
               AND tag_id = (SELECT id FROM tags WHERE name = ?2 COLLATE NOCASE)",
            params![file_id, tag_name],
        )?;
    }

    get_file_metadata(conn, path)
}

pub fn list_tags(conn: &Connection) -> Result<Vec<String>, AppError> {
    let mut stmt =
        conn.prepare("SELECT name FROM tags ORDER BY name COLLATE NOCASE")?;
    let tags = stmt
        .query_map([], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(tags)
}

pub fn list_paths_by_tag(conn: &Connection, tag: &str) -> Result<Vec<String>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT f.path FROM files f
         INNER JOIN file_tags ft ON ft.file_id = f.id
         INNER JOIN tags t ON t.id = ft.tag_id
         WHERE t.name = ?1 COLLATE NOCASE
         ORDER BY f.path",
    )?;
    let paths = stmt
        .query_map(params![tag.trim()], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(paths)
}

pub fn list_paths_matching_tag_query(
    conn: &Connection,
    query: &str,
) -> Result<Vec<String>, AppError> {
    let pattern = format!("%{}%", query.trim());
    let mut stmt = conn.prepare(
        "SELECT DISTINCT f.path FROM files f
         INNER JOIN file_tags ft ON ft.file_id = f.id
         INNER JOIN tags t ON t.id = ft.tag_id
         WHERE t.name LIKE ?1 COLLATE NOCASE
         ORDER BY f.path",
    )?;
    let paths = stmt
        .query_map(params![pattern], |row| row.get(0))?
        .collect::<Result<Vec<String>, _>>()?;
    Ok(paths)
}

pub fn get_metadata_summaries(
    conn: &Connection,
    paths: &[String],
) -> Result<Vec<MetadataSummary>, AppError> {
    let mut summaries = Vec::with_capacity(paths.len());
    for path in paths {
        let key = normalize_path(path);
        let row: Option<(String, i64)> = conn
            .query_row(
                "SELECT note,
                        (SELECT COUNT(*) FROM file_tags ft WHERE ft.file_id = files.id)
                 FROM files WHERE path = ?1",
                params![key],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?)),
            )
            .optional()?;

        let (has_note, tag_count) = match row {
            Some((note, count)) => (!note.trim().is_empty(), count),
            None => (false, 0),
        };

        summaries.push(MetadataSummary {
            path: key,
            has_note,
            tag_count,
        });
    }
    Ok(summaries)
}

pub fn rename_path_metadata(
    conn: &Connection,
    old_path: &str,
    new_path: &str,
) -> Result<(), AppError> {
    let old_key = normalize_path(old_path);
    let new_key = normalize_path(new_path);
    if old_key.is_empty() || new_key.is_empty() {
        return Ok(());
    }
    if old_key == new_key {
        return Ok(());
    }

    // If destination already has metadata, drop the old row to avoid UNIQUE conflict.
    let dest_exists: bool = conn
        .query_row(
            "SELECT 1 FROM files WHERE path = ?1",
            params![new_key],
            |_| Ok(true),
        )
        .optional()?
        .unwrap_or(false);

    if dest_exists {
        conn.execute("DELETE FROM files WHERE path = ?1", params![old_key])?;
    } else {
        conn.execute(
            "UPDATE files SET path = ?1, updated_at = ?2 WHERE path = ?3",
            params![new_key, now_secs(), old_key],
        )?;
    }

    let fav_exists: bool = conn
        .query_row(
            "SELECT 1 FROM favorites WHERE path = ?1",
            params![new_key],
            |_| Ok(true),
        )
        .optional()?
        .unwrap_or(false);

    if fav_exists {
        conn.execute("DELETE FROM favorites WHERE path = ?1", params![old_key])?;
    } else {
        conn.execute(
            "UPDATE favorites SET path = ?1 WHERE path = ?2",
            params![new_key, old_key],
        )?;
    }

    rename_file_index(conn, &old_key, &new_key)?;

    Ok(())
}

pub fn delete_path_metadata(conn: &Connection, path: &str) -> Result<(), AppError> {
    let key = normalize_path(path);
    conn.execute("DELETE FROM files WHERE path = ?1", params![key])?;
    conn.execute("DELETE FROM favorites WHERE path = ?1", params![key])?;
    delete_file_index(conn, &key)?;
    Ok(())
}

pub fn upsert_file_index(
    conn: &Connection,
    path: &str,
    name: &str,
    is_dir: bool,
    size: Option<u64>,
    modified: Option<u64>,
) -> Result<(), AppError> {
    let key = normalize_path(path);
    if key.is_empty() || name.is_empty() {
        return Ok(());
    }

    conn.execute(
        "INSERT INTO file_index (path, name, name_lower, is_dir, size, modified, indexed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(path) DO UPDATE SET
           name = excluded.name,
           name_lower = excluded.name_lower,
           is_dir = excluded.is_dir,
           size = excluded.size,
           modified = excluded.modified,
           indexed_at = excluded.indexed_at",
        params![
            key,
            name,
            name.to_lowercase(),
            if is_dir { 1 } else { 0 },
            size.map(|v| v as i64),
            modified.map(|v| v as i64),
            now_secs(),
        ],
    )?;
    Ok(())
}

pub fn upsert_file_index_batch(
    conn: &Connection,
    entries: &[(String, String, bool, Option<u64>, Option<u64>)],
) -> Result<(), AppError> {
    let tx = conn.unchecked_transaction()?;
    {
        let mut stmt = tx.prepare(
            "INSERT INTO file_index (path, name, name_lower, is_dir, size, modified, indexed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(path) DO UPDATE SET
               name = excluded.name,
               name_lower = excluded.name_lower,
               is_dir = excluded.is_dir,
               size = excluded.size,
               modified = excluded.modified,
               indexed_at = excluded.indexed_at",
        )?;
        let indexed_at = now_secs();
        for (path, name, is_dir, size, modified) in entries {
            let key = normalize_path(path);
            if key.is_empty() || name.is_empty() {
                continue;
            }
            stmt.execute(params![
                key,
                name,
                name.to_lowercase(),
                if *is_dir { 1 } else { 0 },
                size.map(|v| v as i64),
                modified.map(|v| v as i64),
                indexed_at,
            ])?;
        }
    }
    tx.commit()?;
    Ok(())
}

pub fn rename_file_index(
    conn: &Connection,
    old_path: &str,
    new_path: &str,
) -> Result<(), AppError> {
    let old_key = normalize_path(old_path);
    let new_key = normalize_path(new_path);
    if old_key.is_empty() || new_key.is_empty() || old_key == new_key {
        return Ok(());
    }

    let dest_exists: bool = conn
        .query_row(
            "SELECT 1 FROM file_index WHERE path = ?1",
            params![new_key],
            |_| Ok(true),
        )
        .optional()?
        .unwrap_or(false);

    if dest_exists {
        delete_file_index(conn, &old_key)?;
    } else if let Some(name) = std::path::Path::new(new_path)
        .file_name()
        .and_then(|n| n.to_str())
    {
        conn.execute(
            "UPDATE file_index
             SET path = ?1, name = ?2, name_lower = ?3, indexed_at = ?4
             WHERE path = ?5",
            params![new_key, name, name.to_lowercase(), now_secs(), old_key],
        )?;

        // Remap children when a folder is renamed.
        let now = now_secs();
        for (old_sep, new_sep) in [("\\", "\\"), ("/", "/")] {
            let old_prefix = format!("{old_key}{old_sep}");
            let new_prefix = format!("{new_key}{new_sep}");
            let like = format!("{old_prefix}%");
            let start = (old_prefix.len() as i64) + 1;
            conn.execute(
                "UPDATE file_index
                 SET path = ?1 || substr(path, ?2), indexed_at = ?3
                 WHERE path LIKE ?4",
                params![new_prefix, start, now, like],
            )?;
        }
    }

    Ok(())
}

pub fn delete_file_index(conn: &Connection, path: &str) -> Result<(), AppError> {
    let key = normalize_path(path);
    conn.execute("DELETE FROM file_index WHERE path = ?1", params![key])?;
    conn.execute(
        "DELETE FROM file_index WHERE path LIKE ?1",
        params![format!("{key}\\%")],
    )?;
    conn.execute(
        "DELETE FROM file_index WHERE path LIKE ?1",
        params![format!("{key}/%")],
    )?;
    Ok(())
}

pub fn get_file_index_entry(
    conn: &Connection,
    path: &str,
) -> Result<Option<crate::domain::FileEntry>, AppError> {
    let key = normalize_path(path);
    let row = conn
        .query_row(
            "SELECT path, name, is_dir, size, modified FROM file_index WHERE path = ?1",
            params![key],
            |row| {
                let path: String = row.get(0)?;
                let name: String = row.get(1)?;
                let is_dir: i64 = row.get(2)?;
                let size: Option<i64> = row.get(3)?;
                let modified: Option<i64> = row.get(4)?;
                let extension = if is_dir == 1 {
                    None
                } else {
                    std::path::Path::new(&name)
                        .extension()
                        .map(|ext| ext.to_string_lossy().to_lowercase())
                };
                Ok(crate::domain::FileEntry {
                    name,
                    path,
                    is_dir: is_dir == 1,
                    size: size.map(|v| v as u64),
                    modified: modified.map(|v| v as u64),
                    extension,
                })
            },
        )
        .optional()?;
    Ok(row)
}

pub fn search_file_index(
    conn: &Connection,
    query: &str,
    limit: usize,
) -> Result<Vec<crate::domain::FileEntry>, AppError> {
    let pattern = format!("%{}%", query.trim().to_lowercase());
    let mut stmt = conn.prepare(
        "SELECT path, name, is_dir, size, modified
         FROM file_index
         WHERE name_lower LIKE ?1
         ORDER BY is_dir DESC, name_lower ASC
         LIMIT ?2",
    )?;

    let rows = stmt
        .query_map(params![pattern, limit as i64], |row| {
            let path: String = row.get(0)?;
            let name: String = row.get(1)?;
            let is_dir: i64 = row.get(2)?;
            let size: Option<i64> = row.get(3)?;
            let modified: Option<i64> = row.get(4)?;
            let extension = if is_dir == 1 {
                None
            } else {
                std::path::Path::new(&name)
                    .extension()
                    .map(|ext| ext.to_string_lossy().to_lowercase())
            };
            Ok(crate::domain::FileEntry {
                name,
                path,
                is_dir: is_dir == 1,
                size: size.map(|v| v as u64),
                modified: modified.map(|v| v as u64),
                extension,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn list_favorites(conn: &Connection) -> Result<Vec<FavoriteRecord>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT path, name FROM favorites ORDER BY sort_order ASC, name COLLATE NOCASE ASC",
    )?;
    let rows = stmt
        .query_map([], |row| {
            Ok(FavoriteRecord {
                path: row.get(0)?,
                name: row.get(1)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn add_favorite(conn: &Connection, path: &str, name: &str) -> Result<Vec<FavoriteRecord>, AppError> {
    let key = normalize_path(path);
    if key.is_empty() {
        return Err(AppError::new("Path cannot be empty"));
    }
    let display_name = name.trim();
    if display_name.is_empty() {
        return Err(AppError::new("Favorite name cannot be empty"));
    }

    let next_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM favorites",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    conn.execute(
        "INSERT INTO favorites (path, name, sort_order) VALUES (?1, ?2, ?3)
         ON CONFLICT(path) DO UPDATE SET name = excluded.name",
        params![key, display_name, next_order],
    )?;
    list_favorites(conn)
}

pub fn remove_favorite(conn: &Connection, path: &str) -> Result<Vec<FavoriteRecord>, AppError> {
    let key = normalize_path(path);
    conn.execute("DELETE FROM favorites WHERE path = ?1", params![key])?;
    list_favorites(conn)
}
