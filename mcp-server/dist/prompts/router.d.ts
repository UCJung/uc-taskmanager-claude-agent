/**
 * router 프롬프트
 * 요청 분석 + execution-mode 판정 프롬프트.
 * shared-prompt-sections.md + router_rule_config.json 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * router 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - request: 분석할 요청 문자열
 *   - project_path: 프로젝트 경로 (선택)
 */
export declare function registerRouterPrompt(server: McpServer): void;
//# sourceMappingURL=router.d.ts.map