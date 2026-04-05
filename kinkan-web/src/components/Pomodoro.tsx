import { useState, useEffect, useCallback } from 'react';

interface PomodoroProps {
  working: boolean;
  autoStart: boolean;
  onPomodoroComplete?: () => void;
}

// Web Audio API でチーン音を生成
function playChime(type: 'work' | 'break') {
  try {
    const ctx = new AudioContext();
    const freqs = type === 'work' ? [880, 1100, 1320] : [660, 880];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch {
    // AudioContext が使えない環境は無視
  }
}

export function Pomodoro({ working, autoStart, onPomodoroComplete }: PomodoroProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // autoStart が有効なら出勤と同時にスタート、退勤でリセット
  useEffect(() => {
    if (working && autoStart) {
      setIsActive(true);
    } else if (!working) {
      setIsActive(false);
      setTimeLeft(25 * 60);
      setMode('work');
      setProgress(0);
    }
  }, [working, autoStart]);

  const switchMode = useCallback((completedMode: 'work' | 'break') => {
    playChime(completedMode);
    if (completedMode === 'work') {
      onPomodoroComplete?.();
      setPomodoroCount(c => c + 1);
    }
    const newMode = completedMode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    setProgress(0);
  }, [onPomodoroComplete]);

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          const total = mode === 'work' ? 25 * 60 : 5 * 60;
          setProgress(((total - newTime) / total) * 100);
          return newTime;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      switchMode(mode);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, switchMode]);

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = (time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
    setProgress(0);
  };

  const handleSkip = () => {
    const newMode = mode === 'work' ? 'break' : 'work';
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    setProgress(0);
    setIsActive(false);
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="pomodoro-card glass-panel">
      <div className="pomodoro-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>ポモドーロタイマー</h3>
        </div>
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'work' ? 'active' : ''}`}
            onClick={() => { setMode('work'); setTimeLeft(25 * 60); setProgress(0); setIsActive(false); }}
          >
            作業 25分
          </button>
          <button
            className={`mode-tab ${mode === 'break' ? 'active' : ''}`}
            onClick={() => { setMode('break'); setTimeLeft(5 * 60); setProgress(0); setIsActive(false); }}
          >
            休憩 5分
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div className="pomodoro-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="ring-bg"></circle>
            <circle
              cx="50" cy="50" r="45"
              className={`ring-progress ${mode === 'break' ? 'break-mode' : ''}`}
              style={{ strokeDashoffset, strokeDasharray: circumference }}
            ></circle>
          </svg>
          <div className="time-display">{formatTime(timeLeft)}</div>
        </div>
        <div className="pomodoro-phase">{mode === 'work' ? '作業時間' : '休憩時間'}</div>

        {/* ポモドーロ達成ドット */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
          {[...Array(Math.min(pomodoroCount + 4, 8))].map((_, i) => (
            <div
              key={i}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: i < pomodoroCount ? 'var(--accent)' : 'transparent',
                border: '1px solid var(--surface-border)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      <div className="pomodoro-actions">
        <button
          className="btn btn-outline btn-sm"
          onClick={handleReset}
          disabled={!working}
          style={{ flex: 1 }}
        >
          ↺ リセット
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsActive(!isActive)}
          disabled={!working}
          style={{ flex: 1 }}
        >
          {isActive ? '⏸ 一時停止' : '▶ スタート'}
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleSkip}
          disabled={!working}
          style={{ flex: 1 }}
        >
          → スキップ
        </button>
      </div>
    </div>
  );
}
