"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DepartmentEfficiency } from "@/lib/types";

interface Props {
  data: DepartmentEfficiency[];
}

const CATEGORY_COLORS: Record<string, string> = {
  EMERGENCY: "#ef4444",
  SURGICAL: "#f97316",
  MEDICAL: "#3b82f6",
  DIAGNOSTIC: "#8b5cf6",
  OUTPATIENT: "#10b981",
  CRITICAL_CARE: "#ec4899",
};

// Custom tooltip for richer hover info
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as DepartmentEfficiency;
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">Efficiency Score: <span className="text-foreground font-medium">{d.efficiencyScore}</span></p>
      <p className="text-muted-foreground">Avg Wait: <span className="text-foreground font-medium">{d.avgWaitMinutes} min</span></p>
      <p className="text-muted-foreground">Avg LOS: <span className="text-foreground font-medium">{d.avgLosHours} hrs</span></p>
      <p className="text-muted-foreground">Encounters: <span className="text-foreground font-medium">{d.totalEncounters.toLocaleString()}</span></p>
      <p className="text-muted-foreground">Revenue: <span className="text-foreground font-medium">${(d.totalRevenue / 1_000_000).toFixed(2)}M</span></p>
    </div>
  );
};

export default function DepartmentBarChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={sorted} margin={{ top: 8, right: 16, left: 8, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="department"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          domain={[0, 100]}
          label={{ value: "Efficiency Score", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 48, fontSize: 12 }} />
        <Bar dataKey="efficiencyScore" name="Efficiency Score" radius={[4, 4, 0, 0]}>
          {sorted.map((entry) => (
            <Cell key={entry.department} fill={CATEGORY_COLORS[entry.category] ?? "#6b7280"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
