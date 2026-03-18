/**
 * Pipeline Tools 테스트
 * execute_work의 비동기 전환(job_id 반환) + get_job_status 도구 등록 확인
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPipelineTools } from "../pipeline.js";
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

vi.mock("../../core/execution-mode.js", () => ({
  determineExecutionMode: vi.fn().mockResolvedValue({
    mode: "full",
    reason: "테스트",
  }),
}));

const mockSpawnWorkDag = vi.fn().mockReturnValue("WORK-36-dag-1234567890");
const mockGetJobStatus = vi.fn().mockReturnValue(null);
const mockListActiveJobs = vi.fn().mockReturnValue([]);

vi.mock("../../core/spawn-pipeline.js", () => ({
  spawnWorkDag: (...args: unknown[]) => mockSpawnWorkDag(...args),
  getJobStatus: (...args: unknown[]) => mockGetJobStatus(...args),
  listActiveJobs: (...args: unknown[]) => mockListActiveJobs(...args),
}));

vi.mock("../../core/file-manager.js", () => ({
  FileManager: vi.fn().mockImplementation(() => ({
    readFile: vi.fn().mockResolvedValue(""),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
    mkdir: vi.fn(),
    listDir: vi.fn().mockResolvedValue([]),
  })),
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

describe("Pipeline Tools", () => {
  let server: ReturnType<typeof createTestServer>;
  let mockParser: WorkParser;

  beforeEach(() => {
    vi.clearAllMocks();
    server = createTestServer();

    mockParser = {
      readPlan: vi.fn().mockResolvedValue({
        rawContent: "## Tasks\n### TASK-00\n- Depends: none\n### TASK-01\n- Depends: TASK-00",
      }),
      extractExecutionMode: vi.fn().mockReturnValue("full"),
      extractTasksFromPlan: vi.fn().mockReturnValue([
        { taskId: "TASK-00" },
        { taskId: "TASK-01" },
      ]),
      getWorkStatus: vi.fn().mockResolvedValue({ totalTasks: 2 }),
      readTaskResult: vi.fn().mockRejectedValue(new Error("not found")),
      getNextWorkId: vi.fn().mockResolvedValue("WORK-37"),
      addToWorkList: vi.fn(),
      readTaskProgress: vi.fn().mockRejectedValue(new Error("not found")),
    } as unknown as WorkParser;

    registerPipelineTools(server, mockParser);
  });

  describe("도구 등록", () => {
    it("5개 도구가 등록된다", () => {
      expect(server._tools.size).toBe(5);
    });

    it("get_job_status가 등록되어 있다", () => {
      expect(server._tools.has("get_job_status")).toBe(true);
    });
  });

  describe("execute_work", () => {
    it("spawnWorkDag를 호출하여 job_id를 반환한다", async () => {
      const handler = server._tools.get("execute_work")!;
      const result = await handler({ work_id: "WORK-36", mode: "auto" });

      const data = JSON.parse(result.content[0].text);
      expect(data.job_id).toBe("WORK-36-dag-1234567890");
      expect(data.status).toBe("spawned");
      expect(mockSpawnWorkDag).toHaveBeenCalledOnce();
    });
  });

  describe("get_job_status", () => {
    it("list_all: true로 전체 활성 job 목록을 반환한다", async () => {
      mockListActiveJobs.mockReturnValue([
        { jobId: "WORK-36-123", status: "running" },
      ]);

      const handler = server._tools.get("get_job_status")!;
      const result = await handler({ list_all: true });

      const data = JSON.parse(result.content[0].text);
      expect(data.active_jobs).toHaveLength(1);
      expect(data.count).toBe(1);
      expect(mockListActiveJobs).toHaveBeenCalledOnce();
    });

    it("job_id 지정 시 해당 JobStatus를 반환한다", async () => {
      mockGetJobStatus.mockReturnValue({
        jobId: "WORK-36-123",
        workId: "WORK-36",
        status: "running",
        pid: 12345,
      });

      const handler = server._tools.get("get_job_status")!;
      const result = await handler({ job_id: "WORK-36-123", list_all: false });

      const data = JSON.parse(result.content[0].text);
      expect(data.jobId).toBe("WORK-36-123");
      expect(data.status).toBe("running");
    });

    it("job_id도 list_all도 없으면 오류를 반환한다", async () => {
      const handler = server._tools.get("get_job_status")!;
      const result = await handler({ list_all: false });

      expect(result.isError).toBe(true);
    });

    it("존재하지 않는 job_id에 대해 오류를 반환한다", async () => {
      mockGetJobStatus.mockReturnValue(null);

      const handler = server._tools.get("get_job_status")!;
      const result = await handler({ job_id: "nonexistent", list_all: false });

      expect(result.isError).toBe(true);
    });
  });
});
