# 実装設計書

| 項目 | 内容 |
|---|---|
| 工程 | c2 実装 |
| plan ファイル | `plans/c2_implement.md` |
| 入力 | `docs/c1_implementation-plan/implementation-plan.md` |
| 最終更新 | 2026-09-27 12:11 |

## 1. ディレクトリ構成

```
poker-ranking/
├── .devcontainer/devcontainer.json   # Task-002：Node.js 24.21.0 の固定、npm ci、タイムゾーン（JST）
├── .gitignore                        # Task-001：dist/、node_modules/、.clasp.json、.clasprc.json、Task-016：.clasp-*.json
├── .clasp-aggregate.json             # Task-016：集計用の clasp の設定（開発者が作成。Git の管理対象外）
├── .nvmrc                            # Task-001：Node.js の版（24.21.0）
├── .prettierignore                   # Task-001
├── package.json / package-lock.json  # Task-001
├── eslint.config.js                  # Task-001
├── jest.config.js                    # Task-001
├── scripts/
│   ├── build.js                      # Task-003：dist/ の生成
│   └── deploy.js                     # Task-016：ビルドと clasp push
├── deploy/
│   └── aggregate/.clasp.json.example # Task-016：集計用の clasp の設定の見本
├── src/
│   └── aggregate/                    # 集計用プロジェクト
│       ├── appsscript.json           # Task-016：マニフェスト（タイムゾーン、権限）
│       ├── validate.js               # Task-004：行の確認
│       ├── calc.js                   # Task-005：収支・ウェイト・端数の計算
│       ├── rank.js                   # Task-006：順位付け
│       ├── aggregate.js              # Task-007：年ごとの集計と 3 つのランキング
│       ├── player.js                 # Task-008：個人の戦績の集計
│       ├── input-access.js           # Task-009：入力用スプレッドシートの読み込み、Task-010：除外した行の印付け
│       ├── viewer-writer.js          # Task-011：閲覧用スプレッドシートへの書き出し
│       ├── setup.js                  # Task-012：入力用スプレッドシートの初期設定、Task-013：ニックネームの候補の更新
│       ├── run.js                    # Task-014：集計の実行の処理の流れ
│       └── menu.js                   # Task-015：メニュー
│   └── viewer/                       # 閲覧用プロジェクト
│       ├── server.js                 # Task-017：データの取得、Task-018：画面の返却
│       └── client/
│           ├── index.html            # Task-018：画面の HTML（ビルド時に CSS・JavaScript を埋め込む）
│           ├── format.js             # Task-019：表示用の整形、Task-021：ランキングの表示の定義
│           ├── screen-top.js         # Task-021：Screen-001 トップ画面
│           ├── screen-ranking.js     # Task-022：Screen-002〜004 ランキング画面
│           ├── screen-player.js      # Task-023：Screen-005 個人の戦績画面
│           ├── app.js                # Task-020：画面の共通部分（最後に読み込む）
│           └── style.css             # Task-020：画面の見た目
└── tests/
    └── small/
        ├── aggregate/validate.test.js # Task-004
        ├── aggregate/calc.test.js    # Task-005
        ├── aggregate/rank.test.js    # Task-006
        ├── aggregate/aggregate.test.js # Task-007
        ├── aggregate/player.test.js  # Task-008
        ├── aggregate/input-access.test.js # Task-009・010
        ├── aggregate/viewer-writer.test.js # Task-011
        ├── aggregate/setup.test.js   # Task-012・013
        ├── aggregate/run.test.js     # Task-014
        ├── aggregate/menu.test.js    # Task-015
        ├── viewer/server.test.js     # Task-017・018
        ├── viewer/format.test.js     # Task-019
        ├── viewer/app.test.js        # Task-020
        ├── viewer/screen-top.test.js # Task-021
        ├── viewer/screen-ranking.test.js # Task-022
        ├── viewer/screen-player.test.js # Task-023
        └── scripts/build.test.js     # Task-003
```

| フォルダ | 役割 | 由来 |
|---|---|---|
| `scripts/` | ビルド・デプロイ用のスクリプト（Node.js で動く） | implementation-plan.md 2.（ディレクトリ構成） |
| `src/` | GAS のコード。`src/aggregate/`（集計用）、`src/viewer/`（閲覧用） | implementation-plan.md 2.（ディレクトリ構成）、Decision-0007 |
| `tests/` | Small テスト。`tests/small/aggregate/`、`tests/small/viewer/`、`tests/small/scripts/` | implementation-plan.md 2.（ディレクトリ構成） |
| `dist/` | ビルドの出力（Git の管理対象外） | implementation-plan.md 2.（ディレクトリ構成） |

### 開発ツールと npm スクリプト

| 項目 | 内容 | 由来 |
|---|---|---|
| Node.js | 24.21.0（`package.json` の `engines`、`.nvmrc`、Dev Container の Node.js の Feature） | implementation-plan.md 2.、c1/Question-023 |
| 開発用の依存ライブラリ（版を固定） | `prettier` 3.9.9、`eslint` 10.11.0、`jest` 30.5.2、`@google/clasp` 3.4.1 | implementation-plan.md 2.（依存ライブラリの管理方法） |
| `npm run build` | `node scripts/build.js`（`dist/aggregate/`・`dist/viewer/` を生成する。下記「ビルドの処理」） | Task-001、Task-003 |
| `npm test` | `jest --passWithNoTests`（`tests/` 配下の `*.test.js` を Node.js の環境で実行） | Task-001 |
| `npm run lint` | `eslint .` | Task-001 |
| `npm run format` | `prettier --write .`（`.prettierignore` により Markdown・ドキュメントは対象外） | Task-001 |
| `npm run audit` | `npm audit --audit-level=moderate` | Task-001、c1/Question-005 |
| `npm run deploy:aggregate`・`deploy:viewer` | `node scripts/deploy.js aggregate`・`viewer`（下記「デプロイの処理」。`viewer` は Task-026 で対応する） | Task-001、Task-016、Task-026 |

### ESLint の設定（`eslint.config.js`）

| 対象 | 設定 |
|---|---|
| 全 `.js` | 推奨ルール（ESLint 本体の組み込みルールのうち recommended の印が付いた 64 ルール）、ECMAScript 2022、CommonJS |
| `src/aggregate/**`、`src/viewer/*.js` | script として扱う。GAS の組み込みオブジェクト（`SpreadsheetApp`、`HtmlService`、`PropertiesService`、`LockService`、`ScriptApp`、`Session`、`Utilities`、`Logger`、`console`）と `module` を既知として登録 |
| `src/viewer/client/**` | script として扱う。`window`、`document`、`console`、`google`、`module` を既知として登録 |
| `scripts/**`、`*.config.js` | Node.js の組み込みオブジェクト（`require`、`module`、`__dirname`、`__filename`、`process`、`console`）を既知として登録 |
| `tests/**` | Node.js と Jest の組み込みオブジェクトを既知として登録 |
| 対象外 | `dist/`、`node_modules/` |

- 後続のタスクで使う組み込みオブジェクトが増えた場合は、該当タスクで登録を追加し、本書に記載する。

### ビルドの処理（`scripts/build.js`）

| 順 | 処理 | 由来 |
|---|---|---|
| 1 | `dist/` を丸ごと削除する（前回の出力を残さない） | Task-003 期待値3、c1/Question-007-1 |
| 2 | `src/aggregate/`・`src/viewer/` のそれぞれについて、直下の `.js` と `appsscript.json` のみを `dist/<プロジェクト>/` にそのまま複製する（サブフォルダ・その他のファイルは出力しない）。プロジェクトのフォルダがない場合は出力しない | Task-003 期待値1、c1/Question-007-1 |
| 3 | `src/<プロジェクト>/client/index.html` がある場合、`<link rel="stylesheet" href="…">` を `<style>` に、`<script src="…"></script>` を `<script>` に置き換え、参照先の内容を埋め込んだ `index.html` を `dist/<プロジェクト>/` に出力する。JavaScript は `index.html` に書いた順に埋め込まれる | Task-003 期待値2、c1/Question-001 |

