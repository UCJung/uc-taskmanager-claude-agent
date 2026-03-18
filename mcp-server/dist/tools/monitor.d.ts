/**
 * Monitor Tools — 상태 조회 도구 5개를 MCP Tool로 등록한다.
 *
 * 등록 도구:
 *   1. list_works       — 전체 WORK 목록 + 진행률
 *   2. get_work_status  — 특정 WORK 상세 상태
 *   3. get_task_result  — TASK result.md 내용 조회
 *   4. get_pipeline_log — Activity Log 조회
 *   5. sync_callbacks   — 미전송/실패 콜백 일괄 재전송
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WorkParser } from "../core/work-parser.js";
/**
 * McpServer에 Monitor Tools 5개를 등록한다.
 *
 * @param server McpServer 인스턴스
 * @param parser 테스트 주입용 WorkParser (생략 시 싱글톤 사용)
 */
export declare function registerMonitorTools(server: McpServer, parser?: WorkParser): void;
//# sourceMappingURL=monitor.d.ts.map