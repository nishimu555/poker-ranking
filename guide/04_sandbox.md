# 安全な実行環境（サンドボックス・コンテナ）

この基盤では、AI が依存ライブラリの導入、コード・テストの実行、手順の検証を行います（c2・c4・d1）。PC への影響を抑えるため、実行環境を隔離することを推奨します。

本ページの内容は、執筆時点の Claude Code の公式ドキュメントに基づきます。設定項目は Claude Code のバージョンにより変わることがあるため、最新の情報は公式ドキュメントで確認してください。

- サンドボックス：https://code.claude.com/docs/en/sandboxing
- Dev Container：https://code.claude.com/docs/en/devcontainer

## 1. どちらを使うか

| 方法 | 内容 | 必要なもの | 隔離の強さ | 向いている場面 |
|---|---|---|---|---|
| (A) Claude Code のサンドボックス | AI が実行するコマンドのファイルアクセス範囲と通信先を、OS の機能で制限する | 追加なし（macOS）。Linux・WSL2 は `bubblewrap`・`socat` | 中 | 普段の開発（標準） |
| (B) Dev Container | Docker コンテナの中で Claude Code と開発作業を動かす | Docker Desktop 等のコンテナ実行環境、VS Code と Dev Containers 拡張 | 高 | より安全にしたい場合、許可の確認を省いて AI を動かしたい場合、d1 で何もない環境から検証したい場合 |

(A) と (B) は併用もできます。

## 2. (A) サンドボックスを使う

### 有効にする

1. Claude Code で `/sandbox` を実行します。
2. **Mode** タブでモードを選びます。

   | モード | 動作 |
   |---|---|
   | auto-allow | サンドボックス内で実行できるコマンドは、確認なしで実行する |
   | regular permissions | サンドボックス内でも、通常どおり実行の確認を求める |

3. 選んだ内容は `.claude/settings.local.json`（個人用の設定。Git の管理対象外）に保存されます。有効にするかどうかは、開発者ごとに選べます。

### 制限される内容

| 対象 | 既定の動作 |
|---|---|
| ファイルの書き込み | 作業フォルダ（リポジトリ）と一時フォルダのみ |
| 通信 | 既定ではどこにも接続できない。初めて接続する先は、接続してよいか確認される |

### 基盤に設定済みの内容（`.claude/settings.json`）

有効にしたときに適用される設定を、あらかじめ記載しています。

| 設定 | 内容 |
|---|---|
| `excludedCommands: ["docker *"]` | `docker` はサンドボックスと互換性がないため、対象外にする |
| `credentials.files` | `~/.ssh`、`~/.aws`、`~/.clasprc.json`（GAS の `clasp` の認証情報）を、サンドボックス内のコマンドから読めなくする |
| `credentials.envVars` | `GITHUB_TOKEN`、`GH_TOKEN`、`NPM_TOKEN` を、サンドボックス内のコマンドの環境変数から取り除く |

プロジェクトで使う認証情報が増えた場合は、ここに追記します。

### 注意点

- 接続先を広く許可する（例：`github.com` 全体）と、情報を外部に送る経路になり得ます。許可する接続先は必要最小限にしてください。
- macOS では、`gh`、`gcloud`、`terraform` などの一部のツールが TLS の検証に失敗することがあります。その場合は `excludedCommands` に追加します（対象外にしたコマンドは隔離されません）。
- ブラウザでログインする操作（`clasp login`、`gh auth login` 等）は、サンドボックス内では失敗することがあります。開発者が自分のターミナルで実行してください。
- テストツールの `jest` が止まる場合は、`jest --no-watchman` で実行します。
- サンドボックスは危険を減らすものであり、完全な隔離ではありません。

## 3. (B) Dev Container を使う

### 準備

1. Docker Desktop（または OrbStack、Colima 等）を導入し、起動します。
2. VS Code に Dev Containers 拡張（`ms-vscode-remote.remote-containers`）を導入します。

### 起動する

1. VS Code でリポジトリを開きます。
2. コマンドパレット（`Cmd+Shift+P`）で **Dev Containers: Reopen in Container** を実行します。
3. コンテナの作成が終わったら、ターミナルで `claude` を実行し、ログインします。
   - ログインの完了がコンテナに届かない場合は、ブラウザに表示されたコードをターミナルに貼り付けます。
4. 以降は、コンテナの中の Claude Code（ターミナルまたは VS Code の拡張）で作業します。

### 基盤のひな形（`.devcontainer/devcontainer.json`）

| 設定 | 内容 |
|---|---|
| `features` | Node.js と Claude Code（公式の Dev Container Feature）を導入する |
| `remoteUser: vscode` | root 以外のユーザーで実行する |
| `mounts`、`containerEnv` | Claude Code のログイン情報をコンテナの再作成後も保持する（プロジェクトごとに分離） |
| `postCreateCommand` | フックが使う `jq` を導入し、フックに実行権限を付ける |

プログラミング言語やツールは、c1 実装計画「2. 開発の前提」で決まった内容を `features` に追加します（例：Python は `ghcr.io/devcontainers/features/python:1`）。変更後は **Dev Containers: Rebuild Container** を実行します。

### 通信先を制限する（任意）

コンテナからの通信先を許可リストで制限する場合は、Anthropic の参考設定（ファイアウォールのスクリプト `init-firewall.sh` を含む）を参照し、プロジェクトに合わせて取り込みます。

- 参考設定：https://github.com/anthropics/claude-code/tree/main/.devcontainer
- ファイアウォールの実行には、コンテナに追加の権限（`NET_ADMIN`、`NET_RAW`）が必要です。
- Claude Code の動作に必要な接続先は、公式ドキュメントの Network access requirements を参照してください。

### 注意点

- **ホストの秘密情報をコンテナにマウントしない。** `~/.ssh` やクラウドの認証情報ファイルはマウントせず、リポジトリ単位の権限や有効期限の短いトークンを使います。
- **編集はホストにも反映される。** リポジトリのフォルダはコンテナと共有されているため、AI が変更したファイルはそのまま PC 上のリポジトリに反映されます。
- **許可の確認を省く場合。** コンテナ内では `claude --dangerously-skip-permissions` で、実行の確認を省いて動かせます（root では実行できません）。この場合も、共有しているリポジトリのファイルは変更され、通信の制限がなければ外部にも接続できます。通信先の制限と組み合わせ、信頼できるリポジトリでのみ使ってください。
- **デプロイの認証。** `clasp login` などのブラウザでログインする操作は、コンテナ内で行うとコンテナ内に認証情報が保存されます。どこで認証するかは、c1 の「開発の前提（デプロイの方法）」に合わせて決めてください。

## 4. 工程ごとの使い分け

| 工程 | AI が行うこと | 推奨 |
|---|---|---|
| a1〜c1、c3 | 文書の作成が中心 | (A) で十分 |
| c2 実装 | 依存ライブラリの導入、ビルド、テストの実行 | (A)。依存ライブラリが多い場合や信頼性が不明なライブラリを使う場合は (B) |
| c4 テスト | テストの実行 | (A) または (B) |
| d1 セットアップ手順 | 何もない状態からの構築の検証 | 必要に応じて (B)。コンテナを使うと、PC に影響を与えずに構築手順を試せる |
