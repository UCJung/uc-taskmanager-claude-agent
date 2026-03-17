# TASK-04 Result

> WORK: WORK-31 — MCP Server Phase 1 — Core MCP Server 구현
> Completed: 2026-03-18 01:27
> Status: **DONE**
> Commit: 92a3654

## Summary

6개 에이전트 프롬프트(router, planner, scheduler, builder, verifier, committer)를 MCP Prompts로 구현 및 등록 완료. prompts/ 8개 파일(index.ts + _helpers.ts + 6개 에이전트) 생성, server.ts 수정. tsc + vitest 74 tests 통과.

## Completed Checklist

- [x] registerPrompts(server) 함수가 6개 프롬프트를 등록
- [x] 각 프롬프트가 해당 에이전트 .md 파일 내용을 포함
- [x] 참조문서 자동 병합이 올바른 순서로 수행 (본문 -> 공유 섹션 -> 동적 컨텍스트)
- [x] 에이전트 .md 파일 미존재 시 에러 없이 fallback 처리
- [x] 각 프롬프트의 arguments가 설계문서 스펙과 일치
- [x] npx tsc --noEmit 통과
- [x] npx vitest run 통과 (74 passed)

## Verification Results

- Build: PASS
- Lint: PASS
- Tests: PASS (74 passed)

## Files Changed

### Created

- `mcp-server/src/prompts/index.ts` — registerPrompts(server) 통합 등록 래퍼. 6개 에이전트 프롬프트 함수 호출
- `mcp-server/src/prompts/_helpers.ts` — readAgentPrompt(), readRefDoc(), mergeSections() 공통 헬퍼. globalAgentsDir/agentConfigDir 투 로케이션 탐색 + graceful fallback
- `mcp-server/src/prompts/router.ts` — router 프롬프트. Arguments: { request, project_path }. 병합: agent.md + shared-prompt-sections.md + router_rule_config.json
- `mcp-server/src/prompts/planner.ts` — planner 프롬프트. Arguments: { project_description, tech_stack }. 병합: agent.md + shared-prompt-sections.md + file-content-schema.md
- `mcp-server/src/prompts/scheduler.ts` — scheduler 프롬프트. Arguments: { work_id, mode }. 병합: agent.md + shared-prompt-sections.md + xml-schema.md
- `mcp-server/src/prompts/builder.ts` — builder 프롬프트. Arguments: { task_spec, context_handoff }. 병합: agent.md + shared-prompt-sections.md + context-policy.md
- `mcp-server/src/prompts/verifier.ts` — verifier 프롬프트. Arguments: { task_id, verification_commands }. 병합: agent.md + shared-prompt-sections.md
- `mcp-server/src/prompts/committer.ts` — committer 프롬프트. Arguments: { task_result, work_progress }. 병합: agent.md + shared-prompt-sections.md + file-content-schema.md

### Modified

- `mcp-server/src/server.ts` — registerPrompts(server) 호출 추가. McpServer 인스턴스에 6개 프롬프트 등록

## Issues Encountered

None

## Notes for Subsequent Tasks

None

## Context Handoff

### Builder Context (SUMMARY)

prompts/ 8개 파일 생성. registerPrompts(server). tsc + vitest 통과.

### Verifier Context (FULL)

**What**: 6개 에이전트 프롬프트(router, planner, scheduler, builder, verifier, committer)를 MCP Prompts로 구현. 각 프롬프트는 에이전트 .md 파일을 읽고 관련 참조문서(shared-prompt-sections.md, file-content-schema.md, xml-schema.md, context-policy.md, router_rule_config.json)를 자동 병합하여 단일 프롬프트로 반환. registerPrompts(server)로 6개 프롬프트를 McpServer에 등록.

**Why**: 설계문서 §3.5 Prompts 설계에 따른 구현. 각 에이전트가 필요한 프롬프트를 MCP를 통해 사용 가능하도록 노출. 공유 섹션 자동 병합으로 정보 일관성 + 유지보수성 향상.

**Caution**: readRefDoc()는 globalAgentsDir와 agentConfigDir 두 위치를 탐색. router_rule_config.json은 .agent/ 디렉토리에 위치. fallback 처리로 파일 미존재 시 에러 없이 빈 문자열 반환.

**Incomplete**: 프롬프트 전용 단위 테스트 미작성. 현재 test-suite는 core/tools/resources만 포함. 향후 prompts/\_\_tests\_\_ 디렉토리 추가 필요.

