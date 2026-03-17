/**
 * work://{work_id}/task/{task_id} 리소스 — TASK 명세 파일(TASK-XX.md)을 text/markdown으로 반환한다.
 */
import path from "node:path";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";
/**
 * taskId 문자열에서 2자리 제로패딩 번호를 추출한다.
 * "TASK-01" → "01", "01" → "01", "1" → "01"
 */
function normalizeTaskNum(taskId) {
    const match = taskId.match(/(\d+)$/);
    if (!match)
        throw new Error(`유효하지 않은 task_id: ${taskId}`);
    return String(parseInt(match[1], 10)).padStart(2, "0");
}
/**
 * work://{work_id}/task/{task_id} 리소스를 서버에 등록한다.
 */
export function registerTaskFileResource(server) {
    const config = getConfig();
    const fm = new FileManager(config.projectRoot);
    const worksDir = config.worksDir;
    const template = new ResourceTemplate("work://{work_id}/task/{task_id}", {
        list: undefined,
    });
    server.resource("work-task-file", template, { mimeType: "text/markdown", description: "TASK 명세 파일 (TASK-XX.md)" }, async (uri, variables) => {
        const workId = String(variables["work_id"] ?? "");
        const taskId = String(variables["task_id"] ?? "");
        if (!workId)
            throw new Error("work_id가 필요합니다.");
        if (!taskId)
            throw new Error("task_id가 필요합니다.");
        let taskNum;
        try {
            taskNum = normalizeTaskNum(taskId);
        }
        catch (err) {
            throw new Error(`잘못된 task_id 형식: ${taskId}`);
        }
        const filePath = path.join(worksDir, workId, `TASK-${taskNum}.md`);
        let content;
        try {
            content = await fm.readFile(filePath);
        }
        catch {
            throw new Error(`TASK 명세 파일을 찾을 수 없습니다: ${workId}/TASK-${taskNum}.md`);
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
    });
}
//# sourceMappingURL=task-file.js.map