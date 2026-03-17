/**
 * Prompts 통합 등록 래퍼
 * 6개 에이전트 프롬프트를 MCP Prompts로 등록한다.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * 6개 에이전트 프롬프트를 서버에 등록한다.
 * 병합 순서: (1) 에이전트 프롬프트 본문 (2) 관련 공유 섹션 (3) 동적 컨텍스트
 *
 * @param server McpServer 인스턴스
 */
export declare function registerPrompts(server: McpServer): void;
//# sourceMappingURL=index.d.ts.map