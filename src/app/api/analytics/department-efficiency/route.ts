/**
 * GET /api/analytics/department-efficiency
 *
 * SQL Strategy: CTE (Common Table Expression)
 * Calculates per-department aggregates in a single pass:
 *   - Average wait time (primary KPI from resume)
 *   - Average length of stay
 *   - Total revenue
 *   - Encounter volume
 *   - Avg procedures per encounter
 *
 * The CTE avoids a correlated subquery and lets the planner
 * use the composite index (departmentId, dateId) efficiently.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300; // 5-minute ISR cache

export async function GET() {
  try {
    // Raw SQL CTE — equivalent to a Materialized View but computed on-demand.
    // In production, materialize this as a Postgres MATERIALIZED VIEW and
    // REFRESH CONCURRENTLY on a schedule (e.g., every hour via pg_cron).
    const rows = await db.$queryRaw<
      {
        department: string;
        category: string;
        total_encounters: bigint;
        avg_wait_minutes: number;
        avg_los_hours: number;
        total_revenue: number;
        avg_procedures: number;
        efficiency_score: number; // composite KPI
      }[]
    >`
      WITH dept_metrics AS (
        SELECT
          d.name                        AS department,
          d.category,
          COUNT(pe.id)                  AS total_encounters,
          AVG(pe.wait_time)             AS avg_wait_minutes,
          AVG(pe.length_of_stay)        AS avg_los_hours,
          SUM(pe.total_cost)            AS total_revenue,
          AVG(pe.procedure_count)       AS avg_procedures
        FROM patient_encounters pe
        INNER JOIN departments d ON pe.department_id = d.id
        GROUP BY d.id, d.name, d.category
      )
      SELECT
        department,
        category,
        total_encounters,
        ROUND(avg_wait_minutes::numeric, 1)  AS avg_wait_minutes,
        ROUND(avg_los_hours::numeric, 1)     AS avg_los_hours,
        ROUND(total_revenue::numeric, 2)     AS total_revenue,
        ROUND(avg_procedures::numeric, 2)    AS avg_procedures,
        -- Efficiency score: lower wait + lower LOS = higher score (0–100 scale)
        ROUND(
          GREATEST(0, 100 - (avg_wait_minutes / 2) - (avg_los_hours / 5))::numeric,
          1
        ) AS efficiency_score
      FROM dept_metrics
      ORDER BY efficiency_score DESC
    `;

    const data = rows.map((r) => ({
      department: r.department,
      category: r.category,
      totalEncounters: Number(r.total_encounters),
      avgWaitMinutes: Number(r.avg_wait_minutes),
      avgLosHours: Number(r.avg_los_hours),
      totalRevenue: Number(r.total_revenue),
      avgProcedures: Number(r.avg_procedures),
      efficiencyScore: Number(r.efficiency_score),
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("[department-efficiency]", error);
    return NextResponse.json({ error: "Failed to fetch department efficiency" }, { status: 500 });
  }
}
