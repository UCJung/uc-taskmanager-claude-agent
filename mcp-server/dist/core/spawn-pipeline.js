/**
 * spawn-pipeline 코어 모듈
 * claude -p를 child_process.spawn으로 비동기 실행하는 파이프라인 엔진.
 *
 * Context Isolation 지원:
 * - spawnTaskIsolated: builder → verifier → committer를 3개의 독립 claude -p 프로세스로 순차 실행
 * - spawnWorkDag: PLAN.md DAG 파싱 후 전체 WORK를 자동 실행
 */
import path from "node:path";
import { spawn } from "node:child_process";
import { getConfig } from "./config.js";
import { logWork } from "./activity-log.js";
import { FileManager } from "./file-manager.js";
import { parseDagFromPlan, DagEngine } from "./dag.js";
import { readAgentPrompt, readRefDoc, mergeSections, } from "../prompts/_helpers.js";
/** Job 상태 저장소 (in-memory 싱글톤) */
const jobStore = new Map();
// ─── 기존 Public API (하위 호환 유지) ──────────────────────────
/**
 * claude -p 프로세스를 spawn하여 비동기 파이프라인을 실행한다.
 * 즉시 jobId를 반환하고, 백그라운드에서 실행을 계속한다.
 */
export function spawnPipeline(workId, prompt, options) {
    const jobId = `${workId}-${Date.now()}`;
    return spawnProcess(jobId, workId, prompt, options);
}
/**
 * claude -p 프로세스를 spawn하여 개별 TASK를 비동기 실행한다.
 * jobId에 taskId가 포함된다.
 */
export function spawnTask(workId, taskId, prompt, options) {
    const jobId = `${workId}-${taskId}-${Date.now()}`;
    return spawnProcess(jobId, workId, prompt, options, taskId);
}
/**
 * jobId로 현재 상태를 조회한다.
 */
export function getJobStatus(jobId) {
    return jobStore.get(jobId) ?? null;
}
/**
 * pending 또는 running 상태인 모든 job 목록을 반환한다.
 */
export function listActiveJobs() {
    return Array.from(jobStore.values()).filter((j) => j.status === "pending" || j.status === "running");
}
/**
 * 테스트 용도: job store를 초기화한다.
 */
export function _resetJobStore() {
    jobStore.clear();
}
/**
 * 테스트 용도: job store에 직접 접근한다.
 */
export function _getJobStore() {
    return jobStore;
}
// ─── Context Isolation API ────────────────────────────────────
/**
 * builder → verifier → committer를 3개의 독립 claude -p 프로세스로 순차 실행한다.
 * 파일 기반 context-handoff + gate check + retry 로직 적용.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param options 옵션 (cwd, maxTurns, maxAttempts)
 * @returns jobId
 */
export function spawnTaskIsolated(workId, taskId, options) {
    const jobId = `${workId}-${taskId}-isolated-${Date.now()}`;
    const config = getConfig();
    const cwd = options?.cwd ?? config.projectRoot;
    const maxAttempts = options?.maxAttempts ?? 3;
    const job = {
        jobId,
        workId,
        status: "pending",
        startedAt: new Date().toISOString(),
        currentTask: taskId,
        stage: "builder",
        attempt: 1,
    };
    jobStore.set(jobId, job);
    // 비동기 실행 — 즉시 jobId 반환
    setImmediate(() => {
        runIsolatedTask(job, workId, taskId, cwd, maxAttempts, options?.maxTurns);
    });
    return jobId;
}
/**
 * PLAN.md에서 DAG를 파싱하여 전체 WORK를 자동 실행한다.
 * getReadyTasks() → spawnTaskIsolated() 순차 실행.
 *
 * @param workId WORK ID
 * @param options 옵션 (cwd, maxTurns, maxAttempts)
 * @returns jobId
 */
export function spawnWorkDag(workId, options) {
    const jobId = `${workId}-dag-${Date.now()}`;
    const config = getConfig();
    const cwd = options?.cwd ?? config.projectRoot;
    const job = {
        jobId,
        workId,
        status: "pending",
        startedAt: new Date().toISOString(),
    };
    jobStore.set(jobId, job);
    // 비동기 실행 — 즉시 jobId 반환
    setImmediate(() => {
        runWorkDag(job, workId, cwd, options);
    });
    return jobId;
}
// ─── Internal: Context Isolation 구현 ────────────────────────
/**
 * gate check: progress.md의 Status와 Files changed 섹션을 확인한다.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param cwd 프로젝트 루트
 * @returns gate check 통과 여부
 */
