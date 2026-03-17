/**
 * 에이전트 .md 파일을 읽는다.
 * globalAgentsDir → agentsDir 순서로 탐색하며, 미존재 시 fallback 문자열을 반환한다.
 *
 * @param agentName 에이전트 이름 (예: "router", "builder")
 * @returns 에이전트 프롬프트 내용 또는 fallback 문자열
 */
export declare function readAgentPrompt(agentName: string): Promise<string>;
/**
 * 참조문서를 읽는다.
 * globalAgentsDir에서 탐색하며, 미존재 시 빈 문자열을 반환한다.
 *
 * @param fileName 참조문서 파일명 (예: "shared-prompt-sections.md")
 * @returns 참조문서 내용 또는 빈 문자열
 */
export declare function readRefDoc(fileName: string): Promise<string>;
/**
 * 프롬프트 섹션들을 병합하여 단일 프롬프트 문자열로 반환한다.
 * 빈 섹션은 제외한다.
 *
 * @param sections 섹션 목록 (제목, 내용 쌍)
 * @returns 병합된 프롬프트 문자열
 */
export declare function mergeSections(sections: Array<{
    title?: string;
    content: string;
}>): string;
//# sourceMappingURL=_helpers.d.ts.map