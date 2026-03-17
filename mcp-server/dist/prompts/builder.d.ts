/**
 * builder 프롬프트
 * 코드 구현 에이전트 프롬프트.
 * shared-prompt-sections.md + context-policy.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * builder 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - task_spec: 구현할 TASK 명세 (TASK-XX.md 내용 또는 요약)
 *   - context_handoff: 이전 에이전트 context-handoff (선택)
 */
export declare function registerBuilderPrompt(server: McpServer): void;
//# sourceMappingURL=builder.d.ts.map