- ローカルのテスト用の公開部分（`module` がある場合のみ公開する記述）は、そのまま出力する。GAS・ブラウザには `module` がないため動作に影響しない（Task-003 作業内容）。
- 画面の JavaScript の読み込み順は、`src/viewer/client/index.html` の `<script src>` の並び順で決まる（「4. 主要な処理の流れ」の「画面の共通部分」）。
- 次の場合はエラーにしてビルドを止める：埋め込む CSS に `</style`、JavaScript に `</script` が含まれる（HTML のタグが途中で閉じるため）。`index.html` が `client/` の外のファイルを参照している。
- `build(rootDir)` を公開し、Small テストでは一時フォルダを `rootDir` にして確認する。

### デプロイの処理（`scripts/deploy.js`、Task-016）

| 順 | 処理 | 由来 |
|---|---|---|
| 1 | 対象（`aggregate`）を確かめる。対象外の値はエラー | Task-016 |
| 2 | リポジトリの直下の clasp の設定ファイル（集計用：`.clasp-aggregate.json`）を読む。ない場合、JSON として読めない場合、`rootDir` が `dist/<対象>` を指さない場合、`scriptId` が空の場合はエラーにして止める | c1/Question-007、c1/Question-007-1 |
| 3 | ビルドする（`build`） | implementation-plan.md 2.（デプロイの方法） |
| 4 | `node_modules/.bin/clasp --project <設定ファイル> push --force` を、シェルを介さずに実行する。失敗（終了コードが 0 以外）はエラー | implementation-plan.md 2.（デプロイの方法） |

- clasp（3.4.1）は、設定ファイルのあるフォルダを基点とし、`rootDir` がその外にある場合は拒否する（`node_modules/@google/clasp/build/src/core/clasp.js` の `initClaspInstance`）。そのため、設定ファイルは `deploy/aggregate/.clasp.json` ではなく、リポジトリの直下に `.clasp-aggregate.json` として置く（「5. 計画との違い」）。
- 設定ファイル（`.clasp-*.json`・`.clasp.json`）と認証情報（`.clasprc.json`）は `.gitignore` で Git の管理対象外とする。見本（`deploy/aggregate/.clasp.json.example`）のみを Git で管理する。
- `clasp --project .clasp-aggregate.json show-file-status`（仮の `scriptId` の設定ファイルで実行）で、送る対象が `dist/aggregate/` の `.js`・`appsscript.json` のみであることを確認した（2026-09-27）。
- `--force` は、GAS 側のマニフェストを確認なしで `dist/` の内容で置き換えるために付ける。
- デプロイの実行（`npm run deploy:aggregate`）、`clasp login`、設定ファイルの作成は開発者が行う（CLAUDE.md 4.）。

集計用のマニフェスト（`src/aggregate/appsscript.json`）：

| 項目 | 値 | 由来 |
|---|---|---|
| `timeZone` | `Asia/Tokyo` | 根拠資料に定めがない。年・日付の判定（`getFullYear()` 等）がスクリプトのタイムゾーンで行われるため明示した（「5. 計画との違い」） |
| `runtimeVersion` | `V8` | Decision-0005（JavaScript） |
| `exceptionLogging` | `STACKDRIVER` | component-design.md 7.（ログ・監視：GAS の標準の実行ログ） |
| `oauthScopes` | `https://www.googleapis.com/auth/spreadsheets`（入力用・閲覧用スプレッドシートの読み書き。`openById` のため）、`https://www.googleapis.com/auth/script.container.ui`（メニュー・ダイアログの表示） | Decision-0007（集計用はスプレッドシートの読み書きとメニューの表示） |

## 2. ファイル一覧

| パス | 役割 | Component | Task |
|---|---|---|---|
| `package.json` | 開発用の依存ライブラリ、`engines`、npm スクリプト | 開発環境 | Task-001 |
| `package-lock.json` | 依存ライブラリの版の固定 | 開発環境 | Task-001 |
| `.nvmrc` | Node.js の版（24.21.0） | 開発環境 | Task-001 |
| `eslint.config.js` | ESLint の設定 | 開発環境 | Task-001 |
| `jest.config.js` | Jest の設定 | 開発環境 | Task-001 |
| `.prettierignore` | Prettier の対象外 | 開発環境 | Task-001 |
| `.gitignore` | Git の管理対象外（秘密情報・ビルドの出力・依存ライブラリ） | 開発環境 | Task-001 |
| `.devcontainer/devcontainer.json` | Node.js の Feature の版の固定、`npm ci` の実行、タイムゾーンの設定（`containerEnv` の `TZ`：`Asia/Tokyo`） | 開発環境 | Task-002 |
| `scripts/build.js` | ビルド（`dist/` の生成、画面の CSS・JavaScript の埋め込み） | 開発環境 | Task-003（Task-001 で仮のスクリプトを作成） |
| `scripts/deploy.js` | デプロイ（ビルドと clasp push） | 開発環境 | Task-016 |
| `deploy/aggregate/.clasp.json.example` | 集計用の clasp の設定ファイルの見本（リポジトリの直下に `.clasp-aggregate.json` として複製して使う） | 開発環境 | Task-016 |
| `src/aggregate/appsscript.json` | 集計用のマニフェスト | 開発環境 | Task-016 |
| `src/aggregate/validate.js` | 行の確認（`validateRow`） | Component-003 | Task-004 |
| `src/aggregate/calc.js` | 収支・ウェイト・端数の計算（`calcBalance`、`calcWeight`、`roundToInteger`） | Component-003 | Task-005 |
| `src/aggregate/rank.js` | 順位付け（`rankEntries`、`pickTopRanked`） | Component-003 | Task-006 |
| `src/aggregate/aggregate.js` | 年ごとの集計と 3 つのランキング（`aggregateAllYears`） | Component-003 | Task-007 |
| `src/aggregate/player.js` | 個人の戦績の集計（`aggregatePlayerStats`） | Component-003 | Task-008 |
| `src/aggregate/input-access.js` | 入力用スプレッドシートの読み込み（`readPlayRows`、`readSettings`）、除外した行の印付け（`markExcludedRows`） | Component-004 | Task-009、Task-010 |
| `src/aggregate/viewer-writer.js` | 閲覧用スプレッドシートへの書き出し（`writeViewerSpreadsheet`） | Component-004、Component-005 | Task-011 |
| `src/aggregate/setup.js` | 入力用スプレッドシートの初期設定（`setupInputSpreadsheet`）、ニックネームの候補の更新（`updateNicknameOptions`） | Component-001 | Task-012、Task-013 |
| `src/aggregate/run.js` | 集計の実行の処理の流れ（`runAggregation`） | Component-002 | Task-014 |
| `src/aggregate/menu.js` | メニュー（`onOpen`、`menuRunAggregation`、`menuSetupInputSpreadsheet`） | Component-002 | Task-015 |
| `src/viewer/server.js` | Web アプリのサーバー側：データの取得（`getViewerData`）、画面の返却（`doGet`） | Component-006 | Task-017、Task-018 |
| `src/viewer/client/index.html` | 画面の HTML（ビルド時に CSS・JavaScript を埋め込む） | Component-007 | Task-018 |
| `src/viewer/client/format.js` | 表示用の整形（無害化、数値・順位・残りチップ数の表示、ゲージの割合）、ランキングの表示の定義と上位の取り出し | Component-007 | Task-019、Task-021 |
| `src/viewer/client/screen-top.js` | Screen-001 トップ画面（`buildTopContent`、`renderTopScreen`） | Component-007 | Task-021 |
| `src/viewer/client/screen-ranking.js` | Screen-002〜004 ランキング画面（`buildRankingContent`、`renderRankingScreen`） | Component-007 | Task-022 |
| `src/viewer/client/screen-player.js` | Screen-005 個人の戦績画面（`buildPlayerContent`、`renderPlayerScreen`） | Component-007 | Task-023 |
| `src/viewer/client/app.js` | 画面の共通部分（年の選択、画面の切り替え、データの取得、閲覧できない旨、免責表示） | Component-007 | Task-020 |
| `src/viewer/client/style.css` | 画面の見た目（採用したモックの色・配置） | Component-007 | Task-020（各画面の分は Task-021〜025 で追加） |

### GAS のコードの共通の書き方

- GAS では全ファイルが同じ場所（グローバル）で動くため、関数はファイルの最上位に宣言する。
- ファイルの末尾で、`module` がある場合のみ関数を公開する（`if (typeof module !== "undefined") { module.exports = { … }; }`）。GAS 上では `module` がないため何もしない（implementation-plan.md 2.）。
- 同じプロジェクト（`src/aggregate/`、`src/viewer/`）の中では、ファイルの最上位の名前（関数・定数）を重複させない。GAS では全ファイルが同じ場所で動くため、重複すると上書きやエラーになる。

