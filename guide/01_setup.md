# 利用開始の手順

## 1. 前提

| 必要なもの | 確認方法 | 用途 |
|---|---|---|
| Claude Code | `claude --version` | AI との対話、スキルの実行 |
| Git | `git --version` | バージョン管理。c4 の再テスト対象の選定にも使う |
| jq または python3 | `jq --version` / `python3 --version` | フックが開発者の入力を読み取るために使う |
| bash | `bash --version` | フックの実行 |

## 2. 基盤を新しいプロジェクトに取り込む

次のファイル・フォルダを、新しいプロジェクトのリポジトリにコピーします。

| 対象 | 内容 |
|---|---|
| `CLAUDE.md` | 全工程共通のルール |
| `.claude/` | スキル、フック、設定 |
| `templates/` | ひな形 |
| `guide/` | 本ガイド |
| `.gitignore` | フックの目印ファイル等を Git の管理対象外にする設定 |

コピーの例（`<基盤>` はこのリポジトリ、`<新規>` は新しいプロジェクト）：

```bash
cd <新規>
cp -R <基盤>/CLAUDE.md <基盤>/.claude <基盤>/templates <基盤>/guide <基盤>/.gitignore .
mkdir -p docs/{_reference,a0_request,a1_requirements,b1_design/{decisions,mockups},c1_implementation-plan,c2_implement,c3_test-plan,c4_test,d1_setup} plans/_log src tests
chmod +x .claude/hooks/*.sh
```

- 空のフォルダを Git で管理する場合は、各フォルダに `.gitkeep` を置きます。
- GitHub を使う場合は、このリポジトリを「テンプレートリポジトリ」に設定し、そこから新しいリポジトリを作る方法もあります。

## 3. 開発依頼書を作る

1. ひな形をコピーします。

   ```bash
   cp templates/request.md docs/a0_request/request.md
   ```

2. `docs/a0_request/request.md` を記入します。
   - 各項目に `Request-01`、`Request-02` … の番号を付けます（ファイル全体で通し番号）。
   - わからない事項は空欄のままで構いません。AI が要件定義で質問します。
3. 記入が終わったら、冒頭のステータスを「記入中」から「確定」に変えます。「確定」になるまで `/a1-requirements` は動きません。

## 4. 参考資料を置く

- 既存の資料（業務マニュアル、画面の例、既存システムの仕様等）があれば `docs/_reference/` に置きます。
- `request.md` の「8. 参考資料」に、ファイル名と内容を記載します。
- AI はこれらを読み取るだけで、変更しません。

## 5. フックを有効にする

フックは、開発者の入力と、AI が変更したファイルを `plans/_log/prompt-log.md` に自動で記録します。

1. `.claude/settings.json` を開き、次の 1 行を削除します。

   ```json
   "disableAllHooks": true,
   ```

2. Claude Code を再起動します（新しいセッションを開始します）。
3. Claude Code で `/hooks` を実行し、`UserPromptSubmit` と `Stop` にフックが登録されていることを確認します。

- 記録は `docs/a0_request/request.md` が存在する場合のみ行われます。
- 基盤そのものを編集している間は、`"disableAllHooks": true` を戻して記録を止めてください。

## 6. 動作確認

1. Claude Code の入力欄で `/` を入力し、次の 8 つのコマンドが候補に表示されることを確認します。

   | コマンド | 工程 |
   |---|---|
   | `/a1-requirements` | 要件定義 |
   | `/b1-design` | コンポーネント設計 |
   | `/c1-implementation-plan` | 実装計画 |
   | `/c2-implement` | 実装 |
   | `/c3-test-plan` | テスト計画 |
   | `/c4-test` | テスト |
   | `/d1-setup` | セットアップ手順 |
   | `/z9-answer-review` | 回答確認 |

2. 同じ名前の別のコマンドが表示される場合（名前の衝突）は、基盤の管理者に連絡してください。

## 7. 開始する

`/a1-requirements` を実行します。以降の進め方は [02_workflow.md](02_workflow.md) を参照してください。
