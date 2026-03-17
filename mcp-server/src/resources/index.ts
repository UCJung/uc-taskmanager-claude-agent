/**
 * MCP Resources 통합 등록 래퍼
 * 5개 URI 패턴 리소스를 McpServer에 일괄 등록한다.
 *
 * 등록 리소스:
 * 1. work://list — WORK-LIST.md 전체 목록
 * 2. work://{work_id}/plan — PLAN.md
 * 3. work://{work_id}/progress — PROGRESS.md
 * 4. work://{work_id}/task/{task_id} — TASK 명세 파일
 * 5. work://{work_id}/task/{task_id}/result — TASK 결과 파일
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWorkListResource } from "./work-list.js";
import { registerPlanResource, registerProgressResource } from "./plan.js";
import { registerTaskFileResource } from "./task-file.js";
import { registerTaskResultResource } from "./result.js";

/**
 * 모든 MCP Resources를 서버에 등록한다.
 *
 * @param server McpServer 인스턴스
 */
export function registerResources(server: McpServer): void {
  // 1. work://list
  registerWorkListResource(server);

  // 2. work://{work_id}/plan
  registerPlanResource(server);

  // 3. work://{work_id}/progress
  registerProgressResource(server);

  // 4. work://{work_id}/task/{task_id}
  registerTaskFileResource(server);

  // 5. work://{work_id}/task/{task_id}/result
  registerTaskResultResource(server);
}
