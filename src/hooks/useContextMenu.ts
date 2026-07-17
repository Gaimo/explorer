import { useCallback, useEffect, useState } from "react";
import type { FileEntry } from "../types/fs";

export type ContextMenuTarget =
  | { kind: "entry"; entry: FileEntry }
  | { kind: "background" };

export interface ContextMenuState {
  x: number;
  y: number;
  target: ContextMenuTarget;
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const openMenu = useCallback(
    (event: { clientX: number; clientY: number; preventDefault: () => void }, target: ContextMenuTarget) => {
      event.preventDefault();
      setMenu({
        x: event.clientX,
        y: event.clientY,
        target,
      });
    },
    [],
  );

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  useEffect(() => {
    if (!menu) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-context-menu]")) return;
      closeMenu();
    };
    const onBlur = () => closeMenu();
    const onResize = () => closeMenu();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [closeMenu, menu]);

  return { menu, openMenu, closeMenu };
}
