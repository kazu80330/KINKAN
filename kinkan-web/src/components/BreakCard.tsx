import { useState, useEffect } from 'react';

interface BreakCardProps {
  working: boolean;
  onBreak: boolean;
  breakStartRaw: string | null;
  onBreakStart: () => void;
  onBreakEnd: () => void;
  totalBreakSec: number;
  breakCount: number;
}

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BreakCard({ working, onBreak, breakStartRaw, onBreakStart, onBreakEnd, totalBreakSec, breakCount }: BreakCardProps) {
  const [elapsed, setElapsed] = useState(0);

  // 休憩中はカウントアップ
  useEffect(() => {
    if (!onBreak || !breakStartRaw) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(breakStartRaw).getTime()) / 1000));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onBreak, breakStartRaw]);

  const canBreak = working || onBreak;

  return (
    <div className="break-card glass-panel">
      <div className="break-card-header">
        <h3 className="section-title">BREAK</h3>
        <div className="break-stats">
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {breakCount}回 / 合計 {formatElapsed(totalBreakSec)}
          </span>
        </div>
      </div>

      <div className="break-body">
        {onBreak ? (
          <div className="break-active">
            <div className="break-pulse">☕</div>
            <div className="break-elapsed" style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
              {formatElapsed(elapsed)}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '16px' }}>休憩中...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '1.8rem' }}>☕</div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>手動休憩</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>昼休み・長時間の離席に</p>
            </div>
          </div>
        )}

        {onBreak ? (
          <button
            className="btn btn-primary btn-glow"
            onClick={onBreakEnd}
            style={{ background: 'linear-gradient(135deg, var(--success), #4dd98a)' }}
          >
            <span>✓ 休憩終了</span>
          </button>
        ) : (
          <button
            className="btn btn-outline"
            onClick={onBreakStart}
            disabled={!canBreak}
            style={{ opacity: canBreak ? 1 : 0.4 }}
          >
            <span>☕ 休憩開始</span>
          </button>
        )}
      </div>
    </div>
  );
}
