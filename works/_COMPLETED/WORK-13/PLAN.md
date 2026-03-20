# WORK-13: 파일경로 현행화 — tasks/multi-tasks/ → works/, TASK 파일명 중복 프리픽스 제거

> Created: 2026-03-14
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Markdown, Bash
> Language: ko
> Status: PLANNED

## Goal

에이전트 전반의 파일 경로 규칙을 현행화한다.
- 루트 경로: `tasks/multi-tasks/` → `works/`
- TASK 파일명: `WORK-NN-TASK-XX.md` → `TASK-XX.md`
- progress 파일명: `WORK-NN-TASK-XX-progress.md` → `TASK-XX_progress.md`
- result 파일명: `WORK-NN-TASK-XX-result.md` → `TASK-XX_result.md`
- WORK-LIST: `tasks/multi-tasks/WORK-LIST.md` → `works/WORK-LIST.md`

## Task Dependency Graph

```
TASK-00 ──┐
           ├──► TASK-02 ──► TASK-03 ──► TASK-04
TASK-01 ──┘
```

- TASK-00, TASK-01: 병렬 실행 가능 (독립)
- TASK-02: TASK-00, TASK-01 완료 후
- TASK-03: TASK-00, TASK-01 완료 후 (TASK-02와 병렬 가능)
- TASK-04: TASK-02, TASK-03 완료 후

## Tasks

### WORK-13-TASK-00: 구현 에이전트 경로 현행화 (planner, scheduler, builder, verifier, committer)
- **Depends on**: (none)
- **Scope**: `agents/` 하위 5개 구현 에이전트 파일에서 `tasks/multi-tasks/`, `WORK-NN-TASK-XX.md`, `WORK-NN-TASK-XX-progress.md`, `WORK-NN-TASK-XX-result.md` 패턴을 새 규칙으로 일괄 치환
- **Files**:
  - `agents/planner.md` — 경로 패턴 치환
  - `agents/scheduler.md` — 경로 패턴 치환
  - `agents/builder.md` — 경로 패턴 치환
  - `agents/verifier.md` — 경로 패턴 치환
  - `agents/committer.md` — 경로 패턴 치환
- **Acceptance Criteria**:
  - [ ] 5개 파일에서 `tasks/multi-tasks/` 참조가 `works/` 로 변경됨
  - [ ] TASK 파일명 패턴 `{WORK_ID}-TASK-XX.md` → `TASK-XX.md` 반영
  - [ ] progress 파일명 패턴 `{WORK_ID}-TASK-XX-progress.md` → `TASK-XX_progress.md` 반영
  - [ ] result 파일명 패턴 `{WORK_ID}-TASK-XX-result.md` → `TASK-XX_result.md` 반영

### WORK-13-TASK-01: 조율 에이전트 경로 현행화 (router, xml-schema, context-policy, shared-prompt-sections)
- **Depends on**: (none)
- **Scope**: `agents/` 하위 4개 조율 파일에서 동일 경로 패턴 치환
- **Files**:
  - `agents/router.md` — 경로 패턴 치환
  - `agents/xml-schema.md` — 경로 패턴 치환
  - `agents/context-policy.md` — 경로 패턴 치환 (해당 참조가 있는 경우)
  - `agents/shared-prompt-sections.md` — 경로 패턴 치환
- **Acceptance Criteria**:
  - [ ] 4개 파일에서 `tasks/multi-tasks/` 참조가 `works/` 로 변경됨
  - [ ] TASK 파일명/result 파일명 패턴이 새 규칙으로 반영됨
  - [ ] `WORK-LIST.md` 경로 참조도 `works/WORK-LIST.md` 로 변경됨

### WORK-13-TASK-02: .claude/agents/ 전체 동기화
- **Depends on**: WORK-13-TASK-00, WORK-13-TASK-01
- **Scope**: `agents/` 에서 변경된 9개 파일을 `.claude/agents/` 에 그대로 복사하여 동기화
- **Files**:
  - `.claude/agents/planner.md`
  - `.claude/agents/scheduler.md`
  - `.claude/agents/builder.md`
  - `.claude/agents/verifier.md`
  - `.claude/agents/committer.md`
  - `.claude/agents/router.md`
  - `.claude/agents/xml-schema.md`
  - `.claude/agents/context-policy.md`
  - `.claude/agents/shared-prompt-sections.md`
- **Acceptance Criteria**:
  - [ ] `.claude/agents/` 9개 파일이 `agents/` 와 동일한 내용을 가짐
  - [ ] `tasks/multi-tasks/` 패턴이 `.claude/agents/` 파일에 잔존하지 않음

### WORK-13-TASK-03: README.md / README_KO.md / docs/spec_*.md 경로 반영
- **Depends on**: WORK-13-TASK-00, WORK-13-TASK-01
- **Scope**: 문서 파일 내 파일 구조 섹션 및 경로 참조를 새 규칙으로 업데이트
- **Files**:
  - `README.md` — Repository Structure 섹션, 경로 참조
  - `README_KO.md` — 동일
  - `docs/spec_pipeline-architecture.md` — 경로 참조
  - `docs/spec_sliding-window-context.md` — 경로 참조
  - `docs/spec_callback-integration.md` — 경로 참조
- **Acceptance Criteria**:
  - [ ] README 파일 구조 섹션이 `works/` 경로를 반영함
  - [ ] docs/spec_*.md 파일에서 `tasks/multi-tasks/` 참조가 `works/` 로 변경됨

### WORK-13-TASK-04: works/ WORK-LIST.md 생성 + CLAUDE.md / MEMORY.md 경로 반영
- **Depends on**: WORK-13-TASK-02, WORK-13-TASK-03
- **Scope**: `works/WORK-LIST.md` 신규 생성, `CLAUDE.md`의 경로 언급 업데이트, router.md의 WORK-LIST 경로 최종 검증
- **Files**:
  - `works/WORK-LIST.md` — 기존 `tasks/multi-tasks/WORK-LIST.md` 내용 복사 + 경로 반영
  - `CLAUDE.md` — 경로 언급이 있으면 업데이트
- **Acceptance Criteria**:
  - [ ] `works/WORK-LIST.md` 파일이 존재하고 기존 WORK 목록을 포함함
  - [ ] `CLAUDE.md` 내 경로 참조가 최신 상태임
  - [ ] 전체 에이전트 파일에서 `tasks/multi-tasks/` 패턴이 잔존하지 않음 (grep 검증)
