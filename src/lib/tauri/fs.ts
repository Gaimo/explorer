import { invoke } from "@tauri-apps/api/core";
import type { DriveEntry, FileEntry } from "../../types/fs";

export async function getHomeDir(): Promise<string> {
  return invoke<string>("get_home_dir");
}

export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_directory", { path });
}

export async function listDrives(): Promise<DriveEntry[]> {
  return invoke<DriveEntry[]>("list_drives");
}

export async function renamePath(path: string, newName: string): Promise<string> {
  return invoke<string>("rename_path", { path, newName });
}

export async function deletePath(path: string): Promise<void> {
  return invoke<void>("delete_path", { path });
}

export async function createDirectory(
  parent: string,
  name: string,
): Promise<string> {
  return invoke<string>("create_directory", { parent, name });
}

export async function copyPath(
  source: string,
  destinationDir: string,
): Promise<string> {
  return invoke<string>("copy_path", { source, destinationDir });
}

export async function movePath(
  source: string,
  destinationDir: string,
): Promise<string> {
  return invoke<string>("move_path", { source, destinationDir });
}
