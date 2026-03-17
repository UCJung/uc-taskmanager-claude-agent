/**
 * activity-log 모듈 단위 테스트
 * FileManager를 mock하여 파일시스템 독립 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logWork, STAGE_TABLE, type Stage } from "../activity-log.js";

// ---------------------------------------------------------------------------
// Mock 설정
// ---------------------------------------------------------------------------

const mockAppendFile = vi.fn();

vi.mock("../file-manager.js", () => ({
  FileManager: vi.fn().mockImplementation(() => ({
    appendFile: mockAppendFile,
  })),
}));

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

// ---------------------------------------------------------------------------
// STAGE_TABLE
// ---------------------------------------------------------------------------

describe("STAGE_TABLE", () => {
  it("필수 스테이지가 모두 포함된다", () => {
    expect(STAGE_TABLE).toContain("INIT");
    expect(STAGE_TABLE).toContain("REF");
    expect(STAGE_TABLE).toContain("PLAN");
    expect(STAGE_TABLE).toContain("IMPL");
    expect(STAGE_TABLE).toContain("BUILD");
    expect(STAGE_TABLE).toContain("COMMIT");
    expect(STAGE_TABLE).toContain("DISPATCH");
  });

  it("7개 스테이지가 있다", () => {
    expect(STAGE_TABLE).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// logWork
// ---------------------------------------------------------------------------

describe("logWork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ISO timestamp 일관성을 위해 Date mock
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-18T10:25:00.000Z"));
  });

  it("올바른 경로로 appendFile을 호출한다", async () => {
    await logWork("WORK-31", "BUILDER", "IMPL", "FileManager 구현 시작");

    expect(mockAppendFile).toHaveBeenCalledOnce();
    const [filePath] = mockAppendFile.mock.calls[0] as [string, string];
    // Windows/Unix 경로 모두 허용
    expect(filePath.replace(/\\/g, "/")).toContain(
      "works/WORK-31/work_WORK-31.log"
    );
  });

  it("올바른 형식으로 로그를 기록한다", async () => {
    await logWork("WORK-31", "BUILDER", "IMPL", "FileManager 구현 시작");

    const [, content] = mockAppendFile.mock.calls[0] as [string, string];
    expect(content).toMatch(
      /^\[2026-03-18T10:25:00\]_BUILDER_IMPL_FileManager 구현 시작\n$/
    );
  });

  it("로그 라인이 개행문자로 끝난다", async () => {
    await logWork("WORK-31", "VERIFIER", "BUILD", "tsc --noEmit 통과");

    const [, content] = mockAppendFile.mock.calls[0] as [string, string];
    expect(content).toMatch(/\n$/);
  });

  it("타임스탬프 형식이 ISO 8601이다 (밀리초 제외)", async () => {
    await logWork("WORK-31", "COMMITTER", "COMMIT", "TASK-01 커밋 완료");

    const [, content] = mockAppendFile.mock.calls[0] as [string, string];
    // [YYYY-MM-DDTHH:mm:ss] 형식 확인 (밀리초 및 Z 없음)
    expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\]/);
    // 밀리초(.000) 미포함 확인
    expect(content).not.toMatch(/\.\d{3}/);
  });

  it("다른 WORK ID로 올바른 경로를 생성한다", async () => {
    await logWork("WORK-05", "BUILDER", "PLAN", "계획 분석");

    const [filePath] = mockAppendFile.mock.calls[0] as [string, string];
    expect(filePath.replace(/\\/g, "/")).toContain(
      "works/WORK-05/work_WORK-05.log"
    );
  });

  it("연속 호출 시 각각 appendFile이 호출된다 (append 동작)", async () => {
    await logWork("WORK-31", "BUILDER", "INIT", "초기화 시작");
    await logWork("WORK-31", "BUILDER", "IMPL", "구현 시작");

    expect(mockAppendFile).toHaveBeenCalledTimes(2);
  });

  it("모든 Stage 값을 수용한다", async () => {
    for (const stage of STAGE_TABLE) {
      await logWork("WORK-31", "BUILDER", stage as Stage, `${stage} 단계`);
    }
    expect(mockAppendFile).toHaveBeenCalledTimes(STAGE_TABLE.length);
  });
});
