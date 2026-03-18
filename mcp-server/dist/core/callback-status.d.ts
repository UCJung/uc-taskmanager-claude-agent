export type CallbackState = "SENT" | "FAILED" | "PENDING";
export interface CallbackEntry {
    status: CallbackState;
    url: string;
    sentAt: string | null;
    httpStatus: number | null;
    error: string | null;
}
export interface StageCallbackEntry {
    status: CallbackState;
    sentAt: string | null;
    httpStatus: number | null;
}
export interface TaskCallbackStatus {
    taskCallback?: CallbackEntry;
    progressCallback?: CallbackEntry;
    stageCallbacks?: Record<string, StageCallbackEntry>;
}
export interface CallbackStatusFile {
    $schema: string;
    workId: string;
    tasks: Record<string, TaskCallbackStatus>;
}
/**
 * works/{workId}/callback_status.json 을 읽어 반환한다.
 * 파일이 없으면 기본값을 반환한다.
 */
export declare function readCallbackStatus(workId: string): Promise<CallbackStatusFile>;
/**
 * works/{workId}/callback_status.json 에 상태를 저장한다.
 */
export declare function writeCallbackStatus(workId: string, status: CallbackStatusFile): Promise<void>;
/**
 * 특정 TASK의 taskCallback 또는 progressCallback 항목을 갱신한다.
 *
 * @param workId  WORK ID (예: "WORK-34")
 * @param taskId  TASK ID (예: "TASK-01")
 * @param type    갱신할 콜백 종류
 * @param entry   새 CallbackEntry 값
 */
export declare function updateCallbackEntry(workId: string, taskId: string, type: "taskCallback" | "progressCallback", entry: CallbackEntry): Promise<void>;
/**
 * 특정 TASK의 stageCallbacks 항목 중 하나를 갱신한다.
 *
 * @param workId    WORK ID
 * @param taskId    TASK ID
 * @param stageKey  스테이지 키 (예: "BUILDER_START")
 * @param entry     새 StageCallbackEntry 값
 */
export declare function updateStageCallback(workId: string, taskId: string, stageKey: string, entry: StageCallbackEntry): Promise<void>;
/**
 * FAILED 또는 PENDING 상태인 모든 콜백 항목을 수집하여 반환한다.
 *
 * @param workId WORK ID
 * @returns 재전송 대상 항목 배열
 */
export declare function getFailedOrPendingCallbacks(workId: string): Promise<Array<{
    taskId: string;
    type: string;
    entry: CallbackEntry | StageCallbackEntry;
}>>;
//# sourceMappingURL=callback-status.d.ts.map