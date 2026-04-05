import { useState } from 'react';
import { Pomodoro } from './components/Pomodoro';
import { TaskBoard } from './components/TaskBoard';
import { GoogleSync } from './components/GoogleSync';
import { MonthlyReport } from './components/MonthlyReport';
import { BreakCard } from './components/BreakCard';
import { useAttendance } from './lib/useAttendance';

const AUTO_START_KEY = 'kinkan_pomodoro_autostart';

function formatWorkTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'report'>('home');
  const [autoStart, setAutoStart] = useState(() => localStorage.getItem(AUTO_START_KEY) !== 'false');

  const {
    record,
    working,
    clockIn,
    clockOut,
    addPomodoro,
    onBreak,
    breakStartRaw,
    breakStart,
    breakEnd,
  } = useAttendance();

  const handleAutoStartToggle = (val: boolean) => {
    setAutoStart(val);
    localStorage.setItem(AUTO_START_KEY, String(val));
  };

  return (
    <div className="app-container">
      <header className="glass-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo">KINKAN</div>
          <div className="date-display">{new Date().toLocaleDateString('ja-JP')}</div>
        </div>

        <div className="nav-tabs" style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '12px', alignSelf: 'flex-start' }}>
          <button className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>出退勤ダッシュボード</button>
          <button className={`nav-tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>月次レポート</button>
        </div>
      </header>

      <main className="main-content">
        <GoogleSync />

        {activeTab === 'home' ? (
          <>
            <section className="status-card glass-panel">
              <div className={`status-indicator ${working ? 'working' : ''}`}>
                <div className="status-dot"></div>
                <div className="status-text">
                  {onBreak ? '休憩中' : working ? '作業中' : '待機中'}
                </div>
              </div>

              {record && (
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                  {record.clockIn && <span>出勤: <span style={{ color: 'var(--text)' }}>{record.clockIn}</span></span>}
                  {record.clockOut && <span>退勤: <span style={{ color: record.overnight ? 'var(--warning)' : 'var(--text)' }}>{record.clockOut}</span></span>}
                  {record.workSec > 0 && <span>勤務: <span style={{ color: 'var(--accent)' }}>{formatWorkTime(record.workSec)}</span></span>}
                  {record.totalBreakSec > 0 && <span>休憩: <span style={{ color: 'var(--text-dim)' }}>{formatWorkTime(record.totalBreakSec)}</span></span>}
                  {record.pomodoros > 0 && <span>🍅 <span style={{ color: 'var(--accent)' }}>{record.pomodoros}</span></span>}
                </div>
              )}

              <div className="action-buttons">
                {!working ? (
                  <button className="btn btn-primary btn-glow" onClick={clockIn} disabled={onBreak}>
                    <span>▶ 出勤</span>
                  </button>
                ) : (
                  <button className="btn btn-danger btn-glow" onClick={clockOut} disabled={onBreak}>
                    <span>■ 退勤</span>
                  </button>
                )}
              </div>

              {/* autoStart トグル */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <div
                    onClick={() => handleAutoStartToggle(!autoStart)}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px',
                      background: autoStart ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: autoStart ? '19px' : '3px',
                      width: '14px', height: '14px',
                      borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s',
                    }} />
                  </div>
                  出勤時にポモドーロを自動スタート
                </label>
              </div>
            </section>

            <div className="dashboard-grid">
              <TaskBoard />
              <Pomodoro working={working} autoStart={autoStart} onPomodoroComplete={addPomodoro} />
            </div>

            <BreakCard
              working={working}
              onBreak={onBreak}
              breakStartRaw={breakStartRaw}
              onBreakStart={breakStart}
              onBreakEnd={breakEnd}
              totalBreakSec={record?.totalBreakSec ?? 0}
              breakCount={record?.breaks ?? 0}
            />
          </>
        ) : (
          <MonthlyReport />
        )}
      </main>
    </div>
  );
}

export default App;
