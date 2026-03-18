export interface WebhookConfig {
    enableCallback: boolean;
    taskCallbackUrl?: string;
    progressCallbackUrl?: string;
    stageCallbackUrl?: string;
    callbackToken?: string;
    /** 요청 타임아웃(ms). 기본값 5000 */
    callbackTimeoutMs?: number;
}
export interface PipelineStageCallback {
    workId: string;
    taskId: string;
    stage: "BUILDER" | "VERIFIER" | "COMMITTER";
    event: "START" | "DONE" | "FAILED";
    timestamp: string;
    detail?: string;
}
/**
 * JSON 페이로드를 HTTP POST로 전송한다.
 * AbortController로 타임아웃을 처리하며 모든 오류를 graceful하게 잡는다.
 *
 * Node 18+ / Bun 에서 기본 제공되는 native fetch를 사용한다.
 *
 * @param url       전송 대상 URL
 * @param payload   JSON 직렬화 가능한 페이로드
 * @param token     X-Runner-Api-Key 헤더 값 (선택)
 * @param timeoutMs 요청 타임아웃(ms). 기본값 5000
 */
export declare function sendWebhook(url: string, payload: unknown, token?: string, timeoutMs?: number): Promise<{
    success: boolean;
    httpStatus: number | null;
    error: string | null;
}>;
/**
 * 환경변수에서 WebhookConfig를 읽어 반환한다.
 *
 * 환경변수 목록:
 * - CALLBACK_ENABLED        : "true" / "false" (기본 false)
 * - TASK_CALLBACK_URL       : 태스크 완료 콜백 URL
 * - PROGRESS_CALLBACK_URL   : 진행 상황 콜백 URL
 * - STAGE_CALLBACK_URL      : 파이프라인 스테이지 콜백 URL
 * - CALLBACK_TOKEN          : X-Runner-Api-Key 인증 토큰
 * - CALLBACK_TIMEOUT_MS     : 요청 타임아웃(ms), 숫자 문자열
 */
export declare function loadWebhookConfig(): WebhookConfig;
/**
 * TASK 완료 웹훅을 전송하고 callback_status.json 을 갱신한다.
 *
 * @param workId      WORK ID (예: "WORK-34")
 * @param taskId      TASK ID (예: "TASK-01")
 * @param taskResult  태스크 결과 요약
 */
export declare function fireTaskCallback(workId: string, taskId: string, taskResult: {
    status: string;
    resultPath: string;
    commitHash?: string;
}): Promise<void>;
/**
 * 파이프라인 스테이지 웹훅을 전송하고 callback_status.json 을 갱신한다.
 *
 * @param payload  스테이지 콜백 페이로드
 */
export declare function fireStageCallback(payload: PipelineStageCallback): Promise<void>;
/**
 * FAILED / PENDING 상태인 콜백을 모두 재전송한다.
 *
 * @param workId  재시도할 WORK ID
 * @returns 재전송 결과 요약
 */
export declare function fireBatchRetry(workId: string): Promise<{
    synced: number;
    failed: number;
    details: Array<{
        taskId: string;
        type: string;
        status: string;
    }>;
}>;
//# sourceMappingURL=webhook-relay.d.ts.map