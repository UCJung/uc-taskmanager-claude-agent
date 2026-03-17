/**
 * 설정 관리 모듈
 * projectRoot, worksDir, agentsDir 등 경로 해석을 담당한다.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

/** MCP 서버 설정 인터페이스 */
export interface McpServerConfig {
  /** 프로젝트 루트 디렉토리 절대 경로 */
  projectRoot: string;
  /** works/ 디렉토리 절대 경로 */
  worksDir: string;
  /** 로컬 agents/ 디렉토리 절대 경로 */
  agentsDir: string;
  /** 전역 에이전트 디렉토리 (~/.claude/agents/) */
  globalAgentsDir: string;
  /** .agent/ 설정 디렉토리 절대 경로 */
  agentConfigDir: string;
  /** MCP 서버 이름 */
  serverName: string;
  /** MCP 서버 버전 */
  serverVersion: string;
}

/**
 * 현재 파일 위치 기준으로 프로젝트 루트를 계산한다.
 * mcp-server/src/core/config.ts → 3단계 위가 프로젝트 루트
 */
function resolveProjectRoot(): string {
  // 환경변수 MCP_PROJECT_ROOT가 지정된 경우 우선 사용
  if (process.env.MCP_PROJECT_ROOT) {
    return path.resolve(process.env.MCP_PROJECT_ROOT);
  }

  // __dirname 은 ESM에서 사용 불가 — import.meta.url 기반 계산
  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  // dist/core/config.js → dirname=dist/core → ..=dist → ..=mcp-server → ..=project-root
  return path.resolve(path.dirname(currentFilePath), "..", "..", "..");
}

/**
 * 전역 에이전트 디렉토리 경로를 반환한다.
 * 우선순위: MCP_GLOBAL_AGENTS_DIR 환경변수 > 홈 디렉토리 기반 기본값
 */
function resolveGlobalAgentsDir(): string {
  if (process.env.MCP_GLOBAL_AGENTS_DIR) {
    return path.resolve(process.env.MCP_GLOBAL_AGENTS_DIR);
  }
  const homeDir = process.env.HOME || process.env.USERPROFILE || "~";
  return path.join(homeDir, ".claude", "agents");
}

/**
 * McpServerConfig 인스턴스를 생성하여 반환한다.
 */
export function createConfig(): McpServerConfig {
  const projectRoot = resolveProjectRoot();

  return {
    projectRoot,
    worksDir: path.join(projectRoot, "works"),
    agentsDir: path.join(projectRoot, "agents"),
    globalAgentsDir: resolveGlobalAgentsDir(),
    agentConfigDir: path.join(projectRoot, ".agent"),
    serverName: "uc-taskmanager",
    serverVersion: "1.1.0",
  };
}

/** 싱글톤 설정 인스턴스 */
let _config: McpServerConfig | null = null;

/**
 * 전역 설정을 반환한다. 최초 호출 시 생성된다.
 */
export function getConfig(): McpServerConfig {
  if (!_config) {
    _config = createConfig();
  }
  return _config;
}

/**
 * 테스트 용도로 설정을 덮어쓴다.
 */
export function setConfig(config: McpServerConfig): void {
  _config = config;
}
