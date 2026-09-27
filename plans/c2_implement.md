# 実装 plan（c2）

<!--
ステータスの移り変わり（CLAUDE.md「5. 工程の進め方」）：
- 回答待ち：plan を作成した直後。「8. 質問・指示」に ☐ が残っている
- 確定：「8. 質問・指示」がすべて ☑ になった（/z9-answer-review で確認後）。計画が固まり、成果物を作成できる
- レビュー待ち：成果物を作成した。開発者のレビューを待っている
- 完了：開発者が「1. 進捗」の「6. 成果物レビュー」に ☑ を付け、「9. レビュー指摘」がすべて ☑ になった
- 差し戻し：他の工程から「8. 質問・指示」に質問が追加された
-->

| 項目 | 内容 |
|---|---|
| ステータス | 確定 |
| スキル | `/c2-implement` |
| 成果物 | `src/`、`tests/`（Small テスト）、`docs/c2_implement/implementation-design.md` |
| 最終更新 | 2026-09-27 11:30 |

## 1. 進捗

<!--
AI が段階を終えるたびに ☑ と日時を記載する。
「6. 成果物レビュー」は開発者のみが ☑ を付ける。成果物を変更した場合、AI が ☑ を外して再レビューを依頼する。
「回答待ち」「差し戻し」に戻った場合、AI が「2.」〜「5.」の ☑ を外す。
-->

- [x] 1. plan 作成（AI：`/c2-implement`）2026-09-26 23:06
- [x] 2. 質問への回答・指示の記入（開発者）2026-09-26 23:18
- [x] 3. 回答の確認（AI：`/z9-answer-review c2`）2026-09-26 23:18
- [x] 4. plan 確定（AI：`/c2-implement`）2026-09-27 00:25
- [ ] 5. 成果物作成（AI：`/c2-implement`）
- [ ] 6. 成果物レビュー（開発者）

## 2. 目的

実装計画書（`docs/c1_implementation-plan/implementation-plan.md`）の Task-001〜026 を、実装の順序に従って実装する。タスクごとに、テスト期待値の概要から Small テストを先に作成し、失敗を確認してから実装する（CLAUDE.md 4.）。実装した内容を実装設計書（`docs/c2_implement/implementation-design.md`）に記録する。

## 3. 入力資料

| 資料 | 参照箇所 | 用途 |
|---|---|---|
| `docs/c1_implementation-plan/implementation-plan.md` | 2. 開発の前提、3〜6（Task-001〜026） | 実装・テスト期待値・完了条件の根拠 |
| `docs/b1_design/component-design.md` | 4. コンポーネント、5. データ設計、7. 横断的な関心事、8. 画面設計 | 実装の根拠（責務、脅威分析の対策、エラー処理、画面の項目） |
| `docs/b1_design/decisions/` | Decision-0001〜0007 | 実装の制約（公開設定、権限、外部ライブラリなし等） |
| `docs/b1_design/mockups/` | Screen-001〜006 | 画面の見た目（Feature-008〜010・012 の条件3） |
| `docs/a1_requirements/requirements.md` | Feature-001〜013、Quality-001〜009 | 実装の根拠 |
| `templates/c2_implementation-design.md` | 全体 | 実装設計書の構成 |

## 4. 対象範囲

### 対象

| 対象 | 由来 |
|---|---|
| Task-001〜Task-026 の実装と Small テスト | implementation-plan.md 3. タスク一覧 |
| 実装設計書の作成・更新 | c2 スキル |

### 対象外

| 対象外 | 根拠 |
|---|---|
| Medium・Large テストの作成・実行 | c3（計画）・c4（作成・実行）で行う（CLAUDE.md 4.） |
| デプロイの実行、スクリプトプロパティの設定、閲覧者の招待 | 開発者が行う（CLAUDE.md 4.、implementation-plan.md 1. 対象外） |
| git コマンドの実行（コミット等） | 開発者のみが実行する（c1/Question-011、implementation-plan.md 1. 対象外） |

## 5. 作業手順と実行結果

