"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, X } from "lucide-react";

interface Options {
  doctors: { id: number; name: string; specialization: string }[];
  departments: { id: number; name: string; code: string }[];
}

// Build CSV template content dynamically using actual DB IDs
function buildTemplate(options: Options): string {
  const doc = options.doctors[0];
  const dept = options.departments[0];
  const headers = [
    "patientMRN","patientFirstName","patientLastName","patientDOB",
    "patientGender","patientBloodType","patientCity","patientState","patientInsurance",
    "doctorId","departmentId","encounterDate","encounterType",
    "diagnosisCode","diagnosisGroup",
    "totalCost","lengthOfStay","waitTime","procedureCount","medicationCost","labTestCount",
  ];
  const example = [
    "MRN-EXAMPLE","John","Smith","1980-05-15",
    "MALE","O_POS","Chicago","IL","MEDICARE",
    doc?.id ?? 1, dept?.id ?? 1, "2024-06-15","INPATIENT",
    "I21.0","Cardiovascular",
    "12500.00","48","25","3","450.00","5",
  ];
  return [headers.join(","), example.join(",")].join("\n");
}

function downloadTemplate(options: Options) {
  const content = buildTemplate(options);
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hospital_encounter_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvUpload({ options }: { options: Options }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "parsing" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // store parsed rows for upload
  const parsedRowsRef = useRef<Record<string, string>[]>([]);

  const parseFile = useCallback((f: File) => {
    setFile(f);
    setStatus("parsing");
    setResult(null);
    setErrorMsg("");

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        parsedRowsRef.current = rows;
        setRowCount(rows.length);
        setPreview(rows.slice(0, 5));
        setStatus("idle");
      },
      error: (err) => {
        setErrorMsg(err.message);
        setStatus("error");
      },
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) parseFile(f);
    else setErrorMsg("Please drop a .csv file");
  }, [parseFile]);

  async function handleUpload() {
    if (!parsedRowsRef.current.length) return;
    setStatus("uploading");
    setErrorMsg("");
    setResult(null);

    try {
      const res = await fetch("/api/data/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRowsRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setPreview([]);
    setRowCount(0);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    parsedRowsRef.current = [];
    if (inputRef.current) inputRef.current.value = "";
  }

  const previewColumns = preview[0] ? Object.keys(preview[0]).slice(0, 8) : [];

  return (
    <div className="space-y-5">
      {/* Template download */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 border p-3">
        <div>
          <p className="text-sm font-medium">CSV Template</p>
          <p className="text-xs text-muted-foreground">
            Download the template with pre-filled doctor and department IDs from your database.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadTemplate(options)}>
          <Download className="h-4 w-4 mr-2" />Template
        </Button>
      </div>

      {/* Quick reference: doctors & departments */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doctor IDs</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {options.doctors.map((d) => (
              <div key={d.id} className="flex justify-between text-xs">
                <span className="truncate text-foreground">{d.name}</span>
                <Badge variant="outline" className="ml-2 shrink-0">ID: {d.id}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department IDs</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {options.departments.map((d) => (
              <div key={d.id} className="flex justify-between text-xs">
                <span className="truncate text-foreground">{d.name}</span>
                <Badge variant="outline" className="ml-2 shrink-0">ID: {d.id}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"}`}
        >
          <Upload className={`h-8 w-8 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
          <div className="text-center">
            <p className="text-sm font-medium">Drop your CSV here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Only .csv files · Max 2,000 rows</p>
          </div>
          <input ref={inputRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
        </div>
      ) : (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{rowCount.toLocaleString()} rows detected</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={reset}><X className="h-4 w-4" /></Button>
          </div>

          {/* Preview table */}
          {preview.length > 0 && (
            <div className="overflow-x-auto rounded border">
              <table className="text-xs w-full">
                <thead className="bg-muted">
                  <tr>
                    {previewColumns.map((col) => (
                      <th key={col} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                    ))}
                    {Object.keys(preview[0]).length > 8 && <th className="px-2 py-1.5 text-muted-foreground">+{Object.keys(preview[0]).length - 8} more</th>}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      {previewColumns.map((col) => (
                        <td key={col} className="px-2 py-1.5 text-foreground whitespace-nowrap max-w-24 truncate">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rowCount > 5 && (
                <p className="text-xs text-muted-foreground px-2 py-1.5 border-t bg-muted/30">
                  Showing 5 of {rowCount.toLocaleString()} rows
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {(status === "success" || status === "error" || errorMsg) && (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${status === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {status === "success" ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <div className="space-y-1">
            {status === "success" && result && (
              <>
                <p className="font-medium">Upload complete!</p>
                <p>{result.inserted} encounters inserted · {result.skipped} skipped</p>
                {result.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5 opacity-75">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </>
            )}
            {(status === "error" || errorMsg) && <p>{errorMsg}</p>}
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && status !== "success" && (
        <div className="flex gap-3">
          <Button onClick={handleUpload} disabled={status === "uploading" || status === "parsing" || rowCount === 0} className="min-w-36">
            {status === "uploading"
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
              : <><Upload className="h-4 w-4 mr-2" />Upload {rowCount.toLocaleString()} Rows</>}
          </Button>
          <Button variant="outline" onClick={reset}>Cancel</Button>
        </div>
      )}
      {status === "success" && (
        <Button variant="outline" onClick={reset}>Upload Another File</Button>
      )}
    </div>
  );
}
