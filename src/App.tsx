import { useMemo, useState } from "react";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { AppShell } from "./components/layout/AppShell";
import { ConfirmDialog } from "./components/explorer/ConfirmDialog";
import {
  FileContextMenu,
  type ContextAction,
} from "./components/explorer/FileContextMenu";
import { FileGrid } from "./components/explorer/FileGrid";
import { FileListView } from "./components/explorer/FileList";
import { MediaViewerDialog } from "./components/preview/MediaViewerDialog";
import { PreviewPanel } from "./components/preview/PreviewPanel";
import { PromptDialog } from "./components/explorer/PromptDialog";
import { isImage, isVideo } from "./lib/media";
import { useContextMenu } from "./hooks/useContextMenu";
import { useDirectory } from "./hooks/useDirectory";
import { useDrives } from "./hooks/useDrives";
import { useExplorerShortcuts } from "./hooks/useExplorerShortcuts";
import { useFavorites } from "./hooks/useFavorites";
import { useFileClipboard } from "./hooks/useFileClipboard";
import { useFileMetadata } from "./hooks/useFileMetadata";
import { useMetadataSummaries } from "./hooks/useMetadataSummaries";
import { useSelection } from "./hooks/useSelection";
import { useGlobalSearch } from "./hooks/useGlobalSearch";
import { useViewMode } from "./hooks/useViewMode";

import { errorMessage } from "./lib/errors";
import { addFileTag } from "./lib/tauri/metadata";
import {
  copyPath,
  createDirectory,
  deletePath,
  movePath,
  renamePath,
} from "./lib/tauri/fs";
import type { FileEntry } from "./types/fs";

