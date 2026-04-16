import type { AdCreative } from "@/lib/types";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";

interface PlatformSummary {
  spend: number;
  clicks: number;
  impressions: number;
  leads: number;
  bookings: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;        // cost per acquisition (booking)
  cvr: number;        // conversion rate leads → bookings
  conversions: number; // alias for leads (Google terminology)
}

function summarise(creatives: AdCreative[]): PlatformSummary {
  const spend       = creatives.reduce((s, c) => s + c.spend, 0);
  const clicks      = creatives.reduce((s, c) => s + c.clicks, 0);
  const impressions = creatives.reduce((s, c) => s + c.impressions, 0);
  const leads       = creatives.reduce((s, c) => s + c.leads, 0);
  const bookings    = creatives.reduce((s, c) => s + c.bookings, 0);

  return {
    spend,
    clicks,
    impressions,
    leads,
    bookings,
    conversions: leads,
    ctr:  impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc:  clicks  > 0 ? spend / clicks  : 0,
    cpl:  leads   > 0 ? spend / leads   : 0,
    cpa:  bookings > 0 ? spend / bookings : 0,
    cvr:  leads   > 0 ? (bookings / leads) * 100 : 0,
  };
}

interface StatRowProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: "good" | "warn" | "neutral";
}

function StatRow({ label, value, sub, highlight = "neutral" }: StatRowProps) {
  const valueClass =
    highlight === "good"
      ? "text-success"
      : highlight === "warn"
      ? "text-warning"
      : "text-text-primary";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-bg-border last:border-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
          {value}
        </span>
        {sub && (
          <div className="text-xs text-text-muted">{sub}</div>
        )}
      </div>
    </div>
  );
}

interface PlatformCardProps {
  title: string;
  subtitle: string;
  accentColor: string;
  summary: PlatformSummary;
  isGoogle?: boolean;
}

function PlatformCard({ title, subtitle, accentColor, summary, isGoogle = false }: PlatformCardProps) {
  return (
    <div className="card flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-1 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <div>
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-text-muted">Total Spend</div>
          <div className="text-sm font-bold text-text-primary">
            {formatCurrency(summary.spend, "DKK", true)}
          </div>
        </div>
      </div>

      {/* Stats */}
      {isGoogle ? (
        // Google: CPA, Conversions, CVR, CTR, CPC
        <>
          <StatRow
            label="CPA (Cost per Acquisition)"
            value={summary.cpa > 0 ? formatCurrency(summary.cpa, "DKK") : "—"}
            sub={`${summary.bookings} bookings`}
            highlight={summary.cpa > 0 && summary.cpa < 8000 ? "good" : summary.cpa > 12000 ? "warn" : "neutral"}
          />
          <StatRow
            label="Conversions (Leads)"
            value={formatNumber(summary.conversions)}
            sub={`${formatNumber(summary.impressions)} impressions`}
          />
          <StatRow
            label="CVR (Conversion Rate)"
            value={summary.cvr > 0 ? formatPercent(summary.cvr) : "—"}
            sub="leads → bookings"
            highlight={summary.cvr >= 10 ? "good" : summary.cvr >= 5 ? "neutral" : "warn"}
          />
          <StatRow
            label="CTR (Click-Through Rate)"
            value={formatPercent(summary.ctr)}
            sub={`${formatNumber(summary.clicks)} clicks`}
            highlight={summary.ctr >= 5 ? "good" : summary.ctr >= 2 ? "neutral" : "warn"}
          />
          <StatRow
            label="CPC (Cost per Click)"
            value={formatCurrency(summary.cpc, "DKK")}
            highlight={summary.cpc < 15 ? "good" : summary.cpc < 25 ? "neutral" : "warn"}
          />
        </>
      ) : (
        // Meta: CPL, Leads, CVR, CTR, CPC
        <>
          <StatRow
            label="CPL (Cost per Lead)"
            value={summary.cpl > 0 ? formatCurrency(summary.cpl, "DKK") : "—"}
            sub={`${summary.leads} leads total`}
            highlight={summary.cpl > 0 && summary.cpl < 700 ? "good" : summary.cpl > 1000 ? "warn" : "neutral"}
          />
          <StatRow
            label="Leads (Volume)"
            value={formatNumber(summary.leads)}
            sub={`${formatNumber(summary.impressions)} impressions`}
          />
          <StatRow
            label="CVR (Conversion Rate)"
            value={summary.cvr > 0 ? formatPercent(summary.cvr) : "—"}
            sub="leads → bookings"
            highlight={summary.cvr >= 10 ? "good" : summary.cvr >= 5 ? "neutral" : "warn"}
          />
          <StatRow
            label="CTR (Link Click-Through Rate)"
            value={formatPercent(summary.ctr)}
            sub={`${formatNumber(summary.clicks)} link clicks`}
            highlight={summary.ctr >= 3 ? "good" : summary.ctr >= 1.5 ? "neutral" : "warn"}
          />
          <StatRow
            label="CPC (Cost per Link Click)"
            value={formatCurrency(summary.cpc, "DKK")}
            highlight={summary.cpc < 15 ? "good" : summary.cpc < 25 ? "neutral" : "warn"}
          />
        </>
      )}
    </div>
  );
}

export function PlatformStats({ creatives }: { creatives: AdCreative[] }) {
  const google = summarise(creatives.filter((c) => c.platform === "google"));
  const meta   = summarise(creatives.filter((c) => c.platform === "meta"));

  const hasGoogle = creatives.some((c) => c.platform === "google");
  const hasMeta   = creatives.some((c) => c.platform === "meta");

  if (!hasGoogle && !hasMeta) return null;

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
        Platform Performance
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hasGoogle && (
          <PlatformCard
            title="Google Ads"
            subtitle="Search + PMax"
            accentColor="#4285F4"
            summary={google}
            isGoogle
          />
        )}
        {hasMeta && (
          <PlatformCard
            title="Meta Ads"
            subtitle="Facebook & Instagram"
            accentColor="#1877F2"
            summary={meta}
            isGoogle={false}
          />
        )}
      </div>
    </div>
  );
}
