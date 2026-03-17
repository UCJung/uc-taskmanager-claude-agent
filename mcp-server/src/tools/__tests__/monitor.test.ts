/**
 * Monitor Tools 단위 테스트
 * WorkParser를 mock하여 파일시스템 독립 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMonitorTools } from "../monitor.js";
import { WorkParser } from "../../core/work-parser.js";
import type {
  WorkSummary,
  WorkStatus,
  LogEntry,
} from "../../core/work-parser.js";

// ---------------------------------------------------------------------------
// config mock
// ---------------------------------------------------------------------------
vi.mock("../../core/config.js", () => ({
  getConfig: () => ({
    projectRoot: "/project",
    worksDir: "/project/works",
    agentsDir: "/project/agents",
    globalAgentsDir: "/home/.claude/agents",
    agentConfigDir: "/project/.agent",
    serverName: "uc-taskmanager",
    serverVersion: "1.1.0",
  }),
}));

// ---------------------------------------------------------------------------
// 헬퍼: WorkParser mock 생성
// ---------------------------------------------------------------------------
function createMockParser(overrides: Partial<WorkParser> = {}): WorkParser {
  return {
    listWorks: vi.fn(),
    getWorkStatus: vi.fn(),
    readPlan: vi.fn(),
    extractExecutionMode: vi.fn(),
    extractTasksFromPlan: vi.fn(),
    readTaskResult: vi.fn(),
    readTaskProgress: vi.fn(),
    parseActivityLog: vi.fn(),
    getNextWorkId: vi.fn(),
    detectTechStack: vi.fn(),
    addToWorkList: vi.fn(),
    updateWorkListStatus: vi.fn(),
    getNextExecutableTask: vi.fn(),
    ...overrides,
  } as unknown as WorkParser;
}

// ---------------------------------------------------------------------------
// 헬퍼: 도구 핸들러 직접 호출
// McpServer._registeredTools는 private이므로 server.tool spy로 핸들러를 캡처한다.
// ---------------------------------------------------------------------------
type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
}>;

function captureTools(server: McpServer): Map<string, ToolHandler> {
  const captured = new Map<string, ToolHandler>();
  const spy = vi.spyOn(server, "tool" as keyof McpServer).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => {
      const name: string = args[0];
      // tool(name, desc, shape, handler) — 4인자 형태
      const handler = args[args.length - 1] as ToolHandler;
      captured.set(name, handler);
      return server; // 반환값은 사용되지 않음
    }
  );
  return { captured, spy } as unknown as Map<string, ToolHandler>;
}

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

describe("registerMonitorTools", () => {
  let server: McpServer;
  let capturedTools: Map<string, ToolHandler>;
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    server = new McpServer({ name: "test", version: "0.0.0" });
    capturedTools = new Map();
    spy = vi.spyOn(server, "tool" as keyof McpServer).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (...args: any[]) => {
        const name: string = args[0];
        const handler = args[args.length - 1] as ToolHandler;
        capturedTools.set(name, handler);
        return server;
      }
    );
  });

  it("5개 도구를 등록한다", () => {
    const parser = createMockParser();
    registerMonitorTools(server, parser);
    expect(spy).toHaveBeenCalledTimes(5);
    expect(capturedTools.has("list_works")).toBe(true);
    expect(capturedTools.has("get_work_status")).toBe(true);
    expect(capturedTools.has("get_task_result")).toBe(true);
    expect(capturedTools.has("get_pipeline_log")).toBe(true);
    expect(capturedTools.has("sync_callbacks")).toBe(true);
  });

  // -----------------------------------------------------------------------
  // list_works
  // -----------------------------------------------------------------------
  describe("list_works", () => {
    it("WORK 목록을 JSON으로 반환한다", async () => {
      const works: WorkSummary[] = [
        {
          id: "WORK-31",
          title: "MCP Server",
          status: "IN_PROGRESS",
          createdAt: "2026-03-18",
          completed: 2,
          total: 5,
        },
        {
          id: "WORK-30",
          title: "이전 WORK",
          status: "COMPLETED",
          createdAt: "2026-03-10",
          completed: 3,
          total: 3,
        },
      ];
      const parser = createMockParser({
        listWorks: vi.fn().mockResolvedValue(works),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("list_works")!;
      const result = await handler({});
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.works).toHaveLength(2);
      expect(parsed.works[0].id).toBe("WORK-31");
      expect(parsed.works[1].id).toBe("WORK-30");
    });

    it("WORK가 없으면 빈 배열을 반환한다", async () => {
      const parser = createMockParser({
        listWorks: vi.fn().mockResolvedValue([]),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("list_works")!;
      const result = await handler({});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.works).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // get_work_status
  // -----------------------------------------------------------------------
  describe("get_work_status", () => {
    it("progress, execution_mode, tasks 상태를 반환한다", async () => {
      const workStatus: WorkStatus = {
        workId: "WORK-31",
        totalTasks: 5,
        completedTasks: 2,
        progress: "2/5",
        approved: false,
      };
      const planMock = {
        workId: "WORK-31",
        title: "MCP Server",
        meta: {
          created: "2026-03-18",
          requirements: "N/A",
          executionMode: "full",
          project: "uc-taskmanager",
          techStack: "Node.js",
          language: "ko",
          status: "IN_PROGRESS",
        },
        goal: "MCP 서버 구현",
        rawContent:
          "# WORK-31: MCP Server\n> Execution-Mode: full\n## Tasks\n### TASK-00: 초기화\n### TASK-01: 코어\n### TASK-02: 모니터\n",
      };
      const parser = createMockParser({
        getWorkStatus: vi.fn().mockResolvedValue(workStatus),
        readPlan: vi.fn().mockResolvedValue(planMock),
        extractExecutionMode: vi.fn().mockReturnValue("full"),
        extractTasksFromPlan: vi.fn().mockReturnValue([
          { taskId: "TASK-00", num: 0, title: "초기화" },
          { taskId: "TASK-01", num: 1, title: "코어" },
          { taskId: "TASK-02", num: 2, title: "모니터" },
        ]),
        readTaskResult: vi
          .fn()
          .mockImplementation((workId: string, taskId: string) => {
            // TASK-00, TASK-01은 완료
            if (taskId === "TASK-00" || taskId === "TASK-01") {
              return Promise.resolve("## Summary\n완료");
            }
            return Promise.reject(new Error("not found"));
          }),
        readTaskProgress: vi.fn().mockRejectedValue(new Error("not found")),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_work_status")!;
      const result = await handler({ work_id: "WORK-31" });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.work_id).toBe("WORK-31");
      expect(parsed.progress).toBe("2/5");
      expect(parsed.execution_mode).toBe("full");
      expect(parsed.total_tasks).toBe(5);
      expect(parsed.completed_tasks).toBe(2);
      expect(parsed.tasks).toHaveLength(3);

      const task00 = parsed.tasks.find(
        (t: { taskId: string }) => t.taskId === "TASK-00"
      );
      expect(task00.status).toBe("COMPLETED");

      const task02 = parsed.tasks.find(
        (t: { taskId: string }) => t.taskId === "TASK-02"
      );
      expect(task02.status).toBe("PENDING");
    });

    it("IN_PROGRESS 상태의 TASK를 올바르게 감지한다", async () => {
      const workStatus: WorkStatus = {
        workId: "WORK-31",
        totalTasks: 2,
        completedTasks: 0,
        progress: "0/2",
        approved: false,
      };
      const planMock = {
        workId: "WORK-31",
        title: "Test",
        meta: {
          created: "",
          requirements: "",
          executionMode: "pipeline",
          project: "",
          techStack: "",
          language: "ko",
          status: "",
        },
        goal: "",
        rawContent:
          "### TASK-00: 초기화\n### TASK-01: 구현\n",
      };
      const parser = createMockParser({
        getWorkStatus: vi.fn().mockResolvedValue(workStatus),
        readPlan: vi.fn().mockResolvedValue(planMock),
        extractExecutionMode: vi.fn().mockReturnValue("pipeline"),
        extractTasksFromPlan: vi.fn().mockReturnValue([
          { taskId: "TASK-00", num: 0, title: "초기화" },
          { taskId: "TASK-01", num: 1, title: "구현" },
        ]),
        readTaskResult: vi.fn().mockRejectedValue(new Error("not found")),
        readTaskProgress: vi
          .fn()
          .mockImplementation((workId: string, taskId: string) => {
            if (taskId === "TASK-00") {
              return Promise.resolve("# TASK-00 Progress\n- Status: IN_PROGRESS\n");
            }
            return Promise.reject(new Error("not found"));
          }),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_work_status")!;
      const result = await handler({ work_id: "WORK-31" });
      const parsed = JSON.parse(result.content[0].text);

      const task00 = parsed.tasks.find(
        (t: { taskId: string }) => t.taskId === "TASK-00"
      );
      expect(task00.status).toBe("IN_PROGRESS");
    });

    it("PLAN.md 읽기 실패 시 기본값으로 반환한다", async () => {
      const workStatus: WorkStatus = {
        workId: "WORK-31",
        totalTasks: 0,
        completedTasks: 0,
        progress: "0/0",
        approved: false,
      };
      const parser = createMockParser({
        getWorkStatus: vi.fn().mockResolvedValue(workStatus),
        readPlan: vi.fn().mockRejectedValue(new Error("PLAN.md not found")),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_work_status")!;
      const result = await handler({ work_id: "WORK-99" });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.execution_mode).toBe("unknown");
      expect(parsed.tasks).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // get_task_result
  // -----------------------------------------------------------------------
  describe("get_task_result", () => {
    it("존재하는 result.md 내용을 반환한다", async () => {
      const content = "# TASK-01 Result\n## Summary\n구현 완료";
      const parser = createMockParser({
        readTaskResult: vi.fn().mockResolvedValue(content),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_task_result")!;
      const result = await handler({ work_id: "WORK-31", task_id: "TASK-01" });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.work_id).toBe("WORK-31");
      expect(parsed.task_id).toBe("TASK-01");
      expect(parsed.content).toBe(content);
    });

    it("result.md가 없으면 error 키를 포함한 JSON을 반환한다", async () => {
      const parser = createMockParser({
        readTaskResult: vi
          .fn()
          .mockRejectedValue(new Error("ENOENT: no such file")),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_task_result")!;
      const result = await handler({ work_id: "WORK-31", task_id: "TASK-99" });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed).toHaveProperty("error");
      expect(parsed.error).toContain("result.md를 찾을 수 없습니다");
    });

    it("task_id를 숫자 형식으로 전달해도 동작한다", async () => {
      const parser = createMockParser({
        readTaskResult: vi
          .fn()
          .mockResolvedValue("## Summary\n완료"),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_task_result")!;
      await handler({ work_id: "WORK-31", task_id: "01" });
      expect(parser.readTaskResult).toHaveBeenCalledWith("WORK-31", "01");
    });
  });

  // -----------------------------------------------------------------------
  // get_pipeline_log
  // -----------------------------------------------------------------------
  describe("get_pipeline_log", () => {
    const sampleEntries: LogEntry[] = [
      {
        timestamp: "2026-03-18T10:00:00",
        agent: "BUILDER",
        stage: "STARTED",
        description: "TASK-01 시작",
        raw: "[2026-03-18T10:00:00]_BUILDER_STARTED_TASK-01 시작",
      },
      {
        timestamp: "2026-03-18T10:30:00",
        agent: "BUILDER",
        stage: "COMPLETED",
        description: "TASK-01 완료",
        raw: "[2026-03-18T10:30:00]_BUILDER_COMPLETED_TASK-01 완료",
      },
    ];

    it("전체 로그 엔트리를 반환한다", async () => {
      const parser = createMockParser({
        parseActivityLog: vi.fn().mockResolvedValue(sampleEntries),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_pipeline_log")!;
      const result = await handler({ work_id: "WORK-31" });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.work_id).toBe("WORK-31");
      expect(parsed.total).toBe(2);
      expect(parsed.entries).toHaveLength(2);
      expect(parsed.entries[0].agent).toBe("BUILDER");
      expect(parsed.entries[0].stage).toBe("STARTED");
      expect(parser.parseActivityLog).toHaveBeenCalledWith("WORK-31", undefined);
    });

    it("last_n 지정 시 마지막 N개 엔트리만 반환한다", async () => {
      const parser = createMockParser({
        parseActivityLog: vi.fn().mockResolvedValue([sampleEntries[1]]),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_pipeline_log")!;
      const result = await handler({ work_id: "WORK-31", last_n: 1 });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.total).toBe(1);
      expect(parsed.entries[0].stage).toBe("COMPLETED");
      expect(parser.parseActivityLog).toHaveBeenCalledWith("WORK-31", 1);
    });

    it("로그 파일이 없으면 빈 배열을 반환한다", async () => {
      const parser = createMockParser({
        parseActivityLog: vi.fn().mockResolvedValue([]),
      });
      registerMonitorTools(server, parser);

      const handler = capturedTools.get("get_pipeline_log")!;
      const result = await handler({ work_id: "WORK-99" });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.entries).toEqual([]);
      expect(parsed.total).toBe(0);
    });
  });
});
