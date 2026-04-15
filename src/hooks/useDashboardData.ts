import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { getMockDashboardData } from "@/lib/mock-data";

async function fetchDashboard(since?: string, until?: string): Promise<DashboardData> {
  // In production (Vercel), call the real API. Falls back to mock on any failure.
  try {
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (until) params.set("until", until);
    const res = await fetch(`/api/dashboard?${params}`);
    if (!res.ok) throw new Error("no api");
    const data = await res.json();
    // If the API itself returned mock data, that's fine too
    return data;
  } catch {
    return getMockDashboardData();
  }
}

export function useDashboardData(since?: string, until?: string) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", since, until],
    queryFn: () => fetchDashboard(since, until),
  });
}
