import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/matchwork.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const fn = useServerFn(getMyProfile);
  const { data, isPending } = useQuery({ queryKey: ["profile"], queryFn: () => fn() });
  if (isPending) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <Navigate to="/onboarding" />;
  if (data.role === "candidate") return <Navigate to="/candidate" />;
  return <Navigate to="/employer" />;
}
