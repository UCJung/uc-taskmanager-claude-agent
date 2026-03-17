/**
 * router 프롬프트
 * 요청 분석 + execution-mode 판정 프롬프트.
 * shared-prompt-sections.md + router_rule_config.json 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readAgentPrompt, readRefDoc, mergeSections } from "./_helpers.js";

/**
 * router 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - request: 분석할 요청 문자열
 *   - project_path: 프로젝트 경로 (선택)
 */
export function registerRouterPrompt(server: McpServer): void {
  server.prompt(
    "router",
    "요청 분석 + execution-mode 판정 에이전트 프롬프트. shared-prompt-sections.md + router_rule_config.json 자동 병합.",
    {
      request: z.string().describe("분석할 사용자 요청 문자열"),
      project_path: z.string().optional().describe("프로젝트 경로 (선택)"),
    },
    async (args) => {
      // (1) 에이전트 프롬프트 본문
      const agentPrompt = await readAgentPrompt("router");

      // (2) 관련 공유 섹션
      const sharedSections = await readRefDoc("shared-prompt-sections.md");
      const routerConfig = await readRefDoc("router_rule_config.json");

      // (3) 동적 컨텍스트
      const dynamicContext = buildRouterContext(args.request, args.project_path);

      const content = mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        {
          title: "Router 규칙 설정",
          content: routerConfig ? `\`\`\`json\n${routerConfig}\n\`\`\`` : "",
        },
        { title: "현재 요청 컨텍스트", content: dynamicContext },
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

/** router 동적 컨텍스트 빌드 */
function buildRouterContext(
  request: string,
  projectPath?: string
): string {
  const lines: string[] = [];
  lines.push(`**요청**: ${request}`);
  if (projectPath) {
    lines.push(`**프로젝트 경로**: ${projectPath}`);
  }
  return lines.join("\n");
}
