/**
 * Monitor Tools — 상태 조회 도구 4개를 MCP Tool로 등록한다.
 *
 * 등록 도구:
 *   1. list_works       — 전체 WORK 목록 + 진행률
 *   2. get_work_status  — 특정 WORK 상세 상태
 *   3. get_task_result  — TASK result.md 내용 조회
 *   4. get_pipeline_log — Activity Log 조회
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WorkParser } from "../core/work-parser.js";

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
// registerMonitorTools
// ---------------------------------------------------------------------------

/**
 * McpServer에 Monitor Tools 4개를 등록한다.
 *
 * @param server McpServer 인스턴스
 * @param parser 테스트 주입용 WorkParser (생략 시 싱글톤 사용)
 */
export function registerMonitorTools(
  server: McpServer,
  parser?: WorkParser
): void {
  const p = parser ?? getParser();

  // 1. list_works
  server.tool(
    "list_works",
    "전체 WORK 목록과 각 WORK의 진행률(완료/전체 TASK 수)을 반환한다.",
    {},
    async () => {
      const works = await p.listWorks();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ works }, null, 2),
          },
        ],
      };
    }
  );

  // 2. get_work_status
  server.tool(
    "get_work_status",
    "특정 WORK의 상세 상태를 반환한다. 진행률, execution_mode, TASK 상태 목록을 포함한다.",
    {
      work_id: z.string().describe("조회할 WORK ID (예: WORK-31)"),
    },
    async ({ work_id }) => {
      // WorkStatus (파일시스템 기반 진행률)
      const status = await p.getWorkStatus(work_id);

      // PLAN.md에서 execution_mode 파싱
      let executionMode = "unknown";
      let tasks: { taskId: string; title: string; status: string }[] = [];
      try {
        const plan = await p.readPlan(work_id);
        executionMode = p.extractExecutionMode(plan);

        // PLAN.md에서 TASK 목록 추출
        const taskSummaries = p.extractTasksFromPlan(plan.rawContent);

        // 각 TASK의 완료 여부를 result 파일 존재 여부로 판단
        tasks = await Promise.all(
          taskSummaries.map(async (t) => {
            let taskStatus = "PENDING";
            try {
              await p.readTaskResult(work_id, t.taskId);
              taskStatus = "COMPLETED";
            } catch {
              // result.md 없으면 PENDING
              try {
                const progressContent = await p.readTaskProgress(
                  work_id,
                  t.taskId
                );
                if (/Status:\s*IN_PROGRESS/i.test(progressContent)) {
                  taskStatus = "IN_PROGRESS";
                } else if (/Status:\s*STARTED/i.test(progressContent)) {
                  taskStatus = "STARTED";
                }
              } catch {
                // progress.md도 없으면 PENDING 유지
              }
            }
            return { taskId: t.taskId, title: t.title, status: taskStatus };
          })
        );
      } catch {
        // PLAN.md 읽기 실패 시 기본값 유지
      }

      const result = {
        work_id,
        progress: status.progress,
        execution_mode: executionMode,
        total_tasks: status.totalTasks,
        completed_tasks: status.completedTasks,
        approved: status.approved,
        tasks,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // 3. get_task_result
  server.tool(
    "get_task_result",
    "특정 TASK의 result.md 내용을 조회한다. 파일이 없으면 오류 메시지를 반환한다.",
    {
      work_id: z.string().describe("WORK ID (예: WORK-31)"),
      task_id: z
        .string()
        .describe("TASK ID (예: TASK-01 또는 01 또는 1 모두 허용)"),
    },
    async ({ work_id, task_id }) => {
      let content: string;
      let isError = false;

      try {
        content = await p.readTaskResult(work_id, task_id);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : String(err);
        content = `result.md를 찾을 수 없습니다: ${work_id}/${task_id}\n원인: ${message}`;
        isError = true;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: isError
              ? JSON.stringify({ error: content }, null, 2)
              : JSON.stringify({ work_id, task_id, content }, null, 2),
          },
        ],
      };
    }
  );

  // 4. get_pipeline_log
  server.tool(
    "get_pipeline_log",
    "특정 WORK의 Activity Log를 파싱하여 구조화된 엔트리 배열로 반환한다. last_n 지정 시 마지막 N개만 반환한다.",
    {
      work_id: z.string().describe("WORK ID (예: WORK-31)"),
      last_n: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("마지막 N개 항목만 반환 (생략 시 전체)"),
    },
    async ({ work_id, last_n }) => {
      const entries = await p.parseActivityLog(work_id, last_n);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ work_id, total: entries.length, entries }, null, 2),
          },
        ],
      };
    }
  );
}