<!--
本工程は実行を伴うため、各手順に「実行結果」を記載する。
記載するのは事実（失敗の確認、テスト結果、ビルド結果、静的解析、脆弱性チェック、コミット）と、計画との差異とその根拠のみとする。
c2 スキルの手順 5-1（開発環境の準備）は、実装計画の Task-001（開発ツールの設定）・Task-002（Dev Container への追加）と同じ内容のため、5-1 として実施する。
コミットの記録（Question-002）：開発者がコミットした後、該当手順の「実行結果」に「コミット：<ID> <メッセージ>」を記入する。AI は git を実行しない。次のタスクに進む前に、前のタスクの「コミット」が空欄なら、AI は開発者に確認して止まる。
-->

- [x] 5-1. 開発環境の準備（Task-001：開発ツールの設定、Task-002：Dev Container への追加）
  - 作業内容：実装計画「2. 開発の前提」に従い、package.json、Prettier・ESLint・Jest の設定、npm スクリプト、.gitignore、Dev Container を設定する
  - 参照元：implementation-plan.md 2.、Task-001、Task-002
  - 作成・更新先：設定ファイル、`implementation-design.md`
  - 実行結果：
    - 実行環境：Dev Container 内。`node -v` v24.21.0、`npm -v` 11.19.0（2026-09-27 00:13 確認）
    - 導入した開発用の依存ライブラリ（版を固定）：prettier 3.9.9、eslint 10.11.0、jest 30.5.2、@google/clasp 3.4.1（648 パッケージ）。npm の警告として、推移的な依存の非推奨（node-domexception 1.0.0、glob 10.5.0）と、インストールスクリプトの未承認（@parcel/watcher 2.6.0、unrs-resolver 1.12.2）が出た
    - 失敗の確認：Small テストの対象なし（implementation-plan.md Task-001・Task-002 のテスト期待値の概要）
    - ビルド：`npm run build` 成功（仮のスクリプト。Task-003 で置き換える）
    - テスト：`npm test` 成功（0 件／0 件。テストファイルなし）
    - 静的解析：`npm run lint` 指摘 0 件。推奨ルールと GAS の組み込みオブジェクトの登録が効くことを、一時ファイル（確認後に削除）で確認した（未定義の変数・未使用の関数を検出し、`SpreadsheetApp` は検出しない）。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - タスク固有の完了条件：`.gitignore` に `.clasp.json`・`.clasprc.json`・`dist/`・`node_modules/` を含む。`package.json` の `engines` と `.nvmrc` が 24.21.0。Dev Container の Node.js の Feature の版が 24.21.0。`mounts` はホストの認証情報を含まない（Claude Code の設定用のボリュームのみ）
    - 計画との差異：(1) ESLint 10 は推奨ルールの設定を本体に含まない（別パッケージ `@eslint/js`）ため、依存ライブラリを追加せず、ESLint 本体の組み込みルールの recommended の印から同じ設定を作った（`@eslint/js` 10.0.1 の recommended と 64 ルールが一致することを確認）。根拠：implementation-plan.md 2.（依存ライブラリは 4 つのみ）。(2) `npm run build` を実行できるよう仮の `scripts/build.js` を作成した。(3) テスト 0 件の段階で `npm test` が成功するよう `jest --passWithNoTests` とした。いずれも implementation-design.md「5. 計画との違い」に記載
    - Dev Container の再作成（`npm ci` の実行を含む）と、その後の `npm test` の実行は開発者が確認する（implementation-plan.md Task-002 テスト期待値の概要）
    - コミット：1aab1b1 SKILL見直し
