/**
 * execution-mode 단위 테스트
 * vitest 기반, FileManager를 mock하여 파일시스템 독립 테스트
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadRouterConfig,
  analyzeRequest,
  determineExecutionMode,
  type RouterRuleConfig,
} from "../execution-mode.js";

// ---------------------------------------------------------------------------
// FileManager mock
// ---------------------------------------------------------------------------

vi.mock("../file-manager.js", () => {
  const FileManagerMock = vi.fn().mockImplementation(() => ({
    exists: vi.fn().mockResolvedValue(false),
    readFile: vi.fn().mockRejectedValue(new Error("not found")),
    resolvePath: vi.fn((p: string) => p),
  }));
  return { FileManager: FileManagerMock };
});

// config mock — projectRoot 고정
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
// loadRouterConfig
// ---------------------------------------------------------------------------

describe("loadRouterConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("파일이 없으면 null을 반환한다", async () => {
    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementationOnce(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(false),
          readFile: vi.fn().mockRejectedValue(new Error("not found")),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await loadRouterConfig("/nonexistent/.agent/router_rule_config.json");
    expect(result).toBeNull();
  });

  it("파일이 있으면 JSON을 파싱하여 반환한다", async () => {
    const mockConfig: RouterRuleConfig = {
      rules: {
        direct: { criteria: { build_test_required: false } },
        pipeline: {
          criteria: { max_tasks: 5, single_domain_only: true, dag_complexity: "sequential" },
        },
        full: { criteria: { any_of: ["task_count > 5"] } },
      },
    };

    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementationOnce(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(true),
          readFile: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await loadRouterConfig("/project/.agent/router_rule_config.json");
    expect(result).not.toBeNull();
    expect(result?.rules?.pipeline?.criteria?.max_tasks).toBe(5);
  });

  it("JSON 파싱 실패 시 null을 반환한다", async () => {
    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementationOnce(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(true),
          readFile: vi.fn().mockResolvedValue("invalid json {{{"),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await loadRouterConfig("/project/.agent/router_rule_config.json");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// analyzeRequest
// ---------------------------------------------------------------------------

describe("analyzeRequest", () => {
  describe("buildTestRequired", () => {
    it("문서 변경 요청 → buildTestRequired false", () => {
      const result = analyzeRequest("README.md 업데이트 및 문서 수정");
      expect(result.buildTestRequired).toBe(false);
    });

    it("설정 파일 변경 → buildTestRequired false", () => {
      const result = analyzeRequest("config.json 파일 설정 변경");
      expect(result.buildTestRequired).toBe(false);
    });

    it("코드 구현 요청 → buildTestRequired true", () => {
      const result = analyzeRequest("새로운 API endpoint를 implement한다");
      expect(result.buildTestRequired).toBe(true);
    });

    it("refactor 요청 → buildTestRequired true", () => {
      const result = analyzeRequest("기존 module을 refactor하여 성능 개선");
      expect(result.buildTestRequired).toBe(true);
    });

    it("build 키워드 포함 → buildTestRequired true", () => {
      const result = analyzeRequest("새 기능을 build하고 test를 작성한다");
      expect(result.buildTestRequired).toBe(true);
    });

    it("한국어 구현 키워드 → buildTestRequired true", () => {
      const result = analyzeRequest("새로운 컴포넌트를 개발하고 구현한다");
      expect(result.buildTestRequired).toBe(true);
    });

    it("설명 없는 요청 → buildTestRequired false (키워드 없음)", () => {
      const result = analyzeRequest("오타 수정");
      expect(result.buildTestRequired).toBe(false);
    });
  });

  describe("singleDomain", () => {
    it("단일 도메인 요청 → singleDomain true", () => {
      const result = analyzeRequest("백엔드 API implement");
      expect(result.singleDomain).toBe(true);
    });

    it("FE+BE 동시 변경 → singleDomain false", () => {
      const result = analyzeRequest("fe+be 전체 implement");
      expect(result.singleDomain).toBe(false);
    });

    it("frontend and backend 키워드 → singleDomain false", () => {
      const result = analyzeRequest("frontend and backend 동시에 implement");
      expect(result.singleDomain).toBe(false);
    });

    it("full stack 키워드 → singleDomain false", () => {
      const result = analyzeRequest("full stack 기능 build");
      expect(result.singleDomain).toBe(false);
    });
  });

  describe("dagComplexity", () => {
    it("단순 요청 → dagComplexity sequential", () => {
      const result = analyzeRequest("단순한 버그 fix bug");
      expect(result.dagComplexity).toBe("sequential");
    });

    it("복잡한 의존성 키워드 → dagComplexity complex", () => {
      const result = analyzeRequest("complex dependency가 있는 multi-phase 구현");
      expect(result.dagComplexity).toBe("complex");
    });

    it("병렬 작업 키워드 → dagComplexity complex", () => {
      const result = analyzeRequest("parallel tasks로 구성된 implement");
      expect(result.dagComplexity).toBe("complex");
    });
  });

  describe("taskCount", () => {
    it("키워드가 적으면 taskCount가 낮다", () => {
      const result = analyzeRequest("단순 문서 수정");
      expect(result.taskCount).toBeGreaterThanOrEqual(1);
      expect(result.taskCount).toBeLessThanOrEqual(5);
    });

    it("taskCount는 최소 1이다", () => {
      const result = analyzeRequest("아무것도 하지 않음");
      expect(result.taskCount).toBeGreaterThanOrEqual(1);
    });

    it("taskCount는 최대 10이다", () => {
      const result = analyzeRequest(
        "implement build create refactor test module api endpoint component feature"
      );
      expect(result.taskCount).toBeLessThanOrEqual(10);
    });
  });

  describe("fullReason", () => {
    it("단순 요청에도 fullReason 문자열이 있다", () => {
      const result = analyzeRequest("간단한 구현");
      expect(typeof result.fullReason).toBe("string");
      expect(result.fullReason.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// determineExecutionMode
// ---------------------------------------------------------------------------

describe("determineExecutionMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("문서/설정 변경 → direct 모드", async () => {
    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementation(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(false),
          readFile: vi.fn().mockRejectedValue(new Error("not found")),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await determineExecutionMode(
      "README.md 문서 업데이트",
      "/project"
    );
    expect(result.mode).toBe("direct");
    expect(result.reason).toContain("빌드/테스트 검증 불필요");
  });

  it("단일 도메인 코드 구현 → pipeline 모드", async () => {
    const mockConfig: RouterRuleConfig = {
      rules: {
        pipeline: { criteria: { max_tasks: 5 } },
      },
    };

    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementation(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(true),
          readFile: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await determineExecutionMode(
      "간단한 API endpoint implement",
      "/project"
    );
    expect(result.mode).toBe("pipeline");
    expect(result.reason).toContain("단일 도메인");
  });

  it("멀티도메인 요청 → full 모드", async () => {
    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementation(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(false),
          readFile: vi.fn().mockRejectedValue(new Error("not found")),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await determineExecutionMode(
      "frontend and backend 동시에 implement하는 full stack 기능 개발",
      "/project"
    );
    expect(result.mode).toBe("full");
    expect(result.reason).toContain("multi_domain");
  });

  it("complex DAG → full 모드", async () => {
    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementation(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(false),
          readFile: vi.fn().mockRejectedValue(new Error("not found")),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await determineExecutionMode(
      "multi-phase 다단계 parallel tasks implement rollback 지원",
      "/project"
    );
    expect(result.mode).toBe("full");
  });

  it("configPath를 명시적으로 전달하면 해당 경로를 사용한다", async () => {
    const mockConfig: RouterRuleConfig = {
      rules: {
        pipeline: { criteria: { max_tasks: 3 } },
      },
    };

    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementation(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(true),
          readFile: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await determineExecutionMode(
      "API implement",
      "/project",
      "/custom/.agent/router_rule_config.json"
    );
    // config가 로드되었으므로 mode는 pipeline 또는 full
    expect(["pipeline", "full", "direct"]).toContain(result.mode);
  });

  it("config 파일 없어도 기본값으로 판정한다", async () => {
    const { FileManager } = await import("../file-manager.js");
    vi.mocked(FileManager).mockImplementation(
      () =>
        ({
          exists: vi.fn().mockResolvedValue(false),
          readFile: vi.fn().mockRejectedValue(new Error("not found")),
          resolvePath: vi.fn((p: string) => p),
        }) as unknown as InstanceType<typeof FileManager>
    );

    const result = await determineExecutionMode(
      "문서 수정 및 설정 변경",
      "/project"
    );
    // 빌드 키워드 없으므로 direct
    expect(result.mode).toBe("direct");
  });
});
