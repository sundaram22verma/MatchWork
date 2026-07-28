import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { saveJobPosting } from "@/lib/matchwork.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/postings/new")({
  component: NewPosting,
});

function NewPosting() {
  const saveFn = useServerFn(saveJobPosting);
  const navigate = useNavigate();
  const [f, setF] = useState({
    title: "",
    description: "",
    required_skills_text: "",
    budget_min: "",
    budget_max: "",
    contract_length: "",
  });
  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          title: f.title,
          description: f.description,
          required_skills_text: f.required_skills_text,
          budget_min: f.budget_min ? Number(f.budget_min) : null,
          budget_max: f.budget_max ? Number(f.budget_max) : null,
          contract_length: f.contract_length,
          status: "open",
        },
      }),
    onSuccess: (row: { id: string }) => {
      toast.success("Posted — matching now.");
      navigate({ to: "/employer/postings/$id", params: { id: row.id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold">New posting</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Write it the way you'd describe it to a friend. We'll embed the whole thing.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <Field label="Title">
          <input
            required
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            className={input}
            placeholder="Technical writer, developer docs"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={6}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            className={input}
            placeholder="What will this person be doing? Who's it for?"
          />
        </Field>
        <Field label="Required skills (free text)">
          <textarea
            rows={3}
            value={f.required_skills_text}
            onChange={(e) => setF({ ...f, required_skills_text: e.target.value })}
            className={input}
            placeholder="e.g. hands-on with APIs, OpenAPI/Swagger, writing for developers"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget min ($)">
            <input
              type="number"
              value={f.budget_min}
              onChange={(e) => setF({ ...f, budget_min: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Budget max ($)">
            <input
              type="number"
              value={f.budget_max}
              onChange={(e) => setF({ ...f, budget_max: e.target.value })}
              className={input}
            />
          </Field>
        </div>
        <Field label="Contract length">
          <input
            value={f.contract_length}
            onChange={(e) => setF({ ...f, contract_length: e.target.value })}
            className={input}
            placeholder="e.g. 3 months, ongoing"
          />
        </Field>
        <button
          disabled={save.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Embedding & posting…" : "Post role"}
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
