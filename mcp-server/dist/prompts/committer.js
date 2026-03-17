import { z } from "zod";
import { readAgentPrompt, readRefDoc, mergeSections } from "./_helpers.js";
/**
 * committer 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - task_result: TASK 결과 XML 또는 요약
 *   - work_progress: WORK 전체 진행 상황 (선택)
 */
export function registerCommitterPrompt(server) {
    server.prompt("committer", "결과 보고 + 커밋 에이전트 프롬프트. shared-prompt-sections.md + file-content-schema.md 자동 병합.", {
        task_result: z
            .string()
            .describe("TASK 결과 XML 또는 요약 (task-result XML 권장)"),
        work_progress: z
            .string()
            .optional()
            .describe("WORK 전체 진행 상황 요약 (선택)"),
    }, async (args) => {
        // (1) 에이전트 프롬프트 본문
        const agentPrompt = await readAgentPrompt("committer");
        // (2) 관련 공유 섹션
        const sharedSections = await readRefDoc("shared-prompt-sections.md");
        const fileContentSchema = await readRefDoc("file-content-schema.md");
        // (3) 동적 컨텍스트
        const dynamicContext = buildCommitterContext(args.task_result, args.work_progress);
        const content = mergeSections([
            { content: agentPrompt },
            { title: "공유 섹션 참조", content: sharedSections },
            { title: "파일 콘텐츠 스키마", content: fileContentSchema },
            { title: "현재 TASK 결과 컨텍스트", content: dynamicContext },
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
    });
}
/** committer 동적 컨텍스트 빌드 */
function buildCommitterContext(taskResult, workProgress) {
    const lines = [];
    lines.push(`**TASK 결과**:\n${taskResult}`);
    if (workProgress) {
        lines.push(`\n**WORK 진행 상황**:\n${workProgress}`);
    }
    return lines.join("\n");
}
//# sourceMappingURL=committer.js.map