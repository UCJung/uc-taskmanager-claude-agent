/**
 * Task Tools — TASK 실행 관련 도구 4개를 MCP Tool로 등록한다.
 *
 * 등록 도구:
 *   1. get_next_task  — DAG 기반으로 다음 실행 가능한 TASK 반환
 *   2. execute_task   — 단일 TASK 실행 (builder → verifier → committer 파이프라인 트리거)
 *   3. retry_task     — 실패한 TASK 재시도
 *   4. approve_task   — TASK 결과 수동 승인 (manual 모드)
 */
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WorkParser } from "../core/work-parser.js";
import { DagEngine, parseDagFromPlan } from "../core/dag.js";
import type { TaskDag } from "../core/dag.js";
import {
  applyTaskDependencyWindow,
  extractContextHandoffFromResult,
} from "../core/context-window.js";
import type { TaskResultContextHandoff } from "../core/context-window.js";
import { logWork } from "../core/activity-log.js";
import { FileManager } from "../core/file-manager.js";
import { getConfig } from "../core/config.js";
import { spawnTaskIsolated } from "../core/spawn-pipeline.js";

// ---------------------------------------------------------------------------
// 공유 WorkParser 인스턴스 (기본 설정 사용)
// ---------------------------------------------------------------------------
let _parser: WorkParser | null = null;

function getParser(): WorkParser {
  if (!_parser) {
    _parser = new WorkParser();
  }
  return _parser;
}

// ---------------------------------------------------------------------------
// TASK ID 정규화 헬퍼
// ---------------------------------------------------------------------------

/**
 * 다양한 형식의 task_id를 "TASK-XX" 형식으로 정규화한다.
 * "1" → "TASK-01", "01" → "TASK-01", "TASK-01" → "TASK-01"
 */
function normalizeTaskId(taskId: string): string {
  // 이미 TASK-NN 형식인 경우
  const fullMatch = taskId.match(/^TASK-(\d+)$/);
  if (fullMatch) {
    const num = parseInt(fullMatch[1], 10);
    return `TASK-${String(num).padStart(2, "0")}`;
  }

  // 숫자만 있는 경우
  const numMatch = taskId.match(/^(\d+)$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    return `TASK-${String(num).padStart(2, "0")}`;
  }

  return taskId;
}

// ---------------------------------------------------------------------------
// 의존성 컨텍스트 빌드 헬퍼
// ---------------------------------------------------------------------------

/**
 * 주어진 TASK의 완료된 선행 TASK들로부터 슬라이딩 윈도우 컨텍스트를 빌드한다.
 *
 * @param workId WORK ID
 * @param taskId 현재 TASK ID
 * @param dag DAG 엔진 인스턴스
 * @param completedSet 완료된 TASK ID 집합
 * @param parser WorkParser 인스턴스
 * @returns 포맷된 컨텍스트 문자열, 없으면 undefined
 */
async function buildDependencyContext(
  workId: string,
  taskId: string,
  dag: TaskDag,
  completedSet: Set<string>,
  parser: WorkParser
): Promise<string | undefined> {
  // 모든 선행 TASK ID 수집 (직접 + 간접)
  const ancestors = dag.getAllAncestors(taskId);

  // 완료된 선행 TASK만 필터링
  const completedAncestors = ancestors.filter((a) => completedSet.has(a));

  if (completedAncestors.length === 0) {
    return undefined;
  }

  // 각 완료된 선행 TASK의 result.md에서 handoff 파싱
  const dependencyItems: Array<{
    taskId: string;
    distance: number;
    handoff: TaskResultContextHandoff;
  }> = [];

  for (const ancestorId of completedAncestors) {
    let resultContent: string;
    try {
      resultContent = await parser.readTaskResult(workId, ancestorId);
    } catch {
      // result.md 읽기 실패 시 건너뜀
      continue;
    }

    const handoff = extractContextHandoffFromResult(resultContent);
    if (!handoff) {
      continue;
    }

    const distance = dag.shortestPath(ancestorId, taskId);
    if (distance === Infinity) {
      continue;
    }

    dependencyItems.push({ taskId: ancestorId, distance, handoff });
  }

  if (dependencyItems.length === 0) {
    return undefined;
  }

  // 거리 오름차순 정렬
  dependencyItems.sort((a, b) => a.distance - b.distance);

  return applyTaskDependencyWindow(taskId, dependencyItems);
}

// ---------------------------------------------------------------------------
// 완료된 TASK 집합 빌드 헬퍼
// ---------------------------------------------------------------------------

/**
 * WORK 디렉토리를 스캔하여 result.md가 있는 TASK ID 집합을 빌드한다.
 */
