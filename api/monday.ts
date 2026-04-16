import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchMondayLeads } from "./_monday";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result = await fetchMondayLeads();
  if (result.error && result.leads.length === 0) {
    const status = result.error === "MONDAY_API_KEY not set" ? 503 : 500;
    return res.status(status).json(result);
  }
  return res.json({ leads: result.leads, total: result.leads.length });
}
