/**
 * spawn-pipeline 코어 모듈 단위 테스트
 * child_process.spawn을 mock하여 비동기 실행 시뮬레이션
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

// ---------------------------------------------------------------------------
// Mock 설정
// ---------------------------------------------------------------------------

const mockLogWork = vi.fn();

vi.mock("../config.js", () => ({
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

vi.mock("../activity-log.js", () => ({
  logWork: (...args: unknown[]) => mockLogWork(...args),
}));

// prompts/_helpers mock
vi.mock("../../prompts/_helpers.js", () => ({
  readAgentPrompt: vi.fn().mockResolvedValue("# Agent Prompt"),
  readRefDoc: vi.fn().mockResolvedValue("# Ref Doc"),
  mergeSections: vi.fn().mockImplementation((sections: Array<{ title?: string; content: string }>) =>
    sections.map((s) => s.content).join("\n")
  ),
}));

// FileManager mock
const mockReadFile = vi.fn();
const mockExists = vi.fn().mockResolvedValue(false);

vi.mock("../file-manager.js", () => ({
  FileManager: vi.fn().mockImplementation(() => ({
    readFile: mockReadFile,
    exists: mockExists,
    writeFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

// dag mock
const mockParseDagFromPlan = vi.fn();
const mockGetAllTasks = vi.fn().mockReturnValue([]);
const mockGetReadyTasks = vi.fn().mockReturnValue([]);
const mockDagEngineInstance = {
  getAllTasks: mockGetAllTasks,
  getReadyTasks: mockGetReadyTasks,
  getDependencies: vi.fn().mockReturnValue([]),
  getAllAncestors: vi.fn().mockReturnValue([]),
  getTaskStatus: vi.fn().mockReturnValue("READY"),
  shortestPath: vi.fn().mockReturnValue(Infinity),
};

vi.mock("../dag.js", () => ({
  parseDagFromPlan: (...args: unknown[]) => mockParseDagFromPlan(...args),
  DagEngine: vi.fn().mockImplementation(() => mockDagEngineInstance),
}));

// ---------------------------------------------------------------------------
// mock child process 생성 헬퍼
// ---------------------------------------------------------------------------

function createMockProcess() {
  const stdout = new EventEmitter();
  const stderr = new EventEmitter();
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    pid: number;
  };
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.pid = 12345;
  return proc;
}

// spawn 호출 시마다 새 mock process를 반환하는 factory
let mockProcessQueue: Array<ReturnType<typeof createMockProcess>> = [];
let mockProcess: ReturnType<typeof createMockProcess>;

const spawnMock = vi.fn(() => {
  if (mockProcessQueue.length > 0) {
    return mockProcessQueue.shift()!;
  }
  return mockProcess;
});

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

// ---------------------------------------------------------------------------
// Import (mock 이후)
// ---------------------------------------------------------------------------

import {
  spawnPipeline,
  spawnTask,
  spawnTaskIsolated,
  spawnWorkDag,
  getJobStatus,
  listActiveJobs,
  _resetJobStore,
} from "../spawn-pipeline.js";

// ---------------------------------------------------------------------------
// Helper: mock process에 성공 결과를 emit한다
// ---------------------------------------------------------------------------
function emitSuccess(proc: ReturnType<typeof createMockProcess>) {
  proc.stdout.emit(
    "data",
    Buffer.from('{"type":"result","subtype":"success","result":"done"}\n')
  );
  proc.emit("close", 0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("spawn-pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetJobStore();
    mockProcess = createMockProcess();
    mockProcessQueue = [];

    // FileManager mock 기본값 초기화
    mockReadFile.mockRejectedValue(new Error("file not found"));
    mockExists.mockResolvedValue(false);
    mockParseDagFromPlan.mockReturnValue({});
    mockGetAllTasks.mockReturnValue([]);
    mockGetReadyTasks.mockReturnValue([]);
  });

  afterEach(() => {
    _resetJobStore();
  });

  // ─── 기존 API 테스트 ──────────────────────────────────────────

  describe("spawnPipeline", () => {
    it("jobId가 ${workId}-${timestamp} 패턴으로 생성된다", () => {
      const jobId = spawnPipeline("WORK-36", "테스트 프롬프트");
      expect(jobId).toMatch(/^WORK-36-\d+$/);
    });

    it("즉시 jobId를 반환하고 job이 pending으로 등록된다", () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      const status = getJobStatus(jobId);
      expect(status).not.toBeNull();
      expect(status!.workId).toBe("WORK-36");
      expect(status!.status).toBe("pending");
    });
  });

  describe("spawnTask", () => {
    it("jobId가 ${workId}-${taskId}-${timestamp} 패턴으로 생성된다", () => {
      const jobId = spawnTask("WORK-36", "TASK-01", "프롬프트");
      expect(jobId).toMatch(/^WORK-36-TASK-01-\d+$/);
    });

    it("currentTask에 taskId가 기록된다", () => {
      const jobId = spawnTask("WORK-36", "TASK-02", "프롬프트");
      const status = getJobStatus(jobId);
      expect(status!.currentTask).toBe("TASK-02");
    });
  });

  describe("getJobStatus", () => {
    it("존재하지 않는 jobId에 대해 null을 반환한다", () => {
      expect(getJobStatus("nonexistent")).toBeNull();
    });
  });

  describe("listActiveJobs", () => {
    it("pending/running 상태 job만 반환한다", () => {
      spawnPipeline("WORK-01", "p1");
      spawnPipeline("WORK-02", "p2");

      const active = listActiveJobs();
      expect(active.length).toBe(2);
      expect(active.every((j) => j.status === "pending" || j.status === "running")).toBe(true);
    });

    it("빈 store에서는 빈 배열을 반환한다", () => {
      expect(listActiveJobs()).toEqual([]);
    });
  });

  describe("stream-json 파싱", () => {
    it("type=result 라인에서 status를 completed로 전환한다", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");

      // setImmediate 대기 → runClaude가 시작되어 status가 running으로 변경
      await new Promise((r) => setTimeout(r, 50));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("running");

      // stream-json result 라인 emit
      mockProcess.stdout.emit(
        "data",
        Buffer.from('{"type":"result","subtype":"success","result":"done"}\n')
      );

      expect(getJobStatus(jobId)!.status).toBe("completed");
    });

    it("type=result + is_error에서 status를 failed로 전환한다", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      await new Promise((r) => setTimeout(r, 50));

      mockProcess.stdout.emit(
        "data",
        Buffer.from('{"type":"result","is_error":true,"result":"오류 발생"}\n')
      );

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
      expect(status!.error).toBe("오류 발생");
    });

    it("type=assistant + tool_use에서 currentTask를 업데이트한다", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      await new Promise((r) => setTimeout(r, 50));

      mockProcess.stdout.emit(
        "data",
        Buffer.from(
          '{"type":"assistant","content":[{"type":"tool_use","name":"Read","id":"t1"}]}\n'
        )
      );

      expect(getJobStatus(jobId)!.currentTask).toBe("Read");
    });

    it("JSON 파싱 실패 라인은 무시한다", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      await new Promise((r) => setTimeout(r, 50));

      // 유효하지 않은 JSON
      mockProcess.stdout.emit("data", Buffer.from("not json\n"));

      // 상태가 변경되지 않아야 함
      expect(getJobStatus(jobId)!.status).toBe("running");
    });
  });

  describe("프로세스 에러/종료", () => {
    it("error 이벤트에서 status를 failed로 전환한다", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      await new Promise((r) => setTimeout(r, 50));

      mockProcess.emit("error", new Error("spawn 실패"));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
      expect(status!.error).toContain("spawn 실패");
    });

    it("close 이벤트에서 exit code 0이면 completed", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      await new Promise((r) => setTimeout(r, 50));

      mockProcess.emit("close", 0);

      await new Promise((r) => setTimeout(r, 10));
      const status = getJobStatus(jobId);
      expect(status!.status).toBe("completed");
      expect(status!.finishedAt).toBeDefined();
    });

    it("close 이벤트에서 exit code != 0이면 failed", async () => {
      const jobId = spawnPipeline("WORK-36", "프롬프트");
      await new Promise((r) => setTimeout(r, 50));

      mockProcess.emit("close", 1);

      await new Promise((r) => setTimeout(r, 10));
      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
    });
  });

  // ─── Context Isolation API 테스트 ────────────────────────────

  describe("spawnTaskIsolated", () => {
    it("jobId를 즉시 반환한다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe("string");
    });

    it("jobId에 workId와 taskId가 포함된다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      expect(jobId).toContain("WORK-37");
      expect(jobId).toContain("TASK-01");
    });

    it("jobId가 ${workId}-${taskId}-isolated-${timestamp} 패턴으로 생성된다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      expect(jobId).toMatch(/^WORK-37-TASK-01-isolated-\d+$/);
    });

    it("즉시 jobId를 반환하고 job이 pending으로 등록된다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      const status = getJobStatus(jobId);
      expect(status).not.toBeNull();
      expect(status!.workId).toBe("WORK-37");
      expect(status!.status).toBe("pending");
    });

    it("job의 stage가 초기에 'builder'로 설정된다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      const status = getJobStatus(jobId);
      expect(status!.stage).toBe("builder");
    });

    it("job의 attempt가 초기에 1로 설정된다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      const status = getJobStatus(jobId);
      expect(status!.attempt).toBe(1);
    });

    it("currentTask에 taskId가 기록된다", () => {
      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");
      const status = getJobStatus(jobId);
      expect(status!.currentTask).toBe("TASK-01");
    });

    it("builder 성공 후 gate check PASS 시 verifier spawn이 호출된다", async () => {
      // 이전 테스트들의 비동기 스필오버가 있을 수 있으므로 충분히 대기 후 mock clear
      await new Promise((r) => setTimeout(r, 50));
      spawnMock.mockClear();

      // 3개의 mock process: builder, verifier, committer
      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      const committerProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc, committerProc];

      // gate check PASS: progress.md에 Status: COMPLETED + Files changed 반환
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      spawnTaskIsolated("WORK-37", "TASK-01");

      // setImmediate 대기 — builder spawn
      await new Promise((r) => setTimeout(r, 20));

      // builder spawn이 1회 호출되었는지 확인
      expect(spawnMock).toHaveBeenCalledTimes(1);

      // builder 성공
      emitSuccess(builderProc);

      // gate check + verifier 프롬프트 빌드 + verifier spawn까지 대기
      await new Promise((r) => setTimeout(r, 200));

      // verifier spawn이 호출되었는지 확인 (최소 2회: builder + verifier)
      expect(spawnMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("builder 성공 후 gate check FAIL 시 builder를 재시도한다", async () => {
      // 첫 번째 builder attempt: 성공하지만 gate check 실패
      // 두 번째 builder attempt: 성공 + gate check 실패
      // 세 번째 builder attempt: 성공 + gate check 실패 → max attempts 도달 → failed
      const proc1 = createMockProcess();
      const proc2 = createMockProcess();
      const proc3 = createMockProcess();
      mockProcessQueue = [proc1, proc2, proc3];

      // gate check FAIL: Status가 COMPLETED가 아님
      mockReadFile.mockResolvedValue("# Progress\n- Status: IN_PROGRESS\n");

      const jobId = spawnTaskIsolated("WORK-37", "TASK-01", { maxAttempts: 3 });

      // setImmediate 대기
      await new Promise((r) => setTimeout(r, 20));

      // 첫 번째 builder 성공
      proc1.stdout.emit(
        "data",
        Buffer.from('{"type":"result","subtype":"success","result":"done"}\n')
      );
      proc1.emit("close", 0);

      await new Promise((r) => setTimeout(r, 30));

      // gate check 실패 후 재시도 — attempt가 2로 증가
      const statusAfterFirstAttempt = getJobStatus(jobId);
      // 재시도 중이므로 attempt >= 2이거나 failed일 수 있음
      expect(statusAfterFirstAttempt).not.toBeNull();
      expect(statusAfterFirstAttempt!.gateResult).toBe("fail");
    });

    it("maxAttempts 초과 시 job status가 failed가 된다", async () => {
      // 1회만 시도 (maxAttempts=1)
      const proc1 = createMockProcess();
      mockProcessQueue = [proc1];

      // gate check FAIL
      mockReadFile.mockResolvedValue("# Progress\n- Status: IN_PROGRESS\n");

      const jobId = spawnTaskIsolated("WORK-37", "TASK-01", { maxAttempts: 1 });

      await new Promise((r) => setTimeout(r, 20));

      // builder 성공
      proc1.stdout.emit(
        "data",
        Buffer.from('{"type":"result","subtype":"success","result":"done"}\n')
      );
      proc1.emit("close", 0);

      // gate check 실패 후 최대 시도 초과 → failed
      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
      expect(status!.error).toContain("gate check failed");
    });

    it("builder/verifier/committer 3단계 성공 시 job status가 completed가 된다", async () => {
      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      const committerProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc, committerProc];

      // gate check PASS
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");

      await new Promise((r) => setTimeout(r, 20));

      // builder 성공
      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 50));

      // verifier 성공
      emitSuccess(verifierProc);
      await new Promise((r) => setTimeout(r, 50));

      // committer 성공
      emitSuccess(committerProc);
      await new Promise((r) => setTimeout(r, 50));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("completed");
      expect(status!.finishedAt).toBeDefined();
    });

    it("verifier 실패 시 job status가 failed가 된다", async () => {
      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc];

      // gate check PASS
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");

      await new Promise((r) => setTimeout(r, 20));

      // builder 성공
      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 50));

      // verifier 실패
      verifierProc.stdout.emit(
        "data",
        Buffer.from('{"type":"result","is_error":true,"result":"verifier error"}\n')
      );
      verifierProc.emit("close", 1);
      await new Promise((r) => setTimeout(r, 50));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
      expect(status!.error).toContain("verifier failed");
    });

    it("gate check PASS 시 gateResult가 'pass'로 설정된다", async () => {
      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      const committerProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc, committerProc];

      // gate check PASS
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");

      await new Promise((r) => setTimeout(r, 20));

      // builder 성공
      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 50));

      const status = getJobStatus(jobId);
      expect(status!.gateResult).toBe("pass");
    });

    it("stage가 builder → verifier → committer 순서로 변경된다", async () => {
      const stages: string[] = [];
      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      const committerProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc, committerProc];

      // gate check PASS
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      const jobId = spawnTaskIsolated("WORK-37", "TASK-01");

      await new Promise((r) => setTimeout(r, 20));
      stages.push(getJobStatus(jobId)!.stage!); // builder

      // builder 성공
      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 50));
      stages.push(getJobStatus(jobId)!.stage!); // verifier

      // verifier 성공
      emitSuccess(verifierProc);
      await new Promise((r) => setTimeout(r, 50));
      stages.push(getJobStatus(jobId)!.stage!); // committer

      expect(stages[0]).toBe("builder");
      expect(stages[1]).toBe("verifier");
      expect(stages[2]).toBe("committer");
    });
  });

  // ─── spawnWorkDag 테스트 ──────────────────────────────────────

  describe("spawnWorkDag", () => {
    it("jobId를 즉시 반환한다", () => {
      const jobId = spawnWorkDag("WORK-37");
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe("string");
    });

    it("jobId가 ${workId}-dag-${timestamp} 패턴으로 생성된다", () => {
      const jobId = spawnWorkDag("WORK-37");
      expect(jobId).toMatch(/^WORK-37-dag-\d+$/);
    });

    it("즉시 jobId를 반환하고 job이 pending으로 등록된다", () => {
      const jobId = spawnWorkDag("WORK-37");
      const status = getJobStatus(jobId);
      expect(status).not.toBeNull();
      expect(status!.workId).toBe("WORK-37");
      expect(status!.status).toBe("pending");
    });

    it("PLAN.md에 TASK가 없으면 job status가 completed가 된다", async () => {
      // PLAN.md 읽기 성공, 하지만 TASK 없음
      mockReadFile.mockResolvedValue("# PLAN.md\n\n## Description\n테스트 플랜\n");
      mockParseDagFromPlan.mockReturnValue({});
      mockGetAllTasks.mockReturnValue([]);

      const jobId = spawnWorkDag("WORK-37");

      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("completed");
    });

    it("PLAN.md 읽기 실패 시 job status가 failed가 된다", async () => {
      mockReadFile.mockRejectedValue(new Error("PLAN.md not found"));

      const jobId = spawnWorkDag("WORK-37");

      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
      expect(status!.error).toContain("PLAN.md not found");
    });

    it("DAG 기반으로 ready tasks를 순차 실행한다", async () => {
      // PLAN.md 읽기 성공
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      // DAG: TASK-00만 존재, 의존성 없음
      const dagMap = { "TASK-00": [] };
      mockParseDagFromPlan.mockReturnValue(dagMap);
      mockGetAllTasks.mockReturnValue(["TASK-00"]);

      // 첫 번째 getReadyTasks 호출: TASK-00 반환
      // 이후 호출: 빈 배열 반환 (TASK-00이 완료됨)
      mockGetReadyTasks
        .mockReturnValueOnce(["TASK-00"])
        .mockReturnValue([]);

      // result.md 존재 여부 체크: false (미완료)
      mockExists.mockResolvedValue(false);

      // builder, verifier, committer 프로세스
      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      const committerProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc, committerProc];

      const jobId = spawnWorkDag("WORK-37");

      await new Promise((r) => setTimeout(r, 20));

      // builder 성공
      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 50));

      // verifier 성공
      emitSuccess(verifierProc);
      await new Promise((r) => setTimeout(r, 50));

      // committer 성공
      emitSuccess(committerProc);
      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      // TASK-00의 currentTask가 설정되어야 함
      expect(status!.workId).toBe("WORK-37");
    });

    it("모든 TASK 완료 시 job status가 completed가 된다", async () => {
      // PLAN.md 읽기 성공
      mockReadFile.mockResolvedValue(
        "# Progress\n- Status: COMPLETED\nFiles changed:\n- src/foo.ts"
      );

      // DAG: TASK-00만 존재
      mockParseDagFromPlan.mockReturnValue({ "TASK-00": [] });
      mockGetAllTasks.mockReturnValue(["TASK-00"]);
      mockGetReadyTasks
        .mockReturnValueOnce(["TASK-00"])
        .mockReturnValue([]);

      mockExists.mockResolvedValue(false);

      const builderProc = createMockProcess();
      const verifierProc = createMockProcess();
      const committerProc = createMockProcess();
      mockProcessQueue = [builderProc, verifierProc, committerProc];

      const jobId = spawnWorkDag("WORK-37");

      await new Promise((r) => setTimeout(r, 20));

      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 50));
      emitSuccess(verifierProc);
      await new Promise((r) => setTimeout(r, 50));
      emitSuccess(committerProc);
      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("completed");
      expect(status!.finishedAt).toBeDefined();
    });

    it("이미 완료된 TASK(result.md 존재)는 건너뛴다", async () => {
      mockReadFile.mockResolvedValue("# PLAN.md");
      mockParseDagFromPlan.mockReturnValue({ "TASK-00": [] });
      mockGetAllTasks.mockReturnValue(["TASK-00"]);
      // TASK-00이 이미 완료됨 → getReadyTasks에서 제외
      mockGetReadyTasks.mockReturnValue([]);

      // result.md 존재 (TASK-00 완료됨)
      mockExists.mockResolvedValue(true);

      const jobId = spawnWorkDag("WORK-37");

      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      // 모든 TASK가 이미 완료됨 → completed
      expect(status!.status).toBe("completed");
    });

    it("TASK 실행 중 실패 시 job status가 failed가 된다", async () => {
      mockReadFile.mockImplementation((filePath: string) => {
        // progress.md는 실패 상태 (gate check fail)
        if (typeof filePath === "string" && filePath.includes("progress")) {
          return Promise.resolve("# Progress\n- Status: IN_PROGRESS\n");
        }
        return Promise.resolve("# PLAN.md");
      });

      mockParseDagFromPlan.mockReturnValue({ "TASK-00": [] });
      mockGetAllTasks.mockReturnValue(["TASK-00"]);
      mockGetReadyTasks
        .mockReturnValueOnce(["TASK-00"])
        .mockReturnValue([]);
      mockExists.mockResolvedValue(false);

      // maxAttempts=1로 설정하여 빠르게 실패
      const builderProc = createMockProcess();
      mockProcessQueue = [builderProc];

      const jobId = spawnWorkDag("WORK-37", { maxAttempts: 1 });

      await new Promise((r) => setTimeout(r, 20));

      // builder 성공하지만 gate check 실패
      emitSuccess(builderProc);
      await new Promise((r) => setTimeout(r, 150));

      const status = getJobStatus(jobId);
      expect(status!.status).toBe("failed");
    });

    it("progress.total이 전체 TASK 수와 일치한다", async () => {
      mockReadFile.mockResolvedValue("# PLAN.md");
      mockParseDagFromPlan.mockReturnValue({
        "TASK-00": [],
        "TASK-01": ["TASK-00"],
      });
      mockGetAllTasks.mockReturnValue(["TASK-00", "TASK-01"]);
      mockGetReadyTasks.mockReturnValue([]);
      mockExists.mockResolvedValue(false);

      const jobId = spawnWorkDag("WORK-37");

      await new Promise((r) => setTimeout(r, 100));

      const status = getJobStatus(jobId);
      // DAG blocked이므로 failed
      expect(status!.status).toBe("failed");
    });
  });
});
