"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RevenueTrend } from "@/lib/types";

interface Props {
  data: RevenueTrend[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as RevenueTrend;
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">Revenue: <span className="text-foreground font-medium">${(d.totalRevenue / 1000).toFixed(1)}K</span></p>
      <p className="text-muted-foreground">Encounters: <span className="text-foreground font-medium">{d.encounterCount}</span></p>
      <p className="text-muted-foreground">Avg/Encounter: <span className="text-foreground font-medium">${d.avgRevenuePerEncounter.toLocaleString()}</span></p>
      {d.momGrowthPct !== null && (
        <p className={d.momGrowthPct >= 0 ? "text-emerald-600" : "text-red-500"}>
          MoM: {d.momGrowthPct >= 0 ? "+" : ""}{d.momGrowthPct}%
        </p>
      )}
    </div>
  );
};

export default function RevenueAreaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          interval={1}
          angle={-30}
          textAnchor="end"
        />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="totalRevenue"
          name="Monthly Revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorRevenue)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="runningTotal"
          name="Running Total"
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray="4 2"
          fill="url(#colorRunning)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
