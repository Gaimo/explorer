import { useEffect, useMemo, useState } from "react";
import { getMetadataSummaries } from "../lib/tauri/metadata";
import { normalizePathKey } from "../lib/path";
import type { FileEntry } from "../types/fs";
import type { MetadataSummary } from "../types/metadata";

export function useMetadataSummaries(entries: FileEntry[]) {
  const [summaries, setSummaries] = useState<Map<string, MetadataSummary>>(
    () => new Map(),
  );

  const pathsKey = useMemo(
    () => entries.map((entry) => entry.path).join("\0"),
    [entries],
  );

  useEffect(() => {
    if (entries.length === 0) {
      setSummaries(new Map());
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const rows = await getMetadataSummaries(entries.map((e) => e.path));
        if (cancelled) return;
        const map = new Map<string, MetadataSummary>();
        for (const row of rows) {
          map.set(normalizePathKey(row.path), row);
        }
        setSummaries(map);
      } catch {
        if (!cancelled) setSummaries(new Map());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entries, pathsKey]);

  return summaries;
}
