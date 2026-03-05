"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Options {
  doctors: { id: number; name: string; specialization: string; department: { name: string } }[];
  departments: { id: number; name: string; code: string }[];
  patients: { id: number; mrn: string; firstName: string; lastName: string }[];
}

const ENCOUNTER_TYPES = ["INPATIENT","OUTPATIENT","EMERGENCY","DAY_SURGERY","OBSERVATION"];
const GENDERS = ["MALE","FEMALE","OTHER"];
const BLOOD_TYPES = ["A_POS","A_NEG","B_POS","B_NEG","AB_POS","AB_NEG","O_POS","O_NEG"];
const INSURANCES = ["MEDICARE","MEDICAID","PRIVATE","SELF_PAY","WORKERS_COMP"];
const DIAGNOSIS_GROUPS = ["Cardiovascular","Respiratory","Orthopedic","Neurological","Oncological","Gastrointestinal","Endocrine","Infectious","Other"];

const ICD_CODES: Record<string, string[]> = {
  Cardiovascular: ["I21.0","I25.10","I50.9","I10","I48.0"],
  Respiratory: ["J18.9","J44.1","J45.901","J96.00","J20.9"],
  Orthopedic: ["S72.001","M16.11","M17.11","S82.001","M54.5"],
  Neurological: ["G43.909","G35","G20","I63.9","G40.909"],
  Oncological: ["C34.90","C50.911","C18.9","C61","C25.9"],
  Gastrointestinal: ["K92.1","K57.30","K80.20","K29.70","K35.89"],
  Endocrine: ["E11.9","E03.9","E66.9","E27.49","E05.90"],
  Infectious: ["A41.9","B97.21","A04.7","B34.9","J12.89"],
  Other: ["Z00.00","Z51.11","Z79.899","Z23","Z30.9"],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

export default function EncounterForm({ options }: { options: Options }) {
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [diagGroup, setDiagGroup] = useState("");

  const [form, setForm] = useState({
    // Patient (existing)
    patientId: "",
    // Patient (new)
    mrn: "", firstName: "", lastName: "", dateOfBirth: "",
    gender: "", bloodType: "", city: "", state: "", insuranceType: "",
    // Encounter
    doctorId: "", departmentId: "", encounterDate: new Date().toISOString().split("T")[0],
    encounterType: "", diagnosisCode: "", diagnosisGroup: "",
    totalCost: "", lengthOfStay: "", waitTime: "",
    procedureCount: "1", medicationCost: "0", labTestCount: "0",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const payload =
      patientMode === "existing"
        ? { patientId: form.patientId }
        : {
            newPatient: {
              mrn: form.mrn, firstName: form.firstName, lastName: form.lastName,
              dateOfBirth: form.dateOfBirth, gender: form.gender, bloodType: form.bloodType,
              city: form.city, state: form.state, insuranceType: form.insuranceType,
            },
          };

    try {
      const res = await fetch("/api/data/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          doctorId: form.doctorId, departmentId: form.departmentId,
          encounterDate: form.encounterDate, encounterType: form.encounterType,
          diagnosisCode: form.diagnosisCode, diagnosisGroup: form.diagnosisGroup,
          totalCost: form.totalCost, lengthOfStay: form.lengthOfStay, waitTime: form.waitTime,
          procedureCount: form.procedureCount, medicationCost: form.medicationCost,
          labTestCount: form.labTestCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      const enc = data.encounter;
      setStatus("success");
      setMessage(`Encounter #${enc.id} created for ${enc.patient.firstName} ${enc.patient.lastName} at ${enc.department.name}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Submission failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Patient Section ─────────────────────── */}
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Patient</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPatientMode("existing")}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${patientMode === "existing" ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 hover:bg-muted"}`}>
              Select Existing
            </button>
            <button type="button" onClick={() => setPatientMode("new")}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${patientMode === "new" ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30 hover:bg-muted"}`}>
              Register New
            </button>
          </div>
        </div>

        {patientMode === "existing" ? (
          <Field label="Patient (search by name or MRN)">
            <Select onValueChange={(v) => set("patientId", v)} required>
              <SelectTrigger><SelectValue placeholder="Select patient…" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {options.patients.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.lastName}, {p.firstName} — {p.mrn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Field label="MRN"><Input placeholder="MRN-12345" value={form.mrn} onChange={(e) => set("mrn", e.target.value)} /></Field>
            <Field label="First Name"><Input placeholder="Jane" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></Field>
            <Field label="Last Name"><Input placeholder="Doe" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></Field>
            <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required /></Field>
            <Field label="Gender">
              <Select onValueChange={(v) => set("gender", v)} required>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Blood Type">
              <Select onValueChange={(v) => set("bloodType", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="City"><Input placeholder="New York" value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="State"><Input placeholder="NY" maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} /></Field>
            <Field label="Insurance">
              <Select onValueChange={(v) => set("insuranceType", v)} required>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{INSURANCES.map((ins) => <SelectItem key={ins} value={ins}>{ins.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        )}
      </div>

      {/* ── Encounter Section ───────────────────── */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-sm">Encounter Details</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Date">
            <Input type="date" value={form.encounterDate} onChange={(e) => set("encounterDate", e.target.value)} required />
          </Field>
          <Field label="Doctor">
            <Select onValueChange={(v) => set("doctorId", v)} required>
              <SelectTrigger><SelectValue placeholder="Select doctor…" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {options.doctors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name} — {d.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department">
            <Select onValueChange={(v) => set("departmentId", v)} required>
              <SelectTrigger><SelectValue placeholder="Select dept…" /></SelectTrigger>
              <SelectContent>
                {options.departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name} ({d.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Encounter Type">
            <Select onValueChange={(v) => set("encounterType", v)} required>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{ENCOUNTER_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Diagnosis Group">
            <Select onValueChange={(v) => { setDiagGroup(v); set("diagnosisGroup", v); set("diagnosisCode", ""); }} required>
              <SelectTrigger><SelectValue placeholder="Select group…" /></SelectTrigger>
              <SelectContent>{DIAGNOSIS_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Diagnosis Code (ICD-10)">
            {diagGroup ? (
              <Select onValueChange={(v) => set("diagnosisCode", v)} required>
                <SelectTrigger><SelectValue placeholder="Select code…" /></SelectTrigger>
                <SelectContent>{(ICD_CODES[diagGroup] || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input placeholder="Select group first" disabled />
            )}
          </Field>
        </div>
      </div>

      {/* ── Metrics Section ─────────────────────── */}
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-sm">Clinical Metrics</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Field label="Total Cost ($)">
            <Input type="number" min="0" step="0.01" placeholder="5000.00" value={form.totalCost} onChange={(e) => set("totalCost", e.target.value)} required />
          </Field>
          <Field label="Length of Stay (hours)">
            <Input type="number" min="1" placeholder="24" value={form.lengthOfStay} onChange={(e) => set("lengthOfStay", e.target.value)} required />
          </Field>
          <Field label="Wait Time (minutes)">
            <Input type="number" min="0" placeholder="30" value={form.waitTime} onChange={(e) => set("waitTime", e.target.value)} required />
          </Field>
          <Field label="Procedures">
            <Input type="number" min="0" placeholder="2" value={form.procedureCount} onChange={(e) => set("procedureCount", e.target.value)} />
          </Field>
          <Field label="Medication Cost ($)">
            <Input type="number" min="0" step="0.01" placeholder="200.00" value={form.medicationCost} onChange={(e) => set("medicationCost", e.target.value)} />
          </Field>
          <Field label="Lab Tests">
            <Input type="number" min="0" placeholder="3" value={form.labTestCount} onChange={(e) => set("labTestCount", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* ── Status & Submit ─────────────────────── */}
      {status !== "idle" && (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : status === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-muted"}`}>
          {status === "success" && <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          {status === "error" && <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          {status === "loading" && <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" />}
          <span>{status === "loading" ? "Submitting encounter…" : message}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={status === "loading"} className="min-w-32">
          {status === "loading" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Encounter"}
        </Button>
        {status === "success" && (
          <Button type="button" variant="outline" onClick={() => { setStatus("idle"); setMessage(""); setForm((f) => ({ ...f, totalCost: "", lengthOfStay: "", waitTime: "", diagnosisCode: "", diagnosisGroup: "", patientId: "" })); }}>
            Add Another
          </Button>
        )}
      </div>
    </form>
  );
}
