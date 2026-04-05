import { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { getRecords } from '../lib/storage';
import { DailyRecord } from '../lib/types';
import { EditRecordModal } from './EditRecordModal';

function formatHHMM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function MonthlyReport() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editTarget, setEditTarget] = useState<{ date: string; record: DailyRecord | null } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const monthRecords = useMemo((): Record<number, DailyRecord> => {
    const all = getRecords();
    const records = all[monthKey] || [];
    const map: Record<number, DailyRecord> = {};
    for (const r of records) {
      const day = parseInt(r.date.split('/')[2], 10);
      map[day] = r;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, refreshKey]);

  const summary = useMemo(() => {
    const records = Object.values(monthRecords);
    const workDays = records.filter(r => r.clockIn !== null).length;
    const totalWorkSec = records.reduce((sum, r) => sum + (r.workSec || 0), 0);
    const totalPomodoros = records.reduce((sum, r) => sum + (r.pomodoros || 0), 0);
    const avgWorkSec = workDays > 0 ? totalWorkSec / workDays : 0;
    return { workDays, totalWorkSec, avgWorkSec, totalPomodoros };
  }, [monthRecords]);

  const maxWorkSec = useMemo(() => {
    const vals = Object.values(monthRecords).map(r => r.workSec || 0);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [monthRecords]);

  const handleSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleRowClick = (day: number) => {
    const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    setEditTarget({ date: dateStr, record: monthRecords[day] ?? null });
  };

  const handleExportXlsx = () => {
    const rows = [...Array(daysInMonth)].map((_, i) => {
      const day = i + 1;
      const r = monthRecords[day];
      const dateStr = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const weekday = ['日', '月', '火', '水', '木', '金', '土'][new Date(year, month - 1, day).getDay()];
      return {
        日付: `${dateStr}(${weekday})`,
        出勤: r?.clockIn ?? '',
        退勤: r?.clockOut ?? '',
        勤務時間: r?.workSec ? formatHHMM(r.workSec) : '',
        休憩回数: r?.breaks ?? '',
        ポモドーロ: r?.pomodoros ?? '',
        日跨ぎ: r?.overnight ? '○' : '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${year}-${String(month).padStart(2, '0')}`);
    XLSX.writeFile(wb, `KINKAN_${year}${String(month).padStart(2, '0')}.xlsx`);
  };

  const summaryBox = [
    { label: '出勤日数', value: `${summary.workDays}日` },
    { label: '総勤務時間', value: formatHHMM(summary.totalWorkSec) },
    { label: '平均勤務時間', value: formatHHMM(summary.avgWorkSec) },
    { label: '🍅 総ポモドーロ', value: `${summary.totalPomodoros}` },
  ];

  return (
    <>
      <div className="report-container">
        <div className="report-controls glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="month-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-outline btn-sm" onClick={prevMonth}>‹</button>
            <h2 style={{ margin: 0, fontFamily: 'monospace' }}>
              {year}年 {month}月
            </h2>
            <button className="btn-outline btn-sm" onClick={nextMonth}>›</button>
          </div>
          <button className="btn-outline btn-sm" onClick={handleExportXlsx}>⬇ .xlsx エクスポート</button>
        </div>

        <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {summaryBox.map((box, i) => (
            <div key={i} className="summary-card glass-panel" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', fontFamily: 'monospace' }}>{box.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{box.label}</div>
            </div>
          ))}
        </div>

        <div className="table-card glass-panel" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>月次勤務記録</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>行をクリックして編集</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>日付</th>
                <th style={{ padding: '12px' }}>出勤</th>
                <th style={{ padding: '12px' }}>退勤</th>
                <th style={{ padding: '12px', minWidth: '160px' }}>勤務時間</th>
                <th style={{ padding: '12px' }}>休憩</th>
                <th style={{ padding: '12px' }}>🍅</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const r = monthRecords[day];
                const barPct = r && r.workSec > 0 ? (r.workSec / maxWorkSec) * 100 : 0;
                const weekday = new Date(year, month - 1, day).getDay();
                const isWeekend = weekday === 0 || weekday === 6;

                return (
                  <tr
                    key={day}
                    onClick={() => handleRowClick(day)}
                    style={{
                      borderBottom: '1px solid var(--surface-border)',
                      fontFamily: 'monospace',
                      background: isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,106,247,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent')}
                  >
                    <td style={{ padding: '12px', color: isWeekend ? 'var(--text-dim)' : 'var(--text)' }}>
                      {String(day).padStart(2, '0')}
                      <span style={{ marginLeft: '4px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {['日', '月', '火', '水', '木', '金', '土'][weekday]}
                      </span>
                      {r?.manual && <span title="手動編集" style={{ marginLeft: '4px', fontSize: '0.7rem', color: 'var(--warning)' }}>✎</span>}
                    </td>
                    <td style={{ padding: '12px', color: r?.clockIn ? 'var(--text)' : 'var(--text-dim)' }}>
                      {r?.clockIn ? r.clockIn.slice(0, 5) : '—'}
                    </td>
                    <td style={{ padding: '12px', color: r?.clockOut ? (r.overnight ? 'var(--warning)' : 'var(--text)') : 'var(--text-dim)' }}>
                      {r?.clockOut ?? '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {r && r.workSec > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{formatHHMM(r.workSec)}</span>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                            <div style={{ width: `${barPct}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: r?.breaks ? 'var(--text)' : 'var(--text-dim)' }}>
                      {r?.breaks ?? 0}
                    </td>
                    <td style={{ padding: '12px', color: r?.pomodoros ? 'var(--accent)' : 'var(--text-dim)' }}>
                      {r?.pomodoros ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <EditRecordModal
          date={editTarget.date}
          record={editTarget.record}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
