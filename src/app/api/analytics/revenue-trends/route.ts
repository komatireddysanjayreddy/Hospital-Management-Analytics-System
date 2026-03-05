import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const rows = await db.$queryRaw<
      {
        year: number;
        month: number;
        month_name: string;
        period: string;
        total_revenue: number;
        encounter_count: bigint;
        avg_revenue_per_encounter: number;
        running_total: number;
        mom_growth_pct: number | null;
      }[]
    >`
      WITH monthly_revenue AS (
        SELECT
          dd.year,
          dd.month,
          dd."monthName"                                              AS month_name,
          (dd.year || '-' || LPAD(dd.month::text, 2, '0'))           AS period,
          SUM(pe."totalCost")                                         AS total_revenue,
          COUNT(pe.id)                                                AS encounter_count,
          AVG(pe."totalCost")                                         AS avg_revenue_per_encounter
        FROM patient_encounters pe
        INNER JOIN date_dimension dd ON pe."dateId" = dd.id
        GROUP BY dd.year, dd.month, dd."monthName"
      ),
      with_window AS (
        SELECT
          *,
          SUM(total_revenue) OVER (ORDER BY year, month)   AS running_total,
          LAG(total_revenue) OVER (ORDER BY year, month)   AS prev_month_revenue
        FROM monthly_revenue
      )
      SELECT
        year,
        month,
        month_name,
        period,
        ROUND(total_revenue::numeric, 2)                             AS total_revenue,
        encounter_count,
        ROUND(avg_revenue_per_encounter::numeric, 2)                 AS avg_revenue_per_encounter,
        ROUND(running_total::numeric, 2)                             AS running_total,
        CASE
          WHEN prev_month_revenue IS NULL OR prev_month_revenue = 0 THEN NULL
          ELSE ROUND(((total_revenue - prev_month_revenue) / prev_month_revenue * 100)::numeric, 1)
        END AS mom_growth_pct
      FROM with_window
      ORDER BY year, month
    `;

    const data = rows.map((r) => ({
      year: r.year,
      month: r.month,
      monthName: r.month_name,
      period: r.period,
      totalRevenue: Number(r.total_revenue),
      encounterCount: Number(r.encounter_count),
      avgRevenuePerEncounter: Number(r.avg_revenue_per_encounter),
      runningTotal: Number(r.running_total),
      momGrowthPct: r.mom_growth_pct !== null ? Number(r.mom_growth_pct) : null,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("[revenue-trends]", error);
    return NextResponse.json({ error: "Failed to fetch revenue trends" }, { status: 500 });
  }
}
