# WORK-13-TASK-01: 조율 에이전트 경로 현행화 (router, xml-schema, context-policy, shared-prompt-sections)

## WORK
WORK-13: 파일경로 현행화 — tasks/multi-tasks/ → works/, TASK 파일명 중복 프리픽스 제거

## Dependencies
- (none)

## Scope

`agents/` 하위 4개 조율 파일에서 아래 패턴을 일괄 치환한다.

### 치환 규칙

| Before | After |
|--------|-------|
| `tasks/multi-tasks/` | `works/` |
| `tasks/multi-tasks/WORK-LIST.md` | `works/WORK-LIST.md` |
| `{WORK_ID}-TASK-XX.md` (파일명) | `TASK-XX.md` |
| `{WORK_ID}-TASK-XX-progress.md` | `TASK-XX_progress.md` |
| `{WORK_ID}-TASK-XX-result.md` | `TASK-XX_result.md` |

### 주의사항

- `router.md`의 WORK ID 검증 bash 스크립트 내 `ls -d tasks/multi-tasks/WORK-*` 패턴도 변경한다.
- `router.md`의 direct 모드 단계 설명에서 경로 언급도 모두 변경한다.
- `router.md`의 WORK-LIST.md 경로 (`tasks/multi-tasks/WORK-LIST.md` → `works/WORK-LIST.md`) 변경한다.
- `xml-schema.md`의 `<plan-file>` 예시 경로, Example Workflows 내 경로를 모두 변경한다.
- `xml-schema.md`의 4.8 섹션 "불변 보장" 테이블 경로도 변경한다.
- `shared-prompt-sections.md`의 Section 3 (WORK and TASK File Path Patterns) 전체를 새 규칙으로 업데이트한다.
- `context-policy.md`는 경로 참조 유무를 확인하고 있으면 변경한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/router.md` | MODIFY | 경로 패턴 전체 치환, WORK-LIST.md 경로 변경 |
| `agents/xml-schema.md` | MODIFY | plan-file 경로, 예시 경로, 불변보장 테이블 치환 |
| `agents/context-policy.md` | MODIFY | 경로 참조가 있으면 치환 (없으면 무변경) |
| `agents/shared-prompt-sections.md` | MODIFY | Section 3 디렉토리 구조 및 파일명 규칙 업데이트 |

## Acceptance Criteria

- [ ] `agents/router.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] `agents/xml-schema.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [ ] `agents/shared-prompt-sections.md` Section 3이 새 디렉토리 구조를 반영함
- [ ] `router.md`의 WORK-LIST.md 경로가 `works/WORK-LIST.md`로 변경됨
- [ ] `router.md`의 bash 스크립트에서 `ls -d tasks/multi-tasks/WORK-*` 패턴이 `ls -d works/WORK-*`로 변경됨

## Verify

```bash
# tasks/multi-tasks/ 잔존 여부 검사
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/router.md && echo "FAIL: router" || echo "PASS: router"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/xml-schema.md && echo "FAIL: xml-schema" || echo "PASS: xml-schema"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/context-policy.md && echo "FAIL: context-policy" || echo "PASS: context-policy"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/agents/shared-prompt-sections.md && echo "FAIL: shared-prompt-sections" || echo "PASS: shared-prompt-sections"

# works/WORK-LIST.md 참조 확인
grep "works/WORK-LIST.md" /c/rnd/agent/uc-taskmanager/agents/router.md && echo "PASS" || echo "FAIL: WORK-LIST path not updated"
```
