import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { Toolbar } from "./Toolbar";
import type { DriveEntry, FavoriteFolder, ViewMode } from "../../types/fs";

interface AppShellProps {
  homePath: string;
  currentPath: string;
  viewMode: ViewMode;
  favorites: FavoriteFolder[];
  drives: DriveEntry[];
  isFavorite: boolean;
  searchQuery: string;
  onNavigate: (path: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleFavorite: () => void;
  onRemoveFavorite: (path: string) => void;
  onSearchChange: (query: string) => void;
  browser: ReactNode;
  preview: ReactNode;
}

export function AppShell({
  homePath,
  currentPath,
  viewMode,
  favorites,
  drives,
  isFavorite,
  searchQuery,
  onNavigate,
  onViewModeChange,
  onToggleFavorite,
  onRemoveFavorite,
  onSearchChange,
  browser,
  preview,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base-100 text-base-content">
      <TitleBar />
      <Toolbar
        path={currentPath}
        viewMode={viewMode}
        isFavorite={isFavorite}
        searchQuery={searchQuery}
        onNavigate={onNavigate}
        onViewModeChange={onViewModeChange}
        onToggleFavorite={onToggleFavorite}
        onSearchChange={onSearchChange}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          homePath={homePath}
          currentPath={currentPath}
          favorites={favorites}
          drives={drives}
          onNavigate={onNavigate}
          onRemoveFavorite={onRemoveFavorite}
        />
        <main className="min-w-0 flex-1 overflow-auto">{browser}</main>
        <section className="hidden w-80 shrink-0 overflow-hidden border-l border-base-300 bg-base-100 lg:block xl:w-96">
          {preview}
        </section>
      </div>
    </div>
  );
}
