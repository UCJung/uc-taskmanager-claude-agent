# TASK-00: spawn-pipeline Context Isolation 핵심 구현

## WORK
WORK-37: MCP 파이프라인 Context Isolation 구현

## Dependencies
- (none)

## Scope

spawn-pipeline.ts를 전면 개선하여 Context Isolation을 구현한다.

### REQ-1: Agent별 개별 spawn
execute_task에서 claude -p 3개를 순차 실행 (builder → verifier → committer), 각각 독립 컨텍스트.

기존: 하나의 claude -p로 builder+verifier+committer 전체 실행 → Context Isolation 깨짐
변경: spawnTaskIsolated(workId, taskId) 함수 신설 — builder spawn 완료 후 verifier spawn, 그 후 committer spawn

### REQ-2: 프롬프트 빌드 함수 내부 호출
mcp-server/src/prompts/의 기존 헬퍼 함수를 spawn-pipeline 내부에서 직접 호출하여 각 agent 프롬프트 구성 (MCP 프로토콜 경유 아님).

- `readAgentPrompt(agentName)` + `readRefDoc(fileName)` + `mergeSections([...])` 직접 import하여 사용
- builder 프롬프트: agentPrompt + sharedSections + contextPolicy + taskSpec
- verifier 프롬프트: agentPrompt + sharedSections + builderHandoff (progress.md에서 읽기)
- committer 프롬프트: agentPrompt + sharedSections + fileContentSchema + verifierHandoff

### REQ-3: 파일 기반 Context Handoff
builder가 TASK-XX_progress.md에 context-handoff XML 기록, verifier/committer가 파일에서 읽어서 참조. sliding window(FULL/SUMMARY/DROP) 적용.

progress.md 내 context-handoff 섹션:
```
## Context Handoff
### Builder Context (FULL)
- **what**: ...
- **why**: ...
- **caution**: ...
- **incomplete**: ...
```

builder 완료 후: progress.md에서 Builder Context 섹션 읽기 → verifier 프롬프트에 주입
verifier 완료 후: progress.md에서 Verifier Context 섹션 읽기 → committer 프롬프트에 주입

### REQ-4: Gate Check + Retry
committer 진입 전 progress.md gate check:
- 파일 존재 여부 확인
- `Status: COMPLETED` 포함 여부 확인
- `Files changed:` 섹션이 비어있지 않은지 확인

gate check 실패 시: builder 재시도 (max 3회)
재시도 시 attempt 카운터 증가

### REQ-5: Job 상태 세분화
기존 JobStatus에 필드 추가:
- `stage?: "builder" | "verifier" | "committer"` — 현재 실행 중인 agent
- `attempt?: number` — 현재 시도 횟수 (1부터 시작)
- `gateResult?: "pass" | "fail"` — gate check 결과

### REQ-6: execute_work DAG 자동 실행
spawnWorkDag(workId) 함수 신설:
- PLAN.md에서 DAG 파싱
- getReadyTasks() → spawnTaskIsolated() 순차 실행
- 완료된 TASK를 completedSet에 추가
- 모든 TASK 완료 시 job status = "completed"

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/core/spawn-pipeline.ts` | MODIFY | Context Isolation 전면 재구현 |
| `mcp-server/src/tools/task.ts` | MODIFY | execute_task가 spawnTaskIsolated 사용하도록 연동 |

## Acceptance Criteria
- [ ] spawnTaskIsolated 함수가 builder → verifier → committer를 3개의 독립 claude -p 프로세스로 순차 실행한다
- [ ] 각 agent 프롬프트는 prompts/_helpers.ts의 readAgentPrompt/readRefDoc/mergeSections를 직접 호출하여 구성된다
- [ ] builder 완료 후 progress.md에서 context-handoff를 읽어 verifier 프롬프트에 주입한다
- [ ] gate check 실패 시 builder를 최대 3회 재시도한다
- [ ] JobStatus에 stage, attempt, gateResult 필드가 추가된다
- [ ] spawnWorkDag 함수가 DAG 기반으로 전체 WORK를 자동 실행한다
- [ ] 기존 spawnPipeline, spawnTask API는 유지한다 (하위 호환)

## Verify
```bash
cd C:/rnd/agent/uc-taskmanager/mcp-server
npm run build
npm test
```
