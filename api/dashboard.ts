import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMockDashboardData } from "../src/lib/mock-data";
import { fetchMondayLeads } from "./_monday";
import type {
  DashboardData,
  Lead,
  AdCreative,
  FunnelStage,
  KPIData,
  RevenueBreakdown,
  AnyStage,
  BoardName,
} from "../src/lib/types";
import { EVALUATION_STAGES, SALES_STAGES, AFTERCARE_STAGES } from "../src/lib/types";
import { format } from "date-fns";

const SURGERY_PRICE_DEFAULT = parseFloat(
  process.env.SURGERY_PRICE_DEFAULT || "40000"
);
const SOCO_BASE = parseFloat(process.env.SOCO_BASE_FEE || "5000");
const SOCO_RATE = parseFloat(process.env.SOCO_COMMISSION_RATE || "0.10");

function buildFunnel(leads: Lead[]): FunnelStage[] {
  const ALL_STAGES_ORDERED: Array<{ stage: AnyStage; board: BoardName }> = [
    ...EVALUATION_STAGES.map((s) => ({ stage: s as AnyStage, board: "evaluation" as BoardName })),
    ...SALES_STAGES.map((s) => ({ stage: s as AnyStage, board: "sales" as BoardName })),
    ...AFTERCARE_STAGES.map((s) => ({ stage: s as AnyStage, board: "aftercare" as BoardName })),
  ];

  const stageCounts = new Map<string, number>();
  const stageAvgDays = new Map<string, number[]>();

  for (const lead of leads) {
    for (const event of lead.stageHistory) {
      const key = event.stage;
      stageCounts.set(key, (stageCounts.get(key) || 0) + 1);
      if (event.daysSpent !== undefined) {
        if (!stageAvgDays.has(key)) stageAvgDays.set(key, []);
        stageAvgDays.get(key)!.push(event.daysSpent);
      }
    }
    const curr = lead.currentStage;
    stageCounts.set(curr, (stageCounts.get(curr) || 0) + 1);
    if (lead.daysInCurrentStage !== undefined) {
      if (!stageAvgDays.has(curr)) stageAvgDays.set(curr, []);
      stageAvgDays.get(curr)!.push(lead.daysInCurrentStage);
    }
  }

  const firstCount = stageCounts.get(EVALUATION_STAGES[0]) || leads.length;

  return ALL_STAGES_ORDERED.map((item, idx) => {
    const count = stageCounts.get(item.stage) || 0;
    const days = stageAvgDays.get(item.stage) || [];
    const avgDays =
      days.length > 0
        ? Math.round(days.reduce((a, b) => a + b, 0) / days.length)
        : 0;
    const prevCount =
      idx === 0
        ? firstCount
        : stageCounts.get(ALL_STAGES_ORDERED[idx - 1].stage) || count;
    const cumulativeDropoff =
      firstCount > 0
        ? Math.round(((firstCount - count) / firstCount) * 1000) / 10
        : 0;
    const stageDropoff =
      prevCount > 0
        ? Math.round(((prevCount - count) / prevCount) * 1000) / 10
        : 0;

    return {
      board: item.board,
      stage: item.stage,
      order: idx + 1,
      count,
      cumulativeDropoff,
      stageDropoff,
      avgDaysInStage: avgDays,
    } satisfies FunnelStage;
  });
}

