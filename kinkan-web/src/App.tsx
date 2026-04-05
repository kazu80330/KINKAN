import { useState } from 'react';
import { Pomodoro } from './components/Pomodoro';
import { TaskBoard } from './components/TaskBoard';
import { GoogleSync } from './components/GoogleSync';
import { MonthlyReport } from './components/MonthlyReport';
import { useAttendance } from './lib/useAttendance';

function formatWorkTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'report'>('home');
  const { record, working, clockIn, clockOut, addPomodoro } = useAttendance();

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
              <div className={`status-indicator ${working ? 'working' : 'idle'}`}>
                <div className="status-dot"></div>
                <div className="status-text">{working ? '作業中' : '待機中'}</div>
              </div>

              {record && (
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  {record.clockIn && <span>出勤: <span style={{ color: 'var(--text)' }}>{record.clockIn}</span></span>}
                  {record.clockOut && <span>退勤: <span style={{ color: 'var(--text)' }}>{record.clockOut}</span></span>}
                  {record.workSec > 0 && <span>勤務: <span style={{ color: 'var(--accent)' }}>{formatWorkTime(record.workSec)}</span></span>}
                  {record.pomodoros > 0 && <span>🍅 <span style={{ color: 'var(--accent)' }}>{record.pomodoros}</span></span>}
                </div>
              )}

              <div className="action-buttons">
                {!working ? (
                  <button className="btn btn-primary btn-glow" onClick={clockIn}>
                    <span>▶ 出勤</span>
                  </button>
                ) : (
                  <button className="btn btn-danger btn-glow" onClick={clockOut}>
                    <span>■ 退勤</span>
                  </button>
                )}
              </div>
            </section>

            <div className="dashboard-grid">
              <TaskBoard />
              <Pomodoro working={working} onPomodoroComplete={addPomodoro} />
            </div>
          </>
        ) : (
          <MonthlyReport />
        )}
      </main>
    </div>
  );
}

export default App;