function App() {
  const {
    path,
    entries,
    loading,
    error,
    homePath,
    navigateTo,
    refresh,
  } = useDirectory();
  const { selected, select, clear } = useSelection();
  const { viewMode, setViewMode } = useViewMode();
  const { drives } = useDrives();
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  } = useFavorites();
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading,
    isSearching,
    refreshTags,
  } = useGlobalSearch();
  const {
    clipboard,
    hasClipboard,
    copyEntries,
    cutEntries,
    clearClipboard,
  } = useFileClipboard();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const {
    metadata,
    noteDraft,
    loading: metadataLoading,
    updateNoteDraft,
    addTag,
    removeTag,
  } = useFileMetadata(selected?.path ?? null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [tagTarget, setTagTarget] = useState<FileEntry | null>(null);
  const [mediaViewer, setMediaViewer] = useState<FileEntry | null>(null);

  const visibleEntries = useMemo(
    () => (isSearching ? searchResults : entries),
    [entries, isSearching, searchResults],
  );
  const summaries = useMetadataSummaries(visibleEntries);

  const handleNavigate = (nextPath: string) => {
    clear();
    setMediaViewer(null);
    setSearchQuery("");
    navigateTo(nextPath);
  };

  const handleOpen = (entry: FileEntry) => {
    if (!entry.isDir) return;
    clear();
    setMediaViewer(null);
    setSearchQuery("");
    navigateTo(entry.path);
  };

  const handleSelect = (entry: FileEntry) => {
    select(entry);
    if (!entry.isDir && (isImage(entry) || isVideo(entry))) {
      setMediaViewer(entry);
    } else {
      setMediaViewer(null);
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    try {
      setActionError(null);
      await action();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const pasteClipboard = async () => {
    if (!clipboard || !path) return;

    for (const entry of clipboard.entries) {
      if (clipboard.mode === "copy") {
        await copyPath(entry.path, path);
      } else {
        await movePath(entry.path, path);
      }
    }

    if (clipboard.mode === "cut") {
      clearClipboard();
    }
    refresh();
  };

  const dialogOpen =
    deleteTarget !== null ||
    renameTarget !== null ||
    newFolderOpen ||
    tagTarget !== null ||
    mediaViewer !== null;

  useExplorerShortcuts({
    enabled: !dialogOpen,
    handlers: {
      onDelete: () => {
        if (selected) setDeleteTarget(selected);
      },
      onCopy: () => {
        if (selected) copyEntries([selected]);
      },
      onCut: () => {
        if (selected) cutEntries([selected]);
      },
      onPaste: () => {
        void runAction(pasteClipboard);
      },
    },
  });

  const handleContextAction = (action: ContextAction) => {
    const target = menu?.target;
    closeMenu();

    void runAction(async () => {
      switch (action) {
        case "open": {
          if (target?.kind !== "entry") return;
          if (target.entry.isDir) {
            handleOpen(target.entry);
          } else {
            await openPath(target.entry.path);
          }
          break;
        }
        case "reveal": {
          if (target?.kind !== "entry") return;
          await revealItemInDir(target.entry.path);
          break;
        }
        case "copy": {
          if (target?.kind !== "entry") return;
          copyEntries([target.entry]);
          break;
        }
        case "cut": {
          if (target?.kind !== "entry") return;
          cutEntries([target.entry]);
          break;
        }
        case "paste": {
          await pasteClipboard();
          break;
        }
        case "rename": {
          if (target?.kind !== "entry") return;
          setRenameTarget(target.entry);
          break;
        }
        case "delete": {
          if (target?.kind !== "entry") return;
          setDeleteTarget(target.entry);
          break;
        }
        case "favorite": {
          if (target?.kind !== "entry" || !target.entry.isDir) return;
          await toggleFavorite(target.entry.path);
          break;
        }
        case "addTag": {
          if (target?.kind !== "entry") return;
          setTagTarget(target.entry);
          break;
        }
        case "copyPath": {
          if (target?.kind !== "entry") return;
          await navigator.clipboard.writeText(target.entry.path);
          break;
        }
        case "newFolder": {
          setNewFolderOpen(true);
          break;
        }
        case "refresh": {
          refresh();
          break;
        }
      }
    });
  };

  const browserProps = {
    entries: visibleEntries,
    selectedPath: selected?.path ?? null,
    summaries,
    onOpen: handleOpen,
    onSelect: handleSelect,
    onEntryContextMenu: (
      event: { clientX: number; clientY: number; preventDefault: () => void },
      entry: FileEntry,
    ) => {
      select(entry);
      openMenu(event, { kind: "entry", entry });
    },
    onBackgroundContextMenu: (event: {
      clientX: number;
      clientY: number;
      preventDefault: () => void;
    }) => {
      openMenu(event, { kind: "background" });
    },
  };

  let browserContent;
  if ((loading && entries.length === 0 && !isSearching) || (isSearching && searchLoading)) {
    browserContent = (
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner" />
      </div>
    );
  } else if (error && !isSearching) {
    browserContent = (
      <div className="flex h-full items-center justify-center p-6">
        <div role="alert" className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    );
  } else if (isSearching && visibleEntries.length === 0) {
    browserContent = (
      <div className="flex h-full items-center justify-center text-sm opacity-60">
        No files found for “{searchQuery.trim()}”
      </div>
    );
  } else if (viewMode === "grid") {
    browserContent = <FileGrid {...browserProps} />;
  } else {
    browserContent = <FileListView {...browserProps} />;
  }

  const favoriteForMenu =
    menu?.target.kind === "entry" ? isFavorite(menu.target.entry.path) : false;

  return (
    <>
      <AppShell
        homePath={homePath}
        currentPath={path}
        viewMode={viewMode}
        favorites={favorites}
        drives={drives}
        isFavorite={path ? isFavorite(path) : false}
        searchQuery={searchQuery}
        onNavigate={handleNavigate}
        onViewModeChange={setViewMode}
        onToggleFavorite={() => {
          if (path) void toggleFavorite(path);
        }}
        onRemoveFavorite={(favPath) => {
          void removeFavorite(favPath);
        }}
        onSearchChange={setSearchQuery}
        browser={browserContent}
        preview={
          <PreviewPanel
            entry={selected}
            note={noteDraft}
            tags={metadata?.tags ?? []}
            metadataLoading={metadataLoading}
            onNoteChange={updateNoteDraft}
            onAddTag={async (tag) => {
              await addTag(tag);
              await refreshTags();
            }}
            onRemoveTag={async (tag) => {
              await removeTag(tag);
              await refreshTags();
            }}
            onOpenMedia={setMediaViewer}
          />
        }
      />

      <MediaViewerDialog
        entry={mediaViewer}
        onClose={() => setMediaViewer(null)}
      />

      {menu ? (
        <FileContextMenu
          menu={menu}
          canPaste={hasClipboard}
          isFavorite={favoriteForMenu}
          onAction={handleContextAction}
        />
      ) : null}

      <PromptDialog
        open={renameTarget !== null}
        title="Rename"
        label="New name"
        initialValue={renameTarget?.name ?? ""}
        confirmLabel="Rename"
        onCancel={() => setRenameTarget(null)}
        onConfirm={(newName) => {
          const target = renameTarget;
          setRenameTarget(null);
          if (!target) return;
          void runAction(async () => {
            const nextPath = await renamePath(target.path, newName);
            refresh();
            select({ ...target, name: newName, path: nextPath });
          });
        }}
      />

      <PromptDialog
        open={newFolderOpen}
        title="New folder"
        label="Folder name"
        initialValue="New folder"
        confirmLabel="Create"
        onCancel={() => setNewFolderOpen(false)}
        onConfirm={(name) => {
          setNewFolderOpen(false);
          if (!path) return;
          void runAction(async () => {
            await createDirectory(path, name);
            refresh();
          });
        }}
      />

      <PromptDialog
        open={tagTarget !== null}
        title="Add tag"
        label="Tag name"
        initialValue=""
        confirmLabel="Add"
        onCancel={() => setTagTarget(null)}
        onConfirm={(tag) => {
          const target = tagTarget;
          setTagTarget(null);
          if (!target) return;
          void runAction(async () => {
            if (selected?.path === target.path) {
              await addTag(tag);
            } else {
              await addFileTag(target.path, tag);
            }
            await refreshTags();
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete"
        message={
          deleteTarget
            ? `Permanently delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (!target) return;
          void runAction(async () => {
            await deletePath(target.path);
            if (selected?.path === target.path) clear();
            refresh();
            await refreshTags();
          });
        }}
      />

      {actionError ? (
        <div className="toast toast-end z-50">
          <div role="alert" className="alert alert-error">
            <span>{actionError}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setActionError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default App;
