import { DailyRecord, MonthlyRecords } from './types';

const RECORDS_KEY = 'kinkan_records';

export function getRecords(): MonthlyRecords {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveRecord(record: DailyRecord): void {
  const all = getRecords();
  const d = new Date(record.date);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  
  if (!all[key]) all[key] = [];
  
  const idx = all[key].findIndex(r => r.date === record.date);
  if (idx >= 0) {
    all[key][idx] = record;
  } else {
    all[key].push(record);
  }
  
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function saveMultipleRecords(records: MonthlyRecords): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getTodayRecord(): DailyRecord | null {
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  
  const all = getRecords();
  return (all[key] || []).find(r => r.date === dateStr) || null;
}
