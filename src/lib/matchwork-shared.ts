// Shared pure helpers usable on client and server.
export function formatRate(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return "Rate not set";
  if (min != null && max != null) return `$${min}–$${max}/hr`;
  if (min != null) return `From $${min}/hr`;
  return `Up to $${max}/hr`;
}

export function formatBudget(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return "Budget open";
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}`;
  if (min != null) return `From $${min.toLocaleString()}`;
  return `Up to $${max?.toLocaleString()}`;
}

export function scoreToPercent(s?: number | null): number | null {
  if (s == null || Number.isNaN(s)) return null;
  // cosine similarity in [-1, 1] typically clusters 0.3–0.9 for related texts.
  // Rescale so ~0.35 -> 0% and ~0.85 -> 100% for a more intuitive score.
  const clamped = Math.max(0, Math.min(1, (s - 0.35) / 0.5));
  return Math.round(clamped * 100);
}

export function matchLabel(pct: number | null): string {
  if (pct == null) return "No score yet";
  if (pct >= 70) return "Strong match";
  if (pct >= 40) return "Possible match";
  return "Weak match";
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "of",
  "in",
  "on",
  "for",
  "to",
  "with",
  "at",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "as",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "into",
  "about",
  "over",
  "we",
  "you",
  "your",
  "our",
  "their",
  "they",
  "he",
  "she",
  "his",
  "her",
  "them",
  "us",
  "i",
  "me",
  "my",
  "mine",
  "who",
  "whom",
  "which",
  "what",
  "when",
  "where",
  "how",
  "will",
  "would",
  "should",
  "could",
  "can",
  "may",
  "might",
  "do",
  "does",
  "did",
  "not",
  "no",
  "if",
  "than",
  "then",
  "so",
  "up",
  "down",
  "out",
  "also",
  "more",
  "most",
  "some",
  "any",
  "all",
  "one",
  "two",
  "three",
  "have",
  "has",
  "had",
  "having",
  "get",
  "got",
  "use",
  "using",
  "used",
  "across",
  "per",
  "via",
  "through",
  "between",
  "without",
  "within",
  "around",
  "during",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+.#-]{2,}/g) ?? []).filter((t) => !STOP.has(t));
}

function bigrams(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    if (STOP.has(tokens[i]) || STOP.has(tokens[i + 1])) continue;
    out.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return out;
}

/**
 * Cheap "why this matched" explanation: overlapping unigrams+bigrams, ranked by
 * combined frequency. This is intentionally simple — a v2 could swap in an LLM.
 */
export function explainOverlap(a: string, b: string, limit = 5): string[] {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  const aSet = new Set([...aTokens, ...bigrams(aTokens)]);
  const bSet = new Set([...bTokens, ...bigrams(bTokens)]);
  const overlap = [...aSet].filter((t) => bSet.has(t));
  // prefer bigrams first (more specific), then unigrams; cap length
  overlap.sort((x, y) => {
    const bx = x.includes(" ") ? 0 : 1;
    const by = y.includes(" ") ? 0 : 1;
    if (bx !== by) return bx - by;
    return y.length - x.length;
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of overlap) {
    if (seen.has(term)) continue;
    // dedupe unigrams already covered by a bigram
    if (!term.includes(" ") && out.some((o) => o.includes(" " + term) || o.startsWith(term + " ")))
      continue;
    seen.add(term);
    out.push(term);
    if (out.length >= limit) break;
  }
  return out;
}
