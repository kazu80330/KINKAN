export interface RecordSession {
  in: string; // ISO String
  out: string; // ISO String
}

export interface DailyRecord {
  date: string; // YYYY/MM/DD
  clockIn: string | null; // HH:mm:ss
  clockInRaw: string | null; // ISO String
  clockOut: string | null;
  clockOutRaw?: string;
  workSec: number;
  breaks: number;
  totalBreakSec: number;
  awaySec: number;
  pomodoros: number;
  manual: boolean;
  sessions: RecordSession[];
  overnight?: boolean;
}

export type MonthlyRecords = Record<string, DailyRecord[]>; // Key: "YYYY-MM"
