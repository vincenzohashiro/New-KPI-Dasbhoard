import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { KPICards } from "./KPICards";
import { FunnelSection } from "./FunnelSection";
import { CreativesTable } from "./CreativesTable";
import { SalesPipeline } from "./SalesPipeline";
import { LeadSearch } from "./LeadSearch";
import { AftercareSection } from "./AftercareSection";
import { RevenueSection } from "./RevenueSection";
import { formatDate } from "@/lib/utils";
import {
  LayoutDashboard,
  GitFork,
  Megaphone,
  Kanban,
  Search,
  HeartPulse,
  TrendingUp,
  RefreshCw,
  Circle,
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "funnel", label: "Funnel", icon: GitFork },
  { id: "creatives", label: "Creatives", icon: Megaphone },
  { id: "pipeline", label: "Sales Pipeline", icon: Kanban },
  { id: "leads", label: "Lead Search", icon: Search },
  { id: "aftercare", label: "Aftercare", icon: HeartPulse },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StatusDot({
  status,
  label,
}: {
  status: "ok" | "error" | "unconfigured";
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === "ok" && <CheckCircle2 size={12} className="text-success" />}
      {status === "error" && <AlertCircle size={12} className="text-danger" />}
      {status === "unconfigured" && (
        <Circle size={12} className="text-text-muted" />
      )}
      <span
        className={
          status === "ok"
            ? "text-success"
            : status === "error"
            ? "text-danger"
            : "text-text-muted"
        }
      >
        {label}
      </span>
    </div>
  );
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dateRange] = useState({
    since: "2024-01-01",
    until: new Date().toISOString().slice(0, 10),
  });

  const { data, isLoading, isError, refetch, isFetching } = useDashboardData(
    dateRange.since,
    dateRange.until
  );

  return (
    <div className="min-h-screen bg-bg-base">
      {/* ── Header ── */}
      <header className="border-b border-bg-border bg-bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <div className="font-semibold text-text-primary text-sm leading-none">
                  Haareksperten
                </div>
                <div className="text-text-muted text-xs mt-0.5">
                  Lead Dashboard
                </div>
              </div>
            </div>

            {/* API Status */}
            {data && (
              <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-lg bg-bg-elevated border border-bg-border">
                <StatusDot
                  status={data.apiStatus.monday}
                  label="Monday"
                />
                <div className="w-px h-3 bg-bg-border" />
                <StatusDot status={data.apiStatus.meta} label="Meta" />
                <div className="w-px h-3 bg-bg-border" />
                <StatusDot
                  status={data.apiStatus.google}
                  label="Google Ads"
                />
                {data.dataSource === "mock" && (
                  <>
                    <div className="w-px h-3 bg-bg-border" />
                    <span className="text-xs text-warning font-medium">
                      Demo data
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {data && (
                <span className="text-xs text-text-muted hidden md:block">
                  Updated {formatDate(data.lastUpdated, "HH:mm")}
                </span>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={isFetching ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <a
                href="#settings"
                className="p-1.5 rounded-lg hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors"
              >
                <Settings size={16} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <nav className="border-b border-bg-border bg-bg-card/60">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-brand text-brand"
                      : "border-transparent text-text-secondary hover:text-text-primary hover:border-bg-border"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-32 text-text-secondary">
            <RefreshCw size={20} className="animate-spin mr-3" />
            Loading dashboard...
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-32 text-danger">
            <AlertCircle size={20} className="mr-3" />
            Failed to load data. Check your API configuration.
          </div>
        )}

        {data && (
          <>
            {/* Overview always shows KPIs */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <KPICards kpis={data.kpis} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <FunnelSection
                    funnel={data.funnel}
                    compact
                  />
                  <RevenueSection
                    revenue={data.revenue}
                    kpis={data.kpis}
                    compact
                  />
                </div>
                <CreativesTable creatives={data.creatives} compact />
              </div>
            )}

            {activeTab === "funnel" && (
              <FunnelSection funnel={data.funnel} />
            )}

            {activeTab === "creatives" && (
              <CreativesTable creatives={data.creatives} />
            )}

            {activeTab === "pipeline" && (
              <SalesPipeline leads={data.leads} />
            )}

            {activeTab === "leads" && (
              <LeadSearch leads={data.leads} />
            )}

            {activeTab === "aftercare" && (
              <AftercareSection leads={data.leads} />
            )}

            {activeTab === "revenue" && (
              <RevenueSection revenue={data.revenue} kpis={data.kpis} />
            )}
          </>
        )}
      </main>

      {/* ── Settings anchor ── */}
      <div id="settings" />
    </div>
  );
}
