# New Explorer

A desktop file explorer with media preview, local metadata (tags and notes), and search by name or tag.

Built with **Tauri 2**, **React**, **TypeScript**, **Tailwind CSS**, and **daisyUI**.

## Features

- Browse folders, drives, and favorites
- View images and videos in a dedicated dialog
- Attach tags and notes to files (local SQLite)
- Global search by name or tag, backed by a cached index
- Drag files out of the app into other programs / Windows Explorer
- Custom title bar (no native system chrome)

## Compatibility

**Tested and validated on Windows 11 only.**

There is no guarantee it works correctly on Linux or macOS. Those platforms have not been verified for this project; filesystem behavior, drag-and-drop, undecorated windows, and path handling may differ or fail.

## Development

Prerequisites: [Bun](https://bun.sh/), [Rust](https://www.rust-lang.org/), and the [Tauri](https://v2.tauri.app/start/prerequisites/) dependencies.

```bash
bun install
bun run tauri dev
```

Production build:

```bash
bun run tauri build
```
