import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MatchWork — Semantic matching for contract technical writers" },
      {
        name: "description",
        content:
          "MatchWork ranks writers and gigs by meaning, not keywords. A focused, semantic job board for contract technical writers.",
      },
      {
        property: "og:title",
        content: "MatchWork — Semantic matching for contract technical writers",
      },
      {
        property: "og:description",
        content:
          "Ranked matches on meaning, not keywords. Built for contract technical writers and the teams that hire them.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" />
          MatchWork
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" as const }}
                className="rounded-md px-4 py-2 font-medium hover:bg-muted"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" as const }}
                className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-16 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Focused: contract technical writers
            </span>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-6xl">
              Match on meaning, not keywords.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              A candidate who "led a small team through a product launch" should surface for a role
              asking for "management experience." Traditional job boards miss that. MatchWork
              doesn't — it ranks writers and gigs using semantic search.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" as const, role: "candidate" as const }}
                className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                I'm a writer
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" as const, role: "employer" as const }}
                className="rounded-md border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted"
              >
                I'm hiring
              </Link>
            </div>
          </div>
          <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ranked matches
            </div>
            <MatchPreview
              title="Developer docs lead"
              score={92}
              tags={["api documentation", "developer tools", "openapi"]}
            />
            <MatchPreview
              title="Technical writer, security product"
              score={71}
              tags={["compliance", "security", "explainers"]}
            />
            <MatchPreview
              title="Junior copywriter, marketing"
              score={22}
              tags={["marketing", "brand voice"]}
            />
          </div>
        </section>

        <section className="grid gap-6 border-t border-border py-16 md:grid-cols-3">
          <Feature
            title="Write like a human"
            body="Free-text profiles and postings. No brittle tag taxonomies to game."
          />
          <Feature
            title="Ranked by fit"
            body="Cosine similarity over embeddings — the same technique modern search uses."
          />
          <Feature
            title="Explainable"
            body="Every score comes with the overlapping themes that produced it."
          />
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground">
        MatchWork — a semantic job matching demo, scoped to one niche.
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function MatchPreview({ title, score, tags }: { title: string; score: number; tags: string[] }) {
  const color = score >= 70 ? "match-strong" : score >= 40 ? "match-mid" : "match-weak";
  return (
    <div className="mb-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <div
          className="rounded-full px-2 py-0.5 text-xs font-semibold text-primary-foreground"
          style={{ backgroundColor: `var(--${color})` }}
        >
          {score}%
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
