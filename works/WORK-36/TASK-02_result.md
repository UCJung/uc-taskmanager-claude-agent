# TASK-02 Result

> WORK: WORK-36 — MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행
> Completed: 2026-03-18
> Status: **DONE**

## 요약

`task.ts`의 execute_task를 spawnTask() 호출로 전환. TASK spec + 의존성 컨텍스트를 `[WORK 시작]` 프롬프트에 포함하여 claude -p spawn. 즉시 job_id 반환.

## 완료 체크리스트
- [x] execute_task가 spawnTask()를 호출하여 claude -p를 spawn함
- [x] execute_task 반환값에 job_id 필드가 포함됨
- [x] 반환 status가 "spawned"로 변경됨
- [x] spec이 있으면 프롬프트에 포함됨
- [x] previous_context가 있으면 프롬프트에 포함됨
- [x] workId와 taskId가 별도 파라미터로 spawnTask에 전달됨
- [x] TypeScript 컴파일 오류 없음

## 검증 결과
- Build: PASS (npx tsc --noEmit)
- Tests: PASS (5 tests in task.test.ts)

## 파일 변경 사항

### 수정됨
- `mcp-server/src/tools/task.ts` — spawnTask import 추가 (as spawnTaskProcess), execute_task 핸들러에서 프롬프트 구성(`[WORK 시작] ${spec}` + 이전 TASK 컨텍스트) 후 spawnTaskProcess() 호출, 반환값을 job_id/status:"spawned" 구조로 변경

## Context Handoff

### Builder Context
task.ts에 spawn-pipeline.js에서 `spawnTask as spawnTaskProcess` import. execute_task에서 spec이 있으면 `[WORK 시작] ${spec}` 프롬프트 구성, resolvedContext가 있으면 `## 이전 TASK 컨텍스트` 섹션 추가. spec이 없으면 fallback 프롬프트 사용. spawnTaskProcess(work_id, normalizedTaskId, prompt, {cwd}) 호출. 기존 spec/previous_context 직접 반환 제거, job_id + status:"spawned" 반환으로 대체.
