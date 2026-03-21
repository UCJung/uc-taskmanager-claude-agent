# WORK-41: ref-cache 체인 전파 Phase 1 — 에이전트 간 중복 파일 읽기 제거

> Created: 2026-03-21
> Requirement: works/WORK-41/Requirement.md
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: Markdown (agent prompt files), Node.js
> Language: ko
> Status: PLANNED

## Goal
dispatch XML과 task-result XML에 `<ref-cache>` 요소를 정의하고, 6개 에이전트(en/ko)에 Reference Loading 규칙을 추가하여 파이프라인 전체에서 참조 파일 중복 읽기를 제거한다.

## Task Dependency Graph
```
TASK-00  (xml-schema + agent-flow 스키마/규칙 정의)
  ├── TASK-01  (en 에이전트 6개 ref-cache 규칙 추가)
  └── TASK-02  (ko 에이전트 6개 ref-cache 규칙 추가)
```

## Tasks

### TASK-00: xml-schema.md + agent-flow.md에 ref-cache 스키마/규칙 정의
- **Depends on**: (none)
- **Scope**: dispatch XML과 task-result XML에 `<ref-cache>` 요소 스키마를 정의하고, agent-flow.md에 Main Claude의 ref-cache 체인 전파 규칙을 추가한다.
- **Files**:
  - `agents/en/xml-schema.md` — MODIFY: `<ref-cache>` 요소 정의 추가
  - `agents/en/agent-flow.md` — MODIFY: ref-cache 전달 규칙 추가

### TASK-01: en 에이전트 6개에 ref-cache Reference Loading 규칙 추가
- **Depends on**: TASK-00
- **Scope**: 영문 에이전트 6개 파일의 STARTUP 섹션에 ref-cache 기반 Reference Loading 규칙을 추가한다.
- **Files**:
  - `agents/en/specifier.md` — MODIFY
  - `agents/en/planner.md` — MODIFY
  - `agents/en/scheduler.md` — MODIFY
  - `agents/en/builder.md` — MODIFY
  - `agents/en/verifier.md` — MODIFY
  - `agents/en/committer.md` — MODIFY

### TASK-02: ko 에이전트 6개에 ref-cache Reference Loading 규칙 추가 (한국어)
- **Depends on**: TASK-00
- **Scope**: 한국어 에이전트 6개 파일에 TASK-01과 동일한 ref-cache Reference Loading 규칙을 한국어로 추가한다.
- **Files**:
  - `agents/ko/specifier.md` — MODIFY
  - `agents/ko/planner.md` — MODIFY
  - `agents/ko/scheduler.md` — MODIFY
  - `agents/ko/builder.md` — MODIFY
  - `agents/ko/verifier.md` — MODIFY
  - `agents/ko/committer.md` — MODIFY
