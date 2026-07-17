import { useState } from "react";
import { File, Folder } from "../../icons";
import { isImage, isVideo, toAssetUrl } from "../../lib/media";
import type { FileEntry } from "../../types/fs";

interface FileThumbnailProps {
  entry: FileEntry;
  className?: string;
  iconClassName?: string;
}

export function FileThumbnail({
  entry,
  className = "size-10",
  iconClassName = "size-5",
}: FileThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (entry.isDir) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-field bg-base-300 ${className}`}
      >
        <Folder className={iconClassName} />
      </span>
    );
  }

  const showMedia = !failed && (isImage(entry) || isVideo(entry));

  if (!showMedia) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-field bg-base-200 ${className}`}
      >
        <File className={iconClassName} />
      </span>
    );
  }

  const src = toAssetUrl(entry.path);

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-field bg-base-300 ${className}`}
    >
      {isImage(entry) ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <video
          src={src}
          muted
          preload="metadata"
          playsInline
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
