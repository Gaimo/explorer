import { useCallback, useEffect, useRef, useState } from "react";
import {
  addFileTag,
  getFileMetadata,
  removeFileTag,
  setFileNote,
} from "../lib/tauri/metadata";
import type { FileMetadata } from "../types/metadata";
import { errorMessage } from "../lib/errors";

const emptyMeta = (path: string): FileMetadata => ({
  path,
  note: "",
  tags: [],
});

export function useFileMetadata(path: string | null) {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathRef = useRef(path);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (!path) {
      setMetadata(null);
      setNoteDraft("");
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const meta = await getFileMetadata(path);
        if (cancelled || pathRef.current !== path) return;
        setMetadata(meta);
        setNoteDraft(meta.note);
      } catch (err) {
        if (cancelled) return;
        setMetadata(emptyMeta(path));
        setNoteDraft("");
        setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  const updateNoteDraft = useCallback(
    (note: string) => {
      setNoteDraft(note);
      if (!path) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void (async () => {
          try {
            const meta = await setFileNote(path, note);
            if (pathRef.current !== path) return;
            setMetadata(meta);
            setError(null);
          } catch (err) {
            setError(errorMessage(err));
          }
        })();
      }, 400);
    },
    [path],
  );

  const addTag = useCallback(
    async (tag: string) => {
      if (!path) return;
      const meta = await addFileTag(path, tag);
      setMetadata(meta);
      setNoteDraft(meta.note);
    },
    [path],
  );

  const removeTag = useCallback(
    async (tag: string) => {
      if (!path) return;
      const meta = await removeFileTag(path, tag);
      setMetadata(meta);
      setNoteDraft(meta.note);
    },
    [path],
  );

  return {
    metadata,
    noteDraft,
    loading,
    error,
    updateNoteDraft,
    addTag,
    removeTag,
    setMetadata,
  };
}
