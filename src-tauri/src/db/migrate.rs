use rusqlite::Connection;

use crate::error::AppError;

pub fn migrate(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY NOT NULL
        );
        ",
    )?;

    let version: u32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if version < 1 {
        migrate_v1(conn)?;
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (?1)",
            [1],
        )?;
    }

    let version: u32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if version < 2 {
        migrate_v2(conn)?;
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (?1)",
            [2],
        )?;
    }

    Ok(())
}

fn migrate_v1(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        CREATE TABLE files (
            id INTEGER PRIMARY KEY NOT NULL,
            path TEXT NOT NULL UNIQUE,
            note TEXT NOT NULL DEFAULT '',
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE tags (
            id INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            color TEXT NULL
        );

        CREATE TABLE file_tags (
            file_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (file_id, tag_id),
            FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE TABLE favorites (
            path TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE VIRTUAL TABLE notes_fts USING fts5(
            note,
            content='files',
            content_rowid='id'
        );

        CREATE TRIGGER files_ai AFTER INSERT ON files BEGIN
            INSERT INTO notes_fts(rowid, note) VALUES (new.id, new.note);
        END;

        CREATE TRIGGER files_ad AFTER DELETE ON files BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, note) VALUES('delete', old.id, old.note);
        END;

        CREATE TRIGGER files_au AFTER UPDATE ON files BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, note) VALUES('delete', old.id, old.note);
            INSERT INTO notes_fts(rowid, note) VALUES (new.id, new.note);
        END;

        CREATE INDEX idx_file_tags_tag_id ON file_tags(tag_id);
        CREATE INDEX idx_files_path ON files(path);
        ",
    )?;
    Ok(())
}

fn migrate_v2(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS file_index (
            path TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            name_lower TEXT NOT NULL,
            is_dir INTEGER NOT NULL,
            size INTEGER,
            modified INTEGER,
            indexed_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_file_index_name_lower ON file_index(name_lower);
        ",
    )?;

    // Seed cache from paths that already have metadata (tags/notes).
    let mut stmt = conn.prepare("SELECT path FROM files")?;
    let paths: Vec<String> = stmt
        .query_map([], |row| row.get(0))?
        .collect::<Result<Vec<_>, _>>()?;
    drop(stmt);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let mut insert = conn.prepare(
        "INSERT OR IGNORE INTO file_index
         (path, name, name_lower, is_dir, size, modified, indexed_at)
         VALUES (?1, ?2, ?3, 0, NULL, NULL, ?4)",
    )?;

    for path in paths {
        let name = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&path);
        if name.is_empty() {
            continue;
        }
        insert.execute(rusqlite::params![
            path,
            name,
            name.to_lowercase(),
            now
        ])?;
    }

    Ok(())
}
