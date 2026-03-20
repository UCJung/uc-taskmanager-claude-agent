# WORK-24: agents 파일 분석 기반 Pipeline Architecture 스펙 문서 갱신

> Created: 2026-03-15
> 요구사항: N/A
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: Markdown, Claude Agent System
> Language: ko
> Status: PLANNED

## Goal

agents/ 디렉토리의 12개 에이전트 정의 파일을 분석하여 현행 시스템과 spec_pipeline-architecture.md(v1.0) 간의 차이를 식별하고, v1.1 변경분을 포함하여 스펙 문서를 v1.2로 전면 갱신한다.

## Task Dependency Graph

```
TASK-00 (agents/ 파일 분석 및 v1.0 스펙과의 차이점 식별)
    │
    ▼
TASK-01 (spec_pipeline-architecture.md 전면 갱신 v1.0 → v1.2)
```

## Tasks

### TASK-00: agents/ 파일 분석 및 v1.0 스펙과의 차이점 식별
- **Depends on**: (none)
- **Scope**: agents/ 디렉토리의 12개 파일을 전수 분석하여 현행 에이전트 시스템의 구조, 역할, 흐름을 파악하고, 기존 spec_pipeline-architecture.md(v1.0) 및 v1.1과 비교하여 차이점/누락 항목을 식별한다.
- **Files**:
  - `agents/agent-flow.md` — 에이전트 실행 흐름 정의
  - `agents/builder.md` — Builder 에이전트 정의
  - `agents/committer.md` — Committer 에이전트 정의
  - `agents/context-policy.md` — 컨텍스트 정책
  - `agents/file-content-schema.md` — 파일 포맷 스키마
  - `agents/planner.md` — Planner 에이전트 정의
  - `agents/router.md` — Router 에이전트 정의
  - `agents/scheduler.md` — Scheduler 에이전트 정의
  - `agents/shared-prompt-sections.md` — 공통 규칙
  - `agents/verifier.md` — Verifier 에이전트 정의
  - `agents/work-activity-log.md` — Activity Log 규칙
  - `agents/xml-schema.md` — XML 스키마 정의
  - `docs/spec_pipeline-architecture.md` — v1.0 스펙 (비교 대상)
  - `docs/spec_pipeline-architecture_v1.1.md` — v1.1 스펙 (비교 대상)

### TASK-01: spec_pipeline-architecture.md 전면 갱신 (v1.0 → v1.2)
- **Depends on**: TASK-00
- **Scope**: TASK-00의 분석 결과를 기반으로 spec_pipeline-architecture.md를 v1.2로 전면 갱신한다. v1.0/v1.1에서 누락된 항목을 보충하고, 현행 agents/ 파일 내용과 정확히 일치하도록 스펙을 작성한다.
- **Files**:
  - `docs/spec_pipeline-architecture.md` — v1.2로 전면 갱신
