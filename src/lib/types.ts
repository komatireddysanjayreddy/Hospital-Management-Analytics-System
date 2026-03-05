// Shared TypeScript types for the analytics dashboard

export interface DepartmentEfficiency {
  department: string;
  category: string;
  totalEncounters: number;
  avgWaitMinutes: number;
  avgLosHours: number;
  totalRevenue: number;
  avgProcedures: number;
  efficiencyScore: number;
}

export interface RevenueTrend {
  year: number;
  month: number;
  monthName: string;
  period: string;
  totalRevenue: number;
  encounterCount: number;
  avgRevenuePerEncounter: number;
  runningTotal: number;
  momGrowthPct: number | null;
}

export interface DoctorHeatmapEntry {
  doctorName: string;
  specialization: string;
  seniorityLevel: string;
  weekDayName: string;
  weekDay: number;
  encounterCount: number;
  avgWait: number;
}

export interface DoctorSummary {
  doctorName: string;
  specialization: string;
  department: string;
  totalEncounters: number;
  avgWaitMinutes: number;
  avgLosHours: number;
  totalRevenue: number;
}

export interface KpiData {
  totalEncounters: number;
  uniquePatients: number;
  totalRevenue: number;
  avgWaitMinutes: number;
  avgLosHours: number;
  avgCostPerEncounter: number;
  totalProcedures: number;
  totalLabTests: number;
}

export interface EncounterTypeBreakdown {
  type: string;
  count: number;
  revenue: number;
}