- [x] 5-2. Task-003：ビルド用のスクリプト
  - 作業内容：「5. 実装」の「1 タスクの流れ」に従う
  - 参照元：implementation-plan.md 4.（Task-003）
  - 作成・更新先：`scripts/build.js`、`tests/small/scripts/`、`implementation-design.md`
  - 実行結果：
    - 開始前の確認：5-1 の「コミット」欄の記入内容（1aab1b1）について AI が確認を求め、開発者が「このままでよい」と回答したため続行した（2026-09-27 00:30 頃、チャット）
    - 失敗の確認：`tests/small/scripts/build.test.js` 3 件中 3 件が失敗。理由：仮の `scripts/build.js` が `build` を公開していない（`TypeError: build is not a function`）
    - テスト：`npm test` 3 件／3 件成功
    - ビルド：`npm run build` 成功（`src/aggregate/`・`src/viewer/` がまだないため、出力なし）
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：`src/<プロジェクト>/` がない場合は出力せずに成功するようにした（Task-004・Task-017 で作成するまで、全タスク共通の完了条件「ビルドが成功する」を満たすため）。埋め込めない内容（`</style`・`</script` を含む）と `client/` の外の参照はエラーにした。implementation-design.md「5. 計画との違い」に記載
    - コミット：a1c9d34 task-003
- [x] 5-3. Task-004：行の確認
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-004）
  - 作成・更新先：`src/aggregate/validate.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 失敗の確認：`tests/small/aggregate/validate.test.js`（期待値1〜8、16 件）が全件失敗。理由：`src/aggregate/validate.js` がないため、テストファイルの読み込みで失敗した（`Cannot find module`）
    - テスト：`npm test` 19 件／19 件成功（Task-003 の 3 件を含む）
    - ビルド：`npm run build` 成功（`dist/aggregate/validate.js` を出力。`src/viewer/` がないため閲覧用は出力なし）
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：なし。関数の入出力（行を `{ playerName, playDate, playTime, finalChips, debtCount }` で受け取る）は計画に定めがないため、implementation-design.md「主要な関数」に記載した
    - コミット：46e6f84 task-004
- [x] 5-4. Task-005：収支・ウェイト・端数の計算
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-005）
  - 作成・更新先：`src/aggregate/calc.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 失敗の確認：`tests/small/aggregate/calc.test.js`（期待値1〜6、14 件）が全件失敗。理由：`src/aggregate/calc.js` がないため、テストファイルの読み込みで失敗した（`Cannot find module`）
    - テスト：`npm test` 33 件／33 件成功（Task-003・004 の 19 件を含む）
    - ビルド：`npm run build` 成功（`dist/aggregate/` に `calc.js`・`validate.js` を出力）
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：なし。四捨五入の結果が -0 になる場合（-0.4 等）は 0 を返すようにした（implementation-design.md「主要な関数」に記載）
    - コミット：ce40f2b task-005
- [x] 5-5. Task-006：順位付け
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-006）
  - 作成・更新先：`src/aggregate/rank.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 失敗の確認：`tests/small/aggregate/rank.test.js`（期待値1〜5、5 件）が全件失敗。理由：`src/aggregate/rank.js` がないため、テストファイルの読み込みで失敗した（`Cannot find module`）
    - テスト：`npm test` 38 件／38 件成功（Task-003〜005 の 33 件を含む）
    - ビルド：`npm run build` 成功（`dist/aggregate/` に `calc.js`・`rank.js`・`validate.js` を出力）
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：なし
    - コミット：e1d7ccb task-006
- [x] 5-6. Task-007：年ごとの集計と 3 つのランキング
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-007）
  - 作成・更新先：`src/aggregate/aggregate.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 失敗の確認：`tests/small/aggregate/aggregate.test.js`（期待値1〜13、13 件）が全件失敗。理由：`src/aggregate/aggregate.js` がないため、テストファイルの読み込みで失敗した（`Cannot find module`）
    - 失敗の確認の後のテストの変更：期待値は変えず、テストの準備のみ追加した（`calc.js`・`rank.js` の公開部分をグローバルに置いてから `aggregate.js` を読み込む。GAS で全ファイルが同じ場所で動く状態の再現）
    - テスト：`npm test` 51 件／51 件成功（Task-003〜006 の 38 件を含む）
    - ビルド：`npm run build` 成功（`dist/aggregate/` に `aggregate.js`・`calc.js`・`rank.js`・`validate.js` を出力）
    - 追加の確認：`dist/aggregate/` の全 `.js` を 1 つの実行環境に読み込み（GAS と同じく同じ場所で動かす）、最上位の名前の重複によるエラーがなく `aggregateAllYears` が動くことを確認した
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：なし
    - コミット：73a948b task-007
