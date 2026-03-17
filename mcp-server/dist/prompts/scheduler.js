import { z } from "zod";
import { readAgentPrompt, readRefDoc, mergeSections } from "./_helpers.js";
/**
 * scheduler 프롬프트를 서버에 등록한다.
 *
 * Arguments:
 *   - work_id: WORK ID (예: "WORK-31")
 *   - mode: "manual" | "auto" 실행 모드
 */
export function registerSchedulerPrompt(server) {
    server.prompt("scheduler", "DAG 기반 실행 순서 결정 에이전트 프롬프트. shared-prompt-sections.md + xml-schema.md 자동 병합.", {
        work_id: z.string().describe("실행할 WORK ID (예: WORK-31)"),
        mode: z
            .enum(["manual", "auto"])
            .describe("실행 모드: manual(단계별 확인) 또는 auto(자동 실행)"),
    }, async (args) => {
        // (1) 에이전트 프롬프트 본문
        const agentPrompt = await readAgentPrompt("scheduler");
        // (2) 관련 공유 섹션
        const sharedSections = await readRefDoc("shared-prompt-sections.md");
        const xmlSchema = await readRefDoc("xml-schema.md");
        // (3) 동적 컨텍스트
        const dynamicContext = buildSchedulerContext(args.work_id, args.mode);
        const content = mergeSections([
            { content: agentPrompt },
            { title: "공유 섹션 참조", content: sharedSections },
            { title: "XML 통신 스키마", content: xmlSchema },
            { title: "현재 실행 컨텍스트", content: dynamicContext },
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
/** scheduler 동적 컨텍스트 빌드 */
function buildSchedulerContext(workId, mode) {
    const lines = [];
    lines.push(`**WORK ID**: ${workId}`);
    lines.push(`**실행 모드**: ${mode} (${mode === "manual" ? "단계별 사용자 확인" : "자동 연속 실행"})`);
    return lines.join("\n");
}
//# sourceMappingURL=scheduler.js.map