function buildKPIs(leads: Lead[], creatives: AdCreative[], adSpendOverride?: number): KPIData {
  const booked = leads.filter(
    (l) =>
      l.currentBoard === "aftercare" ||
      (l.stageHistory || []).some((s) => s.board === "aftercare")
  );
  const totalLeads = leads.length;
  const totalBookings = booked.length;

  const totalRevenue = booked.reduce(
    (sum, l) => sum + (l.surgeryPrice || SURGERY_PRICE_DEFAULT),
    0
  );

  const totalAdSpend = adSpendOverride || creatives.reduce((sum, c) => sum + c.spend, 0);

  const bookedWithDays = booked.filter((l) => {
    const created = new Date(l.createdAt).getTime();
    const booked = l.bookingDate ? new Date(l.bookingDate).getTime() : undefined;
    return booked && booked > created;
  });
  const avgDaysLeadToBooked =
    bookedWithDays.length > 0
      ? Math.round(
          bookedWithDays.reduce((sum, l) => {
            return (
              sum +
              (new Date(l.bookingDate!).getTime() - new Date(l.createdAt).getTime()) /
                86400000
            );
          }, 0) / bookedWithDays.length
        )
      : 0;

  const onSalesBoard = leads.filter((l) => ["sales", "aftercare"].includes(l.currentBoard));
  const leadToSalesRate =
    totalLeads > 0 ? Math.round((onSalesBoard.length / totalLeads) * 1000) / 10 : 0;
  const salesToBookingRate =
    onSalesBoard.length > 0
      ? Math.round((totalBookings / onSalesBoard.length) * 1000) / 10
      : 0;
  const overallConversionRate =
    totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 1000) / 10 : 0;

  const totalLeadsFromAds = creatives.reduce((s, c) => s + c.leads, 0);
  const costPerLead = totalLeadsFromAds > 0 ? totalAdSpend / totalLeadsFromAds : 0;
  const costPerBooking = totalBookings > 0 ? totalAdSpend / totalBookings : 0;
  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  const socoFee = SOCO_BASE + SOCO_RATE * totalRevenue;
  const stuckLeads = leads.filter((l) => l.isStuck).length;

  return {
    totalLeads,
    totalBookings,
    overallConversionRate,
    leadToSalesRate,
    salesToBookingRate,
    avgDaysLeadToBooked,
    totalRevenue,
    totalAdSpend,
    roas: Math.round(roas * 100) / 100,
    socoFee: Math.round(socoFee),
    costPerLead: Math.round(costPerLead),
    costPerBooking: Math.round(costPerBooking),
    activeLeads: leads.filter(
      (l) => l.currentBoard !== "aftercare" || l.currentStage === "Booked"
    ).length,
    stuckLeads,
  };
}

function buildRevenue(leads: Lead[]): RevenueBreakdown[] {
  const monthMap = new Map<string, RevenueBreakdown>();

  for (const lead of leads) {
    if (!lead.bookingDate) continue;
    const month = lead.bookingDate.slice(0, 7);
    const label = format(new Date(lead.bookingDate), "MMM");
    if (!monthMap.has(month)) {
      monthMap.set(month, { month, label, bookings: 0, revenue: 0, adSpend: 0, roas: 0, socoFee: 0, profit: 0 });
    }
    const entry = monthMap.get(month)!;
    entry.bookings += 1;
    entry.revenue += lead.surgeryPrice || SURGERY_PRICE_DEFAULT;
  }

  for (const entry of monthMap.values()) {
    entry.socoFee = Math.round(SOCO_BASE + SOCO_RATE * entry.revenue);
    entry.profit = entry.revenue - entry.socoFee - entry.adSpend;
    entry.roas = entry.adSpend > 0 ? Math.round((entry.revenue / entry.adSpend) * 100) / 100 : 0;
  }

  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.mock === "true") {
    return res.json(getMockDashboardData());
  }

  try {
    // Call Monday directly (no HTTP round-trip — avoids self-fetch failures on Vercel)
    const [mondayResult] = await Promise.all([
      fetchMondayLeads(),
      // Meta and Google will be added here once credentials are configured
    ]);

    const mondayOk = !mondayResult.error && mondayResult.leads.length >= 0;
    const metaOk = false;
    const googleOk = false;

    const leads: Lead[] = mondayResult.leads;
    const metaCreatives: AdCreative[] = [];
    const googleCreatives: AdCreative[] = [];

    const allCreatives = [...metaCreatives, ...googleCreatives].map((c) => {
      const adLeads = leads.filter((l) => l.adId === c.adId);
      const adBookings = adLeads.filter(
        (l) =>
          l.currentBoard === "aftercare" ||
          l.stageHistory.some((s) => s.board === "aftercare")
      );
      const revenue = adBookings.reduce(
        (sum, l) => sum + (l.surgeryPrice || SURGERY_PRICE_DEFAULT),
        0
      );
      return {
        ...c,
        bookings: adBookings.length,
        revenue,
        conversionRate:
          adLeads.length > 0
            ? Math.round((adBookings.length / adLeads.length) * 1000) / 10
            : 0,
        cpb: adBookings.length > 0 ? Math.round(c.spend / adBookings.length) : 0,
        roas: c.spend > 0 ? Math.round((revenue / c.spend) * 100) / 100 : 0,
      };
    });

    const funnel = buildFunnel(leads);
    const kpis = buildKPIs(leads, allCreatives);
    const revenue = buildRevenue(leads);

    const data: DashboardData = {
      kpis,
      funnel,
      creatives: allCreatives,
      leads,
      revenue,
      dataSource: "live",
      lastUpdated: new Date().toISOString(),
      apiStatus: {
        monday: mondayOk ? "ok" : mondayResult.error ? "error" : "unconfigured",
        meta:   "unconfigured",
        google: "unconfigured",
      },
    };

    return res.json(data);
  } catch (err: any) {
    console.error("Dashboard handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