async function gateCheck(workId, taskId, cwd) {
    try {
        const fm = new FileManager(cwd);
        const progressPath = path.join("works", workId, `${taskId}_progress.md`);
        const content = await fm.readFile(progressPath);
        // Status: COMPLETED 확인
        if (!/Status:\s*COMPLETED/i.test(content)) {
            return false;
        }
        // Files changed: 섹션이 비어있지 않은지 확인
        const filesChangedMatch = content.match(/Files changed:\s*\n([\s\S]*?)(?=\n##|\n#[^#]|$)/);
        if (!filesChangedMatch) {
            // "Files changed:" 라인 뒤에 바로 내용이 오는 경우도 처리
            const inlineMatch = content.match(/Files changed:\s*(\S.+)/);
            if (!inlineMatch) {
                return false;
            }
            return inlineMatch[1].trim().length > 0;
        }
        const filesSection = filesChangedMatch[1].trim();
        return filesSection.length > 0;
    }
    catch {
        return false;
    }
}
/**
 * progress.md에서 특정 Context 섹션을 읽는다.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param sectionTitle 섹션 제목 (예: "Builder Context", "Verifier Context")
 * @param cwd 프로젝트 루트
 * @returns 섹션 내용 또는 null
 */
async function readContextHandoff(workId, taskId, sectionTitle, cwd) {
    try {
        const fm = new FileManager(cwd);
        const progressPath = path.join("works", workId, `${taskId}_progress.md`);
        const content = await fm.readFile(progressPath);
        // "## Context Handoff" 섹션 내의 특정 서브섹션 추출
        const pattern = new RegExp(`### ${sectionTitle}[\\s\\S]*?(?=\\n### |\\n## |$)`, "i");
        const match = content.match(pattern);
        if (match) {
            return match[0].trim();
        }
        // 섹션이 없으면 전체 "## Context Handoff" 섹션 반환
        const handoffMatch = content.match(/## Context Handoff[\s\S]*?(?=\n## [^#]|$)/i);
        if (handoffMatch) {
            return handoffMatch[0].trim();
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * TASK 명세 파일을 읽는다.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param cwd 프로젝트 루트
 * @returns TASK 명세 내용 또는 null
 */
async function readTaskSpec(workId, taskId, cwd) {
    try {
        const fm = new FileManager(cwd);
        const num = parseInt(taskId.replace("TASK-", ""), 10);
        const taskFile = path.join("works", workId, `TASK-${String(num).padStart(2, "0")}.md`);
        return await fm.readFile(taskFile);
    }
    catch {
        return null;
    }
}
/**
 * builder 프롬프트를 구성한다.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param cwd 프로젝트 루트
 * @param previousContext 이전 TASK 컨텍스트 (선택)
 * @returns 구성된 프롬프트 문자열
 */
async function buildBuilderPrompt(workId, taskId, cwd, previousContext) {
    const agentPrompt = await readAgentPrompt("builder");
    const sharedSections = await readRefDoc("shared-prompt-sections.md");
    const contextPolicy = await readRefDoc("context-policy.md");
    const taskSpec = await readTaskSpec(workId, taskId, cwd);
    const specContent = taskSpec
        ? `**TASK 명세**:\n${taskSpec}`
        : `**TASK**: ${workId}의 ${taskId}를 실행하라.`;
    const dynamicContext = previousContext
        ? `${specContent}\n\n**이전 TASK 컨텍스트**:\n${previousContext}`
        : specContent;
    return mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        { title: "컨텍스트 정책", content: contextPolicy },
        { title: "현재 TASK 컨텍스트", content: dynamicContext },
    ]);
}
/**
 * verifier 프롬프트를 구성한다.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param cwd 프로젝트 루트
 * @param builderHandoff builder context-handoff 내용 (선택)
 * @returns 구성된 프롬프트 문자열
 */
async function buildVerifierPrompt(workId, taskId, cwd, builderHandoff) {
    const agentPrompt = await readAgentPrompt("verifier");
    const sharedSections = await readRefDoc("shared-prompt-sections.md");
    const dynamicContext = builderHandoff
        ? `**검증 대상 TASK**: ${taskId}\n\n**Builder Context**:\n${builderHandoff}`
        : `**검증 대상 TASK**: ${taskId}`;
    return mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        { title: "현재 TASK 컨텍스트", content: dynamicContext },
    ]);
}
/**
 * committer 프롬프트를 구성한다.
 *
 * @param workId WORK ID
 * @param taskId TASK ID
 * @param cwd 프로젝트 루트
 * @param verifierHandoff verifier context-handoff 내용 (선택)
 * @returns 구성된 프롬프트 문자열
 */
async function buildCommitterPrompt(workId, taskId, cwd, verifierHandoff) {
    const agentPrompt = await readAgentPrompt("committer");
    const sharedSections = await readRefDoc("shared-prompt-sections.md");
    const fileContentSchema = await readRefDoc("file-content-schema.md");
    // result.md에서 TASK 결과 읽기 시도
    let taskResult = null;
    try {
        const fm = new FileManager(cwd);
        const num = parseInt(taskId.replace("TASK-", ""), 10);
        const resultFile = path.join("works", workId, `TASK-${String(num).padStart(2, "0")}_result.md`);
        taskResult = await fm.readFile(resultFile);
    }
    catch {
        // result.md 없으면 null 유지
    }
    const resultContent = taskResult
        ? `**TASK 결과**:\n${taskResult}`
        : `**TASK**: ${workId}의 ${taskId} 커밋을 수행하라.`;
    const dynamicContext = verifierHandoff
        ? `${resultContent}\n\n**Verifier Context**:\n${verifierHandoff}`
        : resultContent;
    return mergeSections([
        { content: agentPrompt },
        { title: "공유 섹션 참조", content: sharedSections },
        { title: "파일 컨텐츠 스키마", content: fileContentSchema },
        { title: "현재 TASK 컨텍스트", content: dynamicContext },
    ]);
}
/**
 * Context Isolation을 적용하여 단일 TASK를 실행한다.
 * builder → gate check → verifier → committer 순서.
 * gate check 실패 시 builder를 maxAttempts회 재시도.
 */
async function runIsolatedTask(job, workId, taskId, cwd, maxAttempts, maxTurns) {
    job.status = "running";
    await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] isolated task started: ${taskId}`);
    let attempt = 1;
    while (attempt <= maxAttempts) {
        job.attempt = attempt;
        job.stage = "builder";
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] builder attempt ${attempt}/${maxAttempts}`);
        // builder 프롬프트 구성 및 실행
        let builderPrompt;
        try {
            builderPrompt = await buildBuilderPrompt(workId, taskId, cwd);
        }
        catch (err) {
            job.status = "failed";
            job.finishedAt = new Date().toISOString();
            job.error = `builder prompt build failed: ${err instanceof Error ? err.message : String(err)}`;
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
            return;
        }
        const builderResult = await runClaudeAsync(job.jobId, workId, builderPrompt, cwd, maxTurns);
        if (!builderResult.success) {
            if (attempt >= maxAttempts) {
                job.status = "failed";
                job.finishedAt = new Date().toISOString();
                job.error = `builder failed after ${maxAttempts} attempts: ${builderResult.error}`;
                await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
                return;
            }
            // builder 실패 시 재시도
            attempt++;
            job.gateResult = "fail";
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] builder failed, retrying (attempt ${attempt})`);
            continue;
        }
        // gate check: progress.md Status=COMPLETED + Files changed 비어있지 않음
        const gatePass = await gateCheck(workId, taskId, cwd);
        job.gateResult = gatePass ? "pass" : "fail";
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] gate check: ${job.gateResult}`);
        if (!gatePass) {
            if (attempt >= maxAttempts) {
                job.status = "failed";
                job.finishedAt = new Date().toISOString();
                job.error = `gate check failed after ${maxAttempts} attempts`;
                await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
                return;
            }
            // gate check 실패 시 builder 재시도
            attempt++;
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] gate check failed, retrying builder (attempt ${attempt})`);
            continue;
        }
        // gate check 통과 → verifier 실행
        job.stage = "verifier";
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] starting verifier`);
        // builder context-handoff 읽기
        const builderHandoff = await readContextHandoff(workId, taskId, "Builder Context", cwd);
        let verifierPrompt;
        try {
            verifierPrompt = await buildVerifierPrompt(workId, taskId, cwd, builderHandoff);
        }
        catch (err) {
            job.status = "failed";
            job.finishedAt = new Date().toISOString();
            job.error = `verifier prompt build failed: ${err instanceof Error ? err.message : String(err)}`;
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
            return;
        }
        const verifierResult = await runClaudeAsync(job.jobId, workId, verifierPrompt, cwd, maxTurns);
        if (!verifierResult.success) {
            job.status = "failed";
            job.finishedAt = new Date().toISOString();
            job.error = `verifier failed: ${verifierResult.error}`;
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
            return;
        }
        // verifier context-handoff 읽기 → committer 실행
        job.stage = "committer";
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] starting committer`);
        const verifierHandoff = await readContextHandoff(workId, taskId, "Verifier Context", cwd);
        let committerPrompt;
        try {
            committerPrompt = await buildCommitterPrompt(workId, taskId, cwd, verifierHandoff);
        }
        catch (err) {
            job.status = "failed";
            job.finishedAt = new Date().toISOString();
            job.error = `committer prompt build failed: ${err instanceof Error ? err.message : String(err)}`;
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
            return;
        }
        const committerResult = await runClaudeAsync(job.jobId, workId, committerPrompt, cwd, maxTurns);
        if (!committerResult.success) {
            job.status = "failed";
            job.finishedAt = new Date().toISOString();
            job.error = `committer failed: ${committerResult.error}`;
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
            return;
        }
        // 모든 단계 성공
        job.status = "completed";
        job.finishedAt = new Date().toISOString();
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] isolated task completed: ${taskId}`);
        return;
    }
}
/**
 * PLAN.md DAG 파싱 후 전체 WORK를 자동 실행한다.
 * getReadyTasks() → spawnTaskIsolated() 순차 실행.
 */
