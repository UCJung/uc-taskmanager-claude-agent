# TASK-01: 테스트 업데이트 및 빌드 검증

## WORK
WORK-37: MCP 파이프라인 Context Isolation 구현

## Dependencies
- TASK-00 (required)

## Scope

TASK-00에서 변경된 spawn-pipeline.ts 인터페이스에 맞춰 테스트를 업데이트하고, 빌드 및 전체 테스트가 통과하는지 검증한다.

### 테스트 업데이트 대상

1. **spawn-pipeline.test.ts 신규 테스트**
   - `spawnTaskIsolated` — builder/verifier/committer 순차 spawn 검증
   - JobStatus.stage 필드 업데이트 검증 (builder → verifier → committer)
   - JobStatus.attempt 카운터 검증
   - gate check pass 시 committer 진입 검증
   - gate check fail 시 builder 재시도 검증 (max 3회)
   - `spawnWorkDag` — DAG 기반 TASK 순차 실행 검증

2. **기존 테스트 호환성 유지**
   - `spawnPipeline`, `spawnTask` 기존 테스트는 그대로 통과해야 함

### 빌드/린트 검증
- TypeScript 컴파일 오류 없음
- 전체 테스트 통과

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/core/__tests__/spawn-pipeline.test.ts` | MODIFY | 신규 인터페이스 테스트 추가 |

## Acceptance Criteria
- [ ] spawnTaskIsolated 관련 테스트 케이스가 추가된다
- [ ] spawnWorkDag 관련 테스트 케이스가 추가된다
- [ ] gate check + retry 테스트 케이스가 추가된다
- [ ] 기존 spawnPipeline/spawnTask 테스트가 모두 통과한다
- [ ] npm run build가 오류 없이 완료된다
- [ ] npm test (vitest) 전체 테스트가 통과한다

## Verify
```bash
cd C:/rnd/agent/uc-taskmanager/mcp-server
npm run build
npm test -- --reporter=verbose
```
