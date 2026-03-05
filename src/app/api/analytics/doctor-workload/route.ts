import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const heatmapRows = await db.$queryRaw<
      {
        doctor_name: string;
        specialization: string;
        seniority_level: string;
        week_day_name: string;
        week_day: number;
        encounter_count: bigint;
        avg_wait: number;
      }[]
    >`
      WITH doctor_day_matrix AS (
        SELECT
          doc.name                    AS doctor_name,
          doc.specialization,
          doc."seniorityLevel"        AS seniority_level,
          dd."weekDayName"            AS week_day_name,
          dd."weekDay"                AS week_day,
          COUNT(pe.id)                AS encounter_count,
          AVG(pe."waitTime")          AS avg_wait
        FROM patient_encounters pe
        INNER JOIN doctors doc ON pe."doctorId" = doc.id
        INNER JOIN date_dimension dd ON pe."dateId" = dd.id
        GROUP BY doc.id, doc.name, doc.specialization, doc."seniorityLevel",
                 dd."weekDay", dd."weekDayName"
      )
      SELECT * FROM doctor_day_matrix
      ORDER BY doctor_name, week_day
    `;

    const summaryRows = await db.$queryRaw<
      {
        doctor_name: string;
        specialization: string;
        department: string;
        total_encounters: bigint;
        avg_wait_minutes: number;
        avg_los_hours: number;
        total_revenue: number;
      }[]
    >`
      SELECT
        doc.name                                             AS doctor_name,
        doc.specialization,
        dept.name                                            AS department,
        COUNT(pe.id)                                         AS total_encounters,
        ROUND(AVG(pe."waitTime")::numeric, 1)               AS avg_wait_minutes,
        ROUND(AVG(pe."lengthOfStay")::numeric, 1)           AS avg_los_hours,
        ROUND(SUM(pe."totalCost")::numeric, 2)              AS total_revenue
      FROM patient_encounters pe
      INNER JOIN doctors doc   ON pe."doctorId" = doc.id
      INNER JOIN departments dept ON pe."departmentId" = dept.id
      GROUP BY doc.id, doc.name, doc.specialization, dept.name
      ORDER BY total_encounters DESC
    `;

    return NextResponse.json(
      {
        heatmap: heatmapRows.map((r) => ({
          doctorName: r.doctor_name,
          specialization: r.specialization,
          seniorityLevel: r.seniority_level,
          weekDayName: r.week_day_name,
          weekDay: r.week_day,
          encounterCount: Number(r.encounter_count),
          avgWait: Number(r.avg_wait),
        })),
        summary: summaryRows.map((r) => ({
          doctorName: r.doctor_name,
          specialization: r.specialization,
          department: r.department,
          totalEncounters: Number(r.total_encounters),
          avgWaitMinutes: Number(r.avg_wait_minutes),
          avgLosHours: Number(r.avg_los_hours),
          totalRevenue: Number(r.total_revenue),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[doctor-workload]", error);
    return NextResponse.json({ error: "Failed to fetch doctor workload" }, { status: 500 });
  }
}
