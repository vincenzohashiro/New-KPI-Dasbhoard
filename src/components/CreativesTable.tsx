
import { useState } from "react";
import type { AdCreative } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  cn,
} from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

type SortKey = keyof Pick<
  AdCreative,
  "spend" | "leads" | "bookings" | "cpb" | "cpl" | "cpc" | "roas" | "ctr" | "conversionRate"
>;

interface Props {
  creatives: AdCreative[];
  compact?: boolean;
}

export function CreativesTable({ creatives, compact = false }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("cpb");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = creatives.filter(
    (c) => platformFilter === "all" || c.platform === platformFilter
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const displayData = compact ? sorted.slice(0, 5) : sorted;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowUpDown size={11} className="text-text-muted" />;
    return sortDir === "asc" ? (
      <ArrowUp size={11} className="text-brand" />
    ) : (
      <ArrowDown size={11} className="text-brand" />
    );
  }

  function Th({
    col,
    label,
    right,
  }: {
    col: SortKey;
    label: string;
    right?: boolean;
  }) {
    return (
      <th
        onClick={() => handleSort(col)}
        className={`text-xs font-medium uppercase tracking-wider text-text-secondary py-2 px-3 cursor-pointer hover:text-text-primary select-none ${
          right ? "text-right" : "text-left"
        }`}
      >
        <div
          className={`flex items-center gap-1 ${right ? "justify-end" : ""}`}
        >
          {label}
          <SortIcon col={col} />
        </div>
      </th>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-text-primary">
            {compact ? "Top Creatives" : "Ad Creatives Performance"}
          </h2>
          {!compact && (
            <p className="text-xs text-text-muted mt-0.5">
              Sorted by cost per booking — the key metric
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {["all", "meta", "google"].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                platformFilter === p
                  ? "bg-brand text-white"
                  : "bg-bg-elevated text-text-secondary hover:text-text-primary"
              )}
            >
              {p === "all" ? "All" : PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-border">
              <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2 px-3">
                Ad
              </th>
              <Th col="spend" label="Spend" right />
              <Th col="leads" label="Leads" right />
              <Th col="bookings" label="Bookings" right />
              <Th col="cpl" label="CPL" right />
              <Th col="cpc" label="CPC" right />
              <Th col="cpb" label="CPA/Booking" right />
              <Th col="conversionRate" label="CVR" right />
              <Th col="roas" label="ROAS" right />
              <Th col="ctr" label="CTR" right />
            </tr>
          </thead>
          <tbody>
            {displayData.map((c) => (
              <tr key={c.adId} className="border-b border-bg-border/50 hover:bg-bg-hover/40 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PLATFORM_COLORS[c.platform] }}
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary leading-tight max-w-xs truncate">
                        {c.adName}
                      </div>
                      <div className="text-xs text-text-muted leading-tight">
                        {c.campaignName}
                        {c.adSetName && (
                          <span className="text-text-muted/60">
                            {" "}
                            · {c.adSetName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-text-secondary text-xs">
                  {formatCurrency(c.spend, "DKK")}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                  {c.leads}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span
                    className={cn(
                      "font-semibold",
                      c.bookings >= 3
                        ? "text-success"
                        : c.bookings >= 1
                        ? "text-text-primary"
                        : "text-text-muted"
                    )}
                  >
                    {c.bookings}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-text-secondary">
                  {formatCurrency(c.cpl, "DKK")}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-text-secondary">
                  {formatCurrency(c.cpc, "DKK")}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span
                    className={cn(
                      "font-bold",
                      c.cpb === 0
                        ? "text-text-muted"
                        : c.cpb < 5000
                        ? "text-success"
                        : c.cpb < 10000
                        ? "text-warning"
                        : "text-danger"
                    )}
                  >
                    {c.cpb === 0
                      ? "—"
                      : formatCurrency(c.cpb, "DKK")}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs">
                  <span
                    className={cn(
                      c.conversionRate >= 10
                        ? "text-success"
                        : c.conversionRate >= 5
                        ? "text-text-primary"
                        : "text-text-muted"
                    )}
                  >
                    {c.conversionRate > 0
                      ? formatPercent(c.conversionRate)
                      : "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span
                    className={cn(
                      "font-medium",
                      c.roas >= 8
                        ? "text-success"
                        : c.roas >= 4
                        ? "text-text-primary"
                        : c.roas > 0
                        ? "text-warning"
                        : "text-text-muted"
                    )}
                  >
                    {c.roas > 0 ? `${c.roas.toFixed(1)}×` : "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-text-secondary">
                  {formatPercent(c.ctr)}
                </td>
              </tr>
            ))}
          </tbody>
          {displayData.length > 0 && (
            <tfoot>
              <tr className="border-t border-bg-border">
                <td className="py-2 px-3 text-xs text-text-muted font-medium">
                  Total ({displayData.length} ads)
                </td>
                <td className="py-2 px-3 text-right text-xs font-semibold tabular-nums">
                  {formatCurrency(
                    displayData.reduce((s, c) => s + c.spend, 0),
                    "DKK"
                  )}
                </td>
                <td className="py-2 px-3 text-right text-xs font-semibold tabular-nums">
                  {displayData.reduce((s, c) => s + c.leads, 0)}
                </td>
                <td className="py-2 px-3 text-right text-xs font-semibold tabular-nums text-success">
                  {displayData.reduce((s, c) => s + c.bookings, 0)}
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
