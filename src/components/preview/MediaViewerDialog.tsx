import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "../../icons";
import { isAudio, isImage, isMedia, isVideo, toAssetUrl } from "../../lib/media";
import type { FileEntry } from "../../types/fs";
import { AudioPreview } from "./AudioPreview";
import { ImagePreview } from "./ImagePreview";
import { VideoPreview } from "./VideoPreview";

interface MediaViewerDialogProps {
  entry: FileEntry | null;
  entries: FileEntry[];
  onClose: () => void;
  onNavigate: (entry: FileEntry) => void;
}

export function MediaViewerDialog({
  entry,
  entries,
  onClose,
  onNavigate,
}: MediaViewerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = entry !== null && isMedia(entry);

  const mediaEntries = useMemo(() => entries.filter(isMedia), [entries]);

  const currentIndex = useMemo(() => {
    if (!entry) return -1;
    return mediaEntries.findIndex((item) => item.path === entry.path);
  }, [entry, mediaEntries]);

  const canGoPrev = currentIndex > 0;
  const canGoNext =
    currentIndex >= 0 && currentIndex < mediaEntries.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    onNavigate(mediaEntries[currentIndex - 1]);
  };

  const goNext = () => {
    if (!canGoNext) return;
    onNavigate(mediaEntries[currentIndex + 1]);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentIndex > 0) {
          onNavigate(mediaEntries[currentIndex - 1]);
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < mediaEntries.length - 1) {
          onNavigate(mediaEntries[currentIndex + 1]);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, currentIndex, mediaEntries, onNavigate]);

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

        <div className="relative min-h-0 flex-1 overflow-hidden bg-base-200/40">
          {entry && isImage(entry) ? (
            <ImagePreview src={toAssetUrl(entry.path)} alt={entry.name} />
          ) : null}
          {entry && isVideo(entry) ? (
            <VideoPreview src={toAssetUrl(entry.path)} />
          ) : null}
          {entry && isAudio(entry) ? (
            <AudioPreview src={toAssetUrl(entry.path)} />
          ) : null}

          {mediaEntries.length > 1 ? (
            <>
              <button
                type="button"
                className="btn btn-circle btn-ghost absolute top-1/2 left-3 z-10 -translate-y-1/2 bg-base-100/80"
                aria-label="Previous media"
                disabled={!canGoPrev}
                onClick={goPrev}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="btn btn-circle btn-ghost absolute top-1/2 right-3 z-10 -translate-y-1/2 bg-base-100/80"
                aria-label="Next media"
                disabled={!canGoNext}
                onClick={goNext}
              >
                <ChevronRight className="size-5" />
              </button>
            </>
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
