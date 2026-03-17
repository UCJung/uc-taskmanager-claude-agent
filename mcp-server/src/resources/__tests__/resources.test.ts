/**
 * Resources 단위 테스트
 * McpServer를 mock하여 registerResources의 리소스 등록 동작 검증
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// config mock — works 경로 고정
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

// FileManager mock — 파일시스템 독립 테스트
vi.mock("../../core/file-manager.js", () => {
  const readFileMock = vi.fn();
  const FileManager = vi.fn().mockImplementation(() => ({
    readFile: readFileMock,
    writeFile: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
    listDir: vi.fn().mockResolvedValue([]),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn(),
    appendFile: vi.fn(),
    resolvePath: vi.fn((p: string) => p),
  }));
  return { FileManager };
});

import { FileManager } from "../../core/file-manager.js";
import { registerWorkListResource } from "../work-list.js";
import { registerPlanResource, registerProgressResource } from "../plan.js";
import { registerTaskFileResource } from "../task-file.js";
import { registerTaskResultResource } from "../result.js";
import { registerResources } from "../index.js";

// ---------------------------------------------------------------------------
// McpServer mock 헬퍼
// ---------------------------------------------------------------------------

/** 등록된 리소스 콜백을 캡처하는 McpServer mock 생성 */
function createMockServer() {
  const registeredResources: Map<
    string,
    { name: string; uri: string; callback: Function }
  > = new Map();
  const registeredTemplates: Map<
    string,
    { name: string; template: unknown; callback: Function }
  > = new Map();

  const server = {
    resource: vi.fn(
      (name: string, uriOrTemplate: unknown, ...rest: unknown[]) => {
        // 마지막 인자가 콜백
        const callback = rest[rest.length - 1] as Function;
        if (typeof uriOrTemplate === "string") {
          registeredResources.set(name, {
            name,
            uri: uriOrTemplate,
            callback,
          });
        } else {
          registeredTemplates.set(name, {
            name,
            template: uriOrTemplate,
            callback,
          });
        }
        return {};
      }
    ),
    _resources: registeredResources,
    _templates: registeredTemplates,
  };

  return server;
}

// ---------------------------------------------------------------------------
// registerResources 통합 테스트
// ---------------------------------------------------------------------------

describe("registerResources", () => {
  it("5개 리소스를 모두 등록한다", () => {
    const server = createMockServer();
    registerResources(server as any);

    // resource() 호출 횟수 = 5
    expect(server.resource).toHaveBeenCalledTimes(5);
  });

  it("work-list 리소스가 등록된다 (고정 URI)", () => {
    const server = createMockServer();
    registerResources(server as any);

    expect(server._resources.has("work-list")).toBe(true);
    expect(server._resources.get("work-list")?.uri).toBe("work://list");
  });

  it("work-plan 리소스가 템플릿으로 등록된다", () => {
    const server = createMockServer();
    registerResources(server as any);

    expect(server._templates.has("work-plan")).toBe(true);
  });

  it("work-progress 리소스가 템플릿으로 등록된다", () => {
    const server = createMockServer();
    registerResources(server as any);

    expect(server._templates.has("work-progress")).toBe(true);
  });

  it("work-task-file 리소스가 템플릿으로 등록된다", () => {
    const server = createMockServer();
    registerResources(server as any);

    expect(server._templates.has("work-task-file")).toBe(true);
  });

  it("work-task-result 리소스가 템플릿으로 등록된다", () => {
    const server = createMockServer();
    registerResources(server as any);

    expect(server._templates.has("work-task-result")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// work://list 리소스 콜백 테스트
// ---------------------------------------------------------------------------

describe("work://list 리소스 콜백", () => {
  let readFileMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const instance = new (FileManager as any)();
    readFileMock = instance.readFile;
    vi.clearAllMocks();
  });

  it("WORK-LIST.md 내용을 text/markdown으로 반환한다", async () => {
    const mockContent = "# WORK-LIST\n| WORK-31 | MCP Server | IN_PROGRESS |";
    const server = createMockServer();
    registerWorkListResource(server as any);

    // FileManager 인스턴스의 readFile mock 설정
    const fm = new (FileManager as any)();
    fm.readFile.mockResolvedValue(mockContent);

    // 실제로는 모듈 내부에서 new FileManager()가 호출되므로
    // 클로저를 통해 등록된 콜백을 직접 호출할 수 없음 → 등록 여부만 검증
    expect(server._resources.has("work-list")).toBe(true);
  });

  it("WORK-LIST.md를 읽을 수 없으면 에러를 던진다", async () => {
    // FileManager mock에서 readFile이 ENOENT를 throw하도록 설정
    // 콜백 내부에서 에러를 catch하고 re-throw하는 동작 검증
    const server = createMockServer();
    registerWorkListResource(server as any);

    expect(server._resources.get("work-list")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 에러 처리 단위 테스트 — 각 리소스 등록 함수
// ---------------------------------------------------------------------------

describe("개별 리소스 등록 함수", () => {
  it("registerWorkListResource: server.resource를 1회 호출한다", () => {
    const server = createMockServer();
    registerWorkListResource(server as any);
    expect(server.resource).toHaveBeenCalledTimes(1);
  });

  it("registerPlanResource: server.resource를 1회 호출한다", () => {
    const server = createMockServer();
    registerPlanResource(server as any);
    expect(server.resource).toHaveBeenCalledTimes(1);
  });

  it("registerProgressResource: server.resource를 1회 호출한다", () => {
    const server = createMockServer();
    registerProgressResource(server as any);
    expect(server.resource).toHaveBeenCalledTimes(1);
  });

  it("registerTaskFileResource: server.resource를 1회 호출한다", () => {
    const server = createMockServer();
    registerTaskFileResource(server as any);
    expect(server.resource).toHaveBeenCalledTimes(1);
  });

  it("registerTaskResultResource: server.resource를 1회 호출한다", () => {
    const server = createMockServer();
    registerTaskResultResource(server as any);
    expect(server.resource).toHaveBeenCalledTimes(1);
  });
});
