import { FileManager } from "./file-manager.js";
/** TASK 명세 파일: TASK-00.md */
export declare const TASK_FILE_RE: RegExp;
/** progress 파일: TASK-00_progress.md */
export declare const TASK_PROGRESS_RE: RegExp;
/** result 파일: TASK-00_result.md */
export declare const TASK_RESULT_RE: RegExp;
/** PLAN.md 메타정보 7개 필드 */
export interface PlanMeta {
    created: string;
    requirements: string;
    executionMode: string;
    project: string;
    techStack: string;
    language: string;
    status: string;
}
/** PLAN.md 파싱 결과 */
export interface Plan {
    workId: string;
    title: string;
    meta: PlanMeta;
    goal: string;
    rawContent: string;
}
/** TASK 요약 정보 */
export interface TaskSummary {
    taskId: string;
    num: number;
    title: string;
}
/** WORK 진행 상태 */
export interface WorkStatus {
    workId: string;
    totalTasks: number;
    completedTasks: number;
    progress: string;
    approved: boolean;
}
/** WORK 목록 항목 */
export interface WorkSummary {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    completed: number;
    total: number;
}
/** Activity Log 항목 */
export interface LogEntry {
    timestamp: string;
    agent: string;
    stage: string;
    description: string;
    raw: string;
}
/** 기술 스택 감지 결과 */
export interface TechStack {
    primary: string;
    detected: string[];
}
/**
 * WORK/TASK 파싱 로직을 담당하는 클래스.
 * 의존성 주입으로 FileManager를 받아 테스트 가능하다.
 */
export declare class WorkParser {
    private readonly fm;
    private readonly worksDir;
    constructor(fm?: FileManager);
    /**
     * works/ 디렉토리를 스캔하고 WORK-LIST.md를 파싱하여 WORK 목록을 반환한다.
     */
    listWorks(): Promise<WorkSummary[]>;
    /**
     * WORK-LIST.md 파일을 파싱하여 기본 항목 목록을 반환한다.
     * 마크다운 테이블 형식: | WORK-NN | 제목 | 상태 | 생성일 | 완료일 |
     */
    private _parseWorkListMd;
    /**
     * 파일시스템을 스캔하여 다음 WORK 번호를 반환한다.
     * 예: WORK-31이 최신이면 "WORK-32" 반환.
     */
    getNextWorkId(): Promise<string>;
    /**
     * works/{workId}/PLAN.md를 읽고 파싱 결과를 반환한다.
     */
    readPlan(workId: string): Promise<Plan>;
    /**
     * PLAN.md 내용을 파싱하여 Plan 객체를 반환한다.
     * 내부적으로 사용되며, 테스트에서도 직접 호출 가능하다.
     */
    _parsePlanContent(workId: string, content: string): Plan;
    /**
     * PLAN.md 내용에서 메타 필드 값을 추출한다.
     * 형식: `> 필드명: 값` 또는 `> **필드명**: 값`
     */
    private _extractMeta;
    /**
     * Execution-Mode 값을 PLAN.md 원문에서 추출한다.
     * "direct" | "pipeline" | "full" 중 하나를 반환하며, 불일치 시 "full"로 기본값.
     */
    extractExecutionMode(plan: Plan): "direct" | "pipeline" | "full";
    /**
     * PLAN.md 내용에서 TASK 목록을 추출한다.
     * ## Tasks 섹션의 ### TASK-NN: 제목 패턴을 파싱한다.
     */
    extractTasksFromPlan(planContent: string): TaskSummary[];
    /**
     * TASK 파일 수와 result 파일 수를 기반으로 진행률을 계산한다.
     */
    getWorkStatus(workId: string): Promise<WorkStatus>;
    /**
     * works/{workId}/TASK-{taskId}_result.md 파일 내용을 반환한다.
     */
    readTaskResult(workId: string, taskId: string): Promise<string>;
    /**
     * works/{workId}/TASK-{taskId}_progress.md 파일 내용을 반환한다.
     */
    readTaskProgress(workId: string, taskId: string): Promise<string>;
    /**
     * taskId 문자열에서 숫자를 추출한다.
     * "TASK-01" -> 1, "01" -> 1, "1" -> 1
     */
    private _parseTaskNum;
    /**
     * 프로젝트 디렉토리를 분석하여 기술 스택을 감지한다.
     * package.json, pyproject.toml, Cargo.toml, go.mod 순서로 확인한다.
     */
    detectTechStack(projectPath: string): Promise<TechStack>;
    /**
     * works/{workId}/work_{workId}.log 파일을 파싱하여 로그 엔트리 목록을 반환한다.
     * 엔트리 형식: [timestamp]_AGENT_STAGE_DESC
     *
     * @param workId WORK ID
     * @param lastN 마지막 N개 항목만 반환 (undefined이면 전체)
     */
    parseActivityLog(workId: string, lastN?: number): Promise<LogEntry[]>;
    /**
     * 로그 한 줄을 파싱한다.
     * 형식: [2026-03-18T10:30:00]_AGENT_STAGE_description text
     */
    private _parseLogLine;
    /**
     * WORK-LIST.md에 새 WORK 항목을 추가한다.
     */
    addToWorkList(workId: string, title: string, status: "IN_PROGRESS" | "COMPLETED"): Promise<void>;
    /**
     * WORK-LIST.md에서 특정 WORK의 상태를 업데이트한다.
     */
    updateWorkListStatus(workId: string, status: "IN_PROGRESS" | "COMPLETED"): Promise<void>;
    /**
     * DAG 분석 없이 단순히 result.md가 없는 가장 낮은 번호의 TASK를 반환한다.
     * (복잡한 DAG 지원은 core/dag.ts에서 담당)
     */
    getNextExecutableTask(workId: string): Promise<TaskSummary | null>;
}
//# sourceMappingURL=work-parser.d.ts.map