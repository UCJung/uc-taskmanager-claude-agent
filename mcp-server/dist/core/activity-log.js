/**
 * Activity Log 기록 모듈
 * 에이전트 작업 단계를 work_{workId}.log 파일에 기록한다.
 */
import path from "node:path";
import { FileManager } from "./file-manager.js";
import { getConfig } from "./config.js";
/** 활동 로그 스테이지 테이블 */
export const STAGE_TABLE = [
    "INIT",
    "REF",
    "PLAN",
    "IMPL",
    "BUILD",
    "COMMIT",
    "DISPATCH",
];
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
export async function logWork(workId, agent, stage, description) {
    const config = getConfig();
    const fm = new FileManager(config.projectRoot);
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "");
    const logLine = `[${timestamp}]_${agent}_${stage}_${description}\n`;
    const logFilePath = path.join("works", workId, `work_${workId}.log`);
    await fm.appendFile(logFilePath, logLine);
}
//# sourceMappingURL=activity-log.js.map