/**
 * Pipeline Tools — WORK 파이프라인 관리 도구 4개를 MCP Tool로 등록한다.
 *
 * 등록 도구:
 *   1. create_work    — 새 WORK 생성 + execution-mode 자동 판정
 *   2. execute_work   — DAG 기반 파이프라인 실행
 *   3. approve_plan   — PLAN 승인 (full 모드)
 *   4. resume_work    — 중단된 WORK 재개
 */
import path from "node:path";
import { z } from "zod";
import { WorkParser } from "../core/work-parser.js";
import { DagEngine, parseDagFromPlan } from "../core/dag.js";
import { determineExecutionMode } from "../core/execution-mode.js";
import { logWork } from "../core/activity-log.js";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";
// ---------------------------------------------------------------------------
// 공유 WorkParser 인스턴스 (기본 설정 사용)
// ---------------------------------------------------------------------------
let _parser = null;
function getParser() {
    if (!_parser) {
        _parser = new WorkParser();
    }
    return _parser;
}
// ---------------------------------------------------------------------------
// registerPipelineTools
// ---------------------------------------------------------------------------
/**
 * McpServer에 Pipeline Tools 4개를 등록한다.
 *
 * @param server McpServer 인스턴스
 * @param parser 테스트 주입용 WorkParser (생략 시 싱글톤 사용)
 */
