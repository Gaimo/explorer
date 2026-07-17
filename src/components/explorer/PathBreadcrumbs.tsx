interface PathBreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

function splitPath(path: string): { label: string; fullPath: string }[] {
  if (!path) return [];

  const normalized = path.replace(/[\\/]+$/, "");
  const separator = path.includes("\\") ? "\\" : "/";
  const parts = normalized.split(/[\\/]/).filter(Boolean);

  const crumbs: { label: string; fullPath: string }[] = [];
  let cumulative = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === 0 && /^[A-Za-z]:$/.test(part)) {
      cumulative = `${part}${separator}`;
      crumbs.push({ label: part, fullPath: cumulative });
      continue;
    }

    cumulative = cumulative
      ? `${cumulative.replace(/[\\/]+$/, "")}${separator}${part}`
      : `${separator}${part}`;

    crumbs.push({ label: part, fullPath: cumulative });
  }

  return crumbs;
}

export function PathBreadcrumbs({ path, onNavigate }: PathBreadcrumbsProps) {
  const crumbs = splitPath(path);

  if (crumbs.length === 0) {
    return (
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <span className="opacity-60">…</span>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="breadcrumbs max-w-full overflow-x-auto text-sm">
      <ul>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.fullPath}>
              {isLast ? (
                <span className="font-medium">{crumb.label}</span>
              ) : (
                <button
                  type="button"
                  className="link link-hover"
                  onClick={() => onNavigate(crumb.fullPath)}
                >
                  {crumb.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

