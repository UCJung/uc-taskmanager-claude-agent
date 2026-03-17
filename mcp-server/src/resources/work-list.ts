/**
 * work://list 리소스 — WORK-LIST.md 전체 내용을 text/markdown으로 반환한다.
 */
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";

/**
 * work://list 리소스를 서버에 등록한다.
 * WORK-LIST.md 파일 내용을 그대로 반환한다.
 */
export function registerWorkListResource(server: McpServer): void {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const worksDir = config.worksDir;

  server.resource(
    "work-list",
    "work://list",
    { mimeType: "text/markdown", description: "전체 WORK 목록 (WORK-LIST.md)" },
    async (_uri) => {
      const listMdPath = path.join(worksDir, "WORK-LIST.md");

      let content: string;
      try {
        content = await fm.readFile(listMdPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`WORK-LIST.md를 읽을 수 없습니다: ${message}`);
      }

      return {
        contents: [
          {
            uri: "work://list",
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );
}
