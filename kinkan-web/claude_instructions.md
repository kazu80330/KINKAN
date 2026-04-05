# KINKAN Web App 開発引き継ぎ指示書 (For Claude Code)

Claude Codeへ。このドキュメントは、ローカル環境で動作していたHTMLベースの勤怠管理アプリ「KINKAN」を、最新のReact(Vite) + TypeScript + グラスモーフィズムUIを用いてモダンなWebアプリ（PWA対応・GitHub Pages公開）へと再構築するプロジェクトの引き継ぎ資料です。

ここまでのフェーズで、基盤となるコンポーネント構造とデザイン、およびGoogle Sheets APIの通信ロジック構築までが完了しています。以下の現状と「次のステップ（実装指示）」を読み、残りのタスクを完了させてください。

---

## 1. プロジェクトの現状

- **ディレクトリ**: `kinkan-web/`
- **スタック**: Vite, React, TypeScript
- **デザイン**: `src/index.css` にてグラスモーフィズム・ダークテーマを実装済み。

### 完成済みの機能・コンポーネント
1. **`App.tsx`**: メインのダッシュボード（出退勤ボタンとステータス表示。上部タブでホームとレポート画面を切り替え）。
2. **`components/Pomodoro.tsx`**: 独立したポモドーロタイマー（作業25分/休憩5分などのアニメーションと処理）。
3. **`components/TaskBoard.tsx`**: タスク（ToDo）を管理するUIボード。
4. **`components/GoogleSync.tsx`**: Google Identity Services(GSI)を用いたOAuth認証のUI。
5. **`lib/types.ts`, `lib/storage.ts`, `lib/googleSheets.ts`**: `DailyRecord`の型定義と、LocalStorageへの非同期保存、Google Spreadsheetへの書き込み・読み込みの純粋なロジック層。
6. **`components/MonthlyReport.tsx`**: 月次サマリーとカレンダー一覧のUIレイアウトのみ（現在は固定のダミーデータが入っている状態）。

---

## 2. 実行してほしいタスク（指示内容）

Claude Codeは以下の実装作業を進めてください。

### タスク A: コアロジックの結合（App.tsx と storage.ts の結合）
現在 `App.tsx` の「▶ 出勤」「■ 退勤」ボタンや、`Pomodoro.tsx` の完了ステータスは画面上のみのフリ（useStateのみ）になっています。
これを `src/lib/storage.ts` (`saveRecord`, `getTodayRecord`) と連携させ、実際の `DailyRecord`（出勤時間、総勤務時間の計算、休憩時間の合算、ポモドーロ完了数のカウントアップ）に保存・更新されるように Zustand, Context API、またはカスタムフックを用いて結合してください。

### タスク B: 月次レポート（MonthlyReport.tsx）のデータ動的化
`components/MonthlyReport.tsx` に現在ベタ書きされているダミーデータを削除し、`lib/storage.ts` の `getRecords()` から取得した過去の勤務データに基づいてレンダーされるようにしてください。
- 出勤日数、総勤務時間、総ポモドーロ数を再計算して表示。
- カレンダー表の中に、日ごとのグラフ（勤務時間のバー）や実際の出退勤時間をマッピングしてください。

### タスク C: PWA対応 (Progressive Web App)
viteプロジェクトをPWA対応にしてください。
1. `vite-plugin-pwa` をインストールし、`vite.config.ts` に設定を追加してください。
2. Android/iOS/Desktopで「アプリとしてインストール」ができるように、`manifest.json` に相当する設定とアイコン（必要であればプレースホルダー）を設定してください。

### タスク D: GitHub Pagesに向けたデプロイ設定
1. `vite.config.ts` の `base` パス設定を、リポジトリ名に応じて修正してください（例: `base: '/KINKAN/'` 等）。
2. `.github/workflows/deploy.yml` を作成し、`main` ブランチにプッシュされた際に GitHub Pages に自動デプロイされる仕組みを構築してください。

---

## 3. 注意点 (Context & Constraints)

- **オフラインファースト**: ユーザーはオフラインでも出退勤ボタンを押せる必要があります。データは常に `localStorage` を正として扱い、`GoogleSync.tsx` の「同期」ボタンを押した際（またはオンライン時）にスプレッドシート（`syncWriteSheet`）へとバルク更新されるアーキテクチャを維持してください。
- **デザインの維持**: `index.css` で定義されている `glass-panel` などのクラスやスタイルは非常に美しく仕上がっています。コンポーネントを修正・追加する際も、インラインのCSSや別フレームワーク（Tailwindなど）で上書きせず、既存のVanilla CSSを活用してリッチなUIを維持してください。

以上です。準備ができたら `npm run dev` でエラーがないことを確認しつつ、タスクAから順番に実装を開始してください。
