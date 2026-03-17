# WORK-31: MCP Server Phase 1 — Core MCP Server 구현

> Created: 2026-03-18
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: TypeScript, Bun/Node.js, @modelcontextprotocol/sdk, zod, vitest
> Language: ko
> Status: PLANNED

## Goal

설계문서(docs/plan_MCP-Integration-Design.md v1.3) Phase 1 로드맵에 따라 `mcp-server/` 디렉토리를 신규 생성하고, MCP SDK 기반 서버 뼈대 + 코어 모듈(FileManager, WorkParser) + Monitor Tools + Resources + Prompts를 구현한다. Phase 1 완료 시 stdio transport로 서버를 기동하여 읽기 전용 도구/리소스/프롬프트가 정상 동작하는 것을 검증할 수 있다.

## Task Dependency Graph

```
TASK-00 (프로젝트 초기화 및 서버 뼈대)
   └──→ TASK-01 (FileManager + WorkParser 코어 모듈)
           ├──→ TASK-02 (Monitor Tools)
           ├──→ TASK-03 (Resources)
           └──→ TASK-04 (Prompts)
```

## Tasks

### TASK-00: 프로젝트 초기화 및 서버 뼈대
- **Depends on**: (none)
- **Scope**: mcp-server/ 디렉토리 생성, package.json(SDK/zod/vitest), tsconfig.json, 서버 엔트리포인트(index.ts), McpServer 인스턴스 래퍼(server.ts), 설정 관리(config.ts)
- **Files**:
  - `mcp-server/package.json` — 프로젝트 메타 + 의존성 정의
  - `mcp-server/tsconfig.json` — TypeScript 컴파일 설정 (ES2022, Node16)
  - `mcp-server/src/index.ts` — stdio transport 엔트리포인트
  - `mcp-server/src/server.ts` — McpServer 인스턴스 생성 및 도구/리소스/프롬프트 등록 래퍼
  - `mcp-server/src/core/config.ts` — 프로젝트 경로, works 경로 등 설정 관리

### TASK-01: FileManager + WorkParser 코어 모듈
- **Depends on**: TASK-00
- **Scope**: 파일 시스템 추상화(FileManager)와 WORK/TASK 파싱 로직(WorkParser) 구현. 파일명 정규식 `/^TASK-(\d+)\.md$/`, `/^TASK-(\d+)_progress\.md$/`, `/^TASK-(\d+)_result\.md$/` 준수. 단위 테스트 포함.
- **Files**:
  - `mcp-server/src/core/file-manager.ts` — 파일 시스템 추상화 (readFile, writeFile, listDir, exists)
  - `mcp-server/src/core/work-parser.ts` — WORK/TASK 파싱 (listWorks, getNextWorkId, readPlan, extractTasksFromPlan, getWorkStatus, readTaskResult, detectTechStack)
  - `mcp-server/src/core/__tests__/work-parser.test.ts` — WorkParser 단위 테스트

### TASK-02: Monitor Tools 구현
- **Depends on**: TASK-01
- **Scope**: list_works, get_work_status, get_task_result, get_pipeline_log 4개 Monitor Tool 구현. server.ts에 등록 연결.
- **Files**:
  - `mcp-server/src/tools/monitor.ts` — registerMonitorTools(server) 함수 + 4개 도구 정의

### TASK-03: Resources 구현
- **Depends on**: TASK-01
- **Scope**: MCP Resources 5개 URI 패턴 구현 (work://list, work://{work_id}/plan, work://{work_id}/progress, work://{work_id}/task/{task_id}, work://{work_id}/task/{task_id}/result). 통합 등록 래퍼.
- **Files**:
  - `mcp-server/src/resources/index.ts` — registerResources(server) 통합 등록 래퍼
  - `mcp-server/src/resources/work-list.ts` — work://list 리소스
  - `mcp-server/src/resources/plan.ts` — work://{work_id}/plan 리소스
  - `mcp-server/src/resources/task-file.ts` — work://{work_id}/task/{task_id} 리소스
  - `mcp-server/src/resources/result.ts` — work://{work_id}/task/{task_id}/result 리소스

### TASK-04: Prompts 구현
- **Depends on**: TASK-01
- **Scope**: 6개 에이전트 프롬프트(router, planner, scheduler, builder, verifier, committer)를 MCP Prompts로 노출. 각 에이전트 .md 파일 + 참조문서 자동 병합. 통합 등록 래퍼.
- **Files**:
  - `mcp-server/src/prompts/index.ts` — registerPrompts(server) 통합 등록 래퍼
  - `mcp-server/src/prompts/router.ts` — router 프롬프트
  - `mcp-server/src/prompts/planner.ts` — planner 프롬프트
  - `mcp-server/src/prompts/scheduler.ts` — scheduler 프롬프트
  - `mcp-server/src/prompts/builder.ts` — builder 프롬프트
  - `mcp-server/src/prompts/verifier.ts` — verifier 프롬프트
  - `mcp-server/src/prompts/committer.ts` — committer 프롬프트
