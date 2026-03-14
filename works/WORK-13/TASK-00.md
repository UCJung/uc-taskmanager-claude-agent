# WORK-13-TASK-00: 구현 에이전트 경로 현행화 (planner, scheduler, builder, verifier, committer)

## WORK
WORK-13: 파일경로 현행화 — tasks/multi-tasks/ → works/, TASK 파일명 중복 프리픽스 제거

## Dependencies
- (none)

## Scope

`agents/` 하위 5개 구현 에이전트 파일에서 아래 패턴을 일괄 치환한다.

### 치환 규칙

| Before | After |
|--------|-------|
| `tasks/multi-tasks/` | `works/` |
| `{WORK_ID}-TASK-XX.md` (파일명) | `TASK-XX.md` |
| `{WORK_ID}-TASK-XX-progress.md` | `TASK-XX_progress.md` |
| `{WORK_ID}-TASK-XX-result.md` | `TASK-XX_result.md` |

### 주의사항

- 경로 패턴 치환 시 **변수 참조** (`${WORK_ID}-TASK-XX`) 형태도 반드시 처리한다.
  - 예: `${WORK_ID}-TASK-XX-progress.md` → `TASK-XX_progress.md`
  - 예: `${WORK_ID}-TASK-XX-result.md` → `TASK-XX_result.md`
  - 예: `${WORK_ID}-TASK-*.md` → `TASK-*.md` (glob 패턴도 포함)
- 파일 내 **예시 코드 블록**(코드 펜스 안)도 모두 업데이트한다.
- TASK ID 참조(`WORK-13-TASK-XX` 형태의 의존성 표기)는 변경하지 않는다. 파일명만 변경.
- `planner.md`의 "CRITICAL: File Naming Rules" 섹션은 새 규칙에 맞게 내용을 업데이트한다.
- `planner.md`의 Output Structure 섹션, PLAN.md Format의 Tasks 예시도 업데이트한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/planner.md` | MODIFY | 경로 패턴 전체 치환, File Naming Rules 섹션 내용 업데이트 |
| `agents/scheduler.md` | MODIFY | 경로 패턴 전체 치환 |
| `agents/builder.md` | MODIFY | 경로 패턴 전체 치환 (progress.md 경로 포함) |
| `agents/verifier.md` | MODIFY | 경로 패턴 전체 치환 (progress gate 경로 포함) |
| `agents/committer.md` | MODIFY | 경로 패턴 전체 치환 (result.md 경로 포함) |

## Acceptance Criteria

- [ ] `agents/planner.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] `agents/scheduler.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] `agents/builder.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] `agents/verifier.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] `agents/committer.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] TASK 파일명 패턴이 `TASK-XX.md` 형식으로 변경됨 (프리픽스 제거)
- [ ] progress 파일명 패턴이 `TASK-XX_progress.md` 형식으로 변경됨
- [ ] result 파일명 패턴이 `TASK-XX_result.md` 형식으로 변경됨
- [ ] planner.md의 "CRITICAL: File Naming Rules" 섹션이 새 규칙을 반영함

## Verify

```bash
# tasks/multi-tasks/ 잔존 여부 검사
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/planner.md && echo "FAIL: planner" || echo "PASS: planner"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/scheduler.md && echo "FAIL: scheduler" || echo "PASS: scheduler"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/builder.md && echo "FAIL: builder" || echo "PASS: builder"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/verifier.md && echo "FAIL: verifier" || echo "PASS: verifier"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/committer.md && echo "FAIL: committer" || echo "PASS: committer"

# works/ 경로 존재 확인
grep -c "works/" /c/rnd/agent/uc-taskmanager/agents/planner.md
grep -c "works/" /c/rnd/agent/uc-taskmanager/agents/scheduler.md
```
