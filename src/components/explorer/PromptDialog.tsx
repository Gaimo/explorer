import { useEffect, useRef, useState } from "react";

interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  initialValue: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  label,
  initialValue,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      setValue(initialValue);
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [initialValue, open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onCancel}
      onCancel={onCancel}
    >
      <div className="modal-box">
        <h3 className="text-lg font-medium">{title}</h3>
        <fieldset className="fieldset mt-4">
          <legend className="fieldset-legend">{label}</legend>
          <input
            ref={inputRef}
            className="input w-full"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const trimmed = value.trim();
                if (trimmed) onConfirm(trimmed);
              }
            }}
          />
        </fieldset>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            disabled={!value.trim()}
            onClick={() => {
              const trimmed = value.trim();
              if (trimmed) onConfirm(trimmed);
            }}
          >
            {confirmLabel}
          </button>
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
