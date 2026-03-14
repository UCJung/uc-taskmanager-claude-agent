# WORK-13-TASK-02: .claude/agents/ 전체 동기화

## WORK
WORK-13: 파일경로 현행화 — tasks/multi-tasks/ → works/, TASK 파일명 중복 프리픽스 제거

## Dependencies
- WORK-13-TASK-00 (required)
- WORK-13-TASK-01 (required)

## Scope

TASK-00, TASK-01에서 변경된 `agents/` 하위 9개 파일을 `.claude/agents/`에 그대로 복사하여 동기화한다.

두 디렉토리는 항상 동일한 내용을 유지해야 한다. 단순 파일 복사(overwrite)로 처리한다.

```bash
# 동기화 명령 (각 파일별)
cp /c/rnd/agent/uc-taskmanager/agents/planner.md /c/rnd/agent/uc-taskmanager/.claude/agents/planner.md
cp /c/rnd/agent/uc-taskmanager/agents/scheduler.md /c/rnd/agent/uc-taskmanager/.claude/agents/scheduler.md
cp /c/rnd/agent/uc-taskmanager/agents/builder.md /c/rnd/agent/uc-taskmanager/.claude/agents/builder.md
cp /c/rnd/agent/uc-taskmanager/agents/verifier.md /c/rnd/agent/uc-taskmanager/.claude/agents/verifier.md
cp /c/rnd/agent/uc-taskmanager/agents/committer.md /c/rnd/agent/uc-taskmanager/.claude/agents/committer.md
cp /c/rnd/agent/uc-taskmanager/agents/router.md /c/rnd/agent/uc-taskmanager/.claude/agents/router.md
cp /c/rnd/agent/uc-taskmanager/agents/xml-schema.md /c/rnd/agent/uc-taskmanager/.claude/agents/xml-schema.md
cp /c/rnd/agent/uc-taskmanager/agents/context-policy.md /c/rnd/agent/uc-taskmanager/.claude/agents/context-policy.md
cp /c/rnd/agent/uc-taskmanager/agents/shared-prompt-sections.md /c/rnd/agent/uc-taskmanager/.claude/agents/shared-prompt-sections.md
```

## Files

| Path | Action | Description |
|------|--------|-------------|
| `.claude/agents/planner.md` | MODIFY | agents/planner.md 복사 |
| `.claude/agents/scheduler.md` | MODIFY | agents/scheduler.md 복사 |
| `.claude/agents/builder.md` | MODIFY | agents/builder.md 복사 |
| `.claude/agents/verifier.md` | MODIFY | agents/verifier.md 복사 |
| `.claude/agents/committer.md` | MODIFY | agents/committer.md 복사 |
| `.claude/agents/router.md` | MODIFY | agents/router.md 복사 |
| `.claude/agents/xml-schema.md` | MODIFY | agents/xml-schema.md 복사 |
| `.claude/agents/context-policy.md` | MODIFY | agents/context-policy.md 복사 |
| `.claude/agents/shared-prompt-sections.md` | MODIFY | agents/shared-prompt-sections.md 복사 |

## Acceptance Criteria

- [ ] `.claude/agents/` 9개 파일 모두 `agents/` 와 동일한 내용을 가짐 (diff 없음)
- [ ] `.claude/agents/` 파일에 `tasks/multi-tasks/` 패턴이 잔존하지 않음

## Verify

```bash
# diff 검사 (차이 없어야 정상)
diff /c/rnd/agent/uc-taskmanager/agents/planner.md /c/rnd/agent/uc-taskmanager/.claude/agents/planner.md && echo "PASS: planner" || echo "FAIL: planner"
diff /c/rnd/agent/uc-taskmanager/agents/scheduler.md /c/rnd/agent/uc-taskmanager/.claude/agents/scheduler.md && echo "PASS: scheduler" || echo "FAIL: scheduler"
diff /c/rnd/agent/uc-taskmanager/agents/builder.md /c/rnd/agent/uc-taskmanager/.claude/agents/builder.md && echo "PASS: builder" || echo "FAIL: builder"
diff /c/rnd/agent/uc-taskmanager/agents/verifier.md /c/rnd/agent/uc-taskmanager/.claude/agents/verifier.md && echo "PASS: verifier" || echo "FAIL: verifier"
diff /c/rnd/agent/uc-taskmanager/agents/committer.md /c/rnd/agent/uc-taskmanager/.claude/agents/committer.md && echo "PASS: committer" || echo "FAIL: committer"
diff /c/rnd/agent/uc-taskmanager/agents/router.md /c/rnd/agent/uc-taskmanager/.claude/agents/router.md && echo "PASS: router" || echo "FAIL: router"
diff /c/rnd/agent/uc-taskmanager/agents/xml-schema.md /c/rnd/agent/uc-taskmanager/.claude/agents/xml-schema.md && echo "PASS: xml-schema" || echo "FAIL: xml-schema"
diff /c/rnd/agent/uc-taskmanager/agents/context-policy.md /c/rnd/agent/uc-taskmanager/.claude/agents/context-policy.md && echo "PASS: context-policy" || echo "FAIL: context-policy"
diff /c/rnd/agent/uc-taskmanager/agents/shared-prompt-sections.md /c/rnd/agent/uc-taskmanager/.claude/agents/shared-prompt-sections.md && echo "PASS: shared-prompt-sections" || echo "FAIL: shared-prompt-sections"

# .claude/agents/ 잔존 패턴 검사
grep -r "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/.claude/agents/ && echo "FAIL: old paths remain" || echo "PASS: no old paths"
```
