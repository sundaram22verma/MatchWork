import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "signin" as const } });
    return { user: data.user };
  },
  component: Shell,
});

function Shell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [role, setRole] = useState<"candidate" | "employer" | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setRole((data?.role as "candidate" | "employer") ?? null));
  }, [user.id]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-display text-lg font-semibold"
          >
            <span className="inline-block h-6 w-6 rounded-md bg-primary" />
            MatchWork
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {role && (
              <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
                {role === "candidate" ? "Writer" : "Employer"}
              </span>
            )}
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <button
              onClick={signOut}
              className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
