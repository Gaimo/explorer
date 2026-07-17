import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ClipboardPaste,
  Copy,
  ExternalLink,
  FolderOpen,
  FolderPlus,
  Pencil,
  RefreshCw,
  Scissors,
  Star,
  Tag,
  Trash2,
} from "../../icons";
import type { ContextMenuState } from "../../hooks/useContextMenu";

export type ContextAction =
  | "open"
  | "reveal"
  | "copy"
  | "cut"
  | "paste"
  | "rename"
  | "delete"
  | "favorite"
  | "addTag"
  | "copyPath"
  | "newFolder"
  | "refresh";

interface FileContextMenuProps {
  menu: ContextMenuState;
  canPaste: boolean;
  isFavorite: boolean;
  onAction: (action: ContextAction) => void;
}

interface MenuItem {
  id: ContextAction;
  label: string;
  icon: typeof Copy;
  danger?: boolean;
  disabled?: boolean;
}

export function FileContextMenu({
  menu,
  canPaste,
  isFavorite,
  onAction,
}: FileContextMenuProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [coords, setCoords] = useState({ x: menu.x, y: menu.y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    const padding = 8;
    const x = Math.min(menu.x, window.innerWidth - width - padding);
    const y = Math.min(menu.y, window.innerHeight - height - padding);
    setCoords({ x: Math.max(padding, x), y: Math.max(padding, y) });
  }, [menu.x, menu.y]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const items: MenuItem[] =
    menu.target.kind === "entry"
      ? [
          {
            id: "open",
            label: menu.target.entry.isDir ? "Open" : "Open with default app",
            icon: FolderOpen,
          },
          { id: "reveal", label: "Show in Explorer", icon: ExternalLink },
          { id: "copy", label: "Copy", icon: Copy },
          { id: "cut", label: "Cut", icon: Scissors },
          { id: "paste", label: "Paste", icon: ClipboardPaste, disabled: !canPaste },
          { id: "rename", label: "Rename", icon: Pencil },
          {
            id: "favorite",
            label: isFavorite ? "Remove from favorites" : "Add to favorites",
            icon: Star,
            disabled: !menu.target.entry.isDir,
          },
          { id: "addTag", label: "Add tag…", icon: Tag },
          { id: "copyPath", label: "Copy path", icon: Copy },
          { id: "delete", label: "Delete", icon: Trash2, danger: true },
        ]
      : [
          { id: "paste", label: "Paste", icon: ClipboardPaste, disabled: !canPaste },
          { id: "newFolder", label: "New folder", icon: FolderPlus },
          { id: "refresh", label: "Refresh", icon: RefreshCw },
        ];

  return (
    <ul
      ref={ref}
      data-context-menu
      tabIndex={-1}
      role="menu"
      className="menu menu-sm fixed z-50 w-56 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
      style={{ left: coords.x, top: coords.y }}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const showDividerBefore =
          menu.target.kind === "entry" &&
          (item.id === "copy" || item.id === "rename" || item.id === "delete");

        return (
          <li key={item.id} role="none">
            {showDividerBefore && index > 0 ? (
              <div className="divider my-0.5 h-px" />
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={item.danger ? "text-error" : undefined}
              onClick={() => {
                if (item.disabled) return;
                onAction(item.id);
              }}
            >
              <Icon className={`size-4 ${item.id === "favorite" && isFavorite ? "fill-current" : ""}`} />
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
