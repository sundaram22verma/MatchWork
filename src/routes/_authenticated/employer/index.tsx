import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getMyCompany,
  saveMyCompany,
  listMyPostings,
  closePosting,
} from "@/lib/matchwork.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employer/")({
  component: EmployerHome,
});

function EmployerHome() {
  const qc = useQueryClient();
  const companyFn = useServerFn(getMyCompany);
  const saveFn = useServerFn(saveMyCompany);
  const postingsFn = useServerFn(listMyPostings);
  const closeFn = useServerFn(closePosting);

  const company = useQuery({ queryKey: ["company"], queryFn: () => companyFn() });
  const postings = useQuery({
    queryKey: ["my-postings"],
    queryFn: () => postingsFn(),
    enabled: !!company.data,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (company.data) {
      setName(company.data.name);
      setDescription(company.data.description ?? "");
    }
  }, [company.data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { name, description } }),
    onSuccess: () => {
      toast.success("Company saved.");
      qc.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const close = useMutation({
    mutationFn: (id: string) => closeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Posting closed.");
      qc.invalidateQueries({ queryKey: ["my-postings"] });
    },
  });

  if (company.isPending) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (!company.data) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold">Set up your company</h1>
        <p className="mt-2 text-sm text-muted-foreground">A one-time thing — takes 20 seconds.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Company name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              One-liner
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {company.data.name}
          </div>
          <h1 className="mt-1 text-3xl font-semibold">Your postings</h1>
        </div>
        <Link
          to="/employer/postings/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New posting
        </Link>
      </div>

      {postings.data?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <div className="font-semibold">No postings yet</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Post a role to start seeing ranked applicants.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(
          (postings.data as Array<{
            id: string;
            title: string;
            status: string;
            contract_length: string;
          }>) ?? []
        ).map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "open" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {p.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{p.contract_length}</div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/employer/postings/$id"
                params={{ id: p.id }}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
              >
                View applicants
              </Link>
              {p.status === "open" && (
                <button
                  onClick={() => close.mutate(p.id)}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
