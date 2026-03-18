/**
 * Execution-Mode 판정 엔진
 * 설계문서 §3.6 기준으로 요청을 분석하여 direct/pipeline/full 모드를 결정한다.
 */
import path from "node:path";
import { FileManager } from "./file-manager.js";
import { getConfig } from "./config.js";
// ---------------------------------------------------------------------------
// 키워드 목록
// ---------------------------------------------------------------------------
/** 빌드/테스트 검증이 필요한 코드 변경 키워드 */
const BUILD_REQUIRED_KEYWORDS = [
    "implement",
    "build",
    "create",
    "refactor",
    "구현",
    "빌드",
    "생성",
    "리팩터",
    "리팩토링",
    "개발",
    "코딩",
    "add feature",
    "new feature",
    "기능 추가",
    "신규 기능",
    "migrate",
    "마이그레이션",
    "upgrade",
    "업그레이드",
    "fix bug",
    "버그 수정",
    "debug",
    "디버그",
    "test",
    "테스트",
    "module",
    "모듈",
    "api",
    "endpoint",
    "엔드포인트",
    "component",
    "컴포넌트",
];
/** 빌드/테스트가 불필요한 문서/설정 변경 키워드 */
const NO_BUILD_KEYWORDS = [
    "document",
    "documentation",
    "문서",
    "readme",
    "changelog",
    "comment",
    "주석",
    "typo",
    "오타",
    "rename",
    "이름 변경",
    "config",
    "설정",
    "configuration",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".env",
    "update docs",
    "문서 업데이트",
    "문서 수정",
    "문서 작성",
];
/** 다중 도메인 키워드 (FE + BE 동시 변경 등) */
const MULTI_DOMAIN_KEYWORDS = [
    "frontend and backend",
    "frontend & backend",
    "fe and be",
    "fe & be",
    "fe+be",
    "frontend+backend",
    "프론트엔드와 백엔드",
    "프론트와 백",
    "fe와 be",
    "multi domain",
    "multi-domain",
    "멀티도메인",
    "전체 스택",
    "full stack",
    "fullstack",
    "풀스택",
];
/** 복잡한 DAG 의존성 키워드 */
const COMPLEX_DAG_KEYWORDS = [
    "depends on multiple",
    "complex dependency",
    "복잡한 의존성",
    "다중 의존성",
    "parallel tasks",
    "병렬 작업",
    "multi-phase",
    "다단계",
    "multi phase",
    "여러 단계",
    "rollback",
    "롤백",
];
// ---------------------------------------------------------------------------
// loadRouterConfig
// ---------------------------------------------------------------------------
/**
 * `.agent/router_rule_config.json`을 로드한다.
 * 파일이 없거나 파싱에 실패하면 null을 반환한다.
 */
export async function loadRouterConfig(configPath) {
    const fm = new FileManager();
    const exists = await fm.exists(configPath);
    if (!exists) {
        return null;
    }
    try {
        const content = await fm.readFile(configPath);
        const parsed = JSON.parse(content);
        return parsed;
    }
    catch {
        return null;
    }
}
// ---------------------------------------------------------------------------
// analyzeRequest
// ---------------------------------------------------------------------------
/**
 * 요청 문자열을 분석하여 RequestAnalysis를 반환한다.
 * 키워드 기반 휴리스틱으로 빌드 필요 여부, 도메인 복잡도 등을 판정한다.
 */
export function analyzeRequest(description) {
    const lower = description.toLowerCase();
    // buildTestRequired 판정
    // 노-빌드 키워드가 먼저 매칭되면 false, 이후 빌드 키워드 매칭 시 true
    const hasNoBuildKeyword = NO_BUILD_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    const hasBuildKeyword = BUILD_REQUIRED_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    // 노-빌드 키워드만 있으면 false, 빌드 키워드가 있으면 true
    const buildTestRequired = hasBuildKeyword && !hasNoBuildKeyword;
    // singleDomain 판정 (다중 도메인 키워드가 없으면 단일 도메인)
    const hasMultiDomain = MULTI_DOMAIN_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    const singleDomain = !hasMultiDomain;
    // taskCount 추정: 빌드 관련 키워드 등장 횟수 기반
    const buildKeywordCount = BUILD_REQUIRED_KEYWORDS.reduce((count, kw) => count + (lower.includes(kw.toLowerCase()) ? 1 : 0), 0);
    // 최소 1, 키워드 수에 비례하여 추정 (1~10 범위)
    const taskCount = Math.min(10, Math.max(1, Math.ceil(buildKeywordCount / 2)));
    // dagComplexity 판정
    const hasComplexDag = COMPLEX_DAG_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    const dagComplexity = hasComplexDag || taskCount > 5 ? "complex" : "sequential";
    // full 모드 사유 조합
    const fullReasons = [];
    if (taskCount > 5)
        fullReasons.push(`task_count(${taskCount}) > 5`);
    if (!singleDomain)
        fullReasons.push("multi_domain == true");
    if (dagComplexity === "complex")
        fullReasons.push("dag_complexity == complex");
    const fullReason = fullReasons.length > 0
        ? fullReasons.join(", ")
        : "복잡도 높음: full 모드 필요";
    return {
        buildTestRequired,
        singleDomain,
        dagComplexity,
        taskCount,
        fullReason,
    };
}
// ---------------------------------------------------------------------------
// determineExecutionMode
// ---------------------------------------------------------------------------
/**
 * 설계문서 §3.6 판정 흐름에 따라 Execution-Mode를 결정한다.
 *
 * 판정 순서:
 * 1. buildTestRequired === false → direct
 * 2. singleDomain + sequential + taskCount <= max_tasks → pipeline
 * 3. 그 외 → full
 */
export async function determineExecutionMode(description, projectPath, configPath) {
    // config 로드
    const resolvedConfigPath = configPath ?? path.join(projectPath, ".agent", "router_rule_config.json");
    // getConfig()에서 projectRoot 참조하여 기본 configPath 보완
    let config = null;
    try {
        config = await loadRouterConfig(resolvedConfigPath);
        if (!config) {
            // projectRoot 기반 fallback
            const cfg = getConfig();
            const fallbackPath = path.join(cfg.agentConfigDir, "router_rule_config.json");
            config = await loadRouterConfig(fallbackPath);
        }
    }
    catch {
        config = null;
    }
    // 요청 분석
    const analysis = analyzeRequest(description);
    // 판정 흐름 1: buildTestRequired === false → direct
    if (!analysis.buildTestRequired) {
        return {
            mode: "direct",
            reason: "빌드/테스트 검증 불필요",
        };
    }
    // pipeline 기준값 (config 또는 기본값)
    const maxTasks = config?.rules?.pipeline?.criteria?.max_tasks ?? 5;
    // 판정 흐름 2: singleDomain + sequential + taskCount <= maxTasks → pipeline
    if (analysis.singleDomain &&
        analysis.dagComplexity === "sequential" &&
        analysis.taskCount <= maxTasks) {
        return {
            mode: "pipeline",
            reason: "단일 도메인 + sequential DAG",
        };
    }
    // 판정 흐름 3: full
    return {
        mode: "full",
        reason: analysis.fullReason,
    };
}
//# sourceMappingURL=execution-mode.js.map