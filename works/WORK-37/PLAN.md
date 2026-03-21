# WORK-37: Pipeline Architecture Spec v1.2 현행화 + HTML 시각화 갱신

> Created: 2026-03-21
> Requirement: works/WORK-37/Requirement.md
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Markdown, HTML, CSS, JavaScript
> Language: ko
> Status: PLANNED

## Goal

Router 기반의 pipeline-architecture spec v1.1을 현재의 6-에이전트(Specifier 중심) 구조에 맞게 v1.2로 전면 현행화하고, HTML 시각화에 EN/KO 언어 전환 기능을 추가한다.

## Task Dependency Graph

```
TASK-00 (Spec v1.2 현행화)
  └──▶ TASK-01 (HTML 시각화 v1.2 갱신 + EN/KO 언어 전환)
```

## Tasks

### TASK-00: Spec v1.2 현행화
- **Depends on**: (none)
- **Scope**: `docs/spec_pipeline-architecture_v1.1.md`를 v1.2로 전면 갱신. Router 참조 제거, Specifier 기반 6-에이전트 구조 반영, execution-mode 판정 주체 변경, WORK-LIST.md 3단계 상태 반영, 불변 보장/Dispatcher-Receiver/산출물 테이블 현행화, 관련 문서 경로 갱신.
- **Files**:
  - `docs/spec_pipeline-architecture_v1.2.md` — v1.2 신규 생성 (v1.1 기반 전면 갱신)
  - `docs/spec_pipeline-architecture_v1.1.md` — 삭제 (v1.2로 대체)

### TASK-01: HTML 시각화 v1.2 갱신 + EN/KO 언어 전환
- **Depends on**: TASK-00
- **Scope**: spec v1.2 내용 기반으로 HTML 시각화 전면 갱신. Router→Specifier 전환, 6-에이전트 구조 반영. EN/KO 언어 전환 토글 UI 추가 (JavaScript, 새로고침 없이 즉시 반영). 기존 디자인 퀄리티 유지.
- **Files**:
  - `docs/pipeline-architecture-v1.2-visual.html` — v1.2 신규 생성 (EN/KO 토글 포함)
  - `docs/pipeline-architecture-v1.1-visual.html` — 삭제 (v1.2로 대체)
