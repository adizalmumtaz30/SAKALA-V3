export interface SmartOption {
  id: string;
  name: string;
}

type Rank = 0 | 1 | 2 | 3;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/**
 * Ranking order (Bagian 78, LOCKED): exact, prefix, multi-token, partial.
 * Lower rank = better match. Options with no rank are excluded.
 */
function rankOption(query: string, name: string): Rank | null {
  const q = normalize(query);
  const n = normalize(name);
  if (q === n) return 0;
  if (n.startsWith(q)) return 1;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => n.includes(t))) return 2;

  if (n.includes(q)) return 3;
  return null;
}

export function rankOptions(options: SmartOption[], query: string): SmartOption[] {
  if (!query.trim()) return options;

  return options
    .map((o) => ({ option: o, rank: rankOption(query, o.name) }))
    .filter((x): x is { option: SmartOption; rank: Rank } => x.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.option.name.localeCompare(b.option.name))
    .map((x) => x.option);
}

/** Small Levenshtein distance — only used for the "maksud Anda?" fallback. */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Bagian 80: if nothing matches, suggest the closest name within a small edit distance. */
export function suggestClosest(options: SmartOption[], query: string): SmartOption | null {
  const q = normalize(query);
  if (!q) return null;

  let best: { option: SmartOption; distance: number } | null = null;
  for (const option of options) {
    const distance = levenshtein(q, normalize(option.name));
    if (distance <= 2 && (!best || distance < best.distance)) {
      best = { option, distance };
    }
  }
  return best?.option ?? null;
}
