import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { fetchMondayDashboard } from "@/lib/monday";

// Monday API allows ~10k complexity/min. 3 boards × ~500 items is well under that.
// 5-minute interval keeps data fresh without hitting limits.
const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchMondayDashboard,
    staleTime:       4 * 60 * 1000,  // don't refetch sooner than 4 min
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: false, // pause when tab is not visible
    placeholderData: keepPreviousData,  // keep old data visible during refetch
  });
}
