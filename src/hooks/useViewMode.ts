import { useCallback, useEffect, useState } from "react";
import type { ViewMode } from "../types/fs";

const STORAGE_KEY = "explorer.viewMode";

function readStoredMode(): ViewMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "grid" || value === "list") return value;
  } catch {
    // ignore storage errors
  }
  return "grid";
}

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readStoredMode());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {
      // ignore storage errors
    }
  }, [viewMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  return { viewMode, setViewMode };
}
