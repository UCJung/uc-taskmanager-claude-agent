# WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

> Created: 2026-03-20
> Requirement: works/WORK-31/Requirement.md
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Node.js, ESM (mjs), npm, Claude Plugin
> Language: ko
> Status: PLANNED

## Goal
uc-taskmanager 프로젝트를 projectRoot 아래 `agents/`, `npm/`, `plugin/` 세 개 하위 폴더로 재구조화하여 에이전트 원본, npm 패키지, Claude 플러그인을 명확히 분리한다.

## Task Dependency Graph
```
TASK-00 (agents/ 재구조화)
   ├──→ TASK-01 (npm/ 폴더 생성 및 이동) ──→ TASK-03 (npm 코드 수정 + agents 복사)
   ├──→ TASK-02 (plugin/ 폴더 생성 및 이동) ──→ TASK-04 (plugin 설정 수정 + agents 복사)
   └─────────────────────────────────────────→ TASK-05 (루트 정리 + 문서 + 검증)
```
(TASK-05는 TASK-03, TASK-04 모두 완료 후 실행)

## Tasks

### TASK-00: agents/ 디렉토리 재구조화
- **Depends on**: (none)
- **Scope**: agents/ 루트의 en 에이전트 파일 12개를 agents/en/ 하위로 이동. agents/en/ 디렉토리 생성.
- **Files**:
  - `agents/en/*.md` — en 에이전트 파일 12개 CREATE (이동)
  - `agents/*.md` — 루트 레벨 12개 DELETE (이동 후 제거)

### TASK-01: npm/ 폴더 생성 및 파일 이동
- **Depends on**: TASK-00
- **Scope**: npm/ 디렉토리 생성. bin/cli.mjs, lib/, package.json, .npmignore, .agent/router_rule_config.json을 npm/ 하위로 이동.
- **Files**:
  - `npm/bin/cli.mjs` — 이동
  - `npm/lib/*.mjs` — 이동
  - `npm/package.json` — 이동
  - `npm/.npmignore` — 이동
  - `npm/.agent/router_rule_config.json` — 이동

### TASK-02: plugin/ 폴더 생성 및 파일 이동
- **Depends on**: TASK-00
- **Scope**: plugin/ 디렉토리 생성. .claude-plugin/plugin.json을 plugin/.claude-plugin/으로 이동.
- **Files**:
  - `plugin/.claude-plugin/plugin.json` — 이동

### TASK-03: npm/ 코드 수정 및 agents 복사
- **Depends on**: TASK-01
- **Scope**: npm/lib/constants.mjs의 getAgentsSrcDir 경로를 npm/ 기준으로 수정. npm/package.json의 files 필드 수정. agents/en/ -> npm/agents/, agents/ko/ -> npm/agents/ko/ 복사. LICENSE 복사.
- **Files**:
  - `npm/lib/constants.mjs` — MODIFY (경로 수정)
  - `npm/package.json` — MODIFY (files 필드 수정)
  - `npm/agents/*.md` — CREATE (en 에이전트 복사)
  - `npm/agents/ko/*.md` — CREATE (ko 에이전트 복사)
  - `npm/LICENSE` — CREATE (루트 LICENSE 복사)

### TASK-04: plugin 설정 수정 및 agents 복사
- **Depends on**: TASK-02
- **Scope**: plugin/.claude-plugin/plugin.json의 agents 배열 경로 확인/수정. agents/en/ -> plugin/agents/ 복사. plugin/README.md 생성.
- **Files**:
  - `plugin/.claude-plugin/plugin.json` — MODIFY (agents 경로 수정)
  - `plugin/agents/*.md` — CREATE (en 에이전트 복사)
  - `plugin/README.md` — CREATE (Plugin 전용 README)

### TASK-05: 루트 정리 및 문서 업데이트
- **Depends on**: TASK-03, TASK-04
- **Scope**: 루트의 구 파일 제거 (bin/, lib/, .claude-plugin/, .npmignore, package.json). CLAUDE.md Push 절차에 에이전트 동기화 단계 추가. README.md Repository Structure 업데이트. 최종 검증 (cd npm && npm pack).
- **Files**:
  - `bin/` — DELETE
  - `lib/` — DELETE
  - `.claude-plugin/` — DELETE
  - `.npmignore` — DELETE
  - `package.json` — DELETE
  - `CLAUDE.md` — MODIFY (Push 절차에 동기화 단계 추가)
  - `README.md` — MODIFY (Repository Structure 업데이트)
