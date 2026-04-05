import { useEffect, useState } from 'react';
import { syncWriteSheet, createSpreadsheet, GS_SHEET_KEY } from '../lib/googleSheets';

const GS_CLIENT_ID = '677174988738-nsld7okqc4t9jds39s0247mvgi2jshk3.apps.googleusercontent.com';
const GS_API_KEY   = 'AIzaSyC2iLMQMnmQ17Gk4eEP2fpDF-OZWdkiIy4';
const GS_SCOPES    = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export function GoogleSync() {
  const [status, setStatus] = useState('初期化中...');
  const [token, setToken] = useState<string | null>(localStorage.getItem('kinkan_gs_token'));
  const [sheetId, setSheetId] = useState<string | null>(localStorage.getItem(GS_SHEET_KEY));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.onload = () => {
      // @ts-ignore
      window.gapi.load('client', async () => {
        try {
          // @ts-ignore
          await window.gapi.client.init({
            apiKey: GS_API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          setReady(true);
          setStatus('Google未ログイン');
          if (token) {
            // @ts-ignore
            window.gapi.client.setToken({ access_token: token });
            setStatus('同期中（ログイン済み）');
          }
        } catch (e) {
          console.error('GAPI Init Error', e);
        }
      });
    };
    document.body.appendChild(scriptGapi);
  }, []);

  const handleLogin = () => {
    // @ts-ignore
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GS_CLIENT_ID,
      scope: GS_SCOPES,
      callback: (resp: any) => {
        if (resp.error) {
          setStatus('ログインエラー');
          return;
        }
        localStorage.setItem('kinkan_gs_token', resp.access_token);
        setToken(resp.access_token);
        // @ts-ignore
        window.gapi.client.setToken({ access_token: resp.access_token });
        setStatus('ログイン完了');
      },
    });
    client.requestAccessToken({ prompt: token ? '' : 'consent' });
  };

  const handleLogout = () => {
    if (token) {
      // @ts-ignore
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    localStorage.removeItem('kinkan_gs_token');
    // We intentionally keep GS_SHEET_KEY so we don't create a new sheet every time
    setToken(null);
    setStatus('ログアウト済み');
  };

  const syncNow = async () => {
    if (!token) return;
    setStatus('同期中...');
    try {
      let currentSheetId = sheetId;
      if (!currentSheetId) {
        currentSheetId = await createSpreadsheet();
        localStorage.setItem(GS_SHEET_KEY, currentSheetId);
        setSheetId(currentSheetId);
      }
      
      await syncWriteSheet(currentSheetId);
      // await syncReadSheet(currentSheetId); // Normally we might read, but writes take priority in KINKAN usually
      setStatus('同期完了');
    } catch (e) {
      console.error(e);
      setStatus('同期エラー');
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className={`status-dot ${token ? 'active' : ''}`} style={{ background: token ? 'var(--success)' : 'var(--warning)', width: '12px', height: '12px', borderRadius: '50%' }}></div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Google Sheets 連携</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>ステータス: {status}</p>
        </div>
      </div>
      <div>
        {!token ? (
          <button className="btn btn-outline btn-sm" onClick={handleLogin} disabled={!ready}>🔑 ログイン</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline btn-sm" onClick={syncNow}>🔃 同期</button>
            <button className="btn btn-danger btn-sm" onClick={handleLogout}>✕ ログアウト</button>
          </div>
        )}
      </div>
    </div>
  );
}
