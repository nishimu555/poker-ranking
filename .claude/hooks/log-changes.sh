#!/bin/bash
# Stop フック：応答中に作成・更新されたファイルを plans/_log/prompt-log.md に 1 行で追記する。
# 形式：OUT|日時|変更ファイル（カンマ区切り）
# 開発者の入力時に log-prompt.sh が置いた目印ファイルより新しいファイルを対象とする。変更がなければ記録しない。
set -u
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
log="$root/plans/_log/prompt-log.md"
marker="$root/.claude/hooks/.turn-start"

cat >/dev/null
[ -f "$log" ] && [ -f "$marker" ] || exit 0

files=$(cd "$root" && find . -type f -newer "$marker" \
  -not -path './.git/*' \
  -not -path '*/node_modules/*' \
  -not -path './plans/_log/prompt-log.md' \
  -not -path './.claude/hooks/.turn-start' \
  | sed 's|^\./||' | sort | paste -sd ',' -)

if [ -n "$files" ]; then
  printf 'OUT|%s|%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$files" >> "$log"
fi
rm -f "$marker"
exit 0
