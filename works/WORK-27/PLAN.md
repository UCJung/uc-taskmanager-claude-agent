# WORK-27: COMPLETED 자동 변경 + PLAN.md 요구사항 필드 개선

> Created: 2026-03-20
> 요구사항: 사용자 요청 — (1) 마지막 TASK 완료 시 committer가 WORK-LIST.md를 COMPLETED로 자동 변경, (2) REQ 문서 없을 때 사용자 요청 텍스트를 요구사항 필드에 표시
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: Markdown (agent prompt files)
> Language: ko
> Status: PLANNED

## Goal

두 가지 규칙을 변경한다: (1) WORK-LIST.md COMPLETED 시점을 git push에서 마지막 TASK 완료 시점으로 변경하여 committer가 자동 처리, (2) PLAN.md 요구사항 필드에서 REQ 문서 없을 때 N/A 대신 사용자 요청 텍스트를 기록.

## Task Dependency Graph

```
TASK-00 (단일 TASK)
```

## Tasks

### TASK-00: agents/ko, agents/en 에이전트 파일 일괄 변경
- **Depends on**: (none)
- **Scope**: 변경 1(COMPLETED 자동 변경) + 변경 2(요구사항 필드) 관련 모든 파일 수정
- **Files**:
  - `agents/ko/shared-prompt-sections.md` — S8 WORK-LIST 규칙 변경
  - `agents/en/shared-prompt-sections.md` — S8 WORK-LIST 규칙 변경
  - `agents/ko/committer.md` — COMPLETED 자동 변경 로직 추가, 금지 규칙 제거
  - `agents/en/committer.md` — COMPLETED 자동 변경 로직 추가, 금지 규칙 제거
  - `agents/ko/router.md` — COMPLETED push 시점 규칙 제거
  - `agents/en/router.md` — COMPLETED push 시점 규칙 제거
  - `agents/ko/file-content-schema.md` — S1 요구사항 필드 설명 변경
  - `agents/en/file-content-schema.md` — S1 요구사항 필드 설명 변경
  - `agents/ko/planner.md` — REQ 없을 때 사용자 요청 텍스트 기록으로 변경
  - `agents/en/planner.md` — REQ 없을 때 사용자 요청 텍스트 기록으로 변경
  - `CLAUDE.md` — Push 절차에서 WORK-LIST COMPLETED 변경 단계 제거
