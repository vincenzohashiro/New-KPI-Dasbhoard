import type { AdCreative } from "./types";

const META_URL = "https://graph.facebook.com/v20.0";

interface MetaRow {
  campaign_id: string;
  campaign_name: string;
  adset_id?: string;
  adset_name?: string;
  ad_id: string;
  ad_name: string;
  impressions: string;
  clicks: string;
  spend: string;
  actions?: Array<{ action_type: string; value: string }>;
}

function getAction(actions: MetaRow["actions"], type: string): number {
  return parseFloat(actions?.find(a => a.action_type === type)?.value ?? "0") || 0;
}

function extractLeads(actions: MetaRow["actions"]): number {
  return (
    getAction(actions, "lead") ||
    getAction(actions, "onsite_conversion.lead_grouped") ||
    getAction(actions, "onsite_conversion.messaging_first_reply") ||
    0
  );
}

export interface MetaStats {
  totalSpend: number;
  totalLeads: number;
  totalImpressions: number;
  totalClicks: number;
  creatives: AdCreative[];
  status: "ok" | "error" | "unconfigured";
  error?: string;
}

export async function fetchMetaInsights(): Promise<MetaStats> {
  const token     = import.meta.env.VITE_META_ACCESS_TOKEN as string | undefined;
  const accountId = import.meta.env.VITE_META_AD_ACCOUNT_ID as string | undefined;

  if (!token || !accountId) {
    return { totalSpend: 0, totalLeads: 0, totalImpressions: 0, totalClicks: 0, creatives: [], status: "unconfigured" };
  }

  try {
    const fields = [
      "campaign_id", "campaign_name",
      "adset_id", "adset_name",
      "ad_id", "ad_name",
      "impressions", "clicks", "spend", "actions",
    ].join(",");

    const id = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
    const url = `${META_URL}/${id}/insights?fields=${fields}&date_preset=maximum&level=ad&limit=500&access_token=${token}`;

    const res  = await fetch(url);
    const json = await res.json();

    if (json.error) {
      return { totalSpend: 0, totalLeads: 0, totalImpressions: 0, totalClicks: 0, creatives: [], status: "error", error: json.error.message };
    }

    const rows: MetaRow[] = json.data ?? [];

    let totalSpend = 0, totalLeads = 0, totalImpressions = 0, totalClicks = 0;
    const creatives: AdCreative[] = [];

    for (const row of rows) {
      const spend       = parseFloat(row.spend)       || 0;
      const impressions = parseInt(row.impressions)   || 0;
      const clicks      = parseInt(row.clicks)        || 0;
      const leads       = extractLeads(row.actions);

      totalSpend       += spend;
      totalLeads       += leads;
      totalImpressions += impressions;
      totalClicks      += clicks;

      creatives.push({
        platform:       "meta",
        campaignId:     row.campaign_id,
        campaignName:   row.campaign_name,
        adSetId:        row.adset_id,
        adSetName:      row.adset_name,
        adId:           row.ad_id,
        adName:         row.ad_name,
        impressions,
        clicks,
        spend,
        leads,
        bookings:        0,
        revenue:         0,
        ctr:             impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        cpc:             clicks  > 0 ? Math.round((spend / clicks)  * 100) / 100 : 0,
        cpl:             leads   > 0 ? Math.round(spend / leads)               : 0,
        cpb:             0,
        roas:            0,
        conversionRate:  0,
      });
    }

    return { totalSpend, totalLeads, totalImpressions, totalClicks, creatives, status: "ok" };
  } catch (e: any) {
    return { totalSpend: 0, totalLeads: 0, totalImpressions: 0, totalClicks: 0, creatives: [], status: "error", error: e.message };
  }
}
