# TASK-01: execute_work 비동기 전환 + get_job_status 도구 추가

## WORK
WORK-36: MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행

## Dependencies
- TASK-00 (required)

## Scope

`mcp-server/src/tools/pipeline.ts`를 수정한다.

### execute_work 변경

현재: DAG 분석 후 ready_tasks 목록만 반환 (실제 실행 없음)
변경: `spawnPipeline()`을 호출하여 claude -p 프로세스를 spawn하고 즉시 job_id를 반환

변경 포인트:
- `spawnPipeline` import 추가 (`../core/spawn-pipeline.js`)
- 프롬프트 구성: `WORK-{workId} 파이프라인을 실행하라. {execution_mode} 모드.`
- spawnPipeline 호출 → jobId 획득
- 반환값에 `job_id` 필드 추가, `status: "spawned"` 로 변경
- 기존 ready_tasks, next_action 필드는 유지 (호환성)

### get_job_status 신규 도구 추가

도구명: `get_job_status`
설명: 파이프라인 job의 실행 상태를 조회한다.

파라미터:
```ts
{
  job_id: z.string().optional().describe("조회할 job ID (생략 시 list_all 필요)"),
  list_all: z.boolean().optional().default(false).describe("true이면 전체 활성 job 목록 반환"),
}
```

동작:
- `list_all: true` → `listActiveJobs()` 결과 반환
- `job_id` 지정 → `getJobStatus(job_id)` 결과 반환
- 둘 다 없으면 오류 반환

반환 예시:
```json
{
  "job_id": "WORK-36-1711234567890",
  "work_id": "WORK-36",
  "status": "running",
  "pid": 12345,
  "startedAt": "2026-03-18T10:00:00",
  "currentTask": "TASK-01",
  "progress": { "completed": 1, "total": 4 }
}
```

registerPipelineTools 함수 내부에 5번째 도구로 등록. 함수 주석의 등록 도구 목록도 업데이트.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/tools/pipeline.ts` | MODIFY | execute_work 비동기 전환 + get_job_status 추가 |

## Acceptance Criteria
- [ ] execute_work가 spawnPipeline()을 호출하여 claude -p를 spawn함
- [ ] execute_work 반환값에 job_id 필드가 포함됨
- [ ] get_job_status 도구가 MCP 서버에 등록됨
- [ ] list_all: true로 활성 job 전체 목록을 반환함
- [ ] job_id 지정 시 해당 JobStatus를 반환함
- [ ] TypeScript 컴파일 오류 없음

## Verify
```bash
cd /c/rnd/agent/uc-taskmanager/mcp-server
npx tsc --noEmit
```
