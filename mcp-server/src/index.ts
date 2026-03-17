/**
 * uc-taskmanager MCP Server 엔트리포인트
 *
 * 환경변수 MCP_TRANSPORT 기반으로 transport를 선택한다.
 * - "stdio" (기본값): 로컬 Claude Desktop / Claude Code CLI 연동
 * - "http": Streamable HTTP transport (Phase 2 구현 예정)
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, registerAll } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  await registerAll(server);

  const mode = process.env.MCP_TRANSPORT ?? "stdio";

  if (mode === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stderr로 출력 (stdout은 MCP 프로토콜 전용)
    console.error("uc-taskmanager MCP Server running on stdio");
  } else if (mode === "http") {
    // Phase 2: Streamable HTTP transport 구현 예정
    // StreamableHTTPServerTransport 사용
    const port = process.env.MCP_PORT ?? "8080";
    console.error(
      `uc-taskmanager MCP Server HTTP mode — port ${port} (Phase 2 미구현)`
    );
    process.exit(1);
  } else {
    console.error(`알 수 없는 MCP_TRANSPORT 값: ${mode}. "stdio" 또는 "http"를 사용하세요.`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error("서버 기동 실패:", err);
  process.exit(1);
});
