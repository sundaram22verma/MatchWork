import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyCandidateProfile, saveCandidateProfile } from "@/lib/matchwork.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidate/profile")({
  component: EditCandidate,
});

function EditCandidate() {
  const getFn = useServerFn(getMyCandidateProfile);
  const saveFn = useServerFn(saveCandidateProfile);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isPending } = useQuery({ queryKey: ["candidate-profile"], queryFn: () => getFn() });

  const [f, setF] = useState({
    headline: "",
    bio: "",
    skills_text: "",
    portfolio_links: "",
    availability: "",
    rate_min: "",
    rate_max: "",
  });

  useEffect(() => {
    if (data) {
      setF({
        headline: data.headline ?? "",
        bio: data.bio ?? "",
        skills_text: data.skills_text ?? "",
        portfolio_links: data.portfolio_links ?? "",
        availability: data.availability ?? "",
        rate_min: data.rate_min?.toString() ?? "",
        rate_max: data.rate_max?.toString() ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          headline: f.headline,
          bio: f.bio,
          skills_text: f.skills_text,
          portfolio_links: f.portfolio_links,
          availability: f.availability,
          rate_min: f.rate_min ? Number(f.rate_min) : null,
          rate_max: f.rate_max ? Number(f.rate_max) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved — embedding regenerated.");
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
      qc.invalidateQueries({ queryKey: ["rank-postings"] });
      navigate({ to: "/candidate" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isPending) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">Your writer profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Write freely. We embed your profile so postings match on meaning, not keywords.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <Field label="Headline">
          <input
            value={f.headline}
            onChange={(e) => setF({ ...f, headline: e.target.value })}
            className={input}
            placeholder="Contract technical writer — dev docs"
            required
          />
        </Field>
        <Field label="Bio">
          <textarea
            rows={5}
            value={f.bio}
            onChange={(e) => setF({ ...f, bio: e.target.value })}
            className={input}
            placeholder="Describe the kinds of projects you love. Use full sentences."
          />
        </Field>
        <Field label="Skills and experience (free text)">
          <textarea
            rows={4}
            value={f.skills_text}
            onChange={(e) => setF({ ...f, skills_text: e.target.value })}
            className={input}
            placeholder="e.g. OpenAPI reference docs, developer onboarding guides, security explainers…"
          />
        </Field>
        <Field label="Portfolio links">
          <textarea
            rows={2}
            value={f.portfolio_links}
            onChange={(e) => setF({ ...f, portfolio_links: e.target.value })}
            className={input}
            placeholder="https://…"
          />
        </Field>
        <Field label="Availability">
          <input
            value={f.availability}
            onChange={(e) => setF({ ...f, availability: e.target.value })}
            className={input}
            placeholder="e.g. 20 hrs/week from March"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min rate ($/hr)">
            <input
              type="number"
              value={f.rate_min}
              onChange={(e) => setF({ ...f, rate_min: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Max rate ($/hr)">
            <input
              type="number"
              value={f.rate_max}
              onChange={(e) => setF({ ...f, rate_max: e.target.value })}
              className={input}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={save.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Saving & embedding…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}

const input =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
