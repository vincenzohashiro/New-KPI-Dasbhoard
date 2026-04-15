
import type { Lead } from "@/lib/types";
import { AFTERCARE_STAGES } from "@/lib/types";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { HeartPulse, CheckCircle2, Clock } from "lucide-react";

function AftercareCard({ lead }: { lead: Lead }) {
  const stageIndex = AFTERCARE_STAGES.indexOf(
    lead.currentStage as (typeof AFTERCARE_STAGES)[number]
  );

  return (
    <div className="card hover:border-success/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium text-sm text-text-primary">{lead.name}</div>
          {lead.email && (
            <div className="text-xs text-text-muted mt-0.5">{lead.email}</div>
          )}
        </div>
        {lead.surgeryPrice && (
          <div className="text-xs font-semibold text-gold">
            NOK {lead.surgeryPrice.toLocaleString()}
          </div>
        )}
      </div>

      {/* Stage progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
          <span>Current: <span className="text-success font-medium">{lead.currentStage}</span></span>
          <span>{stageIndex + 1} / {AFTERCARE_STAGES.length}</span>
        </div>
        <div className="flex gap-1">
          {AFTERCARE_STAGES.map((stage, idx) => (
            <div
              key={stage}
              title={stage}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                idx < stageIndex
                  ? "bg-success"
                  : idx === stageIndex
                  ? "bg-success/70 animate-pulse"
                  : "bg-bg-elevated"
              )}
            />
          ))}
        </div>
      </div>

      {/* Key dates */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {lead.bookingDate && (
          <div className="flex items-center gap-1.5 text-text-muted">
            <CheckCircle2 size={11} className="text-success" />
            <div>
              <div className="text-text-muted/70">Booked</div>
              <div>{formatDate(lead.bookingDate, "dd MMM yyyy")}</div>
            </div>
          </div>
        )}
        {lead.surgeryDate && (
          <div className="flex items-center gap-1.5 text-text-muted">
            <HeartPulse size={11} className="text-brand" />
            <div>
              <div className="text-text-muted/70">Surgery</div>
              <div>{formatDate(lead.surgeryDate, "dd MMM yyyy")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Days in current stage */}
      {lead.daysInCurrentStage !== undefined && lead.daysInCurrentStage > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
          <Clock size={11} />
          <span>{lead.daysInCurrentStage} days in this stage</span>
        </div>
      )}
    </div>
  );
}

export function AftercareSection({ leads }: { leads: Lead[] }) {
  const aftercareLeads = leads.filter((l) => l.currentBoard === "aftercare");

  const byStage: Record<string, Lead[]> = {};
  for (const stage of AFTERCARE_STAGES) {
    byStage[stage] = aftercareLeads.filter((l) => l.currentStage === stage);
  }

  const totalRevenue = aftercareLeads.reduce(
    (sum, l) => sum + (l.surgeryPrice || 40000),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-text-primary">Aftercare Pipeline</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {aftercareLeads.length} patients · Total revenue{" "}
            <span className="text-gold font-medium">
              {formatCurrency(totalRevenue, "NOK")}
            </span>
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-6">
        {AFTERCARE_STAGES.map((stage) => {
          const count = byStage[stage]?.length || 0;
          const isMonthStage = stage.includes("months");
          return (
            <div
              key={stage}
              className={cn(
                "p-3 rounded-lg border text-center",
                count > 0
                  ? "border-success/30 bg-success/10"
                  : "border-bg-border bg-bg-card"
              )}
            >
              <div
                className={cn(
                  "text-2xl font-bold",
                  count > 0 ? "text-success" : "text-text-muted"
                )}
              >
                {count}
              </div>
              <div className="text-xs text-text-muted mt-1 leading-tight">
                {isMonthStage ? stage.replace("Aftercare ", "") : stage}
              </div>
            </div>
          );
        })}
      </div>

      {/* By stage sections */}
      {AFTERCARE_STAGES.map((stage) => {
        const stageLeads = byStage[stage];
        if (!stageLeads || stageLeads.length === 0) return null;
        return (
          <div key={stage} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-success" />
              <h3 className="font-medium text-text-primary text-sm">{stage}</h3>
              <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">
                {stageLeads.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {stageLeads.map((lead) => (
                <AftercareCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        );
      })}

      {aftercareLeads.length === 0 && (
        <div className="card text-center py-16 text-text-muted">
          No patients in aftercare yet
        </div>
      )}
    </div>
  );
}
