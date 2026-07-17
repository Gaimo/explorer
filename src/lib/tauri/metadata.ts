import { invoke } from "@tauri-apps/api/core";
import type { FavoriteFolder } from "../../types/fs";
import type { FileMetadata, MetadataSummary } from "../../types/metadata";

export async function getFileMetadata(path: string): Promise<FileMetadata> {
  return invoke<FileMetadata>("get_file_metadata", { path });
}

export async function setFileNote(
  path: string,
  note: string,
): Promise<FileMetadata> {
  return invoke<FileMetadata>("set_file_note", { path, note });
}

export async function addFileTag(
  path: string,
  tag: string,
): Promise<FileMetadata> {
  return invoke<FileMetadata>("add_file_tag", { path, tag });
}

export async function removeFileTag(
  path: string,
  tag: string,
): Promise<FileMetadata> {
  return invoke<FileMetadata>("remove_file_tag", { path, tag });
}

export async function listTags(): Promise<string[]> {
  return invoke<string[]>("list_tags");
}

export async function listPathsByTag(tag: string): Promise<string[]> {
  return invoke<string[]>("list_paths_by_tag", { tag });
}

export async function getMetadataSummaries(
  paths: string[],
): Promise<MetadataSummary[]> {
  return invoke<MetadataSummary[]>("get_metadata_summaries", { paths });
}

export async function listFavorites(): Promise<FavoriteFolder[]> {
  return invoke<FavoriteFolder[]>("list_favorites");
}

export async function addFavorite(
  path: string,
  name: string,
): Promise<FavoriteFolder[]> {
  return invoke<FavoriteFolder[]>("add_favorite", { path, name });
}

export async function removeFavorite(path: string): Promise<FavoriteFolder[]> {
  return invoke<FavoriteFolder[]>("remove_favorite", { path });
}
