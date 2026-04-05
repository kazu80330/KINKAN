import { useState, useCallback } from 'react';
import { DailyRecord } from './types';
import { getTodayRecord, saveRecord } from './storage';

const BREAK_START_KEY = 'kinkan_break_start';

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function timeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function calcWorkSec(sessions: { in: string; out: string }[]): number {
  return sessions.reduce((total, s) => {
    if (!s.in || !s.out) return total;
    const diff = (new Date(s.out).getTime() - new Date(s.in).getTime()) / 1000;
    return total + (diff > 0 ? diff : 0);
  }, 0);
}

export function useAttendance() {
  const [record, setRecord] = useState<DailyRecord | null>(() => getTodayRecord());

  // 休憩開始時刻をlocalStorageで永続化（ページリロード時にも継続表示）
  const [onBreak, setOnBreak] = useState<boolean>(() => !!localStorage.getItem(BREAK_START_KEY));
  const [breakStartRaw, setBreakStartRaw] = useState<string | null>(() => localStorage.getItem(BREAK_START_KEY));

  // working = 出勤中（clockInあり・clockOutなし・休憩中でない）
  const working = record !== null && record.clockIn !== null && record.clockOut === null;

  const clockIn = useCallback(() => {
    const now = new Date();
    const existing = getTodayRecord();
    const base: DailyRecord = existing ?? {
      date: todayDateStr(),
      clockIn: null,
      clockInRaw: null,
      clockOut: null,
      workSec: 0,
      breaks: 0,
      totalBreakSec: 0,
      awaySec: 0,
      pomodoros: 0,
      manual: false,
      sessions: [],
    };

    // 退勤後の再出勤は休憩カウント
    const isReturn = base.sessions.length > 0 && base.clockOut !== null;
    if (isReturn) {
      base.breaks = (base.breaks || 0) + 1;
    }

    const updated: DailyRecord = {
      ...base,
      clockIn: base.clockIn ?? timeStr(now),
      clockInRaw: base.clockInRaw ?? now.toISOString(),
      clockOut: null,
      clockOutRaw: undefined,
      overnight: false,
      sessions: [...base.sessions, { in: now.toISOString(), out: '' }],
    };

    saveRecord(updated);
    setRecord({ ...updated });
  }, []);

  const clockOut = useCallback(() => {
    const now = new Date();
    const current = getTodayRecord();
    if (!current) return;

    // 開いているセッションを閉じる
    const sessions = current.sessions.map((s, i) => {
      if (i === current.sessions.length - 1 && !s.out) {
        return { ...s, out: now.toISOString() };
      }
      return s;
    });

    const workSec = calcWorkSec(sessions);

    // 日跨ぎ検出：出勤日と退勤日が違う場合
    const clockInDate = current.clockInRaw ? new Date(current.clockInRaw) : null;
    const overnight =
      clockInDate !== null &&
      (now.getFullYear() !== clockInDate.getFullYear() ||
        now.getMonth() !== clockInDate.getMonth() ||
        now.getDate() !== clockInDate.getDate());

    // 日跨ぎ時は "翌HH:mm:ss" 形式で表示
    const clockOutDisplay = overnight ? `翌${timeStr(now)}` : timeStr(now);

    const updated: DailyRecord = {
      ...current,
      clockOut: clockOutDisplay,
      clockOutRaw: now.toISOString(),
      sessions,
      workSec,
      overnight,
    };

    saveRecord(updated);
    setRecord({ ...updated });
  }, []);

  const addPomodoro = useCallback(() => {
    const current = getTodayRecord();
    if (!current) return;
    const updated: DailyRecord = { ...current, pomodoros: current.pomodoros + 1 };
    saveRecord(updated);
    setRecord({ ...updated });
  }, []);

  // --- 手動休憩トラッキング ---

  const breakStart = useCallback(() => {
    const now = new Date();
    const isoStr = now.toISOString();
    localStorage.setItem(BREAK_START_KEY, isoStr);
    setOnBreak(true);
    setBreakStartRaw(isoStr);
  }, []);

  const breakEnd = useCallback(() => {
    const startRaw = localStorage.getItem(BREAK_START_KEY);
    localStorage.removeItem(BREAK_START_KEY);
    setOnBreak(false);
    setBreakStartRaw(null);

    if (!startRaw) return;
    const current = getTodayRecord();
    if (!current) return;

    const elapsed = Math.floor((Date.now() - new Date(startRaw).getTime()) / 1000);
    const updated: DailyRecord = {
      ...current,
      breaks: current.breaks + 1,
      totalBreakSec: current.totalBreakSec + elapsed,
    };
    saveRecord(updated);
    setRecord({ ...updated });
  }, []);

  return {
    record,
    working,
    clockIn,
    clockOut,
    addPomodoro,
    onBreak,
    breakStartRaw,
    breakStart,
    breakEnd,
  };
}