| 最上位の名前 | ファイル |
|---|---|
| `isBlank`、`isValidDate`、`isNonNegativeNumber`、`validateRow` | `src/aggregate/validate.js` |
| `calcBalance`、`calcWeight`、`roundToInteger` | `src/aggregate/calc.js` |
| `TOP_RANK_LIMIT`、`compareNickname`、`rankEntries`、`pickTopRanked` | `src/aggregate/rank.js` |
| `toDateKey`、`summarizePlayers`、`aggregateYear`、`groupRowsByYear`、`aggregateAllYears` | `src/aggregate/aggregate.js` |
| `findRank`、`buildPlayerStats`、`aggregatePlayerStats` | `src/aggregate/player.js` |
| `PLAY_SHEET_NAME`、`SETTINGS_SHEET_NAME`、`PLAY_COLUMN_COUNT`、`SETTING_LABEL_DISTRIBUTED_CHIPS`、`SETTING_LABEL_FORCED_LABOR_COUNT`、`getRequiredSheet`、`readPlayRows`、`readSettings`、`EXCLUDED_ROW_COLOR`、`markExcludedRows` | `src/aggregate/input-access.js` |
| `VIEWER_SPREADSHEET_ID_KEY`、`RANKING_KIND_LABELS`、`VIEWER_SHEET_HEADERS`、`toCellValue`、`buildSummaryRows`、`buildRankingRows`、`buildPlayerRows`、`buildHistoryRows`、`replaceSheetValues`、`writeViewerSpreadsheet` | `src/aggregate/viewer-writer.js` |
| `PLAY_SHEET_HEADERS`、`DEFAULT_FORCED_LABOR_COUNT`、`createPlaySheet`、`createSettingsSheet`、`setupInputSpreadsheet`、`updateNicknameOptions` | `src/aggregate/setup.js` |
| `isValidSettingValue`、`runAggregation` | `src/aggregate/run.js` |
| `MENU_TITLE`、`onOpen`、`menuRunAggregation`、`menuSetupInputSpreadsheet` | `src/aggregate/menu.js` |

閲覧用プロジェクト（`src/viewer/` 直下。画面の `client/` は GAS のサーバー側とは別の場所で動く）：

| 最上位の名前 | ファイル |
|---|---|
| `VIEWER_SPREADSHEET_ID_PROPERTY`、`NOT_VIEWABLE_MESSAGE`、`RANKING_KINDS`、`pad2`、`formatDate`、`formatDateTime`、`toRankOrNull`、`readDataRows`、`readSummary`、`readRankings`、`readPlayers`、`readHistory`、`getViewerData`、`APP_TITLE`、`doGet` | `src/viewer/server.js` |

画面（`src/viewer/client/`。ビルドで 1 つの HTML に埋め込まれ、ブラウザの同じ場所で動く）：

| 最上位の名前 | ファイル |
|---|---|
| `MINUS_SIGN`、`escapeHtml`、`groupDigits`、`formatNumber`、`formatSignedNumber`、`formatRank`、`formatRemainingChips`、`calcGaugePercent`、`TOP_RANK_LIMIT`、`RANKING_DEFINITIONS`、`pickTopRanked`、`forcedLaborTag` | `src/viewer/client/format.js` |
| `buildTopContent`、`renderTopScreen` | `src/viewer/client/screen-top.js` |
| `buildRankingContent`、`renderRankingScreen` | `src/viewer/client/screen-ranking.js` |
| `formatHours`、`buildPlayerContent`、`renderPlayerScreen` | `src/viewer/client/screen-player.js` |
| `DISCLAIMER`、`NOT_VIEWABLE_FALLBACK_MESSAGE`、`buildYearOptions`、`buildNotViewableContent`、`buildPeriodText`、`appState`、`yearDataCache`、`el`、`navigate`、`buildYearSelect`、`screenHelpers`、`findRenderer`、`render`、`loadYear` | `src/viewer/client/app.js` |

- 他のファイルの関数を使う場合は、ファイルの先頭に `/* global 関数名 */` を書き、ESLint に既知として知らせる（`require` は使わない）。
- Small テストでは、使われる側のファイルの公開部分を `Object.assign(global, require(…))` でグローバルに置いてから、使う側のファイルを読み込む（GAS で全ファイルが同じ場所で動く状態の再現）。

### 主要な関数

| 関数 | ファイル | 入力 | 出力 | Task |
|---|---|---|---|---|
| `validateRow(row)` | `src/aggregate/validate.js` | `row`：`{ playerName, playDate, playTime, finalChips, debtCount }`（スプレッドシートから読み込んだ値） | `{ valid, nickname }`。有効なら `valid: true` と前後の空白を取り除いたニックネーム、無効なら `valid: false`・`nickname: null` | Task-004 |
| `calcBalance(finalChips, distributedChips, debtCount)` | `src/aggregate/calc.js` | 最終チップ数、配布チップ数、借金回数 | 収支 ＝ 最終チップ数 − 配布チップ数 × 借金回数（丸めない） | Task-005 |
| `calcWeight(playTime)` | `src/aggregate/calc.js` | プレイ時間 | ウェイト ＝ min(√（プレイ時間 ÷ 2）, 1)（丸めない） | Task-005 |
| `roundToInteger(value)` | `src/aggregate/calc.js` | 数値 | 絶対値で四捨五入した整数（-2.5 → -3、-2.4 → -2）。結果が -0 の場合は 0 | Task-005 |
| `rankEntries(entries, order)` | `src/aggregate/rank.js` | `entries`：`[{ nickname, value }]`、`order`：`"desc"`（大きい順）／`"asc"`（小さい順） | `[{ nickname, value, rank }]`（新しい配列。入力は変更しない）。値の順、同じ値はニックネームの文字コード順に並ぶ。同じ値は同じ順位、次の順位は同順の人数分を飛ばす | Task-006 |
| `pickTopRanked(rankedEntries)` | `src/aggregate/rank.js` | `rankEntries` の戻り値 | 順位が 5 位以内（`TOP_RANK_LIMIT`）の要素（6 人以上になることがある） | Task-006 |

- 文字コード順は、JavaScript の文字列の比較（`<`・`>`、UTF-16 の符号単位の順）で比べる。ロケールに依存しないため、GAS とローカルで同じ結果になる（c1/Question-014-1）。
- 同じ値かどうかは値の完全一致（`===`）で判定する。値の丸めは呼び出し側（Task-007）で行う。

| 関数 | ファイル | 入力 | 出力 | Task |
|---|---|---|---|---|
| `aggregateAllYears(rows, settings)` | `src/aggregate/aggregate.js` | `rows`：有効な行 `[{ nickname, playDate, playTime, finalChips, debtCount }]`（`nickname` は前後の空白を取り除いたもの）、`settings`：`{ distributedChips（配布チップ数）, forcedLaborCount（N） }` | `{ years, rankingsByYear }`。`years` は集計済みの年（昇順）、`rankingsByYear[年]` は `{ average, total, forcedLabor }`（各要素 `{ nickname, value, rank }`。`forcedLabor` は `isForcedLabor` も持つ） | Task-007 |
| `summarizePlayers(rows, settings)` | `src/aggregate/aggregate.js` | 1 年分の行、設定値 | プレイヤーごとの `{ nickname, days, weightedSum, balanceSum }`（丸める前の値。Task-008 でも使う） | Task-007 |
| `toDateKey(date)` | `src/aggregate/aggregate.js` | 日付 | `"年-月-日"` の文字列（同じ日付の判定に使う） | Task-007 |
| `groupRowsByYear(rows)` | `src/aggregate/aggregate.js` | 有効な行 | `Map`（年 → その年の行）。`aggregateAllYears` と `aggregatePlayerStats` で使う | Task-007（Task-008 で関数に切り出し） |

`aggregateAllYears` の計算（1 年分・プレイヤーごと）：

