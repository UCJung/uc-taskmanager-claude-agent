# TASK-02: Monitor Tools 구현

## WORK
WORK-31: MCP Server Phase 1 — Core MCP Server 구현

## Dependencies
- TASK-01 (required)

## Scope
설계문서 §3.3.3 Monitor Tools 4개를 MCP Tool로 구현한다. WorkParser 코어 모듈을 활용하여 읽기 전용 조회 기능을 제공한다. server.ts에 registerMonitorTools 호출을 연결한다.

구현 도구 목록:
1. `list_works` — 전체 WORK 목록 + 진행률. 입력: `{}`. WorkParser.listWorks() 활용.
2. `get_work_status` — 특정 WORK 상세 상태. 입력: `{ work_id: string }`. 진행률, execution_mode, TASK 상태 목록 반환.
3. `get_task_result` — TASK result.md 내용 조회. 입력: `{ work_id: string, task_id: string }`. WorkParser.readTaskResult() 활용.
4. `get_pipeline_log` — Activity Log 조회. 입력: `{ work_id: string, last_n?: number }`. WorkParser.parseActivityLog() 활용. `[timestamp]_AGENT_STAGE_DESC` 포맷 파싱.

각 도구는 zod 스키마로 입력 검증하고, MCP SDK의 server.tool() API로 등록한다.

설계문서 참조: docs/plan_MCP-Integration-Design.md §3.3.3(Monitor Tools), §4.2(구현 예시)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/tools/monitor.ts` | CREATE | registerMonitorTools(server) — list_works, get_work_status, get_task_result, get_pipeline_log 4개 도구 |
| `mcp-server/src/server.ts` | MODIFY | registerMonitorTools 호출 추가 |

## Acceptance Criteria
- [ ] registerMonitorTools(server) 함수가 4개 도구를 등록
- [ ] list_works가 WORK 목록과 진행률을 JSON으로 반환
- [ ] get_work_status가 특정 WORK의 progress, execution_mode, tasks 상태를 반환
- [ ] get_task_result가 존재하는 result.md 내용을 반환하고, 미존재 시 적절한 에러 메시지 반환
- [ ] get_pipeline_log가 로그 엔트리를 파싱하여 구조화된 배열로 반환
- [ ] 모든 도구가 zod 스키마로 입력 검증
- [ ] npx tsc --noEmit 통과
- [ ] npx vitest run 통과

## Verify
```bash
cd mcp-server && npx tsc --noEmit && npx vitest run
```
