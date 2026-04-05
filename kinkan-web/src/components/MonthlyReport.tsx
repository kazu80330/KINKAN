import { useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
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
  const chartRef = useRef<HTMLDivElement>(null);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const today = new Date();

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

  const handleDownloadPng = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: '#16161d' });
    const link = document.createElement('a');
    link.download = `KINKAN_chart_${year}${String(month).padStart(2, '0')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
        {/* Controls */}
        <div className="report-controls glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="month-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <button className="btn-outline btn-sm" onClick={prevMonth} style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
            <h2 style={{ margin: 0, fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, flex: 1, textAlign: 'center' }}>
              {year}年 {month}月
            </h2>
            <button className="btn-outline btn-sm" onClick={nextMonth} style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>›</button>
          </div>
          <button className="btn-outline btn-sm" onClick={handleExportXlsx} style={{ marginLeft: '12px', flexShrink: 0 }}>⬇ xlsx</button>
        </div>

        {/* Summary */}
        <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {summaryBox.map((box, i) => (
            <div key={i} className="glass-panel" style={{ textAlign: 'center', padding: '16px', borderRadius: '14px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', marginBottom: '4px' }}>{box.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{box.label}</div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="chart-card" ref={chartRef}>
          <div className="chart-header">
            <h3 className="section-title" style={{ margin: 0 }}>日別勤務時間</h3>
            <button className="btn-outline btn-sm" onClick={handleDownloadPng} style={{ fontSize: '0.7rem' }}>⬇ PNG保存</button>
          </div>
          <div className="bar-chart">
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const r = monthRecords[day];
              const workSec = r?.workSec || 0;
              const barHeightPct = workSec > 0 ? (workSec / maxWorkSec) * 100 : 0;
              const isToday =
                year === today.getFullYear() &&
                month === today.getMonth() + 1 &&
                day === today.getDate();
              const isManual = r?.manual ?? false;

              return (
                <div key={day} className="bar-col" title={workSec > 0 ? `${day}日: ${formatHHMM(workSec)}` : `${day}日`}>
                  <div
                    className={`bar-fill ${isToday ? 'bar-today' : isManual ? 'bar-manual' : ''}`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                  {(day === 1 || day % 5 === 0 || day === daysInMonth) && (
                    <div className="bar-label">{day}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="table-card glass-panel" style={{ overflowX: 'auto', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>月次勤務記録</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>行をクリックして編集</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'center' }}>
                <th style={{ padding: '0 10px 12px', textAlign: 'left', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap' }}>日付</th>
                <th style={{ padding: '0 10px 12px', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500 }}>出勤</th>
                <th style={{ padding: '0 10px 12px', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500 }}>退勤</th>
                <th style={{ padding: '0 10px 12px', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500, minWidth: '140px' }}>勤務時間</th>
                <th style={{ padding: '0 10px 12px', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500 }}>休憩</th>
                <th style={{ padding: '0 10px 12px', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 500 }}>🍅</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const r = monthRecords[day];
                const barPct = r && r.workSec > 0 ? (r.workSec / maxWorkSec) * 100 : 0;
                const weekday = new Date(year, month - 1, day).getDay();
                const isWeekend = weekday === 0 || weekday === 6;
                const isToday =
                  year === today.getFullYear() &&
                  month === today.getMonth() + 1 &&
                  day === today.getDate();

                return (
                  <tr
                    key={day}
                    onClick={() => handleRowClick(day)}
                    style={{
                      borderTop: '1px solid var(--surface-border)',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      background: isToday ? 'rgba(124,106,247,0.06)' : isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,106,247,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isToday ? 'rgba(124,106,247,0.06)' : isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent')}
                  >
                    <td style={{ padding: '8px 10px', color: isWeekend ? 'var(--accent2)' : 'var(--text)', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {String(day).padStart(2, '0')}
                      <span style={{ marginLeft: '4px', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                        {['日', '月', '火', '水', '木', '金', '土'][weekday]}
                      </span>
                      {r?.manual && <span title="手動編集" style={{ marginLeft: '4px', fontSize: '0.6rem', color: 'var(--warning)' }}>✎</span>}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: r?.clockIn ? 'var(--text)' : 'var(--surface-border)', whiteSpace: 'nowrap' }}>
                      {r?.clockIn ? r.clockIn.slice(0, 5) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: r?.clockOut ? (r.overnight ? 'var(--warning)' : 'var(--text)') : 'var(--surface-border)', whiteSpace: 'nowrap' }}>
                      {r?.clockOut ?? '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {r && r.workSec > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <span>{formatHHMM(r.workSec)}</span>
                          <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${barPct}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--surface-border)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: r?.breaks ? 'var(--text)' : 'var(--surface-border)' }}>
                      {r?.breaks ?? 0}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: r?.pomodoros ? 'var(--accent)' : 'var(--surface-border)' }}>
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
