# TASK-00: spawn-pipeline.ts 코어 모듈 신규 생성

## WORK
WORK-36: MCP Server spawn-pipeline — claude -p 기반 비동기 파이프라인 실행

## Dependencies
- (없음)

## Scope

`mcp-server/src/core/spawn-pipeline.ts`를 신규 생성한다. `claude -p`를 Node.js `child_process.spawn`으로 실행하는 코어 모듈이다.

구현 요소:

1. **JobStatus 타입 정의**
   ```ts
   interface JobStatus {
     jobId: string;
     workId: string;
     status: "pending" | "running" | "completed" | "failed";
     pid?: number;
     startedAt: string;       // ISO 8601
     finishedAt?: string;
     currentTask?: string;
     progress?: { completed: number; total: number };
     error?: string;
   }
   ```

2. **jobId 생성 규칙**: `${workId}-${Date.now()}` 형식

3. **job 상태 관리**: `Map<string, JobStatus>` in-memory (모듈 레벨 싱글톤)

4. **spawnPipeline(workId, prompt, options?)** 함수
   - 실행 명령: `env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p {prompt} --dangerously-skip-permissions --output-format stream-json`
   - child_process.spawn으로 비동기 실행
   - stdout stream-json 파싱 → Activity Log 기록 (logWork 사용)
   - stdout의 `type: "result"` 라인에서 완료 감지 → status "completed"
   - 프로세스 에러/종료 시 status "failed" + error 기록
   - 즉시 jobId 반환 (비동기)

5. **spawnTask(workId, taskId, prompt, options?)** 함수
   - spawnPipeline과 동일 구조
   - jobId에 taskId 포함: `${workId}-${taskId}-${Date.now()}`
   - currentTask 필드에 taskId 기록

6. **getJobStatus(jobId)** 함수: Map에서 JobStatus 반환, 없으면 null

7. **listActiveJobs()** 함수: status가 "pending" 또는 "running"인 전체 목록 반환

8. **options** 인터페이스:
   ```ts
   interface SpawnOptions {
     cwd?: string;     // 작업 디렉토리 (기본: projectRoot)
     maxTurns?: number; // --max-turns 옵션
   }
   ```

stream-json 파싱 규칙:
- 각 stdout 라인을 JSON.parse 시도
- `type === "assistant"` + `content[].type === "tool_use"` → currentTask 업데이트
- `type === "result"` → completed/failed 판정
- 파싱 실패 라인은 무시 (raw 로그만 기록)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/core/spawn-pipeline.ts` | CREATE | claude -p spawn 코어 모듈 |

## Acceptance Criteria
- [ ] JobStatus 타입이 명세대로 정의됨
- [ ] spawnPipeline()이 즉시 jobId를 반환하고 백그라운드에서 claude -p를 실행함
- [ ] spawnTask()가 workId + taskId를 별도 파라미터로 수신하여 jobId에 포함함
- [ ] getJobStatus(jobId)가 올바른 JobStatus 또는 null을 반환함
- [ ] listActiveJobs()가 pending/running 상태 job만 반환함
- [ ] stream-json stdout 파싱 시 type="result" 라인에서 status를 completed/failed로 전환함
- [ ] Activity Log가 DISPATCH 스테이지로 기록됨
- [ ] TypeScript 컴파일 오류 없음

## Verify
```bash
cd /c/rnd/agent/uc-taskmanager/mcp-server
npx tsc --noEmit
```
