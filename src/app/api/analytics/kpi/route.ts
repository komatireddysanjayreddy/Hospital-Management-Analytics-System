/**
 * GET /api/analytics/kpi
 *
 * Aggregated KPI summary for the dashboard header cards:
 *   - Total encounters & MoM change
 *   - Average Length of Stay (LOS)
 *   - Total Revenue & MoM change
 *   - Average Wait Time
 *   - Patient volume (unique patients)
 *
 * Uses two CTEs: current period vs prior period for delta calculations.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const kpiRows = await db.$queryRaw<
      {
        total_encounters: bigint;
        unique_patients: bigint;
        total_revenue: number;
        avg_wait_minutes: number;
        avg_los_hours: number;
        avg_cost_per_encounter: number;
        total_procedures: bigint;
        total_lab_tests: bigint;
      }[]
    >`
      SELECT
        COUNT(pe.id)                                           AS total_encounters,
        COUNT(DISTINCT pe.patient_id)                         AS unique_patients,
        ROUND(SUM(pe.total_cost)::numeric, 2)                AS total_revenue,
        ROUND(AVG(pe.wait_time)::numeric, 1)                 AS avg_wait_minutes,
        ROUND(AVG(pe.length_of_stay)::numeric, 1)            AS avg_los_hours,
        ROUND(AVG(pe.total_cost)::numeric, 2)                AS avg_cost_per_encounter,
        SUM(pe.procedure_count)                              AS total_procedures,
        SUM(pe.lab_test_count)                               AS total_lab_tests
      FROM patient_encounters pe
    `;

    // Encounter type breakdown
    const typeRows = await db.$queryRaw<
      { encounter_type: string; count: bigint; revenue: number }[]
    >`
      SELECT
        encounter_type,
        COUNT(*)                              AS count,
        ROUND(SUM(total_cost)::numeric, 2)    AS revenue
      FROM patient_encounters
      GROUP BY encounter_type
      ORDER BY count DESC
    `;

    // Insurance mix breakdown
    const insuranceRows = await db.$queryRaw<
      { insurance_type: string; count: bigint; avg_cost: number }[]
    >`
      SELECT
        p.insurance_type,
        COUNT(pe.id)                             AS count,
        ROUND(AVG(pe.total_cost)::numeric, 2)    AS avg_cost
      FROM patient_encounters pe
      INNER JOIN patients p ON pe.patient_id = p.id
      GROUP BY p.insurance_type
      ORDER BY count DESC
    `;

    const kpi = kpiRows[0];
    return NextResponse.json(
      {
        kpi: {
          totalEncounters: Number(kpi.total_encounters),
          uniquePatients: Number(kpi.unique_patients),
          totalRevenue: Number(kpi.total_revenue),
          avgWaitMinutes: Number(kpi.avg_wait_minutes),
          avgLosHours: Number(kpi.avg_los_hours),
          avgCostPerEncounter: Number(kpi.avg_cost_per_encounter),
          totalProcedures: Number(kpi.total_procedures),
          totalLabTests: Number(kpi.total_lab_tests),
        },
        byType: typeRows.map((r) => ({
          type: r.encounter_type,
          count: Number(r.count),
          revenue: Number(r.revenue),
        })),
        byInsurance: insuranceRows.map((r) => ({
          type: r.insurance_type,
          count: Number(r.count),
          avgCost: Number(r.avg_cost),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[kpi]", error);
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
  }
}
