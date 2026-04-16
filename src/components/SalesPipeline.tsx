
import { useState } from "react";
import type { Lead } from "@/lib/types";
import { SALES_STAGES } from "@/lib/types";
import {
  formatDate,
  formatDateShort,
  getBadgeColor,
  getStuckColor,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
} from "@/lib/utils";
import { AlertTriangle, Clock, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function LeadCard({
  lead,
  onSelect,
}: {
  lead: Lead;
  onSelect: (l: Lead) => void;
}) {
  const isStuck = (lead.daysInCurrentStage || 0) > 7;
  const isVerystuck = (lead.daysInCurrentStage || 0) > 14;

  return (
    <div
      onClick={() => onSelect(lead)}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all hover:border-brand/50 hover:bg-bg-hover",
        isVerystuck
          ? "border-danger/30 bg-danger/5"
          : isStuck
          ? "border-warning/30 bg-warning/5"
          : "border-bg-border bg-bg-elevated"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor:
                PLATFORM_COLORS[lead.source] || PLATFORM_COLORS.other,
            }}
          />
          <span className="font-medium text-sm text-text-primary truncate">
            {lead.name}
          </span>
        </div>
        {isStuck && (
          <AlertTriangle
            size={13}
            className={isVerystuck ? "text-danger" : "text-warning"}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Clock size={11} />
        <span className={cn(getStuckColor(lead.daysInCurrentStage || 0))}>
          {lead.daysInCurrentStage}d here
        </span>
        {lead.campaignName && (
          <>
            <span className="text-text-muted/50">·</span>
            <span className="truncate">{lead.campaignName}</span>
          </>
        )}
      </div>
    </div>
  );
}

function LeadJourneyModal({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-bg-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-bg-border flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-text-primary text-lg">
              {lead.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
              {lead.email && <span>{lead.email}</span>}
              {lead.phone && <span>{lead.phone}</span>}
              <span className="capitalize">{lead.country || "—"}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {/* Source */}
          <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-bg-elevated border border-bg-border">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PLATFORM_COLORS[lead.source] }}
            />
            <div className="text-xs">
              <span className="text-text-muted">Source: </span>
              <span className="font-medium">{PLATFORM_LABELS[lead.source]}</span>
              {lead.campaignName && (
                <>
                  <span className="text-text-muted"> · </span>
                  <span>{lead.campaignName}</span>
                </>
              )}
              {lead.adName && (
                <>
                  <span className="text-text-muted"> · </span>
                  <span>{lead.adName}</span>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Full Journey
          </h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-bg-border" />
            <div className="space-y-3">
              {lead.stageHistory.map((event, idx) => {
                const isLast = idx === lead.stageHistory.length - 1;
                const boardColor = {
                  evaluation: "#6366f1",
                  sales: "#f59e0b",
                  aftercare: "#10b981",
                }[event.board];

                return (
                  <div key={idx} className="flex items-start gap-4 pl-0">
                    <div
                      className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                      style={{
                        backgroundColor: boardColor + "20",
                        borderColor: isLast ? boardColor : boardColor + "60",
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: boardColor }}
                      />
                    </div>
                    <div className="flex-1 pt-1 pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-text-primary">
                            {event.stage}
                          </span>
                          <span
                            className="ml-2 text-xs capitalize px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: boardColor + "20",
                              color: boardColor,
                            }}
                          >
                            {event.board}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted text-right">
                          {formatDate(event.enteredAt, "dd MMM yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                        {event.daysSpent !== undefined && (
                          <span>
                            {isLast
                              ? `${lead.daysInCurrentStage}d so far`
                              : `${event.daysSpent}d spent`}
                          </span>
                        )}
                        {event.exitedAt && (
                          <span>→ {formatDate(event.exitedAt, "dd MMM")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Surgery info */}
          {(lead.surgeryPrice || lead.bookingDate || lead.surgeryDate) && (
            <div className="mt-5 pt-4 border-t border-bg-border grid grid-cols-3 gap-4 text-center">
              {lead.surgeryPrice && (
                <div>
                  <div className="text-xs text-text-muted mb-1">Surgery Price</div>
                  <div className="font-bold text-gold">
                    DKK {lead.surgeryPrice.toLocaleString()}
                  </div>
                </div>
              )}
              {lead.bookingDate && (
                <div>
                  <div className="text-xs text-text-muted mb-1">Booked</div>
                  <div className="font-bold">
                    {formatDate(lead.bookingDate)}
                  </div>
                </div>
              )}
              {lead.surgeryDate && (
                <div>
                  <div className="text-xs text-text-muted mb-1">Surgery</div>
                  <div className="font-bold">
                    {formatDate(lead.surgeryDate)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SalesPipeline({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStuck, setFilterStuck] = useState(false);

  const salesLeads = leads.filter(
    (l) =>
      l.currentBoard === "sales" &&
      (!filterStuck || (l.daysInCurrentStage || 0) > 7)
  );

  const stuckCount = salesLeads.filter(
    (l) => (l.daysInCurrentStage || 0) > 7
  ).length;

  return (
    <div>
      {selectedLead && (
        <LeadJourneyModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-text-primary">Sales Pipeline</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {salesLeads.length} leads in Zari's pipeline · Click a lead to see full journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stuckCount > 0 && (
            <button
              onClick={() => setFilterStuck((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterStuck
                  ? "bg-warning text-black"
                  : "bg-warning/15 text-warning hover:bg-warning/25"
              )}
            >
              <AlertTriangle size={13} />
              {stuckCount} stuck (&gt;7d)
            </button>
          )}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {SALES_STAGES.map((stage) => {
          const stageLeads = salesLeads.filter((l) => l.currentStage === stage);
          const stuckInStage = stageLeads.filter(
            (l) => (l.daysInCurrentStage || 0) > 7
          ).length;

          return (
            <div key={stage} className="flex flex-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-xs font-semibold text-text-secondary truncate">
                  {stage}
                </div>
                <div className="flex items-center gap-1">
                  {stuckInStage > 0 && (
                    <span className="text-xs text-warning font-bold">
                      {stuckInStage}⚠
                    </span>
                  )}
                  <span className="text-xs bg-bg-elevated px-1.5 py-0.5 rounded-full font-medium text-text-muted">
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 min-h-24">
                {stageLeads.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-6 border border-dashed border-bg-border rounded-lg">
                    Empty
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onSelect={setSelectedLead}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-4 p-4 rounded-lg bg-bg-card border border-bg-border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-xs">
          {SALES_STAGES.map((stage) => {
            const count = salesLeads.filter(
              (l) => l.currentStage === stage
            ).length;
            return (
              <div key={stage}>
                <div className="font-bold text-lg text-text-primary">{count}</div>
                <div className="text-text-muted leading-tight">{stage}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
