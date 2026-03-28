# WORK-44: README 문서 현행화 (v1.4.0)

> Created: 2026-03-28
> Requirement: README 문서 현행화 -- v1.4.0 구조적 변경사항 반영
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Markdown (documentation only)
> Language: ko
> Status: PLANNED

## Goal
v1.4.0 릴리스에서 이루어진 구조적 변경(combined spawns, approval gate 변경, ref-cache Phase 2 등)을 README.md와 README_KO.md에 반영하여 문서를 현행화한다.

## Task Dependency Graph
```
TASK-00 (README.md + README_KO.md 현행화)
```

## Tasks

### TASK-00: README.md 및 README_KO.md 현행화
- **Depends on**: (none)
- **Scope**: 8개 변경 항목을 README.md에 반영하고, README_KO.md에 동기화
- **Files**:
  - `README.md` -- combined spawns, spawn count 테이블, approval gate, ref-cache Phase 2, claude -p, skills 수, PRIVACY.md 반영
  - `README_KO.md` -- 위 변경사항 한국어 동기화
