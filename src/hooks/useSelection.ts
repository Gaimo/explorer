import { useCallback, useState } from "react";
import type { FileEntry } from "../types/fs";

export function useSelection() {
  const [selected, setSelected] = useState<FileEntry | null>(null);

  const select = useCallback((entry: FileEntry | null) => {
    setSelected(entry);
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
  }, []);

  return { selected, select, clear };
}
