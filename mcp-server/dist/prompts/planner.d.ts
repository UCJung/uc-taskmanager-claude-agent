/**
 * planner 프롬프트
 * 프로젝트 분석 + TASK 분해 에이전트 프롬프트.
 * shared-prompt-sections.md + file-content-schema.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * planner 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - project_description: 프로젝트/요구사항 설명
 *   - tech_stack: 기술 스택 (선택)
 */
export declare function registerPlannerPrompt(server: McpServer): void;
//# sourceMappingURL=planner.d.ts.map