/**
 * Monday.com client — runs in the browser, same pattern as the reference project.
 * Uses VITE_MONDAY_API_KEY (set in Vercel env vars or .env.local).
 */
import type {
  Lead, StageEvent, BoardName, AnyStage, AdPlatform,
  FunnelStage, KPIData, RevenueBreakdown, DashboardData,
} from "./types";

const MONDAY_URL = "https://api.monday.com/v2";

const BOARD_IDS = {
  evaluation: "5052697723",
  sales:      "5089650058",
  aftercare:  "5052958230",
};

const COLS = {
  evaluation: {
    email: "email_mkwx219b", phone: "phone_mkwx7cez",
    source: "color_mkwx19y8", grafts: "text_mkzb2zr0",
    createdAt: "date_mkwx42yv", notes: "long_text_mkwx16gz",
  },
  sales: {
    email: "email_mkza7v62", phone: "phone_mkza1j9h",
    source: "color_mkztrzgr", grafts: "text_mkzb6nnd",
    bookingDate: "datenxt9a1p3", surgeryDate: "date_mkznkt4c",
    surgeryPrice: "numeric_mkzqekwa", utmCampaign: "short_text0dj0uud2",
    utmSource: "short_text4n3j0t8v", createdAt: "date4",
    notes: "long_text_mkzq3v68",
  },
  aftercare: {
    email: "email_mkxmc5yw", phone: "phone_mkxm41px",
    source: "color_mm0xcjap", grafts: "text_mm0xq923",
    surgeryDate: "date_mkxmb3rn", surgeryPrice: "numeric_mkxm44ys",
    createdAt: "date_mm0xnt5h", notes: "long_text_mkwx2fgj",
  },
} as const;

const EVAL_STAGE: Record<string, AnyStage | null> = {
  topics: "New Lead", group_title: "Waiting for Images",
  group_mm0rfprs: "Waiting for Images", group_mkwxxzr5: "Waiting for Doctor Feedback",
  group_mm29vwz4: "New Lead", group_mm0gyk0j: "New Lead",
  group_mm0grjj8: "New Lead", group_mm0g3s0: "New Lead",
  group_mm02bp7k: null, group_mm0g128: null, group_mkwxvtkf: null,
};
const SALES_STAGE: Record<string, AnyStage | null> = {
  group_mkza669n: "Contacted/In Dialogue", group_mm00m1t3: "Consultation Done",
  group_mkza3b7m: "Considering/Follow-up", group_mkzv5x4s: "Considering/Follow-up",
  group_mkzap3ve: "Ready to Book", group_mm026ta4: "Ready to Book",
  group_mm0jxsgb: "Not Contacted", group_mkzax00z: null, group_mm03bphx: null,
};
const AFTER_STAGE: Record<string, AnyStage | null> = {
  group_mkxn63h2: "Booked", group_mkzh7bp3: "Pre-Travel",
  group_mkxnqh72: "Surgery Completed", group_mkztkrpr: "Aftercare 3 months",
  topics: "Aftercare 3 months", group_mkxmt5vn: "Aftercare 12 months",
};

const SURGERY_DEFAULT = 40000;
const SOCO_BASE = 5000;
const SOCO_RATE = 0.10;

// ── Helpers ───────────────────────────────────────────────────────────────────
function col(cvs: any[], id: string): string {
  return cvs.find((c: any) => c.id === id)?.text?.trim() || "";
}
function colNum(cvs: any[], id: string): number {
  return parseFloat((cvs.find((c: any) => c.id === id)?.text || "").replace(/[^0-9.]/g, "")) || 0;
}
function toPlatform(kilde: string): AdPlatform {
  const k = kilde.toLowerCase();
  if (k.includes("meta") || k.includes("facebook") || k.includes("fb") || k.includes("instagram")) return "meta";
  if (k.includes("google")) return "google";
  return "other";
}
function toStage(groupId: string, board: BoardName): AnyStage | null {
  const m = board === "evaluation" ? EVAL_STAGE : board === "sales" ? SALES_STAGE : AFTER_STAGE;
  return m[groupId] ?? null;
}