- [x] 5-7. Task-008：個人の戦績の集計
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-008）
  - 作成・更新先：`src/aggregate/player.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 実行環境：Claude Code の Bash の sandbox がこのコンテナで起動できない（`bwrap: No permissions to create a new namespace`）ため、開発者の指示（sandbox を無効にしてコマンドを実行する）に従い、sandbox の外で実行した
    - 失敗の確認：`tests/small/aggregate/player.test.js`（期待値1〜7、7 件）が全件失敗。理由：`src/aggregate/player.js` がないため、テストファイルの読み込みで失敗した（`Cannot find module`）
    - テスト：`npm test` 58 件／58 件成功（Task-003〜007 の 51 件を含む）
    - ビルド：`npm run build` 成功（`dist/aggregate/` に `aggregate.js`・`calc.js`・`player.js`・`rank.js`・`validate.js` を出力）
    - 追加の確認：`dist/aggregate/` の全 `.js` を 1 つの実行環境に読み込み（GAS と同じく同じ場所で動かす）、最上位の名前の重複によるエラーがなく `aggregatePlayerStats` が動くことを確認した
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：行を暦年ごとに分ける処理を `src/aggregate/aggregate.js` の `groupRowsByYear` に切り出し、Task-007 と共用した（Task-007 の動作は変えていない。Task-007 の Small テストは全件成功）。implementation-design.md「5. 計画との違い」に記載
    - 開発者の指示による追加の変更（2026-09-27 09:56）：`.devcontainer/devcontainer.json` の `containerEnv` に `TZ`（`Asia/Tokyo`）を追加した（コンテナの既定は UTC）。`TZ=Asia/Tokyo`・UTC のどちらでも `npm test` 58 件／58 件成功。`npm run lint` 指摘 0 件、`prettier --check .` 違反 0 件。コンテナの作り直しと、その後に時刻が JST になることの確認は開発者が行う
    - コミット：57f3f97 [Task-008] 個人の戦績の集計を実装し、コンテナの時刻を JST に設定
- [x] 5-8. Task-009：入力用スプレッドシートの読み込み
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-009）
  - 作成・更新先：`src/aggregate/input-access.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 開始前の確認：5-7 の「コミット」欄が記入済み（57f3f97）であることを確認した。コンテナは作り直す前で時刻が UTC のため、記録の日時は `TZ=Asia/Tokyo` で取得した
    - 失敗の確認：`tests/small/aggregate/input-access.test.js`（期待値1〜3、3 件）が全件失敗。理由：`src/aggregate/input-access.js` がないため、テストファイルの読み込みで失敗した（`Cannot find module`）
    - テスト：`npm test` 61 件／61 件成功（Task-003〜008 の 58 件を含む）
    - ビルド：`npm run build` 成功（`dist/aggregate/` に `aggregate.js`・`calc.js`・`input-access.js`・`player.js`・`rank.js`・`validate.js` を出力）
    - 追加の確認：`dist/aggregate/` の全 `.js` を 1 つの実行環境に読み込み、最上位の名前の重複によるエラーがなく `readPlayRows`・`readSettings` が定義されることを確認した
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：なし。計画に定めのないシート「設定」の配置（A 列に項目名、B 列に値）と、シートがない場合の扱い（初期設定を案内するエラー）は implementation-design.md「主要な関数」に記載した
    - Task-008 の修正：implementation-plan.md「テスト期待値の前提」の c1/Question-019（収支も整数に四捨五入する）に合わせ、`src/aggregate/player.js` の履歴の収支（`balance`）を `roundToInteger` で丸めるよう修正した。c1 の Task-008 の期待値には該当する項目がないため Small テストは追加せず、`dist/aggregate/` を読み込んだ実行環境で最終チップ数 100.5 の行の収支が 101 になることを確認した
    - コミット：4f81069 [Task-009] 入力用スプレッドシートの読み込みを実装し、履歴の収支を四捨五入するよう修正
