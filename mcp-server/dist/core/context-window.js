/**
 * 슬라이딩 윈도우 컨텍스트 관리 모듈
 * 에이전트 간 / TASK 간 컨텍스트 전달 범위를 거리(distance) 기반으로 제어한다.
 */
/**
 * 에이전트 간 슬라이딩 윈도우를 적용한다 (builder→verifier→committer 내부).
 *
 * 규칙:
 * - distance 1: FULL
 * - distance 2: SUMMARY (what만)
 * - distance 3+: DROP (null → filter)
 *
 * @param results 모든 이전 컨텍스트 배열 (인덱스 0이 가장 오래된 것)
 * @param currentStep 현재 스텝 인덱스 (results.length와 동일하게 쓰임)
 * @returns 윈도우 적용된 컨텍스트 배열 (DROP된 항목은 제거됨)
 */
export function applyContextWindow(results, currentStep) {
    return results
        .map((handoff, index) => {
        const distance = currentStep - index;
        if (distance === 1) {
            // FULL: 모든 필드 유지
            return { ...handoff, detailLevel: "FULL" };
        }
        else if (distance === 2) {
            // SUMMARY: what만 유지
            return {
                from: handoff.from,
                detailLevel: "SUMMARY",
                what: handoff.what,
            };
        }
        else {
            // DROP
            return null;
        }
    })
        .filter((h) => h !== null);
}
/**
 * TASK 간 의존성 윈도우를 적용하여 포맷된 컨텍스트 문자열을 반환한다.
 *
 * 규칙:
 * - distance 1: FULL (what+why+caution+incomplete)
 * - distance 2: SUMMARY (what만)
 * - distance 3+: DROP → undefined
 *
 * @param currentTaskId 현재 처리 중인 TASK ID (로깅용)
 * @param dependencies 의존 TASK 목록 (distance 포함)
 * @returns 포맷된 컨텍스트 문자열, 모두 DROP이면 undefined
 */
export function applyTaskDependencyWindow(currentTaskId, dependencies) {
    const parts = [];
    for (const dep of dependencies) {
        const { distance, handoff } = dep;
        if (distance === 1) {
            // FULL
            parts.push(formatFullContext(handoff));
        }
        else if (distance === 2) {
            // SUMMARY: what만
            const lines = [
                `### ${handoff.taskId} (SUMMARY)`,
                `**Builder**: ${handoff.builderContext.what}`,
                `**Verifier**: ${handoff.verifierContext.what}`,
            ];
            parts.push(lines.join("\n"));
        }
        // distance 3+: DROP (아무것도 추가하지 않음)
    }
    if (parts.length === 0) {
        return undefined;
    }
    return `## Dependency Context (from ${currentTaskId})\n\n${parts.join("\n\n")}`;
}
/**
 * result.md 파일 내용에서 Context Handoff 섹션을 파싱한다.
 *
 * 파싱 대상:
 * ```
 * ## Context Handoff
 * ### Builder Context
 * - **what**: ...
 * - **why**: ...
 * - **caution**: ...
 * - **incomplete**: ...
 *
 * ### Verifier Context
 * - **what**: ...
 * ...
 * ```
 *
 * @param resultContent result.md 파일 전체 내용
 * @returns 파싱된 TaskResultContextHandoff, 실패 시 null
 */
export function extractContextHandoffFromResult(resultContent) {
    // ## Context Handoff 섹션 추출
    const handoffSectionMatch = resultContent.match(/##\s+Context Handoff\s*\n([\s\S]*?)(?=\n##\s+|\s*$)/);
    if (!handoffSectionMatch) {
        return null;
    }
    const handoffSection = handoffSectionMatch[1];
    // taskId 추출 (result.md 상단 # 제목에서)
    const taskIdMatch = resultContent.match(/^#.*?(TASK-\d+)/m);
    const taskId = taskIdMatch ? taskIdMatch[1] : "UNKNOWN";
    // Builder Context 파싱
    const builderMatch = handoffSection.match(/###\s+Builder Context\s*\n([\s\S]*?)(?=###\s+|\s*$)/);
    const builderContext = builderMatch
        ? parseHandoffBlock(builderMatch[1], "builder")
        : null;
    // Verifier Context 파싱
    const verifierMatch = handoffSection.match(/###\s+Verifier Context\s*\n([\s\S]*?)(?=###\s+|\s*$)/);
    const verifierContext = verifierMatch
        ? parseHandoffBlock(verifierMatch[1], "verifier")
        : null;
    if (!builderContext || !verifierContext) {
        return null;
    }
    return {
        taskId,
        builderContext,
        verifierContext,
    };
}
/**
 * 핸드오프 블록 텍스트에서 필드를 추출한다.
 *
 * @param block 블록 텍스트 (`- **what**: ...` 형식)
 * @param from 소스 에이전트 이름
 */
function parseHandoffBlock(block, from) {
    const whatMatch = block.match(/-\s+\*\*what\*\*:\s*(.+)/);
    if (!whatMatch) {
        return null;
    }
    const whyMatch = block.match(/-\s+\*\*why\*\*:\s*(.+)/);
    const cautionMatch = block.match(/-\s+\*\*caution\*\*:\s*(.+)/);
    const incompleteMatch = block.match(/-\s+\*\*incomplete\*\*:\s*(.+)/);
    const handoff = {
        from,
        detailLevel: "FULL",
        what: whatMatch[1].trim(),
    };
    if (whyMatch)
        handoff.why = whyMatch[1].trim();
    if (cautionMatch)
        handoff.caution = cautionMatch[1].trim();
    if (incompleteMatch)
        handoff.incomplete = incompleteMatch[1].trim();
    return handoff;
}
/**
 * TaskResultContextHandoff를 FULL 포맷 문자열로 변환한다.
 *
 * @param handoff 변환할 핸드오프 객체
 * @returns 마크다운 형식의 문자열
 */
export function formatFullContext(handoff) {
    const lines = [`### ${handoff.taskId} (FULL)`];
    // Builder Context
    lines.push("**Builder Context**");
    lines.push(`- **what**: ${handoff.builderContext.what}`);
    if (handoff.builderContext.why) {
        lines.push(`- **why**: ${handoff.builderContext.why}`);
    }
    if (handoff.builderContext.caution) {
        lines.push(`- **caution**: ${handoff.builderContext.caution}`);
    }
    if (handoff.builderContext.incomplete) {
        lines.push(`- **incomplete**: ${handoff.builderContext.incomplete}`);
    }
    lines.push("");
    // Verifier Context
    lines.push("**Verifier Context**");
    lines.push(`- **what**: ${handoff.verifierContext.what}`);
    if (handoff.verifierContext.why) {
        lines.push(`- **why**: ${handoff.verifierContext.why}`);
    }
    if (handoff.verifierContext.caution) {
        lines.push(`- **caution**: ${handoff.verifierContext.caution}`);
    }
    if (handoff.verifierContext.incomplete) {
        lines.push(`- **incomplete**: ${handoff.verifierContext.incomplete}`);
    }
    return lines.join("\n");
}
//# sourceMappingURL=context-window.js.map