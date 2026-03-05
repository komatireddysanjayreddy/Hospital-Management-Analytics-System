/**
 * Main Analytics Dashboard — Server Component
 * Fetches all 4 analytics endpoints in parallel and passes data
 * to the client-side chart components.
 */

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 300;

async function fetchAnalytics() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const opts = { next: { revalidate: 300 } } as RequestInit & { next?: { revalidate?: number } };

  const [deptRes, revenueRes, workloadRes, kpiRes] = await Promise.all([
    fetch(`${base}/api/analytics/department-efficiency`, opts),
    fetch(`${base}/api/analytics/revenue-trends`, opts),
    fetch(`${base}/api/analytics/doctor-workload`, opts),
    fetch(`${base}/api/analytics/kpi`, opts),
  ]);

  const [deptData, revenueData, workloadData, kpiData] = await Promise.all([
    deptRes.json(),
    revenueRes.json(),
    workloadRes.json(),
    kpiRes.json(),
  ]);

  return { deptData, revenueData, workloadData, kpiData };
}

export default async function DashboardPage() {
  const { deptData, revenueData, workloadData, kpiData } = await fetchAnalytics();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hospital Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Star Schema · 1,200+ encounters · Neon PostgreSQL
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Next.js 16</Badge>
            <Badge variant="secondary">Prisma ORM</Badge>
            <Badge variant="outline">Live Data</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
          <DashboardClient
            deptEfficiency={deptData.data ?? []}
            revenueTrends={revenueData.data ?? []}
            heatmap={workloadData.heatmap ?? []}
            doctorSummary={workloadData.summary ?? []}
            kpi={kpiData.kpi}
            byType={kpiData.byType ?? []}
          />
        </Suspense>

        <Separator />
        <p className="text-xs text-muted-foreground text-center">
          Hospital Management Analytics System · Star Schema Data Model · Vercel + Neon PostgreSQL
        </p>
      </div>
    </main>
  );
}
