mod commands;
mod db;
mod domain;
mod error;

use db::DbState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_drag::init())
        .plugin(prevent_default())
        .setup(|app| {
            let (conn, db_path) = db::open_db(app.handle())?;
            app.manage(DbState(std::sync::Arc::new(std::sync::Mutex::new(conn))));
            db::indexer::spawn(db_path);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs::get_home_dir,
            commands::fs::list_directory,
            commands::fs::list_drives,
            commands::fs::rename_path,
            commands::fs::delete_path,
            commands::fs::create_directory,
            commands::fs::copy_path,
            commands::fs::move_path,
            commands::fs::read_text_file,
            commands::metadata::get_file_metadata,
            commands::metadata::set_file_note,
            commands::metadata::add_file_tag,
            commands::metadata::remove_file_tag,
            commands::metadata::list_tags,
            commands::metadata::list_paths_by_tag,
            commands::metadata::get_metadata_summaries,
            commands::favorites::list_favorites,
            commands::favorites::add_favorite,
            commands::favorites::remove_favorite,
            commands::search::search_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(debug_assertions)]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    // Keep DevTools and reload available while developing.
    tauri_plugin_prevent_default::debug()
}

#[cfg(not(debug_assertions))]
fn prevent_default() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri_plugin_prevent_default::init()
}
