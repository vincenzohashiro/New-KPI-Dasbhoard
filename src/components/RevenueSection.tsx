
import type { KPIData, RevenueBreakdown } from "@/lib/types";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface Props {
  revenue: RevenueBreakdown[];
  kpis: KPIData;
  compact?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-bg-border rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold mb-2 text-text-primary">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-text-secondary">{p.name}</span>
          </div>
          <span className="font-medium text-text-primary tabular-nums">
            {p.name === "ROAS"
              ? `${p.value?.toFixed(2)}×`
              : typeof p.value === "number" && p.value > 1000
              ? formatCurrency(p.value, "NOK")
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueSection({ revenue, kpis, compact = false }: Props) {
  const totalSocoFee = kpis.socoFee;
  const socoBase = 5000;
  const socoCommission = totalSocoFee - socoBase;

  return (
    <div className={cn("space-y-4", compact ? "" : "")}>
      <div className={compact ? "card" : ""}>
        {compact && (
          <h2 className="font-semibold text-text-primary mb-4">Revenue Overview</h2>
        )}

        {/* Revenue + Spend bar chart */}
        <div className={compact ? "h-52" : "card h-72"}>
          {!compact && (
            <h2 className="font-semibold text-text-primary mb-4">
              Monthly Revenue vs Ad Spend
            </h2>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenue}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e2d45"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#6366f1"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="adSpend"
                name="Ad Spend"
                fill="#f59e0b"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="socoFee"
                name="Soco Fee"
                fill="#475569"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {!compact && (
          <>
            {/* ROAS line chart */}
            <div className="card h-52 mt-4">
              <h3 className="font-medium text-sm text-text-primary mb-3">
                ROAS by Month
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenue}
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e2d45"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}×`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="roas"
                    name="ROAS"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Soco fee breakdown */}
            <div className="card mt-4">
              <h3 className="font-medium text-sm text-text-primary mb-4">
                Soco Fee Calculation
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-bg-elevated border border-bg-border">
                  <div className="text-xs text-text-muted mb-1">Total Revenue</div>
                  <div className="font-bold text-text-primary">
                    {formatCurrency(kpis.totalRevenue, "NOK")}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-bg-elevated border border-bg-border">
                  <div className="text-xs text-text-muted mb-1">
                    Base Fee (fixed)
                  </div>
                  <div className="font-bold text-text-primary">
                    {formatCurrency(socoBase, "NOK")}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-bg-elevated border border-bg-border">
                  <div className="text-xs text-text-muted mb-1">
                    Commission (10%)
                  </div>
                  <div className="font-bold text-gold">
                    {formatCurrency(socoCommission, "NOK")}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
                  <div className="text-xs text-text-muted mb-1">Total Soco Fee</div>
                  <div className="font-bold text-gold text-lg">
                    {formatCurrency(totalSocoFee, "NOK")}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-bg-elevated border border-bg-border">
                <div className="text-xs text-text-muted mb-1">Formula</div>
                <div className="font-mono text-xs text-text-secondary">
                  Soco Fee = 5,000 + (10% × {formatCurrency(kpis.totalRevenue, "NOK")}) ={" "}
                  <span className="text-gold font-semibold">
                    {formatCurrency(totalSocoFee, "NOK")}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly table */}
            <div className="card mt-4 overflow-hidden p-0">
              <div className="p-4 border-b border-bg-border">
                <h3 className="font-medium text-sm text-text-primary">
                  Monthly Breakdown
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-border">
                      {[
                        "Month",
                        "Bookings",
                        "Revenue",
                        "Ad Spend",
                        "ROAS",
                        "Soco Fee",
                        "Net",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-medium uppercase tracking-wider text-text-secondary py-2.5 px-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-bg-border/50 hover:bg-bg-hover/40"
                      >
                        <td className="py-2.5 px-4 font-medium">
                          {row.label}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">
                          {row.bookings}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums font-medium text-brand">
                          {formatCurrency(row.revenue, "NOK")}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums text-text-secondary text-xs">
                          {row.adSpend > 0
                            ? formatCurrency(row.adSpend, "NOK")
                            : "—"}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">
                          <span
                            className={cn(
                              "font-medium",
                              row.roas >= 8
                                ? "text-success"
                                : row.roas >= 4
                                ? "text-text-primary"
                                : "text-warning"
                            )}
                          >
                            {row.roas > 0 ? `${row.roas.toFixed(1)}×` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 tabular-nums text-gold text-xs">
                          {formatCurrency(row.socoFee, "NOK")}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums font-semibold text-success">
                          {formatCurrency(row.profit, "NOK")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
