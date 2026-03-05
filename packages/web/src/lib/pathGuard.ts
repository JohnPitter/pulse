function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

export function isWithinRoot(path: string, root: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedRoot = normalizePath(root);
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(normalizedRoot + "/");
}

export function clampParentPath(parentPath: string, root: string): string | null {
  return isWithinRoot(parentPath, root) ? parentPath : null;
}
