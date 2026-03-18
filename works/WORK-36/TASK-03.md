# TASK-03: 테스트 작성 + 빌드 검증

## WORK
WORK-36: MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행

## Dependencies
- TASK-02 (required)

## Scope

세 개의 테스트 파일을 신규 생성하고 빌드 + 전체 테스트를 통과시킨다.

### 1. spawn-pipeline.test.ts

`mcp-server/src/core/__tests__/spawn-pipeline.test.ts`

테스트 케이스:
- `child_process.spawn` mock (vi.mock) 설정
- **jobId 생성**: spawnPipeline() 반환값이 `${workId}-${timestamp}` 패턴인지 확인
- **jobId 생성 (task)**: spawnTask() 반환값이 `${workId}-${taskId}-${timestamp}` 패턴인지 확인
- **상태 전이 (completed)**: stdout에 `{"type":"result","subtype":"success"}` 라인 emit → getJobStatus()가 "completed" 반환
- **상태 전이 (failed)**: 프로세스 error 이벤트 → getJobStatus()가 "failed" 반환
- **stream-json 파싱**: `type: "assistant"` + `tool_use` 라인에서 currentTask 업데이트 확인
- **listActiveJobs()**: running 상태 job만 포함, completed 제외

mock 전략:
```ts
vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockProcess),
}));
```
EventEmitter 기반 mockProcess로 stdout/stderr/close 이벤트 시뮬레이션.

### 2. pipeline.test.ts

`mcp-server/src/tools/__tests__/pipeline.test.ts`

기존 테스트 파일이 있으면 수정, 없으면 신규 생성.

테스트 케이스:
- **execute_work가 job_id 반환**: 반환 JSON에 `job_id` 필드 존재 확인
- **execute_work status**: `"spawned"` 값 확인
- **get_job_status 도구 등록**: server.tool에 `"get_job_status"`가 등록되어 있는지 확인
- **get_job_status list_all**: listActiveJobs() mock 호출 확인
- **get_job_status job_id**: getJobStatus(jobId) mock 호출 확인

spawn-pipeline 모듈 mock:
```ts
vi.mock("../../core/spawn-pipeline.js", () => ({
  spawnPipeline: vi.fn().mockResolvedValue("WORK-36-1234567890"),
  getJobStatus: vi.fn().mockReturnValue(null),
  listActiveJobs: vi.fn().mockReturnValue([]),
}));
```

### 3. task.test.ts

`mcp-server/src/tools/__tests__/task.test.ts`

기존 테스트 파일이 있으면 수정, 없으면 신규 생성.

테스트 케이스:
- **execute_task가 job_id 반환**: 반환 JSON에 `job_id` 필드 존재 확인
- **execute_task status**: `"spawned"` 값 확인
- **spawnTask 호출 파라미터**: workId, taskId가 별도 파라미터로 전달됨 확인
- **프롬프트에 spec 포함**: spec이 있으면 프롬프트에 포함되어 spawnTask 호출됨
- **프롬프트에 previous_context 포함**: context가 있으면 프롬프트에 포함됨

spawn-pipeline 모듈 mock:
```ts
vi.mock("../../core/spawn-pipeline.js", () => ({
  spawnTask: vi.fn().mockResolvedValue("WORK-36-TASK-00-1234567890"),
}));
```

### 빌드 검증

`npm run build` 실행 후 dist/ 산출물 확인:
- `dist/core/spawn-pipeline.js` 생성 확인
- `dist/tools/pipeline.js` 갱신 확인
- `dist/tools/task.js` 갱신 확인

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/core/__tests__/spawn-pipeline.test.ts` | CREATE | spawn-pipeline 단위 테스트 |
| `mcp-server/src/tools/__tests__/pipeline.test.ts` | CREATE | pipeline 도구 테스트 (execute_work + get_job_status) |
| `mcp-server/src/tools/__tests__/task.test.ts` | CREATE | task 도구 테스트 (execute_task) |

## Acceptance Criteria
- [ ] spawn-pipeline.test.ts: 모든 케이스 PASS
- [ ] pipeline.test.ts: execute_work job_id 반환 + get_job_status 등록 확인 PASS
- [ ] task.test.ts: execute_task job_id 반환 + spawnTask 파라미터 PASS
- [ ] `npm run build` PASS (TypeScript 컴파일 오류 없음)
- [ ] `npm run test` PASS (전체 테스트 스위트)

## Verify
```bash
cd /c/rnd/agent/uc-taskmanager/mcp-server
npm run build
npm run test
```
