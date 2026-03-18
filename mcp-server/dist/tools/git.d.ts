import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WorkParser } from "../core/work-parser.js";
/**
 * McpServer에 Git Tools 2개를 등록한다.
 *
 * @param server McpServer 인스턴스
 * @param parser 테스트 주입용 WorkParser (생략 시 싱글톤 사용)
 */
export declare function registerGitTools(server: McpServer, parser?: WorkParser): void;
//# sourceMappingURL=git.d.ts.map