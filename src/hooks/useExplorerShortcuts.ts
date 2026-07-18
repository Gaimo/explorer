import { useEffect, useRef } from "react";

export interface ExplorerShortcutHandlers {
  onDelete?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
}

interface UseExplorerShortcutsOptions {
  /** When false, shortcuts are ignored (e.g. a dialog is open). */
  enabled?: boolean;
  handlers: ExplorerShortcutHandlers;
}

interface ShortcutBinding {
  key: string;
  mod?: boolean;
  handler: keyof ExplorerShortcutHandlers;
}

const SHORTCUTS: ShortcutBinding[] = [
  { key: "delete", handler: "onDelete" },
  { key: "c", mod: true, handler: "onCopy" },
  { key: "x", mod: true, handler: "onCut" },
  { key: "v", mod: true, handler: "onPaste" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * Global explorer keyboard shortcuts.
 * Add entries to SHORTCUTS; App only wires the handlers.
 */
export function useExplorerShortcuts({
  enabled = true,
  handlers,
}: UseExplorerShortcutsOptions) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return;
      if (isTypingTarget(event.target)) return;

      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      const binding = SHORTCUTS.find(
        (item) => item.key === key && Boolean(item.mod) === mod,
      );
      if (!binding) return;

      const action = handlersRef.current[binding.handler];
      if (!action) return;

      event.preventDefault();
      action();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