export function registerPipelineTools(server, parser) {
    const p = parser ?? getParser();
    // 1. create_work
    server.tool("create_work", "새 WORK를 생성한다. execution-mode를 자동 판정하거나 명시적으로 지정할 수 있다.", {
        description: z.string().describe("WORK 설명 (요구사항 요약)"),
        project_path: z
            .string()
            .optional()
            .describe("프로젝트 경로 (생략 시 projectRoot 사용)"),
        execution_mode: z
            .enum(["direct", "pipeline", "full"])
            .optional()
            .describe("실행 모드 명시 지정 (생략 시 자동 판정)"),
    }, async ({ description, project_path, execution_mode }) => {
        try {
            const config = getConfig();
            const projectPath = project_path ?? config.projectRoot;
            // 다음 WORK ID 결정
            const workId = await p.getNextWorkId();
            // execution-mode 결정
            let resolvedMode;
            let modeReason;
            if (execution_mode) {
                resolvedMode = execution_mode;
                modeReason = "명시적 지정";
            }
            else {
                const decision = await determineExecutionMode(description, projectPath);
                resolvedMode = decision.mode;
                modeReason = decision.reason;
            }
            // works/{work_id}/ 디렉토리 생성
            const fm = new FileManager(config.projectRoot);
            const workDirPath = path.join("works", workId);
            await fm.mkdir(workDirPath);
            // PLAN.md 생성 (최소 형식)
            const today = new Date().toISOString().slice(0, 10);
            const planContent = [
                `# ${workId}: ${description}`,
                "",
                `> Created: ${today}`,
                `> Execution-Mode: ${resolvedMode}`,
                `> Status: DRAFT`,
                `> 요구사항: ${description}`,
                "",
                "## Goal",
                "",
                description,
                "",
            ].join("\n");
            const planPath = path.join(workDirPath, "PLAN.md");
            await fm.writeFile(planPath, planContent);
            // WORK-LIST.md에 추가
            await p.addToWorkList(workId, description, "IN_PROGRESS");
            // Activity Log 기록
            await logWork(workId, "MCP", "INIT", "WORK created");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            work_id: workId,
                            execution_mode: resolvedMode,
                            mode_reason: modeReason,
                            plan_path: planPath,
                            message: `${workId} 생성 완료. execution-mode: ${resolvedMode}`,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: message }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    });
    // 2. execute_work
    server.tool("execute_work", "WORK 파이프라인을 실행한다. DAG 기반으로 TASK를 순차/병렬 실행한다.", {
        work_id: z.string().describe("실행할 WORK ID (예: WORK-34)"),
        mode: z
            .enum(["manual", "auto"])
            .default("auto")
            .describe("실행 모드: manual=클라이언트가 직접 실행, auto=자동 실행 (기본: auto)"),
    }, async ({ work_id, mode }) => {
        try {
            // PLAN.md 읽기
            const plan = await p.readPlan(work_id);
            const executionMode = p.extractExecutionMode(plan);
            // DAG 파싱 및 엔진 생성
            const dagMap = parseDagFromPlan(plan.rawContent);
            const dag = new DagEngine(dagMap);
            const allTasks = dag.getAllTasks();
            const totalTasks = allTasks.length;
            // 완료된 TASK 집합 구성 (result.md 존재 여부)
            const status = await p.getWorkStatus(work_id);
            const taskSummaries = p.extractTasksFromPlan(plan.rawContent);
            const completedSet = new Set();
            for (const t of taskSummaries) {
                try {
                    await p.readTaskResult(work_id, t.taskId);
                    completedSet.add(t.taskId);
                }
                catch {
                    // result.md 없으면 미완료
                }
            }
            // DAG에서 완료된 TASK도 completedSet에 포함
            // (DAG에 있지만 taskSummaries에 없는 경우 대비)
            for (const taskId of allTasks) {
                if (!completedSet.has(taskId)) {
                    try {
                        await p.readTaskResult(work_id, taskId);
                        completedSet.add(taskId);
                    }
                    catch {
                        // 미완료
                    }
                }
            }
            const completedCount = completedSet.size;
            // 실행 가능한 TASK 목록
            const readyTasks = dag.getReadyTasks(completedSet);
            // Activity Log 기록
            await logWork(work_id, "MCP", "DISPATCH", "Pipeline execution started");
            // next_action 결정
            let nextAction;
            if (completedCount >= totalTasks && totalTasks > 0) {
                nextAction = "all_tasks_completed";
            }
            else if (readyTasks.length === 0 && totalTasks === 0) {
                nextAction = "no_tasks_found — PLAN.md에 TASK를 추가하세요";
            }
            else if (readyTasks.length === 0) {
                nextAction = "no_ready_tasks — 선행 TASK 완료를 기다리는 중";
            }
            else if (mode === "manual") {
                nextAction = `execute_task를 호출하여 다음 TASK를 실행하세요: ${readyTasks.join(", ")}`;
            }
            else {
                nextAction = `ready_tasks를 순서대로 execute_task로 실행하세요: ${readyTasks.join(", ")}`;
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            work_id,
                            status: "running",
                            execution_mode: executionMode,
                            total_tasks: totalTasks,
                            completed_tasks: completedCount,
                            ready_tasks: readyTasks,
                            next_action: nextAction,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: message }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    });
    // 3. approve_plan
    server.tool("approve_plan", "PLAN을 승인한다. full 모드에서 필요하며, direct/pipeline은 즉시 실행 가능하다.", {
        work_id: z.string().describe("승인할 WORK ID (예: WORK-34)"),
    }, async ({ work_id }) => {
        try {
            // PLAN.md에서 execution_mode 확인
            const plan = await p.readPlan(work_id);
            const executionMode = p.extractExecutionMode(plan);
            // PROGRESS.md 생성/갱신 (approved: true 추가)
            const config = getConfig();
            const fm = new FileManager(config.projectRoot);
            const progressPath = path.join("works", work_id, "PROGRESS.md");
            let progressContent;
            try {
                progressContent = await fm.readFile(progressPath);
                // 기존 approved 라인이 있으면 교체, 없으면 추가
                if (/approved:/i.test(progressContent)) {
                    progressContent = progressContent.replace(/approved:\s*(true|false)/i, "approved: true");
                }
                else {
                    progressContent = progressContent.trimEnd() + "\napproved: true\n";
                }
            }
            catch {
                // PROGRESS.md가 없으면 새로 생성
                const today = new Date().toISOString().slice(0, 10);
                progressContent = [
                    `# ${work_id} PROGRESS`,
                    "",
                    `> approved: true`,
                    `> approved_at: ${today}`,
                    `> execution_mode: ${executionMode}`,
                    "",
                ].join("\n");
            }
            await fm.writeFile(progressPath, progressContent);
            // Activity Log 기록
            await logWork(work_id, "MCP", "PLAN", "Plan approved");
            // execution_mode에 따른 다음 단계 안내
            let nextStep;
            if (executionMode === "full") {
                nextStep = "execute_work — full 모드 파이프라인 실행 준비 완료";
            }
            else if (executionMode === "pipeline") {
                nextStep = "execute_work — pipeline 모드는 승인 없이도 즉시 실행 가능했지만 승인 완료";
            }
            else {
                nextStep = "execute_work — direct 모드는 승인 없이도 즉시 실행 가능했지만 승인 완료";
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            approved: true,
                            work_id,
                            execution_mode: executionMode,
                            next_step: nextStep,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: message }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    });
    // 4. resume_work
    server.tool("resume_work", "중단된 WORK를 재개한다. 마지막 완료 TASK부터 이어서 실행한다.", {
        work_id: z.string().describe("재개할 WORK ID (예: WORK-34)"),
    }, async ({ work_id }) => {
        try {
            // PLAN.md 읽기 및 DAG 구성
            const plan = await p.readPlan(work_id);
            const dagMap = parseDagFromPlan(plan.rawContent);
            const dag = new DagEngine(dagMap);
            const allTasks = dag.getAllTasks();
            // WORK 진행 상태 파악
            const workStatus = await p.getWorkStatus(work_id);
            const taskSummaries = p.extractTasksFromPlan(plan.rawContent);
            // 완료된 TASK 집합 구성
            const completedSet = new Set();
            let lastCompletedTask = null;
            for (const t of taskSummaries) {
                try {
                    await p.readTaskResult(work_id, t.taskId);
                    completedSet.add(t.taskId);
                    lastCompletedTask = t.taskId;
                }
                catch {
                    // 미완료
                }
            }
            // DAG에만 있는 TASK도 확인
            for (const taskId of allTasks) {
                if (!completedSet.has(taskId)) {
                    try {
                        await p.readTaskResult(work_id, taskId);
                        completedSet.add(taskId);
                        lastCompletedTask = taskId;
                    }
                    catch {
                        // 미완료
                    }
                }
            }
            const completedCount = completedSet.size;
            const totalTasks = Math.max(allTasks.length, workStatus.totalTasks);
            const remainingTasks = totalTasks - completedCount;
            // 실행 가능한 TASK 목록
            const readyTasks = dag.getReadyTasks(completedSet);
            // Activity Log 기록
            await logWork(work_id, "MCP", "DISPATCH", "Work resumed");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            work_id,
                            resumed_from: lastCompletedTask ?? "처음부터 시작",
                            completed_tasks: completedCount,
                            remaining_tasks: remainingTasks,
                            ready_tasks: readyTasks,
                            next_action: readyTasks.length > 0
                                ? `execute_task로 다음 TASK를 실행하세요: ${readyTasks.join(", ")}`
                                : completedCount >= totalTasks && totalTasks > 0
                                    ? "모든 TASK가 완료되었습니다"
                                    : "실행 가능한 TASK가 없습니다 — 선행 TASK를 먼저 완료하세요",
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ error: message }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=pipeline.js.map