| 値 | 計算 | 由来 |
|---|---|---|
| 年 | プレイ日付の `getFullYear()`（GAS ではスクリプトのタイムゾーン） | Feature-007 条件1 |
| 参加日数 | 異なるプレイ日付の数（同じ日付の複数行は 1 日） | c1/Question-016 |
| アベレージランキングの値 | Σ（収支 × ウェイト）÷ 参加日数 を丸めた値。大きい順、全員が対象 | Feature-004、c1/Question-013、c1/Question-016 |
| 累計ランキングの値（基準値） | Σ 収支 を丸めた値。大きい順、全員が対象 | Feature-005、c1/Question-019 |
| 強制労働への道のり | 丸めた基準値がマイナスのプレイヤーのみ、小さい順。基準値 ≦ −（配布チップ数 × N）なら `isForcedLabor: true` | Feature-006 条件1・条件2 |

- 丸めは合計・平均を計算した後に 1 回だけ行い（`roundToInteger`）、順位・強制労働の判定は丸めた値で行う（c1/Question-019）。
- 設定値は引数で受け取るため、配布チップ数を変えて集計し直すと、すべての年が新しい値で計算される（Decision-0006）。

| 関数 | ファイル | 入力 | 出力 | Task |
|---|---|---|---|---|
| `aggregatePlayerStats(rows, settings)` | `src/aggregate/player.js` | `aggregateAllYears` と同じ | `{ 年: [個人の戦績] }`。各年のプレイヤーは累計ランキングの順に並ぶ。個人の戦績は下表のとおり | Task-008 |

`aggregatePlayerStats` の個人の戦績（1 年分・プレイヤーごと）：

| 項目 | 内容 | 由来 |
|---|---|---|
| `nickname` | ニックネーム | Feature-010 |
| `days` | 参加日数（異なるプレイ日付の数） | Feature-010 条件1、c1/Question-016 |
| `totalPlayTime` | 合計プレイ時間（プレイ時間の合計。丸めない） | Feature-010 条件1 |
| `totalBalance` | 収支の累計（基準値）。累計ランキングの値（丸めた値） | Feature-010 条件1、c1/Question-019 |
| `averageChips` | 平均値チップ数。アベレージランキングの値（丸めた値） | Feature-010 条件1（ランキング 1 の値）、component-design.md 5.（個人の戦績） |
| `totalDebtCount` | 借金回数の累計（借金回数の合計。丸めない） | Feature-010 条件1 |
| `remainingChips` | 強制労働までの残りチップ数 ＝ `totalBalance` ＋ 配布チップ数 × N（0 以下もそのまま返す） | Feature-010 条件1 |
| `ranks` | `{ average, total, forcedLabor }`。各ランキングでの順位。強制労働への道のりの対象外（基準値が 0 以上）は `null` | Feature-010 条件1・条件2-2 |
| `history` | 実施日ごとの履歴 `[{ playDate, playTime, finalChips, debtCount, balance }]`。新しい日付から並ぶ。同じ日付の行はすべて含め、入力の順のまま。`balance` は `calcBalance` の値を `roundToInteger` で整数に四捨五入した値 | Feature-010 条件1、component-design.md 8.（Screen-005）、c1/Question-016、c1/Question-019 |

- 順位・基準値・平均値チップ数は `aggregateAllYears` の結果から取り出し、ランキングと個人の戦績で値が食い違わないようにする。
- 丸めない値（合計プレイ時間、借金回数の累計、履歴のプレイ時間・最終チップ数・借金回数）は入力の値のままとし、表示の整形は閲覧用の表示用の整形（Task-019）で行う。

`src/aggregate/input-access.js`（Task-009）：

| 関数 | 入力 | 出力 | Task |
|---|---|---|---|
| `readPlayRows(spreadsheet)` | 入力用スプレッドシート（`SpreadsheetApp.getActiveSpreadsheet()` の戻り値を呼び出し元が渡す） | シート「プレイ結果」の 2 行目から最終行（`getLastRow()`）までの 5 列を `[{ rowNumber, playerName, playDate, playTime, finalChips, debtCount }]` で返す。値はセルの値のまま（確認は `validateRow`）。データ行がない場合は空の配列 | Task-009 |
| `markExcludedRows(spreadsheet, rowNumbers)` | 入力用スプレッドシート、除外した行のシート上の行番号（`readPlayRows` の `rowNumber`） | なし。シート「プレイ結果」のデータ行（2 行目〜最終行、5 列）の背景色を消し（`setBackground(null)`）、その後に指定した行の 5 列に印の背景色（`EXCLUDED_ROW_COLOR`：`#f4cccc`、薄い赤）を付ける。見出し行は変えない | Task-010 |
| `readSettings(spreadsheet)` | 同上 | シート「設定」から `{ distributedChips, forcedLaborCount }` を返す。空欄はセルの値（空文字）のまま、項目名が見つからない場合は `null`（どちらも Task-014 で集計を中止する：b1/Question-019） | Task-009 |

シート「設定」の配置（Task-012 で作り、Task-009 で読む）：

| A 列（項目名） | B 列（値） | 由来 |
|---|---|---|
| 配布チップ数（`SETTING_LABEL_DISTRIBUTED_CHIPS`） | 配布チップ数（初期値は空欄） | Feature-002 条件1、b1/Question-019 |
| 強制労働の基準の回数 N（`SETTING_LABEL_FORCED_LABOR_COUNT`） | N（初期値 10） | Feature-002 条件2、b1/Question-019 |

- 値は行の位置ではなく、A 列の項目名が一致する行の B 列から読む（行の並びが変わっても読めるようにするため）。
- 印の色は設計書で「背景色」とのみ定められているため（component-design.md 4.、b1/Question-008）、薄い赤（`#f4cccc`）とした。変える場合は `EXCLUDED_ROW_COLOR` のみを変える。データ行の背景色は集計のたびに消すため、管理者がデータ行に手で付けた背景色も消える。
- シート「プレイ結果」「設定」がない場合は、メニューの「初期設定」を案内するエラー（`Error`）を投げる。呼び出し元（Task-014）で管理者へのメッセージにする（component-design.md 7.（エラー処理））。
- スプレッドシートを引数で受け取るため、Small テストでは代用品（`getSheetByName`・`getLastRow`・`getRange`・`getDataRange` を `jest.fn()` で作ったもの）を渡す。

`validateRow` の判定（上から順に確認し、1 つでも当てはまれば無効）：

| 判定 | 無効とする条件 | 由来 |
|---|---|---|
| 空欄 | 5 項目のいずれかが `null`・`undefined`・空文字、または前後の空白のみの文字列（全角の空白を含む） | b1/Question-007 (c)、b1/Question-008 |
| 日付 | プレイ日付が `Date` でない、または無効な `Date` | b1/Question-007 (a) |
| 数値 | プレイ時間・最終チップ数・借金回数が `number` でない（数字の文字列も数値として扱わない）、有限でない、またはマイナス | b1/Question-007 (a)、b1/Question-020、c1/Question-017-1 |

- ニックネームは `String(playerName).trim()` とする（プレイヤー名のセルが数値の場合も文字列にする）。

`src/aggregate/viewer-writer.js`（Task-011）：

| 関数 | 入力 | 出力 | Task |
|---|---|---|---|
| `writeViewerSpreadsheet(aggregation, aggregatedAt)` | `aggregation`：`{ years, rankingsByYear（aggregateAllYears の戻り値）, playersByYear（aggregatePlayerStats の戻り値） }`、`aggregatedAt`：集計日時（`Date`） | `{ ok: true }`、または `{ ok: false, message }`（管理者に知らせる文言）。4 シートの内容を置き換える | Task-011 |

- 閲覧用スプレッドシートの ID は、スクリプトプロパティ `VIEWER_SPREADSHEET_ID` から読む（c1/Question-008）。未設定の場合は `openById` を呼ばず、`{ ok: false, message }` を返す。
- `openById` や書き込みで例外が起きた場合は、`console.error` で GAS の標準の実行ログに残し、`{ ok: false, message }` を返す（component-design.md 7.（ログ・監視、エラー処理））。途中のシートまで書き込まれている場合がある（次の集計で置き換わる）。
- 各シートは `clearContents()` で前回の内容（値）を消してから、1 行目に見出し、2 行目以降にデータを `setValues` で書き込む。シートがない場合は `insertSheet` で作る。

閲覧用スプレッドシートの各シートの列（1 行目が見出し。component-design.md 5.）：

