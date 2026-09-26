# 実装設計書

| 項目 | 内容 |
|---|---|
| 工程 | c2 実装 |
| plan ファイル | `plans/c2_implement.md` |
| 入力 | `docs/c1_implementation-plan/implementation-plan.md` |
| 最終更新 | 2026-09-27 00:40 |

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
├── src/                              # GAS のコード（Task-004 以降）
└── tests/
    └── small/scripts/build.test.js   # Task-003
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

## 3. テストファイル一覧

| パス | 確かめる対象 | Task と期待値 |
|---|---|---|
| （なし） | Task-001・Task-002 は Small テストの対象なし（implementation-plan.md 4.） | — |
| `tests/small/scripts/build.test.js` | `scripts/build.js` の `build` | Task-003 期待値1〜3 |

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
