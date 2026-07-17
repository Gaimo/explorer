import type { DragEvent, MouseEvent } from "react";
import { formatBytes, isImage, isVideo } from "../../lib/media";
import { dragEntryOut } from "../../lib/drag";
import { normalizePathKey } from "../../lib/path";
import type { FileEntry } from "../../types/fs";
import type { MetadataSummary } from "../../types/metadata";
import { FileThumbnail } from "./FileThumbnail";

interface FileGridProps {
  entries: FileEntry[];
  selectedPath: string | null;
  summaries: Map<string, MetadataSummary>;
  onOpen: (entry: FileEntry) => void;
  onSelect: (entry: FileEntry) => void;
  onEntryContextMenu: (event: MouseEvent, entry: FileEntry) => void;
  onBackgroundContextMenu: (event: MouseEvent) => void;
}

export function FileGrid({
  entries,
  selectedPath,
  summaries,
  onOpen,
  onSelect,
  onEntryContextMenu,
  onBackgroundContextMenu,
}: FileGridProps) {
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
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {entries.map((entry) => {
            const selected = selectedPath === entry.path;
            const summary = summaries.get(normalizePathKey(entry.path));
            const hasMeta =
              !!summary && (summary.hasNote || summary.tagCount > 0);
            return (
              <button
                key={entry.path}
                type="button"
                draggable
                className={`relative flex flex-col items-stretch gap-2 rounded-box border p-2 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-base-200/60 hover:bg-base-200"
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
                {hasMeta ? (
                  <span className="badge badge-xs absolute top-3 right-3 z-10">
                    {summary!.tagCount > 0 ? summary!.tagCount : "•"}
                  </span>
                ) : null}
                <FileThumbnail
                  entry={entry}
                  className="aspect-square w-full pointer-events-none"
                  iconClassName="size-8"
                />
                <span className="truncate px-1 text-sm font-medium">
                  {entry.name}
                </span>
                <span className="truncate px-1 pb-1 text-xs opacity-60">
                  {entry.isDir
                    ? "Folder"
                    : isImage(entry)
                      ? "Image"
                      : isVideo(entry)
                        ? "Video"
                        : formatBytes(entry.size)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