| シート | 列（見出し） | 書き込む値 |
|---|---|---|
| 集計情報 | 集計日時、集計済みの年 | データは 1 行。集計済みの年は昇順を「,」でつないだ文字列（例：`2025,2026`） |
| ランキング | 年、ランキングの種類、順位、ニックネーム、値、参加日数、強制労働の該当 | 年ごとに、種類「アベレージ」「累計」「強制労働への道のり」の順、各ランキングの表示の順。強制労働の該当は「強制労働への道のり」の行のみ `true`／`false`、他の種類は空欄 |
| 個人の戦績 | 年、ニックネーム、参加日数、合計プレイ時間、収支の累計、平均値チップ数、借金回数の累計、強制労働までの残りチップ数、アベレージランキングの順位、累計ランキングの順位、強制労働への道のりの順位 | `aggregatePlayerStats` の値。順位がない（強制労働への道のりの対象外）欄は空欄 |
| 履歴 | 年、ニックネーム、実施日、プレイ時間、最終チップ数、借金回数、収支 | プレイヤーごとに、新しい日付から |

- 設計書の「各ランキングでの順位」は、ランキングごとに 1 列ずつ（3 列）とした。

`src/aggregate/setup.js`（Task-012）：

| 関数 | 入力 | 出力 | Task |
|---|---|---|---|
| `setupInputSpreadsheet(spreadsheet)` | 入力用スプレッドシート（呼び出し元が `SpreadsheetApp.getActiveSpreadsheet()` を渡す） | なし。シート「プレイ結果」「設定」のうち、ないものだけを作る。あるシートには何もしない（見出し・入力規則・値を変えない） | Task-012 |

作るシートの内容：

| シート | 内容 | 由来 |
|---|---|---|
| プレイ結果 | 1 行目の見出し：プレイヤー名、プレイ日付、プレイ時間、最終チップ数、借金回数（`PLAY_SHEET_HEADERS`）。入力規則：`B2:B`（プレイ日付）は日付、`C2:C`・`D2:D`・`E2:E`（プレイ時間・最終チップ数・借金回数）は 0 以上の数値。いずれも規則に合わない入力を拒否する（`setAllowInvalid(false)`） | Feature-001 条件1、b1/Question-007 (a)、b1/Question-020、c1/Question-009 |
| 設定 | `A1`「配布チップ数」・`B1` 空欄、`A2`「強制労働の基準の回数 N」・`B2` 10（Task-009 の「シート「設定」の配置」と同じ。項目名は `input-access.js` の定数を使う） | Feature-002 条件2、b1/Question-019、c1/Question-009 |

- 数値の入力規則は、GAS の入力規則に「数値のみ」の指定がないため、`requireNumberGreaterThanOrEqualTo(0)`（0 以上の数値）とした。行の確認（Task-004）のマイナスを無効とする判定（b1/Question-020）と一致する。
- 入力規則で拒否されない値（貼り付け等で入った値）は、集計時に行の確認（Task-004）で除外される。

| 関数 | 入力 | 出力 | Task |
|---|---|---|---|
| `updateNicknameOptions(spreadsheet, nicknames)` | 入力用スプレッドシート、有効な行のニックネームの一覧 | なし。シート「プレイ結果」の `A2:A`（プレイヤー名）に、候補の一覧の入力規則（`requireValueInList(候補, true)`、`setAllowInvalid(true)`）を設定する | Task-013 |

- 候補は、前後の空白を取り除き（`String(n).trim()`）、重複と空文字を除いて、文字コード順に並べる（並び順は計画に定めがないため、ランキングの同順位の並び（c1/Question-014-1）と同じ文字コード順とした）。
- `setAllowInvalid(true)` により、候補にない名前は警告の表示のみで入力できる（Feature-001 条件4）。
- 候補が 0 件の場合は、空の一覧の入力規則を設定できないため、`A2:A` の入力規則を外す（`setDataValidation(null)`）。シート「プレイ結果」がない場合は何もしない。

## 3. テストファイル一覧

| パス | 確かめる対象 | Task と期待値 |
|---|---|---|
| （なし） | Task-001・Task-002 は Small テストの対象なし（implementation-plan.md 4.） | — |
| `tests/small/scripts/build.test.js` | `scripts/build.js` の `build` | Task-003 期待値1〜3 |
| （なし） | Task-016 は Small テストの対象なし（implementation-plan.md 4.）。デプロイ後の確認は c3 で定める | — |
| `tests/small/aggregate/validate.test.js` | `src/aggregate/validate.js` の `validateRow` | Task-004 期待値1〜8 |
| `tests/small/aggregate/calc.test.js` | `src/aggregate/calc.js` の `calcBalance`、`calcWeight`、`roundToInteger` | Task-005 期待値1〜6 |
| `tests/small/aggregate/rank.test.js` | `src/aggregate/rank.js` の `rankEntries`、`pickTopRanked` | Task-006 期待値1〜5 |
| `tests/small/aggregate/aggregate.test.js` | `src/aggregate/aggregate.js` の `aggregateAllYears` | Task-007 期待値1〜13 |
| `tests/small/aggregate/player.test.js` | `src/aggregate/player.js` の `aggregatePlayerStats` | Task-008 期待値1〜7 |
| `tests/small/aggregate/input-access.test.js` | `src/aggregate/input-access.js` の `readPlayRows`、`readSettings`、`markExcludedRows` | Task-009 期待値1〜3、Task-010 期待値1〜2 |
| `tests/small/aggregate/viewer-writer.test.js` | `src/aggregate/viewer-writer.js` の `writeViewerSpreadsheet`（`PropertiesService`・`SpreadsheetApp` は代用品） | Task-011 期待値1〜4 |
| `tests/small/aggregate/setup.test.js` | `src/aggregate/setup.js` の `setupInputSpreadsheet`、`updateNicknameOptions`（`SpreadsheetApp` の入力規則とスプレッドシートは代用品） | Task-012 期待値1〜3、Task-013 期待値1〜2 |
| `tests/small/aggregate/run.test.js` | `src/aggregate/run.js` の `runAggregation`（Component-003 は実物、Component-004 の関数と `updateNicknameOptions` は代用品） | Task-014 期待値1〜6 |
| `tests/small/aggregate/menu.test.js` | `src/aggregate/menu.js` の `onOpen`（`SpreadsheetApp.getUi()` は代用品） | Task-015 期待値1 |
| `tests/small/viewer/server.test.js` | `src/viewer/server.js` の `getViewerData`（`PropertiesService`・`SpreadsheetApp` は代用品） | Task-017 期待値1〜4、Task-018 期待値1 |
| `tests/small/viewer/format.test.js` | `src/viewer/client/format.js` の各関数 | Task-019 期待値1〜9 |
| `tests/small/viewer/app.test.js` | `src/viewer/client/app.js` の `buildYearOptions`、`buildNotViewableContent`、`DISCLAIMER` | Task-020 期待値1〜3 |
| `tests/small/viewer/screen-top.test.js` | `src/viewer/client/screen-top.js` の `buildTopContent` | Task-021 期待値1〜4 |
| `tests/small/viewer/screen-ranking.test.js` | `src/viewer/client/screen-ranking.js` の `buildRankingContent` | Task-022 期待値1〜4 |
| `tests/small/viewer/screen-player.test.js` | `src/viewer/client/screen-player.js` の `buildPlayerContent` | Task-023 期待値1〜3 |

## 4. 主要な処理の流れ

### 集計の実行（`runAggregation(spreadsheet, notify)`、Task-014）

| 順 | 処理 | 呼び出す関数 | 失敗・中止の扱い | 由来 |
|---|---|---|---|---|
| 1 | 設定値の確認 | `readSettings` | 配布チップ数・N のどちらかが数値（`number` かつ有限）でなければ、該当する項目名を含むメッセージを表示して中止する。印付け・書き出しは行わない | b1/Question-019 |
| 2 | 行の確認と印付け | `readPlayRows`、`validateRow`、`markExcludedRows` | 無効な行は集計から除外し、行番号に印を付ける（前回の印は消す） | b1/Question-008、b1/Question-020 |
| 3 | 集計と書き出し | `aggregateAllYears`、`aggregatePlayerStats`、`writeViewerSpreadsheet`（集計日時は実行した時刻） | 書き出しが失敗した場合（`ok: false`）は、その `message` を表示して終える（候補の更新は行わない） | Decision-0006、component-design.md 7.（エラー処理） |
| 4 | ニックネームの候補の更新 | `updateNicknameOptions`（有効な行のニックネーム） | — | c1/Question-009 |
| 5 | 完了のメッセージ | `notify` | 集計した行の数と除外した行の数を表示する。除外した行がある場合は、背景色で示していることを添える | b1/Question-008 |

