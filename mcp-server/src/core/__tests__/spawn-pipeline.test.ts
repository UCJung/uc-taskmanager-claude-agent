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

// mock child process 생성 헬퍼
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

let mockProcess: ReturnType<typeof createMockProcess>;

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => mockProcess),
}));

// ---------------------------------------------------------------------------
// Import (mock 이후)
// ---------------------------------------------------------------------------

import {
  spawnPipeline,
  spawnTask,
  getJobStatus,
  listActiveJobs,
  _resetJobStore,
} from "../spawn-pipeline.js";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("spawn-pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetJobStore();
    mockProcess = createMockProcess();
  });

  afterEach(() => {
    _resetJobStore();
  });

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
});
