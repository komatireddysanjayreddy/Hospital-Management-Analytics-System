/**
 * POST /api/data/upload
 * Accepts a JSON array (pre-parsed from CSV on client) and bulk-inserts
 * patient encounters, upserting patients and date_dimension rows as needed.
 *
 * Expected row shape (all strings from CSV):
 * patientMRN, patientFirstName, patientLastName, patientDOB,
 * patientGender, patientBloodType, patientCity, patientState, patientInsurance,
 * doctorId, departmentId, encounterDate, encounterType,
 * diagnosisCode, diagnosisGroup,
 * totalCost, lengthOfStay, waitTime, procedureCount, medicationCost, labTestCount
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function buildDateDimData(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const month = date.getUTCMonth() + 1;
  const weekDay = date.getUTCDay();
  const quarter = Math.ceil(month / 3);
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekOfYear = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
  return {
    date,
    day: date.getUTCDate(),
    month,
    monthName: MONTH_NAMES[month - 1],
    quarter,
    year: date.getUTCFullYear(),
    weekDay,
    weekDayName: DAY_NAMES[weekDay],
    weekOfYear,
    isWeekend: weekDay === 0 || weekDay === 6,
    isFiscalQ1: month >= 4 && month <= 6,
    isFiscalQ2: month >= 7 && month <= 9,
    isFiscalQ3: month >= 10,
    isFiscalQ4: month <= 3,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateRow(row: any, index: number): string | null {
  const required = ["patientMRN","patientFirstName","patientLastName","patientDOB",
    "patientGender","patientInsurance","doctorId","departmentId","encounterDate",
    "encounterType","diagnosisCode","diagnosisGroup","totalCost","lengthOfStay","waitTime"];
  for (const field of required) {
    if (!row[field] && row[field] !== 0) return `Row ${index + 1}: missing field "${field}"`;
  }
  if (isNaN(Number(row.totalCost))) return `Row ${index + 1}: totalCost must be a number`;
  if (isNaN(Number(row.lengthOfStay))) return `Row ${index + 1}: lengthOfStay must be a number`;
  if (isNaN(Number(row.waitTime))) return `Row ${index + 1}: waitTime must be a number`;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { rows }: { rows: any[] } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }
    if (rows.length > 2000) {
      return NextResponse.json({ error: "Maximum 2,000 rows per upload" }, { status: 400 });
    }

    // Validate all rows first
    for (let i = 0; i < rows.length; i++) {
      const err = validateRow(rows[i], i);
      if (err) return NextResponse.json({ error: err }, { status: 422 });
    }

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        // 1. Upsert patient
        const patient = await db.patient.upsert({
          where: { mrn: String(r.patientMRN) },
          update: {},
          create: {
            mrn: String(r.patientMRN),
            firstName: String(r.patientFirstName),
            lastName: String(r.patientLastName),
            dateOfBirth: new Date(`${r.patientDOB}T00:00:00.000Z`),
            gender: r.patientGender as "MALE" | "FEMALE" | "OTHER",
            bloodType: (r.patientBloodType || "O_POS") as "A_POS"|"A_NEG"|"B_POS"|"B_NEG"|"AB_POS"|"AB_NEG"|"O_POS"|"O_NEG",
            city: String(r.patientCity || "Unknown"),
            state: String(r.patientState || "XX"),
            insuranceType: r.patientInsurance as "MEDICARE"|"MEDICAID"|"PRIVATE"|"SELF_PAY"|"WORKERS_COMP",
          },
        });

        // 2. Upsert date dimension
        const dateDimData = buildDateDimData(String(r.encounterDate));
        const dateDim = await db.dateDimension.upsert({
          where: { date: dateDimData.date },
          update: {},
          create: dateDimData,
        });

        // 3. Create encounter
        await db.patientEncounter.create({
          data: {
            patientId: patient.id,
            doctorId: Number(r.doctorId),
            departmentId: Number(r.departmentId),
            dateId: dateDim.id,
            encounterType: r.encounterType as "INPATIENT"|"OUTPATIENT"|"EMERGENCY"|"DAY_SURGERY"|"OBSERVATION",
            diagnosisCode: String(r.diagnosisCode),
            diagnosisGroup: String(r.diagnosisGroup),
            totalCost: Number(r.totalCost),
            lengthOfStay: Number(r.lengthOfStay),
            waitTime: Number(r.waitTime),
            procedureCount: Number(r.procedureCount || 1),
            medicationCost: Number(r.medicationCost || 0),
            labTestCount: Number(r.labTestCount || 0),
          },
        });
        inserted++;
      } catch (rowErr) {
        errors.push(`Row ${i + 1}: ${rowErr instanceof Error ? rowErr.message : "unknown error"}`);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, inserted, skipped, errors: errors.slice(0, 10) }, { status: 201 });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
