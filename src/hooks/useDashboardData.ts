import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";

async function fetchDashboard(since?: string, until?: string): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  if (until) params.set("until", until);
  const res = await fetch(`/api/dashboard?${params}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function useDashboardData(since?: string, until?: string) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", since, until],
    queryFn: () => fetchDashboard(since, until),
  });
}
