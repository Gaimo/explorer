export function normalizePathKey(path: string): string {
  return path.replace(/[\\/]+$/, "").toLowerCase();
}

export function folderNameFromPath(path: string): string {
  const normalized = path.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return path;
  if (/^[A-Za-z]:$/.test(last)) return `${last}\\`;
  return last;
}
