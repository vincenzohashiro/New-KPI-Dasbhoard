
import { useState, useMemo } from "react";
import type { Lead } from "@/lib/types";
import { BOARD_COLORS, PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/utils";
import { formatDate, formatCurrency, getBadgeColor, cn } from "@/lib/utils";
import { Search, X, ChevronDown, ChevronUp, Clock, AlertTriangle } from "lucide-react";

function LeadRow({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const isStuck = (lead.daysInCurrentStage || 0) > 7;
  const boardColor = BOARD_COLORS[lead.currentBoard];

  return (
    <>
      <tr
        className={cn(
          "border-b border-bg-border/50 hover:bg-bg-hover/40 transition-colors cursor-pointer",
          isStuck && "bg-warning/3"
        )}
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: PLATFORM_COLORS[lead.source] }}
            />
            <span className="font-medium text-text-primary">{lead.name}</span>
            {isStuck && (
              <AlertTriangle size={12} className="text-warning flex-shrink-0" />
            )}
          </div>
          {lead.email && (
            <div className="text-xs text-text-muted ml-3.5">{lead.email}</div>
          )}
        </td>
        <td className="py-2.5 px-3 text-xs">
          <span
            className="px-2 py-0.5 rounded-full font-medium capitalize"
            style={{
              backgroundColor: boardColor + "20",
              color: boardColor,
            }}
          >
            {lead.currentBoard}
          </span>
        </td>
        <td className="py-2.5 px-3 text-xs text-text-secondary">
          {lead.currentStage}
        </td>
        <td className="py-2.5 px-3 text-xs">
          <span className={cn("badge", getBadgeColor(lead.daysInCurrentStage || 0))}>
            <Clock size={10} />
            {lead.daysInCurrentStage}d
          </span>
        </td>
        <td className="py-2.5 px-3 text-xs text-text-muted">
          <div
            className="flex items-center gap-1"
            style={{ color: PLATFORM_COLORS[lead.source] }}
          >
            <div className="w-1 h-1 rounded-full bg-current" />
            {PLATFORM_LABELS[lead.source]}
          </div>
          {lead.campaignName && (
            <div className="text-text-muted/70 truncate max-w-32">
              {lead.campaignName}
            </div>
          )}
        </td>
        <td className="py-2.5 px-3 text-xs text-text-muted">
          {formatDate(lead.createdAt)}
        </td>
        <td className="py-2.5 px-3 text-xs">
          {lead.surgeryPrice ? (
            <span className="text-gold font-medium">
              {formatCurrency(lead.surgeryPrice, "DKK")}
            </span>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </td>
        <td className="py-2.5 px-3 text-text-muted">
          {expanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-bg-elevated/50">
          <td colSpan={8} className="px-6 py-4">
            <div className="flex items-start gap-4">
              {/* Mini timeline */}
              <div className="flex-1">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Stage History
                </div>
                <div className="flex items-center gap-0 overflow-x-auto">
                  {lead.stageHistory.map((event, idx) => {
                    const bc = BOARD_COLORS[event.board];
                    const isLast = idx === lead.stageHistory.length - 1;
                    return (
                      <div key={idx} className="flex items-center">
                        <div
                          className={cn(
                            "flex flex-col items-center px-2 py-1.5 rounded text-center",
                            isLast ? "opacity-100" : "opacity-70"
                          )}
                          style={{
                            backgroundColor: bc + "15",
                            borderLeft: isLast ? `2px solid ${bc}` : "none",
                          }}
                        >
                          <div
                            className="text-xs font-medium whitespace-nowrap"
                            style={{ color: bc }}
                          >
                            {event.stage}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">
                            {formatDate(event.enteredAt, "dd MMM")}
                            {event.daysSpent !== undefined && (
                              <span className="ml-1 text-text-muted/60">
                                ({isLast ? lead.daysInCurrentStage : event.daysSpent}d)
                              </span>
                            )}
                          </div>
                        </div>
                        {!isLast && (
                          <div className="text-text-muted mx-1 text-xs">→</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lead details */}
              <div className="flex-shrink-0 text-xs space-y-1 text-right">
                {lead.adName && (
                  <div>
                    <span className="text-text-muted">Ad: </span>
                    <span>{lead.adName}</span>
                  </div>
                )}
                {lead.bookingDate && (
                  <div>
                    <span className="text-text-muted">Booked: </span>
                    <span className="text-success">
                      {formatDate(lead.bookingDate)}
                    </span>
                  </div>
                )}
                {lead.surgeryDate && (
                  <div>
                    <span className="text-text-muted">Surgery: </span>
                    <span>{formatDate(lead.surgeryDate)}</span>
                  </div>
                )}
                {lead.grafts && (
                  <div>
                    <span className="text-text-muted">Grafts: </span>
                    <span>{lead.grafts.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function LeadSearch({ leads }: { leads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [stuckOnly, setStuckOnly] = useState(false);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (query) {
        const q = query.toLowerCase();
        const match =
          l.name.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.campaignName?.toLowerCase().includes(q) ||
          l.adName?.toLowerCase().includes(q) ||
          l.currentStage.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (boardFilter !== "all" && l.currentBoard !== boardFilter) return false;
      if (platformFilter !== "all" && l.source !== platformFilter) return false;
      if (stuckOnly && !l.isStuck) return false;
      return true;
    });
  }, [leads, query, boardFilter, platformFilter, stuckOnly]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search leads by name, email, campaign..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-bg-card border border-bg-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Board filter */}
        <div className="flex gap-1">
          {["all", "evaluation", "sales", "aftercare"].map((b) => (
            <button
              key={b}
              onClick={() => setBoardFilter(b)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                boardFilter === b
                  ? "bg-brand text-white"
                  : "bg-bg-card border border-bg-border text-text-secondary hover:text-text-primary"
              )}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Platform filter */}
        <div className="flex gap-1">
          {["all", "meta", "google", "organic"].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                platformFilter === p
                  ? "bg-brand text-white"
                  : "bg-bg-card border border-bg-border text-text-secondary hover:text-text-primary"
              )}
            >
              {p === "all" ? "All sources" : PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStuckOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            stuckOnly
              ? "bg-warning text-black"
              : "bg-bg-card border border-bg-border text-text-secondary hover:text-text-primary"
          )}
        >
          <AlertTriangle size={12} />
          Stuck only
        </button>

        <span className="text-xs text-text-muted ml-auto">
          {filtered.length} of {leads.length} leads
        </span>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  Lead
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  Board
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  Stage
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  In Stage
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  Source
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  Created
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-3">
                  Value
                </th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-text-muted text-sm"
                  >
                    No leads match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