- [x] 5-9. Task-010：除外した行の印付け
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-010）
  - 作成・更新先：`src/aggregate/input-access.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
    - 開始前の確認：5-8 の「コミット」欄が記入済み（4f81069）であることを確認した
    - 失敗の確認：`tests/small/aggregate/input-access.test.js` の Task-010 のテスト（期待値1〜2、2 件）が全件失敗。理由：`markExcludedRows` が未実装（`TypeError: markExcludedRows is not a function`）。同じファイルの Task-009 のテスト 3 件は実装済みのため成功した
    - テスト：`npm test` 63 件／63 件成功（Task-003〜009 の 61 件を含む）
    - ビルド：`npm run build` 成功
    - 追加の確認：`dist/aggregate/` の全 `.js` を 1 つの実行環境に読み込み、最上位の名前の重複によるエラーがなく `markExcludedRows` が定義されることを確認した
    - 静的解析：`npm run lint` 指摘 0 件。`prettier --check .` 整形の違反 0 件
    - 脆弱性チェック：`npm audit --audit-level=moderate` 0 件
    - 計画との差異：なし。印の色は設計書に「背景色」とのみ定められているため薄い赤（`#f4cccc`）とし、implementation-design.md「主要な関数」に記載した
    - コミット：
- [ ] 5-10. Task-011：閲覧用スプレッドシートへの書き出し
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-011）
  - 作成・更新先：`src/aggregate/viewer-writer.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-11. Task-012：入力用スプレッドシートの初期設定
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-012）
  - 作成・更新先：`src/aggregate/setup.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-12. Task-013：ニックネームの候補の更新
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-013）
  - 作成・更新先：`src/aggregate/setup.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-13. Task-014：集計の実行の処理の流れ
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-014）
  - 作成・更新先：`src/aggregate/run.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-14. Task-015：メニュー
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-015）
  - 作成・更新先：`src/aggregate/menu.js`、`tests/small/aggregate/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-15. Task-016：集計用のデプロイ用スクリプト
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-016）
  - 作成・更新先：`scripts/deploy.js`、`src/aggregate/appsscript.json`、`deploy/aggregate/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-16. Task-017：データの取得
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-017）
  - 作成・更新先：`src/viewer/server.js`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-17. Task-018：画面の返却
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-018）
  - 作成・更新先：`src/viewer/server.js`、`src/viewer/client/index.html`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-18. Task-019：表示用の整形
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-019）
  - 作成・更新先：`src/viewer/client/format.js`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-19. Task-020：画面の共通部分
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-020）
  - 作成・更新先：`src/viewer/client/app.js`・`index.html`・`style.css`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-20. Task-021：Screen-001 トップ画面
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-021）
  - 作成・更新先：`src/viewer/client/screen-top.js`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-21. Task-022：Screen-002〜004 ランキング画面
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-022）
  - 作成・更新先：`src/viewer/client/screen-ranking.js`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-22. Task-023：Screen-005 個人の戦績画面
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-023）
  - 作成・更新先：`src/viewer/client/screen-player.js`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-23. Task-024：画像に描く内容の計算
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-024）
  - 作成・更新先：`src/viewer/client/image-layout.js`、`tests/small/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-24. Task-025：画像の描画と Screen-006
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-025）
  - 作成・更新先：`src/viewer/client/image-draw.js`、`implementation-design.md`
  - 実行結果：
- [ ] 5-25. Task-026：閲覧用のデプロイ用スクリプト
  - 作業内容：同上
  - 参照元：implementation-plan.md 4.（Task-026）
  - 作成・更新先：`scripts/deploy.js`、`src/viewer/appsscript.json`、`deploy/viewer/`、`implementation-design.md`
  - 実行結果：
- [ ] 5-26. 実装設計書の全体確認
  - 作業内容：`implementation-design.md` がコード全体と一致していること、「計画との違い」が記載されていることを確認する
  - 参照元：`src/`、`tests/`、`implementation-plan.md`
  - 作成・更新先：`implementation-design.md`
  - 実行結果：

## 6. 成果物の構成予定

| 項目 | 内容 | 由来 |
|---|---|---|
| 開発環境の設定 | `package.json`（`engines`：Node.js 24.21.0）、`package-lock.json`、`.nvmrc`（24.21.0）、`eslint.config.js`、`jest.config.js`、`.prettierignore`、`.gitignore`、`.devcontainer/devcontainer.json`（Node.js の Feature の版 24.21.0） | Task-001、Task-002、c1/Question-023 |
| 作業する環境 | Dev Container 内で起動した Claude Code から `/c2-implement` を実行する。依存ライブラリの導入に npm のレジストリへの通信が必要 | Question-001 |
| ビルド・デプロイ | `scripts/build.js`、`scripts/deploy.js`、`deploy/aggregate/.clasp.json.example`、`deploy/viewer/.clasp.json.example` | Task-003、Task-016、Task-026 |
| 集計用（`src/aggregate/`） | `validate.js`、`calc.js`、`rank.js`、`aggregate.js`、`player.js`、`input-access.js`、`viewer-writer.js`、`setup.js`、`run.js`、`menu.js`、`appsscript.json` | Task-004〜Task-016 |
| 閲覧用（`src/viewer/`） | `server.js`、`appsscript.json`、`client/`（`index.html`、`style.css`、`format.js`、`app.js`、`screen-top.js`、`screen-ranking.js`、`screen-player.js`、`image-layout.js`、`image-draw.js`） | Task-017〜Task-026 |
| Small テスト（`tests/small/`） | `aggregate/`、`viewer/`、`scripts/` の各テスト。テストコードに `// Task-XXX 期待値N` を記載 | implementation-plan.md 4.、CLAUDE.md 10. |
| 実装設計書 | `docs/c2_implement/implementation-design.md` | c2 スキル |

