/**
 * Deliberately minimal — no quoted-field/embedded-comma support. Good enough
 * for a single "nama" column export from Excel/Sheets. If the header row
 * has a column literally named "nama" (case-insensitive), that column is
 * used; otherwise the first column is used.
 */
export function parseNamesFromCsv(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIndex = header.indexOf("nama");
  const hasHeader = nameIndex !== -1 || header.length === 1;
  const columnIndex = nameIndex !== -1 ? nameIndex : 0;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const names = dataLines
    .map((line) => line.split(",")[columnIndex]?.trim())
    .filter((n): n is string => Boolean(n));

  // De-dupe while preserving order.
  return Array.from(new Set(names));
}
