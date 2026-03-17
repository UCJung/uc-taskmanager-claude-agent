/**
 * Callback 상태 추적 모듈
 * WORK 디렉토리별 callback_status.json 읽기/쓰기를 담당한다.
 */
import path from "node:path";
import { FileManager } from "./file-manager.js";
import { getConfig } from "./config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CALLBACK_STATUS_FILENAME = "callback_status.json";
const SCHEMA_ID =
  "https://uc-taskmanager/schemas/callback-status.v1.json";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCallbackStatusPath(workId: string): string {
  return path.join("works", workId, CALLBACK_STATUS_FILENAME);
}

function defaultCallbackStatusFile(workId: string): CallbackStatusFile {
  return {
    $schema: SCHEMA_ID,
    workId,
    tasks: {},
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * works/{workId}/callback_status.json 을 읽어 반환한다.
 * 파일이 없으면 기본값을 반환한다.
 */
export async function readCallbackStatus(
  workId: string
): Promise<CallbackStatusFile> {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const filePath = getCallbackStatusPath(workId);

  const exists = await fm.exists(filePath);
  if (!exists) {
    return defaultCallbackStatusFile(workId);
  }

  const raw = await fm.readFile(filePath);
  return JSON.parse(raw) as CallbackStatusFile;
}

/**
 * works/{workId}/callback_status.json 에 상태를 저장한다.
 */
export async function writeCallbackStatus(
  workId: string,
  status: CallbackStatusFile
): Promise<void> {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const filePath = getCallbackStatusPath(workId);

  await fm.writeFile(filePath, JSON.stringify(status, null, 2));
}

/**
 * 특정 TASK의 taskCallback 또는 progressCallback 항목을 갱신한다.
 *
 * @param workId  WORK ID (예: "WORK-34")
 * @param taskId  TASK ID (예: "TASK-01")
 * @param type    갱신할 콜백 종류
 * @param entry   새 CallbackEntry 값
 */
export async function updateCallbackEntry(
  workId: string,
  taskId: string,
  type: "taskCallback" | "progressCallback",
  entry: CallbackEntry
): Promise<void> {
  const statusFile = await readCallbackStatus(workId);

  if (!statusFile.tasks[taskId]) {
    statusFile.tasks[taskId] = {};
  }
  statusFile.tasks[taskId][type] = entry;

  await writeCallbackStatus(workId, statusFile);
}

/**
 * 특정 TASK의 stageCallbacks 항목 중 하나를 갱신한다.
 *
 * @param workId    WORK ID
 * @param taskId    TASK ID
 * @param stageKey  스테이지 키 (예: "BUILDER_START")
 * @param entry     새 StageCallbackEntry 값
 */
export async function updateStageCallback(
  workId: string,
  taskId: string,
  stageKey: string,
  entry: StageCallbackEntry
): Promise<void> {
  const statusFile = await readCallbackStatus(workId);

  if (!statusFile.tasks[taskId]) {
    statusFile.tasks[taskId] = {};
  }
  if (!statusFile.tasks[taskId].stageCallbacks) {
    statusFile.tasks[taskId].stageCallbacks = {};
  }
  statusFile.tasks[taskId].stageCallbacks![stageKey] = entry;

  await writeCallbackStatus(workId, statusFile);
}

/**
 * FAILED 또는 PENDING 상태인 모든 콜백 항목을 수집하여 반환한다.
 *
 * @param workId WORK ID
 * @returns 재전송 대상 항목 배열
 */
export async function getFailedOrPendingCallbacks(
  workId: string
): Promise<
  Array<{ taskId: string; type: string; entry: CallbackEntry | StageCallbackEntry }>
> {
  const statusFile = await readCallbackStatus(workId);
  const results: Array<{
    taskId: string;
    type: string;
    entry: CallbackEntry | StageCallbackEntry;
  }> = [];

  for (const [taskId, taskStatus] of Object.entries(statusFile.tasks)) {
    if (
      taskStatus.taskCallback &&
      (taskStatus.taskCallback.status === "FAILED" ||
        taskStatus.taskCallback.status === "PENDING")
    ) {
      results.push({
        taskId,
        type: "taskCallback",
        entry: taskStatus.taskCallback,
      });
    }

    if (
      taskStatus.progressCallback &&
      (taskStatus.progressCallback.status === "FAILED" ||
        taskStatus.progressCallback.status === "PENDING")
    ) {
      results.push({
        taskId,
        type: "progressCallback",
        entry: taskStatus.progressCallback,
      });
    }

    if (taskStatus.stageCallbacks) {
      for (const [stageKey, stageEntry] of Object.entries(
        taskStatus.stageCallbacks
      )) {
        if (
          stageEntry.status === "FAILED" ||
          stageEntry.status === "PENDING"
        ) {
          results.push({
            taskId,
            type: `stageCallbacks.${stageKey}`,
            entry: stageEntry,
          });
        }
      }
    }
  }

  return results;
}
