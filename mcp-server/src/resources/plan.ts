/**
 * work://{work_id}/plan 리소스 — 해당 WORK의 PLAN.md를 text/markdown으로 반환한다.
 * work://{work_id}/progress 리소스 — 해당 WORK의 PROGRESS.md를 text/markdown으로 반환한다.
 */
import path from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";

/**
 * work://{work_id}/plan 리소스를 서버에 등록한다.
 */
export function registerPlanResource(server: McpServer): void {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const worksDir = config.worksDir;

  const template = new ResourceTemplate("work://{work_id}/plan", {
    list: undefined,
  });

  server.resource(
    "work-plan",
    template,
    { mimeType: "text/markdown", description: "WORK의 PLAN.md 내용" },
    async (uri, variables) => {
      const workId = String(variables["work_id"] ?? "");
      if (!workId) {
        throw new Error("work_id가 필요합니다.");
      }

      const planPath = path.join(worksDir, workId, "PLAN.md");

      let content: string;
      try {
        content = await fm.readFile(planPath);
      } catch {
        throw new Error(`PLAN.md를 찾을 수 없습니다: ${workId}`);
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

/**
 * work://{work_id}/progress 리소스를 서버에 등록한다.
 */
export function registerProgressResource(server: McpServer): void {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const worksDir = config.worksDir;

  const template = new ResourceTemplate("work://{work_id}/progress", {
    list: undefined,
  });

  server.resource(
    "work-progress",
    template,
    { mimeType: "text/markdown", description: "WORK의 PROGRESS.md 진행 상황" },
    async (uri, variables) => {
      const workId = String(variables["work_id"] ?? "");
      if (!workId) {
        throw new Error("work_id가 필요합니다.");
      }

      const progressPath = path.join(worksDir, workId, "PROGRESS.md");

      let content: string;
      try {
        content = await fm.readFile(progressPath);
      } catch {
        throw new Error(`PROGRESS.md를 찾을 수 없습니다: ${workId}`);
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