- 途中で例外が起きた場合（シートがない等）は、`console.error` で実行ログに残し、「集計を実行できませんでした。」に例外のメッセージを続けて表示する。
- `notify` は、メニューから呼ぶ際に `SpreadsheetApp.getUi().alert` を渡す（Task-015）。Small テストでは `jest.fn()` を渡す。
- 設定値のマイナス・0 は、計画・設計に定めがないため中止の対象にしていない。

### メニュー（`src/aggregate/menu.js`、Task-015）

| 関数 | 呼ばれる時 | 処理 |
|---|---|---|
| `onOpen()` | 入力用スプレッドシートを開いたとき（GAS のシンプルトリガー） | メニュー「POKER RANKING」（`MENU_TITLE`。アプリの名称：b1/Question-015-1）に、項目「集計を反映」（`menuRunAggregation`）と「初期設定」（`menuSetupInputSpreadsheet`）を追加する |
| `menuRunAggregation()` | メニュー「集計を反映」 | `runAggregation(SpreadsheetApp.getActiveSpreadsheet(), message => ui.alert(message))` を呼ぶ |
| `menuSetupInputSpreadsheet()` | メニュー「初期設定」 | `setupInputSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())` を呼び、完了または失敗をダイアログで知らせる（失敗時は `console.error` で実行ログに残す） |

- メニューの名前は計画・設計に定めがないため、アプリの名称とした。
- `menuRunAggregation`・`menuSetupInputSpreadsheet` の動作（ダイアログの表示）は、`SpreadsheetApp.getUi()` に依存するため Small テストの対象外とし、Medium（デプロイ先）で確認する（component-design.md 7.（テストのしやすさ））。

### データの取得（`getViewerData(year)`、`src/viewer/server.js`、Task-017）

画面から `google.script.run` で呼ばれ、閲覧用スプレッドシートの 4 シート（Task-011 の列の構成）から、指定した年の集計結果を返す。

| 順 | 処理 | 失敗の扱い |
|---|---|---|
| 1 | スクリプトプロパティ `VIEWER_SPREADSHEET_ID` を読む | 未設定：`console.error` で実行ログに残し、`{ ok: false, message }` を返す（`openById` は呼ばない） |
| 2 | `SpreadsheetApp.openById` で開く（アクセスしたユーザーの権限） | 例外（共有されていないアカウント等）：`console.warn` で実行ログに残し、`{ ok: false, message }` を返す |
| 3 | シート「集計情報」から集計日時と集計済みの年（昇順）を読み、表示する年を決める | — |
| 4 | その年のランキング・個人の戦績・履歴を読み、`{ ok: true, … }` を返す | 読み込み中の例外：`console.error` で実行ログに残し、`{ ok: false, message }` を返す |

戻り値（`ok: true` の場合）：

| 項目 | 内容 |
|---|---|
| `year` | 表示する年。引数の年が集計済みの年にない場合・指定しない場合は最新の年（c1/Question-020）。集計済みの年がない場合は `null` |
| `years` | 集計済みの年（昇順の数値の配列） |
| `aggregatedAt` | 集計日時の文字列（`yyyy/MM/dd HH:mm`） |
| `rankings` | `{ average, total, forcedLabor }`。各要素は `{ rank, nickname, value, days }`（`forcedLabor` は `isForcedLabor` も持つ）。閲覧用スプレッドシートの並び（表示の順）のまま |
| `players` | 個人の戦績 `[{ nickname, days, totalPlayTime, totalBalance, averageChips, totalDebtCount, remainingChips, ranks: { average, total, forcedLabor } }]`。空欄の順位は `null` |
| `history` | ニックネームごとの履歴 `{ ニックネーム: [{ playDate（yyyy/MM/dd）, playTime, finalChips, debtCount, balance }] }`。新しい日付から |

- `google.script.run` は `Date` を画面に渡せないため、日付・日時は文字列にして返す。日付の文字列は GAS のスクリプトのタイムゾーン（閲覧用のマニフェスト：Task-026）で作られる。
- 閲覧できない場合の文言は `NOT_VIEWABLE_MESSAGE`（「閲覧できません。このページを閲覧するには、管理者からの招待が必要です。」）とし、原因（未設定・権限なし）を画面に出さない。原因は実行ログで確認する。
- 強制労働への道のりの「強制労働の該当」は、閲覧用スプレッドシートの値が `true` の場合のみ `true` とする。

### 画面の返却（`doGet()`、`src/viewer/server.js`、Task-018）

- Web アプリの URL を開くと、`HtmlService.createHtmlOutputFromFile("index")`（ビルドで CSS・JavaScript を埋め込んだ `dist/viewer/index.html`）を返す。
- GAS の Web アプリでは、HTML 内の `<title>`・viewport の `<meta>` が効かないため、`setTitle("POKER RANKING")`（`APP_TITLE`：b1/Question-015-1）と `addMetaTag("viewport", "width=device-width, initial-scale=1")`（Quality-005）で指定する。
- `index.html` の `<base target="_top">` は、画面内のリンクを GAS の枠の外で開くための指定である。

### 表示用の整形（`src/viewer/client/format.js`、Task-019）

| 関数 | 入力 | 出力（例） | 由来 |
|---|---|---|---|
| `escapeHtml(value)` | 文字列 | `&`・`<`・`>`・`"`・`'` を文字参照にした文字列（`<b>ナッツ&</b>` → `&lt;b&gt;ナッツ&amp;&lt;/b&gt;`） | b1/Question-018 |
| `formatNumber(value)` | 数値 | 3 桁区切り。マイナスは「−」（U+2212）を付ける（244200 → `244,200`、-10000 → `−10,000`） | Feature-010 条件1 |
| `formatSignedNumber(value)` | 数値 | プラスは「+」、マイナスは「−」を付けた 3 桁区切り。0 は `0`（44200 → `+44,200`、-8800 → `−8,800`） | 採用したモック（Screen-002、Screen-005） |
| `formatRank(rank)` | 順位または `null` | `2位`。`null` は `−` | 採用したモック、Feature-010 条件2-2、b1/review-002 |
| `formatRemainingChips(remainingChips)` | 残りチップ数 | 0 より大きい場合は `formatNumber`、0 以下は `強制労働` | c1/Question-022-1 |
| `calcGaugePercent(totalBalance, distributedChips, forcedLaborCount)` | 基準値、配布チップ数、N | 基準値がマイナスの分 ÷（配布チップ数 × N）× 100。基準値が 0 以上は 0、上限 100 | c1/Question-022 |

- 3 桁区切りは、ロケールに依存しないよう正規表現で行う（`toLocaleString` を使わない）。小数はそのまま残す（例：21.5）。
- 配布チップ数 × N が 0 以下の場合（設定値の誤り）、`calcGaugePercent` は基準値がマイナスなら 100、それ以外は 0 を返す（0 での割り算を避ける）。
- 閲覧用スプレッドシートには配布チップ数・N を置かないため、画面では「残りチップ数 − 基準値」（＝ 配布チップ数 × N）を求めて `calcGaugePercent(基準値, 残りチップ数 − 基準値, 1)` として呼ぶ（Task-023）。

### 画面の共通部分（`src/viewer/client/app.js`、Task-020）

画面は 1 つの HTML（単一ページ）で、表示する画面を JavaScript で切り替える（Decision-0003）。

