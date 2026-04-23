import type { AdCreative, MetaDailyPoint } from "./types";

export interface GoogleStats {
  totalSpend: number;
  totalLeads: number;
  creatives: AdCreative[];
  daily: MetaDailyPoint[];
  status: "ok" | "error" | "unconfigured";
  error?: string;
}

export async function fetchGoogleInsights(): Promise<GoogleStats> {
  try {
    const res  = await fetch("/api/google-ads");
    const json = await res.json();
    return {
      totalSpend: json.totalSpend ?? 0,
      totalLeads: json.totalLeads ?? 0,
      creatives:  json.creatives  ?? [],
      daily:      json.daily      ?? [],
      status:     json.status     ?? "error",
      error:      json.error,
    };
  } catch (e: any) {
    return { totalSpend: 0, totalLeads: 0, creatives: [], daily: [], status: "error", error: e.message };
  }
}
