// Shared Monday.com fetch logic — imported by monday.ts and dashboard.ts.
// Underscore prefix means Vercel does NOT treat this as a route.
import type { Lead, StageEvent, BoardName, AnyStage, AdPlatform } from "../src/lib/types";

const MONDAY_API = "https://api.monday.com/v2";

// ─── Board IDs ────────────────────────────────────────────────────────────────
const BOARD_IDS = {
  evaluation: "5052697723",  // Nye Leads (Sally's Board)
  sales:      "5089650058",  // Zari's salg og konsultation
  aftercare:  "5052958230",  // Aftercare
};

// ─── Column ID maps per board ─────────────────────────────────────────────────
const COLS = {
  evaluation: {
    email:     "email_mkwx219b",
    phone:     "phone_mkwx7cez",
    source:    "color_mkwx19y8",
    grafts:    "text_mkzb2zr0",
    createdAt: "date_mkwx42yv",
    notes:     "long_text_mkwx16gz",
  },
  sales: {
    email:        "email_mkza7v62",
    phone:        "phone_mkza1j9h",
    source:       "color_mkztrzgr",
    grafts:       "text_mkzb6nnd",
    bookingDate:  "datenxt9a1p3",
    surgeryDate:  "date_mkznkt4c",
    surgeryPrice: "numeric_mkzqekwa",
    utmCampaign:  "short_text0dj0uud2",
    utmSource:    "short_text4n3j0t8v",
    createdAt:    "date4",
    notes:        "long_text_mkzq3v68",
  },
  aftercare: {
    email:        "email_mkxmc5yw",
    phone:        "phone_mkxm41px",
    source:       "color_mm0xcjap",
    grafts:       "text_mm0xq923",
    surgeryDate:  "date_mkxmb3rn",
    surgeryPrice: "numeric_mkxm44ys",
    createdAt:    "date_mm0xnt5h",
    notes:        "long_text_mkwx2fgj",
  },
} as const;

// ─── Group → stage mapping ────────────────────────────────────────────────────
const EVAL_GROUP_STAGE: Record<string, AnyStage | null> = {
  topics:           "New Lead",
  group_title:      "Waiting for Images",
  group_mm0rfprs:   "Waiting for Images",
  group_mkwxxzr5:   "Waiting for Doctor Feedback",
  group_mm29vwz4:   "New Lead",
  group_mm0gyk0j:   "New Lead",
  group_mm0grjj8:   "New Lead",
  group_mm0g3s0:    "New Lead",
  group_mm02bp7k:   null,
  group_mm0g128:    null,
  group_mkwxvtkf:   null,
};

const SALES_GROUP_STAGE: Record<string, AnyStage | null> = {
  group_mkza669n: "Contacted/In Dialogue",
  group_mm00m1t3: "Consultation Done",
  group_mkza3b7m: "Considering/Follow-up",
  group_mkzv5x4s: "Considering/Follow-up",
  group_mkzap3ve: "Ready to Book",
  group_mm026ta4: "Ready to Book",
  group_mm0jxsgb: "Not Contacted",
  group_mkzax00z: null,
  group_mm03bphx: null,
};

