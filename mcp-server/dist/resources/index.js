import { registerWorkListResource } from "./work-list.js";
import { registerPlanResource, registerProgressResource } from "./plan.js";
import { registerTaskFileResource } from "./task-file.js";
import { registerTaskResultResource } from "./result.js";
/**
 * 모든 MCP Resources를 서버에 등록한다.
 *
 * @param server McpServer 인스턴스
 */
export function registerResources(server) {
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
//# sourceMappingURL=index.js.map