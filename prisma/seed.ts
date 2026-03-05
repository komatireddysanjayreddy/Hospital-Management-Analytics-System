/**
 * Hospital Management Analytics System — Database Seed
 * Generates 1,000+ realistic mock hospital records for demo/performance testing
 * Star Schema: PatientEncounters (Fact) + Patients, Doctors, Departments, DateDimension
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Seed uses standard pg TCP pool — safe for one-time Node.js scripts
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set in .env");

const pgPool = new Pool({ connectionString });
const adapter = new PrismaPg(pgPool);

// Prisma v7: connection string provided via adapter (url removed from schema.prisma)
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── Lookup Data ──────────────────────────────────────────

const DEPARTMENTS = [
  { name: "Emergency Medicine", code: "EM", floor: 1, bedCapacity: 40, category: "EMERGENCY" as const, head: "Dr. Sarah Mitchell" },
  { name: "Cardiology", code: "CARD", floor: 3, bedCapacity: 30, category: "MEDICAL" as const, head: "Dr. James Chen" },
  { name: "Orthopedic Surgery", code: "ORTH", floor: 4, bedCapacity: 25, category: "SURGICAL" as const, head: "Dr. Rachel Torres" },
  { name: "Neurology", code: "NEURO", floor: 5, bedCapacity: 20, category: "MEDICAL" as const, head: "Dr. Michael Patel" },
  { name: "Oncology", code: "ONC", floor: 6, bedCapacity: 35, category: "MEDICAL" as const, head: "Dr. Linda Watson" },
  { name: "Pediatrics", code: "PED", floor: 2, bedCapacity: 30, category: "MEDICAL" as const, head: "Dr. Kevin Park" },
  { name: "Radiology", code: "RAD", floor: 1, bedCapacity: 10, category: "DIAGNOSTIC" as const, head: "Dr. Amy Nguyen" },
  { name: "General Surgery", code: "GS", floor: 4, bedCapacity: 28, category: "SURGICAL" as const, head: "Dr. Robert Kim" },
  { name: "ICU", code: "ICU", floor: 7, bedCapacity: 20, category: "CRITICAL_CARE" as const, head: "Dr. Elena Russo" },
  { name: "Outpatient Clinic", code: "OPC", floor: 1, bedCapacity: 50, category: "OUTPATIENT" as const, head: "Dr. Frank Liu" },
];

const DOCTOR_DATA = [
  { name: "Dr. Marcus Webb", spec: "Emergency Medicine", exp: 12, level: "SENIOR_ATTENDING" as const },
  { name: "Dr. Priya Sharma", spec: "Cardiology", exp: 8, level: "ATTENDING" as const },
  { name: "Dr. Carlos Mendez", spec: "Orthopedic Surgery", exp: 15, level: "SENIOR_ATTENDING" as const },
  { name: "Dr. Angela Foster", spec: "Neurology", exp: 6, level: "ATTENDING" as const },
  { name: "Dr. David Okafor", spec: "Oncology", exp: 20, level: "CHIEF" as const },
  { name: "Dr. Sophie Laurent", spec: "Pediatrics", exp: 9, level: "ATTENDING" as const },
  { name: "Dr. Ryan Nakamura", spec: "Radiology", exp: 11, level: "SENIOR_ATTENDING" as const },
  { name: "Dr. Nina Petrov", spec: "General Surgery", exp: 14, level: "SENIOR_ATTENDING" as const },
  { name: "Dr. James Holloway", spec: "Critical Care", exp: 18, level: "CHIEF" as const },
  { name: "Dr. Lisa Tran", spec: "Internal Medicine", exp: 5, level: "ATTENDING" as const },
  { name: "Dr. Omar Hassan", spec: "Emergency Medicine", exp: 3, level: "RESIDENT" as const },
  { name: "Dr. Grace Owens", spec: "Cardiology", exp: 7, level: "ATTENDING" as const },
  { name: "Dr. Ethan Brooks", spec: "General Surgery", exp: 2, level: "RESIDENT" as const },
  { name: "Dr. Fatima Al-Rashid", spec: "Neurology", exp: 10, level: "SENIOR_ATTENDING" as const },
  { name: "Dr. Samuel Johnson", spec: "Oncology", exp: 16, level: "CHIEF" as const },
];

const FIRST_NAMES = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Barbara",
  "David","Susan","Richard","Jessica","Joseph","Sarah","Thomas","Karen","Charles","Lisa","Emma","Noah","Olivia",
  "Liam","Ava","Sophia","Mason","Isabella","Ethan","Mia","Lucas","Charlotte","Aiden","Amelia","Jackson","Harper"];

const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez",
  "Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King"];

const CITIES = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego",
  "Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco",
  "Seattle","Denver","Nashville","Oklahoma City","El Paso","Washington","Boston","Las Vegas"];

const STATES = ["NY","CA","IL","TX","AZ","PA","TX","CA","TX","CA","TX","FL","TX","OH","NC","IN","CA","WA","CO","TN"];

const DIAGNOSIS_GROUPS = [
  { group: "Cardiovascular", codes: ["I21.0","I25.10","I50.9","I10","I48.0"] },
  { group: "Respiratory", codes: ["J18.9","J44.1","J45.901","J96.00","J20.9"] },
  { group: "Orthopedic", codes: ["S72.001","M16.11","M17.11","S82.001","M54.5"] },
  { group: "Neurological", codes: ["G43.909","G35","G20","I63.9","G40.909"] },
  { group: "Oncological", codes: ["C34.90","C50.911","C18.9","C61","C25.9"] },
  { group: "Gastrointestinal", codes: ["K92.1","K57.30","K80.20","K29.70","K35.89"] },
  { group: "Endocrine", codes: ["E11.9","E03.9","E66.9","E27.49","E05.90"] },
  { group: "Infectious", codes: ["A41.9","B97.21","A04.7","B34.9","J12.89"] },
];

// ─── Helpers ──────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil(((diff / 86400000) + start.getDay() + 1) / 7);
}

function buildDateRecord(date: Date) {
  const month = date.getMonth() + 1;
  const weekDay = date.getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const quarter = Math.ceil(month / 3);

  return {
    date,
    day: date.getDate(),
    month,
    monthName: monthNames[month - 1],
    quarter,
    year: date.getFullYear(),
    weekDay,
    weekDayName: dayNames[weekDay],
    weekOfYear: getWeekOfYear(date),
    isWeekend: weekDay === 0 || weekDay === 6,
    isFiscalQ1: month >= 4 && month <= 6,
    isFiscalQ2: month >= 7 && month <= 9,
    isFiscalQ3: month >= 10 || month <= 12,
    isFiscalQ4: month >= 1 && month <= 3,
  };
}

// ─── Main Seed ────────────────────────────────────────────

async function main() {
  console.log("Clearing existing data...");
  await prisma.patientEncounter.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.dateDimension.deleteMany();

  // 1. Seed DateDimension — 2 years of daily records
  console.log("Seeding DateDimension (730 rows)...");
  const startDate = new Date("2023-01-01");
  const dateRecords: Date[] = [];
  for (let i = 0; i < 730; i++) {
    dateRecords.push(addDays(startDate, i));
  }
  await prisma.dateDimension.createMany({
    data: dateRecords.map(buildDateRecord),
  });
  const allDates = await prisma.dateDimension.findMany({ select: { id: true, date: true } });

  // 2. Seed Departments
  console.log("Seeding Departments (10 rows)...");
  await prisma.department.createMany({
    data: DEPARTMENTS.map((d) => ({
      name: d.name,
      code: d.code,
      floor: d.floor,
      bedCapacity: d.bedCapacity,
      category: d.category,
      headDoctorName: d.head,
    })),
  });
  const allDepts = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptMap = Object.fromEntries(allDepts.map((d) => [d.name, d.id]));

  // 3. Seed Doctors (mapped to departments by specialization)
  console.log("Seeding Doctors (15 rows)...");
  const deptSpecMap: Record<string, string> = {
    "Emergency Medicine": "Emergency Medicine",
    "Cardiology": "Cardiology",
    "Orthopedic Surgery": "Orthopedic Surgery",
    "Neurology": "Neurology",
    "Oncology": "Oncology",
    "Pediatrics": "Pediatrics",
    "Radiology": "Radiology",
    "General Surgery": "General Surgery",
    "Critical Care": "ICU",
    "Internal Medicine": "Outpatient Clinic",
  };
  await prisma.doctor.createMany({
    data: DOCTOR_DATA.map((d, i) => ({
      name: d.name,
      employeeId: `EMP${String(1000 + i).padStart(5, "0")}`,
      specialization: d.spec,
      yearsExp: d.exp,
      seniorityLevel: d.level,
      departmentId: deptMap[deptSpecMap[d.spec] ?? "Outpatient Clinic"],
    })),
  });
  const allDoctors = await prisma.doctor.findMany({ select: { id: true, departmentId: true } });

  // 4. Seed Patients (300 unique patients)
  console.log("Seeding Patients (300 rows)...");
  const bloodTypes = ["A_POS","A_NEG","B_POS","B_NEG","AB_POS","AB_NEG","O_POS","O_NEG"] as const;
  const genders = ["MALE","FEMALE","OTHER"] as const;
  const insurances = ["MEDICARE","MEDICAID","PRIVATE","SELF_PAY","WORKERS_COMP"] as const;

  const patientData = Array.from({ length: 300 }, (_, i) => {
    const dob = new Date(1940 + randInt(0, 70), randInt(0, 11), randInt(1, 28));
    const stateIdx = randInt(0, STATES.length - 1);
    return {
      mrn: `MRN${String(100000 + i).padStart(7, "0")}`,
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      dateOfBirth: dob,
      gender: pick(genders),
      bloodType: pick(bloodTypes),
      city: pick(CITIES),
      state: STATES[stateIdx],
      insuranceType: pick(insurances),
    };
  });
  await prisma.patient.createMany({ data: patientData });
  const allPatients = await prisma.patient.findMany({ select: { id: true } });

  // 5. Seed PatientEncounters (1,200 fact rows)
  console.log("Seeding PatientEncounters (1,200 rows)...");
  const encounterTypes = ["INPATIENT","OUTPATIENT","EMERGENCY","DAY_SURGERY","OBSERVATION"] as const;

  const encounterBatch = Array.from({ length: 1200 }, () => {
    const doctor = pick(allDoctors);
    const diagGroup = pick(DIAGNOSIS_GROUPS);
    const encType = pick(encounterTypes);

    // Cost & LOS vary by encounter type (realistic distributions)
    const isICU = encType === "INPATIENT";
    const baseCost = isICU ? randFloat(8000, 45000) : encType === "EMERGENCY" ? randFloat(1500, 8000) : randFloat(300, 3000);
    const los = isICU ? randInt(24, 240) : encType === "EMERGENCY" ? randInt(2, 24) : randInt(1, 8);
    const wait = encType === "EMERGENCY" ? randInt(5, 120) : randInt(10, 60);

    return {
      patientId: pick(allPatients).id,
      doctorId: doctor.id,
      departmentId: doctor.departmentId,
      dateId: pick(allDates).id,
      encounterType: encType,
      diagnosisCode: pick(diagGroup.codes),
      diagnosisGroup: diagGroup.group,
      totalCost: baseCost,
      lengthOfStay: los,
      waitTime: wait,
      procedureCount: randInt(1, 8),
      medicationCost: randFloat(50, baseCost * 0.3),
      labTestCount: randInt(0, 10),
    };
  });

  // Insert in chunks of 200 to avoid payload limits
  const CHUNK = 200;
  for (let i = 0; i < encounterBatch.length; i += CHUNK) {
    await prisma.patientEncounter.createMany({ data: encounterBatch.slice(i, i + CHUNK) });
    console.log(`  Inserted encounters ${i + 1}–${Math.min(i + CHUNK, encounterBatch.length)}`);
  }

  const total = await prisma.patientEncounter.count();
  console.log(`\nSeed complete. Total encounters: ${total}`);
  console.log("Star Schema populated:");
  console.log("  date_dimension:     730 rows");
  console.log("  departments:         10 rows");
  console.log("  doctors:             15 rows");
  console.log("  patients:           300 rows");
  console.log(`  patient_encounters: ${total} rows`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pgPool.end();
  });
