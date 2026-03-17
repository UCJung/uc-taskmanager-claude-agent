# TASK-04: Prompts 구현

## WORK
WORK-31: MCP Server Phase 1 — Core MCP Server 구현

## Dependencies
- TASK-01 (required)

## Scope
설계문서 §3.5 Prompts 설계에 따라 6개 에이전트 프롬프트를 MCP Prompts로 노출한다. 각 프롬프트는 `~/.claude/agents/{agent}.md` 파일을 읽고, 관련 참조문서를 자동 병합하여 단일 프롬프트로 반환한다.

구현 프롬프트 목록:
1. `router` — 요청 분석 + execution-mode 판정. Arguments: `{ request: string, project_path?: string }`. 병합: shared-prompt-sections.md, router_rule_config.json
2. `planner` — 프로젝트 분석 + TASK 분해. Arguments: `{ project_description: string, tech_stack?: string }`. 병합: shared-prompt-sections.md, file-content-schema.md
3. `scheduler` — DAG 기반 실행 순서 결정. Arguments: `{ work_id: string, mode: "manual" | "auto" }`. 병합: shared-prompt-sections.md, xml-schema.md
4. `builder` — 코드 구현. Arguments: `{ task_spec: string, context_handoff?: string }`. 병합: shared-prompt-sections.md, context-policy.md
5. `verifier` — 빌드/린트/테스트 검증. Arguments: `{ task_id: string, verification_commands?: string }`. 병합: shared-prompt-sections.md
6. `committer` — 결과 보고 + 커밋. Arguments: `{ task_result: string, work_progress?: string }`. 병합: shared-prompt-sections.md, file-content-schema.md

병합 순서: (1) 에이전트 프롬프트 본문 (2) 관련 공유 섹션 (3) 동적 컨텍스트(arguments).
FileManager를 사용하여 에이전트 .md 파일과 참조문서를 읽는다. 파일이 존재하지 않는 경우 graceful fallback 처리.

설계문서 참조: docs/plan_MCP-Integration-Design.md §3.5(Prompts 설계)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/prompts/index.ts` | CREATE | registerPrompts(server) 통합 등록 래퍼 |
| `mcp-server/src/prompts/router.ts` | CREATE | router 프롬프트 — shared-prompt-sections.md + router_rule_config.json 병합 |
| `mcp-server/src/prompts/planner.ts` | CREATE | planner 프롬프트 — shared-prompt-sections.md + file-content-schema.md 병합 |
| `mcp-server/src/prompts/scheduler.ts` | CREATE | scheduler 프롬프트 — shared-prompt-sections.md + xml-schema.md 병합 |
| `mcp-server/src/prompts/builder.ts` | CREATE | builder 프롬프트 — shared-prompt-sections.md + context-policy.md 병합 |
| `mcp-server/src/prompts/verifier.ts` | CREATE | verifier 프롬프트 — shared-prompt-sections.md 병합 |
| `mcp-server/src/prompts/committer.ts` | CREATE | committer 프롬프트 — shared-prompt-sections.md + file-content-schema.md 병합 |
| `mcp-server/src/server.ts` | MODIFY | registerPrompts 호출 추가 |

## Acceptance Criteria
- [ ] registerPrompts(server) 함수가 6개 프롬프트를 등록
- [ ] 각 프롬프트가 해당 에이전트 .md 파일 내용을 포함
- [ ] 참조문서 자동 병합이 올바른 순서로 수행 (본문 -> 공유 섹션 -> 동적 컨텍스트)
- [ ] 에이전트 .md 파일 미존재 시 에러 없이 fallback 처리
- [ ] 각 프롬프트의 arguments가 설계문서 스펙과 일치
- [ ] npx tsc --noEmit 통과
- [ ] npx vitest run 통과

## Verify
```bash
cd mcp-server && npx tsc --noEmit && npx vitest run
```
