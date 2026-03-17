/**
 * planner 프롬프트
 * 프로젝트 분석 + TASK 분해 에이전트 프롬프트.
 * shared-prompt-sections.md + file-content-schema.md 자동 병합.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readAgentPrompt, readRefDoc, mergeSections } from "./_helpers.js";

/**
 * planner 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - project_description: 프로젝트/요구사항 설명
 *   - tech_stack: 기술 스택 (선택)
 */
export function registerPlannerPrompt(server: McpServer): void {
  server.prompt(
    "planner",
    "프로젝트 분석 + TASK 분해 에이전트 프롬프트. shared-prompt-sections.md + file-content-schema.md 자동 병합.",
    {
      project_description: z
        .string()
        .describe("구현할 기능 또는 프로젝트 요구사항 설명"),
      tech_stack: z.string().optional().describe("기술 스택 정보 (선택)"),
    },
    async (args) => {
      // (1) 에이전트 프롬프트 본문
      const agentPrompt = await readAgentPrompt("planner");

      // (2) 관련 공유 섹션
      const sharedSections = await readRefDoc("shared-prompt-sections.md");
      const fileContentSchema = await readRefDoc("file-content-schema.md");

      // (3) 동적 컨텍스트
      const dynamicContext = buildPlannerContext(
        args.project_description,
        args.tech_stack
      );

      const content = mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        { title: "파일 콘텐츠 스키마", content: fileContentSchema },
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

/** planner 동적 컨텍스트 빌드 */
function buildPlannerContext(
  projectDescription: string,
  techStack?: string
): string {
  const lines: string[] = [];
  lines.push(`**프로젝트/요구사항 설명**:\n${projectDescription}`);
  if (techStack) {
    lines.push(`\n**기술 스택**: ${techStack}`);
  }
  return lines.join("\n");
}
