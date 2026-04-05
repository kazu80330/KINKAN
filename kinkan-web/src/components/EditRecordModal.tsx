import { useState } from 'react';
import { DailyRecord } from '../lib/types';
import { saveRecord, deleteRecord } from '../lib/storage';

interface Props {
  date: string;       // "YYYY/MM/DD"
  record: DailyRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function parseTimeToSec(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
  return 0;
}

function calcWorkSecFromTimes(clockIn: string, clockOut: string, overnight: boolean): number {
  if (!clockIn || !clockOut) return 0;
  const inSec = parseTimeToSec(clockIn.replace('翌', ''));
  const outSec = parseTimeToSec(clockOut.replace('翌', ''));
  const diff = outSec - inSec + (overnight || outSec < inSec ? 86400 : 0);
  return diff > 0 ? diff : 0;
}

export function EditRecordModal({ date, record, onClose, onSaved }: Props) {
  const [clockIn, setClockIn] = useState(record?.clockIn ?? '');
  const [clockOut, setClockOut] = useState(record?.clockOut?.replace('翌', '') ?? '');
  const [isOvernight, setIsOvernight] = useState(record?.overnight ?? false);
  const [breaks, setBreaks] = useState(String(record?.breaks ?? 0));
  const [pomodoros, setPomodoros] = useState(String(record?.pomodoros ?? 0));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const workSec = calcWorkSecFromTimes(clockIn, clockOut, isOvernight);
    const baseRecord: DailyRecord = record ?? {
      date,
      clockIn: null,
      clockInRaw: null,
      clockOut: null,
      workSec: 0,
      breaks: 0,
      totalBreakSec: 0,
      awaySec: 0,
      pomodoros: 0,
      manual: true,
      sessions: [],
    };

    const updated: DailyRecord = {
      ...baseRecord,
      clockIn: clockIn || null,
      clockOut: clockOut ? (isOvernight ? `翌${clockOut}` : clockOut) : null,
      workSec,
      breaks: parseInt(breaks, 10) || 0,
      pomodoros: parseInt(pomodoros, 10) || 0,
      manual: true,
      overnight: isOvernight,
    };

    saveRecord(updated);
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteRecord(date);
    onSaved();
    onClose();
  };

  // モーダル外クリックで閉じる
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal-panel glass-panel">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
            {date} の記録を編集
          </h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>出勤時刻</label>
            <input
              type="time"
              step="1"
              value={clockIn.replace('翌', '')}
              onChange={e => setClockIn(e.target.value)}
              className="task-input"
            />
          </div>

          <div className="modal-field">
            <label>退勤時刻</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="time"
                step="1"
                value={clockOut}
                onChange={e => setClockOut(e.target.value)}
                className="task-input"
                style={{ flex: 1 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isOvernight}
                  onChange={e => setIsOvernight(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                翌日
              </label>
            </div>
          </div>

          <div className="modal-field">
            <label>休憩回数</label>
            <input
              type="number"
              min="0"
              value={breaks}
              onChange={e => setBreaks(e.target.value)}
              className="task-input"
            />
          </div>

          <div className="modal-field">
            <label>🍅 ポモドーロ数</label>
            <input
              type="number"
              min="0"
              value={pomodoros}
              onChange={e => setPomodoros(e.target.value)}
              className="task-input"
            />
          </div>

          {clockIn && clockOut && (
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'right' }}>
              勤務時間: {(() => {
                const sec = calcWorkSecFromTimes(clockIn, clockOut, isOvernight);
                const h = Math.floor(sec / 3600);
                const m = Math.floor((sec % 3600) / 60);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              })()}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {record && (
            <button
              className={`btn btn-sm ${confirmDelete ? 'btn-danger' : 'btn-outline'}`}
              onClick={handleDelete}
              style={{ marginRight: 'auto' }}
            >
              {confirmDelete ? '本当に削除する' : '🗑 削除'}
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={onClose}>キャンセル</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
