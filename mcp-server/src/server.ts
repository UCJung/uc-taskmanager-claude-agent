/**
 * McpServer 인스턴스 생성 및 도구/리소스/프롬프트 등록 래퍼
 * Phase 1에서는 Monitor Tools만 등록한다.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getConfig } from "./core/config.js";

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
 * Phase 1: Monitor Tools만 등록. 이후 Phase에서 Pipeline/Task Tools 추가.
 *
 * @param server McpServer 인스턴스
 */
export async function registerAll(server: McpServer): Promise<void> {
  // Phase 1: Monitor Tools 등록
  // registerMonitorTools는 TASK-02에서 구현
  // registerResources는 TASK-03에서 구현
  // registerPrompts는 TASK-04에서 구현

  // 임시 placeholder — 이후 TASK에서 실제 구현으로 교체됨
  _registerPlaceholderTool(server);
}

/**
 * Phase 1 서버 기동 확인용 placeholder tool.
 * TASK-02 구현 완료 후 제거된다.
 */
function _registerPlaceholderTool(server: McpServer): void {
  server.tool(
    "ping",
    "서버 동작 확인용 ping 도구 (Phase 1 임시)",
    {},
    async () => {
      const config = getConfig();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "ok",
                server: config.serverName,
                version: config.serverVersion,
                projectRoot: config.projectRoot,
                worksDir: config.worksDir,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
