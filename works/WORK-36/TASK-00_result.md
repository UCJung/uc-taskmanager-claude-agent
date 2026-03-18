# TASK-00 Result

> WORK: WORK-36 — MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행
> Completed: 2026-03-18
> Status: **DONE**

## 요약

`mcp-server/src/core/spawn-pipeline.ts` 코어 모듈 신규 생성. JobStatus 타입, spawnPipeline/spawnTask/getJobStatus/listActiveJobs 함수 구현. child_process.spawn 기반 claude -p 비동기 실행 + stream-json stdout 파싱.

## 완료 체크리스트
- [x] JobStatus 타입이 명세대로 정의됨
- [x] spawnPipeline()이 즉시 jobId를 반환하고 백그라운드에서 claude -p를 실행함
- [x] spawnTask()가 workId + taskId를 별도 파라미터로 수신하여 jobId에 포함함
- [x] getJobStatus(jobId)가 올바른 JobStatus 또는 null을 반환함
- [x] listActiveJobs()가 pending/running 상태 job만 반환함
- [x] stream-json stdout 파싱 시 type="result" 라인에서 status를 completed/failed로 전환함
- [x] Activity Log가 DISPATCH 스테이지로 기록됨
- [x] TypeScript 컴파일 오류 없음

## 검증 결과
- Build: PASS (npx tsc --noEmit)
- Tests: PASS (14 tests in spawn-pipeline.test.ts)

## 파일 변경 사항

### 생성됨
- `mcp-server/src/core/spawn-pipeline.ts` — claude -p spawn 코어 모듈 (JobStatus, spawnPipeline, spawnTask, getJobStatus, listActiveJobs, stream-json 파싱)

## Context Handoff

### Builder Context
spawn-pipeline.ts 신규 생성. JobStatus 인터페이스(jobId, workId, status, pid, startedAt, finishedAt, currentTask, progress, error). spawnPipeline()은 `${workId}-${Date.now()}` jobId 생성, spawnTask()는 `${workId}-${taskId}-${Date.now()}`. runClaude()에서 child_process.spawn으로 `claude -p --dangerously-skip-permissions --output-format stream-json` 실행. env에서 CLAUDECODE, ANTHROPIC_API_KEY 제거. processStreamLine()으로 stream-json 파싱 — type=result에서 completed/failed 판정, type=assistant+tool_use에서 currentTask 업데이트.
