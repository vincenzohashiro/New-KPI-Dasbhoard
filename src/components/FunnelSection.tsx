
import type { FunnelStage } from "@/lib/types";
import { BOARD_COLORS, formatPercent, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  funnel: FunnelStage[];
  compact?: boolean;
}

export function FunnelSection({ funnel, compact = false }: Props) {
  const maxCount = funnel[0]?.count || 1;

  const grouped = {
    evaluation: funnel.filter((f) => f.board === "evaluation"),
    sales: funnel.filter((f) => f.board === "sales"),
    aftercare: funnel.filter((f) => f.board === "aftercare"),
  };

  const sectionLabels: Record<string, string> = {
    evaluation: "Evaluation (Sally)",
    sales: "Sales (Zari)",
    aftercare: "Aftercare",
  };

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text-primary">
          {compact ? "Funnel Overview" : "Full Lead Funnel"}
        </h2>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {Object.entries(BOARD_COLORS).map(([board, color]) => (
            <div key={board} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {sectionLabels[board]}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([board, stages]) => (
          <div key={board}>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: BOARD_COLORS[board] }}
            >
              {sectionLabels[board]}
            </div>
            <div className="space-y-1.5">
              {stages.map((stage) => {
                const width = Math.max((stage.count / maxCount) * 100, 2);
                return (
                  <div key={stage.stage} className="group">
                    <div className="flex items-center gap-3">
                      <div className="w-44 text-xs text-text-secondary truncate text-right flex-shrink-0">
                        {stage.stage}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-bg-elevated rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                            style={{
                              width: `${width}%`,
                              backgroundColor: BOARD_COLORS[board] + "99",
                              borderLeft: `3px solid ${BOARD_COLORS[board]}`,
                            }}
                          >
                            <span className="text-xs font-medium text-white truncate">
                              {stage.count > 0 ? stage.count : ""}
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-right text-xs text-text-secondary tabular-nums">
                          {formatNumber(stage.count)}
                        </div>
                        {stage.order > 1 && stage.stageDropoff > 0 && (
                          <div
                            className={cn(
                              "w-14 text-right text-xs tabular-nums font-medium",
                              stage.stageDropoff > 30
                                ? "text-danger"
                                : stage.stageDropoff > 15
                                ? "text-warning"
                                : "text-text-muted"
                            )}
                          >
                            -{formatPercent(stage.stageDropoff, 0)}
                          </div>
                        )}
                        {stage.order === 1 && (
                          <div className="w-14 text-right text-xs text-text-muted">
                            start
                          </div>
                        )}
                        {!compact && stage.avgDaysInStage > 0 && (
                          <div className="w-16 text-right text-xs text-text-muted hidden xl:block">
                            ~{stage.avgDaysInStage}d avg
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-6 pt-4 border-t border-bg-border grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-text-muted mb-1">
              Eval → Sales rate
            </div>
            <div className="text-lg font-bold" style={{ color: BOARD_COLORS.sales }}>
              {(() => {
                const eval0 = grouped.evaluation[0]?.count || 1;
                const sales0 = grouped.sales[0]?.count || 0;
                return formatPercent((sales0 / eval0) * 100, 1);
              })()}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">
              Sales → Booked rate
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: BOARD_COLORS.aftercare }}
            >
              {(() => {
                const sales0 = grouped.sales[0]?.count || 1;
                const after0 = grouped.aftercare[0]?.count || 0;
                return formatPercent((after0 / sales0) * 100, 1);
              })()}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">
              Overall lead → booked
            </div>
            <div className="text-lg font-bold text-brand">
              {(() => {
                const eval0 = grouped.evaluation[0]?.count || 1;
                const after0 = grouped.aftercare[0]?.count || 0;
                return formatPercent((after0 / eval0) * 100, 1);
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
