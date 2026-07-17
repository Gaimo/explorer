import { useCallback, useEffect, useState } from "react";
import type { FavoriteFolder } from "../types/fs";
import {
  addFavorite as addFavoriteApi,
  listFavorites,
  removeFavorite as removeFavoriteApi,
} from "../lib/tauri/metadata";
import { folderNameFromPath, normalizePathKey } from "../lib/path";
import { errorMessage } from "../lib/errors";

const STORAGE_KEY = "explorer.favorites";
const MIGRATED_KEY = "explorer.favorites.migrated";

function readLocalFavorites(): FavoriteFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FavoriteFolder =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as FavoriteFolder).path === "string" &&
        typeof (item as FavoriteFolder).name === "string",
    );
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteFolder[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const migrated = localStorage.getItem(MIGRATED_KEY) === "1";
        if (!migrated) {
          const local = readLocalFavorites();
          for (const fav of local) {
            await addFavoriteApi(fav.path, fav.name);
          }
          localStorage.setItem(MIGRATED_KEY, "1");
          localStorage.removeItem(STORAGE_KEY);
        }

        const next = await listFavorites();
        if (cancelled) return;
        setFavorites(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(errorMessage(err));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (path: string) => {
      const key = normalizePathKey(path);
      return favorites.some((fav) => normalizePathKey(fav.path) === key);
    },
    [favorites],
  );

  const addFavorite = useCallback(async (path: string) => {
    if (!path) return;
    const next = await addFavoriteApi(path, folderNameFromPath(path));
    setFavorites(next);
  }, []);

  const removeFavorite = useCallback(async (path: string) => {
    const next = await removeFavoriteApi(path);
    setFavorites(next);
  }, []);

  const toggleFavorite = useCallback(
    async (path: string) => {
      if (isFavorite(path)) await removeFavorite(path);
      else await addFavorite(path);
    },
    [addFavorite, isFavorite, removeFavorite],
  );

  return {
    favorites,
    ready,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
