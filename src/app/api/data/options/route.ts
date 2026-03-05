/**
 * GET /api/data/options
 * Returns dropdown options for the data entry form:
 * doctors, departments, and a sample of patients for lookup.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const [doctors, departments, patients] = await Promise.all([
      db.doctor.findMany({
        select: {
          id: true,
          name: true,
          employeeId: true,
          specialization: true,
          seniorityLevel: true,
          department: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.department.findMany({
        select: { id: true, name: true, code: true, category: true },
        orderBy: { name: "asc" },
      }),
      db.patient.findMany({
        select: { id: true, mrn: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
        take: 500,
      }),
    ]);

    return NextResponse.json({ doctors, departments, patients }, { status: 200 });
  } catch (error) {
    console.error("[options]", error);
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 });
  }
}
