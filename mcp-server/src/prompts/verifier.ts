/**
 * verifier 프롬프트
 * 빌드/린트/테스트 검증 에이전트 프롬프트.
 * shared-prompt-sections.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readAgentPrompt, readRefDoc, mergeSections } from "./_helpers.js";

/**
 * verifier 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - task_id: 검증할 TASK ID (예: "TASK-04")
 *   - verification_commands: 검증 명령어 (선택)
 */
export function registerVerifierPrompt(server: McpServer): void {
  server.prompt(
    "verifier",
    "빌드/린트/테스트 검증 에이전트 프롬프트. shared-prompt-sections.md 자동 병합.",
    {
      task_id: z.string().describe("검증할 TASK ID (예: TASK-04)"),
      verification_commands: z
        .string()
        .optional()
        .describe("검증에 사용할 명령어 (선택, 줄바꿈 구분)"),
    },
    async (args) => {
      // (1) 에이전트 프롬프트 본문
      const agentPrompt = await readAgentPrompt("verifier");

      // (2) 관련 공유 섹션
      const sharedSections = await readRefDoc("shared-prompt-sections.md");

      // (3) 동적 컨텍스트
      const dynamicContext = buildVerifierContext(
        args.task_id,
        args.verification_commands
      );

      const content = mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        { title: "검증 대상 컨텍스트", content: dynamicContext },
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

/** verifier 동적 컨텍스트 빌드 */
function buildVerifierContext(
  taskId: string,
  verificationCommands?: string
): string {
  const lines: string[] = [];
  lines.push(`**검증 대상 TASK**: ${taskId}`);
  if (verificationCommands) {
    lines.push(`\n**검증 명령어**:\n\`\`\`bash\n${verificationCommands}\n\`\`\``);
  }
  return lines.join("\n");
}
