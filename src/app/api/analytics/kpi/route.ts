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
        COUNT(pe.id)                                          AS total_encounters,
        COUNT(DISTINCT pe."patientId")                       AS unique_patients,
        ROUND(SUM(pe."totalCost")::numeric, 2)              AS total_revenue,
        ROUND(AVG(pe."waitTime")::numeric, 1)               AS avg_wait_minutes,
        ROUND(AVG(pe."lengthOfStay")::numeric, 1)           AS avg_los_hours,
        ROUND(AVG(pe."totalCost")::numeric, 2)              AS avg_cost_per_encounter,
        SUM(pe."procedureCount")                            AS total_procedures,
        SUM(pe."labTestCount")                              AS total_lab_tests
      FROM patient_encounters pe
    `;

    const typeRows = await db.$queryRaw<
      { encounter_type: string; count: bigint; revenue: number }[]
    >`
      SELECT
        "encounterType"                           AS encounter_type,
        COUNT(*)                                  AS count,
        ROUND(SUM("totalCost")::numeric, 2)       AS revenue
      FROM patient_encounters
      GROUP BY "encounterType"
      ORDER BY count DESC
    `;

    const insuranceRows = await db.$queryRaw<
      { insurance_type: string; count: bigint; avg_cost: number }[]
    >`
      SELECT
        p."insuranceType"                          AS insurance_type,
        COUNT(pe.id)                               AS count,
        ROUND(AVG(pe."totalCost")::numeric, 2)    AS avg_cost
      FROM patient_encounters pe
      INNER JOIN patients p ON pe."patientId" = p.id
      GROUP BY p."insuranceType"
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
