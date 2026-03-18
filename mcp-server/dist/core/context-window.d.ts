/**
 * 슬라이딩 윈도우 컨텍스트 관리 모듈
 * 에이전트 간 / TASK 간 컨텍스트 전달 범위를 거리(distance) 기반으로 제어한다.
 */
/** 컨텍스트 상세 수준 */
export type DetailLevel = "FULL" | "SUMMARY" | "DROP";
/** 에이전트 간 컨텍스트 핸드오프 */
export interface ContextHandoff {
    from: string;
    detailLevel: DetailLevel;
    what: string;
    why?: string;
    caution?: string;
    incomplete?: string;
}
/** TASK 결과 컨텍스트 핸드오프 (builder + verifier) */
export interface TaskResultContextHandoff {
    taskId: string;
    builderContext: ContextHandoff;
    verifierContext: ContextHandoff;
}
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
export declare function applyContextWindow(results: ContextHandoff[], currentStep: number): ContextHandoff[];
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
export declare function applyTaskDependencyWindow(currentTaskId: string, dependencies: Array<{
    taskId: string;
    distance: number;
    handoff: TaskResultContextHandoff;
}>): string | undefined;
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
export declare function extractContextHandoffFromResult(resultContent: string): TaskResultContextHandoff | null;
/**
 * TaskResultContextHandoff를 FULL 포맷 문자열로 변환한다.
 *
 * @param handoff 변환할 핸드오프 객체
 * @returns 마크다운 형식의 문자열
 */
export declare function formatFullContext(handoff: TaskResultContextHandoff): string;
//# sourceMappingURL=context-window.d.ts.map