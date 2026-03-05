import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const rows = await db.$queryRaw<
      {
        department: string;
        category: string;
        total_encounters: bigint;
        avg_wait_minutes: number;
        avg_los_hours: number;
        total_revenue: number;
        avg_procedures: number;
        efficiency_score: number;
      }[]
    >`
      WITH dept_metrics AS (
        SELECT
          d.name                              AS department,
          d.category,
          COUNT(pe.id)                        AS total_encounters,
          AVG(pe."waitTime")                  AS avg_wait_minutes,
          AVG(pe."lengthOfStay")              AS avg_los_hours,
          SUM(pe."totalCost")                 AS total_revenue,
          AVG(pe."procedureCount")            AS avg_procedures
        FROM patient_encounters pe
        INNER JOIN departments d ON pe."departmentId" = d.id
        GROUP BY d.id, d.name, d.category
      )
      SELECT
        department,
        category,
        total_encounters,
        ROUND(avg_wait_minutes::numeric, 1)   AS avg_wait_minutes,
        ROUND(avg_los_hours::numeric, 1)      AS avg_los_hours,
        ROUND(total_revenue::numeric, 2)      AS total_revenue,
        ROUND(avg_procedures::numeric, 2)     AS avg_procedures,
        ROUND(
          GREATEST(0, 100 - (avg_wait_minutes / 2) - (avg_los_hours / 5))::numeric, 1
        )                                     AS efficiency_score
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
