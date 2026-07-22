import { useEffect, useRef, useState } from "react";
import { errorMessage } from "../lib/errors";
import { readTextFile } from "../lib/tauri/fs";

export function useTextFile(path: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathRef = useRef(path);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    if (!path) {
      setContent(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);

    void (async () => {
      try {
        const text = await readTextFile(path);
        if (cancelled || pathRef.current !== path) return;
        setContent(text);
      } catch (err) {
        if (cancelled || pathRef.current !== path) return;
        setContent(null);
        setError(errorMessage(err));
      } finally {
        if (!cancelled && pathRef.current === path) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { content, loading, error };
}
