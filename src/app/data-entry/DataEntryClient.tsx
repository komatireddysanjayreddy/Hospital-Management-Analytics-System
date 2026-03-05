"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EncounterForm from "@/components/forms/EncounterForm";
import CsvUpload from "@/components/forms/CsvUpload";

interface OptionsData {
  doctors: { id: number; name: string; employeeId: string; specialization: string; department: { name: string } }[];
  departments: { id: number; name: string; code: string; category: string }[];
  patients: { id: number; mrn: string; firstName: string; lastName: string }[];
}

export default function DataEntryClient() {
  const [options, setOptions] = useState<OptionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/options")
      .then((r) => r.json())
      .then(setOptions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="single" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="single">Single Entry</TabsTrigger>
        <TabsTrigger value="upload">CSV Upload</TabsTrigger>
      </TabsList>

      {/* ── Single Entry Tab ──────────────────────── */}
      <TabsContent value="single">
        <Card>
          <CardHeader>
            <CardTitle>Add Patient Encounter</CardTitle>
            <CardDescription>
              Fill in all fields to record a new patient encounter. Supports both
              existing patients (select by MRN) and new patient registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EncounterForm options={options!} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── CSV Upload Tab ────────────────────────── */}
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Bulk CSV Upload</CardTitle>
            <CardDescription>
              Upload a CSV file with multiple encounter records. Download the template
              below to see the required column format. Maximum 2,000 rows per upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvUpload options={options!} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
