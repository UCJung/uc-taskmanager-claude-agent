/**
 * work://{work_id}/task/{task_id}/result 리소스 — TASK 실행 결과(TASK-XX_result.md)를 text/markdown으로 반환한다.
 */
import path from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";

/**
 * taskId 문자열에서 2자리 제로패딩 번호를 추출한다.
 * "TASK-01" → "01", "01" → "01", "1" → "01"
 */
function normalizeTaskNum(taskId: string): string {
  const match = taskId.match(/(\d+)$/);
  if (!match) throw new Error(`유효하지 않은 task_id: ${taskId}`);
  return String(parseInt(match[1], 10)).padStart(2, "0");
}

/**
 * work://{work_id}/task/{task_id}/result 리소스를 서버에 등록한다.
 */
export function registerTaskResultResource(server: McpServer): void {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const worksDir = config.worksDir;

  const template = new ResourceTemplate(
    "work://{work_id}/task/{task_id}/result",
    { list: undefined }
  );

  server.resource(
    "work-task-result",
    template,
    { mimeType: "text/markdown", description: "TASK 실행 결과 파일 (TASK-XX_result.md)" },
    async (uri, variables) => {
      const workId = String(variables["work_id"] ?? "");
      const taskId = String(variables["task_id"] ?? "");

      if (!workId) throw new Error("work_id가 필요합니다.");
      if (!taskId) throw new Error("task_id가 필요합니다.");

      let taskNum: string;
      try {
        taskNum = normalizeTaskNum(taskId);
      } catch {
        throw new Error(`잘못된 task_id 형식: ${taskId}`);
      }

      const filePath = path.join(worksDir, workId, `TASK-${taskNum}_result.md`);

      let content: string;
      try {
        content = await fm.readFile(filePath);
      } catch {
        throw new Error(
          `TASK 결과 파일을 찾을 수 없습니다: ${workId}/TASK-${taskNum}_result.md`
        );
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );
}
