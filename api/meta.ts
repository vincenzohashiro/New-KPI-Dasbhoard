import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { AdCreative } from "../src/lib/types";

const GRAPH_API = "https://graph.facebook.com/v20.0";

async function graphFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH_API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN!);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Meta API error: ${res.status}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return res.status(503).json({ error: "Meta not configured", creatives: [] });
  }

  const since = (req.query.since as string) || "2024-01-01";
  const until = (req.query.until as string) || new Date().toISOString().slice(0, 10);

  try {
    const insightsData = await graphFetch(`/${adAccountId}/insights`, {
      level: "ad",
      fields: [
        "campaign_id",
        "campaign_name",
        "adset_id",
        "adset_name",
        "ad_id",
        "ad_name",
        "impressions",
        "clicks",
        "spend",
        "actions",
        "action_values",
        "ctr",
        "cpc",
      ].join(","),
      time_range: JSON.stringify({ since, until }),
      limit: "500",
    });

    const creatives: AdCreative[] = (insightsData.data || []).map((item: any) => {
      const actions: { action_type: string; value: string }[] = item.actions || [];
      const actionValues: { action_type: string; value: string }[] = item.action_values || [];

      const leads =
        parseInt(actions.find((a) => a.action_type === "lead")?.value || "0") ||
        parseInt(
          actions.find((a) => a.action_type === "offsite_conversion.fb_pixel_lead")?.value || "0"
        );

      const revenue = parseFloat(
        actionValues.find((a) => a.action_type.includes("purchase"))?.value || "0"
      );

      const impressions = parseInt(item.impressions || "0");
      const clicks = parseInt(item.clicks || "0");
      const spend = parseFloat(item.spend || "0");
      const cpl = leads > 0 ? spend / leads : 0;

      return {
        platform: "meta" as const,
        campaignId: item.campaign_id,
        campaignName: item.campaign_name,
        adSetId: item.adset_id,
        adSetName: item.adset_name,
        adId: item.ad_id,
        adName: item.ad_name,
        impressions,
        clicks,
        spend,
        leads,
        bookings: 0,
        revenue,
        ctr: parseFloat(item.ctr || "0"),
        cpl,
        cpb: 0,
        roas: spend > 0 ? revenue / spend : 0,
        conversionRate: 0,
      } satisfies AdCreative;
    });

    return res.json({ creatives, total: creatives.length });
  } catch (err: any) {
    console.error("Meta API error:", err);
    return res.status(500).json({ error: err.message, creatives: [] });
  }
}
