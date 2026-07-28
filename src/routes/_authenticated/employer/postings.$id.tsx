import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  getPostingForOwner,
  rankCandidatesForPosting,
  updateApplicationStatus,
} from "@/lib/matchwork.functions";
import { MatchBadge, WhyMatch } from "@/components/MatchBadge";
import { explainOverlap, formatRate, formatBudget } from "@/lib/matchwork-shared";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/postings/$id")({
  component: PostingDetail,
});

function PostingDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const postingFn = useServerFn(getPostingForOwner);
  const rankFn = useServerFn(rankCandidatesForPosting);
  const updateFn = useServerFn(updateApplicationStatus);

  const posting = useQuery({
    queryKey: ["posting", id],
    queryFn: () => postingFn({ data: { id } }),
  });
  const applicants = useQuery({
    queryKey: ["posting-applicants", id],
    queryFn: () => rankFn({ data: { posting_id: id } }),
  });

  const [rateMin, setRateMin] = useState("");
  const [availability, setAvailability] = useState("");

  type CandidateApplicant = {
    application_id: string;
    headline: string;
    bio: string;
    skills_text: string;
    availability: string;
    rate_min: number | null;
    rate_max: number | null;
    status: "applied" | "viewed" | "shortlisted" | "rejected" | "closed";
    similarity: number | null;
    __posting_text?: string;
  };

  const filtered = useMemo(() => {
    const list = (applicants.data as CandidateApplicant[]) ?? [];
    return list.filter((a) => {
      if (rateMin && a.rate_max != null && a.rate_max < Number(rateMin)) return false;
      if (
        availability &&
        !(a.availability ?? "").toLowerCase().includes(availability.toLowerCase())
      )
        return false;
      return true;
    });
  }, [applicants.data, rateMin, availability]);

  const setStatus = useMutation({
    mutationFn: (v: {
      id: string;
      status: "applied" | "viewed" | "shortlisted" | "rejected" | "closed";
    }) => updateFn({ data: v }),
    onSuccess: () => {
      toast.success("Updated.");
      qc.invalidateQueries({ queryKey: ["posting-applicants", id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (posting.isPending) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!posting.data)
    return (
      <div>
        Not found.{" "}
        <Link to="/employer" className="underline">
          Back
        </Link>
      </div>
    );

  return (
    <div>
      <Link to="/employer" className="text-sm text-muted-foreground hover:underline">
        ← Back to postings
      </Link>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {posting.data.companies?.name}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{posting.data.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
          {posting.data.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{formatBudget(posting.data.budget_min, posting.data.budget_max)}</span>
          {posting.data.contract_length && <span>{posting.data.contract_length}</span>}
          <span className="capitalize">Status: {posting.data.status}</span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Ranked applicants</h2>
        <div className="flex gap-2">
          <input
            placeholder="Availability filter"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="Min rate they'll accept"
            type="number"
            value={rateMin}
            onChange={(e) => setRateMin(e.target.value)}
            className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {applicants.isPending && <div className="mt-4 text-sm text-muted-foreground">Ranking…</div>}
      {filtered.length === 0 && !applicants.isPending && (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No applicants yet.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((a) => {
          const candidateText = [a.headline, a.bio, a.skills_text].filter(Boolean).join("\n");
          const overlap = explainOverlap(a.__posting_text ?? "", candidateText);
          return (
            <div
              key={a.application_id}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{a.headline || "Candidate"}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatRate(a.rate_min, a.rate_max)}
                    {a.availability && <> · {a.availability}</>}
                  </div>
                </div>
                <MatchBadge similarity={a.similarity} />
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{a.bio}</p>
              {a.skills_text && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Skills:</span> {a.skills_text}
                </p>
              )}
              <div className="mt-3">
                <WhyMatch terms={overlap} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {a.status}
                </span>
                <div className="flex gap-2">
                  {(["viewed", "shortlisted", "rejected"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus.mutate({ id: a.application_id, status: s })}
                      className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium capitalize hover:bg-muted"
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
