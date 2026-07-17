import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listTags } from "../lib/tauri/metadata";
import { errorMessage } from "../lib/errors";
import type { FileEntry } from "../types/fs";

const DEBOUNCE_MS = 300;

export async function searchFiles(query: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("search_files", { query });
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;

  const refreshTags = useCallback(async () => {
    // Keep tag list warm for metadata UI after tag edits.
    try {
      await listTags();
    } catch {
      // ignore — search does not require the tag list client-side anymore
    }
  }, []);

  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const next = await searchFiles(trimmed);
          if (cancelled) return;
          setResults(next);
          setError(null);
        } catch (err) {
          if (cancelled) return;
          setResults([]);
          setError(errorMessage(err));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isSearching, trimmed]);

  return {
    query,
    setQuery,
    results,
    loading,
    isSearching,
    error,
    refreshTags,
  };
}
