import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AdCreative, MetaDailyPoint, Lead } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const BLUE   = "#1877F2";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";

// ── KPI summary cards ─────────────────────────────────────────────────────────
function MetaKPICards({ creatives }: { creatives: AdCreative[] }) {
  const spend       = creatives.reduce((s, c) => s + c.spend, 0);
  const leads       = creatives.reduce((s, c) => s + c.leads, 0);
  const impressions = creatives.reduce((s, c) => s + c.impressions, 0);
  const clicks      = creatives.reduce((s, c) => s + c.clicks, 0);
  const cpl  = leads   > 0 ? spend / leads   : 0;
  const ctr  = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc  = clicks  > 0 ? spend / clicks  : 0;

  const cards = [
    { label: "Total Spend",   value: formatCurrency(spend,       "DKK", true), color: "text-[#1877F2]" },
    { label: "Leads",         value: formatNumber(leads),                        color: "text-success" },
    { label: "CPL",           value: formatCurrency(cpl,         "DKK"),         color: "text-text-primary" },
    { label: "Impressions",   value: formatNumber(impressions,   true),           color: "text-text-primary" },
    { label: "CTR",           value: formatPercent(ctr, 2),                      color: ctr >= 2 ? "text-success" : "text-warning" },
    { label: "CPC",           value: formatCurrency(cpc,         "DKK"),         color: "text-text-primary" },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {cards.map(c => (
        <div key={c.label} className="card text-center py-3">
          <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
          <div className="text-xs text-text-muted mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Spend & Leads over time ───────────────────────────────────────────────────
const chartStyle = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

function SpendLeadsChart({ daily }: { daily: MetaDailyPoint[] }) {
  if (daily.length === 0) return null;

  const data = daily.map(d => ({
    date:   d.date.slice(5),   // "MM-DD"
    spend:  Math.round(d.spend),
    leads:  d.leads,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm text-text-primary">Spend & Leads Over Time</h3>
          <p className="text-xs text-text-muted">Last 90 days</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="w-3 h-0.5 rounded" style={{ background: BLUE }} />
            Spend
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="w-3 h-0.5 rounded" style={{ background: GREEN }} />
            Leads
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BLUE}  stopOpacity={0.25} />
              <stop offset="95%" stopColor={BLUE}  stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={GREEN} stopOpacity={0.25} />
              <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} interval={13} />
          <YAxis yAxisId="spend" orientation="left"  tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} tickFormatter={v => `${Math.round(v / 1000)}k`} />
          <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={chartStyle}
            formatter={(v: any, name: string) => [
              name === "spend" ? formatCurrency(v, "DKK") : v,
              name === "spend" ? "Spend" : "Leads",
            ]}
          />
          <Area yAxisId="spend" type="monotone" dataKey="spend" stroke={BLUE}  strokeWidth={2} fill="url(#gSpend)" dot={false} />
          <Area yAxisId="leads" type="monotone" dataKey="leads" stroke={GREEN} strokeWidth={2} fill="url(#gLeads)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Top campaigns bar chart ───────────────────────────────────────────────────
function CampaignChart({ creatives }: { creatives: AdCreative[] }) {
  const map = new Map<string, { name: string; spend: number; leads: number }>();
  for (const c of creatives) {
    const e = map.get(c.campaignId);
    if (e) { e.spend += c.spend; e.leads += c.leads; }
    else map.set(c.campaignId, { name: c.campaignName, spend: c.spend, leads: c.leads });
  }

  const data = Array.from(map.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8)
    .map(c => ({
      name:  c.name.length > 28 ? c.name.slice(0, 28) + "…" : c.name,
      spend: Math.round(c.spend),
      leads: c.leads,
    }));

  return (
    <div className="card">
      <h3 className="font-semibold text-sm text-text-primary mb-4">Top Campaigns</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} tickFormatter={v => `${Math.round(v / 1000)}k`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} width={130} />
          <Tooltip
            contentStyle={chartStyle}
            formatter={(v: any, name: string) => [
              name === "spend" ? formatCurrency(v, "DKK") : v,
              name === "spend" ? "Spend" : "Leads",
            ]}
          />
          <Bar dataKey="spend" fill={BLUE}  radius={[0, 3, 3, 0]} maxBarSize={16} />
          <Bar dataKey="leads" fill={GREEN} radius={[0, 3, 3, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1 justify-end">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="w-3 h-2 rounded-sm" style={{ background: BLUE }} /> Spend
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="w-3 h-2 rounded-sm" style={{ background: GREEN }} /> Leads
        </div>
      </div>
    </div>
  );
}

// ── Meta → Monday pipeline ────────────────────────────────────────────────────
function PipelineBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-semibold text-text-primary tabular-nums">
          {count} <span className="text-text-muted font-normal">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="bg-bg-elevated rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MetaPipeline({ leads }: { leads: Lead[] }) {
  const metaLeads  = leads.filter(l => l.source === "meta");
  const total      = metaLeads.length;
  const evaluation = metaLeads.filter(l => l.currentBoard === "evaluation").length;
  const sales      = metaLeads.filter(l => l.currentBoard === "sales").length;
  const booked     = metaLeads.filter(l => l.currentBoard === "aftercare").length;
  const stuck      = metaLeads.filter(l => l.isStuck).length;

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-sm text-text-primary">Meta → Monday Pipeline</h3>
        <p className="text-xs text-text-muted mt-0.5">
          {total} leads from Meta tracked in Monday CRM
        </p>
      </div>

      {total === 0 ? (
        <p className="text-xs text-text-muted text-center py-6">
          No Meta leads found in Monday yet — make sure the "Source" column in Monday is set to Meta/Facebook for these leads.
        </p>
      ) : (
        <>
          <div className="space-y-3">
            <PipelineBar label="In Evaluation"   count={evaluation} total={total} color={BLUE}  />
            <PipelineBar label="In Sales"         count={sales}      total={total} color={AMBER} />
            <PipelineBar label="Booked / Surgery" count={booked}     total={total} color={GREEN} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-bg-border">
            <div className="text-center">
              <div className="text-xl font-bold text-success">
                {total > 0 ? formatPercent((booked / total) * 100) : "—"}
              </div>
              <div className="text-xs text-text-muted">Conversion rate</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${stuck > 5 ? "text-danger" : "text-warning"}`}>
                {stuck}
              </div>
              <div className="text-xs text-text-muted">Stuck &gt;7 days</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────
export function MetaOverview({
  creatives,
  daily,
  leads,
}: {
  creatives: AdCreative[];
  daily: MetaDailyPoint[];
  leads: Lead[];
}) {
  return (
    <div className="space-y-6">
      <MetaKPICards creatives={creatives} />
      <SpendLeadsChart daily={daily} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CampaignChart creatives={creatives} />
        <MetaPipeline leads={leads} />
      </div>
    </div>
  );
}
