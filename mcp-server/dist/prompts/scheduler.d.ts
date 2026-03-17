/**
 * scheduler 프롬프트
 * DAG 기반 실행 순서 결정 에이전트 프롬프트.
 * shared-prompt-sections.md + xml-schema.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * scheduler 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - work_id: WORK ID (예: "WORK-31")
 *   - mode: "manual" | "auto" 실행 모드
 */
export declare function registerSchedulerPrompt(server: McpServer): void;
//# sourceMappingURL=scheduler.d.ts.map