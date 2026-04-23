// ─── Funnel stages ───────────────────────────────────────────────────────────

export const EVALUATION_STAGES = [
  "New Lead",
  "Waiting for Images",
  "Images Received",
  "Waiting for Doctor Feedback",
  "Doctor Feedback Ready",
] as const;

export const SALES_STAGES = [
  "Not Contacted",
  "Contacted/In Dialogue",
  "Consultation Done",
  "Considering/Follow-up",
  "Ready to Book",
] as const;

export const AFTERCARE_STAGES = [
  "Booked",
  "Pre-Travel",
  "Surgery Completed",
  "Aftercare 3 months",
  "Aftercare 6 months",
  "Aftercare 9 months",
  "Aftercare 12 months",
] as const;

export const ALL_STAGES = [
  ...EVALUATION_STAGES,
  ...SALES_STAGES,
  ...AFTERCARE_STAGES,
] as const;

export type EvaluationStage = (typeof EVALUATION_STAGES)[number];
export type SalesStage = (typeof SALES_STAGES)[number];
export type AftercareStage = (typeof AFTERCARE_STAGES)[number];
export type AnyStage = EvaluationStage | SalesStage | AftercareStage;

export type BoardName = "evaluation" | "sales" | "aftercare";

export interface StageEvent {
  board: BoardName;
  stage: AnyStage;
  enteredAt: string; // ISO date
  exitedAt?: string; // ISO date
  daysSpent?: number;
}

// ─── Lead ────────────────────────────────────────────────────────────────────

export type AdPlatform = "meta" | "google" | "organic" | "other";

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: AdPlatform;
  campaignId?: string;
  campaignName?: string;
  adSetId?: string;
  adSetName?: string;
  adId?: string;
  adName?: string;
  currentBoard: BoardName;
  currentStage: AnyStage;
  stageHistory: StageEvent[];
  surgeryPrice?: number;
  bookingDate?: string;
  surgeryDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  country?: string;
  grafts?: number;
  isStuck?: boolean; // >7 days in current stage
  daysInCurrentStage?: number;
}

// ─── Ad performance ──────────────────────────────────────────────────────────

export interface AdCreative {
  platform: AdPlatform;
  campaignId: string;
  campaignName: string;
  adSetId?: string;
  adSetName?: string;
  adId: string;
  adName: string;
  thumbnailUrl?: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  bookings: number;
  revenue: number;
  ctr: number; // click-through rate %
  cpc: number; // cost per click
  cpl: number; // cost per lead
  cpb: number; // cost per booking (CPA for Google)
  roas: number;
  conversionRate: number; // leads → bookings %
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

export interface FunnelStage {
  board: BoardName;
  stage: AnyStage;
  order: number;
  count: number;
  cumulativeDropoff: number; // % lost vs stage 1
  stageDropoff: number; // % lost vs previous stage
  avgDaysInStage: number;
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export interface KPIData {
  totalLeads: number;
  totalBookings: number;
  overallConversionRate: number; // leads → booked %
  leadToSalesRate: number; // leads → sales board %
  salesToBookingRate: number; // sales → booked %
  avgDaysLeadToBooked: number;
  totalRevenue: number;
  totalAdSpend: number;
  roas: number;
  socoFee: number;
  costPerLead: number;
  costPerBooking: number;
  activeLeads: number;
  stuckLeads: number; // >7 days with no movement
  // deltas vs prior period
  deltaLeads?: number;
  deltaBookings?: number;
  deltaRoas?: number;
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export interface RevenueBreakdown {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2024"
  bookings: number;
  revenue: number;
  adSpend: number;
  roas: number;
  socoFee: number;
  profit: number;
}

// ─── Daily ad stats ───────────────────────────────────────────────────────────

export interface MetaDailyPoint {
  date: string; // YYYY-MM-DD
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface DashboardData {
  kpis: KPIData;
  funnel: FunnelStage[];
  creatives: AdCreative[];
  leads: Lead[];
  revenue: RevenueBreakdown[];
  metaDaily: MetaDailyPoint[];
  googleDaily: MetaDailyPoint[];
  dataSource: "live" | "mock";
  lastUpdated: string;
  apiStatus: {
    monday: "ok" | "error" | "unconfigured";
    meta: "ok" | "error" | "unconfigured";
    google: "ok" | "error" | "unconfigured";
  };
}

export interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}
