# WORK-34: Phase 2 — Pipeline Execution MCP Server 실행 도구 구현

## 개요
설계문서 v1.4 §6 Phase 2 기준으로, MCP 서버에 Pipeline/Task/Git Tools 및 Core 엔진(DAG, Execution-Mode, Context-Window, Activity-Log, Webhook-Relay)을 구현한다.

## Execution-Mode
full

## Task Dependency Graph
```
TASK-00 (Execution-Mode) ──┐
                            ├──→ TASK-03 (Pipeline Tools) ──→ TASK-05 (Git Tools)
TASK-01 (DAG) ─────────────┤
                            └──→ TASK-04 (Task Tools)
TASK-02 (Context+Log) ─────┤
                            └──→ TASK-06 (Webhook Relay) ──→ TASK-07 (sync_callbacks)
```

## Tasks

| TASK | 내용 | 산출물 | 의존성 |
|------|------|--------|--------|
| TASK-00 | Execution-Mode 판정 엔진 | `core/execution-mode.ts` | (없음) |
| TASK-01 | DAG 엔진 | `core/dag.ts` | (없음) |
| TASK-02 | 슬라이딩 윈도우 컨텍스트 관리 + Activity Log | `core/context-window.ts`, `core/activity-log.ts` | (없음) |
| TASK-03 | Pipeline Tools (create_work, execute_work, approve_plan, resume_work) | `tools/pipeline.ts` | TASK-00, TASK-01 |
| TASK-04 | Task Tools (get_next_task, execute_task, retry_task, approve_task) | `tools/task.ts` | TASK-01, TASK-02 |
| TASK-05 | Git Tools (commit_work, push_work) | `tools/git.ts` | TASK-03 |
| TASK-06 | Webhook Relay 모듈 | `core/webhook-relay.ts`, `core/callback-status.ts` | TASK-02 |
| TASK-07 | sync_callbacks Monitor Tool + 배치 재전송 | `tools/monitor.ts` (추가) | TASK-06 |