- 実装の順序は implementation-plan.md 5. に従う（開発環境 → 入力・集計の側 → 閲覧の側）。
- 作成予定のファイル名は implementation-plan.md 2. のディレクトリ構成に従う。変更した場合は実装設計書の「計画との違い」に記載する。

## 7. 他工程との関係

| 日時 | 種別 | 相手工程 | 項目 | 内容 |
|---|---|---|---|---|
| 2026-09-26 23:11 | 差し戻し送付 | c1 | c1/Question-023 | c2/Question-001 の開発者回答（Node のバージョンを最新の LTS に固定）により、実装計画書「2. 開発の前提」に Node.js のバージョンの定めを加える必要がある |
| 2026-09-26 23:18 | 差し戻し解消 | c1 | c1/Question-023 | c1 が完了し（2026-09-26 23:17）、implementation-plan.md に Node.js v24.21.0 の固定が反映された |

## 8. 質問・指示

### AI からの質問

<!-- AI が記載する。開発者は「開発者回答：」に回答を記入する。 -->

#### 開発環境

- [x] **Question-001**：c2 の作業（テストの実行を含む）を、どの環境で行いますか。
  - 根拠：implementation-plan.md 2. で、テストの実行環境は Node.js（Dev Container 内）と定めている（c1/Question-006、c1/Question-010）。現在、AI はホストの macOS（Darwin arm64）上で動いており、Dev Container の中ではない。ホストで `node -v`・`npm -v` を実行した結果は `command not found` で、Node.js・npm が入っていない（2026-09-26 23:06 確認）。このままでは Small テストの実行（失敗の確認・成功の確認）ができない。
  - 選択肢：
    - (a) VS Code で Dev Container を開き（「コンテナーで再度開く」）、コンテナ内で Claude Code を起動して `/c2-implement` を実行する。Node.js はコンテナに導入済み（`.devcontainer/devcontainer.json` の Node.js の Feature。バージョンの指定がないため LTS）
    - (b) ホストの macOS に Node.js を導入し、ホストで作業する
  - 推奨：(a)。c1/Question-010（Dev Container を使う）の開発者回答に沿い、ホストに開発用のツールを導入しなくてよいため。なお、依存ライブラリの導入（`npm ci`・`npm install`）には npm のレジストリ（registry.npmjs.org）への通信が必要になる。
  - 開発者回答：(a),Nodeのバージョンは最新のLTSに固定化してください

  - AI確認結果：(a) Dev Container 内で Claude Code を起動して `/c2-implement` を実行することを確認した。c1/Question-010 と矛盾しない。一方、「Node のバージョンは最新の LTS に固定化」は、実装計画書「2. 開発の前提」（テストの実行環境とツール、Dev Container）にバージョンの定めを加える変更であり、c1 の成果物の変更を伴う。そのため、c1 の plan に c1/Question-023 を追記して c1 を差し戻した（CLAUDE.md 6.）。事実として、2026-09-26 23:11 時点の Node.js の最新の LTS は v24.21.0（Krypton、2026-09-07 公開。https://nodejs.org/dist/index.json で確認）である。固定の方法（メジャーバージョンか、特定の版か）は c1/Question-023 で確認する。c1 の完了後に本スキルを再実行して ☑ を付ける。（2026-09-26 23:11）
    - 追記：c1/Question-023 の開発者回答 (b) により Node.js を v24.21.0 に固定することが決まり、implementation-plan.md 2.（Node.js のバージョン、Dev Container）と Task-001・Task-002 に反映され、c1 が完了した（2026-09-26 23:17）ことを確認した。本回答の 2 点（Dev Container 内で作業する、Node の版を固定する）がいずれも確定したため ☑ とした。本 plan「6. 成果物の構成予定」に反映した。（2026-09-26 23:18）

