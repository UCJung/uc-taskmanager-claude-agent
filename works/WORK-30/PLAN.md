# WORK-30: Claude Marketplace Plugin 형식 전환

> Created: 2026-03-20
> 요구사항: works/WORK-30/Requirement.md
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Node.js (ESM), Claude Code CLI, Claude Plugin
> Language: ko
> Status: PLANNED

## Goal

uc-taskmanager를 Claude Marketplace Plugin 형식으로 전환하여 Plugin 배포와 기존 npm CLI 배포를 병행 지원한다. Plugin에는 영어(en) 에이전트만 포함한다.

## Task Dependency Graph

```
TASK-00 ──→ TASK-01 ──→ TASK-02
```

## Tasks

### TASK-00: 에이전트 디렉토리 재구조화 + npm CLI 경로 수정
- **Depends on**: (none)
- **Scope**: agents/en/*.md 12개 파일을 agents/ 루트로 이동. agents/en/ 디렉토리 제거. lib/constants.mjs의 getAgentsSrcDir('en') 반환값을 agents/ 루트로 수정. package.json files 필드 업데이트.
- **Files**:
  - `agents/*.md` (12개) — agents/en/에서 루트로 이동
  - `agents/en/` — 제거
  - `lib/constants.mjs` — getAgentsSrcDir('en') 경로 수정
  - `package.json` — files 필드 수정

### TASK-01: Plugin 매니페스트 및 설정 파일 생성
- **Depends on**: TASK-00
- **Scope**: .claude-plugin/plugin.json 매니페스트 생성. agents 필드를 배열 형식으로 12개 에이전트 경로 명시. settings.json 생성 (선택).
- **Files**:
  - `.claude-plugin/plugin.json` — CREATE
  - `settings.json` — CREATE (선택)

### TASK-02: Plugin README 작성 및 Marketplace 제출 준비
- **Depends on**: TASK-01
- **Scope**: Marketplace 페이지에 표시될 Plugin README 작성 (영문). 에이전트 목록, 사용법, 설치 가이드 포함. 기존 README.md와의 관계 정리. 제출 체크리스트 최종 확인.
- **Files**:
  - `README.md` — MODIFY (Plugin 설명 통합)
