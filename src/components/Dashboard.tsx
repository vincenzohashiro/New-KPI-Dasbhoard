import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getMockDashboardData } from "@/lib/mock-data";
import { KPICards } from "./KPICards";
import { FunnelSection } from "./FunnelSection";
import { CreativesTable } from "./CreativesTable";
import { SalesPipeline } from "./SalesPipeline";
import { LeadSearch } from "./LeadSearch";
import { AftercareSection } from "./AftercareSection";
import { RevenueSection } from "./RevenueSection";
import { PlatformStats } from "./PlatformStats";
import { MetaOverview } from "./MetaOverview";
import { GoogleOverview } from "./GoogleOverview";
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
  Database,
  Zap,
} from "lucide-react";

// ── Source tabs ──────────────────────────────────────────────────────────────
type SourceId = "live" | "monday" | "meta" | "google" | "demo";

const SOURCES: Array<{ id: SourceId; label: string }> = [
  { id: "live",   label: "Live" },
  { id: "monday", label: "Monday" },
  { id: "meta",   label: "Meta Ads" },
  { id: "google", label: "Google Ads" },
  { id: "demo",   label: "Demo Data" },
];

// ── Content tabs (under Monday / Demo sources) ───────────────────────────────
const TABS = [
  { id: "overview",  label: "Overview",       icon: LayoutDashboard },
  { id: "funnel",    label: "Funnel",          icon: GitFork },
  { id: "pipeline",  label: "Sales Pipeline",  icon: Kanban },
  { id: "leads",     label: "Lead Search",     icon: Search },
  { id: "aftercare", label: "Aftercare",       icon: HeartPulse },
  { id: "revenue",   label: "Revenue",         icon: TrendingUp },
  { id: "creatives", label: "Creatives",       icon: Megaphone },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Status badge on source tab ───────────────────────────────────────────────
function ApiStatusBadge({
  status,
  active,
}: {
  status: "ok" | "error" | "unconfigured" | undefined;
  active?: boolean;
}) {
  if (!status) return null;
  if (status === "ok")
    return <CheckCircle2 size={13} className={active ? "text-white/80" : "text-success"} />;
  if (status === "error")
    return <AlertCircle size={13} className={active ? "text-white/80" : "text-danger"} />;
  return <Circle size={13} className={active ? "text-white/40" : "text-text-muted opacity-60"} />;
}

// ── Placeholder for unconnected sources ─────────────────────────────────────
function NotConnected({ source, envVars }: { source: string; envVars: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center">
        <Circle size={24} className="text-text-muted" />
      </div>
      <div>
        <p className="text-text-primary font-semibold text-lg">{source} not connected</p>
        <p className="text-text-muted text-sm mt-1 max-w-sm">
          Add your API credentials to Vercel environment variables and redeploy.
        </p>
      </div>
      <div className="mt-2 bg-bg-elevated border border-bg-border rounded-lg px-5 py-3 text-left">
        <p className="text-xs text-text-muted mb-2 font-medium">Required env vars:</p>
        {envVars.map((v) => (
          <p key={v} className="text-xs font-mono text-text-secondary">{v}</p>
        ))}
      </div>
    </div>
  );
}

// ── Live: platform connection status cards ───────────────────────────────────
type ApiStatus = "ok" | "error" | "unconfigured";

function PlatformCard({
  name, letter, status, description, envVars,
}: {
  name: string;
  letter: string;
  status: ApiStatus;
  description: string;
  envVars?: string[];
}) {
  const isOk = status === "ok";
  const isErr = status === "error";
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${
      isOk  ? "border-success/30 bg-success/5"
            : isErr ? "border-danger/30 bg-danger/5"
            : "border-bg-border bg-bg-elevated"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
            isOk ? "bg-success/20 text-success" : isErr ? "bg-danger/20 text-danger" : "bg-bg-border text-text-muted"
          }`}>
            {letter}
          </div>
          <span className="font-semibold text-sm text-text-primary">{name}</span>
        </div>
        {isOk  && <CheckCircle2 size={16} className="text-success" />}
        {isErr && <AlertCircle  size={16} className="text-danger"  />}
        {!isOk && !isErr && <Circle size={16} className="text-text-muted" />}
      </div>
      <p className="text-xs text-text-muted">{description}</p>
      {!isOk && envVars && (
        <div className="pt-1 border-t border-bg-border">
          <p className="text-xs text-text-muted mb-1.5 font-medium">Required env vars:</p>
          {envVars.map((v) => (
            <p key={v} className="text-xs font-mono text-text-secondary leading-relaxed">{v}</p>
          ))}
        </div>
      )}
      {isOk && (
        <span className="text-xs text-success font-medium">Connected</span>
      )}
    </div>
  );
}

function LivePlatformStatus({ apiStatus }: { apiStatus: { monday: ApiStatus; meta: ApiStatus; google: ApiStatus } | undefined }) {
  const s = apiStatus ?? { monday: "unconfigured", meta: "unconfigured", google: "unconfigured" };
  return (
    <div className="rounded-xl border border-bg-border bg-bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={15} className="text-brand" />
        <span className="font-semibold text-sm text-text-primary">Data Sources</span>
        <span className="text-xs text-text-muted ml-1">— connect all three for full live data</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlatformCard
          name="Monday.com" letter="M" status={s.monday}
          description="Lead pipeline, funnel stages & aftercare tracking"
        />
        <PlatformCard
          name="Meta Ads" letter="f" status={s.meta}
          description="Facebook & Instagram ad spend, leads, CPL and ROAS"
          envVars={["VITE_META_ACCESS_TOKEN", "VITE_META_AD_ACCOUNT_ID"]}
        />
        <PlatformCard
          name="Google Ads" letter="G" status={s.google}
          description="Search & display ad conversions, CPA and keyword performance"
          envVars={["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"]}
        />
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const [source, setSource]       = useState<SourceId>("live");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dateRange] = useState({
    since: "2024-01-01",
    until: new Date().toISOString().slice(0, 10),
  });

  const { data: liveData, isLoading, isError, refetch, isFetching } = useDashboardData(
    dateRange.since,
    dateRange.until
  );

  // For the Demo tab, always use mock data
  const demoData = getMockDashboardData();
  const data = source === "demo" ? demoData : liveData;

  const apiStatus = liveData?.apiStatus;

  function sourceStatus(id: SourceId): "ok" | "error" | "unconfigured" | undefined {
    if (id === "demo") return undefined;
    if (!apiStatus) return undefined;
    if (id === "live") {
      // green if at least one source is working
      const any = [apiStatus.monday, apiStatus.meta, apiStatus.google].some(s => s === "ok");
      return any ? "ok" : "unconfigured";
    }
    if (id === "monday") return apiStatus.monday;
    if (id === "meta")   return apiStatus.meta;
    if (id === "google") return apiStatus.google;
  }

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
                <div className="text-text-muted text-xs mt-0.5">KPI Dashboard</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {data && source !== "demo" && !isFetching && (
                <span className="text-xs text-text-muted hidden md:block">
                  Updated {formatDate(data.lastUpdated, "HH:mm")}
                </span>
              )}
              {isFetching && !isLoading && source !== "demo" && (
                <span className="flex items-center gap-1.5 text-xs text-brand hidden md:block">
                  <RefreshCw size={11} className="animate-spin inline-block" />
                  {" "}Syncing…
                </span>
              )}
              {source !== "demo" && (
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                  Refresh
                </button>
              )}
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

      {/* ── Source tabs ── */}
      <div className="border-b border-bg-border bg-bg-card">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex gap-1 py-2">
            {SOURCES.map((s) => {
              const status = sourceStatus(s.id);
              const isActive = source === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  <ApiStatusBadge status={status} active={isActive} />
                  {s.id === "live" && <Zap size={13} className={isActive ? "text-white" : "text-text-muted"} />}
                  {s.id === "demo" && <Database size={13} className={isActive ? "text-white" : "text-text-muted"} />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content tabs (for live + monday + demo sources) ── */}
      {(source === "live" || source === "monday" || source === "demo") && (
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
      )}

      {/* ── Main content ── */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6">

        {/* Meta not connected */}
        {source === "meta" && apiStatus?.meta !== "ok" && (
          <NotConnected
            source="Meta Ads"
            envVars={["VITE_META_ACCESS_TOKEN", "VITE_META_AD_ACCOUNT_ID"]}
          />
        )}

        {/* Google not connected */}
        {source === "google" && apiStatus?.google !== "ok" && (
          <NotConnected
            source="Google Ads"
            envVars={[
              "GOOGLE_ADS_DEVELOPER_TOKEN",
              "GOOGLE_ADS_CLIENT_ID",
              "GOOGLE_ADS_CLIENT_SECRET",
              "GOOGLE_ADS_REFRESH_TOKEN",
              "GOOGLE_ADS_CUSTOMER_ID",
            ]}

          />
        )}

        {/* Loading / error (Monday + Live) */}
        {(source === "monday" || source === "live") && isLoading && (
          <div className="flex items-center justify-center py-32 text-text-secondary">
            <RefreshCw size={20} className="animate-spin mr-3" />
            Loading data...
          </div>
        )}
        {source === "monday" && isError && (
          <div className="flex items-center justify-center py-32 text-danger">
            <AlertCircle size={20} className="mr-3" />
            Failed to load Monday data. Check your API configuration.
          </div>
        )}

        {/* Demo banner */}
        {source === "demo" && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              <strong>Example data only</strong> — numbers below are fictional and for layout preview purposes. Switch to the Live tab to see real data.
            </span>
          </div>
        )}

        {/* ── LIVE tab content ── */}
        {(source === "live") && !isLoading && (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <LivePlatformStatus apiStatus={liveData?.apiStatus} />
                {liveData && (
                  <>
                    <KPICards kpis={liveData.kpis} />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <FunnelSection funnel={liveData.funnel} compact />
                      <RevenueSection revenue={liveData.revenue} kpis={liveData.kpis} compact />
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === "funnel"    && liveData && <FunnelSection funnel={liveData.funnel} />}
            {activeTab === "pipeline"  && liveData && <SalesPipeline leads={liveData.leads} />}
            {activeTab === "leads"     && liveData && <LeadSearch leads={liveData.leads} />}
            {activeTab === "aftercare" && liveData && <AftercareSection leads={liveData.leads} />}
            {activeTab === "revenue"   && liveData && <RevenueSection revenue={liveData.revenue} kpis={liveData.kpis} />}
            {activeTab === "creatives" && (
              <div className="space-y-6">
                {liveData && liveData.creatives.length > 0
                  ? <CreativesTable creatives={liveData.creatives} />
                  : (
                    <div className="rounded-xl border border-bg-border bg-bg-elevated p-10 text-center">
                      <Megaphone size={24} className="text-text-muted mx-auto mb-3" />
                      <p className="text-text-primary font-medium">No ad creatives yet</p>
                      <p className="text-text-muted text-sm mt-1">Connect Meta Ads or Google Ads to see creative performance here.</p>
                    </div>
                  )
                }
              </div>
            )}
          </>
        )}

        {/* ── MONDAY tab content ── */}
        {data && source === "monday" && !isError && (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <KPICards kpis={data.kpis} />
                <PlatformStats creatives={data.creatives} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <FunnelSection funnel={data.funnel} compact />
                  <RevenueSection revenue={data.revenue} kpis={data.kpis} compact />
                </div>
                <CreativesTable creatives={data.creatives} compact />
              </div>
            )}
            {activeTab === "funnel"    && <FunnelSection funnel={data.funnel} />}
            {activeTab === "pipeline"  && <SalesPipeline leads={data.leads} />}
            {activeTab === "leads"     && <LeadSearch leads={data.leads} />}
            {activeTab === "aftercare" && <AftercareSection leads={data.leads} />}
            {activeTab === "revenue"   && <RevenueSection revenue={data.revenue} kpis={data.kpis} />}
            {activeTab === "creatives" && <CreativesTable creatives={data.creatives} />}
          </>
        )}

        {/* ── DEMO tab content ── */}
        {data && source === "demo" && (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <KPICards kpis={data.kpis} />
                <PlatformStats creatives={data.creatives} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <FunnelSection funnel={data.funnel} compact />
                  <RevenueSection revenue={data.revenue} kpis={data.kpis} compact />
                </div>
                <CreativesTable creatives={data.creatives} compact />
              </div>
            )}
            {activeTab === "funnel"    && <FunnelSection funnel={data.funnel} />}
            {activeTab === "pipeline"  && <SalesPipeline leads={data.leads} />}
            {activeTab === "leads"     && <LeadSearch leads={data.leads} />}
            {activeTab === "aftercare" && <AftercareSection leads={data.leads} />}
            {activeTab === "revenue"   && <RevenueSection revenue={data.revenue} kpis={data.kpis} />}
            {activeTab === "creatives" && <CreativesTable creatives={data.creatives} />}
          </>
        )}

        {/* Meta connected content */}
        {source === "meta" && apiStatus?.meta === "ok" && data && (
          <div className="space-y-6">
            <MetaOverview
              creatives={data.creatives.filter((c) => c.platform === "meta")}
              daily={data.metaDaily}
              leads={data.leads}
            />
            <CreativesTable creatives={data.creatives.filter((c) => c.platform === "meta")} />
          </div>
        )}

        {/* Google connected content */}
        {source === "google" && apiStatus?.google === "ok" && data && (
          <div className="space-y-6">
            <GoogleOverview
              creatives={data.creatives.filter((c) => c.platform === "google")}
              daily={data.googleDaily}
              leads={data.leads}
            />
            <CreativesTable creatives={data.creatives.filter((c) => c.platform === "google")} />
          </div>
        )}
      </main>

      <div id="settings" />
    </div>
  );
}
