/**
 * Webhook 릴레이 모듈
 * HTTP 웹훅 전송 및 callback_status.json 상태 추적을 담당한다.
 */
import { logWork } from "./activity-log.js";
import { updateCallbackEntry, updateStageCallback, getFailedOrPendingCallbacks, } from "./callback-status.js";
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
/**
 * 현재 ISO timestamp 문자열을 반환한다 (밀리초 제외).
 */
function nowIso() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
// ---------------------------------------------------------------------------
// Core: sendWebhook
// ---------------------------------------------------------------------------
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
export async function sendWebhook(url, payload, token, timeoutMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["X-Runner-Api-Key"] = token;
        }
        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        clearTimeout(timer);
        const success = res.ok;
        return {
            success,
            httpStatus: res.status,
            error: success ? null : `HTTP ${res.status}`,
        };
    }
    catch (err) {
        clearTimeout(timer);
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, httpStatus: null, error: message };
    }
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
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
export function loadWebhookConfig() {
    const enableCallback = (process.env.CALLBACK_ENABLED ?? "false").toLowerCase() === "true";
    const timeoutRaw = process.env.CALLBACK_TIMEOUT_MS;
    const callbackTimeoutMs = timeoutRaw !== undefined && !Number.isNaN(Number(timeoutRaw))
        ? Number(timeoutRaw)
        : 5000;
    return {
        enableCallback,
        taskCallbackUrl: process.env.TASK_CALLBACK_URL || undefined,
        progressCallbackUrl: process.env.PROGRESS_CALLBACK_URL || undefined,
        stageCallbackUrl: process.env.STAGE_CALLBACK_URL || undefined,
        callbackToken: process.env.CALLBACK_TOKEN || undefined,
        callbackTimeoutMs,
    };
}
/**
 * TASK 완료 웹훅을 전송하고 callback_status.json 을 갱신한다.
 *
 * @param workId      WORK ID (예: "WORK-34")
 * @param taskId      TASK ID (예: "TASK-01")
 * @param taskResult  태스크 결과 요약
 */
export async function fireTaskCallback(workId, taskId, taskResult) {
    const cfg = loadWebhookConfig();
    if (!cfg.enableCallback || !cfg.taskCallbackUrl) {
        return;
    }
    const payload = {
        workId,
        taskId,
        ...taskResult,
        timestamp: nowIso(),
    };
    const result = await sendWebhook(cfg.taskCallbackUrl, payload, cfg.callbackToken, cfg.callbackTimeoutMs);
    const entry = {
        status: result.success ? "SENT" : "FAILED",
        url: cfg.taskCallbackUrl,
        sentAt: nowIso(),
        httpStatus: result.httpStatus,
        error: result.error,
    };
    await updateCallbackEntry(workId, taskId, "taskCallback", entry);
    await logWork(workId, "WEBHOOK_RELAY", "DISPATCH", `fireTaskCallback ${taskId} → ${result.success ? "SENT" : "FAILED"} (${result.httpStatus ?? "no-status"})`);
}
/**
 * 파이프라인 스테이지 웹훅을 전송하고 callback_status.json 을 갱신한다.
 *
 * @param payload  스테이지 콜백 페이로드
 */
export async function fireStageCallback(payload) {
    const cfg = loadWebhookConfig();
    if (!cfg.enableCallback || !cfg.stageCallbackUrl) {
        return;
    }
    const fullPayload = { ...payload, timestamp: payload.timestamp || nowIso() };
    const stageKey = `${payload.stage}_${payload.event}`;
    const result = await sendWebhook(cfg.stageCallbackUrl, fullPayload, cfg.callbackToken, cfg.callbackTimeoutMs);
    const entry = {
        status: result.success ? "SENT" : "FAILED",
        sentAt: nowIso(),
        httpStatus: result.httpStatus,
    };
    await updateStageCallback(payload.workId, payload.taskId, stageKey, entry);
    await logWork(payload.workId, "WEBHOOK_RELAY", "DISPATCH", `fireStageCallback ${payload.taskId} ${stageKey} → ${result.success ? "SENT" : "FAILED"} (${result.httpStatus ?? "no-status"})`);
}
/**
 * FAILED / PENDING 상태인 콜백을 모두 재전송한다.
 *
 * @param workId  재시도할 WORK ID
 * @returns 재전송 결과 요약
 */
export async function fireBatchRetry(workId) {
    const cfg = loadWebhookConfig();
    const pending = await getFailedOrPendingCallbacks(workId);
    let synced = 0;
    let failed = 0;
    const details = [];
    for (const item of pending) {
        // stageCallbacks 항목은 stageCallbackUrl, 나머지는 taskCallbackUrl 사용
        const isStage = item.type.startsWith("stageCallbacks.");
        const url = isStage ? cfg.stageCallbackUrl : cfg.taskCallbackUrl;
        if (!cfg.enableCallback || !url) {
            details.push({ taskId: item.taskId, type: item.type, status: "SKIPPED" });
            continue;
        }
        // 재전송 페이로드: 기존 entry를 그대로 재활용
        const retryPayload = {
            workId,
            taskId: item.taskId,
            type: item.type,
            retryAt: nowIso(),
        };
        const result = await sendWebhook(url, retryPayload, cfg.callbackToken, cfg.callbackTimeoutMs);
        const newStatus = result.success ? "SENT" : "FAILED";
        if (isStage) {
            const stageKey = item.type.replace("stageCallbacks.", "");
            const updatedEntry = {
                status: newStatus,
                sentAt: nowIso(),
                httpStatus: result.httpStatus,
            };
            await updateStageCallback(workId, item.taskId, stageKey, updatedEntry);
        }
        else {
            const existingEntry = item.entry;
            const updatedEntry = {
                status: newStatus,
                url: existingEntry.url ?? url,
                sentAt: nowIso(),
                httpStatus: result.httpStatus,
                error: result.error,
            };
            await updateCallbackEntry(workId, item.taskId, item.type, updatedEntry);
        }
        if (result.success) {
            synced++;
        }
        else {
            failed++;
        }
        details.push({
            taskId: item.taskId,
            type: item.type,
            status: newStatus,
        });
    }
    await logWork(workId, "WEBHOOK_RELAY", "DISPATCH", `fireBatchRetry complete — synced=${synced} failed=${failed} total=${pending.length}`);
    return { synced, failed, details };
}
//# sourceMappingURL=webhook-relay.js.map