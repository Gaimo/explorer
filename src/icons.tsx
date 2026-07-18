import type { LucideIcon, LucideProps } from "lucide-react";
import {
  ClipboardPaste as LucideClipboardPaste,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Copy as LucideCopy,
  ExternalLink as LucideExternalLink,
  File as LucideFile,
  Folder as LucideFolder,
  FolderOpen as LucideFolderOpen,
  FolderPlus as LucideFolderPlus,
  HardDrive as LucideHardDrive,
  Home as LucideHome,
  LayoutGrid as LucideLayoutGrid,
  List as LucideList,
  Minus as LucideMinus,
  Music as LucideMusic,
  Pencil as LucidePencil,
  RefreshCw as LucideRefreshCw,
  Scissors as LucideScissors,
  Search as LucideSearch,
  Square as LucideSquare,
  Star as LucideStar,
  Tag as LucideTag,
  Trash2 as LucideTrash2,
  X as LucideX,
} from "lucide-react";

/** Stable icon component type — swap LucideIcon if you change libraries. */
export type Icon = LucideIcon;

/** Shared props for all icons (library + custom). */
export type IconProps = LucideProps;

export const ClipboardPaste = LucideClipboardPaste;
export const ChevronLeft = LucideChevronLeft;
export const ChevronRight = LucideChevronRight;
export const Copy = LucideCopy;
export const ExternalLink = LucideExternalLink;
export const File = LucideFile;
export const Folder = LucideFolder;
export const FolderOpen = LucideFolderOpen;
export const FolderPlus = LucideFolderPlus;
export const HardDrive = LucideHardDrive;
export const Home = LucideHome;
export const LayoutGrid = LucideLayoutGrid;
export const List = LucideList;
export const Minus = LucideMinus;
export const Music = LucideMusic;
export const Pencil = LucidePencil;
export const RefreshCw = LucideRefreshCw;
export const Scissors = LucideScissors;
export const Search = LucideSearch;
export const Square = LucideSquare;
export const Star = LucideStar;
export const Tag = LucideTag;
export const Trash2 = LucideTrash2;
export const X = LucideX;

export function Placeholder({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
