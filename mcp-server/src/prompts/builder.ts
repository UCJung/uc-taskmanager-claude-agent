/**
 * builder 프롬프트
 * 코드 구현 에이전트 프롬프트.
 * shared-prompt-sections.md + context-policy.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readAgentPrompt, readRefDoc, mergeSections } from "./_helpers.js";

/**
 * builder 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - task_spec: 구현할 TASK 명세 (TASK-XX.md 내용 또는 요약)
 *   - context_handoff: 이전 에이전트 context-handoff (선택)
 */
export function registerBuilderPrompt(server: McpServer): void {
  server.prompt(
    "builder",
    "코드 구현 에이전트 프롬프트. shared-prompt-sections.md + context-policy.md 자동 병합.",
    {
      task_spec: z
        .string()
        .describe("구현할 TASK 명세 (TASK-XX.md 내용 또는 요약)"),
      context_handoff: z
        .string()
        .optional()
        .describe("이전 에이전트 context-handoff XML (선택)"),
    },
    async (args) => {
      // (1) 에이전트 프롬프트 본문
      const agentPrompt = await readAgentPrompt("builder");

      // (2) 관련 공유 섹션
      const sharedSections = await readRefDoc("shared-prompt-sections.md");
      const contextPolicy = await readRefDoc("context-policy.md");

      // (3) 동적 컨텍스트
      const dynamicContext = buildBuilderContext(
        args.task_spec,
        args.context_handoff
      );

      const content = mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        { title: "컨텍스트 정책", content: contextPolicy },
        { title: "현재 TASK 컨텍스트", content: dynamicContext },
      ]);

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: content,
            },
          },
        ],
      };
    }
  );
}

/** builder 동적 컨텍스트 빌드 */
function buildBuilderContext(
  taskSpec: string,
  contextHandoff?: string
): string {
  const lines: string[] = [];
  lines.push(`**TASK 명세**:\n${taskSpec}`);
  if (contextHandoff) {
    lines.push(`\n**이전 에이전트 Context-Handoff**:\n${contextHandoff}`);
  }
  return lines.join("\n");
}
