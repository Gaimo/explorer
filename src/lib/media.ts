import { convertFileSrc } from "@tauri-apps/api/core";
import type { FileEntry } from "../types/fs";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "svg",
  "ico",
  "avif",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mkv",
  "mov",
  "avi",
  "m4v",
  "ogv",
]);

export function isImage(entry: FileEntry): boolean {
  if (entry.isDir || !entry.extension) return false;
  return IMAGE_EXTENSIONS.has(entry.extension.toLowerCase());
}

export function isVideo(entry: FileEntry): boolean {
  if (entry.isDir || !entry.extension) return false;
  return VIDEO_EXTENSIONS.has(entry.extension.toLowerCase());
}

export function toAssetUrl(path: string): string {
  return convertFileSrc(path);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const rounded = value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[exponent]}`;
}
