import type { DragEvent, MouseEvent } from "react";
import { formatBytes } from "../../lib/media";
import { dragEntryOut } from "../../lib/drag";
import { normalizePathKey } from "../../lib/path";
import type { FileEntry } from "../../types/fs";
import type { MetadataSummary } from "../../types/metadata";
import { FileThumbnail } from "./FileThumbnail";

interface FileListProps {
  entries: FileEntry[];
  selectedPath: string | null;
  summaries: Map<string, MetadataSummary>;
  onOpen: (entry: FileEntry) => void;
  onSelect: (entry: FileEntry) => void;
  onEntryContextMenu: (event: MouseEvent, entry: FileEntry) => void;
  onBackgroundContextMenu: (event: MouseEvent) => void;
}

export function FileListView({
  entries,
  selectedPath,
  summaries,
  onOpen,
  onSelect,
  onEntryContextMenu,
  onBackgroundContextMenu,
}: FileListProps) {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>, entry: FileEntry) => {
    event.preventDefault();
    void dragEntryOut(entry);
  };

  return (
    <div
      className="h-full min-h-full"
      onContextMenu={onBackgroundContextMenu}
    >
      {entries.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm opacity-60">
          This folder is empty
        </div>
      ) : (
        <ul className="list bg-base-100">
          {entries.map((entry) => {
            const selected = selectedPath === entry.path;
            const summary = summaries.get(normalizePathKey(entry.path));
            const hasMeta =
              !!summary && (summary.hasNote || summary.tagCount > 0);
            return (
              <li key={entry.path}>
                <button
                  type="button"
                  draggable
                  className={`list-row w-full rounded-none border-b border-base-200 text-left ${
                    selected ? "bg-primary/10" : "hover:bg-base-200/70"
                  }`}
                  onClick={() => onSelect(entry)}
                  onDoubleClick={() => {
                    if (entry.isDir) onOpen(entry);
                    else onSelect(entry);
                  }}
                  onContextMenu={(event) => {
                    event.stopPropagation();
                    onEntryContextMenu(event, entry);
                  }}
                  onDragStart={(event) => handleDragStart(event, entry)}
                >
                  <FileThumbnail
                    entry={entry}
                    className="size-12 pointer-events-none"
                    iconClassName="size-5"
                  />
                  <div className="list-col-grow min-w-0 pointer-events-none">
                    <div className="truncate text-sm font-medium">{entry.name}</div>
                    <div className="truncate text-xs opacity-60">
                      {entry.isDir
                        ? "Folder"
                        : entry.extension
                          ? entry.extension.toUpperCase()
                          : "File"}
                      {hasMeta
                        ? ` · ${summary.tagCount > 0 ? `${summary.tagCount} tags` : "note"}`
                        : null}
                    </div>
                  </div>
                  <div className="text-xs opacity-60 tabular-nums pointer-events-none">
                    {entry.isDir ? "—" : formatBytes(entry.size)}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