| 項目 | 内容 | 由来 |
|---|---|---|
| 読み込み順 | `index.html` の `<script src>` の順：`format.js` → 各画面のファイル（Task-021〜025 で追加） → `app.js`（最後）。`app.js` は読み込まれると `loadYear()` を呼び、最新の年のデータを取得して描画を始める | Task-003（ビルドで書いた順に埋め込む） |
| 画面の状態 | `appState`：`data`（`getViewerData` の戻り値）、`loading`、`screen`（`top`・`ranking`・`player`・`image`）、`rankingKind`（`average`・`total`・`forcedLabor`）、`nickname` | Task-020 |
| 画面の切り替え | `navigate(screen, params)` で状態を変えて `render()` し、先頭に戻す。URL（ハッシュ）は使わない | Decision-0003 |
| データの取得 | `loadYear(year)`：`google.script.run.getViewerData(year)` を呼ぶ。取得済みの年は `yearDataCache` から表示する。失敗（通信の失敗等）は `console.error` に残し、閲覧できない旨を表示する | Component-006、Feature-007 条件2 |
| 年の選択 | `buildYearOptions(years)`：選択肢は新しい年から、最初に選ぶ年は最新の年。`buildYearSelect()` で `<select>` を作り、選ぶと `loadYear` を呼ぶ | Feature-007 条件2、c1/Question-020、c1/Question-021 |
| 閲覧できない旨 | `buildNotViewableContent(result)`：`ok` でない場合は `{ viewable: false, message }`。`render()` はデータの代わりに文言のみを表示する | Quality-001、component-design.md 7.（エラー処理） |
| 集計期間 | `buildPeriodText(year)`：`集計期間：<年>/01/01〜<年>/12/31` | Feature-007 条件1、採用したモック |
| 免責表示 | `DISCLAIMER` を、すべての画面の末尾（`<footer>`）に置く | Feature-013、b1/Question-015 |
| 各画面の描画 | 各画面のファイルの `renderTopScreen`・`renderRankingScreen`・`renderPlayerScreen`・`renderImageScreen`（`(data, appState, screenHelpers)` を受け取り、要素の配列を返す）を `render()` が呼ぶ。未定義の画面は「準備中です。」と表示する | Task-021〜025 |
| 文字の表示 | `el(tag, props, children)` で要素を作り、文字列はテキストノードとして追加する（`innerHTML` を使わない） | b1/Question-018 |

- 集計済みの年がない場合（`year` が `null`）は「集計結果がまだありません。」と表示する。
- `style.css` には、採用したモックの共通の見た目（色の変数、ヘッダー、年の選択、免責表示等）を置き、各画面の見た目は Task-021〜025 で追加する。
- 各画面のファイルの `render…Screen` は `app.js` から呼ばれるため、ESLint に `/* exported … */` で知らせる。

### ランキングの表示の定義（`src/viewer/client/format.js`、Task-021）

`RANKING_DEFINITIONS`（表示の順：アベレージ → 累計 → 強制労働への道のり）を、トップ画面・ランキング画面・画像で共通に使う。

| `kind` | 名称（`icon` `title`） | 切り替えの表示（`shortTitle`） | 値の見出し（`valueHeader`） | 由来 |
|---|---|---|---|---|
| `average` | 🏆 アベレージランキング | 🏆 アベレージ | 平均値チップ数 | b1/Question-012-1、b1/Question-016 |
| `total` | 🎖 累計ランキング | 🎖 累計 | 累計チップ数 | b1/Question-012-1、b1/review-006 |
| `forcedLabor` | ⛏ 強制労働への道のり | ⛏ 強制労働 | 基準値 | b1/Question-012-1、component-design.md 8. |

- 説明文は、トップ画面用（`topDescription`：Screen-001 のモック）と、ランキング画面用（`description`：Screen-002 のモック）を持つ。強制労働への道のりのランキング画面の説明文は、モックの「−（配布チップ数 × 10）」を「−（配布チップ数 × N）」とした（N は設定値で変わり、閲覧用スプレッドシートに N を置かないため）。
- `pickTopRanked(entries)`：順位が 5 位以内（`TOP_RANK_LIMIT`）の要素を取り出す（同順位で 6 人以上になることがある：c1/Question-015）。
- `forcedLaborTag(entry)`：`isForcedLabor` が `true` なら「強制労働」、それ以外は `null`（Feature-006 条件2、b1/review-007）。

### Screen-001 トップ画面（`src/viewer/client/screen-top.js`、Task-021）

- `buildTopContent(rankings)`：3 つのランキングのカードの内容（`kind`、`icon`、`title`、`description`、`rows`、`emptyText`、`titleLink`、`moreLink`）を作る。`rows` は 5 位以内の行 `{ rankText, nickname, tag, valueText, isMinus }`。対象者がいない場合は `rows` が空で、「ランキングなし」（`emptyText`）を表示する（Feature-006 条件1-2）。`titleLink`・`moreLink` はどちらも `{ screen: "ranking", rankingKind }`（b1/review-003）。
- `renderTopScreen`：採用したモック（Screen-001）の構成（ヘッダー、集計期間と年の選択、3 つのカード、「📷 ランキングを画像にする」）で描く。見た目（`style.css`）はモックの CSS をもとにした。

### Screen-002〜004 ランキング画面（`src/viewer/client/screen-ranking.js`、Task-022）

- 3 つのランキング画面（Screen-002：アベレージ、Screen-003：累計、Screen-004：強制労働への道のり）は 1 つの描画関数で、`appState.rankingKind` により切り替える（採用したモックと同じく 1 つの配置を共有する）。
- `buildRankingContent(rankings, kind)`：`{ kind, icon, title, description, valueHeader, switchItems, rows, emptyText, notes }` を作る。`rows` は対象者全員の `{ rankText, nickname, tag, valueText, isMinus, daysText（「15 日」）, link（{ screen: "player", nickname }） }`（順位の順：Feature-009 条件1・条件2）。対象者がいない場合は「ランキングなし」（Feature-006 条件1-2）。強制労働への道のりでは、モックの注記「※「強制労働」はあくまで遊びの表現です。次の一勝で逆転を！」を `notes` に持つ（モックの「※ 対象者がいない場合は…」はモック上の説明のため表示しない）。
- `renderRankingScreen`：採用したモック（Screen-002）の構成（「‹ トップへ」と年の選択、切り替え、見出し、説明文、集計期間、一覧の表、注記）で描く。ニックネームを選ぶと Screen-005 に移動する。

### Screen-005 個人の戦績画面（`src/viewer/client/screen-player.js`、Task-023）

- `buildPlayerContent(data, nickname)`：表示中の年の `players` からプレイヤーを探して内容を作る。閲覧者が誰かによらず同じ内容になる（Feature-010 条件2）。

| 項目 | 内容 | 由来 |
|---|---|---|
| `tiles` | 参加日数（`12 日`）、合計プレイ時間（`21.5 時間`）、収支の累計（符号付き）、平均値チップ数（符号付き） | Feature-010 条件1、b1/Question-016 |
| `ranks` | 🏆 アベレージ・🎖 累計・⛏ 強制労働の順位（`formatRank`。対象外は `−`） | Feature-010 条件1・条件2-2 |
| `debtText` | 借金回数の累計（`3 回`） | Feature-010 条件1 |
| `remainingText`・`reachedForcedLabor` | 残りチップ数（`formatRemainingChips`。0 以下は「強制労働」とし、ラベルの見た目で表示する） | c1/Question-022-1 |
| `basisText` | 基準値（符号付き） | 採用したモック |
| `gaugePercent` | `calcGaugePercent(基準値, 残りチップ数 − 基準値, 1)`（残りチップ数 − 基準値 ＝ 配布チップ数 × N） | c1/Question-022 |
| `history` | 実施日ごとの履歴（日付、時間、最終チップ、借金、収支）。新しい日付から | Feature-010 条件1、採用したモック |

- 表示中のプレイヤーが参加していない年を選んだ場合は、`{ hasRecord: false, emptyText: "この年の戦績はありません" }` とし、名前と集計期間の下に文言のみを表示する（c1/Question-021）。
- 時間は `formatHours` で小数第 1 位まで表す（2 → `2.0`。モックの表記）。合計の誤差を避けるため小数第 2 位で丸め、小数第 2 位がある場合はそのまま表す。
- アバターの記号はモックと同じ「♥」とした。「‹ ランキングへ」は、最後に表示したランキングの種類の画面に戻る。

## 5. 計画との違い