const AFTERCARE_GROUP_STAGE: Record<string, AnyStage | null> = {
  group_mkxn63h2: "Booked",
  group_mkzh7bp3: "Pre-Travel",
  group_mkxnqh72: "Surgery Completed",
  group_mkztkrpr: "Aftercare 3 months",
  topics:         "Aftercare 3 months",
  group_mkxmt5vn: "Aftercare 12 months",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cv(columnValues: any[], id: string): string {
  return columnValues.find((c: any) => c.id === id)?.text?.trim() || "";
}

function cvNum(columnValues: any[], id: string): number {
  const raw = columnValues.find((c: any) => c.id === id)?.text || "";
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}

function mapSource(kilde: string): AdPlatform {
  const k = kilde.toLowerCase();
  if (k.includes("meta") || k.includes("facebook") || k.includes("fb") || k.includes("instagram")) return "meta";
  if (k.includes("google")) return "google";
  return "other";
}

function getStage(groupId: string, board: BoardName): AnyStage | null {
  if (board === "evaluation") return EVAL_GROUP_STAGE[groupId] ?? null;
  if (board === "sales")      return SALES_GROUP_STAGE[groupId] ?? null;
  if (board === "aftercare")  return AFTERCARE_GROUP_STAGE[groupId] ?? null;
  return null;
}

// ─── Monday GraphQL ───────────────────────────────────────────────────────────
async function mondayQuery(query: string, variables = {}) {
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.MONDAY_API_KEY!,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

const BOARD_QUERY = `
query GetBoard($boardId: ID!) {
  boards(ids: [$boardId]) {
    id
    name
    items_page(limit: 500) {
      cursor
      items {
        id
        name
        created_at
        updated_at
        group { id title }
        column_values { id text value }
      }
    }
  }
}
`;

// ─── Core fetch ───────────────────────────────────────────────────────────────
export async function fetchMondayLeads(): Promise<{ leads: Lead[]; error?: string }> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return { leads: [], error: "MONDAY_API_KEY not set" };

  try {
    const boards: Array<{ id: string; name: BoardName }> = [
      { id: BOARD_IDS.evaluation, name: "evaluation" },
      { id: BOARD_IDS.sales,      name: "sales" },
      { id: BOARD_IDS.aftercare,  name: "aftercare" },
    ];

    const leadsMap = new Map<string, Lead>();

    for (const board of boards) {
      const data = await mondayQuery(BOARD_QUERY, { boardId: board.id });
      const boardData = data.boards[0];
      if (!boardData) continue;

      for (const item of boardData.items_page.items) {
        const groupId = item.group?.id as string;
        const stage = getStage(groupId, board.name);
        if (stage === null) continue;

        const cvs = item.column_values as any[];
        let email = "";
        let phone = "";
        let source: AdPlatform = "other";
        let grafts: number | undefined;
        let bookingDate: string | undefined;
        let surgeryDate: string | undefined;
        let surgeryPrice: number | undefined;
        let campaignName: string | undefined;
        let notes: string | undefined;
        let createdAt = item.created_at as string;

        if (board.name === "evaluation") {
          const c = COLS.evaluation;
          email   = cv(cvs, c.email);
          phone   = cv(cvs, c.phone);
          source  = mapSource(cv(cvs, c.source));
          grafts  = cvNum(cvs, c.grafts) || undefined;
          notes   = cv(cvs, c.notes) || undefined;
          const d = cv(cvs, c.createdAt);
          if (d) createdAt = d;
        } else if (board.name === "sales") {
          const c = COLS.sales;
          email        = cv(cvs, c.email);
          phone        = cv(cvs, c.phone);
          source       = mapSource(cv(cvs, c.source));
          grafts       = cvNum(cvs, c.grafts) || undefined;
          bookingDate  = cv(cvs, c.bookingDate) || undefined;
          surgeryDate  = cv(cvs, c.surgeryDate) || undefined;
          const price  = cvNum(cvs, c.surgeryPrice);
          if (price > 0) surgeryPrice = price;
          campaignName = cv(cvs, c.utmCampaign) || cv(cvs, c.utmSource) || undefined;
          notes        = cv(cvs, c.notes) || undefined;
          const d = cv(cvs, c.createdAt);
          if (d) createdAt = d;
        } else if (board.name === "aftercare") {
          const c = COLS.aftercare;
          email       = cv(cvs, c.email);
          phone       = cv(cvs, c.phone);
          source      = mapSource(cv(cvs, c.source));
          grafts      = cvNum(cvs, c.grafts) || undefined;
          surgeryDate = cv(cvs, c.surgeryDate) || undefined;
          const price = cvNum(cvs, c.surgeryPrice);
          if (price > 0) surgeryPrice = price;
          notes       = cv(cvs, c.notes) || undefined;
          const d = cv(cvs, c.createdAt);
          if (d) createdAt = d;
        }

        const stageEvent: StageEvent = {
          board: board.name,
          stage,
          enteredAt: createdAt || item.created_at,
        };

        const existing = leadsMap.get(item.name);
        if (existing) {
          existing.currentBoard = board.name;
          existing.currentStage = stage;
          existing.updatedAt    = item.updated_at;
          existing.stageHistory = [...existing.stageHistory, stageEvent];
          if (bookingDate)  existing.bookingDate  = bookingDate;
          if (surgeryDate)  existing.surgeryDate  = surgeryDate;
          if (surgeryPrice) existing.surgeryPrice = surgeryPrice;
          if (email && !existing.email) existing.email = email;
          if (phone && !existing.phone) existing.phone = phone;
          if (grafts) existing.grafts = grafts;
        } else {
          const lead: Lead = {
            id:           item.id,
            name:         item.name,
            email:        email || undefined,
            phone:        phone || undefined,
            source,
            campaignName: campaignName || undefined,
            currentBoard: board.name,
            currentStage: stage,
            stageHistory: [stageEvent],
            surgeryPrice,
            bookingDate,
            surgeryDate,
            createdAt:    createdAt || item.created_at,
            updatedAt:    item.updated_at,
            notes:        notes || undefined,
            grafts:       grafts || undefined,
          };
          const daysInStage = Math.round(
            (Date.now() - new Date(createdAt || item.created_at).getTime()) / 86400000
          );
          lead.daysInCurrentStage = daysInStage;
          lead.isStuck = daysInStage > 7;
          leadsMap.set(item.name, lead);
        }
      }
    }

    return { leads: Array.from(leadsMap.values()) };
  } catch (err: any) {
    console.error("Monday fetch error:", err);
    return { leads: [], error: err.message };
  }
}
