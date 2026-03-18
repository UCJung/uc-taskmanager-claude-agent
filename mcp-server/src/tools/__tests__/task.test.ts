/**
 * Task Tools 테스트
 * execute_task의 비동기 전환(job_id 반환) + spawnTaskIsolated 파라미터 확인
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTaskTools } from "../task.js";
import { WorkParser } from "../../core/work-parser.js";

// ---------------------------------------------------------------------------
// Mock 설정
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

vi.mock("../../core/activity-log.js", () => ({
  logWork: vi.fn(),
}));

const mockSpawnTaskIsolated = vi.fn().mockReturnValue("WORK-36-TASK-00-isolated-1234567890");

vi.mock("../../core/spawn-pipeline.js", () => ({
  spawnTaskIsolated: (...args: unknown[]) => mockSpawnTaskIsolated(...args),
}));

vi.mock("../../core/file-manager.js", () => ({
  FileManager: vi.fn().mockImplementation(() => ({
    readFile: vi.fn().mockResolvedValue("# TASK-00 spec\nScope: 테스트"),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
    mkdir: vi.fn(),
    listDir: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("../../core/context-window.js", () => ({
  applyTaskDependencyWindow: vi.fn().mockReturnValue("windowed context"),
  extractContextHandoffFromResult: vi.fn().mockReturnValue(null),
}));

vi.mock("../../core/dag.js", () => ({
  DagEngine: vi.fn().mockImplementation(() => ({
    getAllTasks: vi.fn().mockReturnValue(["TASK-00", "TASK-01"]),
    getReadyTasks: vi.fn().mockReturnValue(["TASK-00"]),
    getAllAncestors: vi.fn().mockReturnValue([]),
    shortestPath: vi.fn().mockReturnValue(1),
  })),
  parseDagFromPlan: vi.fn().mockReturnValue(
    new Map([
      ["TASK-00", []],
      ["TASK-01", ["TASK-00"]],
    ])
  ),
}));

// ---------------------------------------------------------------------------
// 테스트용 server 도구 호출 헬퍼
// ---------------------------------------------------------------------------

function createTestServer(): McpServer & { _tools: Map<string, Function> } {
  const tools = new Map<string, Function>();
  const server = {
    tool: (name: string, _desc: string, _schema: unknown, handler: Function) => {
      tools.set(name, handler);
    },
    _tools: tools,
  } as unknown as McpServer & { _tools: Map<string, Function> };
  return server;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Task Tools", () => {
  let server: ReturnType<typeof createTestServer>;
  let mockParser: WorkParser;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createTestServer();

    mockParser = {
      readPlan: vi.fn().mockResolvedValue({
        rawContent: "## Tasks\n### TASK-00\n- Depends: none",
      }),
      extractExecutionMode: vi.fn().mockReturnValue("full"),
      extractTasksFromPlan: vi.fn().mockReturnValue([{ taskId: "TASK-00" }]),
      getWorkStatus: vi.fn().mockResolvedValue({ totalTasks: 1 }),
      readTaskResult: vi.fn().mockRejectedValue(new Error("not found")),
      readTaskProgress: vi.fn().mockRejectedValue(new Error("not found")),
      getNextWorkId: vi.fn().mockResolvedValue("WORK-37"),
      addToWorkList: vi.fn(),
    } as unknown as WorkParser;

    registerTaskTools(server, mockParser);
  });

  describe("execute_task", () => {
    it("spawnTaskIsolated를 호출하여 job_id를 반환한다", async () => {
      const handler = server._tools.get("execute_task")!;
      const result = await handler({
        work_id: "WORK-36",
        task_id: "TASK-00",
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.job_id).toBe("WORK-36-TASK-00-isolated-1234567890");
      expect(data.status).toBe("spawned");
    });

    it("반환 status가 spawned이다", async () => {
      const handler = server._tools.get("execute_task")!;
      const result = await handler({
        work_id: "WORK-36",
        task_id: "00",
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe("spawned");
    });

    it("workId와 taskId가 spawnTaskIsolated에 전달된다", async () => {
      const handler = server._tools.get("execute_task")!;
      await handler({
        work_id: "WORK-36",
        task_id: "TASK-01",
      });

      expect(mockSpawnTaskIsolated).toHaveBeenCalledWith(
        "WORK-36",
        "TASK-01",
        expect.objectContaining({ cwd: "/project" })
      );
    });

    it("spawnTaskIsolated가 정확히 1회 호출된다", async () => {
      const handler = server._tools.get("execute_task")!;
      await handler({
        work_id: "WORK-36",
        task_id: "TASK-00",
      });

      expect(mockSpawnTaskIsolated).toHaveBeenCalledOnce();
    });

    it("task_id를 숫자로 전달해도 TASK-NN 형식으로 정규화된다", async () => {
      const handler = server._tools.get("execute_task")!;
      const result = await handler({
        work_id: "WORK-36",
        task_id: "1",
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.task_id).toBe("TASK-01");
    });
  });
});
