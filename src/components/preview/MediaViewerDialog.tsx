import { useEffect, useRef } from "react";
import { X } from "../../icons";
import { isImage, isVideo, toAssetUrl } from "../../lib/media";
import type { FileEntry } from "../../types/fs";
import { ImagePreview } from "./ImagePreview";
import { VideoPreview } from "./VideoPreview";

interface MediaViewerDialogProps {
  entry: FileEntry | null;
  onClose: () => void;
}

export function MediaViewerDialog({ entry, onClose }: MediaViewerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open =
    entry !== null && !entry.isDir && (isImage(entry) || isVideo(entry));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="modal-box flex h-[85vh] max-h-[85vh] w-11/12 max-w-5xl flex-col p-0">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 px-4 py-3">
          <h3 className="truncate text-base font-medium">
            {entry?.name ?? "Media"}
          </h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden bg-base-200/40">
          {entry && isImage(entry) ? (
            <ImagePreview src={toAssetUrl(entry.path)} alt={entry.name} />
          ) : null}
          {entry && isVideo(entry) ? (
            <VideoPreview src={toAssetUrl(entry.path)} />
          ) : null}
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  );
}
