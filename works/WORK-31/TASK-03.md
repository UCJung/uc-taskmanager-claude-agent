# TASK-03: Resources 구현

## WORK
WORK-31: MCP Server Phase 1 — Core MCP Server 구현

## Dependencies
- TASK-01 (required)

## Scope
설계문서 §3.4 Resources 설계에 따라 MCP Resources를 구현한다. LLM이 참조할 수 있는 읽기 전용 데이터를 5개 URI 패턴으로 노출한다. WorkParser 코어 모듈을 활용하여 파일 시스템의 산출물을 MCP Resource로 변환한다.

구현 리소스 목록:
1. `work://list` — 전체 WORK 목록 (works/WORK-LIST.md 기반). MIME: text/markdown.
2. `work://{work_id}/plan` — 해당 WORK의 PLAN.md. MIME: text/markdown.
3. `work://{work_id}/progress` — PROGRESS.md (진행 상황). MIME: text/markdown.
4. `work://{work_id}/task/{task_id}` — TASK 명세 파일. MIME: text/markdown.
5. `work://{work_id}/task/{task_id}/result` — TASK 실행 결과 (TASK-XX_result.md). MIME: text/markdown.

각 리소스는 MCP SDK의 server.resource() API로 등록하며, URI 템플릿을 사용한다. registerResources(server) 통합 래퍼에서 모든 리소스를 일괄 등록한다.

설계문서 참조: docs/plan_MCP-Integration-Design.md §3.4(Resources 설계)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/src/resources/index.ts` | CREATE | registerResources(server) 통합 등록 래퍼 |
| `mcp-server/src/resources/work-list.ts` | CREATE | work://list 리소스 — WORK-LIST.md 기반 |
| `mcp-server/src/resources/plan.ts` | CREATE | work://{work_id}/plan 리소스 — PLAN.md |
| `mcp-server/src/resources/task-file.ts` | CREATE | work://{work_id}/task/{task_id} 리소스 — TASK 명세 |
| `mcp-server/src/resources/result.ts` | CREATE | work://{work_id}/task/{task_id}/result 리소스 — result.md |
| `mcp-server/src/server.ts` | MODIFY | registerResources 호출 추가 |

## Acceptance Criteria
- [ ] registerResources(server) 함수가 5개 리소스를 등록
- [ ] work://list가 WORK-LIST.md 내용을 text/markdown으로 반환
- [ ] work://{work_id}/plan이 해당 WORK의 PLAN.md를 반환
- [ ] work://{work_id}/progress가 해당 WORK의 PROGRESS.md를 반환
- [ ] work://{work_id}/task/{task_id}가 TASK-XX.md를 반환
- [ ] work://{work_id}/task/{task_id}/result가 TASK-XX_result.md를 반환
- [ ] 존재하지 않는 리소스 요청 시 적절한 에러 처리
- [ ] npx tsc --noEmit 통과
- [ ] npx vitest run 통과

## Verify
```bash
cd mcp-server && npx tsc --noEmit && npx vitest run
```
