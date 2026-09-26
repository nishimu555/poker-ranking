# テスト計画書

<!--
本ファイルはテスト計画書（docs/c3_test-plan/test-plan.md）のテンプレートである。
<> で囲まれた箇所を置き換える。記載ルールは CLAUDE.md および .claude/skills/c3-test-plan/SKILL.md に従う。
- すべての記載に「由来」（Feature-XXX、Quality-XXX、Task-XXX 期待値N、c3/Question-XXX 等）を記載する。由来のない記載はしない。
- Small テストケースの期待値は c1 で定めたものをそのまま登録する（変更しない）。
-->

| 項目 | 内容 |
|---|---|
| 工程 | c3 テスト計画 |
| plan ファイル | `plans/c3_test-plan.md` |
| 入力 | `docs/a1_requirements/requirements.md`、`docs/b1_design/component-design.md`、`docs/c1_implementation-plan/implementation-plan.md` |
| 最終更新 | YYYY-MM-DD HH:MM |

## 1. 概要

### 対象範囲

| 対象 | 由来 |
|---|---|
| <Feature-XXX、Quality-XXX 等> | <requirements.md> |

### 対象外

| 対象外 | 根拠 | 由来 |
|---|---|---|
| <対象外とする要件> | <根拠> | <c3/Question-XXX> |

## 2. テストの方針

| サイズ | 定義 | 実行環境 | 実行者 | テストツール | 由来 |
|---|---|---|---|---|---|
| Small | 1 プロセス内で完結。実行環境固有の機能は代用品（モック）に置き換える | ローカル | AI | <ツール名> | <implementation-plan.md 2. 開発の前提> |
| Medium | 1 台のマシン内、または 1 つのデプロイ先で完結 | <ローカル／デプロイ先> | <AI／開発者> | <ツール名／手動> | <c3/Question-XXX> |
| Large | 複数の環境・外部サービスをまたぐ、利用者の操作を通して確認 | <デプロイ先／実機・外部サービス> | <AI／開発者> | <ツール名／手動> | <c3/Question-XXX> |

## 3. テストケース一覧

| Test | サイズ | 対象 | 概要 | 実行環境 | 実行者 | 由来 |
|---|---|---|---|---|---|---|
| Test-001 | Small | <Component-XXX／Task-XXX> | <概要> | ローカル | AI | <Task-XXX 期待値N> |
| Test-0XX | Medium | <Component-XXX> | <概要> | <デプロイ先> | 開発者 | <Feature-XXX 受け入れ条件N> |

## 4. Small テストケース

<!-- c1 のテスト期待値をそのまま登録する。 -->

| Test | Task と期待値 | 条件 | 期待される結果 |
|---|---|---|---|
| Test-001 | <Task-XXX 期待値1> | <c1 の条件> | <c1 の期待される結果> |

## 5. Medium・Large テストケース

<!--
記載例：
### Test-0XX：<名称>

- サイズ：<Medium／Large>
- 対象：<Component-XXX、Feature-XXX>
- 実行環境：<ローカル／デプロイ先／実機・外部サービス>
- 実行者：<AI／開発者>
- 前提：<状態、テストデータ>
- 手順：
  1. <操作>
  2. <操作>
- 期待される結果：<結果>
- 種別：<機能／非機能（性能等）／セキュリティ（脅威分析の対策）>
- 由来：<Feature-XXX 受け入れ条件N、Quality-XXX、component-design.md 7. 脅威分析>
-->

## 6. 開発者が実行するテストの手順

### 事前準備

<!-- テスト用のアカウント、テストデータ、実機、認証情報の扱い方（秘密情報そのものは記載しない）。 -->

- <準備事項>（由来：<c3/Question-XXX>）

### デプロイ手順

<!-- コードでデプロイできる場合は実行するコマンドを、できない場合は操作手順を記載する。 -->

```
<例：npm run deploy>
```

- <コマンドの説明、確認すべき出力>

### 実施手順と結果の記載方法

1. 「5. Medium・Large テストケース」の実行者が開発者のテストケースを、手順に従って実施する。
2. 結果を `docs/c4_test/test-report.md` の該当テストケースの結果欄に記載する（成功／失敗、実施日、失敗時の状況）。
3. `/c4-test` を実行すると、AI が結果を確認・集計する。

## 7. 合格の基準

| 基準 | 由来 |
|---|---|
| <開発者の回答（例：全テストケースが成功）> | <c3/Question-XXX> |

## 8. トレーサビリティ

<!-- すべての Feature・Quality・c1 のテスト期待値が、いずれかのテストケースに対応していること。 -->

| 要件・期待値 | 対応するテストケース | 備考 |
|---|---|---|
| Feature-001 | <Test-XXX> | |
| Quality-001 | <Test-XXX> | |
| Task-001 期待値1 | <Test-XXX> | |

## 9. 変更履歴

| 日時 | スキル | 変更内容 | 根拠 |
|---|---|---|---|
