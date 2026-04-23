import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { AdCreative } from "../src/lib/types";

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "refresh_token",
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error_description || json.error);
  return json.access_token;
}

async function gaql(accessToken: string, query: string): Promise<any[]> {
  const customerId  = process.env.GOOGLE_ADS_CUSTOMER_ID!;
  const devToken    = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
  const url         = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":   "application/json",
      "Authorization":  `Bearer ${accessToken}`,
      "developer-token": devToken,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error.message || `Google Ads error ${res.status}`);
  return json.results ?? [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CUSTOMER_ID } = process.env;
  if (!GOOGLE_ADS_DEVELOPER_TOKEN || !GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CUSTOMER_ID) {
    return res.json({ status: "unconfigured", creatives: [], daily: [] });
  }

  try {
    const accessToken = await getAccessToken();

    const since = (req.query.since as string) || "2024-01-01";
    const until = (req.query.until as string) || new Date().toISOString().slice(0, 10);

    // Campaign-level creatives + daily breakdown in parallel
    const [adRows, dailyRows] = await Promise.all([
      gaql(accessToken, `
        SELECT
          campaign.id, campaign.name,
          ad_group.id, ad_group.name,
          ad_group_ad.ad.id, ad_group_ad.ad.name,
          metrics.impressions, metrics.clicks, metrics.cost_micros,
          metrics.conversions, metrics.conversions_value,
          metrics.ctr, metrics.average_cpc
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${since}' AND '${until}'
          AND campaign.status = 'ENABLED'
          AND ad_group.status = 'ENABLED'
          AND ad_group_ad.status = 'ENABLED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 200
      `),
      gaql(accessToken, `
        SELECT
          segments.date,
          metrics.cost_micros,
          metrics.conversions,
          metrics.impressions,
          metrics.clicks
        FROM campaign
        WHERE segments.date DURING LAST_90_DAYS
        ORDER BY segments.date ASC
      `),
    ]);

    const creatives: AdCreative[] = adRows.map((row: any) => {
      const spend       = (row.metrics?.cost_micros || 0) / 1_000_000;
      const leads       = Math.round(row.metrics?.conversions || 0);
      const revenue     = row.metrics?.conversions_value || 0;
      const impressions = parseInt(row.metrics?.impressions || "0");
      const clicks      = parseInt(row.metrics?.clicks      || "0");
      const cpc         = (row.metrics?.average_cpc || 0) / 1_000_000;
      return {
        platform:      "google" as const,
        campaignId:    String(row.campaign?.id    || ""),
        campaignName:  row.campaign?.name         || "",
        adSetId:       String(row.ad_group?.id    || ""),
        adSetName:     row.ad_group?.name         || "",
        adId:          String(row.ad_group_ad?.ad?.id || ""),
        adName:        row.ad_group_ad?.ad?.name  || "Unnamed ad",
        impressions, clicks, spend, leads, revenue,
        bookings:      0,
        ctr:           parseFloat(row.metrics?.ctr || "0") * 100,
        cpc,
        cpl:           leads > 0 ? spend / leads   : 0,
        cpb:           0,
        roas:          spend > 0 ? revenue / spend  : 0,
        conversionRate: 0,
      } satisfies AdCreative;
    });

    // Aggregate daily rows (multiple campaigns per date → sum)
    const dailyMap = new Map<string, { spend: number; leads: number; impressions: number; clicks: number }>();
    for (const row of dailyRows) {
      const date = row.segments?.date as string;
      if (!date) continue;
      const e = dailyMap.get(date) ?? { spend: 0, leads: 0, impressions: 0, clicks: 0 };
      e.spend       += (row.metrics?.cost_micros || 0) / 1_000_000;
      e.leads       += Math.round(row.metrics?.conversions || 0);
      e.impressions += parseInt(row.metrics?.impressions   || "0");
      e.clicks      += parseInt(row.metrics?.clicks        || "0");
      dailyMap.set(date, e);
    }
    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const totalSpend  = creatives.reduce((s, c) => s + c.spend,  0);
    const totalLeads  = creatives.reduce((s, c) => s + c.leads,  0);

    return res.json({ status: "ok", creatives, daily, totalSpend, totalLeads });
  } catch (err: any) {
    console.error("Google Ads error:", err.message);
    return res.json({ status: "error", error: err.message, creatives: [], daily: [] });
  }
}
