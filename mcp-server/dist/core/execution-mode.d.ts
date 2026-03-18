export interface ModeDecision {
    mode: "direct" | "pipeline" | "full";
    reason: string;
}
export interface RequestAnalysis {
    buildTestRequired: boolean;
    singleDomain: boolean;
    dagComplexity: "sequential" | "complex";
    taskCount: number;
    fullReason: string;
}
export interface RouterRuleConfig {
    rules?: {
        direct?: {
            criteria?: {
                build_test_required?: boolean;
            };
        };
        pipeline?: {
            criteria?: {
                max_tasks?: number;
                single_domain_only?: boolean;
                dag_complexity?: string;
            };
        };
        full?: {
            criteria?: {
                any_of?: string[];
            };
        };
    };
}
/**
 * `.agent/router_rule_config.json`을 로드한다.
 * 파일이 없거나 파싱에 실패하면 null을 반환한다.
 */
export declare function loadRouterConfig(configPath: string): Promise<RouterRuleConfig | null>;
/**
 * 요청 문자열을 분석하여 RequestAnalysis를 반환한다.
 * 키워드 기반 휴리스틱으로 빌드 필요 여부, 도메인 복잡도 등을 판정한다.
 */
export declare function analyzeRequest(description: string): RequestAnalysis;
/**
 * 설계문서 §3.6 판정 흐름에 따라 Execution-Mode를 결정한다.
 *
 * 판정 순서:
 * 1. buildTestRequired === false → direct
 * 2. singleDomain + sequential + taskCount <= max_tasks → pipeline
 * 3. 그 외 → full
 */
export declare function determineExecutionMode(description: string, projectPath: string, configPath?: string): Promise<ModeDecision>;
//# sourceMappingURL=execution-mode.d.ts.map