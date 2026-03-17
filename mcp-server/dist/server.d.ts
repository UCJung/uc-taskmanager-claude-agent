/**
 * McpServer 인스턴스 생성 및 도구/리소스/프롬프트 등록 래퍼
 * Phase 1에서는 Monitor Tools만 등록한다.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * McpServer 인스턴스를 생성하고 반환한다.
 * tools/resources/prompts 등록은 각 register* 함수에 위임한다.
 */
export declare function createServer(): McpServer;
/**
 * 서버에 모든 도구/리소스/프롬프트를 등록한다.
 * Phase 1: Monitor Tools만 등록. 이후 Phase에서 Pipeline/Task Tools 추가.
 *
 * @param server McpServer 인스턴스
 */
export declare function registerAll(server: McpServer): Promise<void>;
//# sourceMappingURL=server.d.ts.map