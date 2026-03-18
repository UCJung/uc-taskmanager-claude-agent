# WORK-36: MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행

> Created: 2026-03-18
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: TypeScript, Node.js, MCP SDK, child_process, vitest
> Language: ko
> Status: PLANNED

## Goal

MCP Server의 execute_work/execute_task가 실제로 `claude -p`를 spawn하여 기존 Agent 방식([태그])과 동일하게 비동기 파이프라인을 실행하도록 구현한다. spawn-pipeline.ts 코어 모듈 신규 생성, get_job_status 도구 추가, 테스트 작성을 포함한다.

## Task Dependency Graph

```
TASK-00 (spawn-pipeline.ts 코어 모듈)
  └── TASK-01 (execute_work 비동기 전환 + get_job_status 도구)
        └── TASK-02 (execute_task 비동기 전환)
              └── TASK-03 (테스트 작성 + 빌드 검증)
```

## Tasks

### TASK-00: spawn-pipeline.ts 코어 모듈 신규 생성
- **Depends on**: (none)
- **Scope**: `mcp-server/src/core/spawn-pipeline.ts` 신규 구현. claude -p child_process spawn, stream-json stdout 파싱, job 상태 관리(JobStatus), Activity Log 기록.
- **Files**:
  - `mcp-server/src/core/spawn-pipeline.ts` — CREATE

### TASK-01: execute_work 비동기 전환 + get_job_status 도구 추가
- **Depends on**: TASK-00
- **Scope**: `pipeline.ts`의 execute_work를 spawnPipeline() 호출로 전환(즉시 job_id 반환). get_job_status 신규 도구 등록(job_id 폴링).
- **Files**:
  - `mcp-server/src/tools/pipeline.ts` — MODIFY

### TASK-02: execute_task 비동기 전환
- **Depends on**: TASK-01
- **Scope**: `task.ts`의 execute_task를 spawnTask() 호출로 전환. TASK 명세 + 의존성 컨텍스트를 프롬프트에 포함.
- **Files**:
  - `mcp-server/src/tools/task.ts` — MODIFY

### TASK-03: 테스트 작성 + 빌드 검증
- **Depends on**: TASK-02
- **Scope**: spawn-pipeline.ts 단위 테스트 + pipeline/task 통합 테스트. `npm run build` 통과 확인.
- **Files**:
  - `mcp-server/src/core/__tests__/spawn-pipeline.test.ts` — CREATE
  - `mcp-server/src/tools/__tests__/pipeline.test.ts` — CREATE
  - `mcp-server/src/tools/__tests__/task.test.ts` — CREATE
