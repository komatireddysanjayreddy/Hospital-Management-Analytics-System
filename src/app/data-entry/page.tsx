import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DataEntryClient from "./DataEntryClient";

export const metadata = { title: "Data Entry — Hospital Analytics" };
export const dynamic = "force-dynamic";

export default function DataEntryPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Entry</h1>
            <p className="text-sm text-muted-foreground">
              Add patient encounter records — manually or via CSV upload
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Single Entry</Badge>
            <Badge variant="secondary">Bulk CSV Upload</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
          <DataEntryClient />
        </Suspense>
        <Separator className="mt-8" />
        <p className="text-xs text-muted-foreground text-center mt-4">
          Hospital Management Analytics System · Star Schema Data Model
        </p>
      </div>
    </main>
  );
}
