# WORK-10: mini-PLAN.md 명칭을 PLAN.md로 통일

> Created: 2026-03-14
> 요구사항: N/A
> Project: uc-taskmanager
> Tech Stack: Claude Code CLI, Markdown agents
> Execution-Mode: full
> Language: ko
> Status: PLANNED

## Goal
프로젝트 전반에서 `mini-PLAN.md`라는 명칭을 `PLAN.md`로 통일한다. PLAN.md 내부의 `Execution-Mode: direct|pipeline|full` 필드로 모드를 구분하므로 파일명 분리가 불필요하다. Router가 direct/pipeline 모드에서 직접 PLAN.md를 생성한다는 점을 명확히 명시한다.

## Task Dependency Graph

```
WORK-10-TASK-00 (단일 작업, 의존 없음)
```

## Tasks

### WORK-10-TASK-00: mini-PLAN 명칭을 PLAN으로 전면 치환
- **Depends on**: (none)
- **Scope**: 5개 대상 파일에서 mini-PLAN 관련 텍스트를 PLAN으로 치환하고, Router가 직접 PLAN.md를 생성한다는 문구를 보강한다
- **Files**:
  - `.claude/agents/router.md` — 이미 sed 치환 완료. "Router가 직접 PLAN.md를 생성한다" 문구 명시 보강
  - `.claude/agents/xml-schema.md` — 이미 sed 치환 완료. 내용 검토 후 추가 수정 필요시 반영
  - `README.md` — mini-PLAN 언급 치환 필요
  - `README_KO.md` — mini-PLAN 언급 치환 필요
  - `docs/spec_pipeline-architecture.md` — 이미 sed 치환 완료
- **Acceptance Criteria**:
  - [ ] `grep -r "mini-PLAN" . --include="*.md"` 결과 0건
  - [ ] router.md에 Router가 직접 PLAN.md를 생성한다는 문구가 명시되어 있음
  - [ ] 각 파일의 문맥이 자연스럽게 유지됨 (단순 치환으로 인한 어색한 문장 없음)
