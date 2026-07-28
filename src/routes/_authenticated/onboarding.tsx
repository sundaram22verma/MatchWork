import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ensureProfile, getMyProfile } from "@/lib/matchwork.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const getFn = useServerFn(getMyProfile);
  const ensureFn = useServerFn(ensureProfile);
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [saving, setSaving] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getFn(),
  });

  if (isPending) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (data) {
    navigate({ to: data.role === "candidate" ? "/candidate" : "/employer", replace: true });
    return null;
  }

  async function save() {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user?.email) throw new Error("No email on account");
      await ensureFn({ data: { role, email: u.user.email } });
      toast.success("You're set up!");
      navigate({ to: role === "candidate" ? "/candidate/profile" : "/employer" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold">Welcome to MatchWork</h1>
      <p className="mt-2 text-muted-foreground">Which side are you on?</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {(["candidate", "employer"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-xl border p-6 text-left ${
              role === r ? "border-primary bg-secondary" : "border-border bg-card"
            }`}
          >
            <div className="font-semibold">{r === "candidate" ? "I'm a writer" : "I'm hiring"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {r === "candidate"
                ? "Build a profile, get ranked matches."
                : "Post a role, see ranked applicants."}
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "…" : "Continue"}
      </button>
    </div>
  );
}
