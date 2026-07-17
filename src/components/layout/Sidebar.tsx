import type { ReactNode } from "react";
import { HardDrive, Home, X } from "../../icons";
import type { DriveEntry, FavoriteFolder } from "../../types/fs";

interface SidebarProps {
  homePath: string;
  currentPath: string;
  favorites: FavoriteFolder[];
  drives: DriveEntry[];
  onNavigate: (path: string) => void;
  onRemoveFavorite: (path: string) => void;
}

const itemClass =
  "btn btn-ghost btn-sm h-8 min-h-8 w-full justify-start px-2 font-normal";

function pathsMatch(a: string, b: string): boolean {
  return (
    a.replace(/[\\/]+$/, "").toLowerCase() ===
    b.replace(/[\\/]+$/, "").toLowerCase()
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 pb-1 text-xs font-medium tracking-wide uppercase opacity-50">
      {children}
    </p>
  );
}

export function Sidebar({
  homePath,
  currentPath,
  favorites,
  drives,
  onNavigate,
  onRemoveFavorite,
}: SidebarProps) {
  const atHome = homePath !== "" && pathsMatch(currentPath, homePath);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-base-300 bg-base-200">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
        <section>
          <SectionLabel>Places</SectionLabel>
          <ul className="flex w-full flex-col gap-1">
            <li>
              <button
                type="button"
                className={`${itemClass} ${atHome ? "btn-active" : ""}`}
                onClick={() => {
                  if (homePath) onNavigate(homePath);
                }}
                disabled={!homePath}
              >
                <Home className="size-4 shrink-0" />
                Home
              </button>
            </li>
          </ul>
        </section>

        <section>
          <SectionLabel>Favorites</SectionLabel>
          {favorites.length === 0 ? (
            <p className="px-2 text-sm opacity-50">No favorites yet</p>
          ) : (
            <ul className="flex w-full flex-col gap-1">
              {favorites.map((fav) => {
                const active = pathsMatch(currentPath, fav.path);
                return (
                  <li key={fav.path}>
                    <div
                      className={`group ${itemClass} ${active ? "btn-active" : ""}`}
                    >
                      <button
                        type="button"
                        className="flex h-full min-w-0 flex-1 items-center text-left"
                        onClick={() => onNavigate(fav.path)}
                        title={fav.path}
                      >
                        <span className="truncate">{fav.name}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square h-6 min-h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${fav.name} from favorites`}
                        onClick={() => onRemoveFavorite(fav.path)}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="divider my-0" />

        <section>
          <SectionLabel>Drives</SectionLabel>
          {drives.length === 0 ? (
            <p className="px-2 text-sm opacity-50">No drives found</p>
          ) : (
            <ul className="flex w-full flex-col gap-1">
              {drives.map((drive) => {
                const active = pathsMatch(currentPath, drive.path);
                return (
                  <li key={drive.path}>
                    <button
                      type="button"
                      className={`${itemClass} ${active ? "btn-active" : ""}`}
                      onClick={() => onNavigate(drive.path)}
                      title={drive.path}
                    >
                      <HardDrive className="size-4 shrink-0" />
                      {drive.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}
