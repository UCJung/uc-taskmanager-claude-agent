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
 * McpServerConfig 인스턴스를 생성하여 반환한다.
 */
export declare function createConfig(): McpServerConfig;
/**
 * 전역 설정을 반환한다. 최초 호출 시 생성된다.
 */
export declare function getConfig(): McpServerConfig;
/**
 * 테스트 용도로 설정을 덮어쓴다.
 */
export declare function setConfig(config: McpServerConfig): void;
//# sourceMappingURL=config.d.ts.map