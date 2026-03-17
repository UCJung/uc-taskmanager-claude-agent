/**
 * committer 프롬프트
 * 결과 보고 + 커밋 에이전트 프롬프트.
 * shared-prompt-sections.md + file-content-schema.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * committer 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - task_result: TASK 결과 XML 또는 요약
 *   - work_progress: WORK 전체 진행 상황 (선택)
 */
export declare function registerCommitterPrompt(server: McpServer): void;
//# sourceMappingURL=committer.d.ts.map