"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiData, EncounterTypeBreakdown } from "@/lib/types";
import {
  Activity,
  DollarSign,
  Clock,
  Users,
  Stethoscope,
  FlaskConical,
} from "lucide-react";

interface Props {
  kpi: KpiData;
  byType: EncounterTypeBreakdown[];
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}

function KpiCard({ title, value, subtitle, icon, accent }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-5 ${accent}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${accent} bg-opacity-10`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function KpiCards({ kpi, byType }: Props) {
  const emergencyCount = byType.find((t) => t.type === "EMERGENCY")?.count ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        title="Total Encounters"
        value={kpi.totalEncounters.toLocaleString()}
        subtitle={`${emergencyCount} emergency`}
        icon={<Activity className="h-4 w-4 text-blue-600" />}
        accent="bg-blue-500"
      />
      <KpiCard
        title="Total Revenue"
        value={formatCurrency(kpi.totalRevenue)}
        subtitle={`${formatCurrency(kpi.avgCostPerEncounter)} avg/encounter`}
        icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
        accent="bg-emerald-500"
      />
      <KpiCard
        title="Avg Wait Time"
        value={`${kpi.avgWaitMinutes} min`}
        subtitle="across all departments"
        icon={<Clock className="h-4 w-4 text-amber-600" />}
        accent="bg-amber-500"
      />
      <KpiCard
        title="Avg Length of Stay"
        value={`${kpi.avgLosHours} hrs`}
        subtitle="inpatient & emergency"
        icon={<Stethoscope className="h-4 w-4 text-purple-600" />}
        accent="bg-purple-500"
      />
      <KpiCard
        title="Unique Patients"
        value={kpi.uniquePatients.toLocaleString()}
        subtitle="across 2-year period"
        icon={<Users className="h-4 w-4 text-rose-600" />}
        accent="bg-rose-500"
      />
      <KpiCard
        title="Lab Tests"
        value={kpi.totalLabTests.toLocaleString()}
        subtitle={`${kpi.totalProcedures.toLocaleString()} procedures`}
        icon={<FlaskConical className="h-4 w-4 text-cyan-600" />}
        accent="bg-cyan-500"
      />
    </div>
  );
}