async function runWorkDag(job, workId, cwd, options) {
    job.status = "running";
    await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] DAG work started`);
    try {
        // PLAN.md 읽기
        const fm = new FileManager(cwd);
        const planPath = path.join("works", workId, "PLAN.md");
        const planContent = await fm.readFile(planPath);
        // DAG 파싱
        const dagMap = parseDagFromPlan(planContent);
        const dag = new DagEngine(dagMap);
        const allTasks = dag.getAllTasks();
        if (allTasks.length === 0) {
            job.status = "completed";
            job.finishedAt = new Date().toISOString();
            await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] no tasks found in PLAN.md`);
            return;
        }
        // 완료된 TASK 집합 구성 (result.md 존재 여부)
        const completedSet = new Set();
        for (const taskId of allTasks) {
            const num = parseInt(taskId.replace("TASK-", ""), 10);
            const resultFile = path.join("works", workId, `TASK-${String(num).padStart(2, "0")}_result.md`);
            if (await fm.exists(path.join(cwd, resultFile))) {
                completedSet.add(taskId);
            }
        }
        job.progress = { completed: completedSet.size, total: allTasks.length };
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] DAG: ${allTasks.length} tasks, ${completedSet.size} completed`);
        // DAG 루프: ready tasks를 순차 실행
        while (true) {
            const readyTasks = dag.getReadyTasks(completedSet);
            if (readyTasks.length === 0) {
                // 모든 TASK 완료 여부 확인
                if (allTasks.every((t) => completedSet.has(t))) {
                    break;
                }
                // 완료되지 않았지만 실행 가능한 TASK 없음 → 블록됨
                job.status = "failed";
                job.finishedAt = new Date().toISOString();
                job.error = "DAG blocked: no ready tasks but not all completed";
                await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
                return;
            }
            // 번호 오름차순으로 정렬하여 순차 실행
            const sortedReady = [...readyTasks].sort((a, b) => {
                const numA = parseInt(a.replace("TASK-", ""), 10);
                const numB = parseInt(b.replace("TASK-", ""), 10);
                return numA - numB;
            });
            for (const taskId of sortedReady) {
                job.currentTask = taskId;
                await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] executing ${taskId}`);
                // 해당 TASK를 isolated로 실행 (동기적 완료 대기)
                await runIsolatedTaskSync(job, workId, taskId, cwd, options);
                // 실행 후 실패 여부 확인
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (job.status === "failed") {
                    return;
                }
                // TASK 완료 후 completedSet 갱신 및 진행률 업데이트
                completedSet.add(taskId);
                job.progress = { completed: completedSet.size, total: allTasks.length };
            }
        }
        job.status = "completed";
        job.finishedAt = new Date().toISOString();
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] DAG work completed: ${allTasks.length} tasks`);
    }
    catch (err) {
        job.status = "failed";
        job.finishedAt = new Date().toISOString();
        job.error = err instanceof Error ? err.message : String(err);
        await logWork(workId, "SPAWN", "DISPATCH", `[${job.jobId}] DAG error: ${job.error}`);
    }
}
/**
 * DAG 실행 중 단일 TASK를 동기적으로 완료 대기하며 실행한다.
 * job 상태를 직접 업데이트한다.
 */
async function runIsolatedTaskSync(job, workId, taskId, cwd, options) {
    const maxAttempts = options?.maxAttempts ?? 3;
    // 임시 job 객체로 isolated task 실행 (상태 추적용)
    const taskJob = {
        jobId: `${job.jobId}-${taskId}`,
        workId,
        status: "pending",
        startedAt: new Date().toISOString(),
        currentTask: taskId,
        stage: "builder",
        attempt: 1,
    };
    await runIsolatedTask(taskJob, workId, taskId, cwd, maxAttempts, options?.maxTurns);
    // 실패 시 부모 job에 전파
    if (taskJob.status === "failed") {
        job.status = "failed";
        job.finishedAt = new Date().toISOString();
        job.error = `${taskId} failed: ${taskJob.error}`;
        job.stage = taskJob.stage;
        job.attempt = taskJob.attempt;
        job.gateResult = taskJob.gateResult;
    }
    else {
        // stage/attempt/gateResult 정보 복사
        job.stage = taskJob.stage;
        job.attempt = taskJob.attempt;
        job.gateResult = taskJob.gateResult;
    }
}
/**
 * claude -p를 실행하고 완료를 Promise로 대기한다.
 * 기존 runClaude와 달리 결과를 Promise로 반환한다.
 */
async function runClaudeAsync(jobId, workId, prompt, cwd, maxTurns) {
    return new Promise((resolve) => {
        const args = [
            "-p",
            prompt,
            "--dangerously-skip-permissions",
            "--output-format",
            "stream-json",
        ];
        if (maxTurns !== undefined) {
            args.push("--max-turns", String(maxTurns));
        }
        // env에서 CLAUDECODE, ANTHROPIC_API_KEY 제거
        const env = { ...process.env };
        delete env.CLAUDECODE;
        delete env.ANTHROPIC_API_KEY;
        let child;
        try {
            child = spawn("claude", args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
        }
        catch (err) {
            const error = `spawn failed: ${err instanceof Error ? err.message : String(err)}`;
            void logWork(workId, "SPAWN", "DISPATCH", `[${jobId}] ${error}`);
            resolve({ success: false, error });
            return;
        }
        void logWork(workId, "SPAWN", "DISPATCH", `[${jobId}] pid=${child.pid} started`);
        let buffer = "";
        let resultError;
        let isCompleted = false;
        child.stdout?.on("data", (chunk) => {
            buffer += chunk.toString("utf-8");
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                try {
                    const data = JSON.parse(trimmed);
                    if (data.type === "result") {
                        if (data.is_error) {
                            resultError =
                                typeof data.result === "string"
                                    ? data.result
                                    : JSON.stringify(data.result);
                        }
                        else {
                            isCompleted = true;
                        }
                    }
                }
                catch {
                    // JSON 파싱 실패 — 무시
                }
            }
        });
        let stderrOutput = "";
        child.stderr?.on("data", (chunk) => {
            stderrOutput += chunk.toString("utf-8");
        });
        child.on("error", (err) => {
            const error = `process error: ${err.message}`;
            void logWork(workId, "SPAWN", "DISPATCH", `[${jobId}] ${error}`);
            resolve({ success: false, error });
        });
        child.on("close", (code) => {
            // 남은 buffer 처리
            if (buffer.trim()) {
                try {
                    const data = JSON.parse(buffer.trim());
                    if (data.type === "result") {
                        if (data.is_error) {
                            resultError =
                                typeof data.result === "string"
                                    ? data.result
                                    : JSON.stringify(data.result);
                        }
                        else {
                            isCompleted = true;
                        }
                    }
                }
                catch {
                    // 무시
                }
            }
            void logWork(workId, "SPAWN", "DISPATCH", `[${jobId}] exit=${code} completed=${isCompleted}`);
            if (resultError) {
                resolve({ success: false, error: resultError });
            }
            else if (isCompleted || code === 0) {
                resolve({ success: true });
            }
            else {
                const error = stderrOutput.trim() || `process exited with code ${code}`;
                resolve({ success: false, error });
            }
        });
    });
}
/**
 * 공통 spawn 로직. jobId를 생성하고, claude -p를 백그라운드 실행한다.
 */
function spawnProcess(jobId, workId, prompt, options, taskId) {
    const config = getConfig();
    const cwd = options?.cwd ?? config.projectRoot;
    const job = {
        jobId,
        workId,
        status: "pending",
        startedAt: new Date().toISOString(),
        ...(taskId && { currentTask: taskId }),
    };
    jobStore.set(jobId, job);
    // 비동기 실행 — 즉시 jobId 반환
    setImmediate(() => {
        runClaude(job, prompt, cwd, options?.maxTurns);
    });
    return jobId;
}
/**
 * claude -p 프로세스를 실행하고 stdout stream-json을 파싱한다.
 * 기존 API 호환용 (spawnPipeline/spawnTask에서 사용).
 */
async function runClaude(job, prompt, cwd, maxTurns) {
    const args = [
        "-p",
        prompt,
        "--dangerously-skip-permissions",
        "--output-format",
        "stream-json",
    ];
    if (maxTurns !== undefined) {
        args.push("--max-turns", String(maxTurns));
    }
    // env -u CLAUDECODE -u ANTHROPIC_API_KEY 처리:
    // 부모 프로세스의 환경변수에서 CLAUDECODE, ANTHROPIC_API_KEY를 제거하여 전달
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.ANTHROPIC_API_KEY;
    let child;
    try {
        child = spawn("claude", args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    }
    catch (err) {
        job.status = "failed";
        job.finishedAt = new Date().toISOString();
        job.error = `spawn failed: ${err instanceof Error ? err.message : String(err)}`;
        await logWork(job.workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.error}`);
        return;
    }
    job.status = "running";
    job.pid = child.pid;
    await logWork(job.workId, "SPAWN", "DISPATCH", `[${job.jobId}] pid=${child.pid} started`);
    // stdout stream-json 파싱
    let buffer = "";
    child.stdout?.on("data", (chunk) => {
        buffer += chunk.toString("utf-8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
            processStreamLine(job, line.trim());
        }
    });
    child.stderr?.on("data", (chunk) => {
        // stderr는 디버그용 — 에러 누적
        const text = chunk.toString("utf-8").trim();
        if (text) {
            job.error = job.error ? `${job.error}\n${text}` : text;
        }
    });
    child.on("error", async (err) => {
        job.status = "failed";
        job.finishedAt = new Date().toISOString();
        job.error = `process error: ${err.message}`;
        await logWork(job.workId, "SPAWN", "DISPATCH", `[${job.jobId}] error: ${err.message}`);
    });
    child.on("close", async (code) => {
        // 남은 buffer 처리
        if (buffer.trim()) {
            processStreamLine(job, buffer.trim());
        }
        if (job.status === "running") {
            // close 시점에 아직 running이면 exit code로 판단
            if (code === 0) {
                job.status = "completed";
            }
            else {
                job.status = "failed";
                job.error = job.error ?? `process exited with code ${code}`;
            }
        }
        job.finishedAt = new Date().toISOString();
        await logWork(job.workId, "SPAWN", "DISPATCH", `[${job.jobId}] ${job.status} (exit=${code})`);
    });
}
/**
 * stream-json stdout 한 줄을 파싱하여 job 상태를 업데이트한다.
 */
function processStreamLine(job, line) {
    if (!line)
        return;
    try {
        const data = JSON.parse(line);
        if (data.type === "assistant" && Array.isArray(data.content)) {
            // tool_use content에서 currentTask 업데이트
            for (const block of data.content) {
                if (block.type === "tool_use" && block.name) {
                    job.currentTask = block.name;
                }
            }
        }
        if (data.type === "result") {
            // result 라인으로 완료/실패 판정
            if (data.is_error) {
                job.status = "failed";
                job.error = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
            }
            else {
                job.status = "completed";
            }
        }
    }
    catch {
        // JSON 파싱 실패 — 무시 (raw 텍스트)
    }
}
//# sourceMappingURL=spawn-pipeline.js.map