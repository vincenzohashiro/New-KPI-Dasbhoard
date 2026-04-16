import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { fetchMondayDashboard } from "@/lib/monday";

export function useDashboardData(_since?: string, _until?: string) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchMondayDashboard,
  });
}