#### 記録の方法

- [x] **Question-002**：コミットの記録と、前回のタスクのコミットの確認をどう行いますか。
  - 根拠：c2 スキルは、実装済みのタスクのコミットを AI が `git log` で検索して実行結果に追記し、前回のタスクの変更がコミットされていない場合は報告して止まる手順としている（c2 スキル「5. 実装」の「実行前の確認」2・3）。一方、c1/Question-011 の開発者回答で、git コマンドは開発者のみが実行し、AI は実行しない（状態の確認を含む）と決まっている。両者が矛盾するため、記録と確認の方法が定まらない。
  - 選択肢：
    - (a) 開発者がコミットした後、該当タスクの「実行結果」の「コミット」欄にコミットの ID とメッセージを記入する。AI は git を実行せず、次のタスクに進む前に「コミット」欄が空欄なら、コミットの有無を開発者に確認して止まる
    - (b) コミットの記録は行わない（「コミット」欄を設けない）。前回のタスクのコミットの確認も行わない
    - (c) その他（記載）
  - 推奨：(a)。CLAUDE.md 5.（実行結果にコミットを記載する）と、c1/Question-011（AI は git を実行しない）を両立できるため。
  - 開発者回答：(a)

  - AI確認結果：(a) 開発者がコミットした後、該当タスクの「実行結果」の「コミット」欄にコミットの ID とメッセージを記入すること、AI は git を実行せず、次のタスクに進む前に「コミット」欄が空欄なら開発者に確認して止まることを確認した。CLAUDE.md 5.（実行結果にコミットを記載する）、c1/Question-011（AI は git を実行しない）と矛盾しない。本 plan「5. 作業手順と実行結果」の注記に反映した。c2 スキル「5. 実装」の「実行前の確認」2・3 は本回答と異なるため、基盤の修正を開発者に提案する（本回答に従って作業する）。（2026-09-26 23:11）

### 開発者からの質問・指示

<!--
開発者が追記する。記入例：
- [ ] **dev-001**：<質問・指示の内容>
  - AI対応内容：

  - AI確認結果：
ID を付けずに追記した場合は、AI が ID を付与する。
-->

## 9. レビュー指摘

成果物の作成前（plan への指摘）も、作成後（成果物への指摘）も、ここに review 項目として追記してください。

