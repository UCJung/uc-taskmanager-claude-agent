# WORK-45: 기술문서 및 README 영/한 현행화 (v1.4.0~v1.5.0)

> Created: 2026-03-28
> Requirement: 오늘 수정된 agent 관련 내용으로 모든 기술문서와 리드미 영/한 현행화
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: Markdown, HTML (documentation only)
> Language: ko
> Status: PLANNED

## Goal
2026-03-28 커밋된 agent 변경사항(spawn 결합, 자동 권한 설정, plugin 리소스 npm 포함 등)을 모든 기술문서와 README 영/한에 반영하여 문서를 현행화한다.

## 변경사항 요약 (오늘 커밋 기준)

| 커밋 | 변경 내용 |
|------|-----------|
| `326d238` | specifier+planner 단일 spawn 결합, verifier+committer 단일 spawn 결합 (총 spawn 30% 감소) |
| `64f53b6` | plugin agents에 category 필드 추가, git 권한 통합 |
| `2840e05` | `uctm init` 시 settings.local.json Bash 권한 자동 설정 (v1.4.0) |
| `27ea790` | agent 프롬프트에서 pipe 명령어 제거 (Windows 호환성) |
| `2e9de2e` | `uctm init` 시 .claude-plugin, skills 폴더도 설치 |
| `ca11d63` | npm 패키지에 plugin 리소스 포함 + v1.5.0 버전업 |

## Task Dependency Graph

```
TASK-00 (README.md + README_KO.md)
   │
   ▼
TASK-01 (Pipeline architecture spec + visual)
   │
   ▼
TASK-02 (SDD spec + sliding-window + callback specs + visuals)
   │
   ▼
TASK-03 (plugin/README.md)
```

## Tasks

### TASK-00: README.md 및 README_KO.md 현행화
- **Depends on**: (none)
- **Scope**: 양쪽 README에 v1.4.0~v1.5.0 변경사항 반영
  - spawn 결합 설명 추가 (Pipeline, direct mode 다이어그램 갱신)
  - Token Economy 섹션에 spawn 결합 30% 감소 추가
  - Quick Start에 자동 권한 설정 반영 (승인 프롬프트 없음)
  - uctm init이 plugin 리소스도 설치한다는 내용
  - npm v1.5.0 반영
  - README_KO.md 저장소 구조 docs/ 파일명 실제와 일치하도록 갱신
- **Files**:
  - `README.md` — 영문 README 전면 현행화
  - `README_KO.md` — 한국어 README 전면 현행화

### TASK-01: Pipeline Architecture Spec 및 시각화 현행화
- **Depends on**: TASK-00
- **Scope**: pipeline architecture 스펙 문서에 spawn 결합 아키텍처 반영
  - 에이전트 호출 구조 다이어그램 갱신 (specifier+planner 단일 spawn, verifier+committer 단일 spawn)
  - direct 모드 12단계 → spawn 수 갱신
  - pipeline/full 모드 spawn 수 갱신
  - HTML 시각화에 spawn 결합 반영
- **Files**:
  - `docs/spec_pipeline-architecture_v1.3.md` — 스펙 문서 현행화
  - `docs/pipeline-architecture-v1.3-visual.html` — 인터랙티브 시각화 현행화

### TASK-02: SDD 스펙 및 기타 스펙/시각화 현행화
- **Depends on**: TASK-01
- **Scope**: SDD 통합 설계 명세, sliding-window, callback 문서 현행화
  - spec_SDD_with_ucagent_requirement.md: 변경 이력 v1.6.0 추가, 에이전트 호출 구조 현행화
  - spec_sliding-window-context.md: spawn 결합이 context handoff에 미치는 영향 반영
  - spec_callback-integration.md: spawn 결합 반영 (callback 전송 주체 변경 여부 확인)
  - 각 HTML 시각화 파일 업데이트
- **Files**:
  - `docs/spec_SDD_with_ucagent_requirement.md` — SDD 설계 명세 현행화
  - `docs/SDD-requirement-visual.html` — SDD 시각화 현행화
  - `docs/spec_sliding-window-context.md` — 슬라이딩 윈도우 스펙 현행화
  - `docs/sliding-window-context-visual.html` — 슬라이딩 윈도우 시각화 현행화
  - `docs/spec_callback-integration.md` — 콜백 연동 스펙 현행화
  - `docs/callback-integration-visual.html` — 콜백 시각화 현행화

### TASK-03: plugin/README.md 현행화
- **Depends on**: TASK-00
- **Scope**: plugin README에 v1.5.0 변경사항 반영
  - spawn 결합 파이프라인 설명
  - 자동 권한 설정
  - plugin 리소스(skills, .claude-plugin) 설치 설명
- **Files**:
  - `plugin/README.md` — Plugin README 현행화
