interface VideoPreviewProps {
  src: string;
}

export function VideoPreview({ src }: VideoPreviewProps) {
  return (
    <div className="flex h-full items-center justify-center bg-base-200/40">
      <video
        key={src}
        src={src}
        controls
        className="max-h-full max-w-full"
      />
    </div>
  );
}
