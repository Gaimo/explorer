import { LayoutGrid, List, Search, Star, X } from "../../icons";
import { PathBreadcrumbs } from "../explorer/PathBreadcrumbs";
import type { ViewMode } from "../../types/fs";

interface ToolbarProps {
  path: string;
  viewMode: ViewMode;
  isFavorite: boolean;
  searchQuery: string;
  onNavigate: (path: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleFavorite: () => void;
  onSearchChange: (query: string) => void;
}

function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (query: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`input input-sm ${className}`.trim()}>
      <Search className="size-4 shrink-0 opacity-50" />
      <input
        type="text"
        className="grow outline-none!"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search by name or tag"
        autoComplete="off"
        spellCheck={false}
      />
      {value ? (
        <button
          type="button"
          className="inline-flex size-4 shrink-0 items-center justify-center opacity-60"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </label>
  );
}

export function Toolbar({
  path,
  viewMode,
  isFavorite,
  searchQuery,
  onNavigate,
  onViewModeChange,
  onToggleFavorite,
  onSearchChange,
}: ToolbarProps) {
  return (
    <div className="navbar min-h-12 gap-3 border-b border-base-300 bg-base-200 px-3">
      <div className="navbar-start min-w-0 flex-1">
        <PathBreadcrumbs path={path} onNavigate={onNavigate} />
      </div>
      <div className="navbar-center hidden min-w-0 max-w-md flex-1 sm:flex">
        <SearchField
          className="w-full"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by name or tag…"
        />
      </div>
      <div className="navbar-end shrink-0 gap-2">
        <SearchField
          className="w-40 sm:hidden"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Name or tag…"
        />
        <button
          type="button"
          className={`btn btn-sm btn-square ${isFavorite ? "btn-active" : "btn-ghost"}`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          disabled={!path}
          onClick={onToggleFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
        <div className="join">
          <button
            type="button"
            className={`btn btn-sm join-item ${viewMode === "grid" ? "btn-active" : "btn-ghost"}`}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            className={`btn btn-sm join-item ${viewMode === "list" ? "btn-active" : "btn-ghost"}`}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
