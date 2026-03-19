# WORK-28: Router→Specifier 전환 반영 — docs 및 README 현행화

> Created: 2026-03-20
> 요구사항: 변경된 사항을 확인하여 docs 폴더와 readme 현행화
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Node.js (CLI), Markdown docs
> Language: ko
> Status: PLANNED

## Goal
에이전트 아키텍처가 router에서 specifier로 전환된 변경 사항을 README.md, README_KO.md, docs/ 3개 설계 문서에 반영하여 문서를 현행화한다.

## Task Dependency Graph
```
TASK-00 (README.md)  TASK-01 (README_KO.md)  TASK-02 (spec_pipeline-arch)  TASK-03 (spec_sliding+callback)
   │                    │                        │                              │
   └────────────────────┴────────────────────────┴──────────────────────────────┘
                              (모두 독립 — 병렬 실행 가능)
```

## Tasks

### TASK-00: README.md — router 참조를 specifier 기반으로 갱신
- **Depends on**: (none)
- **Scope**: README.md 내 router 에이전트 참조를 specifier 기반 아키텍처로 갱신. 에이전트 테이블 6개 구성, 파이프라인 다이어그램, execution-mode 설명, 저장소 구조 agents/ ko/en 분리 반영, Verify 섹션 에이전트 목록 갱신. config 파일명 "router"는 유지(NFR-01).
- **Files**:
  - `README.md` — MODIFY

### TASK-01: README_KO.md — router 참조를 specifier 기반으로 갱신
- **Depends on**: (none)
- **Scope**: README_KO.md 내 router 에이전트 참조를 specifier 기반으로 갱신. 에이전트 테이블, 파이프라인 다이어그램, agents/ 디렉토리 구조를 ko/en 분리 구조로 갱신, --lang CLI 옵션 반영 확인. config 파일명 "router"는 유지(NFR-01).
- **Files**:
  - `README_KO.md` — MODIFY

### TASK-02: spec_pipeline-architecture.md — specifier 기반 아키텍처로 전면 갱신
- **Depends on**: (none)
- **Scope**: 에이전트 구성표(6개), execution-mode 체계(specifier 겸임/위임), 에이전트별 상세 역할, Dispatcher-Receiver 매핑 테이블 갱신. router 참조를 specifier로 갱신. config 파일명 "router"는 유지(NFR-01).
- **Files**:
  - `docs/spec_pipeline-architecture.md` — MODIFY

### TASK-03: spec_sliding-window-context.md + spec_callback-integration.md — router 참조 갱신
- **Depends on**: (none)
- **Scope**: spec_sliding-window-context.md의 router 참조, spec_callback-integration.md의 router 참조를 specifier로 갱신. 콜백 전송 주체 테이블에서 direct 모드 주체를 specifier로 변경. config 파일명 "router"는 유지(NFR-01).
- **Files**:
  - `docs/spec_sliding-window-context.md` — MODIFY
  - `docs/spec_callback-integration.md` — MODIFY
