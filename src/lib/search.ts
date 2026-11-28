/**
 * An `ilike` pattern that matches `q` anywhere, with LIKE wildcards in the
 * user's text escaped. Use it only as a plain `.ilike(column, pattern)`
 * filter, never inside `.or()` or `.filter()` strings.
 */
export function containsPattern(q: string): string {
  const escaped = q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}
