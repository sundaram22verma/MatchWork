import { matchLabel, scoreToPercent } from "@/lib/matchwork-shared";

export function MatchBadge({ similarity }: { similarity: number | null | undefined }) {
  const pct = scoreToPercent(similarity ?? null);
  const label = matchLabel(pct);
  const color =
    pct == null
      ? "match-weak"
      : pct >= 70
        ? "match-strong"
        : pct >= 40
          ? "match-mid"
          : "match-weak";
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground"
      style={{ backgroundColor: `var(--${color})` }}
      title={label}
    >
      <span>{pct == null ? "—" : `${pct}%`}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

export function WhyMatch({ terms }: { terms: string[] }) {
  if (!terms.length)
    return (
      <div className="text-xs text-muted-foreground italic">No overlapping themes detected.</div>
    );
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="text-xs text-muted-foreground">Why:</span>
      {terms.map((t) => (
        <span
          key={t}
          className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
