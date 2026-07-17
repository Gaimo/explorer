import type { MouseEventHandler } from "react";
import { X } from "../../icons";

interface FileTagProps {
  label: string;
  ghost?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onRemove?: () => void;
}

/** Custom tag chip — taller than daisyUI badge, with aligned label + remove icon. */
export function FileTag({ label, ghost = false, onClick, onRemove }: FileTagProps) {
  const surface = ghost
    ? "border-transparent bg-base-200/70 text-base-content/70"
    : "border-base-300 bg-base-200 text-base-content";

  const bodyClass = `inline-flex h-7 max-w-full items-center gap-1.5 rounded-field border px-2.5 text-xs leading-none ${surface}`;

  if (onRemove) {
    return (
      <span className={bodyClass}>
        <span className="min-w-0 truncate leading-none">{label}</span>
        <button
          type="button"
          className="inline-flex size-3.5 shrink-0 items-center justify-center leading-none opacity-60"
          aria-label={`Remove tag ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <X className="size-3" strokeWidth={2.25} />
        </button>
      </span>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={bodyClass} onClick={onClick}>
        <span className="min-w-0 truncate leading-none">{label}</span>
      </button>
    );
  }

  return (
    <span className={bodyClass}>
      <span className="min-w-0 truncate leading-none">{label}</span>
    </span>
  );
}
