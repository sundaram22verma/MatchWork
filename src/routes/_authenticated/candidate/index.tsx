import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getMyCandidateProfile,
  rankPostingsForMe,
  applyToPosting,
  listMyApplications,
} from "@/lib/matchwork.functions";
import { MatchBadge, WhyMatch } from "@/components/MatchBadge";
import { formatBudget, explainOverlap } from "@/lib/matchwork-shared";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidate/")({
  component: CandidateHome,
});

function CandidateHome() {
  const qc = useQueryClient();
  const profileFn = useServerFn(getMyCandidateProfile);
  const rankFn = useServerFn(rankPostingsForMe);
  const applyFn = useServerFn(applyToPosting);
  const appsFn = useServerFn(listMyApplications);

  const [budgetMin, setBudgetMin] = useState<string>("");
  const [contract, setContract] = useState("");

  const profile = useQuery({ queryKey: ["candidate-profile"], queryFn: () => profileFn() });
  const apps = useQuery({ queryKey: ["my-apps"], queryFn: () => appsFn() });
  const matches = useQuery({
    queryKey: ["rank-postings", budgetMin, contract],
    queryFn: () =>
      rankFn({
        data: {
          budget_min: budgetMin ? Number(budgetMin) : null,
          budget_max: null,
          contract_length: contract || undefined,
        },
      }),
    enabled: !!profile.data,
  });

  const apply = useMutation({
    mutationFn: (posting_id: string) => applyFn({ data: { posting_id } }),
    onSuccess: () => {
      toast.success("Applied!");
      qc.invalidateQueries({ queryKey: ["my-apps"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  type ApplicationRow = {
    id: string;
    posting_id: string;
    status: string;
    match_score: number | null;
    job_postings?: {
      title?: string;
      companies?: {
        name?: string;
      };
    };
  };

  type PostingMatchRow = {
    id: string;
    company_name: string;
    title: string;
    description: string;
    required_skills_text: string;
    budget_min: number | null;
    budget_max: number | null;
    contract_length: string;
    similarity: number | null;
    __my_text?: string;
  };

  const appliedIds = new Set(((apps.data as ApplicationRow[]) ?? []).map((a) => a.posting_id));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Your matches</h1>
          <Link
            to="/candidate/profile"
            className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            Edit profile
          </Link>
        </div>

        {!profile.data && !profile.isPending && (
          <EmptyState
            title="Complete your profile first"
            body="MatchWork ranks postings against your profile embedding — no profile, no matches."
            cta={
              <Link
                to="/candidate/profile"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Build profile
              </Link>
            }
          />
        )}

        {profile.data && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Min budget
                </label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="any"
                  className="mt-1 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contract length
                </label>
                <input
                  value={contract}
                  onChange={(e) => setContract(e.target.value)}
                  placeholder="e.g. 3 months"
                  className="mt-1 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                Filters run first; semantic ranking narrows within them.
              </div>
            </div>

            {matches.isPending && <div className="text-sm text-muted-foreground">Ranking…</div>}
            {matches.data?.length === 0 && (
              <EmptyState
                title="No open postings match your filters yet"
                body="Try loosening the filters."
              />
            )}

            <div className="space-y-3">
              {((matches.data as PostingMatchRow[]) ?? []).map((p) => {
                const overlap = explainOverlap(
                  p.__my_text ?? "",
                  [p.title, p.description, p.required_skills_text].join("\n"),
                );
                const applied = appliedIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {p.company_name}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
                      </div>
                      <MatchBadge similarity={p.similarity} />
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{formatBudget(p.budget_min, p.budget_max)}</span>
                      {p.contract_length && <span>{p.contract_length}</span>}
                    </div>
                    <div className="mt-3">
                      <WhyMatch terms={overlap} />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        disabled={applied || apply.isPending}
                        onClick={() => apply.mutate(p.id)}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {applied ? "Applied" : "Apply"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <aside>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          My applications
        </h2>
        <div className="space-y-2">
          {(apps.data ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No applications yet.
            </div>
          )}
          {((apps.data as ApplicationRow[]) ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">{a.job_postings?.companies?.name}</div>
              <div className="font-medium">{a.job_postings?.title}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <StatusPill status={a.status} />
                {a.match_score != null && <MatchBadge similarity={a.match_score} />}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    applied: "bg-muted text-muted-foreground",
    viewed: "bg-secondary text-secondary-foreground",
    shortlisted: "bg-primary text-primary-foreground",
    rejected: "bg-destructive text-destructive-foreground",
    closed: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${colors[status] ?? "bg-muted"}`}
    >
      {status}
    </span>
  );
}
