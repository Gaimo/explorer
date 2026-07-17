import { useCallback, useEffect, useState } from "react";
import { getHomeDir, listDirectory } from "../lib/tauri/fs";
import type { FileEntry } from "../types/fs";

interface DirectoryState {
  path: string;
  entries: FileEntry[];
  loading: boolean;
  error: string | null;
}

export function useDirectory() {
  const [state, setState] = useState<DirectoryState>({
    path: "",
    entries: [],
    loading: true,
    error: null,
  });
  const [homePath, setHomePath] = useState("");

  const load = useCallback(async (path: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const entries = await listDirectory(path);
      setState({ path, entries, loading: false, error: null });
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      setState((prev) => ({
        ...prev,
        path,
        entries: [],
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const home = await getHomeDir();
        if (cancelled) return;
        setHomePath(home);
        await load(home);
      } catch (err) {
        if (cancelled) return;
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
        setState({
          path: "",
          entries: [],
          loading: false,
          error: message,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const navigateTo = useCallback(
    (path: string) => {
      void load(path);
    },
    [load],
  );

  const navigateUp = useCallback(() => {
    if (!state.path) return;
    const normalized = state.path.replace(/[\\/]+$/, "");
    const separator = normalized.includes("\\") ? "\\" : "/";
    const parts = normalized.split(/[\\/]/);
    if (parts.length <= 1) return;
    // Keep drive root on Windows (e.g. "C:")
    if (parts.length === 2 && /^[A-Za-z]:$/.test(parts[0])) {
      void load(`${parts[0]}${separator}`);
      return;
    }
    parts.pop();
    const parent = parts.join(separator) || separator;
    void load(parent);
  }, [load, state.path]);

  return {
    path: state.path,
    entries: state.entries,
    loading: state.loading,
    error: state.error,
    homePath,
    navigateTo,
    navigateUp,
    refresh: () => {
      if (state.path) void load(state.path);
    },
  };
}
