#!/bin/bash
# UserPromptSubmit フック：開発者の入力を plans/_log/prompt-log.md に 1 行で追記する。
# 形式：IN|日時|入力（改行は ⏎、| は ｜ に置換）
# docs/a0_request/request.md が存在する場合のみ記録する（開発基盤の構築中は記録しない）。
set -u
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
log="$root/plans/_log/prompt-log.md"
marker="$root/.claude/hooks/.turn-start"

input=$(cat)
[ -f "$root/docs/a0_request/request.md" ] || exit 0

if [ ! -f "$log" ]; then
  mkdir -p "$(dirname "$log")"
  cp "$root/templates/prompt-log.md" "$log"
fi

if command -v jq >/dev/null 2>&1; then
  prompt=$(printf '%s' "$input" | jq -r '.prompt // ""')
else
  prompt=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("prompt", ""), end="")')
fi
prompt=$(printf '%s' "$prompt" | tr -d '\r' | sed 's/|/｜/g' | awk 'BEGIN{ORS=""} NR>1{print "⏎"} {print}')

printf 'IN|%s|%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$prompt" >> "$log"
touch "$marker"
exit 0
