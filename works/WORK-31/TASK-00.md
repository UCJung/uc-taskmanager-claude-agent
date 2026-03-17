# TASK-00: 프로젝트 초기화 및 서버 뼈대

## WORK
WORK-31: MCP Server Phase 1 — Core MCP Server 구현

## Dependencies
- (none)

## Scope
mcp-server/ 디렉토리를 신규 생성하고, MCP SDK 기반 TypeScript 프로젝트를 초기화한다. package.json에 핵심 의존성(@modelcontextprotocol/sdk, zod)과 개발 의존성(typescript, vitest)을 정의한다. tsconfig.json은 ES2022 + Node16 모듈 해상도로 설정한다. stdio transport 기반 엔트리포인트(index.ts), McpServer 인스턴스 생성 래퍼(server.ts), 설정 관리 모듈(config.ts)을 구현한다.

설계문서 참조: docs/plan_MCP-Integration-Design.md §3.1(기술 스택), §3.2(프로젝트 구조), §4.1(서버 엔트리포인트)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `mcp-server/package.json` | CREATE | 프로젝트 메타정보, dependencies(@modelcontextprotocol/sdk ^1.2+, zod), devDependencies(typescript, vitest) |
| `mcp-server/tsconfig.json` | CREATE | TypeScript 설정 — target: ES2022, module: Node16, strict: true, outDir: dist |
| `mcp-server/src/index.ts` | CREATE | 엔트리포인트 — 환경변수 MCP_TRANSPORT 기반 stdio/HTTP 선택, stdio 기본 |
| `mcp-server/src/server.ts` | CREATE | createServer() — McpServer 인스턴스 생성, tools/resources/prompts 등록 래퍼 호출 (Phase 1에서는 monitor만 등록) |
| `mcp-server/src/core/config.ts` | CREATE | 설정 관리 — projectRoot, worksDir, agentsDir 경로 해석 |

## Acceptance Criteria
- [ ] mcp-server/ 디렉토리 및 하위 구조 생성 완료
- [ ] npm install 성공 (의존성 설치)
- [ ] npx tsc --noEmit 통과 (타입 체크)
- [ ] src/index.ts에서 McpServer 인스턴스 생성 후 stdio transport 연결 코드 존재
- [ ] src/core/config.ts가 projectRoot, worksDir 경로를 올바르게 해석

## Verify
```bash
cd mcp-server && npm install && npx tsc --noEmit
```
