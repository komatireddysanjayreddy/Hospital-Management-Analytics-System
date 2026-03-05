"use client";

import { DoctorHeatmapEntry } from "@/lib/types";

interface Props {
  data: DoctorHeatmapEntry[];
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getColor(value: number, max: number): string {
  const intensity = max > 0 ? value / max : 0;
  if (intensity === 0) return "hsl(220 14% 96%)";
  if (intensity < 0.2) return "hsl(213 94% 90%)";
  if (intensity < 0.4) return "hsl(213 94% 78%)";
  if (intensity < 0.6) return "hsl(213 94% 62%)";
  if (intensity < 0.8) return "hsl(213 94% 48%)";
  return "hsl(213 94% 32%)";
}

export default function DoctorHeatmap({ data }: Props) {
  // Build matrix: doctor → day → count
  const doctors = Array.from(new Set(data.map((d) => d.doctorName)));

  const matrix: Record<string, Record<string, number>> = {};
  for (const d of data) {
    if (!matrix[d.doctorName]) matrix[d.doctorName] = {};
    matrix[d.doctorName][d.weekDayName] = d.encounterCount;
  }

  const maxVal = Math.max(...data.map((d) => d.encounterCount), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left pr-3 pb-2 text-muted-foreground font-medium w-36">Doctor</th>
            {SHORT_DAYS.map((d) => (
              <th key={d} className="pb-2 text-muted-foreground font-medium text-center w-12">{d}</th>
            ))}
            <th className="pb-2 text-muted-foreground font-medium text-center px-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => {
            const row = matrix[doctor] ?? {};
            const total = WEEKDAYS.reduce((sum, d) => sum + (row[d] ?? 0), 0);
            const shortName = doctor.replace("Dr. ", "");
            return (
              <tr key={doctor} className="hover:bg-muted/30 transition-colors">
                <td className="pr-3 py-1 font-medium text-foreground truncate max-w-[144px]" title={doctor}>
                  {shortName}
                </td>
                {WEEKDAYS.map((day) => {
                  const count = row[day] ?? 0;
                  return (
                    <td key={day} className="py-1 text-center">
                      <div
                        className="mx-auto rounded w-9 h-8 flex items-center justify-center font-medium transition-all"
                        style={{
                          backgroundColor: getColor(count, maxVal),
                          color: count / maxVal > 0.5 ? "white" : "hsl(220 14% 20%)",
                        }}
                        title={`${doctor} — ${day}: ${count} encounters`}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    </td>
                  );
                })}
                <td className="py-1 text-center font-semibold text-foreground">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Low</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
          <div
            key={v}
            className="w-5 h-4 rounded"
            style={{ backgroundColor: getColor(v * maxVal, maxVal) }}
          />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}
