use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use rusqlite::Connection;
use walkdir::WalkDir;

use crate::db::repo;
use crate::error::AppError;

const BATCH_SIZE: usize = 200;
const START_DELAY: Duration = Duration::from_secs(2);
const BATCH_PAUSE: Duration = Duration::from_millis(8);

/// Opens a dedicated connection and walks the disk in a background thread.
/// Search never waits on this — it only reads the SQLite cache.
pub fn spawn(db_path: PathBuf) {
    let _ = std::thread::Builder::new()
        .name("file-indexer".into())
        .spawn(move || {
            std::thread::sleep(START_DELAY);
            if let Err(err) = run(db_path) {
                eprintln!("[file-indexer] {err}");
            }
        });
}

fn run(db_path: PathBuf) -> Result<(), AppError> {
    let conn = open_conn(&db_path)?;
    let mut batch: Vec<(String, String, bool, Option<u64>, Option<u64>)> =
        Vec::with_capacity(BATCH_SIZE);

    for root in index_roots() {
        let walker = WalkDir::new(&root)
            .follow_links(false)
            .into_iter()
            .filter_entry(|entry| !should_skip(entry.path()));

        for item in walker {
            let entry = match item {
                Ok(value) => value,
                Err(_) => continue,
            };

            let path = entry.path();
            let Some(name) = entry.file_name().to_str() else {
                continue;
            };
            if name.is_empty() {
                continue;
            }

            let metadata = match entry.metadata() {
                Ok(meta) => meta,
                Err(_) => continue,
            };

            let is_dir = metadata.is_dir();
            let size = if is_dir {
                None
            } else {
                Some(metadata.len())
            };
            let modified = metadata.modified().ok().and_then(system_time_to_secs);

            batch.push((
                path.to_string_lossy().into_owned(),
                name.to_string(),
                is_dir,
                size,
                modified,
            ));

            if batch.len() >= BATCH_SIZE {
                repo::upsert_file_index_batch(&conn, &batch)?;
                batch.clear();
                std::thread::sleep(BATCH_PAUSE);
            }
        }
    }

    if !batch.is_empty() {
        repo::upsert_file_index_batch(&conn, &batch)?;
    }

    Ok(())
}

fn open_conn(db_path: &Path) -> Result<Connection, AppError> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
        ",
    )?;
    Ok(conn)
}

fn index_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    if let Some(home) = dirs::home_dir() {
        roots.push(home);
    }

    #[cfg(windows)]
    {
        for letter in b'A'..=b'Z' {
            let root = PathBuf::from(format!("{}:\\", letter as char));
            if root.exists() && !roots.iter().any(|r| r == &root) {
                roots.push(root);
            }
        }
    }

    #[cfg(not(windows))]
    {
        let root = PathBuf::from("/");
        if !roots.iter().any(|r| r == &root) {
            roots.push(root);
        }
    }

    roots
}

fn should_skip(path: &Path) -> bool {
    let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
        return false;
    };

    matches!(
        name,
        "$Recycle.Bin"
            | "System Volume Information"
            | "Recovery"
            | "WinSxS"
            | "node_modules"
            | ".git"
            | "AppData"
            | "Windows"
            | "Program Files"
            | "Program Files (x86)"
            | "ProgramData"
            | "$Windows.~BT"
            | "$Windows.~WS"
    )
}

fn system_time_to_secs(time: SystemTime) -> Option<u64> {
    time.duration_since(SystemTime::UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_secs())
}
