"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DepartmentEfficiency,
  RevenueTrend,
  DoctorHeatmapEntry,
  DoctorSummary,
  KpiData,
  EncounterTypeBreakdown,
} from "@/lib/types";
import KpiCards from "@/components/charts/KpiCards";

// Dynamic imports prevent SSR for Recharts (browser-only)
const DepartmentBarChart = dynamic(
  () => import("@/components/charts/DepartmentBarChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RevenueAreaChart = dynamic(
  () => import("@/components/charts/RevenueAreaChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const DoctorHeatmap = dynamic(
  () => import("@/components/charts/DoctorHeatmap"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
}

interface Props {
  deptEfficiency: DepartmentEfficiency[];
  revenueTrends: RevenueTrend[];
  heatmap: DoctorHeatmapEntry[];
  doctorSummary: DoctorSummary[];
  kpi: KpiData;
  byType: EncounterTypeBreakdown[];
}

export default function DashboardClient({
  deptEfficiency,
  revenueTrends,
  heatmap,
  doctorSummary,
  kpi,
  byType,
}: Props) {
  if (!kpi) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No data available</p>
        <p className="text-sm mt-1">Connect a database and run the seed script to populate data.</p>
      </div>
    );
  }

  // Top 3 busiest doctors for quick-view table
  const topDoctors = doctorSummary.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <section aria-label="Key Performance Indicators">
        <KpiCards kpi={kpi} byType={byType} />
      </section>

      {/* Row 1: Bar Chart + Area Chart */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Department Efficiency */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Department Efficiency</CardTitle>
                <CardDescription>Composite score (100 − wait penalty − LOS penalty)</CardDescription>
              </div>
              <Badge variant="outline">Bar Chart</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DepartmentBarChart data={deptEfficiency} />
            <p className="mt-3 text-xs text-muted-foreground">
              CTE Query: <code className="font-mono bg-muted px-1 rounded">AVG(wait_time)</code> grouped by department with composite index on <code className="font-mono bg-muted px-1 rounded">(department_id, date_id)</code>
            </p>
          </CardContent>
        </Card>

        {/* Chart 2: Revenue Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue with running total & MoM growth</CardDescription>
              </div>
              <Badge variant="outline">Area Chart</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={revenueTrends} />
            <p className="mt-3 text-xs text-muted-foreground">
              Window function: <code className="font-mono bg-muted px-1 rounded">SUM() OVER (ORDER BY year, month)</code> + <code className="font-mono bg-muted px-1 rounded">LAG()</code> for MoM growth
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Row 2: Heatmap + Doctor Table */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chart 3: Doctor Workload Heatmap */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Doctor Workload</CardTitle>
                <CardDescription>Encounter count by doctor × day-of-week</CardDescription>
              </div>
              <Badge variant="outline">Heatmap</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DoctorHeatmap data={heatmap} />
            <p className="mt-3 text-xs text-muted-foreground">
              CTE joins <code className="font-mono bg-muted px-1 rounded">doctors</code> × <code className="font-mono bg-muted px-1 rounded">date_dimension</code> on composite index <code className="font-mono bg-muted px-1 rounded">(doctor_id, department_id)</code>
            </p>
          </CardContent>
        </Card>

        {/* Top Doctors Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Doctors by Volume</CardTitle>
            <CardDescription>Ranked by total encounters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDoctors.map((doc, i) => (
                <div key={doc.doctorName} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 mt-0.5">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.doctorName}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.specialization}</p>
                      <p className="text-xs text-muted-foreground">{doc.department}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{doc.totalEncounters}</p>
                    <p className="text-xs text-muted-foreground">{doc.avgWaitMinutes}min wait</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground font-medium mb-2">Encounter Type Mix</p>
              {byType.map((t) => (
                <div key={t.type} className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground capitalize">{t.type.replace("_", " ")}</span>
                  <span className="font-medium">{t.count} enc.</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
