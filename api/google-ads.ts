import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { AdCreative } from "../src/lib/types";

async function getGoogleAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token error: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error_description || json.error);
  return json.access_token;
}

async function googleAdsQuery(accessToken: string, query: string) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;
  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err[0]?.error?.message || `Google Ads API error: ${res.status}`);
  }
  const json = await res.json();
  const rows: any[] = [];
  for (const chunk of json) {
    rows.push(...(chunk.results || []));
  }
  return rows;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!devToken || !clientId || !customerId) {
    return res.status(503).json({ error: "Google Ads not configured", creatives: [] });
  }

  const since = (req.query.since as string) || "2024-01-01";
  const until = (req.query.until as string) || new Date().toISOString().slice(0, 10);

  try {
    const accessToken = await getGoogleAccessToken();

    const gaqlQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${since}' AND '${until}'
        AND campaign.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND ad_group_ad.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 200
    `;

    const rows = await googleAdsQuery(accessToken, gaqlQuery);

    const creatives: AdCreative[] = rows.map((row: any) => {
      const spend = (row.metrics?.cost_micros || 0) / 1_000_000;
      const leads = Math.round(row.metrics?.conversions || 0);
      const revenue = row.metrics?.conversions_value || 0;
      const impressions = parseInt(row.metrics?.impressions || "0");
      const clicks = parseInt(row.metrics?.clicks || "0");

      return {
        platform: "google" as const,
        campaignId: String(row.campaign?.id || ""),
        campaignName: row.campaign?.name || "",
        adSetId: String(row.ad_group?.id || ""),
        adSetName: row.ad_group?.name || "",
        adId: String(row.ad_group_ad?.ad?.id || ""),
        adName: row.ad_group_ad?.ad?.name || "Unnamed ad",
        impressions,
        clicks,
        spend,
        leads,
        bookings: 0,
        revenue,
        ctr: parseFloat(row.metrics?.ctr || "0") * 100,
        cpl: leads > 0 ? spend / leads : 0,
        cpb: 0,
        roas: spend > 0 ? revenue / spend : 0,
        conversionRate: 0,
      } satisfies AdCreative;
    });

    return res.json({ creatives, total: creatives.length });
  } catch (err: any) {
    console.error("Google Ads API error:", err);
    return res.status(500).json({ error: err.message, creatives: [] });
  }
}