async function buildCompletedSet(workId: string): Promise<Set<string>> {
  const config = getConfig();
  const fm = new FileManager(config.projectRoot);
  const workDir = path.join("works", workId);
  const entries = await fm.listDir(workDir);

  const completedSet = new Set<string>();
  for (const name of entries) {
    const m = name.match(/^TASK-(\d+)_result\.md$/);
    if (m) {
      const num = parseInt(m[1], 10);
      completedSet.add(`TASK-${String(num).padStart(2, "0")}`);
    }
  }

  return completedSet;
}

// ---------------------------------------------------------------------------
// registerTaskTools
// ---------------------------------------------------------------------------

/**
 * McpServer에 Task Tools 4개를 등록한다.
 *
 * @param server McpServer 인스턴스
 * @param parser 테스트 주입용 WorkParser (생략 시 싱글톤 사용)
 */
export function registerTaskTools(
  server: McpServer,
  parser?: WorkParser
): void {
  const p = parser ?? getParser();

  // 1. get_next_task
  server.tool(
    "get_next_task",
    "DAG 기반으로 다음 실행 가능한 TASK를 반환한다. 의존성 컨텍스트도 함께 제공한다.",
    {
      work_id: z.string().describe("WORK ID (예: WORK-31)"),
    },
    async ({ work_id }) => {
      try {
        // PLAN.md 읽기
        const plan = await p.readPlan(work_id);

        // DAG 파싱 및 엔진 빌드
        const dagMap = parseDagFromPlan(plan.rawContent);
        const dag = new DagEngine(dagMap);

        // 완료된 TASK 집합 빌드
        const completedSet = await buildCompletedSet(work_id);

        // 실행 가능한 TASK 목록 조회
        const readyTasks = dag.getReadyTasks(completedSet);

        // 실행 가능한 TASK가 없는 경우 판정
        if (readyTasks.length === 0) {
          const allTasks = dag.getAllTasks();
          const allDone = allTasks.every((t) => completedSet.has(t));

          if (allDone) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(
                    {
                      work_id,
                      status: "completed",
                      message: "모든 TASK가 완료되었습니다.",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    work_id,
                    status: "blocked",
                    message: "실행 가능한 TASK가 없습니다. 의존 TASK가 완료되지 않았습니다.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // 가장 낮은 번호의 TASK 선택
        const sortedReady = [...readyTasks].sort((a, b) => {
          const numA = parseInt(a.replace("TASK-", ""), 10);
          const numB = parseInt(b.replace("TASK-", ""), 10);
          return numA - numB;
        });
        const chosenTaskId = sortedReady[0];

        // 의존성 컨텍스트 빌드
        const previousContext = await buildDependencyContext(
          work_id,
          chosenTaskId,
          dag,
          completedSet,
          p
        );

        // TASK 명세 파일 읽기
        let spec: string | undefined;
        try {
          const num = parseInt(chosenTaskId.replace("TASK-", ""), 10);
          const taskFile = path.join(
            "works",
            work_id,
            `TASK-${String(num).padStart(2, "0")}.md`
          );
          const config = getConfig();
          const fm = new FileManager(config.projectRoot);
          spec = await fm.readFile(taskFile);
        } catch {
          // TASK 명세 파일 없으면 undefined 유지
        }

        const result = {
          work_id,
          task_id: chosenTaskId,
          status: "READY",
          dependencies_met: true,
          spec,
          previous_context: previousContext,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 2. execute_task
  server.tool(
    "execute_task",
    "단일 TASK를 실행한다 (builder → verifier → committer 파이프라인 트리거). previous_context가 없으면 자동 주입한다.",
    {
      work_id: z.string().describe("WORK ID (예: WORK-31)"),
      task_id: z
        .string()
        .describe("TASK ID (예: TASK-01 또는 01 또는 1 모두 허용)"),
      previous_context: z
        .string()
        .optional()
        .describe("이전 TASK 컨텍스트 (생략 시 자동 주입)"),
    },
    async ({ work_id, task_id }) => {
      try {
        // task_id 정규화
        const normalizedTaskId = normalizeTaskId(task_id);

        // Activity Log 기록
        await logWork(
          work_id,
          "MCP",
          "DISPATCH",
          `Task execution started: ${normalizedTaskId}`
        );

        // spawnTaskIsolated로 Context Isolation 파이프라인 실행
        // (프롬프트 구성 및 컨텍스트 주입은 spawnTaskIsolated 내부에서 처리)
        const config = getConfig();
        const jobId = spawnTaskIsolated(work_id, normalizedTaskId, {
          cwd: config.projectRoot,
        });

        const result = {
          work_id,
          task_id: normalizedTaskId,
          job_id: jobId,
          status: "spawned",
          message: "TASK 실행이 시작되었습니다. get_job_status로 진행 상태를 확인하세요.",
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 3. retry_task
  server.tool(
    "retry_task",
    "실패한 TASK를 재시도한다. retry_target으로 builder 또는 committer를 지정할 수 있다.",
    {
      work_id: z.string().describe("WORK ID (예: WORK-31)"),
      task_id: z
        .string()
        .describe("TASK ID (예: TASK-01 또는 01 또는 1 모두 허용)"),
      retry_target: z
        .enum(["builder", "committer"])
        .optional()
        .default("builder")
        .describe("재시도 대상 에이전트 (기본값: builder)"),
    },
    async ({ work_id, task_id, retry_target }) => {
      const MAX_ATTEMPTS = 3;

      try {
        const normalizedTaskId = normalizeTaskId(task_id);
        const target = retry_target ?? "builder";

        // 현재 시도 횟수 파악 (progress.md에서 읽기)
        let currentAttempt = 0;
        let progressContent = "";

        try {
          progressContent = await p.readTaskProgress(work_id, normalizedTaskId);

          // "retry_{target}_attempts: N" 패턴으로 시도 횟수 파싱
          const attemptMatch = progressContent.match(
            new RegExp(`retry_${target}_attempts:\\s*(\\d+)`)
          );
          if (attemptMatch) {
            currentAttempt = parseInt(attemptMatch[1], 10);
          }
        } catch {
          // progress.md 없으면 attempt=0으로 시작
        }

        const nextAttempt = currentAttempt + 1;

        // 최대 시도 횟수 초과 확인
        if (currentAttempt >= MAX_ATTEMPTS) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: `최대 재시도 횟수(${MAX_ATTEMPTS})를 초과하였습니다.`,
                    work_id,
                    task_id: normalizedTaskId,
                    retry_target: target,
                    attempt: currentAttempt,
                    max_attempts: MAX_ATTEMPTS,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // progress.md 갱신 또는 생성
        const config = getConfig();
        const fm = new FileManager(config.projectRoot);
        const progressFilePath = path.join(
          "works",
          work_id,
          `${normalizedTaskId}_progress.md`
        );

        let updatedContent: string;
        if (progressContent) {
          // 기존 progress.md에서 시도 횟수 업데이트
          const pattern = new RegExp(
            `(retry_${target}_attempts:\\s*)\\d+`
          );
          if (pattern.test(progressContent)) {
            updatedContent = progressContent.replace(
              pattern,
              `$1${nextAttempt}`
            );
          } else {
            // 항목이 없으면 추가
            updatedContent =
              progressContent.trimEnd() +
              `\nretry_${target}_attempts: ${nextAttempt}\n`;
          }
        } else {
          // 새 progress.md 생성
          const now = new Date().toISOString().replace(/\.\d{3}Z$/, "");
          updatedContent = [
            `# ${normalizedTaskId} Progress`,
            "",
            `Status: IN_PROGRESS`,
            `- Updated: ${now}`,
            `retry_${target}_attempts: ${nextAttempt}`,
            "",
          ].join("\n");
        }

        await fm.writeFile(progressFilePath, updatedContent);

        // Activity Log 기록
        await logWork(
          work_id,
          "MCP",
          "DISPATCH",
          `Task retry: ${normalizedTaskId} target=${target} attempt=${nextAttempt}`
        );

        const result = {
          work_id,
          task_id: normalizedTaskId,
          retry_target: target,
          attempt: nextAttempt,
          max_attempts: MAX_ATTEMPTS,
          status: "retrying",
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: message }, null, 2),
            },
          ],
        };
      }
    }
  );

  // 4. approve_task
  server.tool(
    "approve_task",
    "TASK 결과를 수동으로 승인한다 (manual 모드에서 사용).",
    {
      work_id: z.string().describe("WORK ID (예: WORK-31)"),
      task_id: z
        .string()
        .describe("TASK ID (예: TASK-01 또는 01 또는 1 모두 허용)"),
    },
    async ({ work_id, task_id }) => {
      try {
        const normalizedTaskId = normalizeTaskId(task_id);

        // result.md 존재 여부 확인
        let resultContent: string;
        try {
          resultContent = await p.readTaskResult(work_id, normalizedTaskId);
        } catch {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: `result.md가 없습니다: ${work_id}/${normalizedTaskId}`,
                    work_id,
                    task_id: normalizedTaskId,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // 사용하지 않는 변수 lint 방지용 — 실제로 내용은 존재 여부 확인에만 사용
        void resultContent;

        // Activity Log 기록
        await logWork(
          work_id,
          "MCP",
          "COMMIT",
          `Task approved: ${normalizedTaskId}`
        );

        const result = {
          work_id,
          task_id: normalizedTaskId,
          approved: true,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: message }, null, 2),
            },
          ],
        };
      }
    }
  );
}
