# TASK-00: router.md 3-7 섹션 분리 및 work-activity-log.md 생성

## WORK
WORK-17: router.md 3-7 Work Activity Log 섹션 분리

## Dependencies
- (none)

## Scope

`agents/router.md`의 `### 3-7. Work Activity Log` 섹션 전체 내용을 `agents/work-activity-log.md`로 추출한다.
router.md의 3-7 섹션은 내용 없이 `→ agents/work-activity-log.md 참조` 형태로 남기거나 삭제하고,
3-1 STARTUP 참조 파일 테이블에 `agents/work-activity-log.md` 항목을 추가한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/work-activity-log.md` | CREATE | 3-7 섹션 내용 이관 — log_work 함수, STAGE 테이블, 참조 자료 수집 규칙 포함 |
| `agents/router.md` | MODIFY | 3-7 섹션 내용 제거 후 참조 라인만 유지, 3-1 테이블에 work-activity-log.md 항목 추가 |

## Acceptance Criteria
- [ ] `agents/work-activity-log.md` 파일 생성됨
- [ ] `work-activity-log.md`에 log_work 함수, STAGE 테이블, 참조 자료 수집 규칙이 포함됨
- [ ] `agents/router.md` 3-7 섹션 내용이 제거됨 (`→ agents/work-activity-log.md 참조` 라인은 유지 또는 추가)
- [ ] `agents/router.md` 3-1 STARTUP 참조 테이블에 `agents/work-activity-log.md` 항목이 추가됨

## Verify
```bash
grep -n "work-activity-log" C:/rnd/agent/uc-taskmanager/agents/router.md
ls C:/rnd/agent/uc-taskmanager/agents/work-activity-log.md
```