- 成果物の作成前：追記後に `/z9-answer-review c2` を実行すると、plan に反映されます。
- 成果物の作成後（ステータスが「レビュー待ち」）：追記後に `/c2-implement` を実行すると、成果物が修正されます。

<!--
成果物レビューで指摘がある場合、開発者が追記する。記入例：
- [ ] **review-001**：<指摘内容>
  - AI対応内容：

  - AI確認結果：
追記後に `/c2-implement` を実行すると、AI が成果物を修正する。
指摘がない場合は「1. 進捗」の「6. 成果物レビュー」に ☑ を付け、`/c2-implement` を実行する。
-->

## 10. 変更履歴

| 日時 | スキル | 変更内容 | 根拠 |
|---|---|---|---|
| 2026-09-26 23:06 | /c2-implement | plan を作成し、作業手順（5-1〜5-26）と Question-001〜002 を記載 | `docs/c1_implementation-plan/implementation-plan.md`（c1 完了）、開発環境の確認結果（ホストに Node.js・npm なし） |
| 2026-09-26 23:11 | /z9-answer-review c2 | Question-002 に ☑ を付与し、「5. 作業手順と実行結果」の注記にコミットの記録方法を反映。Question-001 は Node のバージョンの固定が c1 の成果物の変更を伴うため ☐ のまま、c1 に c1/Question-023 を追記して差し戻した。「7. 他工程との関係」に記録 | c2/Question-001・002 の開発者回答 |
| 2026-09-26 23:18 | /z9-answer-review c2 | c1 の完了（c1/Question-023 の反映）を確認し、Question-001 に ☑ を付与。「6. 成果物の構成予定」（開発環境の設定、作業する環境）と「7. 他工程との関係」（差し戻しの解消）に反映。「8. 質問・指示」「9. レビュー指摘」がすべて ☑ となったため、ステータスを「確定」とし、「1. 進捗」の 2・3 に ☑ を付与 | c2/Question-001 の開発者回答、`plans/c1_implementation-plan.md`（ステータス：完了） |
| 2026-09-27 00:25 | /c2-implement | ステータスの確定を確認し「1. 進捗」の 4 に ☑。5-1（Task-001・Task-002）を実施し、実行結果を記載 | implementation-plan.md 2.、Task-001、Task-002 |
| 2026-09-27 00:40 | /c2-implement | 5-2（Task-003）を実施し、実行結果を記載 | implementation-plan.md Task-003、5-1 のコミット欄についての開発者の回答（このままでよい） |
| 2026-09-27 00:51 | /c2-implement | 5-3（Task-004）を実施し、実行結果を記載 | implementation-plan.md Task-004 |
| 2026-09-27 00:54 | /c2-implement | 5-4（Task-005）を実施し、実行結果を記載 | implementation-plan.md Task-005 |
| 2026-09-27 00:57 | /c2-implement | 5-5（Task-006）を実施し、実行結果を記載 | implementation-plan.md Task-006 |
| 2026-09-27 01:00 | /c2-implement | 5-6（Task-007）を実施し、実行結果を記載 | implementation-plan.md Task-007 |
| 2026-09-27 09:53 | /c2-implement | 5-7（Task-008）を実施し、実行結果を記載 | implementation-plan.md Task-008、sandbox を無効にしてコマンドを実行するという開発者の指示（チャット） |
| 2026-09-27 09:56 | /c2-implement | 5-7 の記録の日時を UTC（00:53）から JST（09:53）に修正。`.devcontainer/devcontainer.json` にタイムゾーン（JST）を設定し、5-7 の実行結果に記載 | 開発者の指示（チャット：日時を JST にする、コンテナを作り直しても JST にする） |
| 2026-09-27 10:02 | /c2-implement | 5-8（Task-009）を実施し、実行結果を記載。Task-008 の履歴の収支の丸めを修正し、5-8 の実行結果に記載 | implementation-plan.md Task-009、c1/Question-019 |
| 2026-09-27 11:30 | /c2-implement | 5-9（Task-010）を実施し、実行結果を記載 | implementation-plan.md Task-010 |
