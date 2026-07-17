import { useEffect, useState, type MouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, X } from "../../icons";

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    const syncMaximized = async () => {
      try {
        setMaximized(await appWindow.isMaximized());
      } catch {
        // ignore — window API unavailable outside Tauri
      }
    };

    void syncMaximized();
    void appWindow
      .onResized(() => {
        void syncMaximized();
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, []);

  const onTitleMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (event.buttons !== 1) return;
    // Skip when the press started on a window control.
    if ((event.target as HTMLElement | null)?.closest("button")) return;

    const appWindow = getCurrentWindow();
    if (event.detail === 2) {
      void appWindow.toggleMaximize().then(async () => {
        setMaximized(await appWindow.isMaximized());
      });
      return;
    }

    void appWindow.startDragging();
  };

  const minimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch {
      // ignore
    }
  };

  const toggleMaximize = async () => {
    try {
      await getCurrentWindow().toggleMaximize();
      setMaximized(await getCurrentWindow().isMaximized());
    } catch {
      // ignore
    }
  };

  const close = async () => {
    try {
      await getCurrentWindow().close();
    } catch {
      // ignore
    }
  };

  return (
    <header
      className="navbar relative min-h-0 h-10 shrink-0 border-b border-base-300 bg-base-200 px-2"
      onMouseDown={onTitleMouseDown}
    >
      <div className="navbar-start h-full min-h-0 flex-1 select-none">
        <span className="px-2 text-sm font-medium">New Explorer</span>
      </div>

      <div className="navbar-end h-full min-h-0 shrink-0 gap-0.5">
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm"
          aria-label="Minimize"
          onClick={() => void minimize()}
        >
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm"
          aria-label={maximized ? "Restore" : "Maximize"}
          onClick={() => void toggleMaximize()}
        >
          {maximized ? (
            <Copy className="size-3.5" />
          ) : (
            <Square className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm hover:bg-error hover:text-error-content"
          aria-label="Close"
          onClick={() => void close()}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
