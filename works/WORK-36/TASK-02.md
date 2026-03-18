# TASK-02: execute_task 비동기 전환

## WORK
WORK-36: MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행

## Dependencies
- TASK-01 (required)

## Scope

`mcp-server/src/tools/task.ts`를 수정한다.

### execute_task 변경

현재: TASK 명세(spec) + 의존성 컨텍스트(previous_context)를 JSON으로 반환만 함
변경: `spawnTask()`를 호출하여 claude -p 프로세스를 spawn하고 즉시 job_id를 반환

변경 포인트:
- `spawnTask` import 추가 (`../core/spawn-pipeline.js`)
- 프롬프트 구성:
  ```
  [WORK 시작] {spec 내용}
  
  {previous_context가 있으면 추가:}
  ## 이전 TASK 컨텍스트
  {previous_context}
  ```
- `spawnTask(work_id, normalizedTaskId, prompt, { cwd: config.projectRoot })` 호출
- 반환값: `{ work_id, task_id, job_id, status: "spawned", message: "TASK 실행이 시작되었습니다." }`
- 기존 spec, previous_context 필드는 반환에서 제거 (job_id로 대체)

spec이 없는 경우 프롬프트 폴백:
```
[WORK 시작] WORK-{workId}의 {taskId}를 실행하라.
```

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/tools/task.ts` | MODIFY | execute_task를 spawnTask() 기반 비동기 전환 |

## Acceptance Criteria
- [ ] execute_task가 spawnTask()를 호출하여 claude -p를 spawn함
- [ ] execute_task 반환값에 job_id 필드가 포함됨
- [ ] 반환 status가 "spawned"로 변경됨
- [ ] spec이 있으면 프롬프트에 포함됨
- [ ] previous_context가 있으면 프롬프트에 포함됨
- [ ] workId와 taskId가 별도 파라미터로 spawnTask에 전달됨
- [ ] TypeScript 컴파일 오류 없음

## Verify
```bash
cd /c/rnd/agent/uc-taskmanager/mcp-server
npx tsc --noEmit
```