| Task | 計画 | 実際 | 根拠 |
|---|---|---|---|
| Task-001 | ESLint の推奨ルールを使う | ESLint 10 は推奨ルールの設定を本体に含まないため（別パッケージ `@eslint/js`）、本体の組み込みルールの recommended の印から同じ内容の設定を作った。`@eslint/js` 10.0.1 の recommended と 64 ルールが一致することを確認した（2026-09-27 00:15） | implementation-plan.md 2.（依存ライブラリは Prettier・ESLint・Jest・clasp のみ）、c1/Question-012 |
| Task-001 | 作成予定のファイルに `scripts/build.js` を含まない | 完了条件の `npm run build` を実行できるよう、仮の `scripts/build.js` を作成した。Task-003 で置き換える | implementation-plan.md 2.（全タスク共通の完了条件）、Task-001（テスト期待値の概要） |
| Task-001 | npm スクリプト `test` | Small テストが 0 件の段階でも `npm test` が成功するよう、`jest --passWithNoTests` とした | implementation-plan.md Task-001（テスト期待値の概要：コマンドが実行できること） |
| Task-002 | Node.js の Feature の版の固定と `npm ci` の追加 | 加えて、`containerEnv` に `TZ`（`Asia/Tokyo`）を設定し、コンテナの時刻を JST にした（既定は UTC）。JST・UTC のどちらでも Small テストが全件成功することを確認した（2026-09-27 09:56） | 開発者の指示（2026-09-27、チャット：記録の日時を JST にし、コンテナを作り直しても JST にする） |
| Task-016 | clasp の設定ファイルを `deploy/aggregate/.clasp.json`（Git の管理対象外）とし、見本を `deploy/aggregate/.clasp.json.example` とする | 設定ファイルをリポジトリの直下の `.clasp-aggregate.json` とした（`.gitignore` に `.clasp-*.json` を追加）。見本は計画どおり `deploy/aggregate/.clasp.json.example`（`rootDir` は `dist/aggregate`） | clasp 3.4.1 は設定ファイルのあるフォルダの外を `rootDir` にできないため、計画の配置では `dist/aggregate/` を送れない。ファイル名は c2 で変更してよい（implementation-plan.md 2.（ディレクトリ構成）） |
| Task-016 | マニフェストのタイムゾーンは計画に定めがない | `Asia/Tokyo` とした | 年・日付の判定がスクリプトのタイムゾーンで行われるため、明示が必要。根拠資料に定めがないため、開発者のレビューで確認する |
| Task-008 | 作成予定のファイル：`src/aggregate/player.js`、`tests/small/aggregate/player.test.js` | 計画どおり。加えて、行を暦年ごとに分ける処理を `src/aggregate/aggregate.js` の `groupRowsByYear` に切り出し、Task-007 と共用した（Task-007 の動作は変えていない。Task-007 の Small テストが全件成功） | implementation-plan.md Task-007・Task-008（同じ暦年の区切りで集計する：Feature-007 条件1） |
| Task-003 | 作成予定のファイル：`scripts/build.js`、`tests/small/scripts/build.test.js` | 計画どおり。加えて、`src/aggregate/`・`src/viewer/` がない場合は出力せずに成功する（Task-004・Task-017 で作成するまで `npm run build` を成功させるため）。埋め込めない内容・`client/` の外の参照はエラーにする | implementation-plan.md 2.（全タスク共通の完了条件：ビルドが成功する）、Task-003 作業内容 |

## 6. 変更履歴

| 日時 | スキル | 変更内容 | 根拠 |
|---|---|---|---|
| 2026-09-27 00:25 | /c2-implement | 初版を作成（5-1：Task-001 開発ツールの設定、Task-002 Dev Container への追加） | implementation-plan.md 2.、Task-001、Task-002 |
| 2026-09-27 00:40 | /c2-implement | Task-003（ビルド用のスクリプト）を追加。ディレクトリ構成、ビルドの処理、ファイル一覧、テストファイル一覧、計画との違いを更新 | implementation-plan.md Task-003 |
| 2026-09-27 00:51 | /c2-implement | Task-004（行の確認）を追加。ディレクトリ構成、ファイル一覧、GAS のコードの共通の書き方、主要な関数、テストファイル一覧を更新 | implementation-plan.md Task-004 |
| 2026-09-27 00:54 | /c2-implement | Task-005（収支・ウェイト・端数の計算）を追加。ディレクトリ構成、ファイル一覧、主要な関数、テストファイル一覧を更新 | implementation-plan.md Task-005 |
| 2026-09-27 00:57 | /c2-implement | Task-006（順位付け）を追加。ディレクトリ構成、ファイル一覧、主要な関数、テストファイル一覧を更新。GAS のコードの共通の書き方に最上位の名前の一覧を追加 | implementation-plan.md Task-006、implementation-plan.md 2.（GAS のコードは全ファイルが同じ場所で動く） |
| 2026-09-27 01:00 | /c2-implement | Task-007（年ごとの集計と 3 つのランキング）を追加。ディレクトリ構成、ファイル一覧、主要な関数、テストファイル一覧を更新。GAS のコードの共通の書き方に、他のファイルの関数の使い方と Small テストでの再現方法を追加 | implementation-plan.md Task-007、implementation-plan.md 2.（GAS のコードは全ファイルが同じ場所で動く） |
| 2026-09-27 09:53 | /c2-implement | Task-008（個人の戦績の集計）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、主要な関数（`groupRowsByYear` の切り出しを含む）、テストファイル一覧、計画との違いを更新 | implementation-plan.md Task-008 |
| 2026-09-27 09:56 | /c2-implement | Task-008 の記録の日時を UTC（00:53）から JST（09:53）に修正。`.devcontainer/devcontainer.json` にタイムゾーン（JST）の設定を追加し、ディレクトリ構成・ファイル一覧・計画との違いを更新 | 開発者の指示（チャット） |
| 2026-09-27 10:02 | /c2-implement | Task-009（入力用スプレッドシートの読み込み）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、主要な関数（シート「設定」の配置を含む）、テストファイル一覧を更新。Task-008 の履歴の収支を整数に四捨五入するよう修正し、主要な関数の記載を更新 | implementation-plan.md Task-009、c1/Question-019（収支も整数に四捨五入する） |
| 2026-09-27 11:30 | /c2-implement | Task-010（除外した行の印付け）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、主要な関数（印の色を含む）、テストファイル一覧を更新 | implementation-plan.md Task-010 |
| 2026-09-27 11:36 | /c2-implement | Task-011（閲覧用スプレッドシートへの書き出し）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、主要な関数（閲覧用スプレッドシートの各シートの列を含む）、テストファイル一覧を更新 | implementation-plan.md Task-011、component-design.md 5. |
| 2026-09-27 11:47 | /c2-implement | Task-012（入力用スプレッドシートの初期設定）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、主要な関数（作るシートの内容・入力規則を含む）、テストファイル一覧を更新 | implementation-plan.md Task-012 |
| 2026-09-27 11:52 | /c2-implement | Task-013（ニックネームの候補の更新）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、主要な関数、テストファイル一覧を更新 | implementation-plan.md Task-013 |
| 2026-09-27 11:53 | /c2-implement | Task-014（集計の実行の処理の流れ）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-014 |
| 2026-09-27 11:54 | /c2-implement | Task-015（メニュー）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-015 |
| 2026-09-27 11:57 | /c2-implement | Task-016（集計用のデプロイ用スクリプト）を追加。ディレクトリ構成、開発ツールと npm スクリプト、デプロイの処理、集計用のマニフェスト、ファイル一覧、テストファイル一覧、計画との違いを更新 | implementation-plan.md Task-016、clasp 3.4.1 の設定ファイルの扱い |
| 2026-09-27 11:59 | /c2-implement | Task-017（データの取得）を追加。ディレクトリ構成、ファイル一覧、最上位の名前（閲覧用プロジェクト）、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-017 |
| 2026-09-27 12:00 | /c2-implement | Task-018（画面の返却）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-018 |
| 2026-09-27 12:01 | /c2-implement | Task-019（表示用の整形）を追加。ディレクトリ構成、ファイル一覧、最上位の名前（画面）、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-019 |
| 2026-09-27 12:04 | /c2-implement | Task-020（画面の共通部分）を追加。ディレクトリ構成、ビルドの処理、ファイル一覧、最上位の名前（画面）、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-020 |
| 2026-09-27 12:05 | /c2-implement | Task-021（Screen-001 トップ画面）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、テストファイル一覧、4. 主要な処理の流れ（ランキングの表示の定義を含む）を更新 | implementation-plan.md Task-021、採用したモック（Screen-001） |
| 2026-09-27 12:10 | /c2-implement | Task-022（Screen-002〜004 ランキング画面）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-022、採用したモック（Screen-002） |
| 2026-09-27 12:11 | /c2-implement | Task-023（Screen-005 個人の戦績画面）を追加。ディレクトリ構成、ファイル一覧、最上位の名前、テストファイル一覧、4. 主要な処理の流れを更新 | implementation-plan.md Task-023、採用したモック（Screen-005） |
