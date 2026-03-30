#!/bin/bash
# work-status-sync hook
# PostToolUse(Bash) 시 실행
# git commit 후 모든 TASK result가 존재하면 WORK-LIST.md를 IN_PROGRESS → DONE으로 변경

# stdin에서 JSON 읽기 (jq 없이 grep/sed로 파싱)
INPUT=$(cat)

# tool_input.command 추출
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')

# git commit이 아니면 즉시 종료
echo "$COMMAND" | grep -q "git commit" || exit 0

# cwd 추출
CWD=$(echo "$INPUT" | grep -o '"cwd"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')
[ -z "$CWD" ] && exit 0

WORK_LIST="$CWD/works/WORK-LIST.md"
[ -f "$WORK_LIST" ] || exit 0

# IN_PROGRESS인 WORK 찾기
grep "IN_PROGRESS" "$WORK_LIST" | grep -oE 'WORK-[0-9]+' | while read WORK_ID; do
  WORK_DIR="$CWD/works/$WORK_ID"
  [ -d "$WORK_DIR" ] || continue

  # TASK 파일 수 (_progress, _result 제외)
  TOTAL=$(ls "$WORK_DIR"/TASK-*.md 2>/dev/null | grep -cv '_result\|_progress')
  # result 파일 수
  DONE=$(ls "$WORK_DIR"/TASK-*_result.md 2>/dev/null | wc -l)

  if [ "$TOTAL" -gt 0 ] && [ "$DONE" -ge "$TOTAL" ]; then
    sed -i "s/| $WORK_ID |\(.*\)| IN_PROGRESS |/| $WORK_ID |\1| DONE |/" "$WORK_LIST"
    cd "$CWD" && git add "$WORK_LIST" && git commit --amend --no-edit 2>/dev/null
  fi
done

exit 0
