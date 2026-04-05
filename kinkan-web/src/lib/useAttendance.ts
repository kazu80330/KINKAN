import { useState, useCallback } from 'react';
import { DailyRecord } from './types';
import { getTodayRecord, saveRecord } from './storage';

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
    return total + (new Date(s.out).getTime() - new Date(s.in).getTime()) / 1000;
  }, 0);
}

export function useAttendance() {
  const [record, setRecord] = useState<DailyRecord | null>(() => getTodayRecord());

  // working = 出勤中（clockInあり・clockOutなし）
  const working = record !== null && record.clockIn !== null && record.clockOut === null;

  const clockIn = useCallback(() => {
    const now = new Date();
    // 既存レコードがあれば引き継ぐ（手動修正等への対応）
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

    // 既にセッションが存在する場合（退勤後の再出勤）は休憩としてカウント
    const isReturn = base.sessions.length > 0 && base.clockOut !== null;
    if (isReturn) {
      base.breaks = (base.breaks || 0) + 1;
    }

    const updated: DailyRecord = {
      ...base,
      clockIn: base.clockIn ?? timeStr(now), // 最初の出勤時刻を保持
      clockInRaw: base.clockInRaw ?? now.toISOString(),
      clockOut: null,
      clockOutRaw: undefined,
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
    const updated: DailyRecord = {
      ...current,
      clockOut: timeStr(now),
      clockOutRaw: now.toISOString(),
      sessions,
      workSec,
    };

    saveRecord(updated);
    setRecord({ ...updated });
  }, []);

  const addPomodoro = useCallback(() => {
    // 最新のレコードを読んでカウントアップ（複数タブ対応）
    const current = getTodayRecord();
    if (!current) return;
    const updated: DailyRecord = { ...current, pomodoros: current.pomodoros + 1 };
    saveRecord(updated);
    setRecord({ ...updated });
  }, []);

  return { record, working, clockIn, clockOut, addPomodoro };
}