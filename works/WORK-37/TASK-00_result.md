# TASK-00 Result

> WORK: WORK-37 — MCP 파이프라인 Context Isolation 구현
> Completed: 2026-03-18 10:30
> Status: **DONE**
> Commit: 1164a7b

## 요약

spawn-pipeline.ts에 Context Isolation 핵심 로직을 구현하였다. spawnTaskIsolated/spawnWorkDag 함수 신설, JobStatus에 stage/attempt/gateResult 필드 추가, task.ts/pipeline.ts 연동 변경, 빌드 및 204 테스트 PASS 완료.

## 완료 체크리스트

- [x] spawnTaskIsolated 함수가 builder → verifier → committer를 3개의 독립 claude -p 프로세스로 순차 실행한다
- [x] 각 agent 프롬프트는 prompts/_helpers.ts의 readAgentPrompt/readRefDoc/mergeSections를 직접 호출하여 구성된다
- [x] builder 완료 후 progress.md에서 context-handoff를 읽어 verifier 프롬프트에 주입한다
- [x] gate check 실패 시 builder를 최대 3회 재시도한다
- [x] JobStatus에 stage, attempt, gateResult 필드가 추가된다
- [x] spawnWorkDag 함수가 DAG 기반으로 전체 WORK를 자동 실행한다
- [x] 기존 spawnPipeline, spawnTask API는 유지한다 (하위 호환)

## 검증 결과

- Build: PASS
- Lint: PASS
- Tests: PASS (204 passed)

## 변경 파일

### 수정됨
- `mcp-server/src/core/spawn-pipeline.ts` — Context Isolation 전면 재구현 (spawnTaskIsolated/spawnWorkDag 신설, JobStatus 필드 추가)
- `mcp-server/src/tools/task.ts` — execute_task가 spawnTaskIsolated 사용하도록 연동
- `mcp-server/src/tools/pipeline.ts` — execute_work가 spawnWorkDag 사용하도록 연동
- `mcp-server/src/tools/__tests__/task.test.ts` — mock을 새 API(spawnTaskIsolated)에 맞게 업데이트
- `mcp-server/src/tools/__tests__/pipeline.test.ts` — mock을 새 API(spawnWorkDag)에 맞게 업데이트

## 발생한 이슈

없음

## 다음 TASK를 위한 참고사항

TASK-01에서 spawn-pipeline.test.ts를 신규 인터페이스(spawnTaskIsolated, spawnWorkDag)에 맞게 업데이트하고 npm run build && npm test 통과를 확인한다.

## Context Handoff

### Builder Context (SUMMARY)

spawn-pipeline.ts에 Context Isolation 구현 완료. spawnTaskIsolated(workId, taskId)와 spawnWorkDag(workId) 함수 신설. JobStatus 인터페이스에 stage/attempt/gateResult 필드 추가. task.ts execute_task가 spawnTaskIsolated를 사용하도록 변경. pipeline.ts execute_work가 spawnWorkDag를 사용하도록 변경. 기존 spawnPipeline/spawnTask API는 하위 호환 유지.

### Verifier Context (FULL)

**what**: TASK-00 Context Isolation 핵심 구현 검증 완료. spawn-pipeline.ts: spawnTaskIsolated/spawnWorkDag 신설, JobStatus에 stage/attempt/gateResult 추가, 기존 API 유지. task.ts: execute_task가 spawnTaskIsolated 사용. pipeline.ts: execute_work가 spawnWorkDag 사용. 빌드 PASS, 타입 체크 PASS, 204 테스트 모두 PASS.

**why**: Context Isolation 구현으로 builder→verifier→committer가 각각 독립 claude -p 프로세스로 실행되어 컨텍스트 오염이 방지된다.

**caution**: pipeline.ts에서 spawnPipeline import가 제거됨 (미사용). spawn-pipeline.ts에서는 여전히 export됨. execute_task의 previous_context MCP 파라미터 선언은 유지되나 핸들러에서 사용하지 않음.

**incomplete**: (없음) — 모든 AC 충족
