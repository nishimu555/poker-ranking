# 実装設計書

| 項目 | 内容 |
|---|---|
| 工程 | c2 実装 |
| plan ファイル | `plans/c2_implement.md` |
| 入力 | `docs/c1_implementation-plan/implementation-plan.md` |
| 最終更新 | 2026-09-27 01:00 |

## 1. ディレクトリ構成

```
poker-ranking/
├── .devcontainer/devcontainer.json   # Task-002：Node.js 24.21.0 の固定、npm ci
├── .gitignore                        # Task-001：dist/、node_modules/、.clasp.json、.clasprc.json
├── .nvmrc                            # Task-001：Node.js の版（24.21.0）
├── .prettierignore                   # Task-001
├── package.json / package-lock.json  # Task-001
├── eslint.config.js                  # Task-001
├── jest.config.js                    # Task-001
├── scripts/
│   └── build.js                      # Task-003：dist/ の生成
├── src/
│   └── aggregate/                    # 集計用プロジェクト
│       ├── validate.js               # Task-004：行の確認
│       ├── calc.js                   # Task-005：収支・ウェイト・端数の計算
│       ├── rank.js                   # Task-006：順位付け
│       └── aggregate.js              # Task-007：年ごとの集計と 3 つのランキング
└── tests/
    └── small/
        ├── aggregate/validate.test.js # Task-004
        ├── aggregate/calc.test.js    # Task-005
        ├── aggregate/rank.test.js    # Task-006
        ├── aggregate/aggregate.test.js # Task-007
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
| `npm run deploy:aggregate`・`deploy:viewer` | `node scripts/deploy.js aggregate`・`viewer`（`scripts/deploy.js` は Task-016・026 で作成する） | Task-001、Task-016、Task-026 |

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
- 画面の JavaScript の読み込み順は、`src/viewer/client/index.html` の `<script src>` の並び順で決まる（Task-020 以降で記載する）。
- 次の場合はエラーにしてビルドを止める：埋め込む CSS に `</style`、JavaScript に `</script` が含まれる（HTML のタグが途中で閉じるため）。`index.html` が `client/` の外のファイルを参照している。
- `build(rootDir)` を公開し、Small テストでは一時フォルダを `rootDir` にして確認する。

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
| `.devcontainer/devcontainer.json` | Node.js の Feature の版の固定、`npm ci` の実行 | 開発環境 | Task-002 |
| `scripts/build.js` | ビルド（`dist/` の生成、画面の CSS・JavaScript の埋め込み） | 開発環境 | Task-003（Task-001 で仮のスクリプトを作成） |
| `src/aggregate/validate.js` | 行の確認（`validateRow`） | Component-003 | Task-004 |
| `src/aggregate/calc.js` | 収支・ウェイト・端数の計算（`calcBalance`、`calcWeight`、`roundToInteger`） | Component-003 | Task-005 |
| `src/aggregate/rank.js` | 順位付け（`rankEntries`、`pickTopRanked`） | Component-003 | Task-006 |
| `src/aggregate/aggregate.js` | 年ごとの集計と 3 つのランキング（`aggregateAllYears`） | Component-003 | Task-007 |

### GAS のコードの共通の書き方

- GAS では全ファイルが同じ場所（グローバル）で動くため、関数はファイルの最上位に宣言する。
- ファイルの末尾で、`module` がある場合のみ関数を公開する（`if (typeof module !== "undefined") { module.exports = { … }; }`）。GAS 上では `module` がないため何もしない（implementation-plan.md 2.）。
- 同じプロジェクト（`src/aggregate/`、`src/viewer/`）の中では、ファイルの最上位の名前（関数・定数）を重複させない。GAS では全ファイルが同じ場所で動くため、重複すると上書きやエラーになる。

| 最上位の名前 | ファイル |
|---|---|
| `isBlank`、`isValidDate`、`isNonNegativeNumber`、`validateRow` | `src/aggregate/validate.js` |
| `calcBalance`、`calcWeight`、`roundToInteger` | `src/aggregate/calc.js` |
| `TOP_RANK_LIMIT`、`compareNickname`、`rankEntries`、`pickTopRanked` | `src/aggregate/rank.js` |
| `toDateKey`、`summarizePlayers`、`aggregateYear`、`aggregateAllYears` | `src/aggregate/aggregate.js` |

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

`validateRow` の判定（上から順に確認し、1 つでも当てはまれば無効）：

| 判定 | 無効とする条件 | 由来 |
|---|---|---|
| 空欄 | 5 項目のいずれかが `null`・`undefined`・空文字、または前後の空白のみの文字列（全角の空白を含む） | b1/Question-007 (c)、b1/Question-008 |
| 日付 | プレイ日付が `Date` でない、または無効な `Date` | b1/Question-007 (a) |
| 数値 | プレイ時間・最終チップ数・借金回数が `number` でない（数字の文字列も数値として扱わない）、有限でない、またはマイナス | b1/Question-007 (a)、b1/Question-020、c1/Question-017-1 |

- ニックネームは `String(playerName).trim()` とする（プレイヤー名のセルが数値の場合も文字列にする）。

## 3. テストファイル一覧

| パス | 確かめる対象 | Task と期待値 |
|---|---|---|
| （なし） | Task-001・Task-002 は Small テストの対象なし（implementation-plan.md 4.） | — |
| `tests/small/scripts/build.test.js` | `scripts/build.js` の `build` | Task-003 期待値1〜3 |
| `tests/small/aggregate/validate.test.js` | `src/aggregate/validate.js` の `validateRow` | Task-004 期待値1〜8 |
| `tests/small/aggregate/calc.test.js` | `src/aggregate/calc.js` の `calcBalance`、`calcWeight`、`roundToInteger` | Task-005 期待値1〜6 |
| `tests/small/aggregate/rank.test.js` | `src/aggregate/rank.js` の `rankEntries`、`pickTopRanked` | Task-006 期待値1〜5 |
| `tests/small/aggregate/aggregate.test.js` | `src/aggregate/aggregate.js` の `aggregateAllYears` | Task-007 期待値1〜13 |

## 4. 主要な処理の流れ

（Component をまたぐ処理は Task-014 以降で記載する）

## 5. 計画との違い

| Task | 計画 | 実際 | 根拠 |
|---|---|---|---|
| Task-001 | ESLint の推奨ルールを使う | ESLint 10 は推奨ルールの設定を本体に含まないため（別パッケージ `@eslint/js`）、本体の組み込みルールの recommended の印から同じ内容の設定を作った。`@eslint/js` 10.0.1 の recommended と 64 ルールが一致することを確認した（2026-09-27 00:15） | implementation-plan.md 2.（依存ライブラリは Prettier・ESLint・Jest・clasp のみ）、c1/Question-012 |
| Task-001 | 作成予定のファイルに `scripts/build.js` を含まない | 完了条件の `npm run build` を実行できるよう、仮の `scripts/build.js` を作成した。Task-003 で置き換える | implementation-plan.md 2.（全タスク共通の完了条件）、Task-001（テスト期待値の概要） |
| Task-001 | npm スクリプト `test` | Small テストが 0 件の段階でも `npm test` が成功するよう、`jest --passWithNoTests` とした | implementation-plan.md Task-001（テスト期待値の概要：コマンドが実行できること） |
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
