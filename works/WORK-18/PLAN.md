# WORK-18: 나머지 에이전트 파일 5개 router.md 형식으로 재편

> Created: 2026-03-15
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Markdown
> Language: ko
> Status: PLANNED

## Goal

agents/router.md의 4섹션 구조(1.역할 / 2.수행업무 / 3.업무수행단계 및 내용 / 4.제약사항 및 금지사항)와 동일한 형식으로 planner.md, scheduler.md, builder.md, verifier.md, committer.md를 재편한다.

## Task Dependency Graph

```
TASK-00 ─┐
TASK-01 ─┤
TASK-02 ─┼─ (독립 병렬 실행 가능, 순차 처리)
TASK-03 ─┤
TASK-04 ─┘
```

## Tasks

### TASK-00: planner.md router.md 형식으로 재편
- **Depends on**: (none)
- **Scope**: agents/planner.md를 router.md의 4섹션 구조로 재구성. 기존 내용은 유지하되 섹션 구조(1.역할/2.수행업무/3.업무수행단계 및 내용/4.제약사항 및 금지사항)에 맞게 재배치한다.
- **Files**:
  - `agents/planner.md` — 4섹션 구조로 재편

### TASK-01: scheduler.md router.md 형식으로 재편
- **Depends on**: (none)
- **Scope**: agents/scheduler.md를 router.md의 4섹션 구조로 재구성.
- **Files**:
  - `agents/scheduler.md` — 4섹션 구조로 재편

### TASK-02: builder.md router.md 형식으로 재편
- **Depends on**: (none)
- **Scope**: agents/builder.md를 router.md의 4섹션 구조로 재구성.
- **Files**:
  - `agents/builder.md` — 4섹션 구조로 재편

### TASK-03: verifier.md router.md 형식으로 재편
- **Depends on**: (none)
- **Scope**: agents/verifier.md를 router.md의 4섹션 구조로 재구성.
- **Files**:
  - `agents/verifier.md` — 4섹션 구조로 재편

### TASK-04: committer.md router.md 형식으로 재편
- **Depends on**: (none)
- **Scope**: agents/committer.md를 router.md의 4섹션 구조로 재구성.
- **Files**:
  - `agents/committer.md` — 4섹션 구조로 재편
