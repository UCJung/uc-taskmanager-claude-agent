# WORK-21: Pipeline Architecture 시각화 HTML 작성

> Created: 2026-03-15
> 요구사항: N/A
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: HTML, CSS, JavaScript (standalone)
> Language: ko
> Status: PLANNED

## Goal
docs/spec_pipeline-architecture.md 스펙 문서의 파이프라인 아키텍처를 인터랙티브 HTML로 시각화하여, 에이전트 구성/execution-mode 3종 체계/TASK 파이프라인 흐름/DAG 의존성 관리 등 핵심 구조를 한눈에 파악할 수 있게 한다.

## Task Dependency Graph
```
TASK-00 (의존 없음)
```

## Tasks

### TASK-00: Pipeline Architecture 시각화 HTML 작성
- **Depends on**: (none)
- **Scope**: docs/spec_pipeline-architecture.md 내용을 분석하여 다음을 포함하는 단일 HTML 파일 작성:
  - 에이전트 6종 구성 및 역할 다이어그램
  - execution-mode 3종 (direct/pipeline/full) 흐름도
  - WORK/TASK 파일 구조 시각화
  - TASK 파이프라인 흐름 (Builder -> Verifier -> Committer)
  - DAG 의존성 관리 다이어그램
  - 비정상 종료 대응 흐름
  - 반응형 레이아웃, 인터랙티브 요소 포함
- **Files**:
  - `docs/pipeline-architecture-visual.html` — 시각화 HTML 파일 (CREATE)
