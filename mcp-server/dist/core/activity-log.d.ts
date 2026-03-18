/** 활동 로그 스테이지 테이블 */
export declare const STAGE_TABLE: readonly ["INIT", "REF", "PLAN", "IMPL", "BUILD", "COMMIT", "DISPATCH"];
/** 스테이지 타입 */
export type Stage = (typeof STAGE_TABLE)[number];
/**
 * Activity Log 항목을 파일에 기록한다.
 *
 * 형식: `[ISO timestamp]_AGENT_STAGE_description\n`
 * 파일: `works/{workId}/work_{workId}.log`
 *
 * @param workId WORK ID (예: "WORK-31")
 * @param agent 에이전트 이름 (예: "BUILDER", "VERIFIER")
 * @param stage 작업 단계
 * @param description 단계 설명
 */
export declare function logWork(workId: string, agent: string, stage: Stage, description: string): Promise<void>;
//# sourceMappingURL=activity-log.d.ts.map