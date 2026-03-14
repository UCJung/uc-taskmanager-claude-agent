# WORK-13-TASK-01 Progress

- Status: COMPLETED
- Started: 2026-03-14 (auto mode)
- Updated: 2026-03-14
- Files changed:
  - agents/router.md — 경로 패턴 변경
  - agents/xml-schema.md — 경로 패턴 변경
  - agents/context-policy.md — 파일명 패턴 변경
  - agents/shared-prompt-sections.md — 전체 경로 및 파일명 규칙 업데이트

## Implementation Details

4개 조율 에이전트 파일에서 경로 및 파일명 패턴을 일괄 치환:
- `tasks/multi-tasks/` → `works/`
- TASK 파일명 프리픽스 제거
- progress/result 파일명 패턴 변경 (dash → underscore)

router.md의 WORK-LIST.md 경로도 `works/WORK-LIST.md`로 변경됨.