// ── Fetch one board ───────────────────────────────────────────────────────────
async function fetchBoard(boardId: string, apiKey: string): Promise<any[]> {
  const query = `query($id:ID!){boards(ids:[$id]){items_page(limit:500){items{id name created_at updated_at group{id}column_values{id text}}}}}`;
  const res = await fetch(MONDAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": apiKey,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query, variables: { id: boardId } }),
  });
  if (!res.ok) throw new Error(`Monday HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data.boards[0]?.items_page?.items ?? [];
}

// ── Build leads from all 3 boards ─────────────────────────────────────────────
async function fetchLeads(apiKey: string): Promise<Lead[]> {
  const boards: Array<{ id: string; name: BoardName }> = [
    { id: BOARD_IDS.evaluation, name: "evaluation" },
    { id: BOARD_IDS.sales,      name: "sales" },
    { id: BOARD_IDS.aftercare,  name: "aftercare" },
  ];

  const map = new Map<string, Lead>();

  for (const board of boards) {
    const items = await fetchBoard(board.id, apiKey);
    for (const item of items) {
      const s = toStage(item.group?.id, board.name);
      if (s === null) continue;

      const cvs = item.column_values as any[];
      const c   = COLS[board.name] as any;
      let email = col(cvs, c.email);
      let phone = col(cvs, c.phone);
      let grafts = colNum(cvs, c.grafts) || undefined;
      let notes  = col(cvs, c.notes) || undefined;
      let bookingDate: string | undefined;
      let surgeryDate: string | undefined;
      let surgeryPrice: number | undefined;
      let campaign: string | undefined;
      let createdAt = col(cvs, c.createdAt) || item.created_at;

      if (board.name === "sales") {
        bookingDate = col(cvs, c.bookingDate) || undefined;
        surgeryDate = col(cvs, c.surgeryDate) || undefined;
        const p = colNum(cvs, c.surgeryPrice); if (p > 0) surgeryPrice = p;
        campaign = col(cvs, c.utmCampaign) || col(cvs, c.utmSource) || undefined;
      } else if (board.name === "aftercare") {
        surgeryDate = col(cvs, c.surgeryDate) || undefined;
        const p = colNum(cvs, c.surgeryPrice); if (p > 0) surgeryPrice = p;
      }

      const event: StageEvent = { board: board.name, stage: s, enteredAt: createdAt };
      const existing = map.get(item.name);

      if (existing) {
        existing.currentBoard = board.name;
        existing.currentStage = s;
        existing.updatedAt    = item.updated_at;
        existing.stageHistory.push(event);
        if (bookingDate)  existing.bookingDate  = bookingDate;
        if (surgeryDate)  existing.surgeryDate  = surgeryDate;
        if (surgeryPrice) existing.surgeryPrice = surgeryPrice;
        if (email && !existing.email) existing.email = email;
        if (phone && !existing.phone) existing.phone = phone;
        if (grafts) existing.grafts = grafts;
      } else {
        const days = Math.round((Date.now() - new Date(createdAt).getTime()) / 86400000);
        map.set(item.name, {
          id: item.id, name: item.name,
          email: email || undefined, phone: phone || undefined,
          source: toPlatform(col(cvs, c.source)), campaignName: campaign,
          currentBoard: board.name, currentStage: s, stageHistory: [event],
          surgeryPrice, bookingDate, surgeryDate,
          createdAt, updatedAt: item.updated_at,
          notes, grafts, daysInCurrentStage: days, isStuck: days > 7,
        });
      }
    }
  }

  return Array.from(map.values());
}

// ── Funnel / KPIs / Revenue ───────────────────────────────────────────────────
const ALL_STAGES: Array<{ stage: AnyStage; board: BoardName }> = [
  { stage: "New Lead",                    board: "evaluation" },
  { stage: "Waiting for Images",          board: "evaluation" },
  { stage: "Images Received",             board: "evaluation" },
  { stage: "Waiting for Doctor Feedback", board: "evaluation" },
  { stage: "Doctor Feedback Ready",       board: "evaluation" },
  { stage: "Not Contacted",               board: "sales" },
  { stage: "Contacted/In Dialogue",       board: "sales" },
  { stage: "Consultation Done",           board: "sales" },
  { stage: "Considering/Follow-up",       board: "sales" },
  { stage: "Ready to Book",               board: "sales" },
  { stage: "Booked",                      board: "aftercare" },
  { stage: "Pre-Travel",                  board: "aftercare" },
  { stage: "Surgery Completed",           board: "aftercare" },
  { stage: "Aftercare 3 months",          board: "aftercare" },
  { stage: "Aftercare 12 months",         board: "aftercare" },
];

function buildFunnel(leads: Lead[]): FunnelStage[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    for (const e of l.stageHistory) counts.set(e.stage, (counts.get(e.stage) || 0) + 1);
    counts.set(l.currentStage, (counts.get(l.currentStage) || 0) + 1);
  }
  const first = counts.get("New Lead") || leads.length || 1;
  return ALL_STAGES.map((item, i) => {
    const count = counts.get(item.stage) || 0;
    const prev  = i === 0 ? first : counts.get(ALL_STAGES[i - 1].stage) || count;
    return {
      board: item.board, stage: item.stage, order: i + 1, count,
      cumulativeDropoff: Math.round(((first - count) / first) * 1000) / 10,
      stageDropoff: prev > 0 ? Math.round(((prev - count) / prev) * 1000) / 10 : 0,
      avgDaysInStage: 0,
    } satisfies FunnelStage;
  });
}

function buildKPIs(leads: Lead[]): KPIData {
  const booked  = leads.filter(l => l.currentBoard === "aftercare" || l.stageHistory.some(e => e.board === "aftercare"));
  const onSales = leads.filter(l => ["sales", "aftercare"].includes(l.currentBoard));
  const revenue = booked.reduce((s, l) => s + (l.surgeryPrice || SURGERY_DEFAULT), 0);
  const socoFee = SOCO_BASE + SOCO_RATE * revenue;
  return {
    totalLeads: leads.length, totalBookings: booked.length,
    overallConversionRate: leads.length ? Math.round((booked.length / leads.length) * 1000) / 10 : 0,
    leadToSalesRate:       leads.length ? Math.round((onSales.length / leads.length) * 1000) / 10 : 0,
    salesToBookingRate:    onSales.length ? Math.round((booked.length / onSales.length) * 1000) / 10 : 0,
    avgDaysLeadToBooked: 0, totalRevenue: revenue, totalAdSpend: 0,
    roas: 0, socoFee: Math.round(socoFee), costPerLead: 0, costPerBooking: 0,
    activeLeads: leads.filter(l => l.currentBoard !== "aftercare" || l.currentStage === "Booked").length,
    stuckLeads:  leads.filter(l => l.isStuck).length,
  };
}

function buildRevenue(leads: Lead[]): RevenueBreakdown[] {
  const m = new Map<string, RevenueBreakdown>();
  for (const l of leads) {
    if (!l.bookingDate) continue;
    const key   = l.bookingDate.slice(0, 7);
    const label = new Date(l.bookingDate).toLocaleString("en", { month: "short" });
    if (!m.has(key)) m.set(key, { month: key, label, bookings: 0, revenue: 0, adSpend: 0, roas: 0, socoFee: 0, profit: 0 });
    const e = m.get(key)!;
    e.bookings++;
    e.revenue += l.surgeryPrice || SURGERY_DEFAULT;
  }
  for (const e of m.values()) {
    e.socoFee = Math.round(SOCO_BASE + SOCO_RATE * e.revenue);
    e.profit  = e.revenue - e.socoFee;
  }
  return Array.from(m.values()).sort((a, b) => a.month.localeCompare(b.month));
}

// ── Public: build full DashboardData directly in the browser ──────────────────
export async function fetchMondayDashboard(): Promise<DashboardData> {
  const apiKey = import.meta.env.VITE_MONDAY_API_KEY as string | undefined;

  if (!apiKey) {
    return {
      kpis: buildKPIs([]), funnel: buildFunnel([]), creatives: [], leads: [], revenue: [],
      dataSource: "live", lastUpdated: new Date().toISOString(),
      apiStatus: { monday: "unconfigured", meta: "unconfigured", google: "unconfigured" },
    };
  }

  const leads = await fetchLeads(apiKey);
  return {
    kpis:     buildKPIs(leads),
    funnel:   buildFunnel(leads),
    creatives: [],
    leads,
    revenue:  buildRevenue(leads),
    dataSource: "live",
    lastUpdated: new Date().toISOString(),
    apiStatus: { monday: "ok", meta: "unconfigured", google: "unconfigured" },
  };
}
