import { useCallback, useState } from "react";
import type { FileEntry } from "../types/fs";

export type ClipboardMode = "copy" | "cut";

export interface FileClipboard {
  mode: ClipboardMode;
  entries: FileEntry[];
}

export function useFileClipboard() {
  const [clipboard, setClipboard] = useState<FileClipboard | null>(null);

  const copyEntries = useCallback((entries: FileEntry[]) => {
    if (entries.length === 0) return;
    setClipboard({ mode: "copy", entries });
  }, []);

  const cutEntries = useCallback((entries: FileEntry[]) => {
    if (entries.length === 0) return;
    setClipboard({ mode: "cut", entries });
  }, []);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  return {
    clipboard,
    hasClipboard: clipboard !== null && clipboard.entries.length > 0,
    copyEntries,
    cutEntries,
    clearClipboard,
  };
}
