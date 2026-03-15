# WORK-19: docs/ 참조 문서 최신화 — 에이전트 리팩토링 반영

> Created: 2026-03-15
> 요구사항: N/A
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Markdown
> Language: ko
> Status: PLANNED

## Goal

docs/ 폴더의 3개 참조 문서를 최근 에이전트 리팩토링 변경사항에 맞게 갱신한다.
주요 갱신 항목: 파일명 규칙 현행화, file-content-schema.md 신규 추가 반영, router 구조 변경 반영.

## Tasks

### TASK-00: docs/ 3개 파일 갱신
- **Depends on**: (none)
- **Scope**: spec_pipeline-architecture.md, spec_sliding-window-context.md, spec_callback-integration.md 갱신
- **Files**:
  - `docs/spec_pipeline-architecture.md` — 파일명 규칙, file-content-schema.md 참조 추가, 관련 문서 갱신
  - `docs/spec_sliding-window-context.md` — progress.md / result.md 구조를 file-content-schema.md와 일치, 파일명 규칙 갱신
  - `docs/spec_callback-integration.md` — 참조 문서 경로 확인 및 갱신
- **Acceptance Criteria**: 세 파일 모두 agents/ 최신 구조(파일명 규칙, file-content-schema.md)와 일치
