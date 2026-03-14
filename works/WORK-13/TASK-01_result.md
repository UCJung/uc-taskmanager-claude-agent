# WORK-13-TASK-01 Result

> Status: **DONE**
> Commit: (will be filled after git commit)

## Verification

### Acceptance Criteria Verification

- [x] `agents/router.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [x] `agents/xml-schema.md`에서 `tasks/multi-tasks/` 참조가 모두 `works/`로 변경됨
- [x] `agents/shared-prompt-sections.md` Section 3이 새 디렉토리 구조를 반영함
- [x] `router.md`의 WORK-LIST.md 경로가 `works/WORK-LIST.md`로 변경됨
- [x] `router.md`의 bash 스크립트에서 `ls -d works/WORK-*` 패턴으로 변경됨

## Context Handoff

### Builder Context

**What**: 4개 조율 에이전트(router, xml-schema, context-policy, shared-prompt-sections) 파일의 경로 규칙을 새 표준으로 변경.
- `tasks/multi-tasks/` → `works/`
- 파일명 패턴 프리픽스 제거 및 dash→underscore 변경

**Why**: TASK-00의 구현 에이전트 변경에 따라 조율 에이전트도 동일한 경로 규칙을 따르기 위함.

**Caution**: context-policy.md에는 `tasks/multi-tasks/` 경로 참조가 없었으나 파일명 패턴만 업데이트됨.

**Incomplete**: 다음 단계(TASK-02)에서 `.claude/agents/` 디렉토리에 모든 변경사항을 동기화해야 함.
