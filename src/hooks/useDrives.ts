import { useEffect, useState } from "react";
import { listDrives } from "../lib/tauri/fs";
import type { DriveEntry } from "../types/fs";

export function useDrives() {
  const [drives, setDrives] = useState<DriveEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await listDrives();
        if (!cancelled) {
          setDrives(result);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
        setError(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { drives, error };
}
