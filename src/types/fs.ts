export type ViewMode = "grid" | "list";

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number | null;
  modified: number | null;
  extension: string | null;
}

export interface DriveEntry {
  name: string;
  path: string;
}

export interface FavoriteFolder {
  name: string;
  path: string;
}

export interface AppError {
  message: string;
}
