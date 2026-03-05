/**
 * POST /api/data/entry
 * Creates a single PatientEncounter record.
 * Handles: new patient creation OR lookup by MRN,
 *          date dimension upsert, encounter insert.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      // Patient — either pick existing by ID or create new
      patientId,
      newPatient,

      // Encounter core
      doctorId,
      departmentId,
      encounterDate,       // ISO string "YYYY-MM-DD"
      encounterType,
      diagnosisCode,
      diagnosisGroup,

      // Metrics
      totalCost,
      lengthOfStay,
      waitTime,
      procedureCount,
      medicationCost,
      labTestCount,
    } = body;

    // ── 1. Resolve patient ──────────────────────────────────
    let resolvedPatientId: number;

    if (patientId) {
      resolvedPatientId = Number(patientId);
    } else if (newPatient) {
      const created = await db.patient.create({
        data: {
          mrn: newPatient.mrn || `MRN-${Date.now()}`,
          firstName: newPatient.firstName,
          lastName: newPatient.lastName,
          dateOfBirth: new Date(newPatient.dateOfBirth),
          gender: newPatient.gender,
          bloodType: newPatient.bloodType,
          city: newPatient.city || "Unknown",
          state: newPatient.state || "XX",
          insuranceType: newPatient.insuranceType,
        },
      });
      resolvedPatientId = created.id;
    } else {
      return NextResponse.json({ error: "Provide patientId or newPatient data" }, { status: 400 });
    }

    // ── 2. Upsert DateDimension ─────────────────────────────
    const date = new Date(encounterDate);
    const month = date.getMonth() + 1;
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const weekDay = date.getDay();
    const quarter = Math.ceil(month / 3);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekOfYear = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    // Normalize to midnight UTC to avoid timezone drift
    const dateMidnight = new Date(`${encounterDate}T00:00:00.000Z`);

    const dateDim = await db.dateDimension.upsert({
      where: { date: dateMidnight },
      update: {},
      create: {
        date: dateMidnight,
        day: date.getDate(),
        month,
        monthName: monthNames[month - 1],
        quarter,
        year: date.getFullYear(),
        weekDay,
        weekDayName: dayNames[weekDay],
        weekOfYear,
        isWeekend: weekDay === 0 || weekDay === 6,
        isFiscalQ1: month >= 4 && month <= 6,
        isFiscalQ2: month >= 7 && month <= 9,
        isFiscalQ3: month >= 10,
        isFiscalQ4: month <= 3,
      },
    });

    // ── 3. Create encounter ─────────────────────────────────
    const encounter = await db.patientEncounter.create({
      data: {
        patientId: resolvedPatientId,
        doctorId: Number(doctorId),
        departmentId: Number(departmentId),
        dateId: dateDim.id,
        encounterType,
        diagnosisCode,
        diagnosisGroup,
        totalCost: Number(totalCost),
        lengthOfStay: Number(lengthOfStay),
        waitTime: Number(waitTime),
        procedureCount: Number(procedureCount),
        medicationCost: Number(medicationCost),
        labTestCount: Number(labTestCount),
      },
      include: {
        patient: { select: { mrn: true, firstName: true, lastName: true } },
        doctor: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, encounter }, { status: 201 });
  } catch (error) {
    console.error("[entry]", error);
    return NextResponse.json({ error: "Failed to create encounter" }, { status: 500 });
  }
}
