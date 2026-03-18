# WORK-37: MCP 파이프라인 Context Isolation 구현

> Created: 2026-03-18
> 요구사항: REQ-Context-Isolation
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: TypeScript, Node.js, child_process.spawn, vitest
> Language: ko
> Status: PLANNED

## Goal

MCP Server의 execute_task/execute_work가 Agent 모드와 동일한 Context Isolation을 보장하도록 spawn-pipeline.ts를 개선한다. builder → verifier → committer를 각각 독립 claude -p 프로세스로 순차 실행하고, 파일 기반 context-handoff + gate check + retry 로직을 적용한다.

## Task Dependency Graph

TASK-00 → TASK-01

## Tasks

### TASK-00: spawn-pipeline Context Isolation 핵심 구현
- **Depends on**: (none)
- **Scope**: spawn-pipeline.ts를 개선하여 REQ-1~6 전체 구현. Agent별 개별 spawn, 프롬프트 빌드 함수 내부 호출, 파일 기반 Context Handoff, Gate Check + Retry (max 3회), Job 상태 세분화(stage/attempt/gateResult), execute_work DAG 자동 실행 포함.
- **Files**:
  - `mcp-server/src/core/spawn-pipeline.ts` — Context Isolation 핵심 로직 전면 재작성
  - `mcp-server/src/tools/task.ts` — execute_task가 spawnTaskIsolated를 사용하도록 연동

### TASK-01: 테스트 업데이트 및 빌드 검증
- **Depends on**: TASK-00
- **Scope**: spawn-pipeline.test.ts를 신규 인터페이스(spawnTaskIsolated, spawnWorkDag)에 맞게 업데이트. 새 JobStatus 필드(stage, attempt, gateResult) 테스트. npm run build && npm test 통과 확인.
- **Files**:
  - `mcp-server/src/core/__tests__/spawn-pipeline.test.ts` — 테스트 업데이트
