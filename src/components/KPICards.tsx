
import type { KPIData } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
  Wallet,
  BadgeDollarSign,
  Target,
  AlertTriangle,
} from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  deltaLabel?: string;
  icon: React.ReactNode;
  accent?: "brand" | "success" | "warning" | "danger" | "gold";
}

function KPICard({
  label,
  value,
  sub,
  delta,
  deltaLabel,
  icon,
  accent = "brand",
}: KPICardProps) {
  const accentMap = {
    brand: "from-brand/10 border-brand/20",
    success: "from-success/10 border-success/20",
    warning: "from-warning/10 border-warning/20",
    danger: "from-danger/10 border-danger/20",
    gold: "from-gold/10 border-gold/20",
  };
  const iconMap = {
    brand: "text-brand bg-brand/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
    gold: "text-gold bg-gold/10",
  };
  return (
    <div
      className={`card bg-gradient-to-br ${accentMap[accent]} relative overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconMap[accent]}`}>{icon}</div>
        {delta !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              delta >= 0
                ? "bg-success/15 text-success"
                : "bg-danger/15 text-danger"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
            {deltaLabel || ""}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary leading-none mb-1">
        {value}
      </div>
      <div className="text-xs text-text-secondary font-medium">{label}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function KPICards({ kpis }: { kpis: KPIData }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
        Key Performance Indicators
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard
          label="Total Leads"
          value={formatNumber(kpis.totalLeads)}
          sub={`${kpis.activeLeads} active`}
          delta={kpis.deltaLeads}
          icon={<Users size={16} />}
          accent="brand"
        />
        <KPICard
          label="Total Bookings"
          value={formatNumber(kpis.totalBookings)}
          sub={`${formatPercent(kpis.overallConversionRate)} conv.`}
          delta={kpis.deltaBookings}
          icon={<CalendarCheck size={16} />}
          accent="success"
        />
        <KPICard
          label="Conversion Rate"
          value={formatPercent(kpis.overallConversionRate)}
          sub={`${formatPercent(kpis.salesToBookingRate)} sales→book`}
          icon={<Target size={16} />}
          accent="brand"
        />
        <KPICard
          label="Avg Lead → Booked"
          value={`${kpis.avgDaysLeadToBooked}d`}
          sub="days to booking"
          icon={<Clock size={16} />}
          accent="warning"
        />
        <KPICard
          label="Revenue"
          value={formatCurrency(kpis.totalRevenue, "NOK", true)}
          sub={`${kpis.totalBookings} surgeries`}
          icon={<BadgeDollarSign size={16} />}
          accent="gold"
        />
        <KPICard
          label="Ad Spend"
          value={formatCurrency(kpis.totalAdSpend, "NOK", true)}
          sub={`CPL ${formatCurrency(kpis.costPerLead, "NOK")}`}
          icon={<Wallet size={16} />}
          accent="brand"
        />
        <KPICard
          label="ROAS"
          value={`${kpis.roas.toFixed(2)}×`}
          sub={`CPB ${formatCurrency(kpis.costPerBooking, "NOK", true)}`}
          delta={kpis.deltaRoas}
          deltaLabel="×"
          icon={<TrendingUp size={16} />}
          accent="success"
        />
        <KPICard
          label="Stuck Leads"
          value={formatNumber(kpis.stuckLeads)}
          sub=">7 days no movement"
          icon={<AlertTriangle size={16} />}
          accent={kpis.stuckLeads > 5 ? "danger" : "warning"}
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        <div className="card flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1">Lead → Sales board</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">
                {formatPercent(kpis.leadToSalesRate)}
              </div>
              <div className="flex-1 bg-bg-elevated rounded-full h-1.5">
                <div
                  className="bg-brand h-1.5 rounded-full"
                  style={{ width: `${kpis.leadToSalesRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="w-px h-8 bg-bg-border" />
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1">Sales → Booked</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">
                {formatPercent(kpis.salesToBookingRate)}
              </div>
              <div className="flex-1 bg-bg-elevated rounded-full h-1.5">
                <div
                  className="bg-success h-1.5 rounded-full"
                  style={{ width: `${kpis.salesToBookingRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-text-muted mb-1">Soco Fee (5k + 10%)</div>
            <div className="text-lg font-bold text-gold">
              {formatCurrency(kpis.socoFee, "NOK", true)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted mb-1">Net revenue</div>
            <div className="text-lg font-bold text-success">
              {formatCurrency(kpis.totalRevenue - kpis.socoFee - kpis.totalAdSpend, "NOK", true)}
            </div>
          </div>
        </div>

        <div className="card flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-text-muted mb-1">Cost per Lead</div>
            <div className="text-lg font-bold">
              {formatCurrency(kpis.costPerLead, "NOK")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted mb-1">Cost per Booking</div>
            <div className="text-lg font-bold text-brand">
              {formatCurrency(kpis.costPerBooking, "NOK")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
