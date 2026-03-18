/** Job 상태 인터페이스 */
export interface JobStatus {
    jobId: string;
    workId: string;
    status: "pending" | "running" | "completed" | "failed";
    pid?: number;
    startedAt: string;
    finishedAt?: string;
    currentTask?: string;
    progress?: {
        completed: number;
        total: number;
    };
    error?: string;
    /** 현재 실행 중인 agent 단계 */
    stage?: "builder" | "verifier" | "committer";
    /** 현재 시도 횟수 (1부터 시작) */
    attempt?: number;
    /** gate check 결과 */
    gateResult?: "pass" | "fail";
}
/** spawn 옵션 인터페이스 */
export interface SpawnOptions {
    cwd?: string;
    maxTurns?: number;
}
/** Context Isolation 옵션 인터페이스 */
export interface IsolatedSpawnOptions extends SpawnOptions {
    /** gate check 최대 재시도 횟수 (기본값: 3) */
    maxAttempts?: number;
}
/**
 * claude -p 프로세스를 spawn하여 비동기 파이프라인을 실행한다.
 * 즉시 jobId를 반환하고, 백그라운드에서 실행을 계속한다.
 */
export declare function spawnPipeline(workId: string, prompt: string, options?: SpawnOptions): string;
/**
 * claude -p 프로세스를 spawn하여 개별 TASK를 비동기 실행한다.
 * jobId에 taskId가 포함된다.
 */
export declare function spawnTask(workId: string, taskId: string, prompt: string, options?: SpawnOptions): string;
/**
 * jobId로 현재 상태를 조회한다.
 */
export declare function getJobStatus(jobId: string): JobStatus | null;
/**
 * pending 또는 running 상태인 모든 job 목록을 반환한다.
 */
export declare function listActiveJobs(): JobStatus[];
/**
 * 테스트 용도: job store를 초기화한다.
 */
export declare function _resetJobStore(): void;
/**
 * 테스트 용도: job store에 직접 접근한다.
 */
export declare function _getJobStore(): Map<string, JobStatus>;
/**
 * builder → verifier → committer를 3개의 독립 claude -p 프로세스로 순차 실행한다.
 * 파일 기반 context-handoff + gate check + retry 로직 적용.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param options 옵션 (cwd, maxTurns, maxAttempts)
 * @returns jobId
 */
export declare function spawnTaskIsolated(workId: string, taskId: string, options?: IsolatedSpawnOptions): string;
/**
 * PLAN.md에서 DAG를 파싱하여 전체 WORK를 자동 실행한다.
 * getReadyTasks() → spawnTaskIsolated() 순차 실행.
 *
 * @param workId WORK ID
 * @param options 옵션 (cwd, maxTurns, maxAttempts)
 * @returns jobId
 */
export declare function spawnWorkDag(workId: string, options?: IsolatedSpawnOptions): string;
//# sourceMappingURL=spawn-pipeline.d.ts.map