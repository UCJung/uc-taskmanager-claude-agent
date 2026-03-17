/**
 * McpServer 인스턴스 생성 및 도구/리소스/프롬프트 등록 래퍼
 * Phase 1: Monitor Tools + Resources + Prompts 등록.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "./core/config.js";
import { registerMonitorTools } from "./tools/monitor.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

/**
 * McpServer 인스턴스를 생성하고 반환한다.
 * tools/resources/prompts 등록은 각 register* 함수에 위임한다.
 */
export function createServer(): McpServer {
  const config = getConfig();

  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  return server;
}

/**
 * 서버에 모든 도구/리소스/프롬프트를 등록한다.
 * Phase 1: Monitor Tools + Resources + Prompts 등록.
 * 이후 Phase에서 Pipeline/Task Tools 추가 예정.
 *
 * @param server McpServer 인스턴스
 */
export async function registerAll(server: McpServer): Promise<void> {
  // Phase 1: Monitor Tools 등록
  registerMonitorTools(server);

  // Phase 1: Resources 등록
  registerResources(server);

  // Phase 1: Prompts 등록 (6개 에이전트 프롬프트)
  registerPrompts(server);
}
