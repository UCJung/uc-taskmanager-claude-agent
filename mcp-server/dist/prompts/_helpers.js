/**
 * Prompts 공통 헬퍼 모듈
 * 에이전트 .md 파일과 참조문서를 읽어 병합하는 유틸리티를 제공한다.
 */
import path from "node:path";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";
/**
 * 에이전트 .md 파일을 읽는다.
 * globalAgentsDir → agentsDir 순서로 탐색하며, 미존재 시 fallback 문자열을 반환한다.
 *
 * @param agentName 에이전트 이름 (예: "router", "builder")
 * @returns 에이전트 프롬프트 내용 또는 fallback 문자열
 */
export async function readAgentPrompt(agentName) {
    const config = getConfig();
    const fm = new FileManager();
    // 전역 에이전트 디렉토리 우선 탐색
    const globalPath = path.join(config.globalAgentsDir, `${agentName}.md`);
    if (await fm.exists(globalPath)) {
        try {
            return await fm.readFile(globalPath);
        }
        catch {
            // 읽기 실패 시 로컬 탐색으로 fallback
        }
    }
    // 로컬 에이전트 디렉토리 탐색
    const localPath = path.join(config.agentsDir, `${agentName}.md`);
    if (await fm.exists(localPath)) {
        try {
            return await fm.readFile(localPath);
        }
        catch {
            // 읽기 실패 시 fallback
        }
    }
    // 파일 미존재 시 graceful fallback
    return `# ${agentName} Agent\n\n(에이전트 프롬프트 파일을 찾을 수 없습니다: ${agentName}.md)\n`;
}
/**
 * 참조문서를 읽는다.
 * globalAgentsDir에서 탐색하며, 미존재 시 빈 문자열을 반환한다.
 *
 * @param fileName 참조문서 파일명 (예: "shared-prompt-sections.md")
 * @returns 참조문서 내용 또는 빈 문자열
 */
export async function readRefDoc(fileName) {
    const config = getConfig();
    const fm = new FileManager();
    const globalPath = path.join(config.globalAgentsDir, fileName);
    if (await fm.exists(globalPath)) {
        try {
            return await fm.readFile(globalPath);
        }
        catch {
            return "";
        }
    }
    // .agent/ 디렉토리에서 JSON 설정 파일 탐색 (예: router_rule_config.json)
    const configPath = path.join(config.agentConfigDir, fileName);
    if (await fm.exists(configPath)) {
        try {
            return await fm.readFile(configPath);
        }
        catch {
            return "";
        }
    }
    return "";
}
/**
 * 프롬프트 섹션들을 병합하여 단일 프롬프트 문자열로 반환한다.
 * 빈 섹션은 제외한다.
 *
 * @param sections 섹션 목록 (제목, 내용 쌍)
 * @returns 병합된 프롬프트 문자열
 */
export function mergeSections(sections) {
    const parts = [];
    for (const section of sections) {
        const trimmed = section.content.trim();
        if (!trimmed)
            continue;
        if (section.title) {
            parts.push(`\n\n---\n\n## ${section.title}\n\n${trimmed}`);
        }
        else {
            parts.push(trimmed);
        }
    }
    return parts.join("\n").trim();
}
//# sourceMappingURL=_helpers.js.map