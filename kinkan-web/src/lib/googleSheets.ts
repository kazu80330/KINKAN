import { getRecords, saveMultipleRecords } from './storage';
import { DailyRecord } from './types';

export const GS_SHEET_KEY = 'kinkan_spreadsheet_id';

function fmtSecToHM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHMtoSec(hm: string): number {
  if (!hm || typeof hm !== 'string') return 0;
  const parts = hm.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 3600 + m * 60;
}

export async function syncReadSheet(spreadsheetId: string): Promise<void> {
  if (!spreadsheetId) throw new Error("No spreadsheet ID");
  
  // @ts-ignore
  const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
  const sheets = meta.result.sheets.map((s: any) => s.properties.title);
  const all = getRecords();

  for (const sheetName of sheets) {
    const match = sheetName.match(/(\d{4})年(\d{1,2})月/);
    if (!match) continue;
    
    const key = `${match[1]}-${String(match[2]).padStart(2, '0')}`;
    
    // @ts-ignore
    const resp = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:I`,
    });
    
    const rows = resp.result.values || [];
    if (rows.length < 2) continue;

    const records: DailyRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const [date, , clockIn, clockOut, workTime, breaks, , pomodoros, manualFlag] = rows[i];
      if (!date || !clockIn) continue;
      
      records.push({
        date,
        clockIn: clockIn || null,
        clockInRaw: null,
        clockOut: clockOut || null,
        workSec: parseHMtoSec(workTime),
        breaks: Number(breaks) || 0,
        totalBreakSec: 0,
        awaySec: 0,
        pomodoros: Number(pomodoros) || 0,
        manual: manualFlag === 'TRUE',
        sessions: [],
      });
    }

    const existing = all[key] || [];
    records.forEach(xr => {
      const idx = existing.findIndex(r => r.date === xr.date);
      if (idx >= 0) {
        if (xr.clockOut) existing[idx] = { ...existing[idx], ...xr };
      } else {
        existing.push(xr);
      }
    });
    all[key] = existing;
  }
  
  saveMultipleRecords(all);
}

export async function syncWriteSheet(spreadsheetId: string): Promise<void> {
  if (!spreadsheetId) throw new Error("No spreadsheet ID");
  
  const all = getRecords();
  const sortedKeys = Object.keys(all).sort();
  if (sortedKeys.length === 0) return;

  // @ts-ignore
  const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = meta.result.sheets.map((s: any) => s.properties.title);

  const daysStr = ['日', '月', '火', '水', '木', '金', '土'];

  for (const key of sortedKeys) {
    const rows = all[key];
    const [y, m] = key.split('-');
    const sheetName = `${y}年${parseInt(m, 10)}月`;
    
    if (!existingSheets.includes(sheetName)) {
      // @ts-ignore
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
      });
      existingSheets.push(sheetName);
    }
    
    const values = [['日付', '曜日', '出勤', '退勤', '勤務時間', '休憩回数', '休憩合計', 'ポモドーロ', '手動']];
    rows.forEach(r => {
      const dObj = new Date(r.date);
      const dow = daysStr[dObj.getDay()];
      values.push([
        r.date,
        dow,
        r.clockIn || '',
        r.clockOut || '',
        r.workSec ? fmtSecToHM(r.workSec) : '',
        r.breaks.toString(),
        r.totalBreakSec ? fmtSecToHM(r.totalBreakSec) : '00:00',
        r.pomodoros.toString(),
        r.manual ? 'TRUE' : 'FALSE'
      ]);
    });
    
    // @ts-ignore
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1:I${values.length}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
  }
}

export async function createSpreadsheet(): Promise<string> {
  // @ts-ignore
  const res = await window.gapi.client.sheets.spreadsheets.create({
    resource: { properties: { title: `KINKAN 勤怠記録 (Web)` } },
  });
  return res.result.spreadsheetId;
}
