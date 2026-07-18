interface AudioPreviewProps {
  src: string;
}

export function AudioPreview({ src }: AudioPreviewProps) {
  return (
    <div className="flex h-full items-center justify-center bg-base-200/40 p-8">
      <audio key={src} src={src} controls className="w-full max-w-xl" />
    </div>
  );
}
