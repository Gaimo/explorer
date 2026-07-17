import { useState } from "react";
import { File } from "../../icons";
import {
  formatBytes,
  isImage,
  isVideo,
  toAssetUrl,
} from "../../lib/media";
import type { FileEntry } from "../../types/fs";
import { FileTag } from "../explorer/FileTag";

interface PreviewPanelProps {
  entry: FileEntry | null;
  note: string;
  tags: string[];
  metadataLoading?: boolean;
  onNoteChange: (note: string) => void;
  onAddTag: (tag: string) => Promise<void> | void;
  onRemoveTag: (tag: string) => Promise<void> | void;
  onOpenMedia?: (entry: FileEntry) => void;
}

export function PreviewPanel({
  entry,
  note,
  tags,
  metadataLoading = false,
  onNoteChange,
  onAddTag,
  onRemoveTag,
  onOpenMedia,
}: PreviewPanelProps) {
  const [tagInput, setTagInput] = useState("");

  if (!entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <File className="size-8 opacity-30" />
        <p className="text-sm opacity-60">Select a file to preview</p>
      </div>
    );
  }

  const submitTag = async () => {
    const value = tagInput.trim();
    if (!value) return;
    await onAddTag(value);
    setTagInput("");
  };

  const media = !entry.isDir && (isImage(entry) || isVideo(entry));

  return (
    <div className="flex h-full flex-col overflow-auto">
      {media ? (
        <button
          type="button"
          className="shrink-0 border-b border-base-300 p-3 text-left transition-colors hover:bg-base-200/60"
          onClick={() => onOpenMedia?.(entry)}
        >
          <div className="overflow-hidden rounded-box bg-base-200/40">
            {isImage(entry) ? (
              <img
                src={toAssetUrl(entry.path)}
                alt={entry.name}
                className="mx-auto max-h-36 object-contain"
              />
            ) : (
              <div className="flex h-28 items-center justify-center text-sm opacity-60">
                Open video viewer
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs opacity-50">Click to open</p>
        </button>
      ) : entry.isDir ? (
        <div className="shrink-0 border-b border-base-300 p-4">
          <p className="text-sm opacity-60">Folder</p>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-b border-base-300 p-6 text-center">
          <File className="size-10 opacity-30" />
          <p className="text-sm opacity-60">No preview available</p>
        </div>
      )}

      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-sm font-medium">{entry.name}</h2>
          <p className="mt-1 text-xs opacity-60">
            {entry.isDir
              ? "Folder"
              : entry.extension
                ? entry.extension.toUpperCase()
                : "File"}
            {!entry.isDir ? ` · ${formatBytes(entry.size)}` : null}
          </p>
          <p className="mt-2 truncate text-xs opacity-50">{entry.path}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium tracking-wide uppercase opacity-50">
            Tags
          </p>
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.length === 0 ? (
              <span className="text-xs opacity-50">No tags</span>
            ) : (
              tags.map((tag) => (
                <FileTag
                  key={tag}
                  label={tag}
                  onRemove={() => void onRemoveTag(tag)}
                />
              ))
            )}
          </div>
          <input
            className="input input-sm w-full"
            placeholder="Add tag"
            value={tagInput}
            disabled={metadataLoading}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitTag();
              }
            }}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium tracking-wide uppercase opacity-50">
            Note
          </p>
          <textarea
            className="textarea textarea-sm h-28 w-full resize-none"
            placeholder="Add a note…"
            value={note}
            disabled={metadataLoading}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
