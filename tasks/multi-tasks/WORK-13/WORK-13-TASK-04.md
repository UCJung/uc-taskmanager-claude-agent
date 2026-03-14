# WORK-13-TASK-04: works/WORK-LIST.md 생성 + CLAUDE.md 경로 반영

## WORK
WORK-13: 파일경로 현행화 — tasks/multi-tasks/ → works/, TASK 파일명 중복 프리픽스 제거

## Dependencies
- WORK-13-TASK-02 (required)
- WORK-13-TASK-03 (required)

## Scope

1. `works/WORK-LIST.md` 를 신규 생성한다. 기존 `tasks/multi-tasks/WORK-LIST.md` 내용을 그대로 복사하되, 헤더를 업데이트한다.
2. `CLAUDE.md`에서 경로 언급(`tasks/multi-tasks/`)이 있으면 `works/`로 업데이트한다.
3. 전체 프로젝트에서 `tasks/multi-tasks/` 패턴 잔존 여부를 grep으로 최종 확인한다.

### works/WORK-LIST.md 생성 규칙

- 기존 `tasks/multi-tasks/WORK-LIST.md` 내용을 복사
- WORK-13을 IN_PROGRESS 상태로 추가
- 기존 `tasks/multi-tasks/WORK-LIST.md`는 **삭제하지 않는다** (히스토리 보존)

## Files

| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-LIST.md` | CREATE | 기존 WORK-LIST.md 내용 복사 + WORK-13 추가 |
| `CLAUDE.md` | MODIFY | 경로 참조가 있으면 업데이트 (없으면 무변경) |

## Acceptance Criteria

- [ ] `works/WORK-LIST.md` 파일이 존재함
- [ ] `works/WORK-LIST.md`에 WORK-01 ~ WORK-13 모두 포함됨
- [ ] WORK-13이 `IN_PROGRESS` 상태로 기록됨
- [ ] 전체 `agents/`, `.claude/agents/`, `docs/`, `README*.md` 에서 `tasks/multi-tasks/` 패턴 미존재 (grep 검증)

## Verify

```bash
# works/WORK-LIST.md 존재 확인
[ -f /c/rnd/agent/uc-taskmanager/works/WORK-LIST.md ] && echo "PASS: WORK-LIST.md exists" || echo "FAIL: WORK-LIST.md missing"

# WORK-13 IN_PROGRESS 확인
grep "WORK-13" /c/rnd/agent/uc-taskmanager/works/WORK-LIST.md && echo "PASS: WORK-13 found" || echo "FAIL: WORK-13 missing"

# 전체 잔존 패턴 최종 검사 (agents, .claude/agents, docs, README)
echo "=== Final cleanup check ==="
grep -rn "tasks/multi-tasks" \
  /c/rnd/agent/uc-taskmanager/agents/ \
  /c/rnd/agent/uc-taskmanager/.claude/agents/ \
  /c/rnd/agent/uc-taskmanager/docs/ \
  /c/rnd/agent/uc-taskmanager/README.md \
  /c/rnd/agent/uc-taskmanager/README_KO.md \
  /c/rnd/agent/uc-taskmanager/CLAUDE.md \
  2>/dev/null && echo "FAIL: old paths still exist" || echo "PASS: all paths updated"
```
