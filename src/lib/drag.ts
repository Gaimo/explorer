import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { isImage } from "./media";
import type { FileEntry } from "../types/fs";

/** Minimal 1×1 PNG used when the dragged item is not a previewable image. */
const FALLBACK_DRAG_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export async function dragFilesOut(entries: FileEntry[]): Promise<void> {
  const paths = entries.map((entry) => entry.path).filter(Boolean);
  if (paths.length === 0) return;

  const previewSource = entries.find((entry) => isImage(entry));
  const icon = previewSource ? previewSource.path : FALLBACK_DRAG_ICON;

  await startDrag({
    item: paths,
    icon,
    mode: "copy",
  });
}

export function dragEntryOut(entry: FileEntry): Promise<void> {
  return dragFilesOut([entry]);
}
