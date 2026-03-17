/**
 * WorkParser 단위 테스트
 * vitest 기반, FileManager를 mock하여 파일시스템 독립 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  WorkParser,
  TASK_FILE_RE,
  TASK_PROGRESS_RE,
  TASK_RESULT_RE,
} from "../work-parser.js";
import { FileManager, type DirEntry } from "../file-manager.js";

// ---------------------------------------------------------------------------
// 헬퍼: FileManager mock 생성
// ---------------------------------------------------------------------------

function createMockFm(overrides: Partial<FileManager> = {}): FileManager {
  const mockFm = {
    resolvePath: vi.fn((p: string) => p),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
    listDir: vi.fn().mockResolvedValue([]),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn(),
    appendFile: vi.fn(),
    ...overrides,
  } as unknown as FileManager;
  return mockFm;
}

// config mock — worksDir 고정
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
// 파일명 정규식 검증
// ---------------------------------------------------------------------------

describe("파일명 정규식", () => {
  describe("TASK_FILE_RE", () => {
    it("TASK-00.md 매칭", () => {
      expect(TASK_FILE_RE.test("TASK-00.md")).toBe(true);
    });
    it("TASK-12.md 매칭", () => {
      expect(TASK_FILE_RE.test("TASK-12.md")).toBe(true);
    });
    it("TASK-00_progress.md 비매칭", () => {
      expect(TASK_FILE_RE.test("TASK-00_progress.md")).toBe(false);
    });
    it("TASK-00_result.md 비매칭", () => {
      expect(TASK_FILE_RE.test("TASK-00_result.md")).toBe(false);
    });
    it("task-00.md 비매칭 (소문자)", () => {
      expect(TASK_FILE_RE.test("task-00.md")).toBe(false);
    });
    it("TASK-00.MD 비매칭 (대문자 확장자)", () => {
      expect(TASK_FILE_RE.test("TASK-00.MD")).toBe(false);
    });
    it("숫자 캡처 그룹 검증", () => {
      const m = "TASK-07.md".match(TASK_FILE_RE);
      expect(m).not.toBeNull();
      expect(m![1]).toBe("07");
    });
  });

  describe("TASK_PROGRESS_RE", () => {
    it("TASK-00_progress.md 매칭", () => {
      expect(TASK_PROGRESS_RE.test("TASK-00_progress.md")).toBe(true);
    });
    it("TASK-03_progress.md 매칭", () => {
      expect(TASK_PROGRESS_RE.test("TASK-03_progress.md")).toBe(true);
    });
    it("TASK-00.md 비매칭", () => {
      expect(TASK_PROGRESS_RE.test("TASK-00.md")).toBe(false);
    });
    it("TASK-00_result.md 비매칭", () => {
      expect(TASK_PROGRESS_RE.test("TASK-00_result.md")).toBe(false);
    });
    it("숫자 캡처 그룹 검증", () => {
      const m = "TASK-02_progress.md".match(TASK_PROGRESS_RE);
      expect(m).not.toBeNull();
      expect(m![1]).toBe("02");
    });
  });

  describe("TASK_RESULT_RE", () => {
    it("TASK-00_result.md 매칭", () => {
      expect(TASK_RESULT_RE.test("TASK-00_result.md")).toBe(true);
    });
    it("TASK-05_result.md 매칭", () => {
      expect(TASK_RESULT_RE.test("TASK-05_result.md")).toBe(true);
    });
    it("TASK-00.md 비매칭", () => {
      expect(TASK_RESULT_RE.test("TASK-00.md")).toBe(false);
    });
    it("TASK-00_progress.md 비매칭", () => {
      expect(TASK_RESULT_RE.test("TASK-00_progress.md")).toBe(false);
    });
    it("숫자 캡처 그룹 검증", () => {
      const m = "TASK-04_result.md".match(TASK_RESULT_RE);
      expect(m).not.toBeNull();
      expect(m![1]).toBe("04");
    });
  });
});

// ---------------------------------------------------------------------------
// PLAN.md 파싱
// ---------------------------------------------------------------------------

describe("WorkParser._parsePlanContent", () => {
  const parser = new WorkParser(createMockFm());

  const samplePlan = `# WORK-31: MCP Server Phase 1 — Core MCP Server 구현

> Created: 2026-03-18
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: TypeScript, Bun/Node.js, @modelcontextprotocol/sdk, zod, vitest
> Language: ko
> Status: PLANNED

## Goal

설계문서 Phase 1 로드맵에 따라 MCP 서버 뼈대를 구현한다.

## Tasks

### TASK-00: 프로젝트 초기화 및 서버 뼈대
- **Depends on**: (none)

### TASK-01: FileManager + WorkParser 코어 모듈
- **Depends on**: TASK-00
`;

  it("제목을 올바르게 파싱한다", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.title).toBe("WORK-31: MCP Server Phase 1 — Core MCP Server 구현");
  });

  it("workId를 반환한다", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.workId).toBe("WORK-31");
  });

  it("Created 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.created).toBe("2026-03-18");
  });

  it("Execution-Mode 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.executionMode).toBe("full");
  });

  it("Project 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.project).toBe("uc-taskmanager");
  });

  it("Tech Stack 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.techStack).toContain("TypeScript");
  });

  it("Language 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.language).toBe("ko");
  });

  it("Status 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.status).toBe("PLANNED");
  });

  it("요구사항 필드 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.meta.requirements).toBe("N/A");
  });

  it("Goal 섹션 파싱", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.goal).toContain("Phase 1");
  });

  it("rawContent를 그대로 보존한다", () => {
    const plan = parser._parsePlanContent("WORK-31", samplePlan);
    expect(plan.rawContent).toBe(samplePlan);
  });
});

// ---------------------------------------------------------------------------
// extractTasksFromPlan
// ---------------------------------------------------------------------------

describe("WorkParser.extractTasksFromPlan", () => {
  const parser = new WorkParser(createMockFm());

  const planWithTasks = `# WORK-31: Test

## Tasks

### TASK-00: 프로젝트 초기화
- detail

### TASK-01: FileManager 구현
- detail

### TASK-02: Monitor Tools
- detail
`;

  it("TASK 목록을 올바르게 추출한다", () => {
    const tasks = parser.extractTasksFromPlan(planWithTasks);
    expect(tasks).toHaveLength(3);
  });

  it("taskId 형식이 TASK-NN이다", () => {
    const tasks = parser.extractTasksFromPlan(planWithTasks);
    expect(tasks[0].taskId).toBe("TASK-00");
    expect(tasks[1].taskId).toBe("TASK-01");
    expect(tasks[2].taskId).toBe("TASK-02");
  });

  it("제목을 올바르게 추출한다", () => {
    const tasks = parser.extractTasksFromPlan(planWithTasks);
    expect(tasks[0].title).toBe("프로젝트 초기화");
    expect(tasks[1].title).toBe("FileManager 구현");
  });

  it("num 필드가 올바르다", () => {
    const tasks = parser.extractTasksFromPlan(planWithTasks);
    expect(tasks[0].num).toBe(0);
    expect(tasks[1].num).toBe(1);
  });

  it("중복 TASK가 있어도 한 번만 반환한다", () => {
    const planWithDup = `### TASK-00: 첫 번째\n### TASK-00: 중복\n`;
    const tasks = parser.extractTasksFromPlan(planWithDup);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("첫 번째");
  });

  it("TASK가 없으면 빈 배열을 반환한다", () => {
    const tasks = parser.extractTasksFromPlan("# No tasks here");
    expect(tasks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getWorkStatus
// ---------------------------------------------------------------------------

describe("WorkParser.getWorkStatus", () => {
  it("TASK 파일과 result 파일 수를 올바르게 계산한다", async () => {
    const mockFm = createMockFm({
      listDir: vi.fn().mockResolvedValue([
        "PLAN.md",
        "TASK-00.md",
        "TASK-01.md",
        "TASK-02.md",
        "TASK-00_result.md",
        "TASK-01_result.md",
        "TASK-00_progress.md",
      ]),
      readFile: vi.fn().mockRejectedValue(new Error("not found")),
    });

    const parser = new WorkParser(mockFm);
    const status = await parser.getWorkStatus("WORK-31");

    expect(status.workId).toBe("WORK-31");
    expect(status.totalTasks).toBe(3);
    expect(status.completedTasks).toBe(2);
    expect(status.progress).toBe("2/3");
  });

  it("TASK가 없으면 0/0을 반환한다", async () => {
    const mockFm = createMockFm({
      listDir: vi.fn().mockResolvedValue(["PLAN.md", "PROGRESS.md"]),
      readFile: vi.fn().mockRejectedValue(new Error("not found")),
    });

    const parser = new WorkParser(mockFm);
    const status = await parser.getWorkStatus("WORK-31");

    expect(status.totalTasks).toBe(0);
    expect(status.completedTasks).toBe(0);
    expect(status.progress).toBe("0/0");
  });

  it("PROGRESS.md에 approved: true가 있으면 approved=true", async () => {
    const mockFm = createMockFm({
      listDir: vi.fn().mockResolvedValue(["TASK-00.md"]),
      readFile: vi.fn().mockResolvedValue("# Progress\napproved: true"),
    });

    const parser = new WorkParser(mockFm);
    const status = await parser.getWorkStatus("WORK-31");

    expect(status.approved).toBe(true);
  });

  it("PROGRESS.md가 없으면 approved=false", async () => {
    const mockFm = createMockFm({
      listDir: vi.fn().mockResolvedValue(["TASK-00.md"]),
      readFile: vi.fn().mockRejectedValue(new Error("not found")),
    });

    const parser = new WorkParser(mockFm);
    const status = await parser.getWorkStatus("WORK-31");

    expect(status.approved).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// listWorks
// ---------------------------------------------------------------------------

describe("WorkParser.listWorks", () => {
  const workListMd = `# WORK-LIST

| WORK | 제목 | 상태 | 생성일 | 완료일 |
|------|------|------|--------|--------|
| WORK-01 | 첫 번째 작업 | COMPLETED | 2026-03-01 | 2026-03-01 |
| WORK-02 | 두 번째 작업 | IN_PROGRESS | 2026-03-18 | |
`;

  it("WORK 목록을 올바르게 파싱한다", async () => {
    const mockFm = createMockFm({
      readFile: vi.fn().mockImplementation(async (filePath: string) => {
        if (filePath.endsWith("WORK-LIST.md")) return workListMd;
        throw new Error("not found");
      }),
      listDir: vi.fn().mockResolvedValue([]),
    });

    const parser = new WorkParser(mockFm);
    const works = await parser.listWorks();

    expect(works).toHaveLength(2);
    expect(works[0].id).toBe("WORK-01");
    expect(works[0].title).toBe("첫 번째 작업");
    expect(works[0].status).toBe("COMPLETED");
    expect(works[1].id).toBe("WORK-02");
    expect(works[1].status).toBe("IN_PROGRESS");
  });

  it("WORK-LIST.md가 없으면 빈 배열을 반환한다", async () => {
    const mockFm = createMockFm({
      readFile: vi.fn().mockRejectedValue(new Error("not found")),
      listDir: vi.fn().mockResolvedValue([]),
    });

    const parser = new WorkParser(mockFm);
    const works = await parser.listWorks();

    expect(works).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getNextWorkId
// ---------------------------------------------------------------------------

describe("WorkParser.getNextWorkId", () => {
  it("기존 WORK 중 최대 번호 + 1을 반환한다", async () => {
    const mockFm = createMockFm({
      readDir: vi.fn().mockResolvedValue([
        { name: "WORK-01", isDirectory: true, isFile: false },
        { name: "WORK-15", isDirectory: true, isFile: false },
        { name: "WORK-LIST.md", isDirectory: false, isFile: true },
      ] as DirEntry[]),
    });

    const parser = new WorkParser(mockFm);
    const nextId = await parser.getNextWorkId();

    expect(nextId).toBe("WORK-16");
  });

  it("WORK 디렉토리가 없으면 WORK-01을 반환한다", async () => {
    const mockFm = createMockFm({
      readDir: vi.fn().mockResolvedValue([] as DirEntry[]),
    });

    const parser = new WorkParser(mockFm);
    const nextId = await parser.getNextWorkId();

    expect(nextId).toBe("WORK-01");
  });
});

// ---------------------------------------------------------------------------
// parseActivityLog
// ---------------------------------------------------------------------------

describe("WorkParser.parseActivityLog", () => {
  const sampleLog = `[2026-03-18T10:25:00]_BUILDER_IMPL_FileManager 구현 시작
[2026-03-18T10:28:00]_BUILDER_BUILD_tsc --noEmit 통과
[2026-03-18T10:30:00]_COMMITTER_COMMIT_TASK-01 커밋 완료
`;

  it("로그 엔트리를 올바르게 파싱한다", async () => {
    const mockFm = createMockFm({
      readFile: vi.fn().mockResolvedValue(sampleLog),
    });

    const parser = new WorkParser(mockFm);
    const entries = await parser.parseActivityLog("WORK-31");

    expect(entries).toHaveLength(3);
    expect(entries[0].timestamp).toBe("2026-03-18T10:25:00");
    expect(entries[0].agent).toBe("BUILDER");
    expect(entries[0].stage).toBe("IMPL");
    expect(entries[0].description).toBe("FileManager 구현 시작");
  });

  it("lastN 파라미터로 마지막 N개만 반환한다", async () => {
    const mockFm = createMockFm({
      readFile: vi.fn().mockResolvedValue(sampleLog),
    });

    const parser = new WorkParser(mockFm);
    const entries = await parser.parseActivityLog("WORK-31", 2);

    expect(entries).toHaveLength(2);
    expect(entries[0].agent).toBe("BUILDER");
    expect(entries[0].stage).toBe("BUILD");
    expect(entries[1].agent).toBe("COMMITTER");
  });

  it("로그 파일이 없으면 빈 배열을 반환한다", async () => {
    const mockFm = createMockFm({
      readFile: vi.fn().mockRejectedValue(new Error("not found")),
    });

    const parser = new WorkParser(mockFm);
    const entries = await parser.parseActivityLog("WORK-31");

    expect(entries).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// extractExecutionMode
// ---------------------------------------------------------------------------

describe("WorkParser.extractExecutionMode", () => {
  const parser = new WorkParser(createMockFm());

  it("full 모드를 올바르게 반환한다", () => {
    const plan = parser._parsePlanContent("WORK-31", "> Execution-Mode: full");
    expect(parser.extractExecutionMode(plan)).toBe("full");
  });

  it("pipeline 모드를 올바르게 반환한다", () => {
    const plan = parser._parsePlanContent("WORK-31", "> Execution-Mode: pipeline");
    expect(parser.extractExecutionMode(plan)).toBe("pipeline");
  });

  it("direct 모드를 올바르게 반환한다", () => {
    const plan = parser._parsePlanContent("WORK-31", "> Execution-Mode: direct");
    expect(parser.extractExecutionMode(plan)).toBe("direct");
  });

  it("알 수 없는 모드는 full로 기본값 반환", () => {
    const plan = parser._parsePlanContent("WORK-31", "> Execution-Mode: unknown");
    expect(parser.extractExecutionMode(plan)).toBe("full");
  });
});
